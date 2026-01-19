-- =====================================================
-- CHECK: What team members actually exist?
-- =====================================================

-- Show ALL team members in your organization
SELECT 
  'All Team Members' as check,
  tm.id,
  tm.display_name,
  tm.role_type,
  tm.organization_id,
  tm.created_at
FROM team_members tm
WHERE tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY tm.created_at DESC;

-- Check if "Manager Marcio" exists with different casing or spacing
SELECT 
  'Search for Marcio' as check,
  tm.id,
  tm.display_name,
  tm.role_type,
  LENGTH(tm.display_name) as name_length,
  CASE 
    WHEN tm.display_name ILIKE '%marcio%' THEN '✅ Found Marcio'
    ELSE 'Not Marcio'
  END as is_marcio
FROM team_members tm
WHERE tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
  AND tm.display_name ILIKE '%marcio%';

-- =====================================================
-- SOLUTION: Create Manager Marcio if missing
-- =====================================================

-- Option 1: Create Manager Marcio team member
/*
INSERT INTO team_members (
  organization_id,
  display_name,
  role_type,
  created_by
) VALUES (
  'b818500f-27f7-47c3-b62a-7d76d5505d57',
  'Manager Marcio',
  'manager',
  'cd9af250-133d-409e-9e97-f570f767648d'  -- Your auth user ID
)
RETURNING id, display_name, role_type;
*/

-- =====================================================
-- ALTERNATIVE: If team members exist but with different names
-- =====================================================

-- Show what the app is actually sending as selectedUser
-- Check your browser console for: console.log('selectedUser:', selectedUser)
