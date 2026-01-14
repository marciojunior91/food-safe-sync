-- ============================================================================
-- CHECK USER ROLES - Debug Script
-- ============================================================================
-- This script checks what roles are in the database and verifies the data
-- ============================================================================

-- Check all users and their roles
SELECT 
  p.user_id,
  p.display_name,
  p.email,
  ur.role,
  p.organization_id
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.display_name;

-- Count users by role
SELECT 
  COALESCE(ur.role::TEXT, 'no_role') as role,
  COUNT(*) as count
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
GROUP BY ur.role
ORDER BY count DESC;

-- Check your specific user (replace with your user_id)
SELECT 
  p.*,
  ur.role as user_role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE p.user_id = auth.uid();
