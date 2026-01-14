-- Sync Profile Emails from Auth.Users
-- This migration updates profiles.email to match auth.users.email
-- Useful for profiles created before email field was added

-- Update existing profiles with emails from auth.users
UPDATE public.profiles
SET 
  email = auth.users.email,
  updated_at = now()
FROM auth.users
WHERE profiles.user_id = auth.users.id
  AND (profiles.email IS NULL OR profiles.email = '');

-- Create function to get user emails (useful for queries)
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create view for profiles with guaranteed email (joins with auth.users)
CREATE OR REPLACE VIEW public.profiles_with_email AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  COALESCE(p.email, au.email) as email,
  p.organization_id,
  p.department_id,
  p.phone,
  p.position,
  p.address,
  p.admission_date,
  p.date_of_birth,
  p.employment_status,
  p.hire_date,
  p.last_pin_change,
  p.onboarding_completed,
  p.onboarding_completed_at,
  p.profile_completion_percentage,
  p.tfn_number,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.user_id = au.id;

-- Grant access to the view
GRANT SELECT ON public.profiles_with_email TO authenticated;

-- Comment on objects
COMMENT ON FUNCTION public.get_user_email IS 'Returns the email for a given user UUID from auth.users';
COMMENT ON VIEW public.profiles_with_email IS 'Profiles joined with auth.users to ensure email is always available';
