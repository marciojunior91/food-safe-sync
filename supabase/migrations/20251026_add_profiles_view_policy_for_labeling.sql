-- ============================================
-- Add policy for all authenticated users to view profiles in their organization
-- This is needed for the labeling feature where users select themselves
-- Uses security definer function to avoid RLS recursion
-- ============================================

-- Create policy: All authenticated users can view profiles in their organization
-- Uses the existing get_user_organization security definer function to avoid recursion
CREATE POLICY "Users can view profiles in their organization for labeling"
ON public.profiles
FOR SELECT
USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Profile must be in the same organization as the requesting user
  -- Using security definer function to avoid RLS recursion
  organization_id = public.get_user_organization(auth.uid())
);

-- Note: This policy works alongside existing policies:
-- 1. "Users can view their own profile" - for viewing own profile
-- 2. "Admins and managers can view all profiles in organization" - for admin features
-- 3. This new policy - for labeling feature (all staff can see coworkers in same org)
