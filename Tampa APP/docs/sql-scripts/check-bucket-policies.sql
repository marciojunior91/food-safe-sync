-- ============================================================================
-- CHECK: Storage Bucket Policies (The Real Problem?)
-- ============================================================================
-- Storage buckets have their OWN RLS policies separate from table RLS!
-- Even with table RLS disabled, bucket policies can still block!
-- ============================================================================

-- 1. Check if bucket exists and is public
SELECT 
  '1. BUCKET INFO' as check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'team_member_documents';

-- 2. Check storage.objects RLS status
SELECT 
  '2. storage.objects RLS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- 3. Check ALL policies on storage.objects
SELECT 
  '3. STORAGE POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY cmd, policyname;

-- 4. Check if there are policies specific to team_member_documents bucket
SELECT 
  '4. BUCKET-SPECIFIC POLICIES' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual LIKE '%team_member_documents%'
    OR with_check LIKE '%team_member_documents%'
    OR policyname LIKE '%team_member%'
  );

-- ============================================================================
-- HYPOTHESIS
-- ============================================================================
-- When you upload to storage, it inserts into storage.objects table
-- That table has RLS enabled with its own policies
-- Even if bucket is public, INSERT might still require specific policies!
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '🔍 CHECKING STORAGE BUCKET POLICIES';
  RAISE NOTICE '';
  RAISE NOTICE 'If storage.objects has RLS enabled and restrictive policies,';
  RAISE NOTICE 'that could be blocking your uploads!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Check the output above';
  RAISE NOTICE '  - Is storage.objects RLS enabled? (should be false or has permissive policies)';
  RAISE NOTICE '  - Are there INSERT policies blocking you?';
  RAISE NOTICE '';
END $$;
