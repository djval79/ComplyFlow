// Trend Watchdog Service
// Frontend service layer for the Local Trend Watchdog feature

import { supabase } from '../lib/supabase';

export interface WatchdogAlert {
    id: string;
    organization_id: string;
    alert_type: 'trend_warning' | 'new_report' | 'regulation_focus' | 'rating_drop';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    theme: string | null;
    regulation: string | null;
    affected_locations: number;
    recommended_action: string;
    recommended_audit_type: string | null;
    is_dismissed: boolean;
    created_at: string;
}

export interface WatchdogSettings {
    postcode: string | null;
    watchdog_enabled: boolean;
    watchdog_radius_miles: number;
}

export interface LocalCQCReport {
    id: string;
    cqc_location_id: string;
    location_name: string;
    location_postcode: string;
    report_date: string;
    overall_rating: string;
    safe_rating: string;
    effective_rating: string;
    caring_rating: string;
    responsive_rating: string;
    well_led_rating: string;
    themes_identified: string[];
}

export interface ScanResult {
    success: boolean;
    locationsFound: number;
    concerningLocations: number;
    themes: Record<string, number>;
    regulations: Record<string, number>;
    alertsGenerated: number;
}

/**
 * Get watchdog settings for an organization
 */
export async function getWatchdogSettings(organizationId: string): Promise<WatchdogSettings | null> {
    const { data, error } = await supabase
        .from('organizations')
        .select('postcode, watchdog_enabled, watchdog_radius_miles')
        .eq('id', organizationId)
        .single();

    if (error) {
        console.error('Error fetching watchdog settings:', error);
        return null;
    }

    return data as WatchdogSettings;
}

/**
 * Update watchdog settings for an organization
 */
export async function updateWatchdogSettings(
    organizationId: string,
    settings: Partial<WatchdogSettings>
): Promise<boolean> {
    const { error } = await supabase
        .from('organizations')
        .update({
            ...settings,
            updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

    if (error) {
        console.error('Error updating watchdog settings:', error);
        return false;
    }

    return true;
}

/**
 * Trigger a watchdog scan for an organization
 */
export async function triggerWatchdogScan(
    organizationId: string,
    postcode: string,
    radiusMiles: number = 10
): Promise<ScanResult> {
    try {
        const { data, error } = await supabase.functions.invoke('trend-watchdog', {
            body: {
                action: 'scan',
                organizationId,
                postcode,
                radiusMiles
            }
        });

        if (error) throw error;
        return data as ScanResult;
    } catch (error) {
        console.error('Error triggering watchdog scan:', error);
        return {
            success: false,
            locationsFound: 0,
            concerningLocations: 0,
            themes: {},
            regulations: {},
            alertsGenerated: 0
        };
    }
}

/**
 * Get active watchdog alerts for an organization
 */
export async function getWatchdogAlerts(organizationId: string): Promise<WatchdogAlert[]> {
    const { data, error } = await supabase
        .from('watchdog_alerts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching watchdog alerts:', error);
        return [];
    }

    return data as WatchdogAlert[];
}

/**
 * Get all watchdog alerts (including dismissed) for history
 */
export async function getWatchdogAlertHistory(organizationId: string): Promise<WatchdogAlert[]> {
    const { data, error } = await supabase
        .from('watchdog_alerts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching alert history:', error);
        return [];
    }

    return data as WatchdogAlert[];
}

/**
 * Dismiss a watchdog alert
 */
export async function dismissWatchdogAlert(alertId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('watchdog_alerts')
        .update({
            is_dismissed: true,
            dismissed_at: new Date().toISOString(),
            dismissed_by: userId
        })
        .eq('id', alertId);

    if (error) {
        console.error('Error dismissing alert:', error);
        return false;
    }

    return true;
}

/**
 * Get recent CQC reports from the local area
 */
export async function getLocalCQCReports(limit: number = 20): Promise<LocalCQCReport[]> {
    const { data, error } = await supabase
        .from('local_cqc_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching local CQC reports:', error);
        return [];
    }

    return data as LocalCQCReport[];
}

/**
 * Get reports filtered by rating status
 */
export async function getReportsByRating(rating: string): Promise<LocalCQCReport[]> {
    const { data, error } = await supabase
        .from('local_cqc_reports')
        .select('*')
        .eq('overall_rating', rating)
        .order('report_date', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching reports by rating:', error);
        return [];
    }

    return data as LocalCQCReport[];
}

