-- =====================================================
-- LOCAL TREND WATCHDOG TABLES
-- Monitors CQC reports from nearby care homes
-- =====================================================

-- =====================================================
-- Add postcode column to organizations
-- =====================================================
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS watchdog_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS watchdog_radius_miles INTEGER DEFAULT 10;

-- =====================================================
-- TABLE: local_cqc_reports
-- Stores fetched CQC reports from nearby competitors
-- =====================================================
CREATE TABLE IF NOT EXISTS public.local_cqc_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cqc_location_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    location_postcode TEXT NOT NULL,
    report_date DATE NOT NULL,
    report_type TEXT, -- 'routine', 'focused', 'responsive'
    overall_rating TEXT, -- 'Outstanding', 'Good', 'Requires improvement', 'Inadequate'
    safe_rating TEXT,
    effective_rating TEXT,
    caring_rating TEXT,
    responsive_rating TEXT,
    well_led_rating TEXT,
    report_url TEXT,
    key_findings JSONB, -- Array of findings/concerns extracted
    regulations_breached TEXT[], -- e.g., ['Reg 12', 'Reg 17']
    themes_identified TEXT[], -- AI-extracted themes like 'Medication', 'Staffing'
    raw_data JSONB,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cqc_location_id, report_date)
);

-- =====================================================
-- TABLE: watchdog_alerts
-- Generated alerts for organizations based on local trends
-- =====================================================
CREATE TABLE IF NOT EXISTS public.watchdog_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('trend_warning', 'new_report', 'regulation_focus', 'rating_drop')),
    severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    theme TEXT, -- e.g., 'Medication Management', 'Staffing Levels'
    regulation TEXT, -- e.g., 'Reg 12', 'Reg 17'
    affected_locations INTEGER DEFAULT 1, -- How many nearby homes affected
    recommended_action TEXT,
    recommended_audit_type TEXT, -- Link to internal audit feature
    related_report_ids UUID[], -- References to local_cqc_reports
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMPTZ,
    dismissed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: watchdog_scan_history
-- Tracks when scans were performed
-- =====================================================
CREATE TABLE IF NOT EXISTS public.watchdog_scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    postcode TEXT NOT NULL,
    radius_miles INTEGER NOT NULL,
    reports_found INTEGER DEFAULT 0,
    alerts_generated INTEGER DEFAULT 0,
    scan_status TEXT DEFAULT 'completed' CHECK (scan_status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_local_reports_postcode ON public.local_cqc_reports(location_postcode);
CREATE INDEX IF NOT EXISTS idx_local_reports_date ON public.local_cqc_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_local_reports_rating ON public.local_cqc_reports(overall_rating);
CREATE INDEX IF NOT EXISTS idx_local_reports_themes ON public.local_cqc_reports USING GIN(themes_identified);

CREATE INDEX IF NOT EXISTS idx_watchdog_alerts_org ON public.watchdog_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_watchdog_alerts_dismissed ON public.watchdog_alerts(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_watchdog_alerts_created ON public.watchdog_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_watchdog_scans_org ON public.watchdog_scan_history(organization_id);

-- =====================================================
-- Enable RLS
-- =====================================================
ALTER TABLE public.local_cqc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchdog_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchdog_scan_history ENABLE ROW LEVEL SECURITY;

-- CQC reports are public data - all authenticated users can read
CREATE POLICY "Authenticated users can read CQC reports"
    ON public.local_cqc_reports
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can insert CQC reports (via Edge Function)
CREATE POLICY "Service role can insert CQC reports"
    ON public.local_cqc_reports
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Users can only see their org's watchdog alerts
CREATE POLICY "Users can view own org watchdog alerts"
    ON public.watchdog_alerts
    FOR SELECT
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Users can dismiss their org's alerts
CREATE POLICY "Users can dismiss own org watchdog alerts"
    ON public.watchdog_alerts
    FOR UPDATE
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Users can view their org's scan history
CREATE POLICY "Users can view own org scan history"
    ON public.watchdog_scan_history
    FOR SELECT
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT SELECT ON public.local_cqc_reports TO authenticated;
GRANT SELECT, UPDATE ON public.watchdog_alerts TO authenticated;
GRANT SELECT ON public.watchdog_scan_history TO authenticated;

-- Service role needs full access for Edge Functions
GRANT ALL ON public.local_cqc_reports TO service_role;
GRANT ALL ON public.watchdog_alerts TO service_role;
GRANT ALL ON public.watchdog_scan_history TO service_role;
