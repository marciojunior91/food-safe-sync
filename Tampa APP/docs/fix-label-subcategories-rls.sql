-- ============================================================================
-- QUICK FIX: RLS for label_subcategories
-- ============================================================================
-- Copy and paste this into Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new
-- ============================================================================

-- Drop old policies (if any)
DROP POLICY IF EXISTS "Users can view their organization's subcategories" ON label_subcategories;
DROP POLICY IF EXISTS "Users can view organization subcategories" ON label_subcategories;
DROP POLICY IF EXISTS "Enable read access for organization members" ON label_subcategories;

-- Create SELECT policy (viewing)
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

-- Create INSERT policy (creating)
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

-- Create UPDATE policy (editing)
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

-- Create DELETE policy (removing)
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

-- Enable RLS
ALTER TABLE label_subcategories ENABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'label_subcategories'
ORDER BY cmd;

-- Test query - should return subcategories
SELECT 
  ls.id,
  ls.name,
  ls.icon,
  lc.name as category_name
FROM label_subcategories ls
LEFT JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY lc.name, ls.display_order;
