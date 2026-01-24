import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Weekly Digest Edge Function
 * Sends weekly compliance summary emails to all active organizations
 * Triggered by GitHub Actions every Monday at 8 AM
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        // Get all organizations with active subscriptions
        const { data: organizations, error: orgError } = await supabase
            .from('organizations')
            .select(`
                id,
                name,
                subscription_status,
                profiles!inner(id, email, full_name)
            `)
            .in('subscription_status', ['active', 'trial'])

        if (orgError) throw orgError

        console.log(`📊 Processing ${organizations?.length || 0} organizations`)

        let emailsSent = 0
        let errors = 0

        for (const org of organizations || []) {
            // Get compliance stats for this organization
            const [alertsResult, trainingsResult, workersResult, analysesResult] = await Promise.all([
                // Alerts resolved this week
                supabase
                    .from('compliance_alerts')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .eq('is_resolved', true)
                    .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

                // Training completions this week
                supabase
                    .from('training_completions')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

                // Workers with visas expiring soon
                supabase
                    .from('sponsored_workers')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .lte('visa_expiry', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),

                // Latest compliance analyses for score
                supabase
                    .from('compliance_analyses')
                    .select('compliance_score')
                    .eq('organization_id', org.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
            ])

            const stats = {
                complianceScore: analysesResult.data?.[0]?.compliance_score || null,
                alertsResolved: alertsResult.count || 0,
                trainingsCompleted: trainingsResult.count || 0,
                visasExpiringSoon: workersResult.count || 0
            }

            // Get recent regulatory updates
            const { data: updates } = await supabase
                .from('regulatory_updates')
                .select('title, source')
                .gte('published_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order('relevance_score', { ascending: false })
                .limit(3)

            const regulatoryUpdates = updates && updates.length > 0
                ? updates.map((u: { source: string; title: string }) => `${u.source.toUpperCase()}: ${u.title}`).join('; ')
                : 'No new regulatory updates this week.'

            // Build action items based on stats
            const actionItems: string[] = []
            if (stats.visasExpiringSoon > 0) {
                actionItems.push(`${stats.visasExpiringSoon} worker visa(s) expiring within 30 days`)
            }
            if (stats.complianceScore && stats.complianceScore < 80) {
                actionItems.push('Compliance score below 80% - run a new Gap Analysis')
            }

            // Send email to all profiles in this organization
            for (const profile of org.profiles || []) {
                try {
                    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseServiceKey}`
                        },
                        body: JSON.stringify({
                            type: 'weekly_digest',
                            to: profile.email,
                            data: {
                                organizationName: org.name,
                                ...stats,
                                regulatoryUpdates,
                                actionItems: actionItems.length > 0 ? actionItems : undefined
                            }
                        })
                    })

                    if (response.ok) {
                        emailsSent++
                        console.log(`✅ Sent digest to ${profile.email}`)
                    } else {
                        errors++
                        console.error(`❌ Failed to send to ${profile.email}`)
                    }
                } catch (e) {
                    errors++
                    console.error(`❌ Error sending to ${profile.email}:`, e)
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                organizations: organizations?.length || 0,
                emailsSent,
                errors
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Weekly digest error:', error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500
            }
        )
    }
})
