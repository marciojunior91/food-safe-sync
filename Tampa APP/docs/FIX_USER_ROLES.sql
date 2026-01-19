-- =====================================================
-- FIX: Create user_role for current user
-- =====================================================
-- This will link your auth user to your organization

-- Step 1: Find your organization_id
-- (Run this first to see available organizations)
SELECT id, name, created_at 
FROM organizations 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 2: Create user_role entry
-- Replace 'YOUR_ORG_ID_HERE' with the actual organization ID from Step 1

-- First, check if entry already exists
SELECT * FROM user_roles 
WHERE user_id = auth.uid() 
  AND organization_id = 'YOUR_ORG_ID_HERE';

-- If the above returns 0 rows, insert:
INSERT INTO user_roles (
  user_id,
  organization_id,
  role
) VALUES (
  auth.uid(),
  'YOUR_ORG_ID_HERE',  -- ← REPLACE THIS!
  'admin'
);

-- If it returns 1 row, update instead:
UPDATE user_roles 
SET role = 'admin'
WHERE user_id = auth.uid() 
  AND organization_id = 'YOUR_ORG_ID_HERE';

-- Step 3: Verify it worked
SELECT 
  ur.user_id,
  ur.organization_id,
  ur.role,
  o.name as org_name,
  '✅ Success!' as status
FROM user_roles ur
LEFT JOIN organizations o ON o.id = ur.organization_id
WHERE ur.user_id = auth.uid();

-- Step 4: Verify team members are accessible now
SELECT 
  tm.id,
  tm.display_name,
  tm.role_type,
  '✅ Can use as author_id' as status
FROM team_members tm
WHERE tm.organization_id IN (
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
);

-- =====================================================
-- After running this, try creating a post again!
-- =====================================================
