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
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    })
})
