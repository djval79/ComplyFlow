/**
 * Trial Expiry Checker - Supabase Edge Function
 * 
 * Runs on a schedule to downgrade expired trial accounts to free tier.
 * Deploy and configure via Supabase dashboard or GitHub Actions cron.
 * 
 * Schedule: Daily at midnight UTC
 * Trigger: Supabase cron or external scheduler (GitHub Actions / Vercel Cron)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders })
    }

    // Only allow POST for scheduled triggers (adds security)
    // GET allowed for manual testing
    if (req.method !== "POST" && req.method !== "GET") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Call the expire_trials function we created in the migration
        const { data, error: rpcError } = await supabase.rpc('expire_trials')

        if (rpcError) {
            console.error("Error calling expire_trials:", rpcError)

            // Fallback: direct update if RPC fails
            const { data: expiredOrgs, error: updateError } = await supabase
                .from('organizations')
                .update({
                    subscription_tier: 'free',
                    trial_ends_at: null
                })
                .lt('trial_ends_at', new Date().toISOString())
                .not('subscription_tier', 'eq', 'free')
                .select('id, name')

            if (updateError) {
                throw updateError
            }

            const expiredCount = expiredOrgs?.length || 0
            console.log(`✅ Expired ${expiredCount} trial(s) via fallback`)

            return new Response(
                JSON.stringify({
                    success: true,
                    expired_count: expiredCount,
                    method: 'fallback',
                    organizations: expiredOrgs?.map(o => o.name) || []
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }

        const expiredCount = data || 0
        console.log(`✅ Expired ${expiredCount} trial(s) via RPC`)

        return new Response(
            JSON.stringify({
                success: true,
                expired_count: expiredCount,
                method: 'rpc'
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error("Trial expiry error:", errorMessage)

        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
