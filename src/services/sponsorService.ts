import { supabase } from '../lib/supabase';

export interface SponsoredWorker {
    id: string;
    organization_id: string;
    employee_id?: string;
    full_name: string;
    email?: string;
    visa_type: string;
    visa_expiry: string;
    cos_number?: string;
    cos_assigned_date?: string;
    start_date?: string;
    salary?: number;
    status: 'compliant' | 'warning' | 'alert' | 'expired';
    last_rtw_check?: string;
    ni_number?: string;
    passport_number?: string;
    job_title?: string;
    work_location?: string;
    notes?: string;
}

export interface ReportingEvent {
    id: string;
    organization_id: string;
    worker_id?: string;
    event_type: string;
    description: string;
    deadline_date?: string;
    status: 'pending' | 'reported' | 'overdue' | 'cancelled';
    reported_at?: string;
    reported_by?: string;
    created_at: string;
}

export const sponsorService = {
    // --- WORKER MANAGEMENT ---

    async getWorkers(organizationId: string): Promise<SponsoredWorker[]> {
        const { data, error } = await supabase
            .from('sponsored_workers')
            .select('*')
            .eq('organization_id', organizationId)
            .order('full_name');

        if (error) throw error;
        return data || [];
    },

    async createWorker(worker: Partial<SponsoredWorker>): Promise<SponsoredWorker> {
        const { data, error } = await supabase
            .from('sponsored_workers')
            .insert(worker)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateWorker(workerId: string, updates: Partial<SponsoredWorker>, organizationId: string): Promise<SponsoredWorker> {
        // Handle reporting log triggers (simplified logic for now)
        // In a real app, we'd compare old and new values to auto-create events

        const { data, error } = await supabase
            .from('sponsored_workers')
            .update(updates)
            .eq('id', workerId)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteWorker(workerId: string, organizationId: string): Promise<boolean> {
        const { error } = await supabase
            .from('sponsored_workers')
            .delete()
            .eq('id', workerId)
            .eq('organization_id', organizationId);

        if (error) throw error;
        return true;
    },

    // --- REPORTING LOG ---

    async getReportingLog(organizationId: string): Promise<ReportingEvent[]> {
        const { data, error } = await supabase
            .from('sponsor_reporting_log')
            .select(`
                *,
                worker:sponsored_workers(full_name)
            `)
            .eq('organization_id', organizationId)
            .order('deadline_date', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createReportingEvent(event: Partial<ReportingEvent>): Promise<ReportingEvent> {
        const { data, error } = await supabase
            .from('sponsor_reporting_log')
            .insert(event)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async markAsReported(eventId: string, reportedBy: string): Promise<boolean> {
        const { error } = await supabase
            .from('sponsor_reporting_log')
            .update({
                status: 'reported',
                reported_at: new Date().toISOString(),
                reported_by: reportedBy
            })
            .eq('id', eventId);

        if (error) throw error;
        return true;
    },

    // --- STATS ---

    async getSponsorStats(organizationId: string) {
        const { data: org, error: orgErr } = await supabase
            .from('organizations')
            .select('cos_allocated, cos_used')
            .eq('id', organizationId)
            .single();

        if (orgErr) throw orgErr;

        const { count: urgentAlerts } = await supabase
            .from('compliance_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('alert_type', 'visa_expiry')
            .eq('is_resolved', false);

        const { count: pendingReports } = await supabase
            .from('sponsor_reporting_log')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'pending');

        return {
            cosAllocated: org.cos_allocated,
            cosUsed: org.cos_used,
            urgentAlerts: urgentAlerts || 0,
            pendingReports: pendingReports || 0
        };
    }
};
