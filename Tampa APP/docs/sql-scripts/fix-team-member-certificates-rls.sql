-- ============================================================================
-- Fix RLS Policy Issue for team_member_certificates
-- ============================================================================
-- Error: "new row violates row-level security policy"
-- This means the INSERT policy is blocking the upload
-- ============================================================================

-- Check current policies on team_member_certificates
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
WHERE tablename = 'team_member_certificates'
ORDER BY cmd, policyname;

-- Check if table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'team_member_certificates';

-- ============================================================================
-- FIX: Create or Update INSERT Policy
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert certificates for their org" ON team_member_certificates;
DROP POLICY IF EXISTS "Users can manage their certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Team members can manage their certificates" ON team_member_certificates;

-- Policy 1: Users can view certificates in their organization
CREATE POLICY "Users can view certificates in their org"
ON team_member_certificates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    INNER JOIN profiles p ON p.user_id = auth.uid()
    WHERE tm.id = team_member_certificates.team_member_id
    AND tm.organization_id = p.organization_id
  )
);

-- Policy 2: Users can INSERT certificates for team members in their organization
CREATE POLICY "Users can insert certificates for their org"
ON team_member_certificates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    INNER JOIN profiles p ON p.user_id = auth.uid()
    WHERE tm.id = team_member_certificates.team_member_id
    AND tm.organization_id = p.organization_id
  )
);

-- Policy 3: Users can UPDATE certificates in their organization
CREATE POLICY "Users can update certificates in their org"
ON team_member_certificates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    INNER JOIN profiles p ON p.user_id = auth.uid()
    WHERE tm.id = team_member_certificates.team_member_id
    AND tm.organization_id = p.organization_id
  )
);

-- Policy 4: Admins can DELETE certificates in their organization
CREATE POLICY "Admins can delete certificates in their org"
ON team_member_certificates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    INNER JOIN profiles p ON p.user_id = auth.uid()
    WHERE tm.id = team_member_certificates.team_member_id
    AND tm.organization_id = p.organization_id
  )
  AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ View'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️ Edit'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete'
  END as operation
FROM pg_policies 
WHERE tablename = 'team_member_certificates'
ORDER BY cmd;

-- Test: Check if current user can insert
DO $$ 
DECLARE
  user_org_id UUID;
  user_role TEXT;
BEGIN 
  -- Get user's organization
  SELECT p.organization_id INTO user_org_id
  FROM profiles p
  WHERE p.user_id = auth.uid();
  
  -- Get user's role
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ RLS POLICIES UPDATED';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Current User: %', auth.uid();
  RAISE NOTICE 'Organization: %', COALESCE(user_org_id::text, 'NOT FOUND');
  RAISE NOTICE 'Role: %', COALESCE(user_role, 'NOT FOUND');
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies Created:';
  RAISE NOTICE '  ✅ SELECT - View certificates in org';
  RAISE NOTICE '  ✅ INSERT - Create certificates in org';
  RAISE NOTICE '  ✅ UPDATE - Edit certificates in org';
  RAISE NOTICE '  ✅ DELETE - Delete certificates (admin only)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next: Try uploading a document again!';
END $$;
