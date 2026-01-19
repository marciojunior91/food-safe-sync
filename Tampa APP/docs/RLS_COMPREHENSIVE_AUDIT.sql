-- =====================================================
-- COMPREHENSIVE RLS SECURITY AUDIT - ALL TABLES
-- =====================================================
-- Goal: Ensure proper organization isolation across ALL tables
-- Pattern: Check user_roles, NOT direct team_members.id = auth.uid()
-- =====================================================

-- =====================================================
-- STEP 1: IDENTIFY ALL TABLES WITH RLS ENABLED
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- =====================================================
-- STEP 2: CHECK ALL POLICIES FOR BROKEN PATTERNS
-- =====================================================

-- Find policies comparing team_members.id with auth.uid() (BROKEN!)
SELECT 
  '🔴 BROKEN POLICIES' as status,
  tablename,
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%team_members.id = auth.uid()%' 
       OR qual LIKE '%team_members.id=auth.uid()%')
ORDER BY tablename, cmd;

-- Find policies that don't check user_roles (SUSPICIOUS!)
SELECT 
  '⚠️ SUSPICIOUS POLICIES' as status,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual NOT LIKE '%user_roles%' AND with_check NOT LIKE '%user_roles%' 
    THEN '❌ No user_roles check'
    ELSE '✅ Has user_roles'
  END as check_result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename NOT IN ('feed_posts', 'feed_reactions', 'feed_comments', 'feed_mentions', 'feed_attachments')
  AND (qual NOT LIKE '%user_roles%' AND with_check NOT LIKE '%user_roles%')
ORDER BY tablename, cmd;

-- =====================================================
-- STEP 3: DETAILED POLICY REVIEW BY TABLE
-- =====================================================

-- RECIPES
SELECT '📋 RECIPES POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'recipes'
ORDER BY cmd;

-- PRODUCTS  
SELECT '📋 PRODUCTS POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY cmd;

-- TEAM_MEMBERS
SELECT '📋 TEAM_MEMBERS POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'team_members'
ORDER BY cmd;

-- USER_ROLES
SELECT '📋 USER_ROLES POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY cmd;

-- ROUTINE_TASKS
SELECT '📋 ROUTINE_TASKS POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'routine_tasks'
ORDER BY cmd;

-- ROUTINE_TASK_SUBTASKS
SELECT '📋 ROUTINE_TASK_SUBTASKS POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'routine_task_subtasks'
ORDER BY cmd;

-- ROUTINE_TASK_ACTIVITY
SELECT '📋 ROUTINE_TASK_ACTIVITY POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'routine_task_activity'
ORDER BY cmd;

-- LABEL_CATEGORIES
SELECT '📋 LABEL_CATEGORIES POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'label_categories'
ORDER BY cmd;

-- LABEL_SUBCATEGORIES
SELECT '📋 LABEL_SUBCATEGORIES POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'label_subcategories'
ORDER BY cmd;

-- ALLERGEN_PRODUCT_JUNCTION
SELECT '📋 ALLERGEN_PRODUCT_JUNCTION POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'allergen_product_junction'
ORDER BY cmd;

-- PRINT_QUEUE
SELECT '📋 PRINT_QUEUE POLICIES' as review;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'print_queue'
ORDER BY cmd;

-- =====================================================
-- STEP 4: TEST ORGANIZATION ISOLATION
-- =====================================================

-- Check if tables have organization_id column
SELECT 
  'Tables with organization_id' as info,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'organization_id'
ORDER BY table_name;

-- =====================================================
-- STEP 5: VERIFY USER_ROLES TABLE INTEGRITY
-- =====================================================

-- Check user_roles structure
SELECT 
  'User Roles Data' as check,
  ur.user_id,
  au.email,
  ur.organization_id,
  o.name as org_name,
  ur.role
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN organizations o ON o.id = ur.organization_id
ORDER BY ur.created_at DESC
LIMIT 20;

-- Check for NULL organization_ids in user_roles (CRITICAL BUG!)
SELECT 
  'NULL Organization IDs in user_roles' as critical_check,
  COUNT(*) as null_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ CRITICAL: Fix these immediately!'
    ELSE '✅ All good'
  END as status
FROM user_roles
WHERE organization_id IS NULL;

-- =====================================================
-- STEP 6: SUMMARY REPORT
-- =====================================================

SELECT 
  '📊 SECURITY AUDIT SUMMARY' as report,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND (qual LIKE '%team_members.id = auth.uid()%' OR qual LIKE '%team_members.id=auth.uid()%')
  ) as broken_policies,
  (SELECT COUNT(*) FROM user_roles WHERE organization_id IS NULL) as null_org_ids;

-- =====================================================
-- NEXT STEPS (After running this audit)
-- =====================================================

/*
Based on the results above:

1. Fix any BROKEN POLICIES (team_members.id = auth.uid())
   → Use the pattern from feed tables
   → Check user_roles instead

2. Fix NULL organization_ids in user_roles
   → Run: docs/FIX_USER_ROLES_ADD_UPDATED_AT.sql

3. For each table without proper RLS:
   a. Identify the organization isolation column
   b. Create policies checking user_roles
   c. Test with 2 organizations
   d. Verify isolation

4. Priority order:
   - CRITICAL: team_members, user_roles (access control)
   - HIGH: recipes, products (business data)
   - MEDIUM: knowledge_base, training_materials
   - LOW: print_queue, label_categories (less sensitive)
*/
