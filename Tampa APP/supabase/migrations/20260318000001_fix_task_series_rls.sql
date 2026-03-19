-- ================================================================
-- Fix RLS policies for task_series and task_occurrences
-- ================================================================
-- Problem: original policies used:
--   auth_role_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
-- But profiles.id is the PK (profile UUID), not the auth UID.
-- auth.uid() matches profiles.user_id, not profiles.id.
-- Fix: use the same pattern as routine_tasks (which works):
--   organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
-- ================================================================

-- ── task_series ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view task series from their organization"    ON task_series;
DROP POLICY IF EXISTS "Users can create task series for their organization"   ON task_series;
DROP POLICY IF EXISTS "Users can update task series from their organization"  ON task_series;
DROP POLICY IF EXISTS "Users can delete task series from their organization"  ON task_series;

CREATE POLICY "Users can view task series from their organization"
  ON task_series FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create task series for their organization"
  ON task_series FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update task series from their organization"
  ON task_series FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task series from their organization"
  ON task_series FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ── task_occurrences ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view task occurrences from their organization"   ON task_occurrences;
DROP POLICY IF EXISTS "Users can create task occurrences for their organization"  ON task_occurrences;
DROP POLICY IF EXISTS "Users can update task occurrences from their organization" ON task_occurrences;
DROP POLICY IF EXISTS "Users can delete task occurrences from their organization" ON task_occurrences;

CREATE POLICY "Users can view task occurrences from their organization"
  ON task_occurrences FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create task occurrences for their organization"
  ON task_occurrences FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update task occurrences from their organization"
  ON task_occurrences FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task occurrences from their organization"
  ON task_occurrences FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );
