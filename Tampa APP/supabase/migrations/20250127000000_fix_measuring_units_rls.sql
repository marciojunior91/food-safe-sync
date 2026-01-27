-- Fix RLS policies for measuring_units to allow viewing global and org-specific units
-- Migration: 20250127000000_fix_measuring_units_rls.sql

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view measuring units" ON measuring_units;
DROP POLICY IF EXISTS "Admins can manage measuring units" ON measuring_units;

-- Create new SELECT policy that allows:
-- 1. Units from user's organization
-- 2. Global units (organization_id IS NULL)
CREATE POLICY "Users can view measuring units"
ON measuring_units FOR SELECT
TO authenticated
USING (
  organization_id IS NULL 
  OR 
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Create policy for admins to manage units
CREATE POLICY "Admins can manage measuring units"
ON measuring_units FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND ur.role IN ('leader_chef', 'owner', 'admin')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND ur.role IN ('leader_chef', 'owner', 'admin')
  )
);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'measuring_units'
ORDER BY policyname;
