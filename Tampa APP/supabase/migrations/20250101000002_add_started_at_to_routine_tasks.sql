-- ============================================================================
-- Add started_at column to routine_tasks table
-- ============================================================================

-- Add the started_at column to track when a task is started
ALTER TABLE routine_tasks 
ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_routine_tasks_started_at 
ON routine_tasks(started_at);

-- Comment for documentation
COMMENT ON COLUMN routine_tasks.started_at IS 'Timestamp when the task was started (status changed to in_progress)';
