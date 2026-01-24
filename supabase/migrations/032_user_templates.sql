-- =====================================================
-- USER TEMPLATES TABLE
-- Store customized policies/forms for specific organizations
-- =====================================================

CREATE TABLE IF NOT EXISTS user_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    base_template_id UUID REFERENCES policy_templates(id) ON DELETE SET NULL,
    
    -- Template data
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('policy', 'form', 'audit', 'checklist', 'procedure')),
    content TEXT NOT NULL,
    customization_prompt TEXT, -- record of the AI prompt used
    
    -- Versioning
    version TEXT DEFAULT '1.0',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own organization's templates
CREATE POLICY "Users can manage own user templates"
    ON user_templates FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_templates_org ON user_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_base ON user_templates(base_template_id);

-- Grant permissions
GRANT ALL ON TABLE user_templates TO authenticated;
