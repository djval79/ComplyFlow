import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.25.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get the user from the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !user) {
            throw new Error('Invalid user')
        }

        // Get the organization's stripe_customer_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id, organizations(stripe_customer_id)')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.organization_id) {
            throw new Error('Organization not found')
        }

        const customerId = (profile.organizations as any)?.stripe_customer_id

        if (!customerId) {
            throw new Error('No active billing found. Please subscribe first.')
        }

        // Create the portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.headers.get('origin')}/settings?tab=billing`,
        })

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
