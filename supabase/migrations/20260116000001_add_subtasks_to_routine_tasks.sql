-- ============================================================================
-- ADD SUBTASKS SUPPORT TO ROUTINE_TASKS
-- Date: January 16, 2026
-- ============================================================================
-- This migration adds a JSONB column to store subtasks as an array of objects
-- Subtasks structure: [{ id: string, title: string, completed: boolean }]
-- ============================================================================

-- Add subtasks column to routine_tasks
ALTER TABLE routine_tasks 
ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN routine_tasks.subtasks IS 
  'Array of subtask objects: [{ id: string, title: string, completed: boolean }]. Optional checklist for task completion.';

-- Create index for subtasks for performance (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_routine_tasks_subtasks 
  ON routine_tasks USING gin(subtasks);

-- Add validation function to ensure subtasks have correct structure
CREATE OR REPLACE FUNCTION validate_subtasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if subtasks is an array
  IF NEW.subtasks IS NOT NULL AND jsonb_typeof(NEW.subtasks) != 'array' THEN
    RAISE EXCEPTION 'subtasks must be a JSON array';
  END IF;
  
  -- Validate each subtask object has required fields
  IF NEW.subtasks IS NOT NULL THEN
    DECLARE
      subtask JSONB;
    BEGIN
      FOR subtask IN SELECT * FROM jsonb_array_elements(NEW.subtasks)
      LOOP
        -- Check for required fields
        IF NOT (subtask ? 'id' AND subtask ? 'title' AND subtask ? 'completed') THEN
          RAISE EXCEPTION 'Each subtask must have id, title, and completed fields';
        END IF;
        
        -- Check field types
        IF jsonb_typeof(subtask->'id') != 'string' THEN
          RAISE EXCEPTION 'Subtask id must be a string';
        END IF;
        
        IF jsonb_typeof(subtask->'title') != 'string' THEN
          RAISE EXCEPTION 'Subtask title must be a string';
        END IF;
        
        IF jsonb_typeof(subtask->'completed') != 'boolean' THEN
          RAISE EXCEPTION 'Subtask completed must be a boolean';
        END IF;
        
        -- Check that title is not empty
        IF LENGTH(subtask->>'title') = 0 THEN
          RAISE EXCEPTION 'Subtask title cannot be empty';
        END IF;
      END LOOP;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate subtasks before insert/update
DROP TRIGGER IF EXISTS trigger_validate_subtasks ON routine_tasks;
CREATE TRIGGER trigger_validate_subtasks
  BEFORE INSERT OR UPDATE ON routine_tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_subtasks();

-- ============================================================================
-- UTILITY FUNCTIONS FOR SUBTASKS
-- ============================================================================

-- Function to get completion percentage of subtasks
CREATE OR REPLACE FUNCTION get_subtasks_completion_percentage(task_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
BEGIN
  -- Get total number of subtasks
  SELECT jsonb_array_length(subtasks)
  INTO total_subtasks
  FROM routine_tasks
  WHERE id = task_id;
  
  -- If no subtasks, return 100%
  IF total_subtasks IS NULL OR total_subtasks = 0 THEN
    RETURN 100;
  END IF;
  
  -- Count completed subtasks
  SELECT COUNT(*)
  INTO completed_subtasks
  FROM routine_tasks rt,
       jsonb_array_elements(rt.subtasks) AS subtask
  WHERE rt.id = task_id
    AND (subtask->>'completed')::boolean = true;
  
  -- Return percentage
  RETURN (completed_subtasks * 100) / total_subtasks;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_subtasks_completion_percentage IS 
  'Returns the completion percentage of subtasks for a given task (0-100)';

-- ============================================================================
-- EXAMPLE USAGE (commented out)
-- ============================================================================

/*
-- Example: Insert task with subtasks
INSERT INTO routine_tasks (
  organization_id,
  title,
  task_type,
  scheduled_date,
  subtasks
) VALUES (
  'org-uuid',
  'Check refrigerators',
  'temperature',
  '2026-01-16',
  '[
    {"id": "uuid-1", "title": "Check main fridge", "completed": false},
    {"id": "uuid-2", "title": "Check freezer", "completed": false}
  ]'::jsonb
);

-- Example: Update subtask to completed
UPDATE routine_tasks
SET subtasks = jsonb_set(
  subtasks,
  '{0,completed}',
  'true'::jsonb
)
WHERE id = 'task-uuid';

-- Example: Get completion percentage
SELECT 
  id,
  title,
  get_subtasks_completion_percentage(id) as completion_percentage
FROM routine_tasks
WHERE id = 'task-uuid';
*/

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
-- To rollback this migration:
DROP TRIGGER IF EXISTS trigger_validate_subtasks ON routine_tasks;
DROP FUNCTION IF EXISTS validate_subtasks();
DROP FUNCTION IF EXISTS get_subtasks_completion_percentage(UUID);
DROP INDEX IF EXISTS idx_routine_tasks_subtasks;
ALTER TABLE routine_tasks DROP COLUMN IF EXISTS subtasks;
*/
