-- Ver TODOS os profiles e suas roles
SELECT 
  p.user_id,
  p.display_name,
  p.email,
  p.organization_id,
  ur.role::text as current_role,
  p.created_at
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at;

-- Ver quantos usuários existem em auth.users
SELECT 
  'auth.users' as table_name,
  COUNT(*) as total_users
FROM auth.users;

-- Ver profiles vs auth.users
SELECT 
  'COMPARAÇÃO' as info,
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM user_roles) as user_roles;

-- Ver se há team_members cadastrados
SELECT 
  'team_members' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN auth_role_id IS NOT NULL THEN 1 END) as with_auth,
  COUNT(CASE WHEN auth_role_id IS NULL THEN 1 END) as without_auth
FROM team_members;

-- Ver todos os team_members
SELECT 
  id,
  display_name,
  email,
  role_type,
  auth_role_id,
  created_at
FROM team_members
ORDER BY created_at;