/**
 * Get scan history for an organization
 */
export async function getScanHistory(organizationId: string): Promise<Array<{
    id: string;
    postcode: string;
    radius_miles: number;
    reports_found: number;
    alerts_generated: number;
    scan_status: string;
    completed_at: string;
}>> {
    const { data, error } = await supabase
        .from('watchdog_scan_history')
        .select('*')
        .eq('organization_id', organizationId)
        .order('started_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching scan history:', error);
        return [];
    }

    return data;
}

/**
 * Get count of active alerts for badge display
 */
export async function getActiveAlertCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
        .from('watchdog_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_dismissed', false);

    if (error) {
        console.error('Error fetching alert count:', error);
        return 0;
    }

    return count || 0;
}

// ============ DEMO DATA ============
// Used when API calls fail or for demo mode

export const DEMO_WATCHDOG_ALERTS: WatchdogAlert[] = [
    {
        id: 'demo-1',
        organization_id: 'demo',
        alert_type: 'trend_warning',
        severity: 'critical',
        title: '4 nearby homes flagged for Medication Management',
        description: 'CQC has identified Medication Management concerns at 4 care homes within your area. This suggests inspectors may be focusing on this area during their visits.',
        theme: 'Medication Management',
        regulation: 'Reg 12',
        affected_locations: 4,
        recommended_action: 'Run a Medication Management audit to ensure your home is compliant before your next inspection.',
        recommended_audit_type: 'medication_audit',
        is_dismissed: false,
        created_at: new Date().toISOString()
    },
    {
        id: 'demo-2',
        organization_id: 'demo',
        alert_type: 'regulation_focus',
        severity: 'warning',
        title: 'Reg 17 - Good Governance under scrutiny',
        description: '3 care homes near your location have been cited for Reg 17 breaches. Review your compliance with this regulation immediately.',
        theme: 'Governance',
        regulation: 'Reg 17',
        affected_locations: 3,
        recommended_action: 'Review your Reg 17 compliance documentation and run a gap analysis.',
        recommended_audit_type: 'gap_analysis',
        is_dismissed: false,
        created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'demo-3',
        organization_id: 'demo',
        alert_type: 'trend_warning',
        severity: 'warning',
        title: '2 nearby homes flagged for Staffing Levels',
        description: 'CQC has identified Staffing concerns at 2 care homes within your area. Ensure your staffing rotas demonstrate safe levels.',
        theme: 'Staffing Levels',
        regulation: 'Reg 18',
        affected_locations: 2,
        recommended_action: 'Review your staffing rotas and dependency assessments.',
        recommended_audit_type: 'staffing_review',
        is_dismissed: false,
        created_at: new Date(Date.now() - 172800000).toISOString()
    }
];

export const DEMO_LOCAL_REPORTS: LocalCQCReport[] = [
    {
        id: 'report-1',
        cqc_location_id: 'CQC-12345',
        location_name: 'Sunrise Care Home',
        location_postcode: 'B1 1AA',
        report_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        overall_rating: 'Requires improvement',
        safe_rating: 'Requires improvement',
        effective_rating: 'Good',
        caring_rating: 'Good',
        responsive_rating: 'Good',
        well_led_rating: 'Requires improvement',
        themes_identified: ['Medication Management', 'Governance']
    },
    {
        id: 'report-2',
        cqc_location_id: 'CQC-23456',
        location_name: 'Meadow View Residential',
        location_postcode: 'B2 2BB',
        report_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
        overall_rating: 'Good',
        safe_rating: 'Good',
        effective_rating: 'Good',
        caring_rating: 'Outstanding',
        responsive_rating: 'Good',
        well_led_rating: 'Good',
        themes_identified: []
    },
    {
        id: 'report-3',
        cqc_location_id: 'CQC-34567',
        location_name: 'Oakwood Care Centre',
        location_postcode: 'B3 3CC',
        report_date: new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0],
        overall_rating: 'Inadequate',
        safe_rating: 'Inadequate',
        effective_rating: 'Requires improvement',
        caring_rating: 'Requires improvement',
        responsive_rating: 'Requires improvement',
        well_led_rating: 'Inadequate',
        themes_identified: ['Safe Care', 'Staffing Levels', 'Governance', 'Medication Management']
    }
];
