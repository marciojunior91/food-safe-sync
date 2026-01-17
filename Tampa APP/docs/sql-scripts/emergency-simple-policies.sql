-- ============================================================================
-- EMERGENCY: Ultra-Simple Policies (Diagnostic Only)
-- ============================================================================
-- This removes ALL checks to see if basic INSERT works
-- DO NOT use in production - this is ONLY for diagnosis!
-- ============================================================================

-- Drop all existing certificate policies
DROP POLICY IF EXISTS "Users can view certificates in their org" ON team_member_certificates;
DROP POLICY IF EXISTS "Users can insert certificates for their org" ON team_member_certificates;
DROP POLICY IF EXISTS "Users can update certificates in their org" ON team_member_certificates;
DROP POLICY IF EXISTS "Admins can delete certificates in their org" ON team_member_certificates;
DROP POLICY IF EXISTS "Users can view certificates in their organization" ON team_member_certificates;
DROP POLICY IF EXISTS "Team members can manage their certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Authenticated users can view all certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Authenticated users can insert certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Authenticated users can delete certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Allow authenticated SELECT" ON team_member_certificates;
DROP POLICY IF EXISTS "Allow authenticated INSERT" ON team_member_certificates;
DROP POLICY IF EXISTS "Allow authenticated UPDATE" ON team_member_certificates;
DROP POLICY IF EXISTS "Allow authenticated DELETE" ON team_member_certificates;
DROP POLICY IF EXISTS "view_certificates_in_org" ON team_member_certificates;
DROP POLICY IF EXISTS "create_certificates_in_org" ON team_member_certificates;
DROP POLICY IF EXISTS "update_certificates_in_org" ON team_member_certificates;
DROP POLICY IF EXISTS "delete_certificates_in_org" ON team_member_certificates;

-- Create ABSOLUTE SIMPLEST policies - no checks at all
CREATE POLICY "temp_select_all"
ON team_member_certificates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "temp_insert_all"
ON team_member_certificates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "temp_update_all"
ON team_member_certificates FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "temp_delete_all"
ON team_member_certificates FOR DELETE
TO authenticated
USING (true);

-- Verify
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'team_member_certificates'
ORDER BY cmd;

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  DIAGNOSTIC POLICIES APPLIED';
  RAISE NOTICE '';
  RAISE NOTICE 'These allow ANY authenticated user to do ANYTHING';
  RAISE NOTICE 'This is ONLY for testing - do NOT leave in production!';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Try upload now:';
  RAISE NOTICE '   - If it WORKS: Problem is policy logic';
  RAISE NOTICE '   - If it FAILS: Problem is deeper (schema, auth, etc.)';
  RAISE NOTICE '';
END $$;
