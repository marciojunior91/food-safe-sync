-- ============================================================================
-- VERIFY TEAM MEMBERS DATA - Quality Check
-- ============================================================================
-- This script checks if all team members have the required fields populated
-- Execute in Supabase SQL Editor
-- ============================================================================

-- Count total team members
SELECT 
  'Total Team Members' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 10 THEN '✓ Correct'
    ELSE '✗ Expected 10 team members'
  END as status
FROM team_members;

-- Check for missing required fields
SELECT 
  'Missing Display Names' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ All have display_name'
    ELSE '✗ Some missing display_name'
  END as status
FROM team_members
WHERE display_name IS NULL OR display_name = '';

SELECT 
  'Missing PIN Hash' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ All have PIN hash'
    ELSE '✗ Some missing PIN hash'
  END as status
FROM team_members
WHERE pin_hash IS NULL OR pin_hash = '';

SELECT 
  'Missing Organization ID' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ All have organization_id'
    ELSE '✗ Some missing organization_id'
  END as status
FROM team_members
WHERE organization_id IS NULL;

SELECT 
  'Missing Role Type' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ All have role_type'
    ELSE '✗ Some missing role_type'
  END as status
FROM team_members
WHERE role_type IS NULL;

SELECT 
  'Inactive Members' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) <= 1 THEN '✓ Expected 1 inactive'
    ELSE '⚠ Check inactive members'
  END as status
FROM team_members
WHERE is_active = false;

-- Detailed team members list with all fields
SELECT 
  id,
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  is_active,
  profile_complete,
  CASE WHEN pin_hash IS NOT NULL THEN '✓ Has PIN' ELSE '✗ Missing PIN' END as pin_status,
  CASE WHEN organization_id IS NOT NULL THEN '✓ Has Org' ELSE '✗ Missing Org' END as org_status,
  CASE WHEN auth_role_id IS NOT NULL THEN '✓ Linked Auth' ELSE '○ No Auth' END as auth_status,
  created_at
FROM team_members
ORDER BY 
  CASE role_type
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'leader_chef' THEN 3
    WHEN 'cook' THEN 4
    WHEN 'barista' THEN 5
    ELSE 6
  END,
  display_name;

-- Check for duplicate PINs (security issue)
SELECT 
  'Duplicate PINs' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ All PINs unique'
    ELSE '✗ SECURITY ISSUE: Duplicate PINs found!'
  END as status
FROM (
  SELECT pin_hash, COUNT(*) as pin_count
  FROM team_members
  WHERE pin_hash IS NOT NULL
  GROUP BY pin_hash
  HAVING COUNT(*) > 1
) duplicates;

-- Check role distribution
SELECT 
  role_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM team_members), 1) || '%' as percentage
FROM team_members
GROUP BY role_type
ORDER BY 
  CASE role_type
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'leader_chef' THEN 3
    WHEN 'cook' THEN 4
    WHEN 'barista' THEN 5
    ELSE 6
  END;

-- Check profile completeness
SELECT 
  'Profiles Complete' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✓ Most profiles complete'
    ELSE '⚠ Many incomplete profiles'
  END as status
FROM team_members
WHERE profile_complete = true;

SELECT 
  'Profiles Incomplete' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) <= 1 THEN '✓ Expected 1 incomplete (Teste Incomplete)'
    ELSE '⚠ Too many incomplete profiles'
  END as status
FROM team_members
WHERE profile_complete = false;

-- Check for members with email but no auth link
SELECT 
  'Email Without Auth' as check_name,
  COUNT(*) as count,
  STRING_AGG(display_name, ', ') as members,
  '⚠ These members have email but no auth account' as note
FROM team_members
WHERE email IS NOT NULL 
  AND email != ''
  AND auth_role_id IS NULL;

-- Summary by organization
SELECT 
  o.name as organization_name,
  COUNT(tm.id) as team_member_count,
  SUM(CASE WHEN tm.is_active THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN tm.profile_complete THEN 1 ELSE 0 END) as complete_profiles,
  STRING_AGG(DISTINCT tm.role_type::text, ', ' ORDER BY tm.role_type::text) as roles_present
FROM organizations o
LEFT JOIN team_members tm ON tm.organization_id = o.id
WHERE o.slug = 'tampa-test-restaurant' OR o.name LIKE '%Tampa%'
GROUP BY o.id, o.name;

-- ============================================================================
-- EXPECTED RESULTS SUMMARY
-- ============================================================================
-- Total Team Members: 10
-- All should have: display_name, pin_hash, organization_id, role_type
-- Active: 9 (1 should be inactive: "Ex-Employee Test")
-- Profile Complete: 9 (1 incomplete: "Teste Incomplete")
-- Roles Distribution:
--   - admin: 1 (João Silva)
--   - manager: 1 (Maria Santos)
--   - leader_chef: 1 (Carlos Oliveira)
--   - cook: 3 (Ana, Pedro, Lucia)
--   - barista: 2 (Roberto, Sofia)
--   - Special: 2 (Teste Incomplete, Ex-Employee)
-- No duplicate PINs
-- Most should have email and phone
-- ============================================================================
