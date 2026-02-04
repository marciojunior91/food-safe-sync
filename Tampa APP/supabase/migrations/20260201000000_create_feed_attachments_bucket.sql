-- ============================================================================
-- CREATE FEED ATTACHMENTS STORAGE BUCKET
-- ============================================================================
-- Creates a public storage bucket for feed post attachments
-- Supports images, videos, and PDFs with 10MB file size limit
-- ============================================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-attachments',
  'feed-attachments',
  true, -- Public bucket for easy access to feed media
  10485760, -- 10MB limit per file
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- Videos
    'video/mp4',
    'video/quicktime',
    'video/webm',
    -- Documents
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES FOR feed-attachments BUCKET
-- ============================================================================

-- Allow authenticated users to upload to their organization's folder
CREATE POLICY "Users can upload feed attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feed-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id 
    FROM team_members 
    WHERE id = auth.uid()
  )
);

-- Allow authenticated users to view attachments from their organization
CREATE POLICY "Users can view organization feed attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'feed-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id 
    FROM team_members 
    WHERE id = auth.uid()
  )
);

-- Allow post authors to delete their own attachments
CREATE POLICY "Authors can delete their feed attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feed-attachments'
  AND owner = auth.uid()
);

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- 
-- Storage Structure:
-- feed-attachments/
--   └── {organization_id}/
--       └── {post_id}/
--           └── {timestamp}-{random}.{ext}
--
-- Examples:
-- - feed-attachments/org-123/post-456/1738368000000-abc123.jpg
-- - feed-attachments/org-123/post-789/1738368000000-def456.mp4
-- 
-- File Size Limits:
-- - Maximum: 10MB per file
-- - Recommended: Compress images before upload
-- 
-- Allowed MIME Types:
-- - Images: JPEG, PNG, GIF, WebP, SVG
-- - Videos: MP4, QuickTime, WebM
-- - Documents: PDF
-- 
-- Security:
-- - RLS policies ensure users can only access their organization's files
-- - Public bucket allows direct URL access without auth headers
-- - Authors can delete their own uploads
-- 
-- ============================================================================
