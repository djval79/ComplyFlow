import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client with Service Role Key (admin access)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const now = new Date()
        const results = {
            welcome_emails: 0,
            trial_warnings: 0,
            errors: [] as string[]
        }

        // ==========================================
        // 1. WELCOME EMAIL (Day 1 - Sent 24h after signup)
        // ==========================================

        // Find users created between 24h and 48h ago
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

        const { data: newUsers, error: userError } = await supabase
            .from('profiles')
            .select('id, email, full_name, created_at')
            .gte('created_at', twoDaysAgo.toISOString())
            .lt('created_at', yesterday.toISOString())

        if (userError) throw userError

        console.log(`[Growth] Found ${newUsers?.length || 0} candidate users for Welcome Email`)

        for (const user of newUsers || []) {
            // Check if already sent
            const { data: logs } = await supabase
                .from('email_logs')
                .select('id')
                .eq('user_id', user.id)
                .eq('email_type', 'welcome_drip_day1')
                .single()

            if (!logs) {
                // Send Email via existing email-service
                const { error: sendError } = await supabase.functions.invoke('email-service', {
                    body: {
                        type: 'welcome',
                        to: user.email,
                        data: {
                            name: user.full_name?.split(' ')[0] || 'there',
                            trialDays: 14,
                            dashboardUrl: `${supabaseUrl.replace('supabase.co', 'complyflow.co.uk')}/dashboard` // Simplified URL logic
                        }
                    }
                })

                if (!sendError) {
                    // Log it
                    await supabase.from('email_logs').insert({
                        user_id: user.id,
                        email_type: 'welcome_drip_day1'
                    })
                    results.welcome_emails++
                } else {
                    results.errors.push(`Failed to send welcome to ${user.email}: ${sendError.message}`)
                }
            }
        }

        // ==========================================
        // 2. TRIAL ENDING WARNING (Day 11 - 3 days left)
        // ==========================================

        const elevenDaysAgo = new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000)
        const twelveDaysAgo = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000)

        const { data: expUsers, error: expError } = await supabase
            .from('profiles')
            .select('id, email, organizations!inner(subscription_tier, trial_ends_at)')
            .eq('organizations.subscription_tier', 'trial')
            .gte('created_at', twelveDaysAgo.toISOString())
            .lt('created_at', elevenDaysAgo.toISOString())

        if (expError) throw expError

        console.log(`[Growth] Found ${expUsers?.length || 0} candidate users for Trial Warning`)

        for (const user of expUsers || []) {
            const { data: logs } = await supabase
                .from('email_logs')
                .select('id')
                .eq('user_id', user.id)
                .eq('email_type', 'trial_ending_day11')
                .single()

            if (!logs) {
                const { error: sendError } = await supabase.functions.invoke('email-service', {
                    body: {
                        type: 'trial_expiring',
                        to: user.email,
                        data: {
                            daysLeft: 3,
                            expiryDate: new Date(user.organizations.trial_ends_at).toLocaleDateString('en-GB')
                        }
                    }
                })

                if (!sendError) {
                    await supabase.from('email_logs').insert({
                        user_id: user.id,
                        email_type: 'trial_ending_day11'
                    })
                    results.trial_warnings++
                } else {
                    results.errors.push(`Failed to send trial warning to ${user.email}: ${sendError.message}`)
                }
            }
        }

        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
