-- Add client_name to shifts table
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add client_name to rota template items (we need to update the JSON structure logic in app, 
-- but no schema change needed for JSONB, however we might want to be explicit if we were normalizing. 
-- For now, shifts table is the priority).

-- Add client_name to rota_templates for metadata if needed, but primary storage is inside schedule_data JSONB.
-- Let's add default client name for the whole template if applicable, or just rely on items.
-- For now, let's just add it to 'shifts'.
