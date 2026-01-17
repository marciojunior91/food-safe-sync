-- ============================================================================
-- ROUTINE TASKS FIXES - Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add started_at column
ALTER TABLE routine_tasks 
ADD COLUMN IF NOT EXISTS started_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_routine_tasks_started_at 
ON routine_tasks(started_at);

COMMENT ON COLUMN routine_tasks.started_at IS 'Timestamp when the task was started (status changed to in_progress)';

-- 2. Make assigned_to NOT NULL with a default
-- First, update any existing NULL values to a default user or leave them
-- (You can skip this if you want to keep existing NULLs)

-- Then alter the column (uncomment when ready to enforce)
-- ALTER TABLE routine_tasks 
-- ALTER COLUMN assigned_to SET NOT NULL;

-- ============================================================================
-- DONE! Refresh your app and try starting a task
-- ============================================================================
