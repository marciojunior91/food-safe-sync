-- ============================================================================
-- CHECK: All Constraints and Triggers on team_member_certificates
-- ============================================================================

-- 1. Check table structure
SELECT 
  '1. Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'team_member_certificates'
ORDER BY ordinal_position;

-- 2. Check constraints (including foreign keys)
SELECT 
  '2. Constraints' as check_type,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'team_member_certificates';

-- 3. Check foreign key details
SELECT 
  '3. Foreign Keys' as check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'team_member_certificates'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Check triggers
SELECT 
  '4. Triggers' as check_type,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'team_member_certificates';

-- 5. Check if table has organization_id column
SELECT 
  '5. Has organization_id?' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'team_member_certificates' 
      AND column_name = 'organization_id'
    ) THEN '✅ YES'
    ELSE '❌ NO'
  END as has_org_column;

-- 6. Check RLS is enabled
SELECT 
  '6. RLS Status' as check_type,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as force_rls
FROM pg_class
WHERE relname = 'team_member_certificates';

-- 7. List ALL current policies
SELECT 
  '7. All Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'team_member_certificates';
