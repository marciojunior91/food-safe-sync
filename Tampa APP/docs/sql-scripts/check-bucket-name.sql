-- ============================================================================
-- Quick Diagnostic: Find Your Storage Bucket Name
-- ============================================================================
-- Run this to see all your buckets and their names
-- ============================================================================

-- List all storage buckets
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY created_at DESC;

-- Check for team member document buckets specifically
SELECT 
  id,
  name,
  public,
  CASE 
    WHEN public THEN '✅ PUBLIC'
    ELSE '🔒 PRIVATE (needs to be public)'
  END as status
FROM storage.buckets
WHERE id ILIKE '%team%member%' OR id ILIKE '%document%'
ORDER BY id;

-- Show bucket with upload stats
SELECT 
  b.id as bucket_name,
  b.public,
  COUNT(o.id) as file_count
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id
GROUP BY b.id, b.public
ORDER BY b.id;
