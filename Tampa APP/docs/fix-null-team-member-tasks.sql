-- ============================================================================
-- FIX NULL TEAM_MEMBER_ID IN ROUTINE_TASKS
-- ============================================================================
-- Run this BEFORE the mandatory field migration to handle NULL values
-- ============================================================================

-- Step 1: Check how many tasks have NULL team_member_id
SELECT 
  COUNT(*) as null_tasks_count,
  organization_id
FROM routine_tasks
WHERE team_member_id IS NULL
GROUP BY organization_id;

-- Step 2: See the actual tasks that need assignment
SELECT 
  id,
  title,
  organization_id,
  created_at,
  assigned_to, -- Old field (auth user_id)
  team_member_id, -- New field (should be team member id)
  status
FROM routine_tasks
WHERE team_member_id IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- OPTION 1: Auto-migrate from assigned_to to team_member_id
-- ============================================================================
-- If you have assigned_to values, use them to populate team_member_id
-- This assumes assigned_to contains valid team member IDs

UPDATE routine_tasks
SET team_member_id = assigned_to
WHERE team_member_id IS NULL 
  AND assigned_to IS NOT NULL;

-- Verify the update
SELECT 
  COUNT(*) as remaining_null_tasks
FROM routine_tasks
WHERE team_member_id IS NULL;

-- ============================================================================
-- OPTION 2: Assign all NULL tasks to a specific team member
-- ============================================================================
-- Replace 'YOUR-TEAM-MEMBER-ID-HERE' with an actual team member UUID
-- You can get team member IDs with this query:

-- Get available team members:
SELECT 
  id,
  display_name,
  organization_id,
  role
FROM team_members
WHERE is_active = true
ORDER BY organization_id, display_name;

-- Then assign NULL tasks to a specific team member:
/*
UPDATE routine_tasks
SET team_member_id = 'YOUR-TEAM-MEMBER-ID-HERE'
WHERE team_member_id IS NULL
  AND organization_id = 'YOUR-ORGANIZATION-ID-HERE';
*/

-- ============================================================================
-- OPTION 3: Assign based on organization's first active team member
-- ============================================================================
-- This automatically assigns to the first available team member per organization

DO $$
DECLARE
  org_record RECORD;
  first_member_id UUID;
  updated_count INTEGER := 0;
BEGIN
  -- Loop through each organization with NULL tasks
  FOR org_record IN 
    SELECT DISTINCT organization_id 
    FROM routine_tasks 
    WHERE team_member_id IS NULL
  LOOP
    -- Get first active team member for this organization
    SELECT id INTO first_member_id
    FROM team_members
    WHERE organization_id = org_record.organization_id
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF first_member_id IS NOT NULL THEN
      -- Assign all NULL tasks in this org to this member
      UPDATE routine_tasks
      SET team_member_id = first_member_id
      WHERE team_member_id IS NULL
        AND organization_id = org_record.organization_id;
      
      GET DIAGNOSTICS updated_count = ROW_COUNT;
      RAISE NOTICE 'Assigned % tasks in org % to team member %', 
        updated_count, org_record.organization_id, first_member_id;
    ELSE
      RAISE WARNING 'No active team members found for organization %', 
        org_record.organization_id;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- OPTION 4: Delete tasks with NULL team_member_id (USE WITH CAUTION!)
-- ============================================================================
-- Only use this if you're sure these tasks are not important
-- UNCOMMENT ONLY IF YOU REALLY WANT TO DELETE THEM

/*
DELETE FROM routine_tasks
WHERE team_member_id IS NULL;
*/

-- ============================================================================
-- Final Verification
-- ============================================================================
-- After applying any of the options above, verify no NULL values remain:

SELECT 
  COUNT(*) as remaining_null_tasks,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Ready for migration!'
    ELSE '⚠️ Still have NULL values - fix them first'
  END as status
FROM routine_tasks
WHERE team_member_id IS NULL;

-- If the count is 0, you can now run:
-- supabase/migrations/20260115000001_make_assigned_to_mandatory.sql
