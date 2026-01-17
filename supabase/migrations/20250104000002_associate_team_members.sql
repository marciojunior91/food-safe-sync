-- First, let's see your current user and organization
SELECT 
  auth.uid() as current_user_id,
  p.organization_id,
  o.name as organization_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.user_id = auth.uid();

-- Then update all team_members to belong to your organization
UPDATE team_members
SET organization_id = (
  SELECT organization_id 
  FROM profiles 
  WHERE user_id = auth.uid()
  LIMIT 1
)
WHERE organization_id IS NULL 
   OR organization_id != (
     SELECT organization_id 
     FROM profiles 
     WHERE user_id = auth.uid()
     LIMIT 1
   );

-- Verify the update
SELECT 
  id,
  display_name,
  position,
  role_type,
  organization_id,
  is_active
FROM team_members
ORDER BY display_name;
