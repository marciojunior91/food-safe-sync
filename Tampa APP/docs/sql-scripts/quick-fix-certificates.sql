-- ============================================================================
-- FIX: Team Member Certificates RLS Policies
-- ============================================================================
-- Based on working pattern from team_members and routine_tasks tables
-- Uses has_role() function to prevent RLS recursion
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

-- ============================================================================
-- SELECT POLICY: View certificates for team members in organization
-- ============================================================================

CREATE POLICY "view_certificates_in_org"
  ON team_member_certificates
  FOR SELECT
  TO authenticated
  USING (
    -- Certificate's team member must be in user's organization
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "view_certificates_in_org" ON team_member_certificates IS 
'Users can view certificates for team members in their organization.';

-- ============================================================================
-- INSERT POLICY: Create certificates for team members in organization
-- ============================================================================

CREATE POLICY "create_certificates_in_org"
  ON team_member_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be creating certificate for team member in own organization
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
    -- Must have admin or manager role
    AND has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );

COMMENT ON POLICY "create_certificates_in_org" ON team_member_certificates IS 
'Admin and Manager can create certificates for team members in their organization.';

-- ============================================================================
-- UPDATE POLICY: Update certificates in organization
-- ============================================================================

CREATE POLICY "update_certificates_in_org"
  ON team_member_certificates
  FOR UPDATE
  TO authenticated
  USING (
    -- Certificate's team member must be in user's organization
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
    -- Must have admin or manager role
    AND has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  )
  WITH CHECK (
    -- Cannot change to team member outside organization
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "update_certificates_in_org" ON team_member_certificates IS 
'Admin and Manager can update certificates in their organization.';

-- ============================================================================
-- DELETE POLICY: Delete certificates in organization
-- ============================================================================

CREATE POLICY "delete_certificates_in_org"
  ON team_member_certificates
  FOR DELETE
  TO authenticated
  USING (
    -- Certificate's team member must be in user's organization
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
    -- Must have admin or manager role
    AND has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );

COMMENT ON POLICY "delete_certificates_in_org" ON team_member_certificates IS 
'Admin and Manager can delete certificates in their organization.';

-- ============================================================================
-- Verify policies
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'team_member_certificates'
ORDER BY cmd, policyname;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ CERTIFICATE POLICIES FIXED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies Applied (based on working team_members pattern):';
  RAISE NOTICE '  ✅ SELECT - View certificates in your organization';
  RAISE NOTICE '  ✅ INSERT - Admin/Manager can create certificates';
  RAISE NOTICE '  ✅ UPDATE - Admin/Manager can update certificates';
  RAISE NOTICE '  ✅ DELETE - Admin/Manager can delete certificates';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security Features:';
  RAISE NOTICE '  ✅ Uses has_any_role() to prevent RLS recursion';
  RAISE NOTICE '  ✅ Joins team_members with profiles for org check';
  RAISE NOTICE '  ✅ Same pattern as working team_members policies';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Try uploading now - should work for admin/manager!';
  RAISE NOTICE '';
END $$;
