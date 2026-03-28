-- ============================================================================
-- Fix Routine Tasks RLS Policies
-- ============================================================================
-- Problem: SELECT policy used profiles.id = auth.uid() but profiles.id ≠ user_id.
--          Only a "Managers" ALL policy existed, but all users had role 'staff',
--          so nobody could INSERT/UPDATE/DELETE.
-- Fix:     Add proper per-operation policies using profiles.user_id = auth.uid().
-- ============================================================================

-- Fix SELECT policy (was broken: profiles.id instead of profiles.user_id)
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON routine_tasks;

CREATE POLICY "Users can view tasks in their organization"
ON routine_tasks
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Add INSERT policy for all org members
DROP POLICY IF EXISTS "Users can insert tasks in their organization" ON routine_tasks;

CREATE POLICY "Users can insert tasks in their organization"
ON routine_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Add UPDATE policy for all org members
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON routine_tasks;

CREATE POLICY "Users can update tasks in their organization"
ON routine_tasks
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Add DELETE policy for all org members
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON routine_tasks;

CREATE POLICY "Users can delete tasks in their organization"
ON routine_tasks
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);
