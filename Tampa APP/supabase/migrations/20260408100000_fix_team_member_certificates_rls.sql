-- ============================================================================
-- Fix: team_member_certificates RLS policies
-- ============================================================================
-- Problem: INSERT blocked with 403 "violates row-level security policy"
--
-- Root cause:
--   1. The "Team members can manage" policy uses FOR ALL with
--      USING(created_by = auth.uid()) — this is fragile and blocks managers
--      uploading documents for other team members.
--   2. The "Admins can manage" policy references user_roles with stale role
--      names (leader_chef) and uses a complex JOIN that may not match.
--
-- Fix: Replace overly restrictive FOR ALL policies with per-operation policies
--      based on organization membership (same pattern as printed_labels fix).
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Team members can manage their certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Users can view certificates in their organization" ON team_member_certificates;
DROP POLICY IF EXISTS "Org members can insert certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Org members can update certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Org members can delete certificates" ON team_member_certificates;
DROP POLICY IF EXISTS "Org members can view certificates" ON team_member_certificates;

-- ============================================================================
-- New policies: organization-member level access
-- Any authenticated user in the same organization can manage certificates
-- for team members in that organization.
-- ============================================================================

-- SELECT: Org members can view all certificates in their organization
CREATE POLICY "Org members can view certificates"
  ON team_member_certificates
  FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      WHERE tm.organization_id IN (
        SELECT p.organization_id FROM profiles p
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- INSERT: Org members can insert certificates for team members in their org
CREATE POLICY "Org members can insert certificates"
  ON team_member_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      WHERE tm.organization_id IN (
        SELECT p.organization_id FROM profiles p
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- UPDATE: Org members can update certificates in their organization
CREATE POLICY "Org members can update certificates"
  ON team_member_certificates
  FOR UPDATE
  TO authenticated
  USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      WHERE tm.organization_id IN (
        SELECT p.organization_id FROM profiles p
        WHERE p.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      WHERE tm.organization_id IN (
        SELECT p.organization_id FROM profiles p
        WHERE p.user_id = auth.uid()
      )
    )
  );

-- DELETE: Org members can delete certificates in their organization
CREATE POLICY "Org members can delete certificates"
  ON team_member_certificates
  FOR DELETE
  TO authenticated
  USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      WHERE tm.organization_id IN (
        SELECT p.organization_id FROM profiles p
        WHERE p.user_id = auth.uid()
      )
    )
  );
