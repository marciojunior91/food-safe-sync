-- =====================================================
-- FIX: Add missing updated_at column to user_roles
-- =====================================================

-- Add the updated_at column that the trigger expects
ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Set initial values for existing rows
UPDATE user_roles 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Now you can safely update organization_id
UPDATE user_roles
SET organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
WHERE user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
  AND organization_id IS NULL;

-- Verify the fix
SELECT 
  'After Fix' as status,
  ur.user_id,
  au.email,
  ur.organization_id,
  o.name as org_name,
  ur.role,
  ur.updated_at,
  '✅ Fixed!' as result
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN organizations o ON o.id = ur.organization_id
WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d';

-- Test the policy logic
SELECT 
  'Policy Check' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
    ) THEN '✅ POSTS SHOULD WORK NOW!'
    ELSE '❌ Still failing'
  END as result;
