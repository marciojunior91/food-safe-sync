-- Quick Check: Team Members Essential Fields
-- Copy and paste this into Supabase SQL Editor

-- 1. Check if all 10 team members exist
SELECT COUNT(*) as total_members FROM team_members;

-- 2. List all team members with field status
SELECT 
  display_name,
  role_type,
  CASE WHEN pin_hash IS NOT NULL AND pin_hash != '' THEN '✓' ELSE '✗ MISSING' END as has_pin,
  CASE WHEN email IS NOT NULL AND email != '' THEN '✓' ELSE '○' END as has_email,
  CASE WHEN organization_id IS NOT NULL THEN '✓' ELSE '✗ MISSING' END as has_org,
  is_active,
  profile_complete
FROM team_members
ORDER BY 
  CASE role_type
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'leader_chef' THEN 3
    WHEN 'cook' THEN 4
    WHEN 'barista' THEN 5
    ELSE 6
  END;

-- 3. Check for any CRITICAL missing fields
SELECT 
  CASE 
    WHEN COUNT(*) FILTER (WHERE pin_hash IS NULL OR pin_hash = '') > 0 
    THEN '✗ CRITICAL: ' || COUNT(*) FILTER (WHERE pin_hash IS NULL OR pin_hash = '') || ' members without PIN'
    ELSE '✓ All members have PIN'
  END as pin_check,
  
  CASE 
    WHEN COUNT(*) FILTER (WHERE organization_id IS NULL) > 0 
    THEN '✗ CRITICAL: ' || COUNT(*) FILTER (WHERE organization_id IS NULL) || ' members without organization'
    ELSE '✓ All members have organization'
  END as org_check,
  
  CASE 
    WHEN COUNT(*) FILTER (WHERE role_type IS NULL) > 0 
    THEN '✗ CRITICAL: ' || COUNT(*) FILTER (WHERE role_type IS NULL) || ' members without role'
    ELSE '✓ All members have role'
  END as role_check
FROM team_members;
