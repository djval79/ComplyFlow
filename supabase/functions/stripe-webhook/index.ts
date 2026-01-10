import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.25.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""

// Helper to send email via Edge Function
async function sendPaymentEmail(email: string, planName: string, amount: number) {
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
                type: 'payment_success',
                to: email,
                data: {
                    planName,
                    amount,
                    invoiceId: 'INV-' + Date.now()
                }
            })
        })
        const result = await response.json()
        console.log('📧 Payment confirmation email sent:', result)
    } catch (error) {
        console.error('❌ Failed to send email:', error)
    }
}

serve(async (req) => {
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
        return new Response("Missing signature", { status: 400 })
    }

    let event;
    try {
        const body = await req.text()
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log(`🔔 Received event: ${event.type}`)

    if (event.type === "checkout.session.completed") {
        const session = event.data.object
        const organizationId = session.metadata?.organization_id
        const planTier = session.metadata?.plan_tier
        const customerEmail = session.customer_email || session.customer_details?.email

        if (organizationId && planTier) {
            console.log(`✅ Updating organization ${organizationId} to tier ${planTier}`)

            const { error } = await supabase
                .from("organizations")
                .update({
                    subscription_tier: planTier,
                    subscription_status: "active",
                    updated_at: new Date().toISOString()
                })
                .eq("id", organizationId)

            if (error) {
                console.error(`❌ Error updating organization: ${error.message}`)
                return new Response("Database error", { status: 500 })
            }

            // Send payment confirmation email
            if (customerEmail) {
                const planNames: Record<string, string> = {
                    'pro': 'Professional',
                    'enterprise': 'Enterprise'
                }
                const planAmounts: Record<string, number> = {
                    'pro': 49,
                    'enterprise': 299
                }
                await sendPaymentEmail(
                    customerEmail,
                    planNames[planTier] || 'Professional',
                    planAmounts[planTier] || 49
                )
            }
        }
    }

    // Handle subscription updates
    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object
        console.log(`📝 Subscription updated: ${subscription.id}`)
        // Could update subscription status in database
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object
        console.log(`❌ Subscription cancelled: ${subscription.id}`)
        // Could update subscription status to 'cancelled' in database
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    })
})
