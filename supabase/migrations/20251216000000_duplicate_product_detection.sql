-- Migration: Duplicate Product Detection
-- Description: Add functions to detect and prevent duplicate products
-- Date: 2025-12-16

-- Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to find similar products by name
-- Uses trigram similarity for fuzzy matching
CREATE OR REPLACE FUNCTION find_similar_products(
  search_name TEXT,
  org_id UUID,
  min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  category_name TEXT,
  subcategory_name TEXT,
  similarity_score DOUBLE PRECISION,
  allergen_count BIGINT,
  last_printed TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    lc.name,
    ls.name,
    SIMILARITY(LOWER(p.name), LOWER(search_name)),
    (
      SELECT COUNT(*) 
      FROM product_allergens pa 
      WHERE pa.product_id = p.id
    ),
    (
      SELECT MAX(created_at) 
      FROM printed_labels pl 
      WHERE pl.product_id = p.id
    )
  FROM products p
  LEFT JOIN label_categories lc ON p.category_id = lc.id
  LEFT JOIN label_subcategories ls ON p.subcategory_id = ls.id
  WHERE 
    p.organization_id = org_id
    AND SIMILARITY(LOWER(p.name), LOWER(search_name)) >= min_similarity
    AND p.name != search_name  -- Exclude exact match
  ORDER BY 
    SIMILARITY(LOWER(p.name), LOWER(search_name)) DESC,
    (
      SELECT MAX(created_at) 
      FROM printed_labels pl 
      WHERE pl.product_id = p.id
    ) DESC NULLS LAST
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_similar_products IS 'Find products with similar names using trigram similarity. Returns top 10 matches ordered by similarity score.';

-- Function to check if a product name is a duplicate
-- Returns TRUE if a very similar product exists (similarity >= 0.85)
CREATE OR REPLACE FUNCTION is_duplicate_product(
  check_name TEXT,
  org_id UUID,
  exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  similar_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO similar_count
  FROM products p
  WHERE 
    p.organization_id = org_id
    AND (exclude_id IS NULL OR p.id != exclude_id)
    AND (
      -- Exact match (case insensitive)
      LOWER(p.name) = LOWER(check_name)
      OR
      -- Very high similarity (likely duplicate)
      SIMILARITY(LOWER(p.name), LOWER(check_name)) >= 0.85
    );
  
  RETURN similar_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_duplicate_product IS 'Returns true if a product with very similar name already exists (exact match or 85%+ similarity)';

-- Function to get duplicate product statistics for an organization
CREATE OR REPLACE FUNCTION get_duplicate_stats(org_id UUID)
RETURNS TABLE (
  total_products BIGINT,
  potential_duplicates BIGINT,
  duplicate_groups JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH product_pairs AS (
    SELECT 
      p1.id as product1_id,
      p1.name as product1_name,
      p2.id as product2_id,
      p2.name as product2_name,
      SIMILARITY(LOWER(p1.name), LOWER(p2.name)) as similarity
    FROM products p1
    CROSS JOIN products p2
    WHERE 
      p1.organization_id = org_id
      AND p2.organization_id = org_id
      AND p1.id < p2.id  -- Avoid duplicates and self-comparison
      AND SIMILARITY(LOWER(p1.name), LOWER(p2.name)) >= 0.7
  )
  SELECT 
    (SELECT COUNT(*) FROM products WHERE organization_id = org_id),
    (SELECT COUNT(DISTINCT product1_id) FROM product_pairs),
    (
      SELECT JSONB_AGG(pair_data ORDER BY (pair_data->>'similarity')::FLOAT DESC)
      FROM (
        SELECT JSONB_BUILD_OBJECT(
          'product1', JSONB_BUILD_OBJECT('id', product1_id, 'name', product1_name),
          'product2', JSONB_BUILD_OBJECT('id', product2_id, 'name', product2_name),
          'similarity', similarity
        ) as pair_data
        FROM product_pairs
        LIMIT 50
      ) pairs
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_duplicate_stats IS 'Returns statistics about potential duplicate products in an organization';

-- Function to merge two products (migrate all references)
CREATE OR REPLACE FUNCTION merge_products(
  source_product_id UUID,
  target_product_id UUID,
  org_id UUID
)
RETURNS JSONB AS $$
DECLARE
  source_product RECORD;
  target_product RECORD;
  labels_migrated INTEGER;
  allergens_migrated INTEGER;
  result JSONB;
BEGIN
  -- Verify both products exist and belong to the same organization
  SELECT * INTO source_product 
  FROM products 
  WHERE id = source_product_id AND organization_id = org_id;
  
  SELECT * INTO target_product 
  FROM products 
  WHERE id = target_product_id AND organization_id = org_id;
  
  IF source_product IS NULL OR target_product IS NULL THEN
    RAISE EXCEPTION 'One or both products not found or do not belong to this organization';
  END IF;
  
  -- Migrate printed_labels references
  UPDATE printed_labels
  SET product_id = target_product_id
  WHERE product_id = source_product_id;
  
  GET DIAGNOSTICS labels_migrated = ROW_COUNT;
  
  -- Migrate product_allergens (skip duplicates)
  INSERT INTO product_allergens (product_id, allergen_id)
  SELECT target_product_id, allergen_id
  FROM product_allergens
  WHERE product_id = source_product_id
  ON CONFLICT (product_id, allergen_id) DO NOTHING;
  
  GET DIAGNOSTICS allergens_migrated = ROW_COUNT;
  
  -- Delete source product (CASCADE will handle product_allergens)
  DELETE FROM products WHERE id = source_product_id;
  
  -- Build result
  result := JSONB_BUILD_OBJECT(
    'success', true,
    'source_product', JSONB_BUILD_OBJECT('id', source_product_id, 'name', source_product.name),
    'target_product', JSONB_BUILD_OBJECT('id', target_product_id, 'name', target_product.name),
    'labels_migrated', labels_migrated,
    'allergens_migrated', allergens_migrated
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN JSONB_BUILD_OBJECT(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION merge_products IS 'Merge source product into target product. Migrates all printed labels and allergens, then deletes source.';

-- Add index for faster similarity searches
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (LOWER(name) gin_trgm_ops);

COMMENT ON INDEX idx_products_name_trgm IS 'Trigram index for fast fuzzy text search on product names';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION find_similar_products TO authenticated;
GRANT EXECUTE ON FUNCTION is_duplicate_product TO authenticated;
GRANT EXECUTE ON FUNCTION get_duplicate_stats TO authenticated;

-- Only managers can merge products
REVOKE EXECUTE ON FUNCTION merge_products FROM PUBLIC;
GRANT EXECUTE ON FUNCTION merge_products TO authenticated;

-- Add RLS check within merge_products function (already done with org_id verification)

