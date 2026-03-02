-- ================================================================
-- DATA MIGRATION - Routine Tasks → Task Series + Occurrences
-- ================================================================
-- Migration: 20260221_migrate_routine_tasks_data.sql
-- Author: GitHub Copilot
-- Date: 21/02/2026
-- Description: Migrate existing routine_tasks data to new schema
-- IMPORTANT: Run AFTER 20260221_recurring_tasks_refactor.sql
-- ================================================================

-- ================================================================
-- STEP 1: Identify Recurring vs One-Time Tasks
-- ================================================================

-- Check current data structure
DO $$
DECLARE
  v_total_tasks INTEGER;
  v_recurring_tasks INTEGER;
  v_onetime_tasks INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_tasks FROM routine_tasks;
  
  SELECT COUNT(*) INTO v_recurring_tasks 
  FROM routine_tasks 
  WHERE recurrence_pattern IS NOT NULL;
  
  v_onetime_tasks := v_total_tasks - v_recurring_tasks;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'MIGRATION PRE-CHECK';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total tasks: %', v_total_tasks;
  RAISE NOTICE 'Recurring tasks: %', v_recurring_tasks;
  RAISE NOTICE 'One-time tasks: %', v_onetime_tasks;
  RAISE NOTICE '====================================';
END $$;

-- ================================================================
-- STEP 2: Map Old recurrence_pattern to New recurrence_type
-- ================================================================

-- Analysis of existing recurrence_pattern format
-- Expected format: {"frequency": "daily" | "weekly" | "biweekly" | "monthly"}
-- OR custom format with additional fields

-- ================================================================
-- STEP 3: Migrate Recurring Tasks → Task Series
-- ================================================================

INSERT INTO task_series (
  id,
  organization_id,
  template_id,
  title,
  description,
  task_type,
  priority,
  assigned_to,
  estimated_minutes,
  requires_approval,
  recurrence_type,
  recurrence_interval,
  recurrence_weekdays,
  recurrence_monthday,
  series_start_date,
  series_end_date,
  created_at,
  created_by
)
SELECT 
  gen_random_uuid() AS id, -- New UUID for series
  rt.organization_id,
  rt.template_id,
  rt.title,
  rt.description,
  rt.task_type,
  rt.priority,
  
  -- Convert single assigned_to to array
  CASE 
    WHEN rt.assigned_to IS NOT NULL THEN ARRAY[rt.assigned_to]::UUID[]
    ELSE ARRAY[]::UUID[]
  END AS assigned_to,
  
  rt.estimated_minutes,
  rt.requires_approval,
  
  -- Map frequency to recurrence_type
  CASE 
    WHEN rt.recurrence_pattern->>'frequency' = 'daily' THEN 'daily'
    WHEN rt.recurrence_pattern->>'frequency' = 'weekly' THEN 'weekly'
    WHEN rt.recurrence_pattern->>'frequency' = 'biweekly' THEN 'fortnightly' -- Renamed!
    WHEN rt.recurrence_pattern->>'frequency' = 'monthly' THEN 'monthly'
    ELSE 'daily' -- Default fallback
  END AS recurrence_type,
  
  -- Recurrence interval (for custom_days)
  CASE 
    WHEN rt.recurrence_pattern->>'frequency' = 'biweekly' THEN 14
    WHEN rt.recurrence_pattern->>'interval' IS NOT NULL 
      THEN (rt.recurrence_pattern->>'interval')::INTEGER
    ELSE NULL
  END AS recurrence_interval,
  
  -- Recurrence weekdays (extract if exists)
  CASE 
    WHEN rt.recurrence_pattern->'weekdays' IS NOT NULL 
      THEN ARRAY(
        SELECT jsonb_array_elements_text(rt.recurrence_pattern->'weekdays')::INTEGER
      )
    ELSE NULL
  END AS recurrence_weekdays,
  
  -- Recurrence monthday (extract if exists)
  CASE 
    WHEN rt.recurrence_pattern->>'monthday' IS NOT NULL 
      THEN (rt.recurrence_pattern->>'monthday')::INTEGER
    ELSE NULL
  END AS recurrence_monthday,
  
  -- Series start date (use scheduled_date as reference)
  rt.scheduled_date AS series_start_date,
  
  -- No end date (indefinite)
  NULL AS series_end_date,
  
  rt.created_at,
  
  -- Try to get creator from completed_by or approved_by (only if exists in profiles)
  (
    SELECT id FROM profiles 
    WHERE id IN (rt.completed_by, rt.approved_by)
    LIMIT 1
  ) AS created_by

