-- ============================================================================
-- MAKE TEAM_MEMBER_ID MANDATORY IN ROUTINE TASKS
-- ============================================================================
-- This migration makes team_member_id mandatory (NOT NULL) in:
-- - routine_task_assignments
-- - routine_task_completions
--
-- Migration Strategy:
-- 1. Create a default "System" team member for each organization
-- 2. Update existing NULL team_member_id records to use default
-- 3. Add NOT NULL constraint
-- 4. Update RLS policies to validate team_member organization
-- ============================================================================

-- ============================================================================
-- STEP 1: Create default "System" team member for each organization
-- ============================================================================

DO $$
DECLARE
  org_record RECORD;
  default_member_id UUID;
BEGIN
  -- For each organization that has routine tasks but no team members
  FOR org_record IN 
    SELECT DISTINCT o.id as org_id, o.name as org_name
    FROM organizations o
    WHERE EXISTS (
      SELECT 1 FROM routine_task_assignments rta
      WHERE rta.team_member_id IS NULL
      -- Note: routine_task_assignments doesn't have direct org reference
      -- We'll create a system member for ALL orgs to be safe
    )
    OR EXISTS (
      SELECT 1 FROM routine_task_completions rtc
      WHERE rtc.team_member_id IS NULL
    )
  LOOP
    -- Check if organization already has a "System" team member
    SELECT id INTO default_member_id
    FROM team_members
    WHERE organization_id = org_record.org_id
      AND display_name = 'System User'
      AND role_type = 'admin'
    LIMIT 1;

    -- If not, create one
    IF default_member_id IS NULL THEN
      INSERT INTO team_members (
        organization_id,
        display_name,
        email,
        position,
        role_type,
        is_active,
        profile_complete,
        created_at,
        updated_at
      )
      VALUES (
        org_record.org_id,
        'System User',
        'system@' || LOWER(REPLACE(org_record.org_name, ' ', '')) || '.internal',
        'System Account',
        'admin',
        true,
        true,
        NOW(),
        NOW()
      )
      RETURNING id INTO default_member_id;

      RAISE NOTICE 'Created default System User for organization: % (ID: %)', org_record.org_name, default_member_id;
    ELSE
      RAISE NOTICE 'System User already exists for organization: % (ID: %)', org_record.org_name, default_member_id;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Update existing NULL team_member_id records
-- ============================================================================

-- Create a temporary mapping table
CREATE TEMP TABLE org_default_members AS
SELECT 
  tm.organization_id,
  tm.id as default_member_id
FROM team_members tm
WHERE tm.display_name = 'System User'
  AND tm.role_type = 'admin';

-- Update routine_task_assignments
-- Note: This requires getting organization from the routine_tasks table
UPDATE routine_task_assignments rta
SET team_member_id = odm.default_member_id
FROM routine_tasks rt
JOIN routine_task_templates rtt ON rt.template_id = rtt.id
JOIN org_default_members odm ON rtt.organization_id = odm.organization_id
WHERE rta.task_id = rt.id
  AND rta.team_member_id IS NULL;

-- Get count of updated assignments
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % routine_task_assignments records with default team_member_id', updated_count;
END $$;

-- Update routine_task_completions
UPDATE routine_task_completions rtc
SET team_member_id = odm.default_member_id
FROM routine_tasks rt
JOIN routine_task_templates rtt ON rt.template_id = rtt.id
JOIN org_default_members odm ON rtt.organization_id = odm.organization_id
WHERE rtc.task_id = rt.id
  AND rtc.team_member_id IS NULL;

-- Get count of updated completions
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % routine_task_completions records with default team_member_id', updated_count;
END $$;

-- ============================================================================
-- STEP 3: Add NOT NULL constraint
-- ============================================================================

-- Check if there are still any NULL values (should be 0)
DO $$
DECLARE
  null_assignments INTEGER;
  null_completions INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_assignments
  FROM routine_task_assignments
  WHERE team_member_id IS NULL;

  SELECT COUNT(*) INTO null_completions
  FROM routine_task_completions
  WHERE team_member_id IS NULL;

  IF null_assignments > 0 OR null_completions > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint. Found % NULL assignments and % NULL completions',
      null_assignments, null_completions;
  END IF;

  RAISE NOTICE 'All team_member_id values populated. Ready to add NOT NULL constraint.';
END $$;

-- Add NOT NULL constraint to routine_task_assignments
ALTER TABLE routine_task_assignments
ALTER COLUMN team_member_id SET NOT NULL;

-- Add NOT NULL constraint to routine_task_completions
ALTER TABLE routine_task_completions
ALTER COLUMN team_member_id SET NOT NULL;

-- ============================================================================
-- STEP 4: Update RLS policies to validate team_member organization
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view routine task assignments" ON routine_task_assignments;
DROP POLICY IF EXISTS "Users can create routine task assignments" ON routine_task_assignments;
DROP POLICY IF EXISTS "Users can update routine task assignments" ON routine_task_assignments;

DROP POLICY IF EXISTS "Users can view routine task completions" ON routine_task_completions;
DROP POLICY IF EXISTS "Users can create routine task completions" ON routine_task_completions;

-- ============================================================================
-- RLS POLICY: View routine_task_assignments
-- ============================================================================

