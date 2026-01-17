-- ============================================================================
-- TEST: Simulate the exact INSERT that's failing
-- ============================================================================
-- This will show us EXACTLY which part of the INSERT is being blocked
-- ============================================================================

-- First, verify we can see the team member
DO $$
DECLARE
  v_team_member_id UUID := 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'; -- Replace with actual ID
  v_team_member_count INT;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TESTING INSERT COMPONENTS ===';
  RAISE NOTICE '';
  RAISE NOTICE '1. Current User: %', v_user_id;
  
  -- Check if we can see the team member
  SELECT COUNT(*) INTO v_team_member_count
  FROM team_members
  WHERE id = v_team_member_id;
  
  RAISE NOTICE '2. Can see team member? %', 
    CASE WHEN v_team_member_count > 0 THEN '✅ YES' ELSE '❌ NO - THIS IS THE PROBLEM!' END;
  
  -- If we can't see it, check why
  IF v_team_member_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  PROBLEM FOUND: Cannot access team_members table!';
    RAISE NOTICE '   The FK constraint on team_member_id is checking RLS on team_members';
    RAISE NOTICE '   You need to fix team_members RLS policies first!';
    RAISE NOTICE '';
  END IF;
  
END $$;

-- Now try a minimal INSERT (if RLS is disabled on team_member_certificates)
-- Comment this out if RLS is still enabled!

-- INSERT INTO team_member_certificates (
--   team_member_id,
--   certificate_name,
--   file_url,
--   file_type,
--   file_size,
--   status,
--   verification_status,
--   created_by,
--   updated_by
-- ) VALUES (
--   'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8', -- Replace with actual ID
--   'Test Certificate',
--   'https://test.com/test.pdf',
--   'application/pdf',
--   1024,
--   'active',
--   'pending',
--   auth.uid(),
--   auth.uid()
-- );

-- If the above INSERT fails, run this to see the error:
SELECT 
  'If INSERT failed above, the error message will appear in the output' as note;

-- ============================================================================
-- HYPOTHESIS
-- ============================================================================
-- When you INSERT into team_member_certificates with a team_member_id,
-- PostgreSQL checks if that team_member exists (FK constraint).
-- 
-- To check the FK, it does: SELECT FROM team_members WHERE id = ?
-- 
-- But team_members has RLS enabled! So if you can't SELECT that team member
-- due to RLS policies, the FK check fails with "violates RLS policy"
-- 
-- SOLUTION: Fix the team_members SELECT policy to allow you to see the member
-- ============================================================================
