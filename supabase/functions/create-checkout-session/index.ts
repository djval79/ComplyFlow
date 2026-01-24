import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.25.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Note: Deno and https imports are standard for Supabase Edge Functions. 
// IDE errors regarding 'Deno' or modules are environment-related and can be ignored.

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const { tierId, organizationId, organizationName, userEmail } = await req.json()

        // Map internal tier IDs to your specific Stripe Price IDs
        // You would need to create these in your Stripe Dashboard
        const priceMap: Record<string, string> = {
            "tier_pro": "price_1Sgy5ADNJV8utFweXurMAsdp", // Professional (£49)
            "tier_enterprise": "price_1Sgy8qDNJV8utFwePL5nmeFH", // Corporate (Custom)
            "offer_gap_analysis": "price_1SgyBADNJV8utFweG8F1W4Gq", // Single Analysis (£29)
            "offer_sponsor_audit": "price_1SgyE6DNJV8utFwe2vF7G9Yp" // Sponsor Audit (£149)
        }

        const priceId = priceMap[tierId]

        if (!priceId) {
            throw new Error(`Invalid product ID: ${tierId}`)
        }

        const isSubscription = tierId.startsWith('tier_')
        const metadata: any = {
            organization_id: organizationId,
        }

        if (isSubscription) {
            metadata.plan_tier = tierId.replace("tier_", "")
        } else {
            metadata.purchase_type = tierId.replace("offer_", "")
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: isSubscription ? "subscription" : "payment",
            customer_email: userEmail,
            metadata,
            success_url: `${req.headers.get("origin")}/dashboard?payment=success&type=${isSubscription ? 'subscription' : 'purchase'}`,
            cancel_url: `${req.headers.get("origin")}/pricing?payment=cancelled`,
        })

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
