-- ============================================================================
-- RESTORE: Re-enable RLS on All Tables
-- ============================================================================
-- Run this AFTER testing with RLS disabled
-- ============================================================================

-- Re-enable RLS
ALTER TABLE team_member_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  'RLS RESTORED:' as stage,
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
  RAISE NOTICE '✅ RLS RE-ENABLED ON ALL TABLES';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Apply proper policies';
  RAISE NOTICE '  1. Run assign-roles-quick.sql';
  RAISE NOTICE '  2. Run COMPLETE_FIX_BOTH_TABLES.sql';
  RAISE NOTICE '';
END $$;
