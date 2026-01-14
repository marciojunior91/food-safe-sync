-- Manual User Creation Script
-- Use this to create users when Supabase Auth API is failing
-- Replace the values with actual user information

-- INSTRUCTIONS:
-- 1. Change the values below for each new user
-- 2. Run this script in Supabase SQL Editor
-- 3. Give the user the password to login

-- ==========================================
-- USER CONFIGURATION (CHANGE THESE VALUES)
-- ==========================================

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'newuser@example.com';  -- CHANGE THIS
  v_password text := 'TampaAPP@2026';     -- Use default or custom password
  v_display_name text := 'New User';      -- CHANGE THIS
  v_role app_role := 'staff';             -- CHANGE THIS: admin, manager, leader_chef, staff, cook, barista
  v_organization_id uuid := (SELECT id FROM organizations LIMIT 1); -- Uses first org
  v_position text := 'Team Member';       -- OPTIONAL: CHANGE THIS
  v_phone text := NULL;                   -- OPTIONAL: CHANGE THIS
  v_department_id uuid := NULL;           -- OPTIONAL: Add department if needed
BEGIN
  -- Generate new user ID
  v_user_id := gen_random_uuid();
  
  RAISE NOTICE 'Creating user: % with ID: %', v_email, v_user_id;
  
  -- Step 1: Create auth.users entry
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')), -- Encrypt password
    now(), -- Email confirmed immediately
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('display_name', v_display_name),
    false,
    now(),
    now(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
  );
  
  RAISE NOTICE '✓ User created in auth.users';
  
  -- Step 2: Create profile
  INSERT INTO profiles (
    user_id,
    email,
    display_name,
    organization_id,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_email,
    v_display_name,
    v_organization_id,
    now(),
    now()
  );
  
  RAISE NOTICE '✓ Profile created';
  
  -- Step 3: Create user_roles
  INSERT INTO user_roles (
    user_id,
    role,
    created_at
  ) VALUES (
    v_user_id,
    v_role,
    now()
  );
  
  RAISE NOTICE '✓ User role created: %', v_role;
  
  -- Step 4: Create team_member
  INSERT INTO team_members (
    id,
    auth_user_id,
    name,
    email,
    phone,
    position,
    role,
    organization_id,
    department_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_display_name,
    v_email,
    v_phone,
    v_position,
    v_role::text::team_member_role, -- Cast app_role to team_member_role
    v_organization_id,
    v_department_id,
    now(),
    now()
  );
  
  RAISE NOTICE '✓ Team member created';
  
  -- Success summary
  RAISE NOTICE '========================================';
  RAISE NOTICE 'USER CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Password: %', v_password;
  RAISE NOTICE 'Display Name: %', v_display_name;
  RAISE NOTICE 'Role: %', v_role;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Share the password with the user so they can login.';
  
END $$;

-- Verify the user was created
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.display_name,
  ur.role,
  tm.position
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN team_members tm ON tm.auth_user_id = u.id
ORDER BY u.created_at DESC
LIMIT 5;
