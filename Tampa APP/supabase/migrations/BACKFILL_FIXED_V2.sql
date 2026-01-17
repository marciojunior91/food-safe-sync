-- ============================================================================
-- BACKFILL CORRIGIDO - Versão com tratamento completo de erros
-- ============================================================================

DO $$
DECLARE
  v_profile RECORD;
  v_inserted_count INT := 0;
  v_error_count INT := 0;
  v_total_profiles INT;
  v_existing_roles INT;
BEGIN
  -- Contar totais
  SELECT COUNT(*) INTO v_total_profiles FROM profiles;
  SELECT COUNT(*) INTO v_existing_roles FROM user_roles;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL USER_ROLES - Versão Corrigida';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', v_total_profiles;
  RAISE NOTICE 'User_roles existentes: %', v_existing_roles;
  RAISE NOTICE 'Profiles sem role: %', v_total_profiles - v_existing_roles;
  RAISE NOTICE '';
  
  -- Processar cada profile individualmente
  FOR v_profile IN 
    SELECT p.user_id, p.display_name, p.email, p.created_at
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
    )
    ORDER BY p.created_at
  LOOP
    BEGIN
      -- Tentar inserir
      INSERT INTO user_roles (user_id, role, created_at)
      VALUES (v_profile.user_id, 'staff'::app_role, v_profile.created_at)
      ON CONFLICT (user_id) DO NOTHING;
      
      v_inserted_count := v_inserted_count + 1;
      RAISE NOTICE '✓ Inserido: % (%) - role: staff', 
        v_profile.display_name, v_profile.email;
        
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE NOTICE '✗ ERRO ao inserir % (%): %', 
        v_profile.display_name, v_profile.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESULTADO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Inseridos com sucesso: %', v_inserted_count;
  RAISE NOTICE '✗ Erros: %', v_error_count;
  RAISE NOTICE 'Total user_roles agora: %', (SELECT COUNT(*) FROM user_roles);
  RAISE NOTICE '';
  
  IF v_inserted_count = 0 AND v_error_count = 0 THEN
    RAISE NOTICE '✓ Todos os profiles já têm user_roles!';
  ELSIF v_error_count > 0 THEN
    RAISE NOTICE '⚠ Houve erros! Veja os detalhes acima.';
  ELSE
    RAISE NOTICE '✓ Backfill concluído com sucesso!';
  END IF;
END $$;

-- Verificação final
SELECT 
  'VERIFICAÇÃO FINAL' as check_type,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM user_roles) as total_user_roles,
  (SELECT COUNT(*) FROM profiles) - (SELECT COUNT(*) FROM user_roles) as faltando,
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles) = (SELECT COUNT(*) FROM user_roles) 
    THEN '✓ COMPLETO' 
    ELSE '✗ FALTAM REGISTROS' 
  END as status;

-- Mostrar quem foi inserido
SELECT 
  'USUÁRIOS COM ROLE STAFF' as info,
  p.display_name,
  p.email,
  ur.role::text as role
FROM profiles p
JOIN user_roles ur ON p.user_id = ur.user_id
WHERE ur.role = 'staff'
ORDER BY p.display_name;
