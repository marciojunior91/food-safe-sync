-- ================================================================
-- RECURRING TASKS REFACTOR - Microsoft Teams Model
-- ================================================================
-- Migration: 20260221_recurring_tasks_refactor.sql
-- Author: GitHub Copilot
-- Date: 21/02/2026
-- Description: Refactor routine_tasks to support series + occurrences
--              Resolves TASKS-16 (recurring tasks bug) + adds advanced features
-- ================================================================

-- ================================================================
-- 1. CREATE NEW TABLES
-- ================================================================

-- Task Series (Parent/Template)
CREATE TABLE IF NOT EXISTS task_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  
  -- Assignment
  assigned_to UUID[] DEFAULT ARRAY[]::UUID[], -- Multiple assignees or "everyone"
  
  -- Estimation
  estimated_minutes INTEGER,
  
  -- Approval
  requires_approval BOOLEAN DEFAULT false,
  
  -- Recurrence Configuration
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN (
    'daily',           -- Every day
    'weekly',          -- Once a week (same day as start_date)
    'fortnightly',     -- Every 14 days
    'monthly',         -- Once a month (same day as start_date)
    'custom_days',     -- Every X days (customizable)
    'custom_weekdays', -- Specific weekdays (e.g., Mon/Wed/Fri)
    'custom_monthday'  -- Specific day of month (e.g., every 15th)
  )),
  
  -- Recurrence Parameters
  recurrence_interval INTEGER, -- For custom_days: "every X days"
  recurrence_weekdays INTEGER[], -- For custom_weekdays: [1,3,5] = Mon, Wed, Fri (0=Sun, 6=Sat)
  recurrence_monthday INTEGER CHECK (recurrence_monthday BETWEEN 1 AND 31), -- For custom_monthday
  
  -- Series Timeframe
  series_start_date DATE NOT NULL,
  series_end_date DATE, -- NULL = indefinite
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_task_type_series CHECK (task_type IN (
    'cleaning_daily',
    'cleaning_weekly',
    'temperature',
    'opening',
    'closing',
    'maintenance',
    'others'
  )),
  CONSTRAINT check_priority_series CHECK (priority IN ('critical', 'important', 'normal')),
  CONSTRAINT check_recurrence_interval CHECK (
    recurrence_type != 'custom_days' OR (recurrence_interval IS NOT NULL AND recurrence_interval > 0)
  ),
  CONSTRAINT check_recurrence_weekdays CHECK (
    recurrence_type != 'custom_weekdays' OR (recurrence_weekdays IS NOT NULL AND array_length(recurrence_weekdays, 1) > 0)
  ),
  CONSTRAINT check_recurrence_monthday CHECK (
    recurrence_type != 'custom_monthday' OR recurrence_monthday IS NOT NULL
  )
);

-- Task Occurrences (Instances)
CREATE TABLE IF NOT EXISTS task_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES task_series(id) ON DELETE CASCADE, -- NULL = one-time task
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  
  -- Scheduled Info
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  
  -- Task Details (can override series)
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  
  -- Assignment (can override series)
  assigned_to UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Estimation
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  
  -- Status
  status TEXT DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'in_progress',
    'completed',
    'skipped'
  )),
  
  -- Completion
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES profiles(id),
  
  -- Skip/Notes
  notes TEXT,
  skip_reason TEXT,
  
  -- Approval
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP,
  
  -- Subtasks (stored as JSONB array)
  subtasks JSONB DEFAULT '[]'::jsonb,
  -- Format: [
  --   {"id": "uuid", "title": "text", "completed": false, "order": 0, "created_by": "uuid"},
  --   {"id": "uuid", "title": "text", "completed": true, "order": 1, "created_by": "uuid"}
  -- ]
  
  -- Photos (stored as JSONB array of Supabase storage paths)
  photos JSONB DEFAULT '[]'::jsonb,
  -- Format: ["path/to/photo1.jpg", "path/to/photo2.jpg"]
  
  -- Modification Flag
  is_modified BOOLEAN DEFAULT false, -- True if this occurrence was edited separately from series
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_task_type_occurrence CHECK (task_type IN (
    'cleaning_daily',
    'cleaning_weekly',
    'temperature',
    'opening',
    'closing',
    'maintenance',
    'others'
  )),
  CONSTRAINT check_priority_occurrence CHECK (priority IN ('critical', 'important', 'normal'))
);

-- ================================================================
-- 2. CREATE INDEXES
-- ================================================================

