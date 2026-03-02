# ============================================================================
# Apply Task Attachments Storage Policies Migration
# ============================================================================
# Fixes: TASKS-13 - Upload de foto falha
# Issue: Missing storage.objects RLS policies for task-attachments bucket
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TASK ATTACHMENTS STORAGE FIX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Conexão Supabase project
$PROJECT_REF = "qmxjunrjmyjcitclbhqu"
$DB_PASSWORD = Read-Host "Enter your Supabase database password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$DB_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "📡 Connecting to Supabase..." -ForegroundColor Yellow
Write-Host ""

# Caminho da migração
$MIGRATION_FILE = "supabase\migrations\20260301000000_fix_task_attachments_storage_policies.sql"

# Verificar se arquivo existe
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ Migration file not found: $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

# Ler conteúdo da migração
$SQL_CONTENT = Get-Content $MIGRATION_FILE -Raw

# Aplicar via psql
Write-Host "🚀 Applying storage policies..." -ForegroundColor Cyan

$env:PGPASSWORD = $DB_PASSWORD_PLAIN

psql "postgresql://postgres:$DB_PASSWORD_PLAIN@db.$PROJECT_REF.supabase.co:5432/postgres" `
    -c "$SQL_CONTENT"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Storage policies applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now try uploading a photo in the app!" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to apply policies" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Limpar password da memória
Remove-Variable DB_PASSWORD_PLAIN
$env:PGPASSWORD = $null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
