-- Check if allergens exist in database
SELECT 
  id,
  name,
  icon,
  severity,
  is_common,
  created_at
FROM allergens
ORDER BY is_common DESC, severity, name
LIMIT 20;

-- Count total allergens
SELECT COUNT(*) as total_allergens FROM allergens;

-- Check if there are any allergens at all
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'NO ALLERGENS - Need to seed data!'
    WHEN COUNT(*) < 10 THEN 'FEW ALLERGENS - May need more data'
    ELSE 'ALLERGENS OK - ' || COUNT(*) || ' total'
  END as status
FROM allergens;
