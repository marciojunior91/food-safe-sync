-- Fix team_members without auth_role_id
-- This migration ensures all team_members are linked to a user account

-- Step 1: Check for team_members without auth_role_id
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM team_members
  WHERE auth_role_id IS NULL AND is_active = true;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % active team members without auth_role_id', orphaned_count;
  END IF;
END $$;

-- Step 2: For each organization, link team_members to the primary shared account
-- This finds the user_id from profiles for each organization and sets it as auth_role_id

UPDATE team_members tm
SET auth_role_id = (
  SELECT p.user_id
  FROM profiles p
  WHERE p.organization_id = tm.organization_id
  LIMIT 1
)
WHERE tm.auth_role_id IS NULL
  AND tm.is_active = true
  AND EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.organization_id = tm.organization_id
  );

-- Step 3: Add a check to ensure this doesn't happen again
-- Create a trigger to auto-assign auth_role_id when team_member is created

CREATE OR REPLACE FUNCTION auto_assign_auth_role_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If auth_role_id is not provided, try to find one from the organization
  IF NEW.auth_role_id IS NULL THEN
    SELECT p.user_id INTO NEW.auth_role_id
    FROM profiles p
    WHERE p.organization_id = NEW.organization_id
    LIMIT 1;
    
    -- Log if we couldn't find a user
    IF NEW.auth_role_id IS NULL THEN
      RAISE WARNING 'Cannot auto-assign auth_role_id for team_member %. No profiles found for organization_id %', 
        NEW.id, NEW.organization_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_assign_auth_role_id ON team_members;

-- Create trigger
CREATE TRIGGER trigger_auto_assign_auth_role_id
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_auth_role_id();

-- Step 4: Report results
DO $$
DECLARE
  fixed_count INTEGER;
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM team_members
  WHERE auth_role_id IS NOT NULL AND is_active = true;
  
  SELECT COUNT(*) INTO remaining_count
  FROM team_members
  WHERE auth_role_id IS NULL AND is_active = true;
  
  RAISE NOTICE 'Team members with auth_role_id: %', fixed_count;
  RAISE NOTICE 'Team members still without auth_role_id: %', remaining_count;
  
  IF remaining_count > 0 THEN
    RAISE NOTICE 'Some team members could not be linked. These organizations may not have user accounts yet.';
  END IF;
END $$;

-- Add comment
COMMENT ON TRIGGER trigger_auto_assign_auth_role_id ON team_members IS 
'Auto-assigns auth_role_id from organization profiles when creating team members';
