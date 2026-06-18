-- The old unique constraint (course_id, user_id) breaks shared-tablet training:
-- every team member uses the SAME auth user_id, so the 2nd member enrolling in a
-- course hits a 409 (duplicate key). Enrollment uniqueness is now per
-- (course_id, team_member_id) via training_enrollments_course_member_uniq
-- (created in add_training_obligations.sql). Drop the obsolete constraint.
-- Apply via Supabase Dashboard → SQL Editor.

ALTER TABLE training_enrollments
  DROP CONSTRAINT IF EXISTS training_enrollments_course_id_user_id_key;
