-- ============================================================================
-- SEED DATA: Test Team Members for Development
-- ============================================================================
-- This script creates test team members for development and testing
-- Organization: Tampa APP Test Restaurant
-- ============================================================================

-- First, ensure we have a test organization
DO $$
DECLARE
  test_org_id UUID;
  test_user_id UUID;
BEGIN
  -- Get or create test organization
  SELECT id INTO test_org_id
  FROM organizations
  WHERE slug = 'tampa-test-restaurant'
  LIMIT 1;

  IF test_org_id IS NULL THEN
    INSERT INTO organizations (name, slug)
    VALUES ('Tampa Test Restaurant', 'tampa-test-restaurant')
    RETURNING id INTO test_org_id;
    
    RAISE NOTICE 'Created test organization: %', test_org_id;
  ELSE
    RAISE NOTICE 'Using existing test organization: %', test_org_id;
  END IF;

  -- Store org_id for later use
  CREATE TEMP TABLE IF NOT EXISTS temp_test_org (org_id UUID);
  DELETE FROM temp_test_org;
  INSERT INTO temp_test_org VALUES (test_org_id);
END $$;

-- ============================================================================
-- TEST TEAM MEMBERS
-- ============================================================================

-- Team Member 1: João Silva - Head Chef (Admin)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'João Silva',
  'joao.silva@tampatest.com',
  '+1234567001',
  'Head Chef',
  '2024-01-15'::DATE,
  'admin'::team_member_role,
  org_id,
  true,
  true,
  -- PIN: 1234 (hashed with SHA-256)
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 2: Maria Santos - Kitchen Manager (Manager)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Maria Santos',
  'maria.santos@tampatest.com',
  '+1234567002',
  'Kitchen Manager',
  '2024-02-01'::DATE,
  'manager'::team_member_role,
  org_id,
  true,
  true,
  -- PIN: 5678 (hashed)
  'e7cf3ef4f17c3999a94f2c6f612e8a888e5b1026878e4e19398b23bd38ec221a',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 3: Carlos Oliveira - Sous Chef (Leader Chef)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Carlos Oliveira',
  'carlos.oliveira@tampatest.com',
  '+1234567003',
  'Sous Chef',
  '2024-03-10'::DATE,
  'leader_chef'::team_member_role,
  org_id,
  true,
  true,
  -- PIN: 9999 (hashed)
  'ad0234829205b9033196ba818f7a872b2f1f6e9e78e46e41c5c0a91f49e2c8a4',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 4: Ana Costa - Line Cook (Cook)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Ana Costa',
  'ana.costa@tampatest.com',
  '+1234567004',
  'Line Cook',
  '2024-04-15'::DATE,
  'cook'::team_member_role,
  org_id,
  true,
  true,
  -- PIN: 1111 (hashed)
  'bcb15f821479b4d5772bd0ca866c00ad5f926e3580720659cc80d39c9d09802a',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 5: Pedro Almeida - Line Cook (Cook)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Pedro Almeida',
  'pedro.almeida@tampatest.com',
  '+1234567005',
  'Line Cook',
  '2024-05-01'::DATE,
  'cook'::team_member_role,
  org_id,
  true,
  true,
  -- PIN: 2222 (hashed)
  '1c8bfe8f801d79745c4631d09fff36c82aa37fc4cce4fc946683d7b336b63032',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 6: Lucia Fernandes - Prep Cook (Cook)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Lucia Fernandes',
  'lucia.fernandes@tampatest.com',
  '+1234567006',
  'Prep Cook',
  '2024-06-10'::DATE,
  'cook'::team_member_role,
  org_id,
  true,
  true,
  -- PIN: 3333 (hashed)
  '76ff123440fe0e7b0ee11b7be756df8c7e6e97e9b18a84526fba5c1f4ef2d8c2',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 7: Roberto Lima - Barista (Barista)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Roberto Lima',
  'roberto.lima@tampatest.com',
  '+1234567007',
  'Head Barista',
  '2024-07-01'::DATE,
  'barista'::team_member_role,
  org_id,
  true,
  true,
  -- PIN: 4444 (hashed)
  'cc23c1fd2e7b9a28a3d9b7c9e3cb6d3b9e4c4e9b1c2d6e9b1c2d6e9b1c2d6e9b',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 8: Sofia Rodrigues - Barista (Barista)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Sofia Rodrigues',
  'sofia.rodrigues@tampatest.com',
  '+1234567008',
  'Barista',
  '2024-08-15'::DATE,
  'barista'::team_member_role,
  org_id,
  true,
  true,
  -- PIN: 5555 (hashed)
  'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 9: Teste Incomplete - Incomplete Profile (for testing)
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  required_fields_missing,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Teste Incomplete',
  NULL, -- Missing email
  NULL, -- Missing phone
  NULL, -- Missing position
  NULL, -- Missing hire_date
  'cook'::team_member_role,
  org_id,
  true,
  false,
  ARRAY['email', 'phone', 'position', 'hire_date'],
  -- PIN: 0000 (hashed)
  '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- Team Member 10: Inactive User - For testing inactive filter
