-- ============================================================================
-- Training Center: per-member progress + course obligations
-- Apply via Supabase Dashboard → SQL Editor.
-- ============================================================================

-- A) Track training per INDIVIDUAL team member (shared tablets log in with one
--    account; the person picks who they are). organization_id is denormalised
--    so admins can report across the org without joining through courses.
ALTER TABLE training_enrollments
  ADD COLUMN IF NOT EXISTS team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE;
ALTER TABLE training_enrollments
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- One enrollment per (course, member). Allows upsert on re-enrol.
CREATE UNIQUE INDEX IF NOT EXISTS training_enrollments_course_member_uniq
  ON training_enrollments (course_id, team_member_id)
  WHERE team_member_id IS NOT NULL;

-- Let any member of the org read the org's enrollments (needed for the admin
-- report + shared-tablet flows). Additive to existing per-user policies.
DROP POLICY IF EXISTS "org members read training enrollments" ON training_enrollments;
CREATE POLICY "org members read training enrollments"
  ON training_enrollments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "org members write training enrollments" ON training_enrollments;
CREATE POLICY "org members write training enrollments"
  ON training_enrollments FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

-- B) Course obligations: a course can be mandatory for a whole DEPARTMENT or a
--    specific TEAM MEMBER (at least one of the two must be set).
CREATE TABLE IF NOT EXISTS training_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT training_obligation_target CHECK (department_id IS NOT NULL OR team_member_id IS NOT NULL)
);

ALTER TABLE training_obligations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members read training obligations" ON training_obligations;
CREATE POLICY "org members read training obligations"
  ON training_obligations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "org members write training obligations" ON training_obligations;
CREATE POLICY "org members write training obligations"
  ON training_obligations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));
