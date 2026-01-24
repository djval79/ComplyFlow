-- =====================================================
-- MIGRATION: 070_smart_rota.sql
-- Purpose: Add support for shift management and rota scheduling
-- =====================================================

-- 1. Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT, -- Optional name e.g., "Morning Shift"
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    role_required TEXT NOT NULL, -- e.g., 'Nurse', 'Care Assistant'
    location_id TEXT, -- Optional link to specific CQC location
    notes TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create shift_assignments table (linking users to shifts)
CREATE TABLE IF NOT EXISTS shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'declined', 'completed', 'no_show')),
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unavailability_reason TEXT,
    UNIQUE(shift_id, user_id)
);

-- 3. Create rota_templates table (for recurring patterns)
CREATE TABLE IF NOT EXISTS rota_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    schedule_data JSONB NOT NULL, -- Stores the pattern structure
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rota_templates ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Shifts: Viewable by org members, manageable by admins/managers
CREATE POLICY "Users can view org shifts"
    ON shifts FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage org shifts"
    ON shifts FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Shift Assignments: Viewable by org members
CREATE POLICY "Users can view org assignments"
    ON shift_assignments FOR SELECT
    USING (shift_id IN (
        SELECT id FROM shifts WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Admins can manage assignments"
    ON shift_assignments FOR ALL
    USING (shift_id IN (
        SELECT id FROM shifts WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    ));

-- Rota Templates: Similar to shifts
CREATE POLICY "Users can view org templates"
    ON rota_templates FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage templates"
    ON rota_templates FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_shifts_org_time ON shifts(organization_id, start_time);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON shift_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_shift ON shift_assignments(shift_id);