INSERT INTO team_members (
  display_name,
  email,
  phone,
  position,
  hire_date,
  role_type,
  organization_id,
  is_active,
  profile_complete,
  pin_hash,
  created_at,
  updated_at
)
SELECT
  'Ex-Employee Test',
  'inactive@tampatest.com',
  '+1234567099',
  'Former Cook',
  '2023-01-01'::DATE,
  'cook'::team_member_role,
  org_id,
  false, -- Inactive
  true,
  '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e',
  NOW(),
  NOW()
FROM temp_test_org
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  org_id UUID;
BEGIN
  SELECT org_id INTO org_id FROM temp_test_org;
  
  SELECT COUNT(*) INTO total_count
  FROM team_members
  WHERE organization_id = org_id;
  
  SELECT COUNT(*) INTO active_count
  FROM team_members
  WHERE organization_id = org_id AND is_active = true;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'TEST TEAM MEMBERS CREATED SUCCESSFULLY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Organization: Tampa Test Restaurant';
  RAISE NOTICE 'Organization ID: %', org_id;
  RAISE NOTICE 'Total team members: %', total_count;
  RAISE NOTICE 'Active team members: %', active_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Team Members Summary:';
  RAISE NOTICE '  1. João Silva - Head Chef (admin) - PIN: 1234';
  RAISE NOTICE '  2. Maria Santos - Kitchen Manager (manager) - PIN: 5678';
  RAISE NOTICE '  3. Carlos Oliveira - Sous Chef (leader_chef) - PIN: 9999';
  RAISE NOTICE '  4. Ana Costa - Line Cook (cook) - PIN: 1111';
  RAISE NOTICE '  5. Pedro Almeida - Line Cook (cook) - PIN: 2222';
  RAISE NOTICE '  6. Lucia Fernandes - Prep Cook (cook) - PIN: 3333';
  RAISE NOTICE '  7. Roberto Lima - Head Barista (barista) - PIN: 4444';
  RAISE NOTICE '  8. Sofia Rodrigues - Barista (barista) - PIN: 5555';
  RAISE NOTICE '  9. Teste Incomplete - Incomplete Profile (cook) - PIN: 0000';
  RAISE NOTICE ' 10. Ex-Employee Test - INACTIVE (cook)';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: PINs are for testing only! Change in production.';
  RAISE NOTICE '============================================================================';
END $$;

-- Display created team members
SELECT 
  id,
  display_name,
  position,
  role_type,
  email,
  is_active,
  profile_complete,
  created_at
FROM team_members
WHERE organization_id = (SELECT org_id FROM temp_test_org)
ORDER BY 
  CASE role_type
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'leader_chef' THEN 3
    WHEN 'cook' THEN 4
    WHEN 'barista' THEN 5
  END,
  display_name;

-- Clean up temp table
DROP TABLE IF EXISTS temp_test_org;
