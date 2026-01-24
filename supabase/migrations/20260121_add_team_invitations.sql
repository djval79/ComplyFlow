-- =====================================================
-- TEAM INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for team_invitations
CREATE POLICY "Admins can view org invitations"
    ON team_invitations FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Admins can create invitations"
    ON team_invitations FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Admins can update invitations"
    ON team_invitations FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Admins can delete invitations"
    ON team_invitations FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Grant permissions
GRANT ALL ON team_invitations TO anon, authenticated;
