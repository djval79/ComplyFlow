    -- =====================================================
    -- COMPLYFLOW CONSOLIDATED REPAIR & SCHEMA SCRIPT
    -- RUN THIS IN SUPABASE SQL EDITOR
    -- =====================================================

    -- 1. EXTENSIONS
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "vector";

    -- 2. CORE TABLES (IF NOT EXISTS)
    CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        service_type TEXT DEFAULT 'domiciliary',
        cqc_location_id TEXT,
        cqc_status TEXT DEFAULT 'applying',
        sponsor_licence_number TEXT,
        sponsor_status TEXT DEFAULT 'no',
        subscription_tier TEXT DEFAULT 'trial',
        subscription_status TEXT DEFAULT 'active',
        trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        full_name TEXT,
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        role TEXT DEFAULT 'member',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. DOMAIN TABLES
    CREATE TABLE IF NOT EXISTS sponsored_workers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        employee_id TEXT,
        full_name TEXT NOT NULL,
        visa_type TEXT NOT NULL,
        visa_expiry DATE NOT NULL,
        cos_number TEXT,
        status TEXT DEFAULT 'compliant',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS compliance_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        staff_count INTEGER DEFAULT 0,
        service_users_count INTEGER DEFAULT 0,
        cqc_status TEXT DEFAULT 'applying',
        sponsor_status TEXT DEFAULT 'pending',
        service_type TEXT DEFAULT 'domiciliary',
        onboarding_complete BOOLEAN DEFAULT false,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS training_completions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        module_id TEXT NOT NULL,
        module_name TEXT NOT NULL,
        score INTEGER,
        passed BOOLEAN DEFAULT true,
        completed_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS knowledge_base (
    id bigserial primary key,
    content text,
    metadata jsonb,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. RLS ENFORCEMENT & FIXES
    DO $$ 
    BEGIN
        ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE sponsored_workers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE compliance_metrics ENABLE ROW LEVEL SECURITY;
        ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN 
        -- Handled
    END $$;

    -- Clear problematic recursive policies
    DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
    DROP POLICY IF EXISTS "Owners can update own organization" ON organizations;
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

    -- New non-recursive policies
    -- Profiles
    CREATE POLICY "Users can view own profile" ON profiles 
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON profiles 
        FOR UPDATE USING (auth.uid() = id);

    -- Organizations (Safe because it points to profiles, and profiles select doesn't point back to org table for check)
    CREATE POLICY "Users can view own organization" ON organizations 
        FOR SELECT USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

    -- Policies (Using DO blocks to avoid "already exists" errors)
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public knowledge access') THEN
            CREATE POLICY "Public knowledge access" ON knowledge_base FOR SELECT USING (true);
        END IF;
    END $$;

    -- 5. RPC FUNCTIONS
    CREATE OR REPLACE FUNCTION match_documents (
    query_embedding vector(768),
    match_threshold float,
    match_count int
    )
    returns table (
    id bigint,
    content text,
    metadata jsonb,
    similarity float
    )
    language plpgsql
    as $$
    begin
    return query
    select
        knowledge_base.id,
        knowledge_base.content,
        knowledge_base.metadata,
        1 - (knowledge_base.embedding <=> query_embedding) as similarity
    from knowledge_base
    where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
    order by knowledge_base.embedding <=> query_embedding
    limit match_count;
    end;
    $$;

    -- 6. SYSTEM TRIGGERS (CRITICAL)
    -- Auto-create profile and organization on user signup
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

    -- Re-apply trigger
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    -- 7. REPAIR: Create missing profiles/orgs for existing users
    DO $$
    DECLARE
        u RECORD;
        new_org_id UUID;
    BEGIN
        FOR u IN SELECT id, email, raw_user_meta_data FROM auth.users
        LOOP
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id) THEN
                -- Create org
                INSERT INTO public.organizations (name)
                VALUES (COALESCE(u.raw_user_meta_data->>'organization_name', 'My Organization'))
                RETURNING id INTO new_org_id;

                -- Create profile
                INSERT INTO public.profiles (id, email, full_name, organization_id, role)
                VALUES (
                    u.id, 
                    u.email, 
                    COALESCE(u.raw_user_meta_data->>'full_name', 'User'), 
                    new_org_id, 
                    'owner'
                );
            END IF;
        END LOOP;
    END $$;

    -- 8. GRANT PERMISSIONS
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
