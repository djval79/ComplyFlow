import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Visa Expiry Checker Edge Function
 * Runs daily to notify organizations of upcoming visa expiries
 * Alert thresholds: 90, 60, 30, and 14 days
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Define alert thresholds in days
        const thresholds = [90, 60, 30, 14];

        console.log(`🚀 Starting Visa Expiry Check for ${today.toISOString()}`);

        let alertsProcessed = 0;
        let emailsSent = 0;

        for (const days of thresholds) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + days);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            console.log(`🔍 Checking for expiries on: ${targetDateStr} (${days} days from now)`);

            // Find workers whose visa expires EXACTLY on the target date
            // Note: In a real app, you might want a range or check if already notified
            const { data: workers, error: workerErr } = await supabase
                .from('sponsored_workers')
                .select(`
                    id,
                    full_name,
                    visa_type,
                    visa_expiry,
                    organization_id,
                    organization:organizations(name)
                `)
                .eq('visa_expiry', targetDateStr);

            if (workerErr) throw workerErr;

            if (workers && workers.length > 0) {
                console.log(`🔔 Found ${workers.length} worker(s) with ${days}-day expiry`);

                for (const worker of workers) {
                    // Get all admin profiles for this organization
                    const { data: profiles, error: profileErr } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('organization_id', worker.organization_id)
                        .in('role', ['admin', 'owner']);

                    if (profileErr) {
                        console.error(`❌ Error fetching profiles for org ${worker.organization_id}:`, profileErr);
                        continue;
                    }

                    if (!profiles || profiles.length === 0) {
                        console.warn(`⚠️ No admin profiles found for org ${worker.organization_id}`);
                        continue;
                    }

                    // Send email to each admin
                    for (const profile of profiles) {
                        try {
                            const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${supabaseServiceKey}`
                                },
                                body: JSON.stringify({
                                    type: 'visa_expiry_alert',
                                    to: profile.email,
                                    data: {
                                        workerName: worker.full_name,
                                        visaType: worker.visa_type,
                                        expiryDate: worker.visa_expiry,
                                        daysRemaining: days,
                                        organizationName: (worker.organization as any)?.name
                                    }
                                })
                            });

                            if (response.ok) {
                                emailsSent++;
                                console.log(`✅ Sent ${days}-day alert for ${worker.full_name} to ${profile.email}`);
                            } else {
                                console.error(`❌ Failed to send email to ${profile.email}:`, await response.text());
                            }
                        } catch (e) {
                            console.error(`❌ Error calling send-email for ${profile.email}:`, e);
                        }
                    }

                    // Optional: Log this alert in a notifications table to prevent duplicates 
                    // or just rely on the frequency of the cron job (daily) and exact date match.
                    alertsProcessed++;
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                alertsProcessed,
                emailsSent
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Visa checker error:', error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500
            }
        )
    }
})
