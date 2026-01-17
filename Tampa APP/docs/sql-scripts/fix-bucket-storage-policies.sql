-- ============================================================================
-- FIX: Storage Bucket Policies for team_member_documents
-- ============================================================================
-- This creates permissive policies on storage.objects for the bucket
-- ============================================================================

-- Drop any existing policies for team_member_documents
DROP POLICY IF EXISTS "team_member_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "team_member_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "team_member_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "team_member_documents_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to team_member_documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to team_member_documents" ON storage.objects;

-- ============================================================================
-- OPTION 1: Simple - Allow all authenticated users
-- ============================================================================

-- SELECT: View files in bucket
CREATE POLICY "team_member_documents_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'team_member_documents');

-- INSERT: Upload files to bucket
CREATE POLICY "team_member_documents_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team_member_documents');

-- UPDATE: Update file metadata
CREATE POLICY "team_member_documents_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team_member_documents')
WITH CHECK (bucket_id = 'team_member_documents');

-- DELETE: Delete files from bucket
CREATE POLICY "team_member_documents_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team_member_documents');

-- ============================================================================
-- Verify policies
-- ============================================================================

SELECT 
  'Storage policies for team_member_documents:' as info,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%team_member_documents%'
    OR policyname LIKE '%team_member%'
  )
ORDER BY cmd, policyname;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ STORAGE BUCKET POLICIES CREATED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies for team_member_documents bucket:';
  RAISE NOTICE '  ✅ SELECT - All authenticated users can view';
  RAISE NOTICE '  ✅ INSERT - All authenticated users can upload';
  RAISE NOTICE '  ✅ UPDATE - All authenticated users can update';
  RAISE NOTICE '  ✅ DELETE - All authenticated users can delete';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Try uploading now!';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: These are STORAGE policies, separate from table RLS.';
  RAISE NOTICE 'You still need to fix table RLS with assign-roles-quick.sql';
  RAISE NOTICE 'and COMPLETE_FIX_BOTH_TABLES.sql';
  RAISE NOTICE '';
END $$;
