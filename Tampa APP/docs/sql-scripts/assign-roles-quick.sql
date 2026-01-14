-- ============================================================================
-- EMERGENCY FIX: Assign Organization and Admin Role
-- ============================================================================
-- This script will:
-- 1. Show your current state
-- 2. Assign you to an organization (if needed)
-- 3. Give you admin role (if needed)
-- 4. Verify everything works
-- ============================================================================

-- ============================================================================
-- STEP 1: Disable RLS temporarily for user_roles (to fix bootstrapping issue)
-- ============================================================================

ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Show current state
-- ============================================================================

SELECT 'BEFORE FIX:' as status;

SELECT 
  'Your user_id: ' || auth.uid() as info
UNION ALL
SELECT 
  'Your org_id: ' || COALESCE(organization_id::text, 'NULL') as info
FROM profiles WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'Your roles: ' || COALESCE(STRING_AGG(role::text, ', '), 'NONE') as info
FROM user_roles WHERE user_id = auth.uid();

-- ============================================================================
-- STEP 3: Get or create an organization
-- ============================================================================

-- First, check if any organization exists
DO $$
DECLARE
  v_org_id UUID;
  v_org_count INT;
  v_user_id UUID := auth.uid();
  v_user_org_id UUID;
BEGIN
  -- Get current user's org (if any)
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE user_id = v_user_id;
  
  -- Count organizations
  SELECT COUNT(*) INTO v_org_count FROM organizations;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== ORGANIZATION CHECK ===';
  RAISE NOTICE 'User org_id: %', COALESCE(v_user_org_id::text, 'NULL');
  RAISE NOTICE 'Total organizations: %', v_org_count;
  
  -- If user has no org
  IF v_user_org_id IS NULL THEN
    -- Try to use first existing org
    SELECT id INTO v_org_id FROM organizations ORDER BY created_at LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
      -- Assign user to first org
      UPDATE profiles 
      SET organization_id = v_org_id 
      WHERE user_id = v_user_id;
      
      RAISE NOTICE '✅ Assigned you to existing org: %', v_org_id;
    ELSE
      -- Create a new organization
      INSERT INTO organizations (name, slug, created_at, updated_at)
      VALUES ('Default Organization', 'default', NOW(), NOW())
      RETURNING id INTO v_org_id;
      
      -- Assign user to new org
      UPDATE profiles 
      SET organization_id = v_org_id 
      WHERE user_id = v_user_id;
      
      RAISE NOTICE '✅ Created new org and assigned you: %', v_org_id;
    END IF;
  ELSE
    RAISE NOTICE '✅ You already have an org: %', v_user_org_id;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Ensure team members have same org
-- ============================================================================

-- Update team members to match your organization
DO $$
DECLARE
  v_user_org_id UUID;
  v_updated_count INT;
BEGIN
  -- Get your org
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE user_id = auth.uid();
  
  -- Update team members with NULL org_id to match yours
  UPDATE team_members
  SET organization_id = v_user_org_id
  WHERE organization_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TEAM MEMBERS UPDATE ===';
  RAISE NOTICE 'Your org: %', v_user_org_id;
  RAISE NOTICE 'Updated % team members to your org', v_updated_count;
END $$;

-- ============================================================================
-- STEP 5: Add admin role
-- ============================================================================

INSERT INTO user_roles (user_id, role, organization_id)
SELECT 
  auth.uid(),
  'admin'::app_role,
  organization_id
FROM profiles
WHERE user_id = auth.uid()
ON CONFLICT (user_id, role, organization_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Re-enable RLS on user_roles with proper policy
-- ============================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "view_own_roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;

-- Allow users to see their own roles
CREATE POLICY "view_own_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "service_role_all_access"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 7: Verify everything
-- ============================================================================

SELECT 'AFTER FIX:' as status;

SELECT 
  'Your user_id: ' || auth.uid()::text as info
UNION ALL
SELECT 
  'Your org_id: ' || COALESCE(p.organization_id::text, 'NULL') as info
FROM profiles p WHERE p.user_id = auth.uid()
UNION ALL
SELECT 
  'Your roles: ' || COALESCE(STRING_AGG(ur.role::text, ', '), 'NONE') as info
FROM user_roles ur WHERE ur.user_id = auth.uid()
UNION ALL
SELECT 
  'Can see team members: ' || CASE WHEN COUNT(*) > 0 THEN '✅ YES' ELSE '❌ NO' END as info
FROM team_members tm
WHERE tm.organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ EMERGENCY FIX COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What was fixed:';
  RAISE NOTICE '  1. Assigned you to an organization';
  RAISE NOTICE '  2. Gave you admin role';
  RAISE NOTICE '  3. Updated team members to your org';
  RAISE NOTICE '  4. Fixed user_roles RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Now run COMPLETE_FIX_BOTH_TABLES.sql';
  RAISE NOTICE '   Then refresh browser and try upload!';
  RAISE NOTICE '';
END $$;