CREATE POLICY "view_routine_task_assignments"
  ON routine_task_assignments
  FOR SELECT
  TO authenticated
  USING (
    -- Must be able to see the associated routine task
    EXISTS (
      SELECT 1 FROM routine_tasks rt
      JOIN routine_task_templates rtt ON rt.template_id = rtt.id
      WHERE rt.id = routine_task_assignments.task_id
        AND rtt.organization_id IN (
          SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );

-- ============================================================================
-- RLS POLICY: Create routine_task_assignments
-- ============================================================================

CREATE POLICY "create_routine_task_assignments"
  ON routine_task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Team member must belong to same organization as the task
    EXISTS (
      SELECT 1 FROM routine_tasks rt
      JOIN routine_task_templates rtt ON rt.template_id = rtt.id
      JOIN team_members tm ON tm.id = routine_task_assignments.team_member_id
      WHERE rt.id = routine_task_assignments.task_id
        AND rtt.organization_id = tm.organization_id
        AND rtt.organization_id IN (
          SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    )
    -- Must have permission to create assignments
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );

-- ============================================================================
-- RLS POLICY: Update routine_task_assignments
-- ============================================================================

CREATE POLICY "update_routine_task_assignments"
  ON routine_task_assignments
  FOR UPDATE
  TO authenticated
  USING (
    -- Same org check
    EXISTS (
      SELECT 1 FROM routine_tasks rt
      JOIN routine_task_templates rtt ON rt.template_id = rtt.id
      WHERE rt.id = routine_task_assignments.task_id
        AND rtt.organization_id IN (
          SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    )
    -- Must have permission
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  )
  WITH CHECK (
    -- Team member must still be in same org
    EXISTS (
      SELECT 1 FROM routine_tasks rt
      JOIN routine_task_templates rtt ON rt.template_id = rtt.id
      JOIN team_members tm ON tm.id = routine_task_assignments.team_member_id
      WHERE rt.id = routine_task_assignments.task_id
        AND rtt.organization_id = tm.organization_id
    )
  );

-- ============================================================================
-- RLS POLICY: View routine_task_completions
-- ============================================================================

CREATE POLICY "view_routine_task_completions"
  ON routine_task_completions
  FOR SELECT
  TO authenticated
  USING (
    -- Must be able to see the associated routine task
    EXISTS (
      SELECT 1 FROM routine_tasks rt
      JOIN routine_task_templates rtt ON rt.template_id = rtt.id
      WHERE rt.id = routine_task_completions.task_id
        AND rtt.organization_id IN (
          SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );

-- ============================================================================
-- RLS POLICY: Create routine_task_completions
-- ============================================================================

CREATE POLICY "create_routine_task_completions"
  ON routine_task_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Team member must belong to same organization as the task
    EXISTS (
      SELECT 1 FROM routine_tasks rt
      JOIN routine_task_templates rtt ON rt.template_id = rtt.id
      JOIN team_members tm ON tm.id = routine_task_completions.team_member_id
      WHERE rt.id = routine_task_completions.task_id
        AND rtt.organization_id = tm.organization_id
        AND rtt.organization_id IN (
          SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    )
    -- Anyone in org can complete tasks (assigned team member or helper)
  );

-- ============================================================================
-- STEP 5: Add indexes for performance
-- ============================================================================

-- Index for team_member lookups in assignments
CREATE INDEX IF NOT EXISTS idx_routine_task_assignments_team_member_task
ON routine_task_assignments(team_member_id, task_id);

-- Index for team_member lookups in completions
CREATE INDEX IF NOT EXISTS idx_routine_task_completions_team_member_task
ON routine_task_completions(team_member_id, task_id);

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON COLUMN routine_task_assignments.team_member_id IS 
'Team member assigned to this routine task. MANDATORY - ensures individual accountability.';

COMMENT ON COLUMN routine_task_completions.team_member_id IS 
'Team member who completed this routine task. MANDATORY - ensures traceability.';

-- ============================================================================
-- STEP 7: Create helper function for task assignment validation
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_routine_task_team_member(
  task_id_param UUID,
  team_member_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_org_id UUID;
  member_org_id UUID;
BEGIN
  -- Get task's organization
  SELECT rtt.organization_id INTO task_org_id
  FROM routine_tasks rt
  JOIN routine_task_templates rtt ON rt.template_id = rtt.id
  WHERE rt.id = task_id_param;

  -- Get team member's organization
  SELECT organization_id INTO member_org_id
  FROM team_members
  WHERE id = team_member_id_param;

  -- Must match and both must exist
  IF task_org_id IS NULL OR member_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN task_org_id = member_org_id;
END;
$$;

COMMENT ON FUNCTION validate_routine_task_team_member IS 
'Validates that a team member belongs to the same organization as a routine task. Returns FALSE if either not found or orgs do not match.';

GRANT EXECUTE ON FUNCTION validate_routine_task_team_member TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ROUTINE TASKS - TEAM MEMBER MANDATORY MIGRATION COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- Created System User for organizations (if needed)';
  RAISE NOTICE '- Updated all NULL team_member_id records';
  RAISE NOTICE '- Added NOT NULL constraints';
  RAISE NOTICE '- Updated RLS policies with organization validation';
  RAISE NOTICE '- Added performance indexes';
  RAISE NOTICE '- Created validation helper function';
  RAISE NOTICE '============================================================================';
END $$;
