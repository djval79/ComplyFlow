-- =====================================================
-- EVIDENCE VAULT TABLE
-- Centralized repository for all compliance evidence
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- File details
    name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase storage
    file_type TEXT,
    file_size INTEGER,
    
    -- CQC/Regulatory Mapping
    quality_statement_id TEXT, -- e.g., 'S3' for safeguarding, 'W5' for governance
    key_question TEXT CHECK (key_question IN ('safe', 'effective', 'caring', 'responsive', 'wellLed')),
    category TEXT, -- e.g., 'Policy', 'Staff Record', 'Risk Assessment', 'Audit', 'Meeting Minutes'
    
    -- Status and Lifecycle
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'archived', 'expiring')),
    expiration_date DATE, -- For documents that expire (e.g., DBS, Training, Insurance)
    
    -- AI Insights
    ai_confidence FLOAT, -- Confidence score for suggested tagging
    ai_reasoning TEXT, -- Brief explanation of why it was tagged this way
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE evidence_vault ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view org evidence"
    ON evidence_vault FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can upload org evidence"
    ON evidence_vault FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can update org evidence"
    ON evidence_vault FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Admins can delete org evidence"
    ON evidence_vault FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vault_org ON evidence_vault(organization_id);
CREATE INDEX IF NOT EXISTS idx_vault_quality_statement ON evidence_vault(quality_statement_id);
CREATE INDEX IF NOT EXISTS idx_vault_key_question ON evidence_vault(key_question);
CREATE INDEX IF NOT EXISTS idx_vault_status ON evidence_vault(status);
CREATE INDEX IF NOT EXISTS idx_vault_expiration ON evidence_vault(expiration_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_evidence_vault_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evidence_vault_timestamp
    BEFORE UPDATE ON evidence_vault
    FOR EACH ROW
    EXECUTE FUNCTION update_evidence_vault_timestamp();

-- Grant permissions
GRANT ALL ON TABLE evidence_vault TO authenticated;
