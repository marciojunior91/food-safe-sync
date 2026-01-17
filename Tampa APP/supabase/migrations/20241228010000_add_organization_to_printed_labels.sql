-- ============================================================================
-- Add organization_id to printed_labels table
-- Date: December 28, 2025
-- ============================================================================
-- This migration adds organization_id column to printed_labels table,
-- updates existing records, and adds appropriate RLS policies
-- ============================================================================

-- ============================================================================
-- 1. ADD ORGANIZATION_ID COLUMN TO PRINTED_LABELS
-- ============================================================================

-- Add organization_id column (nullable first to allow existing data)
ALTER TABLE printed_labels
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ============================================================================
-- 2. UPDATE EXISTING PRINTED_LABELS WITH ORGANIZATION_ID
-- ============================================================================

-- Update printed_labels to have organization_id based on their product's organization
UPDATE printed_labels pl
SET organization_id = p.organization_id
FROM products p
WHERE pl.product_id = p.id
AND pl.organization_id IS NULL;

-- For any printed_labels without a product match, set to default organization
UPDATE printed_labels
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- ============================================================================
-- 3. ADD CONSTRAINTS AND INDEXES
-- ============================================================================

-- Set default value for future inserts
ALTER TABLE printed_labels
ALTER COLUMN organization_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;

-- Make organization_id NOT NULL now that all records have values
ALTER TABLE printed_labels
ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE printed_labels
ADD CONSTRAINT fk_printed_labels_organization 
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_printed_labels_org ON printed_labels(organization_id);
CREATE INDEX IF NOT EXISTS idx_printed_labels_product_org ON printed_labels(product_id, organization_id);

-- Add comment
COMMENT ON COLUMN printed_labels.organization_id IS 'Organization that owns this printed label';

-- ============================================================================
-- 4. UPDATE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON printed_labels;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON printed_labels;

-- Create new organization-aware policies
CREATE POLICY "Users can view printed labels in their organization"
ON printed_labels FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert printed labels in their organization"
ON printed_labels FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage printed labels in their organization"
ON printed_labels FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('leader_chef', 'owner', 'admin')
  )
);

-- ============================================================================
-- 5. VERIFICATION (commented out - run manually to verify)
-- ============================================================================

/*
-- Check all printed_labels have organization_id
SELECT 
  COUNT(*) as total_labels,
  COUNT(organization_id) as with_org_id,
  COUNT(*) - COUNT(organization_id) as without_org_id
FROM printed_labels;

-- Check organization distribution
SELECT 
  o.name as organization_name,
  COUNT(pl.id) as label_count
FROM printed_labels pl
LEFT JOIN organizations o ON o.id = pl.organization_id
GROUP BY o.name
ORDER BY label_count DESC;

-- Check labels per product
SELECT 
  p.name as product_name,
  COUNT(pl.id) as label_count,
  MAX(pl.created_at) as latest_label
FROM printed_labels pl
JOIN products p ON p.id = pl.product_id
GROUP BY p.name
ORDER BY latest_label DESC
LIMIT 10;
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Changes Made:
-- ✅ Added organization_id column to printed_labels
-- ✅ Updated all existing printed_labels with organization_id from their products
-- ✅ Set default organization for orphaned labels
-- ✅ Made organization_id NOT NULL
-- ✅ Added foreign key constraint to organizations table
-- ✅ Created indexes for performance (org, product+org)
-- ✅ Updated RLS policies to filter by organization
-- ✅ Users can only see/insert labels from their organization

-- Impact:
-- ✅ Expiry badges will now work correctly
-- ✅ Latest label queries will filter by organization
-- ✅ Multi-tenant data isolation enforced
-- ✅ Existing data preserved and properly organized

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
