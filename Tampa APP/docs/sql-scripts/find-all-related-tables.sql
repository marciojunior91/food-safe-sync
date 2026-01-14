-- ============================================================================
-- FIND ALL TABLES INVOLVED IN THE INSERT
-- ============================================================================
-- If team_members and team_member_certificates both have RLS disabled
-- but you still get RLS errors, another table is the culprit!
-- ============================================================================

-- 1. Check ALL foreign keys from team_member_certificates
SELECT 
  '1. ALL FOREIGN KEYS FROM team_member_certificates' as check_type,
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

-- 2. Check RLS status on ALL those referenced tables
SELECT 
  '2. RLS STATUS ON RELATED TABLES' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'team_member_certificates',
  'team_members',
  'profiles',
  'organizations',
  'auth.users'  -- If references auth schema
)
ORDER BY tablename;

-- 3. Check if created_by/updated_by reference profiles or auth.users
SELECT 
  '3. created_by/updated_by REFERENCES' as check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema || '.' || ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'team_member_certificates'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('created_by', 'updated_by');

-- 4. Check profiles table RLS
SELECT 
  '4. PROFILES RLS POLICIES' as check_type,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 5. Can you SELECT from profiles?
SELECT 
  '5. CAN ACCESS PROFILES?' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ YES'
    ELSE '❌ NO - THIS COULD BE THE PROBLEM!'
  END as result
FROM profiles
WHERE user_id = auth.uid();

-- 6. Check for ANY triggers that might query other tables
SELECT 
  '6. TRIGGERS ON team_member_certificates' as check_type,
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  p.proname as function_name
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON p.oid = (
  SELECT oid FROM pg_proc 
  WHERE proname = REPLACE(t.action_statement, 'EXECUTE FUNCTION ', '')::name 
  LIMIT 1
)
WHERE t.event_object_table = 'team_member_certificates'
ORDER BY t.trigger_name;

-- 7. CRITICAL: Test if you can INSERT with service role bypass
-- This would tell us if it's truly an RLS issue or something else
SELECT 
  '7. BYPASSING RLS' as check_type,
  'Run this in a service role context to test' as instruction,
  'If service role INSERT works, it IS an RLS issue' as interpretation,
  'If service role INSERT fails, it is NOT an RLS issue' as interpretation2;

-- ============================================================================
-- HYPOTHESIS
-- ============================================================================
-- Most likely culprits:
-- 1. profiles table (if created_by/updated_by reference it)
-- 2. organizations table (if team_members references it)
-- 3. A trigger function that queries another table with RLS
-- ============================================================================
