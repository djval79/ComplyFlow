-- =====================================================
-- COMPLYFLOW DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    service_type TEXT DEFAULT 'domiciliary' CHECK (service_type IN ('domiciliary', 'residential', 'supported')),
    cqc_location_id TEXT,
    cqc_status TEXT DEFAULT 'applying' CHECK (cqc_status IN ('active', 'applying', 'notyet')),
    sponsor_licence_number TEXT,
    sponsor_status TEXT DEFAULT 'no' CHECK (sponsor_status IN ('yes', 'no', 'pending')),
    subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    avatar_url TEXT,
    job_title TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SPONSORED WORKERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sponsored_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT,
    visa_type TEXT NOT NULL,
    visa_expiry DATE NOT NULL,
    cos_number TEXT,
    cos_assigned_date DATE,
    start_date DATE,
    salary DECIMAL(10,2),
    status TEXT DEFAULT 'compliant' CHECK (status IN ('compliant', 'warning', 'alert', 'expired')),
    last_rtw_check DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- POLICIES TABLE (uploaded documents)
-- =====================================================
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    storage_path TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('cqc', 'hr', 'homeoffice', 'general')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'approved', 'needs_review')),
    last_analyzed_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMPLIANCE ANALYSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    analyzed_by UUID REFERENCES profiles(id),
    analysis_type TEXT DEFAULT 'ai' CHECK (analysis_type IN ('ai', 'manual', 'regex')),
    overall_score INTEGER, -- 0-100
    results JSONB NOT NULL, -- Array of rule results
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRAINING COMPLETIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS training_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    module_id TEXT NOT NULL,
    module_name TEXT NOT NULL,
    score INTEGER,
    passed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMPLIANCE ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('visa_expiry', 'policy_review', 'rtw_check', 'cos_usage', 'general')),
    severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    related_worker_id UUID REFERENCES sponsored_workers(id) ON DELETE SET NULL,
    related_policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    due_date DATE,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own org
CREATE POLICY "Users can view own organization"
    ON organizations FOR SELECT
    USING (id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Owners can update own organization"
    ON organizations FOR UPDATE
    USING (id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    ));

-- Profiles: Users can view profiles in their org
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid() OR organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Sponsored Workers: Users can manage workers in their org
CREATE POLICY "Users can view org workers"
    ON sponsored_workers FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage org workers"
    ON sponsored_workers FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Policies: Users can manage policies in their org
CREATE POLICY "Users can view org policies"
    ON policies FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage org policies"
    ON policies FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

-- Compliance Analyses: Users can view analyses in their org
CREATE POLICY "Users can view org analyses"
    ON compliance_analyses FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create org analyses"
    ON compliance_analyses FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

-- Training Completions: Users can view/create their own
CREATE POLICY "Users can view org training"
    ON training_completions FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create own training"
    ON training_completions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Compliance Alerts: Users can view org alerts
CREATE POLICY "Users can view org alerts"
    ON compliance_alerts FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage org alerts"
    ON compliance_alerts FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- =====================================================
-- TRIGGER: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create a new organization for the user
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'))
    RETURNING id INTO new_org_id;

    -- Create the user's profile
    INSERT INTO public.profiles (id, email, full_name, organization_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        new_org_id,
        'owner'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_workers_org ON sponsored_workers(organization_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON sponsored_workers(status);
CREATE INDEX IF NOT EXISTS idx_workers_visa_expiry ON sponsored_workers(visa_expiry);
CREATE INDEX IF NOT EXISTS idx_policies_org ON policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_analyses_org ON compliance_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON compliance_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON compliance_alerts(is_resolved);

-- =====================================================
-- GRANT permissions (needed for Supabase client access)
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