FROM routine_tasks rt
WHERE rt.recurrence_pattern IS NOT NULL -- Only recurring tasks
ON CONFLICT DO NOTHING;

-- Log migration results
DO $$
DECLARE
  v_migrated_series INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_migrated_series FROM task_series;
  RAISE NOTICE 'Migrated % task series', v_migrated_series;
END $$;

-- ================================================================
-- STEP 4: Migrate All Tasks → Task Occurrences
-- ================================================================

-- Create a temporary mapping table to link old task IDs to new series IDs
CREATE TEMP TABLE IF NOT EXISTS task_migration_map (
  old_task_id UUID,
  new_series_id UUID,
  is_recurring BOOLEAN
);

-- Populate mapping for recurring tasks
-- (Match by organization_id, title, task_type, scheduled_date)
INSERT INTO task_migration_map (old_task_id, new_series_id, is_recurring)
SELECT 
  rt.id AS old_task_id,
  ts.id AS new_series_id,
  TRUE AS is_recurring
FROM routine_tasks rt
INNER JOIN task_series ts ON (
  rt.organization_id = ts.organization_id
  AND rt.title = ts.title
  AND rt.task_type = ts.task_type
  AND rt.scheduled_date = ts.series_start_date
)
WHERE rt.recurrence_pattern IS NOT NULL;

-- Now migrate ALL tasks to task_occurrences
INSERT INTO task_occurrences (
  id,
  series_id,
  organization_id,
  template_id,
  scheduled_date,
  scheduled_time,
  title,
  description,
  task_type,
  priority,
  assigned_to,
  estimated_minutes,
  actual_minutes,
  status,
  completed_at,
  completed_by,
  notes,
  skip_reason,
  requires_approval,
  approved_by,
  approved_at,
  subtasks,
  photos,
  is_modified,
  created_at,
  updated_at
)
SELECT 
  rt.id AS id, -- Keep original ID for traceability
  
  -- Link to series if recurring, NULL if one-time
  (SELECT new_series_id FROM task_migration_map WHERE old_task_id = rt.id) AS series_id,
  
  rt.organization_id,
  rt.template_id,
  rt.scheduled_date,
  rt.scheduled_time,
  rt.title,
  rt.description,
  rt.task_type,
  rt.priority,
  
  -- Convert single assigned_to to array
  CASE 
    WHEN rt.assigned_to IS NOT NULL THEN ARRAY[rt.assigned_to]::UUID[]
    ELSE ARRAY[]::UUID[]
  END AS assigned_to,
  
  rt.estimated_minutes,
  rt.actual_minutes,
  rt.status,
  rt.completed_at,
  
  -- Only use completed_by if it exists in profiles
  (SELECT id FROM profiles WHERE id = rt.completed_by) AS completed_by,
  
  rt.notes,
  rt.skip_reason,
  rt.requires_approval,
  
  -- Only use approved_by if it exists in profiles
  (SELECT id FROM profiles WHERE id = rt.approved_by) AS approved_by,
  
  rt.approved_at,
  
  -- Subtasks: empty array for now (will be populated later if needed)
  '[]'::jsonb AS subtasks,
  
  -- Photos: empty array for now
  '[]'::jsonb AS photos,
  
  -- Mark as not modified (original occurrence)
  FALSE AS is_modified,
  
  rt.created_at,
  rt.updated_at

