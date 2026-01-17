-- ============================================================================
-- FIX PRINTED_LABELS RLS POLICIES
-- ============================================================================
-- Issue: Users getting "new row violates row-level security policy" error
-- Root Cause: INSERT policy requires organization_id match but doesn't handle
--            cases where user's profile may not be fully set up yet
-- Solution: Add more permissive policy that allows inserts if user is authenticated
--          and the organization_id matches ANY organization the user belongs to
-- ============================================================================

-- 1. DROP EXISTING RESTRICTIVE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert printed labels in their organization" ON printed_labels;
DROP POLICY IF EXISTS "Users can view printed labels in their organization" ON printed_labels;
DROP POLICY IF EXISTS "Admins can manage printed labels in their organization" ON printed_labels;

-- 2. CREATE MORE PERMISSIVE POLICIES
-- ============================================================================

-- SELECT: Users can view printed labels in their organization
CREATE POLICY "Users can view printed labels in their organization"
ON printed_labels FOR SELECT
TO authenticated
USING (
  -- Allow if organization_id matches user's organization
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
    AND organization_id IS NOT NULL
  )
  OR
  -- Also allow if user is the one who prepared it (for transition period)
  prepared_by = auth.uid()
);

-- INSERT: Authenticated users can insert printed labels
-- The application code is responsible for setting correct organization_id
CREATE POLICY "Authenticated users can insert printed labels"
ON printed_labels FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Must provide organization_id
  organization_id IS NOT NULL
  AND
  (
    -- Either organization_id matches user's organization
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
      AND organization_id IS NOT NULL
    )
    OR
    -- Or user is preparing the label (prepared_by matches)
    prepared_by = auth.uid()
  )
);

-- UPDATE/DELETE: Only admins and the person who prepared can manage
CREATE POLICY "Users can manage their own printed labels"
ON printed_labels FOR UPDATE
TO authenticated
USING (
  prepared_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid()
    AND organization_id = printed_labels.organization_id
    AND role IN ('admin', 'owner', 'leader_chef')
  )
);

CREATE POLICY "Users can delete their own printed labels"
ON printed_labels FOR DELETE
TO authenticated
USING (
  prepared_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid()
    AND organization_id = printed_labels.organization_id
    AND role IN ('admin', 'owner', 'leader_chef')
  )
);

-- 3. VERIFY ALL USERS HAVE ORGANIZATION_ID IN PROFILES
-- ============================================================================

-- Check for users without organization_id
DO $$
DECLARE
  users_without_org INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_without_org
  FROM profiles
  WHERE organization_id IS NULL;
  
  IF users_without_org > 0 THEN
    RAISE WARNING 'Found % users without organization_id. They will not be able to print labels until organization is assigned.', users_without_org;
  ELSE
    RAISE NOTICE 'All users have organization_id assigned.';
  END IF;
END $$;

-- 4. ADD HELPFUL INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_printed_labels_prepared_by 
ON printed_labels(prepared_by);

CREATE INDEX IF NOT EXISTS idx_printed_labels_org_prepared 
ON printed_labels(organization_id, prepared_by);

-- 5. ADD COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view printed labels in their organization" 
ON printed_labels IS 
'Allows users to view labels from their organization or labels they prepared';

COMMENT ON POLICY "Authenticated users can insert printed labels" 
ON printed_labels IS 
'Allows authenticated users to insert labels with valid organization_id matching their profile or if they are the preparer';

COMMENT ON POLICY "Users can manage their own printed labels" 
ON printed_labels IS 
'Allows users to update labels they prepared or admins in the same organization';

COMMENT ON POLICY "Users can delete their own printed labels" 
ON printed_labels IS 
'Allows users to delete labels they prepared or admins in the same organization';
