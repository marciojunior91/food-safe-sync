# ============================================================================
# Script de Diagnóstico - User Roles Issue
# Executa queries diretamente no Supabase via psql
# ============================================================================

# String de conexão do Supabase
$connectionString = "postgresql://postgres.imnecvcvhypnlvujajpn:TampaAPP@2026@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DIAGNÓSTICO - User Roles" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Query 1: Contagens
Write-Host "1. Verificando contagens..." -ForegroundColor Yellow
$query1 = @"
SELECT 
  'profiles' as table_name, 
  COUNT(*) as count 
FROM profiles
UNION ALL
SELECT 
  'user_roles' as table_name, 
  COUNT(*) as count 
FROM user_roles
UNION ALL
SELECT 
  'team_members (with auth_role_id)' as table_name, 
  COUNT(*) as count 
FROM team_members 
WHERE auth_role_id IS NOT NULL
UNION ALL
SELECT 
  'team_members (without auth_role_id)' as table_name, 
  COUNT(*) as count 
FROM team_members 
WHERE auth_role_id IS NULL;
"@

# Executar via supabase CLI
Write-Host "Executando query via Supabase CLI..." -ForegroundColor Gray
$query1 | npx supabase db remote --db-url $connectionString --

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
