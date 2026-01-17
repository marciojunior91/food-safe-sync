-- ============================================================================
-- TASK ACTIVITY HISTORY TRACKING SYSTEM
-- ============================================================================
-- Creates comprehensive activity logging for routine_tasks
-- Tracks: creation, status changes, assignments, updates, notes, deletions
-- Applied: January 15, 2026
-- ============================================================================

-- ============================================================================
-- Step 1: Create task_activity_log table
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'created',
    'status_changed',
    'assignment_changed',
    'priority_changed',
    'due_date_changed',
    'title_updated',
    'description_updated',
    'note_added',
    'attachment_added',
    'attachment_removed',
    'deleted'
  )),
  
  -- Who performed the action
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name TEXT, -- Cached name for display
  
  -- Change tracking
  field_name TEXT, -- Which field changed (e.g., 'status', 'assigned_to')
  old_value TEXT, -- Previous value (as JSON string if complex)
  new_value TEXT, -- New value (as JSON string if complex)
  
  -- Additional context
  notes TEXT, -- Optional notes or description of the change
  metadata JSONB DEFAULT '{}', -- Additional data as needed
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_activity_log_task_id ON task_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_log_organization_id ON task_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_log_activity_type ON task_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_task_activity_log_created_at ON task_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_log_performed_by ON task_activity_log(performed_by);

-- Add helpful comments
COMMENT ON TABLE task_activity_log IS 'Tracks all changes and activities on routine tasks';
COMMENT ON COLUMN task_activity_log.activity_type IS 'Type of activity: created, status_changed, assignment_changed, etc.';
COMMENT ON COLUMN task_activity_log.performed_by IS 'User ID who performed the action';
COMMENT ON COLUMN task_activity_log.performed_by_name IS 'Cached display name for performance';
COMMENT ON COLUMN task_activity_log.field_name IS 'Name of the field that changed';
COMMENT ON COLUMN task_activity_log.old_value IS 'Previous value before change';
COMMENT ON COLUMN task_activity_log.new_value IS 'New value after change';

