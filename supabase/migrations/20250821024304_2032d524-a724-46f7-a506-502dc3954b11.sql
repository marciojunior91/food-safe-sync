-- Fix organization_id for admin user to allow recipe creation
-- Generate a random organization ID for the admin user
UPDATE profiles 
SET organization_id = gen_random_uuid() 
WHERE user_id = '39049e8c-1c7f-41b8-80ee-19a4b9b9b3a7' AND organization_id IS NULL;