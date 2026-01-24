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

serve(async (req: Request) => {
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
        return new Response("Missing signature", { status: 400 })
    }

    let event;
    try {
        const body = await req.text()
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Webhook signature verification failed: ${errorMessage}`)
        return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
    }

    console.log(`🔔 Received event: ${event.type}`)

    if (event.type === "checkout.session.completed") {
        const session = event.data.object
        const organizationId = session.metadata?.organization_id
        const planTier = session.metadata?.plan_tier
        const purchaseType = session.metadata?.purchase_type
        const customerEmail = session.customer_email || session.customer_details?.email

        if (organizationId && planTier) {
            console.log(`✅ Updating organization ${organizationId} to tier ${planTier}`)

            const { error } = await supabase
                .from("organizations")
                .update({
                    subscription_tier: planTier,
                    subscription_status: "active",
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
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
        } else if (organizationId && purchaseType) {
            console.log(`🛍️ Processing one-off purchase: ${purchaseType} for organization ${organizationId}`)

            // 1. Record the purchase
            const { error: purchaseErr } = await supabase
                .from('standalone_purchases')
                .insert({
                    organization_id: organizationId,
                    purchase_type: purchaseType,
                    status: 'completed',
                    stripe_session_id: session.id,
                    stripe_customer_id: session.customer as string,
                    amount_total: session.amount_total,
                    currency: session.currency
                })

            if (purchaseErr) {
                console.error(`❌ Error recording purchase: ${purchaseErr.message}`)
                // Continue anyway as we want to give credits if possible
            }

            // 2. Grant credits via RPC
            const { error: rpcErr } = await supabase.rpc('handle_purchase_success', {
                org_id: organizationId,
                p_type: purchaseType
            })

            if (rpcErr) {
                console.error(`❌ Error granting credits: ${rpcErr.message}`)
                return new Response("Credit grant error", { status: 500 })
            }

            // 3. Send email
            if (customerEmail) {
                const offerNames: Record<string, string> = {
                    'gap_analysis': 'Single Gap Analysis',
                    'sponsor_audit': 'Sponsor License Audit'
                }
                await sendPaymentEmail(
                    customerEmail,
                    offerNames[purchaseType] || 'Compliance Service',
                    (session.amount_total || 0) / 100
                )
            }
        }
    }

    // Map Stripe Price IDs back to internal Tier Names
    // These must match the IDs used in create-checkout-session
    const priceToTierMap: Record<string, string> = {
        "price_1Sgy5ADNJV8utFweXurMAsdp": "pro",
        "price_1Sgy8qDNJV8utFwePL5nmeFH": "enterprise"
    }

    // Handle subscription updates (e.g. upgrades/downgrades via Portal)
    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object
        console.log(`📝 Subscription updated: ${subscription.id}`)

        const priceId = subscription.items.data[0]?.price.id
        const newTier = priceToTierMap[priceId]

        // We need to find the organization associated with this customer
        // Since metadata might not be present on the subscription object itself if it wasn't copied over,
        // we'll look it up by stripe_subscription_id

        if (newTier) {
            const { error } = await supabase
                .from("organizations")
                .update({
                    subscription_tier: newTier,
                    subscription_status: subscription.status, // active, past_due, etc.
                    updated_at: new Date().toISOString()
                })
                .eq("stripe_subscription_id", subscription.id)

            if (error) {
                console.error(`❌ Error updating subscription tier for ${subscription.id}:`, error)
            } else {
                console.log(`✅ Organization updated to tier ${newTier} via webhook`)
            }
        }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object
        console.log(`❌ Subscription cancelled: ${subscription.id}`)

        const { error } = await supabase
            .from("organizations")
            .update({
                subscription_tier: "free",
                subscription_status: "canceled",
                updated_at: new Date().toISOString()
            })
            .eq("stripe_subscription_id", subscription.id)

        if (error) {
            console.error(`❌ Error downgrading organization for ${subscription.id}:`, error)
        } else {
            console.log(`✅ Organization downgraded to free tier`)
        }
    }

    // Handle invoice.paid - store invoice data for billing history
    if (event.type === "invoice.paid") {
        const invoice = event.data.object
        console.log(`💵 Invoice paid: ${invoice.id}`)

        // Find the organization by customer ID
        const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("stripe_customer_id", invoice.customer)
            .single()

        if (org) {
            const { error } = await supabase
                .from("billing_invoices")
                .upsert({
                    organization_id: org.id,
                    stripe_invoice_id: invoice.id,
                    invoice_number: invoice.number,
                    amount_paid: invoice.amount_paid,
                    currency: invoice.currency,
                    status: invoice.status,
                    invoice_pdf_url: invoice.invoice_pdf,
                    hosted_invoice_url: invoice.hosted_invoice_url,
                    period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
                    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null
                }, { onConflict: 'stripe_invoice_id' })

            if (error) {
                console.error(`❌ Error storing invoice: ${error.message}`)
            } else {
                console.log(`✅ Invoice stored for organization ${org.id}`)
            }
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    })
})