-- Task Series Indexes
CREATE INDEX IF NOT EXISTS idx_task_series_org ON task_series(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_series_start_date ON task_series(series_start_date);
CREATE INDEX IF NOT EXISTS idx_task_series_recurrence ON task_series(recurrence_type);

-- Task Occurrences Indexes
CREATE INDEX IF NOT EXISTS idx_task_occurrences_series ON task_occurrences(series_id);
CREATE INDEX IF NOT EXISTS idx_task_occurrences_org ON task_occurrences(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_occurrences_date ON task_occurrences(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_task_occurrences_status ON task_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_task_occurrences_assigned ON task_occurrences USING GIN(assigned_to);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_task_occurrences_org_date ON task_occurrences(organization_id, scheduled_date);

-- ================================================================
-- 3. CREATE FUNCTIONS
-- ================================================================

-- Function to generate task occurrences for a series
CREATE OR REPLACE FUNCTION generate_task_occurrences(
  p_series_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_series task_series%ROWTYPE;
  v_current_date DATE;
  v_occurrences_created INTEGER := 0;
  v_day_of_week INTEGER;
  v_days_diff INTEGER;
BEGIN
  -- Get series info
  SELECT * INTO v_series FROM task_series WHERE id = p_series_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Series not found: %', p_series_id;
  END IF;
  
  -- Start from the later of series_start_date or p_start_date
  v_current_date := GREATEST(v_series.series_start_date, p_start_date);
  
  -- Loop through dates
  WHILE v_current_date <= p_end_date LOOP
    -- Check if series has ended
    IF v_series.series_end_date IS NOT NULL AND v_current_date > v_series.series_end_date THEN
      EXIT;
    END IF;
    
    -- Determine if we should create an occurrence on this date
    CASE v_series.recurrence_type
      WHEN 'daily' THEN
        -- Create occurrence every day
        INSERT INTO task_occurrences (
          series_id, organization_id, template_id,
          scheduled_date, title, description, task_type, priority,
          assigned_to, estimated_minutes, requires_approval
        ) VALUES (
          v_series.id, v_series.organization_id, v_series.template_id,
          v_current_date, v_series.title, v_series.description, 
          v_series.task_type, v_series.priority,
          v_series.assigned_to, v_series.estimated_minutes, v_series.requires_approval
        )
        ON CONFLICT DO NOTHING; -- Avoid duplicates
        
        v_occurrences_created := v_occurrences_created + 1;
        v_current_date := v_current_date + 1;
        
      WHEN 'weekly' THEN
        -- Create occurrence if same day of week as start_date
        IF EXTRACT(DOW FROM v_current_date) = EXTRACT(DOW FROM v_series.series_start_date) THEN
          INSERT INTO task_occurrences (
            series_id, organization_id, template_id,
            scheduled_date, title, description, task_type, priority,
            assigned_to, estimated_minutes, requires_approval
          ) VALUES (
            v_series.id, v_series.organization_id, v_series.template_id,
            v_current_date, v_series.title, v_series.description, 
            v_series.task_type, v_series.priority,
            v_series.assigned_to, v_series.estimated_minutes, v_series.requires_approval
          )
          ON CONFLICT DO NOTHING;
          
          v_occurrences_created := v_occurrences_created + 1;
        END IF;
        v_current_date := v_current_date + 1;
        
      WHEN 'fortnightly' THEN
        -- Create occurrence every 14 days from start_date
        v_days_diff := v_current_date - v_series.series_start_date;
        IF v_days_diff % 14 = 0 AND v_days_diff >= 0 THEN
          INSERT INTO task_occurrences (
            series_id, organization_id, template_id,
            scheduled_date, title, description, task_type, priority,
            assigned_to, estimated_minutes, requires_approval
          ) VALUES (
            v_series.id, v_series.organization_id, v_series.template_id,
            v_current_date, v_series.title, v_series.description, 
            v_series.task_type, v_series.priority,
            v_series.assigned_to, v_series.estimated_minutes, v_series.requires_approval
          )
          ON CONFLICT DO NOTHING;
          
          v_occurrences_created := v_occurrences_created + 1;
        END IF;
        v_current_date := v_current_date + 1;
        
      WHEN 'monthly' THEN
        -- Create occurrence if same day of month as start_date
        IF EXTRACT(DAY FROM v_current_date) = EXTRACT(DAY FROM v_series.series_start_date) THEN
          INSERT INTO task_occurrences (
            series_id, organization_id, template_id,
            scheduled_date, title, description, task_type, priority,
            assigned_to, estimated_minutes, requires_approval
          ) VALUES (
            v_series.id, v_series.organization_id, v_series.template_id,
            v_current_date, v_series.title, v_series.description, 
            v_series.task_type, v_series.priority,
            v_series.assigned_to, v_series.estimated_minutes, v_series.requires_approval
          )
          ON CONFLICT DO NOTHING;
          
          v_occurrences_created := v_occurrences_created + 1;
        END IF;
        v_current_date := v_current_date + 1;
        
      WHEN 'custom_days' THEN
        -- Create occurrence every X days
        v_days_diff := v_current_date - v_series.series_start_date;
        IF v_days_diff % v_series.recurrence_interval = 0 AND v_days_diff >= 0 THEN
          INSERT INTO task_occurrences (
            series_id, organization_id, template_id,
            scheduled_date, title, description, task_type, priority,
            assigned_to, estimated_minutes, requires_approval
          ) VALUES (
            v_series.id, v_series.organization_id, v_series.template_id,
            v_current_date, v_series.title, v_series.description, 
            v_series.task_type, v_series.priority,
            v_series.assigned_to, v_series.estimated_minutes, v_series.requires_approval
          )
          ON CONFLICT DO NOTHING;
          
          v_occurrences_created := v_occurrences_created + 1;
        END IF;
        v_current_date := v_current_date + 1;
        
      WHEN 'custom_weekdays' THEN
        -- Create occurrence if current day of week is in the array
        v_day_of_week := EXTRACT(DOW FROM v_current_date)::INTEGER;
        IF v_day_of_week = ANY(v_series.recurrence_weekdays) THEN
          INSERT INTO task_occurrences (
            series_id, organization_id, template_id,
            scheduled_date, title, description, task_type, priority,
            assigned_to, estimated_minutes, requires_approval
          ) VALUES (
            v_series.id, v_series.organization_id, v_series.template_id,
            v_current_date, v_series.title, v_series.description, 
            v_series.task_type, v_series.priority,
            v_series.assigned_to, v_series.estimated_minutes, v_series.requires_approval
          )
          ON CONFLICT DO NOTHING;
          
          v_occurrences_created := v_occurrences_created + 1;
        END IF;
        v_current_date := v_current_date + 1;
        
      WHEN 'custom_monthday' THEN
        -- Create occurrence if day of month matches
        IF EXTRACT(DAY FROM v_current_date) = v_series.recurrence_monthday THEN
          INSERT INTO task_occurrences (
            series_id, organization_id, template_id,
            scheduled_date, title, description, task_type, priority,
            assigned_to, estimated_minutes, requires_approval
          ) VALUES (
            v_series.id, v_series.organization_id, v_series.template_id,
            v_current_date, v_series.title, v_series.description, 
            v_series.task_type, v_series.priority,
            v_series.assigned_to, v_series.estimated_minutes, v_series.requires_approval
          )
          ON CONFLICT DO NOTHING;
          
          v_occurrences_created := v_occurrences_created + 1;
        END IF;
        v_current_date := v_current_date + 1;
        
      ELSE
        RAISE EXCEPTION 'Unknown recurrence type: %', v_series.recurrence_type;
    END CASE;
  END LOOP;
  
  RETURN v_occurrences_created;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 4. UPDATE TRIGGER
-- ================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_series_updated_at
  BEFORE UPDATE ON task_series
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

CREATE TRIGGER task_occurrences_updated_at
  BEFORE UPDATE ON task_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

-- ================================================================
-- 5. RLS POLICIES
-- ================================================================

-- Enable RLS
ALTER TABLE task_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_occurrences ENABLE ROW LEVEL SECURITY;

-- Task Series Policies
CREATE POLICY "Users can view task series from their organization"
  ON task_series FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create task series for their organization"
  ON task_series FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update task series from their organization"
  ON task_series FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete task series from their organization"
  ON task_series FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Task Occurrences Policies
CREATE POLICY "Users can view task occurrences from their organization"
  ON task_occurrences FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create task occurrences for their organization"
  ON task_occurrences FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update task occurrences from their organization"
  ON task_occurrences FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete task occurrences from their organization"
  ON task_occurrences FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ================================================================
-- 6. MIGRATION COMMENTS
-- ================================================================

COMMENT ON TABLE task_series IS 'Parent/template for recurring tasks (Microsoft Teams model)';
COMMENT ON TABLE task_occurrences IS 'Individual instances of tasks (one-time or from series)';

COMMENT ON COLUMN task_series.recurrence_type IS 'Type of recurrence: daily, weekly, fortnightly, monthly, custom_days, custom_weekdays, custom_monthday';
COMMENT ON COLUMN task_series.recurrence_interval IS 'For custom_days: repeat every X days';
COMMENT ON COLUMN task_series.recurrence_weekdays IS 'For custom_weekdays: array of days (0=Sun, 1=Mon, ..., 6=Sat)';
COMMENT ON COLUMN task_series.recurrence_monthday IS 'For custom_monthday: specific day of month (1-31)';

COMMENT ON COLUMN task_occurrences.series_id IS 'NULL = one-time task, UUID = part of recurring series';
COMMENT ON COLUMN task_occurrences.is_modified IS 'True if this occurrence was edited separately from series';
COMMENT ON COLUMN task_occurrences.subtasks IS 'JSONB array of subtasks with id, title, completed, order';
COMMENT ON COLUMN task_occurrences.photos IS 'JSONB array of photo URLs from Supabase storage';

-- ================================================================
-- 7. GRANT PERMISSIONS
-- ================================================================

-- Grant usage on tables (if using service role)
-- GRANT ALL ON task_series TO authenticated;
-- GRANT ALL ON task_occurrences TO authenticated;

-- ================================================================
-- END OF MIGRATION
-- ================================================================

-- To apply this migration:
-- 1. Run this SQL file in Supabase SQL Editor
-- 2. Run data migration script (separate file)
-- 3. Test with existing data
-- 4. Update application code to use new tables
-- 5. Deprecate old routine_tasks table (keep for rollback)
