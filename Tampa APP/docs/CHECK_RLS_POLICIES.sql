-- ==========================================
-- RLS POLICIES AUDIT SCRIPT
-- Tampa APP - January 21, 2026
-- ==========================================
-- 
-- Purpose: Verify Row Level Security policies
-- ensure proper multi-organization isolation
--
-- Run this in Supabase SQL Editor to check
-- all RLS policies across critical tables
-- ==========================================

-- 1. CHECK WHICH TABLES HAVE RLS ENABLED
-- ==========================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'profiles',
    'user_roles',
    'team_members',
    'products',
    'categories',
    'subcategories',
    'allergens',
    'product_allergens',
    'printed_labels',
    'label_drafts',
    'print_queue',
    'recipes',
    'recipe_ingredients',
    'routine_tasks',
    'task_templates',
    'feed_posts',
    'feed_comments',
    'feed_reactions',
    'feed_attachments',
    'zebra_printers'
  )
ORDER BY tablename;

-- 2. LIST ALL POLICIES ON CRITICAL TABLES
-- ==========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'profiles',
    'user_roles',
    'team_members',
    'products',
    'categories',
    'subcategories',
    'printed_labels',
    'recipes',
    'routine_tasks',
    'feed_posts',
    'zebra_printers'
  )
ORDER BY tablename, policyname;

-- 3. CHECK ORGANIZATION ISOLATION - PRODUCTS TABLE
-- ==========================================
-- This checks if products have organization_id filtering
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'products'
  AND qual LIKE '%organization_id%'
ORDER BY policyname;

-- 4. CHECK ORGANIZATION ISOLATION - PROFILES TABLE
-- ==========================================
-- Profiles should filter by organization_id
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- 5. CHECK TEAM MEMBERS ISOLATION
-- ==========================================
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'team_members'
ORDER BY policyname;

-- 6. CHECK FEED POSTS ISOLATION
-- ==========================================
-- Feed should be organization-scoped
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'feed_posts'
  AND qual LIKE '%organization_id%'
ORDER BY policyname;

-- 7. CHECK ROUTINE TASKS ISOLATION
-- ==========================================
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'routine_tasks'
ORDER BY policyname;

-- 8. CHECK ZEBRA PRINTERS ISOLATION
-- ==========================================
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'zebra_printers'
ORDER BY policyname;

-- 9. FIND TABLES WITHOUT RLS ENABLED (SECURITY RISK!)
-- ==========================================
SELECT 
  schemaname,
  tablename,
  'WARNING: RLS NOT ENABLED!' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- 10. CHECK FOR POLICIES WITHOUT ORGANIZATION FILTERING
-- ==========================================
-- This finds SELECT policies that don't check organization_id
-- (potential data leakage!)
SELECT 
  tablename,
  policyname,
  cmd,
  'POTENTIAL LEAK: No org filter' as warning
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND tablename IN (
    'products',
    'categories',
    'subcategories',
    'team_members',
    'routine_tasks',
    'feed_posts'
  )
  AND (
    qual NOT LIKE '%organization_id%'
    OR qual IS NULL
  )
ORDER BY tablename, policyname;

-- 11. VERIFY GET_CURRENT_USER_CONTEXT FUNCTION
-- ==========================================
-- This RPC is used throughout the app
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'get_current_user_context';

-- 12. TEST MULTI-ORG ISOLATION (MANUAL TEST)
-- ==========================================
-- After running above queries, manually test:
-- 
-- 1. Create test user in Org A
-- 2. Create test user in Org B
-- 3. Login as User A, verify can only see Org A data
-- 4. Login as User B, verify can only see Org B data
-- 5. Try to query other org's data directly (should fail)

-- EXPECTED RESULTS:
-- ==========================================
-- ✅ All critical tables should have RLS enabled (rowsecurity = true)
-- ✅ All SELECT policies should filter by organization_id
-- ✅ INSERT/UPDATE policies should verify organization_id match
-- ✅ No warnings about missing org filters
-- ✅ get_current_user_context function exists and returns org_id
