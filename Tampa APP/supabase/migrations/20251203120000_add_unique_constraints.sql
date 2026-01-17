-- Add UNIQUE constraints to prevent duplicate categories and products within same organization
-- This ensures data integrity when users create categories/products on-the-fly

-- ============================================================================
-- 1. UNIQUE CONSTRAINT FOR LABEL_CATEGORIES
-- ============================================================================
-- Prevents duplicate category names within the same organization
-- Allows same category name across different organizations
-- Global categories (organization_id = NULL) are also unique

CREATE UNIQUE INDEX idx_label_categories_unique_name_per_org 
ON public.label_categories (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));

COMMENT ON INDEX idx_label_categories_unique_name_per_org IS 
'Ensures category names are unique within each organization. Global categories (NULL org_id) are also unique.';

-- ============================================================================
-- 2. UNIQUE CONSTRAINT FOR PRODUCTS
-- ============================================================================
-- Prevents duplicate product names within the same organization
-- Allows same product name across different organizations
-- Global products (organization_id = NULL) are also unique

CREATE UNIQUE INDEX idx_products_unique_name_per_org 
ON public.products (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));

COMMENT ON INDEX idx_products_unique_name_per_org IS 
'Ensures product names are unique within each organization. Global products (NULL org_id) are also unique.';

-- ============================================================================
-- 3. UNIQUE CONSTRAINT FOR MEASURING_UNITS
-- ============================================================================
-- Prevents duplicate unit abbreviations within the same organization
-- This is important for consistency (e.g., only one "kg" per organization)

CREATE UNIQUE INDEX idx_measuring_units_unique_abbrev_per_org 
ON public.measuring_units (abbreviation, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));

COMMENT ON INDEX idx_measuring_units_unique_abbrev_per_org IS 
'Ensures unit abbreviations are unique within each organization. Global units (NULL org_id) are also unique.';

-- ============================================================================
-- 4. BENEFITS OF THIS APPROACH
-- ============================================================================
-- ✅ Prevents accidental duplicates when creating categories/products
-- ✅ Allows ON CONFLICT clauses in INSERT statements
-- ✅ Maintains multi-tenancy (different orgs can have same names)
-- ✅ Global entities (NULL org_id) remain unique across system
-- ✅ Improves query performance with indexed columns

-- ============================================================================
-- 5. EXAMPLE USAGE IN APPLICATION CODE
-- ============================================================================
-- Now you can safely use ON CONFLICT in your INSERT statements:

-- Example 1: Insert category with auto-handling of duplicates
-- INSERT INTO label_categories (name, organization_id)
-- VALUES ('Meat & Poultry', 'org-uuid-here')
-- ON CONFLICT (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid))
-- DO NOTHING
-- RETURNING *;

-- Example 2: Insert product with upsert (update if exists)
-- INSERT INTO products (name, category_id, organization_id)
-- VALUES ('Chicken Breast', 'cat-uuid', 'org-uuid')
-- ON CONFLICT (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid))
-- DO UPDATE SET category_id = EXCLUDED.category_id, updated_at = NOW()
-- RETURNING *;

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================
-- Check that constraints were created successfully

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('label_categories', 'products', 'measuring_units')
  AND indexname LIKE '%unique%'
ORDER BY tablename, indexname;
