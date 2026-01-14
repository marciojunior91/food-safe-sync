-- ============================================================================
-- NUCLEAR OPTION: Disable RLS on ALL Related Tables
-- ============================================================================
-- This will help us identify which table is causing the RLS error
-- DO NOT use in production - this is ONLY for diagnosis!
-- ============================================================================

-- Show current RLS status
SELECT 
  'BEFORE:' as stage,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'team_member_certificates',
    'team_members',
    'profiles',
    'user_roles',
    'organizations'
  )
ORDER BY tablename;

-- Disable RLS on all related tables
ALTER TABLE team_member_certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Show new RLS status
SELECT 
  'AFTER:' as stage,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'team_member_certificates',
    'team_members',
    'profiles',
    'user_roles',
    'organizations'
  )
ORDER BY tablename;

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  RLS DISABLED ON ALL RELATED TABLES';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables affected:';
  RAISE NOTICE '  - team_member_certificates';
  RAISE NOTICE '  - team_members';
  RAISE NOTICE '  - profiles';
  RAISE NOTICE '  - user_roles';
  RAISE NOTICE '  - organizations';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 NOW TEST UPLOAD:';
  RAISE NOTICE '   1. Refresh browser (Ctrl + Shift + R)';
  RAISE NOTICE '   2. Try uploading a certificate';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTS:';
  RAISE NOTICE '   ✅ If upload WORKS: One of these tables was blocking';
  RAISE NOTICE '   ❌ If upload FAILS: Problem is NOT RLS (trigger? constraint?)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Re-enable RLS after testing!';
  RAISE NOTICE '   Run restore-rls-all-tables.sql when done';
  RAISE NOTICE '';
END $$;