-- ============================================================================
-- Step 2: Enable RLS (Row Level Security)
-- ============================================================================
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activity logs for tasks in their organization
CREATE POLICY "Users can view activity logs for their organization"
ON task_activity_log
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Policy: Users can create activity logs for their organization
CREATE POLICY "Users can create activity logs for their organization"
ON task_activity_log
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- ============================================================================
-- Step 3: Create trigger function to log task creation
-- ============================================================================
CREATE OR REPLACE FUNCTION log_task_creation()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  creator_id UUID;
BEGIN
  -- Try to get creator from auth.uid() (current user creating the task)
  creator_id := auth.uid();
  
  -- Get the user's display name from team_member
  SELECT display_name INTO user_name
  FROM team_members
  WHERE id = NEW.team_member_id
  LIMIT 1;
  
  -- If not found in team_members, try profiles with current user
  IF user_name IS NULL AND creator_id IS NOT NULL THEN
    SELECT display_name INTO user_name
    FROM profiles
    WHERE user_id = creator_id
    LIMIT 1;
  END IF;
  
  -- Log the creation
  INSERT INTO task_activity_log (
    task_id,
    organization_id,
    activity_type,
    performed_by,
    performed_by_name,
    notes
  ) VALUES (
    NEW.id,
    NEW.organization_id,
    'created',
    creator_id,  -- Use auth.uid() instead of NEW.created_by
    COALESCE(user_name, 'System'),
    'Task created: ' || NEW.title
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 4: Create trigger function to log task updates
-- ============================================================================
CREATE OR REPLACE FUNCTION log_task_updates()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  activity_type_val TEXT;
BEGIN
  -- Get the user's display name
  SELECT display_name INTO user_name
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Check what changed and log it
  
  -- Status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_activity_log (
      task_id,
      organization_id,
      activity_type,
      performed_by,
      performed_by_name,
      field_name,
      old_value,
      new_value,
      notes
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      'status_changed',
      auth.uid(),
      COALESCE(user_name, 'System'),
      'status',
      OLD.status::TEXT,
      NEW.status::TEXT,
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  
  -- Assignment changed
  IF OLD.team_member_id IS DISTINCT FROM NEW.team_member_id THEN
    DECLARE
      old_member_name TEXT;
      new_member_name TEXT;
    BEGIN
      SELECT display_name INTO old_member_name FROM team_members WHERE id = OLD.team_member_id;
      SELECT display_name INTO new_member_name FROM team_members WHERE id = NEW.team_member_id;
      
      INSERT INTO task_activity_log (
        task_id,
        organization_id,
        activity_type,
        performed_by,
        performed_by_name,
        field_name,
        old_value,
        new_value,
        notes
      ) VALUES (
        NEW.id,
        NEW.organization_id,
        'assignment_changed',
        auth.uid(),
        COALESCE(user_name, 'System'),
        'team_member_id',
        OLD.team_member_id::TEXT,
        NEW.team_member_id::TEXT,
        'Task reassigned from ' || COALESCE(old_member_name, 'Unassigned') || 
        ' to ' || COALESCE(new_member_name, 'Unassigned')
      );
    END;
  END IF;
  
  -- Priority changed
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO task_activity_log (
      task_id,
      organization_id,
      activity_type,
      performed_by,
      performed_by_name,
      field_name,
      old_value,
      new_value,
      notes
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      'priority_changed',
      auth.uid(),
      COALESCE(user_name, 'System'),
      'priority',
      OLD.priority::TEXT,
      NEW.priority::TEXT,
      'Priority changed from ' || OLD.priority || ' to ' || NEW.priority
    );
  END IF;
  
  -- Due date changed
  IF OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date THEN
    INSERT INTO task_activity_log (
      task_id,
      organization_id,
      activity_type,
      performed_by,
      performed_by_name,
      field_name,
      old_value,
      new_value,
      notes
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      'due_date_changed',
      auth.uid(),
      COALESCE(user_name, 'System'),
      'scheduled_date',
      OLD.scheduled_date::TEXT,
      NEW.scheduled_date::TEXT,
      'Due date changed from ' || OLD.scheduled_date || ' to ' || NEW.scheduled_date
    );
  END IF;
  
  -- Title updated
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO task_activity_log (
      task_id,
      organization_id,
      activity_type,
      performed_by,
      performed_by_name,
      field_name,
      old_value,
      new_value,
      notes
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      'title_updated',
      auth.uid(),
      COALESCE(user_name, 'System'),
      'title',
      OLD.title,
      NEW.title,
      'Title updated'
    );
  END IF;
  
  -- Description updated
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO task_activity_log (
      task_id,
      organization_id,
      activity_type,
      performed_by,
      performed_by_name,
      field_name,
      old_value,
      new_value,
      notes
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      'description_updated',
      auth.uid(),
      COALESCE(user_name, 'System'),
      'description',
      LEFT(OLD.description, 100), -- Truncate for storage
      LEFT(NEW.description, 100),
      'Description updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 5: Create triggers
-- ============================================================================

-- Trigger for task creation
DROP TRIGGER IF EXISTS trigger_log_task_creation ON routine_tasks;
CREATE TRIGGER trigger_log_task_creation
  AFTER INSERT ON routine_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_creation();

-- Trigger for task updates
DROP TRIGGER IF EXISTS trigger_log_task_updates ON routine_tasks;
CREATE TRIGGER trigger_log_task_updates
  AFTER UPDATE ON routine_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_updates();

-- ============================================================================
-- Step 6: Create helper function to get task activity
-- ============================================================================
CREATE OR REPLACE FUNCTION get_task_activity(
  p_task_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  performed_by_name TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tal.id,
    tal.activity_type::TEXT,
    tal.performed_by_name,
    tal.field_name,
    tal.old_value,
    tal.new_value,
    tal.notes,
    tal.created_at
  FROM task_activity_log tal
  WHERE tal.task_id = p_task_id
  ORDER BY tal.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 7: Verification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_activity_log') THEN
    RAISE NOTICE '✅ SUCCESS: task_activity_log table created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_task_creation') THEN
    RAISE NOTICE '✅ SUCCESS: Creation trigger installed';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_task_updates') THEN
    RAISE NOTICE '✅ SUCCESS: Update trigger installed';
  END IF;
END $$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- Get activity for a specific task:
-- SELECT * FROM get_task_activity('task-uuid-here');

-- Get all activities for an organization:
-- SELECT * FROM task_activity_log 
-- WHERE organization_id = 'org-uuid-here' 
-- ORDER BY created_at DESC;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trigger_log_task_creation ON routine_tasks;
-- DROP TRIGGER IF EXISTS trigger_log_task_updates ON routine_tasks;
-- DROP FUNCTION IF EXISTS log_task_creation();
-- DROP FUNCTION IF EXISTS log_task_updates();
-- DROP FUNCTION IF EXISTS get_task_activity(UUID, INTEGER);
-- DROP TABLE IF EXISTS task_activity_log CASCADE;
-- ============================================================================
