-- Marketing leads table for email-gated downloads
CREATE TABLE IF NOT EXISTS marketing_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    source TEXT NOT NULL, -- 'compliance_checklist', 'webinar', etc.
    subscribed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Onboarding email tracking
CREATE TABLE IF NOT EXISTS onboarding_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL, -- 'welcome', 'day_3', 'day_7', etc.
    sent_at TIMESTAMPTZ DEFAULT now(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON marketing_leads(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_emails(user_id);
