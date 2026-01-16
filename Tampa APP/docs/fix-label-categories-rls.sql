-- ============================================================================
-- FIX RLS POLICIES FOR LABEL_CATEGORIES
-- ============================================================================
-- Issue: Categories exist but query returns empty array
-- Cause: Row Level Security (RLS) policy is blocking the query
-- Solution: Create/update RLS policies to allow users to view their org's categories
-- ============================================================================

-- Step 1: Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'label_categories';

-- Step 2: Check existing policies
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
WHERE tablename = 'label_categories';

-- Step 3: Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Users can view their organization's categories" ON label_categories;
DROP POLICY IF EXISTS "Users can view organization categories" ON label_categories;
DROP POLICY IF EXISTS "Enable read access for organization members" ON label_categories;

-- Step 4: Create correct RLS policy for SELECT
-- This allows users to view categories for their organization
CREATE POLICY "Users can view their organization's label categories"
ON label_categories
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Step 5: Create policy for INSERT (for administrators)
CREATE POLICY "Users can create categories for their organization"
ON label_categories
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Step 6: Create policy for UPDATE (for administrators)
CREATE POLICY "Users can update their organization's categories"
ON label_categories
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Step 7: Create policy for DELETE (for administrators)
CREATE POLICY "Users can delete their organization's categories"
ON label_categories
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Step 8: Ensure RLS is enabled
ALTER TABLE label_categories ENABLE ROW LEVEL SECURITY;

-- Step 9: Verify policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Allows viewing'
    WHEN cmd = 'INSERT' THEN 'Allows creating'
    WHEN cmd = 'UPDATE' THEN 'Allows editing'
    WHEN cmd = 'DELETE' THEN 'Allows deleting'
  END as description
FROM pg_policies
WHERE tablename = 'label_categories'
ORDER BY cmd;

-- Step 10: Test the policy
-- This should return 10 categories for your organization
SELECT 
  id,
  name,
  icon,
  organization_id
FROM label_categories
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY name;

-- Step 11: Verify your profile has the organization_id
SELECT 
  user_id,
  organization_id,
  display_name,
  email
FROM profiles
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- After running this script:
-- 1. RLS will be enabled on label_categories table
-- 2. Four policies will exist (SELECT, INSERT, UPDATE, DELETE)
-- 3. Users can view categories for their organization
-- 4. The query should return 10 categories
-- ============================================================================

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If still not working after this script:
--
-- Issue 1: User's profile doesn't have organization_id
-- Solution: Update profile with organization_id
UPDATE profiles 
SET organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
WHERE user_id = auth.uid();

-- Issue 2: Need to check if auth.uid() is working
-- Run this while logged in to see your user_id:
SELECT auth.uid() as my_user_id;

-- Issue 3: Verify profile-organization link
SELECT 
  p.user_id,
  p.organization_id,
  p.display_name,
  o.name as organization_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.user_id = auth.uid();

-- ============================================================================
-- FIX RLS POLICIES FOR LABEL_SUBCATEGORIES (SAME ISSUE)
-- ============================================================================

-- Step 1: Check if RLS is enabled on label_subcategories
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'label_subcategories';

-- Step 2: Check existing policies on label_subcategories
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
WHERE tablename = 'label_subcategories';

-- Step 3: Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Users can view their organization's subcategories" ON label_subcategories;
DROP POLICY IF EXISTS "Users can view organization subcategories" ON label_subcategories;
DROP POLICY IF EXISTS "Enable read access for organization members" ON label_subcategories;

-- Step 4: Create correct RLS policy for SELECT
CREATE POLICY "Users can view their organization's label subcategories"
ON label_subcategories
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Step 5: Create policy for INSERT
CREATE POLICY "Users can create subcategories for their organization"
ON label_subcategories
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Step 6: Create policy for UPDATE
CREATE POLICY "Users can update their organization's subcategories"
ON label_subcategories
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Step 7: Create policy for DELETE
CREATE POLICY "Users can delete their organization's subcategories"
ON label_subcategories
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- Step 8: Ensure RLS is enabled
ALTER TABLE label_subcategories ENABLE ROW LEVEL SECURITY;

-- Step 9: Verify subcategory policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Allows viewing'
    WHEN cmd = 'INSERT' THEN 'Allows creating'
    WHEN cmd = 'UPDATE' THEN 'Allows editing'
    WHEN cmd = 'DELETE' THEN 'Allows deleting'
  END as description
FROM pg_policies
WHERE tablename = 'label_subcategories'
ORDER BY cmd;

-- Step 10: Test the subcategories policy
-- This should return all subcategories for your organization
SELECT 
  ls.id,
  ls.name,
  ls.icon,
  lc.name as category_name,
  ls.display_order
FROM label_subcategories ls
LEFT JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY lc.name, ls.display_order;

-- ============================================================================
-- SUMMARY: BOTH TABLES NOW PROTECTED
-- ============================================================================
-- After running this complete script:
-- ✅ label_categories - 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- ✅ label_subcategories - 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Both tables have RLS enabled
-- ✅ Users can view/manage data for their organization only
-- ============================================================================
