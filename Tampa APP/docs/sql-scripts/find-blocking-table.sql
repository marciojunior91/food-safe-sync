-- ============================================================================
-- FIND THE CULPRIT: Which table is blocking the INSERT?
-- ============================================================================
-- Even with RLS disabled on team_member_certificates, error still occurs
-- This means another table (trigger, FK, etc.) is the problem
-- ============================================================================

-- 1. Check for TRIGGERS on team_member_certificates
SELECT 
  '1. TRIGGERS' as check_type,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement as action
FROM information_schema.triggers
WHERE event_object_table = 'team_member_certificates'
ORDER BY trigger_name;

-- 2. Check for FOREIGN KEYS and their target tables
SELECT 
  '2. FOREIGN KEYS' as check_type,
  tc.constraint_name,
  kcu.column_name as fk_column,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'team_member_certificates'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;

-- 3. Check RLS status on RELATED tables
SELECT 
  '3. RLS on Related Tables' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'team_member_certificates',
  'team_members',
  'profiles',
  'user_roles',
  'organizations'
)
ORDER BY tablename;

-- 4. Check if created_by/updated_by have FK constraints
SELECT 
  '4. created_by/updated_by FKs' as check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'team_member_certificates'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('created_by', 'updated_by');

-- 5. Check RLS policies on team_members table
SELECT 
  '5. team_members Policies' as check_type,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'team_members'
ORDER BY cmd;

-- 6. Test: Can we SELECT the team member?
SELECT 
  '6. Can Access Team Member?' as check_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ YES' ELSE '❌ NO - THIS IS THE PROBLEM!' END as result
FROM team_members
WHERE id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'; -- Replace with actual ID

-- 7. Check for TRIGGER FUNCTIONS that might check policies
SELECT 
  '7. Trigger Functions' as check_type,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%team_member%'
  AND p.proname LIKE '%trigger%'
ORDER BY p.proname;

-- 8. Check if there's a CHECK constraint or DEFAULT that queries another table
SELECT 
  '8. Check Constraints' as check_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'team_member_certificates'::regclass
  AND contype = 'c';

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- Replace 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8' with actual team member ID
-- 
-- If test #6 returns "❌ NO", that's the problem!
-- The INSERT is trying to reference a team_member you can't see due to RLS
-- ============================================================================
