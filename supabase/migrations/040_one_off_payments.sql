-- Support for one-off payments and standalone credits
-- CEO Strategic Growth Lever: "Pay-per-Analysis"

CREATE TABLE IF NOT EXISTS standalone_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    purchase_type TEXT NOT NULL, -- 'gap_analysis', 'sponsor_audit', etc.
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    stripe_session_id TEXT UNIQUE,
    amount_total INTEGER, -- in pence
    currency TEXT DEFAULT 'gbp',
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- Credits table to allow non-subscription users to hold analysis tokens
CREATE TABLE IF NOT EXISTS organization_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    gap_analysis_credits INTEGER DEFAULT 0,
    sponsor_audit_credits INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE standalone_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization purchases" 
    ON standalone_purchases FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own organization credits" 
    ON organization_credits FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Function to handle successful purchase (called by webhook in production)
CREATE OR REPLACE FUNCTION handle_purchase_success(org_id UUID, p_type TEXT) 
RETURNS VOID AS $$
BEGIN
    INSERT INTO organization_credits (organization_id, gap_analysis_credits)
    VALUES (org_id, 1)
    ON CONFLICT (organization_id) 
    DO UPDATE SET 
        gap_analysis_credits = organization_credits.gap_analysis_credits + 1,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
