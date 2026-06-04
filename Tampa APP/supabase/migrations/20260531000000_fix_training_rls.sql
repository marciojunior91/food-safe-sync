-- ============================================================================
-- FIX: TRAINING CENTER RLS POLICIES
-- ============================================================================
-- The original training migration (20260125000000_training_center.sql) wrote two
-- policies using ARRAY['admin','owner','manager']::app_role[]. The live app_role
-- enum has no 'owner' value, so those two CREATE POLICY statements errored and
-- the policies were never installed. Result: admins/managers had no working
-- manage policy on training_courses → UPDATE/INSERT match 0 rows (PGRST116/406),
-- and managers couldn't view team enrollments.
--
-- This migration re-creates both policies with valid roles (admin, manager) and
-- an explicit WITH CHECK so create + edit both succeed. Idempotent.
-- ============================================================================

-- ── training_courses: admins/managers manage (select drafts, insert, update, delete)
DROP POLICY IF EXISTS "Admins can manage courses" ON public.training_courses;
CREATE POLICY "Admins can manage courses"
  ON public.training_courses FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );

-- ── training_enrollments: managers/admins view all enrollments in their org
DROP POLICY IF EXISTS "Managers can view all enrollments in their org" ON public.training_enrollments;
CREATE POLICY "Managers can view all enrollments in their org"
  ON public.training_enrollments FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM public.training_courses
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
    AND public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Training Center RLS policies repaired (owner -> admin/manager)';
END $$;
