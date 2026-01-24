-- Upgrade Organization for CoS Tracking
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS cos_allocated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cos_used INTEGER DEFAULT 0;

-- Enhance Sponsored Workers
ALTER TABLE sponsored_workers
ADD COLUMN IF NOT EXISTS ni_number TEXT,
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT;

-- Create Sponsor Reporting Log
CREATE TABLE IF NOT EXISTS sponsor_reporting_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES sponsored_workers(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'salary_change', 'role_change', 'absence', 'termination', 'visa_expiry'
    description TEXT,
    deadline_date DATE, -- Usually 10 working days from event
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reported', 'overdue', 'cancelled')),
    reported_at TIMESTAMPTZ,
    reported_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sponsor_reporting_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view org reporting log"
    ON sponsor_reporting_log FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage reporting log"
    ON sponsor_reporting_log FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reporting_org ON sponsor_reporting_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_reporting_worker ON sponsor_reporting_log(worker_id);
CREATE INDEX IF NOT EXISTS idx_reporting_status ON sponsor_reporting_log(status);
