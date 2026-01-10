import { supabase } from '../lib/supabase';

export interface ComplianceAlert {
    id: string;
    organization_id: string;
    alert_type: 'visa_expiry' | 'policy_review' | 'rtw_check' | 'cos_usage' | 'general';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    related_worker_id?: string;
    related_policy_id?: string;
    due_date?: string;
    is_resolved: boolean;
    created_at: string;
}

export const complianceService = {
    async sendEmail(to: string, subject: string, html: string) {
        try {
            const { error } = await supabase.functions.invoke('email-service', {
                body: { to, subject, html }
            });
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('[ComplianceService] Email failed:', err);
            return false;
        }
    },

    async refreshAlerts(organizationId: string) {
        if (!organizationId) return;

        // 1. Check for Visa Expiries
        const { data: workers, error: wErr } = await supabase
            .from('sponsored_workers')
            .select('*')
            .eq('organization_id', organizationId);

        if (wErr || !workers) return;

        const now = new Date();
        const ninetyDays = new Date();
        ninetyDays.setDate(now.getDate() + 90);

        for (const worker of workers) {
            const expiry = new Date(worker.visa_expiry);

            if (expiry <= ninetyDays) {
                // Determine severity
                const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
                const severity = diffDays <= 30 ? 'critical' : 'warning';

                // Check if alert already exists
                const { data: existing } = await supabase
                    .from('compliance_alerts')
                    .select('*')
                    .eq('organization_id', organizationId)
                    .eq('related_worker_id', worker.id)
                    .eq('alert_type', 'visa_expiry')
                    .eq('is_resolved', false)
                    .maybeSingle();

                if (!existing) {
                    const alertTitle = `Visa Expiry: ${worker.full_name}`;
                    const alertDesc = `Visa expires in ${diffDays} days (${expiry.toLocaleDateString()}). Please initiate renewal or Right-to-Work verification.`;

                    await supabase.from('compliance_alerts').insert({
                        organization_id: organizationId,
                        alert_type: 'visa_expiry',
                        severity,
                        title: alertTitle,
                        description: alertDesc,
                        related_worker_id: worker.id,
                        due_date: worker.visa_expiry,
                    });

                    // Trigger Email if Critical
                    if (severity === 'critical') {
                        const { data: adminProfiles } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('organization_id', organizationId)
                            .eq('role', 'owner');

                        if (adminProfiles?.length) {
                            for (const admin of adminProfiles) {
                                await this.sendEmail(
                                    admin.email,
                                    `🚨 CRITICAL: Compliance Alert - ${worker.full_name}`,
                                    `
                                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                            <h2 style="color: #dc2626;">Critical Compliance Alert</h2>
                                            <p>A critical compliance issue has been detected for <strong>${worker.full_name}</strong>.</p>
                                            <p><strong>Issue:</strong> Visa Expiry within 30 days.</p>
                                            <p><strong>Expiry Date:</strong> ${expiry.toLocaleDateString()}</p>
                                            <hr style="border: 1px solid #eee;" />
                                            <p style="font-size: 0.9rem; color: #666;">This is an automated message from ComplyFlow. Please log in to your dashboard to resolve this issue.</p>
                                            <a href="https://complyflow.novumsolvo.co.uk/dashboard" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; borderRadius: 5px;">View Dashboard</a>
                                        </div>
                                    `
                                );
                            }
                        }
                    }
                } else if (existing.severity !== severity) {
                    // Update severity if it's getting closer
                    await supabase
                        .from('compliance_alerts')
                        .update({ severity, description: `Visa expires in ${diffDays} days (${expiry.toLocaleDateString()}). PLEASE ACT NOW.` })
                        .eq('id', existing.id);
                }
            }
        }

        // 2. Check for missing policies (Policy Gap Alerts)
        // This could be integrated after a Gap Analysis is run
    },

    async resolveAlert(alertId: string, profileId: string) {
        const { error } = await supabase
            .from('compliance_alerts')
            .update({
                is_resolved: true,
                resolved_at: new Date().toISOString(),
                resolved_by: profileId
            })
            .eq('id', alertId);

        return !error;
    }
};
