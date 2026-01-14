-- ============================================================================
-- REAL FIX: The Problem is team_members RLS, NOT certificates!
-- ============================================================================
-- When you INSERT into team_member_certificates, PostgreSQL checks the FK.
-- The FK references team_members.id, which has RLS enabled.
-- If RLS blocks you from seeing that team member, the INSERT fails!
-- 
-- Solution: Make sure team_members SELECT policy allows access
-- ============================================================================

-- First, let's check current team_members policies
SELECT 
  'Current team_members policies:' as info,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'team_members'
ORDER BY cmd;

-- Drop and recreate team_members SELECT policy to be more permissive
-- (We'll keep the restrictive policies for INSERT/UPDATE/DELETE)

DROP POLICY IF EXISTS "view_team_members_in_org" ON team_members;
DROP POLICY IF EXISTS "view_team_members" ON team_members;
DROP POLICY IF EXISTS "select_team_members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;

-- Create a SELECT policy that allows authenticated users to see team members
-- This is needed for FK constraint checks!
CREATE POLICY "view_team_members_in_org"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    -- User must be in same organization as team member
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "view_team_members_in_org" ON team_members IS 
'Authenticated users can view team members in their organization. Required for FK constraint checks.';

-- Verify the policy was created
SELECT 
  'New policy created:' as info,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'team_members'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Test if you can now see the team member
SELECT 
  'Test access to team member:' as info,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ YES - Should work now!'
    ELSE '❌ NO - Check organization_id match'
  END as can_access
FROM team_members
WHERE id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'; -- Replace with actual ID

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ team_members SELECT POLICY FIXED!';
  RAISE NOTICE '';
  RAISE NOTICE 'This policy allows you to SELECT team members in your org.';
  RAISE NOTICE 'This is required for FK constraint checks when inserting certificates.';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Now try uploading a certificate!';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: You may also need to re-enable RLS on team_member_certificates';
  RAISE NOTICE 'and apply the certificate policies from quick-fix-certificates.sql';
  RAISE NOTICE '';
END $$;
