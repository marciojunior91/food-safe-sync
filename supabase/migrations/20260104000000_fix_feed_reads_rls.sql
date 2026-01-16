-- ============================================================================
-- Fix feed_reads RLS Policies
-- Date: January 4, 2026
-- ============================================================================
-- This migration adds missing RLS policies for the feed_reads table
-- Previously the table had RLS enabled but no policies, causing insert failures
-- ============================================================================

-- Drop any existing policies (in case they exist)
DROP POLICY IF EXISTS "Users can view their own feed reads" ON feed_reads;
DROP POLICY IF EXISTS "Users can create their own feed reads" ON feed_reads;
DROP POLICY IF EXISTS "Users can update their own feed reads" ON feed_reads;
DROP POLICY IF EXISTS "Admins can view all feed reads" ON feed_reads;

-- ============================================================================
-- CREATE FEED_READS POLICIES
-- ============================================================================

-- Policy: Users can view their own feed reads
CREATE POLICY "Users can view their own feed reads"
  ON feed_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can create their own feed reads
CREATE POLICY "Users can create their own feed reads"
  ON feed_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own feed reads (for acknowledgment)
CREATE POLICY "Users can update their own feed reads"
  ON feed_reads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Admins can view all feed reads in their organization
CREATE POLICY "Admins can view all feed reads"
  ON feed_reads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid() 
      AND ur.role IN ('leader_chef', 'admin')
      AND p.organization_id IN (
        SELECT p2.organization_id 
        FROM profiles p2 
        WHERE p2.user_id = feed_reads.user_id
      )
    )
  );

-- ============================================================================
-- VERIFICATION QUERY (commented out - run manually to verify)
-- ============================================================================

/*
-- Test that authenticated users can insert their own feed reads
SELECT auth.uid() AS current_user;

-- Try inserting a test feed read (replace with actual feed_item_id)
INSERT INTO feed_reads (feed_item_id, user_id, read_at)
VALUES (
  (SELECT id FROM feed_items LIMIT 1),
  auth.uid(),
  NOW()
);

-- Verify the insert worked
SELECT * FROM feed_reads WHERE user_id = auth.uid();
*/

-- ============================================================================
-- Add comment for documentation
-- ============================================================================

COMMENT ON TABLE feed_reads IS 'Tracking read status and acknowledgments - Users can create/view their own reads';
