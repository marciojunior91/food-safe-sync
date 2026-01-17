-- ============================================================================
-- ADD TEAM_MEMBER_ID TO ROUTINE_TASKS TABLE
-- ============================================================================
-- This migration adds team_member_id column to routine_tasks table
-- to support direct assignment to team members instead of auth users.
--
-- Migration Strategy:
-- 1. Add team_member_id column (nullable initially)
-- 2. Create index for performance
-- 3. Update comments
-- 4. Keep assigned_to for backward compatibility (will be deprecated)
-- ============================================================================

-- Add team_member_id column to routine_tasks
ALTER TABLE routine_tasks 
ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_routine_tasks_team_member 
ON routine_tasks(team_member_id) 
WHERE team_member_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN routine_tasks.team_member_id IS 
'Team member assigned to this routine task. This is the preferred assignment method over assigned_to (auth user).';

-- ============================================================================
-- MIGRATION NOTE
-- ============================================================================
-- The routine_tasks table now supports both:
-- - assigned_to: UUID reference to profiles(user_id) - LEGACY, for backward compatibility
-- - team_member_id: UUID reference to team_members(id) - NEW, preferred method
--
-- Applications should use team_member_id for new tasks. The assigned_to field
-- is kept for backward compatibility and existing data.
--
-- In queries, prioritize team_member_id over assigned_to when displaying assignments.
-- ============================================================================
