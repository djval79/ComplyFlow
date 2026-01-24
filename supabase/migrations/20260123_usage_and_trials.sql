-- Phase 3 Monetization: Trial System and Usage Tracking
-- Migration: 20260123_usage_and_trials.sql

-- 1. Add trial fields to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false;

-- 2. Usage tracking table for metering
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    usage_type TEXT NOT NULL, -- 'ai_analysis', 'document_upload'
    period_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
    count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, usage_type, period_start)
);

-- 3. Billing invoices cache (from Stripe webhooks)
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    invoice_number TEXT,
    amount_paid INTEGER, -- in pence
    currency TEXT DEFAULT 'gbp',
    status TEXT, -- 'paid', 'open', 'void'
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org usage" 
    ON usage_tracking FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their org invoices" 
    ON billing_invoices FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 5. Increment usage function (called from frontend services)
CREATE OR REPLACE FUNCTION increment_usage(org_id UUID, u_type TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_tracking (organization_id, usage_type, period_start, count)
    VALUES (org_id, u_type, date_trunc('month', CURRENT_DATE)::date, 1)
    ON CONFLICT (organization_id, usage_type, period_start)
    DO UPDATE SET count = usage_tracking.count + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get monthly usage function
CREATE OR REPLACE FUNCTION get_monthly_usage(org_id UUID)
RETURNS TABLE(usage_type TEXT, count INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT ut.usage_type, ut.count
    FROM usage_tracking ut
    WHERE ut.organization_id = org_id
    AND ut.period_start = date_trunc('month', CURRENT_DATE)::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_usage_org_period ON usage_tracking(organization_id, period_start);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON billing_invoices(organization_id);
