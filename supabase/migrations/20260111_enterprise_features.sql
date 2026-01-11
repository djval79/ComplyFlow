-- =====================================================
-- ENTERPRISE FEATURES MIGRATION (Idempotent)
-- =====================================================

-- 1. API KEYS TABLE
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key_prefix TEXT NOT NULL, -- partial key for display
    key_hash TEXT NOT NULL, -- hashed key for verification
    label TEXT DEFAULT 'Default Key',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Owners can manage api keys') THEN
        CREATE POLICY "Owners can manage api keys"
            ON api_keys FOR ALL
            USING (organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
            ));
    END IF;
END $$;

-- 2. SSO CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS sso_config (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    provider_type TEXT DEFAULT 'saml' CHECK (provider_type IN ('saml', 'oidc')),
    entity_id TEXT,
    sso_url TEXT,
    certificate TEXT,
    is_enabled BOOLEAN DEFAULT false,
    metadata_xml TEXT, -- generated metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sso_config
ALTER TABLE sso_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sso_config' AND policyname = 'Owners can manage sso config') THEN
        CREATE POLICY "Owners can manage sso config"
            ON sso_config FOR ALL
            USING (organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
            ));
    END IF;
END $$;

-- 3. KNOWLEDGE BASE (Custom AI Models)
CREATE TABLE IF NOT EXISTS organization_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size TEXT,
    storage_path TEXT NOT NULL,
    status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'indexing', 'active', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for knowledge base
ALTER TABLE organization_knowledge_base ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_knowledge_base' AND policyname = 'Users can view org knowledge base') THEN
        CREATE POLICY "Users can view org knowledge base"
            ON organization_knowledge_base FOR SELECT
            USING (organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_knowledge_base' AND policyname = 'Admins can manage org knowledge base') THEN
        CREATE POLICY "Admins can manage org knowledge base"
            ON organization_knowledge_base FOR ALL
            USING (organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
            ));
    END IF;
END $$;

-- 4. RISK REGISTER (Persistence for Governance Dashboard)
CREATE TABLE IF NOT EXISTS risk_register (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    level TEXT DEFAULT 'Medium' CHECK (level IN ('High', 'Medium', 'Low')),
    mitigation TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'accepted')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for risk register
ALTER TABLE risk_register ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_register' AND policyname = 'Users can view org risks') THEN
        CREATE POLICY "Users can view org risks"
            ON risk_register FOR SELECT
            USING (organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_register' AND policyname = 'Admins can manage org risks') THEN
        CREATE POLICY "Admins can manage org risks"
            ON risk_register FOR ALL
            USING (organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
            ));
    END IF;
END $$;

-- 5. STORAGE BUCKET FOR KNOWLEDGE BASE
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge_base', 'knowledge_base', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow authenticated users to upload/read their own files (via folder structure)
-- We assume files are stored as `{organization_id}/{filename}`
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Auth users can view own org files') THEN
        CREATE POLICY "Auth users can view own org files"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'knowledge_base' AND (storage.foldername(name))[1]::uuid IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Auth users can upload own org files') THEN
        CREATE POLICY "Auth users can upload own org files"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'knowledge_base' AND (storage.foldername(name))[1]::uuid IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        ));
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON TABLE api_keys TO authenticated;
GRANT ALL ON TABLE sso_config TO authenticated;
GRANT ALL ON TABLE organization_knowledge_base TO authenticated;
GRANT ALL ON TABLE risk_register TO authenticated;
