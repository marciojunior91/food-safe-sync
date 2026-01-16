-- Update the first user to be an admin for testing
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = (SELECT user_id FROM profiles LIMIT 1);