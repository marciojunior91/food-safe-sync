-- Fix allergens INSERT RLS policy
-- Problem: The "Managers can manage allergens" policy references 'owner' role
-- which doesn't exist in the app_role enum (admin | manager | staff).
-- This causes all INSERTs to fail with "new row violates row-level security policy".

-- Drop the broken policy
DROP POLICY IF EXISTS "Managers can manage allergens" ON public.allergens;

-- Recreate as separate policies for clarity

-- INSERT: admin and manager can create allergens
CREATE POLICY "allergens_insert"
  ON public.allergens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );

-- UPDATE: admin and manager can update allergens
CREATE POLICY "allergens_update"
  ON public.allergens
  FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );

-- DELETE: admin and manager can delete allergens
CREATE POLICY "allergens_delete"
  ON public.allergens
  FOR DELETE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );
