-- Check current state of policies and data
-- Run this to see what's currently configured

-- Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'profiles', 'user_roles', 'team_members')
ORDER BY tablename, policyname;

-- Check functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%organization%'
ORDER BY routine_name;

-- Check user data (as service role)
SELECT 
  id,
  organization_id,
  SUBSTRING(full_name, 1, 20) as name
FROM profiles
LIMIT 5;

-- Check user_roles
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.organization_id
FROM user_roles ur
LIMIT 5;

-- Check organizations
SELECT 
  id,
  name
FROM organizations
LIMIT 5;
