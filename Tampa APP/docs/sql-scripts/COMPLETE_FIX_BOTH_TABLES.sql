-- ============================================================================
-- COMPLETE FIX: Both team_members AND team_member_certificates
-- ============================================================================
-- Problem: FK constraint checks require SELECT access to team_members
-- Solution: Fix both tables' RLS policies
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix team_members SELECT policy (Required for FK checks)
-- ============================================================================

DROP POLICY IF EXISTS "view_team_members_in_org" ON team_members;
DROP POLICY IF EXISTS "view_team_members" ON team_members;
DROP POLICY IF EXISTS "select_team_members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;

CREATE POLICY "view_team_members_in_org"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    -- User must be in same organization
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "view_team_members_in_org" ON team_members IS 
'Users can view team members in their organization. Required for FK constraint checks.';

-- ============================================================================
-- STEP 2: Enable RLS on team_member_certificates (if disabled)
-- ============================================================================

ALTER TABLE team_member_certificates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create team_member_certificates policies
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
DROP POLICY IF EXISTS "temp_select_all" ON team_member_certificates;
DROP POLICY IF EXISTS "temp_insert_all" ON team_member_certificates;
DROP POLICY IF EXISTS "temp_update_all" ON team_member_certificates;
DROP POLICY IF EXISTS "temp_delete_all" ON team_member_certificates;

-- SELECT: View certificates for team members in your org
CREATE POLICY "view_certificates_in_org"
  ON team_member_certificates
  FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

-- INSERT: Admin/Manager can create certificates
CREATE POLICY "create_certificates_in_org"
  ON team_member_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Team member must be in your org
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
    -- Must be admin or manager
    AND has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );

-- UPDATE: Admin/Manager can update certificates
CREATE POLICY "update_certificates_in_org"
  ON team_member_certificates
  FOR UPDATE
  TO authenticated
  USING (
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
    AND has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  )
  WITH CHECK (
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

-- DELETE: Admin/Manager can delete certificates
CREATE POLICY "delete_certificates_in_org"
  ON team_member_certificates
  FOR DELETE
  TO authenticated
  USING (
    team_member_id IN (
      SELECT tm.id
      FROM team_members tm
      INNER JOIN profiles p ON p.organization_id = tm.organization_id
      WHERE p.user_id = auth.uid()
    )
    AND has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  '=== team_members SELECT policy ===' as section,
  policyname,
  permissive
FROM pg_policies 
WHERE tablename = 'team_members' AND cmd = 'SELECT'
UNION ALL
SELECT 
  '=== team_member_certificates policies ===' as section,
  policyname,
  permissive
FROM pg_policies 
WHERE tablename = 'team_member_certificates'
ORDER BY section, policyname;

-- Test access
SELECT 
  '=== Access Test ===' as section,
  'Can see team members: ' || CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as result
FROM team_members
WHERE organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
)
UNION ALL
SELECT 
  '=== User Roles ===' as section,
  'Roles: ' || STRING_AGG(role::text, ', ') as result
FROM user_roles
WHERE user_id = auth.uid();

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ COMPLETE FIX APPLIED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was fixed:';
  RAISE NOTICE '  1. team_members SELECT policy - allows org-based access';
  RAISE NOTICE '  2. team_member_certificates RLS enabled';
  RAISE NOTICE '  3. All certificate policies created with org isolation';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security:';
  RAISE NOTICE '  ✅ Organization isolation on both tables';
  RAISE NOTICE '  ✅ Admin/Manager only for certificate modifications';
  RAISE NOTICE '  ✅ FK constraints now work (can see referenced team members)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 REFRESH YOUR BROWSER and try uploading now!';
  RAISE NOTICE '';
END $$;
