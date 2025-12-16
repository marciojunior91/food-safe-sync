-- Fix find_similar_products type mismatch and add products INSERT organization_id
-- This migration fixes two critical issues:
-- 1. Type mismatch in find_similar_products (real vs double precision)
-- 2. Missing organization_id when creating products (RLS violation)

-- Fix 1: Update find_similar_products to cast similarity to DOUBLE PRECISION
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
    SIMILARITY(LOWER(p.name), LOWER(search_name))::DOUBLE PRECISION,  -- Cast to DOUBLE PRECISION
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

COMMENT ON FUNCTION find_similar_products IS 'Find products with similar names using trigram similarity. Returns top 10 matches ordered by similarity score. Fixed type casting to DOUBLE PRECISION.';
