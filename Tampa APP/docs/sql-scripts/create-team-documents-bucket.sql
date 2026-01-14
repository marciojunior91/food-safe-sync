-- ============================================================================
-- Create Supabase Storage Bucket for Team Member Documents
-- ============================================================================
-- This script creates the storage bucket and policies for team member documents
-- Run this in your Supabase SQL Editor or via Supabase CLI
-- ============================================================================

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-member-documents', 'team-member-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view team member documents in their org" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload team member documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their team member documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete team member documents" ON storage.objects;

-- Policy: Users can view documents for team members in their organization
CREATE POLICY "Users can view team member documents in their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'team-member-documents'
  AND (
    -- Check if the user belongs to the same organization as the team member
    EXISTS (
      SELECT 1
      FROM team_members tm
      INNER JOIN profiles p ON p.user_id = auth.uid()
      WHERE tm.organization_id = p.organization_id
      AND (storage.foldername(name))[1] = tm.id::text
    )
    OR
    -- Admins can view all documents in their org
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('admin', 'manager')
  )
);

-- Policy: Users can upload documents for team members in their organization
CREATE POLICY "Users can upload team member documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-member-documents'
  AND (
    -- Check if the user belongs to the same organization as the team member
    EXISTS (
      SELECT 1
      FROM team_members tm
      INNER JOIN profiles p ON p.user_id = auth.uid()
      WHERE tm.organization_id = p.organization_id
      AND (storage.foldername(name))[1] = tm.id::text
    )
    OR
    -- Admins can upload for anyone in their org
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('admin', 'manager')
  )
);

-- Policy: Users can update documents they uploaded
CREATE POLICY "Users can update their team member documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-member-documents'
  AND (
    -- Check if the user belongs to the same organization as the team member
    EXISTS (
      SELECT 1
      FROM team_members tm
      INNER JOIN profiles p ON p.user_id = auth.uid()
      WHERE tm.organization_id = p.organization_id
      AND (storage.foldername(name))[1] = tm.id::text
    )
    OR
    -- Admins can update any document in their org
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('admin', 'manager')
  )
);

-- Policy: Users can delete documents for team members in their organization
CREATE POLICY "Users can delete team member documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'team-member-documents'
  AND (
    -- Check if the user belongs to the same organization as the team member
    EXISTS (
      SELECT 1
      FROM team_members tm
      INNER JOIN profiles p ON p.user_id = auth.uid()
      WHERE tm.organization_id = p.organization_id
      AND (storage.foldername(name))[1] = tm.id::text
    )
    OR
    -- Admins can delete any document in their org
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('admin', 'manager')
  )
);

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'team-member-documents';

-- Test: Check if policies are working
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%team member%';
