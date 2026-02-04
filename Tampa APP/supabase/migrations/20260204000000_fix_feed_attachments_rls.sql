-- ============================================================================
-- FIX FEED ATTACHMENTS STORAGE RLS POLICIES
-- ============================================================================
-- Fix storage.objects RLS policies to use auth_roles_id instead of id
-- The issue: auth.uid() returns the auth user ID, not the team_member ID
-- This fixes the "403 new row violates row-level security policy" error
-- ============================================================================

-- Drop existing STORAGE policies (not table policies)
DROP POLICY IF EXISTS "Users can upload feed attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view organization feed attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authors can delete their feed attachments" ON storage.objects;

-- ============================================================================
-- RECREATE STORAGE POLICIES WITH CORRECT LOGIC
-- ============================================================================

-- Allow authenticated users to upload to their organization's folder
-- FIX: Use auth_roles_id instead of id
CREATE POLICY "Users can upload feed attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feed-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id 
    FROM team_members 
    WHERE auth_roles_id = auth.uid()
  )
);

-- Allow authenticated users to view attachments from their organization
-- FIX: Use auth_roles_id instead of id
CREATE POLICY "Users can view organization feed attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'feed-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id 
    FROM team_members 
    WHERE auth_roles_id = auth.uid()
  )
);

-- Allow users to delete attachments from their organization
-- FIX: Use auth_roles_id instead of checking owner
CREATE POLICY "Organization members can delete feed attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feed-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id 
    FROM team_members 
    WHERE auth_roles_id = auth.uid()
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- 
-- What this fixes:
-- 1. POST 400/403 errors when uploading attachments to feed posts
-- 2. "new row violates row-level security policy" error
-- 
-- Key Changes:
-- 1. Changed from `WHERE id = auth.uid()` to `WHERE auth_roles_id = auth.uid()`
-- 2. This correctly maps the authenticated user to their team member record
-- 3. Delete policy now allows any org member (not just owner) for flexibility
-- 
-- Why this fix is needed:
-- - auth.uid() returns the user's authentication ID (from auth.users table)
-- - team_members.id is the team member's UUID (different from auth ID)
-- - team_members.auth_roles_id is the column that links to auth.users.id
-- 
-- Note: This ONLY affects storage.objects policies
-- The feed_attachments TABLE policies are separate and working correctly
-- 
-- ============================================================================
