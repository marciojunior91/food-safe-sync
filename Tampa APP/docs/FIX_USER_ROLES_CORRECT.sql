-- =====================================================
-- FIX USER_ROLES - Find Correct Auth User
-- =====================================================

-- STEP 1: Find your auth user ID from auth.users
SELECT 
  id as auth_user_id,
  email,
  created_at,
  last_sign_in_at,
  'Use this ID below ⬇️' as note
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 10;

-- STEP 2: Verify this user has team_members
-- Replace 'YOUR_AUTH_USER_ID' with the ID from Step 1
SELECT 
  tm.id as team_member_id,
  tm.display_name,
  tm.role_type,
  tm.organization_id,
  tm.created_by,
  'Check if created_by matches auth user' as note
FROM team_members tm
WHERE tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY tm.created_at DESC;

-- STEP 3: Check existing user_roles (if any)
SELECT * FROM user_roles 
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';

-- STEP 4: Insert with CORRECT auth user ID
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the ID from auth.users query
INSERT INTO user_roles (
  user_id,
  organization_id,
  role
) VALUES (
  'YOUR_AUTH_USER_ID_HERE',  -- ← From auth.users!
  'b818500f-27f7-47c3-b62a-7d76d5505d57',
  'admin'
);

-- STEP 5: Verify success
SELECT 
  ur.user_id,
  au.email,
  ur.organization_id,
  o.name as org_name,
  ur.role,
  '✅ SUCCESS!' as status
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN organizations o ON o.id = ur.organization_id
WHERE ur.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';

-- =====================================================
-- ALTERNATIVE: If you know your email
-- =====================================================

-- Find user by email and insert in one go:
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id from email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'YOUR_EMAIL_HERE@example.com'  -- ← Replace with your email
  LIMIT 1;
  
  -- Insert if found
  IF v_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, organization_id, role)
    VALUES (v_user_id, 'b818500f-27f7-47c3-b62a-7d76d5505d57', 'admin')
    ON CONFLICT ON CONSTRAINT user_roles_pkey DO UPDATE
      SET role = 'admin';
    
    RAISE NOTICE 'Success! Created user_role for user: %', v_user_id;
  ELSE
    RAISE EXCEPTION 'User with that email not found!';
  END IF;
END $$;

-- =====================================================
-- QUICK CHECK: Show me everything about your org
-- =====================================================
SELECT 
  'Organization' as type,
  o.id::text as id,
  o.name as name,
  NULL as email,
  NULL as role
FROM organizations o
WHERE o.id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'

UNION ALL

SELECT 
  'Auth Users' as type,
  au.id::text,
  NULL as name,
  au.email,
  NULL as role
FROM auth.users au
ORDER BY au.last_sign_in_at DESC
LIMIT 5

UNION ALL

SELECT 
  'Team Members' as type,
  tm.id::text,
  tm.display_name,
  NULL as email,
  tm.role_type::text
FROM team_members tm
WHERE tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'

UNION ALL

SELECT 
  'User Roles' as type,
  ur.user_id::text,
  NULL as name,
  au.email,
  ur.role::text
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';
