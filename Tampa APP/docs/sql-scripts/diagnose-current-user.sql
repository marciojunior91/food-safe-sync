-- ============================================================================
-- DIAGNOSE: Check Current User's Permissions and Data
-- ============================================================================
-- This will show us EXACTLY why the INSERT is failing
-- ============================================================================

-- 1. WHO AM I?
SELECT 
  '1. Current User' as check_type,
  auth.uid() as user_id,
  current_user as database_user;

-- 2. MY PROFILE
SELECT 
  '2. My Profile' as check_type,
  user_id,
  display_name,
  organization_id,
  email
FROM profiles
WHERE user_id = auth.uid();

-- 3. MY ROLES
SELECT 
  '3. My Roles' as check_type,
  ur.role,
  ur.organization_id,
  ur.created_at
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- 4. TEAM MEMBER I'M TRYING TO UPLOAD FOR
SELECT 
  '4. Target Team Member' as check_type,
  tm.id,
  tm.display_name,
  tm.organization_id,
  tm.is_active
FROM team_members tm
WHERE tm.id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'; -- Replace with actual team member ID

-- 5. DO WE MATCH ORGANIZATIONS?
SELECT 
  '5. Organization Match' as check_type,
  p.organization_id as my_org,
  tm.organization_id as team_member_org,
  CASE 
    WHEN p.organization_id = tm.organization_id THEN '✅ MATCH'
    ELSE '❌ DIFFERENT ORGS'
  END as match_status
FROM profiles p
CROSS JOIN team_members tm
WHERE p.user_id = auth.uid()
  AND tm.id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'; -- Replace with actual team member ID

-- 6. TEST: Can I see this team member?
SELECT 
  '6. Can I See Team Member?' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ YES'
    ELSE '❌ NO'
  END as can_see
FROM team_members tm
WHERE tm.id IN (
  SELECT tm2.id
  FROM team_members tm2
  INNER JOIN profiles p ON p.organization_id = tm2.organization_id
  WHERE p.user_id = auth.uid()
)
AND tm.id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'; -- Replace with actual team member ID

-- 7. CHECK: Does has_any_role function exist?
SELECT 
  '7. has_any_role Function' as check_type,
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'has_any_role';

-- 8. TEST: Can has_any_role see my roles?
SELECT 
  '8. has_any_role Test' as check_type,
  has_any_role(auth.uid(), ARRAY['admin']::app_role[]) as has_admin,
  has_any_role(auth.uid(), ARRAY['manager']::app_role[]) as has_manager,
  has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[]) as has_admin_or_manager;

-- 9. CURRENT POLICIES on team_member_certificates
SELECT 
  '9. Current Policies' as check_type,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'team_member_certificates'
ORDER BY cmd;

-- 10. RLS ENABLED?
SELECT 
  '10. RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'team_member_certificates';

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- Replace 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8' with the actual team member ID
-- you're trying to upload a certificate for.
-- 
-- Run this and share ALL the results!
-- ============================================================================
