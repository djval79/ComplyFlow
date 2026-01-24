-- =====================================================
-- COMPLIANCE ACTIONS TABLE
-- Track issues from inspections, gap analyses through resolution
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Source of the action
    source TEXT NOT NULL CHECK (source IN ('mock_inspection', 'gap_analysis', 'regulatory_update', 'manual')),
    source_id UUID, -- Reference to inspection session, analysis, or update ID
    
    -- CQC Quality Statement reference
    quality_statement_id TEXT, -- e.g., 'S3' for safeguarding, 'W5' for governance
    key_question TEXT CHECK (key_question IN ('safe', 'effective', 'caring', 'responsive', 'wellLed')),
    
    -- Action details
    title TEXT NOT NULL,
    description TEXT,
    recommendation TEXT, -- AI or user-provided recommendation
    
    -- Assignment
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Timing
    due_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Status tracking
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'overdue', 'deferred')),
    
    -- Evidence and resolution
    evidence_urls TEXT[], -- Array of file URLs or storage paths
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE compliance_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view org actions"
    ON compliance_actions FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create org actions"
    ON compliance_actions FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can update org actions"
    ON compliance_actions FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Admins can delete org actions"
    ON compliance_actions FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Members can update actions assigned to them
CREATE POLICY "Members can update assigned actions"
    ON compliance_actions FOR UPDATE
    USING (assigned_to = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_actions_org ON compliance_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON compliance_actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON compliance_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_actions_assigned ON compliance_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_actions_quality_statement ON compliance_actions(quality_statement_id);

-- Function to auto-update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_compliance_actions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compliance_actions_timestamp
    BEFORE UPDATE ON compliance_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_actions_timestamp();

-- Function to auto-mark overdue actions
CREATE OR REPLACE FUNCTION mark_overdue_actions()
RETURNS void AS $$
BEGIN
    UPDATE compliance_actions
    SET status = 'overdue'
    WHERE status IN ('open', 'in_progress')
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON TABLE compliance_actions TO authenticated;
