# Execute Backfill Script via Supabase CLI
# Executes the user_roles backfill migration

$sqlFile = "supabase\migrations\20260110_backfill_user_roles_from_profiles.sql"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Executando Backfill de User Roles" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if file exists
if (-Not (Test-Path $sqlFile)) {
    Write-Host "ERRO: Arquivo não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Arquivo encontrado: $sqlFile" -ForegroundColor Green
Write-Host "Executando via Supabase CLI..." -ForegroundColor Yellow
Write-Host ""

# Execute using supabase CLI
$content = Get-Content $sqlFile -Raw
$content | npx supabase db remote execute

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Concluído!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
