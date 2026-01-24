-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Tightening permissions and RLS
-- =====================================================

-- 1. REVOKE BROAD PERMISSIONS
-- First, revert the "GRANT ALL" to a more restricted set
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 2. GRANT SELECTIVE PERMISSIONS
-- Authenticated users need basic DML on public tables (RLS will filter by organization_id)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Anon users should have VERY limited access
-- Usually only needed for reading public site settings or checking org availability if that's a feature
GRANT USAGE ON SCHEMA public TO anon;
-- If the app needs public access to certain tables, grant them specifically here:
-- GRANT SELECT ON public.some_public_table TO anon;

-- 3. ENSURE RLS IS ON EVERY TABLE
DO $$ 
DECLARE 
    t record;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.table_name);
    END LOOP;
END $$;

-- 4. FIX POTENTIAL RLS GAPS
-- Ensure team_invitations is protected (already enabled in its own migration but good to be certain)
ALTER TABLE IF EXISTS team_invitations ENABLE ROW LEVEL SECURITY;

-- 5. RE-VERIFY ORGANIZATIONS POLICY
-- Ensure it's not recursive and safe
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization" ON organizations 
    FOR SELECT USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- 6. RE-VERIFY PROFILES POLICY
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles 
    FOR SELECT USING (auth.uid() = id);

-- 7. KNOWLEDGE BASE PERMISSIONS
-- The match_documents function should be safe but ensure anon cannot call it if not intended
-- REVOKE EXECUTE ON FUNCTION match_documents FROM anon;
