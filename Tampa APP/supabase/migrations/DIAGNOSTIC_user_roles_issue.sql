-- ============================================================================
-- DIAGNOSTIC: Why user_roles is not being populated
-- ============================================================================

-- Query 1: Check current state of user_roles
SELECT 'Current user_roles count' as check_name, COUNT(*) as count FROM user_roles;

-- Query 2: Check total profiles (should match user_roles after backfill)
SELECT 'Total profiles count' as check_name, COUNT(*) as count FROM profiles;

-- Query 3: Check team_members with auth_role_id
SELECT 'Team members WITH auth_role_id' as check_name, COUNT(*) as count 
FROM team_members 
WHERE auth_role_id IS NOT NULL;

-- Query 4: Check team_members WITHOUT auth_role_id
SELECT 'Team members WITHOUT auth_role_id' as check_name, COUNT(*) as count 
FROM team_members 
WHERE auth_role_id IS NULL;

-- Query 5: Show all team_members to see the data
SELECT 
  id,
  display_name,
  email,
  auth_role_id,
  role_type,
  created_at
FROM team_members
ORDER BY created_at DESC
LIMIT 20;

-- Query 6: Show all profiles to see the data
SELECT 
  user_id,
  display_name,
  email,
  organization_id,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- Query 7: Show profiles WITHOUT user_roles entry
SELECT 
  p.user_id,
  p.display_name,
  p.email,
  'MISSING USER_ROLE' as issue
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
);
