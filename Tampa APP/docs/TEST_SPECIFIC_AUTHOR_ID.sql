-- =====================================================
-- TEST: Check if specific author_id would work
-- =====================================================

-- STEP 1: First, let's see ALL your team members
SELECT 
  'Your Team Members' as info,
  tm.id,
  tm.display_name,
  tm.role_type,
  tm.organization_id
FROM team_members tm
WHERE tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY tm.created_at DESC;

-- STEP 2: Test if user can create posts as EACH team member
-- This simulates the RLS policy check for each team member
SELECT 
  'Policy Test per Team Member' as test,
  tm.id as team_member_id,
  tm.display_name,
  tm.role_type,
  -- Check if this team member ID would pass the policy
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM team_members tm2
      INNER JOIN user_roles ur ON ur.organization_id = tm2.organization_id
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
        AND tm2.id = tm.id
    ) THEN '✅ CAN CREATE POSTS'
    ELSE '❌ CANNOT CREATE POSTS'
  END as can_create_post,
  -- Show why it passes or fails
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
        AND ur.organization_id = tm.organization_id
    ) THEN '✅ User has role in this org'
    ELSE '❌ User has NO role in this org'
  END as user_role_check
FROM team_members tm
WHERE tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY tm.display_name;

-- STEP 3: Test with a SPECIFIC team member ID
-- Replace 'PASTE_TEAM_MEMBER_ID_HERE' with the ID from browser console
/*
DO $$
DECLARE
  v_author_id uuid := 'PASTE_TEAM_MEMBER_ID_HERE';  -- ← Paste from console log
  v_org_id uuid := 'b818500f-27f7-47c3-b62a-7d76d5505d57';
  v_user_id uuid := 'cd9af250-133d-409e-9e97-f570f767648d';
BEGIN
  -- Test the exact policy logic
  IF EXISTS (
    SELECT 1 FROM team_members tm
    INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
    WHERE ur.user_id = v_user_id
      AND tm.id = v_author_id
      AND tm.organization_id = v_org_id
  ) THEN
    RAISE NOTICE '✅ This team member ID WOULD WORK!';
  ELSE
    RAISE NOTICE '❌ This team member ID WOULD FAIL!';
    
    -- Show why it fails
    IF NOT EXISTS (SELECT 1 FROM team_members WHERE id = v_author_id) THEN
      RAISE NOTICE '  Reason: Team member with this ID does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND organization_id = v_org_id) THEN
      RAISE NOTICE '  Reason: User role does not exist or has wrong org_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM team_members WHERE id = v_author_id AND organization_id = v_org_id) THEN
      RAISE NOTICE '  Reason: Team member exists but in different organization';
    END IF;
  END IF;
END $$;
*/

-- STEP 4: Show the exact INSERT policy again
SELECT 
  'Current INSERT Policy' as info,
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'feed_posts'
  AND cmd = 'INSERT';
