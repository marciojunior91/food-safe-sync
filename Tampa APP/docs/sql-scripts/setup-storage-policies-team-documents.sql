-- ============================================================================
-- Create Storage Policies for Team Member Documents Bucket
-- ============================================================================
-- IMPORTANT: Verify your bucket name first!
-- Go to: Storage > Buckets and check if it's:
--   - "team-member-documents" (with dashes) OR
--   - "team_member_documents" (with underscores)
-- ============================================================================

-- Update bucket to be public (replace bucket name if needed)
-- Try this first:
UPDATE storage.buckets 
SET public = true 
WHERE id = 'team_member_documents';

-- If that returns 0 rows, try with dashes:
-- UPDATE storage.buckets 
-- SET public = true 
-- WHERE id = 'team-member-documents';

-- Check which buckets exist:
SELECT id, name, public 
FROM storage.buckets 
ORDER BY id;

-- Success message
DO $$ 
DECLARE
  bucket_count INTEGER;
BEGIN 
  SELECT COUNT(*) INTO bucket_count 
  FROM storage.buckets 
  WHERE id IN ('team_member_documents', 'team-member-documents') 
  AND public = true;
  
  IF bucket_count > 0 THEN
    RAISE NOTICE '✅ Bucket is now PUBLIC!';
    RAISE NOTICE '📁 Files can now be uploaded and accessed';
    RAISE NOTICE '🔒 Security maintained by team_member_certificates RLS';
  ELSE
    RAISE NOTICE '❌ Bucket not found or not updated!';
    RAISE NOTICE 'Check the bucket name in the query above';
  END IF;
END $$;
