-- ============================================================================
-- FIX PRINTED_LABELS UPDATE RLS POLICY
-- ============================================================================
-- Issue: When a user extends/consumes/discards a label they didn't prepare,
--        the UPDATE is silently blocked by RLS (0 rows affected, no error).
--        On page refresh the old data reappears because nothing was persisted.
-- Fix:   Allow any authenticated member of the same organization to update
--        label lifecycle fields (status, expiry_date, action_notes).
-- Date:  April 8, 2026
-- ============================================================================

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Users can manage their own printed labels" ON printed_labels;

-- Create a more permissive update policy:
-- Any authenticated user in the same organization can update labels
CREATE POLICY "Org members can update printed labels"
ON printed_labels FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE user_id = auth.uid()
      AND organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE user_id = auth.uid()
      AND organization_id IS NOT NULL
  )
);

COMMENT ON POLICY "Org members can update printed labels"
ON printed_labels IS
'Allows any authenticated member of the same organization to update labels (status, expiry_date, etc.)';
