-- =====================================================
-- COMPLYFLOW PERSISTENCE SCHEMA
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. LOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Head Office', 'Branch', 'Care Home')),
    address TEXT,
    postcode TEXT,
    cqc_provider_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can manage locations in their org
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org locations"
    ON locations FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage org locations"
    ON locations FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- =====================================================
-- 2. COMPLIANCE METRICS TABLE (Replacing LocalStorage state)
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Core Stats
    staff_count INTEGER DEFAULT 0,
    service_users_count INTEGER DEFAULT 0,
    
    -- Statuses
    cqc_status TEXT DEFAULT 'applying',
    sponsor_status TEXT DEFAULT 'pending',
    
    -- Onboarding
    onboarding_complete BOOLEAN DEFAULT false,
    
    -- JSON Dump for minor settings (e.g. current UI preferences)
    settings JSONB DEFAULT '{}'::jsonb,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure 1 row per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_metrics_org ON compliance_metrics(organization_id);

-- RLS
ALTER TABLE compliance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org metrics"
    ON compliance_metrics FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update org metrics"
    ON compliance_metrics FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

-- =====================================================
-- 3. TRIGGER: Auto-create metrics on Org creation
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_org_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.compliance_metrics (organization_id)
    VALUES (NEW.id);
    
    -- Create default HQ location
    INSERT INTO public.locations (organization_id, name, type)
    VALUES (NEW.id, 'Head Office', 'Head Office');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_org_created_metrics
    AFTER INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_org_metrics();
