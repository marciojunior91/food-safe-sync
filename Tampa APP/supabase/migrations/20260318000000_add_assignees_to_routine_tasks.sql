-- Migration: Add assignees array column to routine_tasks
-- Purpose: Support one task shared by multiple team members instead of N separate tasks

ALTER TABLE public.routine_tasks
  ADD COLUMN IF NOT EXISTS assignees JSONB DEFAULT '[]'::jsonb;

-- Comment describing the column
COMMENT ON COLUMN public.routine_tasks.assignees IS 
  'Array of team_member UUIDs assigned to this shared task. Used instead of creating one task per user.';

-- Backfill: copy existing team_member_id into assignees array for all tasks that have it
UPDATE public.routine_tasks
SET assignees = jsonb_build_array(team_member_id)
WHERE team_member_id IS NOT NULL
  AND (assignees IS NULL OR assignees = '[]'::jsonb);
