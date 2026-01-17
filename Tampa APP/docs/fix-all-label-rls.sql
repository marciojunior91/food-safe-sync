-- ============================================================================
-- ALL-IN-ONE FIX: RLS for Categories AND Subcategories
-- ============================================================================
-- Run this complete script in Supabase SQL Editor to fix both tables
-- URL: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new
-- ============================================================================

-- ============================================================================
-- PART 1: FIX LABEL_CATEGORIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their organization's categories" ON label_categories;
DROP POLICY IF EXISTS "Users can view organization categories" ON label_categories;
DROP POLICY IF EXISTS "Enable read access for organization members" ON label_categories;

-- Create policies for label_categories
CREATE POLICY "Users can view their organization's label categories"
ON label_categories FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can create categories for their organization"
ON label_categories FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can update their organization's categories"
ON label_categories FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can delete their organization's categories"
ON label_categories FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE label_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: FIX LABEL_SUBCATEGORIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their organization's subcategories" ON label_subcategories;
DROP POLICY IF EXISTS "Users can view organization subcategories" ON label_subcategories;
DROP POLICY IF EXISTS "Enable read access for organization members" ON label_subcategories;

-- Create policies for label_subcategories
CREATE POLICY "Users can view their organization's label subcategories"
ON label_subcategories FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can create subcategories for their organization"
ON label_subcategories FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can update their organization's subcategories"
ON label_subcategories FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can delete their organization's subcategories"
ON label_subcategories FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE label_subcategories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check policies for both tables
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('label_categories', 'label_subcategories')
ORDER BY tablename, cmd;

-- Test categories query
SELECT 
  'Categories' as table_name,
  COUNT(*) as row_count
FROM label_categories
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'

UNION ALL

-- Test subcategories query
SELECT 
  'Subcategories' as table_name,
  COUNT(*) as row_count
FROM label_subcategories
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this without errors, then:
-- ✅ Both tables have RLS enabled
-- ✅ Both tables have 4 policies each (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Users can view/manage data for their organization only
-- 
-- Next: Refresh your browser and categories + subcategories should appear!
-- ============================================================================
