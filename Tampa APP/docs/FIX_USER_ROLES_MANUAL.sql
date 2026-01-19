-- =====================================================
-- FIX USER_ROLES - Alternative Method
-- =====================================================
-- Since auth.uid() returns null in SQL Editor, we'll find your user_id manually

-- STEP 1: Find your user_id from profiles or team_members
-- Try profiles first:
SELECT 
  id as user_id,
  email,
  full_name,
  'Use this ID below' as note
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Or from team_members if you know your name:
SELECT DISTINCT
  tm.created_by as user_id,
  p.email,
  'Use this ID below' as note
FROM team_members tm
LEFT JOIN profiles p ON p.id = tm.created_by
WHERE tm.display_name LIKE '%Marcio%'
LIMIT 5;

-- STEP 2: Insert user_role with the user_id you found above
-- Replace BOTH placeholders below:

INSERT INTO user_roles (
  user_id,
  organization_id,
  role
) VALUES (
  'YOUR_USER_ID_FROM_STEP_1',     -- ← Your auth user UUID
  'b818500f-27f7-47c3-b62a-7d76d5505d57',  -- ← Your organization UUID
  'admin'
);

-- STEP 3: Verify it worked
SELECT 
  ur.user_id,
  ur.organization_id,
  ur.role,
  o.name as org_name,
  p.email as user_email,
  '✅ Success!' as status
FROM user_roles ur
LEFT JOIN organizations o ON o.id = ur.organization_id
LEFT JOIN profiles p ON p.id = ur.user_id
WHERE ur.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';

-- STEP 4: Verify team members are accessible
SELECT 
  tm.id,
  tm.display_name,
  tm.role_type,
  tm.organization_id,
  '✅ Can use as author_id' as status
FROM team_members tm
WHERE tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';

-- =====================================================
-- AFTER THIS: Try creating a post in your app!
-- =====================================================
