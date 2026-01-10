ALTER TABLE compliance_metrics 
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'domiciliary';
