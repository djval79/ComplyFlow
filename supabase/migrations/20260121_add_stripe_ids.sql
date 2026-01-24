-- Add Stripe tracking columns to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for lookup in webhooks
CREATE INDEX IF NOT EXISTS idx_orgs_stripe_customer ON organizations(stripe_customer_id);
