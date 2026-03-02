-- ============================================================================
-- FIX TASK ATTACHMENTS STORAGE POLICIES
-- ============================================================================
-- Issue: Upload fails because storage.objects RLS policies are missing
-- The bucket exists and is public, but INSERT into storage.objects is blocked
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their task attachments" ON storage.objects;

-- ============================================================================
-- STORAGE POLICIES FOR task-attachments BUCKET
-- ============================================================================

-- Policy 1: Allow authenticated users to upload task attachments
-- Anyone authenticated can upload (organization check happens at task level)
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments'
);

-- Policy 2: Allow authenticated users to view task attachments
-- Anyone authenticated can view (bucket is public, but policy required for SELECT)
CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-attachments'
);

-- Policy 3: Allow users to delete attachments from their organization's tasks
-- More restrictive - only delete if task belongs to user's organization
CREATE POLICY "Users can delete their task attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (
    -- Extract taskId from path: task-attachments/{taskId}/{filename}
    (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM routine_tasks
      WHERE organization_id IN (
        SELECT organization_id 
        FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%task%'
ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Storage Structure:
-- task-attachments/
--   └── {taskId}/
--       └── {uuid}.{ext}
--
-- Why These Policies:
-- 1. INSERT: Permissive - users can upload to any task (organization validated by task_attachments table RLS)
-- 2. SELECT: Permissive - public bucket, but policy required for queries
-- 3. DELETE: Restrictive - only delete if task belongs to user's organization
--
-- Security Layers:
-- 1. storage.objects policies (this file) - Control file operations
-- 2. task_attachments table RLS (separate migration) - Control metadata access
--
-- With this fix:
-- ✅ Users can upload images to tasks
-- ✅ Upload no longer shows "upload fail"
-- ✅ Images persist in Supabase Storage
-- ✅ Attachments properly linked to tasks via task_id
--
