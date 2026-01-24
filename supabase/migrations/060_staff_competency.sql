-- =====================================================
-- MIGRATION: 060_staff_competency.sql
-- Purpose: Add support for training modules, requirements, and expiry tracking
-- =====================================================

-- 1. Create training_modules table
CREATE TABLE IF NOT EXISTS training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'mandatory' CHECK (category IN ('mandatory', 'clinical', 'specialist', 'other')),
    description TEXT,
    validity_months INTEGER DEFAULT 12, -- How long the certificate is valid for
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create training_requirements table (linking job titles to modules)
CREATE TABLE IF NOT EXISTS training_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL, -- e.g., 'Care Worker', 'Nurse', 'Manager'
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, job_title, module_id)
);

-- 3. Update training_completions table
ALTER TABLE training_completions 
ADD COLUMN IF NOT EXISTS expires_at DATE,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Enable RLS

ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_requirements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Training Modules: Everyone can view (they are system-wide or org-specific? Assuming system-wide for now, or we can make them generic)
-- Let's assume standard modules are system-wide, but we might want custom ones later. For now, let's make them viewable by authenticated users.
CREATE POLICY "Authenticated users can view training modules"
    ON training_modules FOR SELECT
    TO authenticated
    USING (true);

-- Training Requirements: Viewable by org members, manageable by admins
CREATE POLICY "Users can view org training requirements"
    ON training_requirements FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage org training requirements"
    ON training_requirements FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- 6. Seed some default training modules
INSERT INTO training_modules (name, category, validity_months, description) VALUES
('Fire Safety Awareness', 'mandatory', 12, 'Annual fire safety training requirement.'),
('Safeguarding Adults (Level 2)', 'mandatory', 36, 'Protection of vulnerable adults.'),
('Moving and Handling', 'mandatory', 12, 'Safe moving and handling techniques.'),
('Infection Control', 'mandatory', 12, 'Standard precautions and hygiene.'),
('Medication Administration', 'clinical', 12, 'Safe handling and administration of medicines.'),
('Food Hygiene (Level 2)', 'mandatory', 36, 'Safe food preparation and handling.'),
('Dementia Awareness', 'specialist', 36, 'Understanding and supporting people with dementia.'),
('Basic Life Support / First Aid', 'mandatory', 12, 'Emergency first aid procedures.'),
('Data Protection & GDPR', 'mandatory', 24, 'Handling personal data compliantly.'),
('Mental Capacity Act & DoLS', 'clinical', 36, 'Legal framework for decision making.')
ON CONFLICT DO NOTHING;
