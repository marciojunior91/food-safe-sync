-- Check user_roles table for your user
SELECT * FROM public.user_roles 
WHERE user_id = 'f98800a2-4ff6-43a9-9678-0ece9e9e4f96';

-- Check profiles table for your user
SELECT user_id, display_name, organization_id 
FROM public.profiles 
WHERE user_id = 'f98800a2-4ff6-43a9-9678-0ece9e9e4f96';

-- Check if the user_roles table has the correct structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_roles';

-- List all roles for debugging
SELECT user_id, role, created_at 
FROM public.user_roles 
ORDER BY created_at DESC 
LIMIT 10;