FROM routine_tasks rt
ON CONFLICT (id) DO NOTHING;

-- Log migration results
DO $$
DECLARE
  v_migrated_occurrences INTEGER;
  v_recurring_occurrences INTEGER;
  v_onetime_occurrences INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_migrated_occurrences FROM task_occurrences;
  
  SELECT COUNT(*) INTO v_recurring_occurrences 
  FROM task_occurrences 
  WHERE series_id IS NOT NULL;
  
  v_onetime_occurrences := v_migrated_occurrences - v_recurring_occurrences;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'MIGRATION RESULTS';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total occurrences migrated: %', v_migrated_occurrences;
  RAISE NOTICE 'Recurring occurrences: %', v_recurring_occurrences;
  RAISE NOTICE 'One-time occurrences: %', v_onetime_occurrences;
  RAISE NOTICE '====================================';
END $$;

-- ================================================================
-- STEP 5: Generate Future Occurrences (Next 30 Days)
-- ================================================================

-- For each series, generate occurrences for the next 30 days
DO $$
DECLARE
  v_series_record RECORD;
  v_occurrences_created INTEGER;
  v_total_created INTEGER := 0;
BEGIN
  FOR v_series_record IN 
    SELECT id FROM task_series
  LOOP
    SELECT generate_task_occurrences(
      v_series_record.id,
      CURRENT_DATE,
      (CURRENT_DATE + INTERVAL '30 days')::DATE
    ) INTO v_occurrences_created;
    
    v_total_created := v_total_created + v_occurrences_created;
    
    RAISE NOTICE 'Series %: created % future occurrences', 
      v_series_record.id, v_occurrences_created;
  END LOOP;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total future occurrences created: %', v_total_created;
  RAISE NOTICE '====================================';
END $$;

-- ================================================================
-- STEP 6: Validation
-- ================================================================

-- Check for data integrity
DO $$
DECLARE
  v_orphan_occurrences INTEGER;
  v_missing_org INTEGER;
BEGIN
  -- Check for orphaned occurrences (series_id not in task_series)
  SELECT COUNT(*) INTO v_orphan_occurrences
  FROM task_occurrences
  WHERE series_id IS NOT NULL 
    AND series_id NOT IN (SELECT id FROM task_series);
  
  -- Check for missing organization_id
  SELECT COUNT(*) INTO v_missing_org
  FROM task_occurrences
  WHERE organization_id IS NULL;
  
  IF v_orphan_occurrences > 0 THEN
    RAISE WARNING 'Found % orphaned occurrences!', v_orphan_occurrences;
  END IF;
  
  IF v_missing_org > 0 THEN
    RAISE WARNING 'Found % occurrences with missing organization_id!', v_missing_org;
  END IF;
  
  IF v_orphan_occurrences = 0 AND v_missing_org = 0 THEN
    RAISE NOTICE 'Data validation: PASSED ✓';
  END IF;
END $$;

-- ================================================================
-- STEP 7: Cleanup
-- ================================================================

-- Drop temporary mapping table
DROP TABLE IF EXISTS task_migration_map;

-- ================================================================
-- STEP 8: ROLLBACK PLAN (if needed)
-- ================================================================

-- DO NOT DROP routine_tasks table yet!
-- Keep it as backup for rollback
-- Can be dropped after successful migration + testing (1-2 weeks)

COMMENT ON TABLE routine_tasks IS 'DEPRECATED - Migrated to task_series + task_occurrences. Keep for rollback. Can drop after 2026-03-07.';

-- ================================================================
-- END OF DATA MIGRATION
-- ================================================================

-- Next steps:
-- 1. Verify data in Supabase dashboard
-- 2. Test queries on new tables
-- 3. Update application code
-- 4. Test in staging environment
-- 5. Deploy to production
-- 6. Monitor for 1-2 weeks
-- 7. Drop routine_tasks table (after confirmation)
