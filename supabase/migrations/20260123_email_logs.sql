-- =====================================================
-- EMAIL LOGS TABLE
-- Tracks automated emails to prevent duplicates/spam
-- =====================================================

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL, -- e.g., 'welcome_drip_day1', 'trial_ending_day11'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_user_type ON email_logs(user_id, email_type);

-- RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view email logs"
    ON email_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    ));

-- Service role has full access (no specific policy needed if bypass RLS is used, typically true for edge functions with service key)
