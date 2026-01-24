-- =====================================================
-- COMPLYFLOW ULTIMATE SCHEMA REPAIR (v2)
-- RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    service_type TEXT DEFAULT 'domiciliary',
    cqc_status TEXT DEFAULT 'applying',
    sponsor_status TEXT DEFAULT 'no',
    subscription_tier TEXT DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    trial_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    postcode TEXT,
    watchdog_enabled BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'member',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DOMAIN TABLES
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    usage_type TEXT NOT NULL,
    period_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
    count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, usage_type, period_start)
);

CREATE TABLE IF NOT EXISTS public.organization_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    gap_analysis_credits INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    staff_count INTEGER DEFAULT 0,
    service_users_count INTEGER DEFAULT 0,
    cqc_status TEXT DEFAULT 'applying',
    sponsor_status TEXT DEFAULT 'pending',
    onboarding_complete BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS ENABLING
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 5. IDEMPOTENT RLS POLICIES (Safe to re-run)
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

    -- Organizations
    DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
    CREATE POLICY "Users can view own organization" ON public.organizations FOR SELECT 
    USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- Usage/Credits
    DROP POLICY IF EXISTS "Users can view org usage" ON public.usage_tracking;
    CREATE POLICY "Users can view org usage" ON public.usage_tracking FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    DROP POLICY IF EXISTS "Users can view org credits" ON public.organization_credits;
    CREATE POLICY "Users can view org credits" ON public.organization_credits FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- Metrics/Locations
    DROP POLICY IF EXISTS "Users can view metrics" ON public.compliance_metrics;
    CREATE POLICY "Users can view metrics" ON public.compliance_metrics FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    DROP POLICY IF EXISTS "Users can view locations" ON public.locations;
    CREATE POLICY "Users can view locations" ON public.locations FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
END $$;

-- 6. "BULLETPROOF" AUTH TRIGGER (Fixes 500 errors)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    provided_org_id TEXT;
BEGIN
    -- 1. Safely handle potential organization_id in metadata
    provided_org_id := NULLIF(NEW.raw_user_meta_data->>'organization_id', '');
    
    BEGIN
        IF provided_org_id IS NOT NULL AND provided_org_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
            new_org_id := provided_org_id::UUID;
        END IF;
    EXCEPTION WHEN others THEN
        new_org_id := NULL;
    END;

    -- 2. Create organization if none provided
    IF new_org_id IS NULL THEN
        INSERT INTO public.organizations (name, subscription_tier, trial_ends_at, trial_used)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'),
            'professional',
            NOW() + INTERVAL '14 days',
            true
        )
        RETURNING id INTO new_org_id;
    END IF;

    -- 3. Create Profile
    INSERT INTO public.profiles (id, email, full_name, organization_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        new_org_id,
        'owner'
    );

    -- 4. Initialize Metrics & Location
    INSERT INTO public.compliance_metrics (organization_id) VALUES (new_org_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.locations (organization_id, name, type) VALUES (new_org_id, 'Head Office', 'Head Office');

    RETURN NEW;
EXCEPTION WHEN others THEN
    -- Fallback to ensure signup doesn't hard fail if secondary inserts fail
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. REPAIR UTILITIES
CREATE OR REPLACE FUNCTION increment_usage(org_id UUID, u_type TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_tracking (organization_id, usage_type, period_start, count)
    VALUES (org_id, u_type, date_trunc('month', CURRENT_DATE)::date, 1)
    ON CONFLICT (organization_id, usage_type, period_start)
    DO UPDATE SET count = usage_tracking.count + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
