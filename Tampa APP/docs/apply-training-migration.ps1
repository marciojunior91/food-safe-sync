# ============================================================================
# APPLY TRAINING CENTER MIGRATION
# ============================================================================
# Purpose: Apply the Training Center database schema
# Date: January 25, 2026 - Day 8
# ============================================================================

Write-Host "🎓 Training Center Migration - Day 8" -ForegroundColor Cyan
Write-Host ""

$migrationFile = "supabase/migrations/20260125000000_training_center.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Migration file found: $migrationFile" -ForegroundColor Green
Write-Host ""
Write-Host "📊 This migration will:" -ForegroundColor Yellow
Write-Host "  1. Create training_courses table" -ForegroundColor White
Write-Host "  2. Create training_enrollments table" -ForegroundColor White
Write-Host "  3. Set up RLS policies" -ForegroundColor White
Write-Host "  4. Seed 6 sample training courses:" -ForegroundColor White
Write-Host "     • Food Safety Basics (Required, Annual Renewal)" -ForegroundColor Gray
Write-Host "     • HACCP Principles (Required, Annual Renewal)" -ForegroundColor Gray
Write-Host "     • Allergen Awareness & Management (Required)" -ForegroundColor Gray
Write-Host "     • Temperature Control & Monitoring (Required)" -ForegroundColor Gray
Write-Host "     • Cleaning & Sanitization Procedures" -ForegroundColor Gray
Write-Host "     • Personal Hygiene for Food Handlers (Required)" -ForegroundColor Gray
Write-Host ""

# Check if Supabase CLI is installed
$supabasePath = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabasePath) {
    Write-Host "⚠️  Supabase CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Manual Application Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open Supabase Dashboard: https://supabase.com/dashboard/project/_/editor" -ForegroundColor White
    Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
    Write-Host "3. Open file: $migrationFile" -ForegroundColor White
    Write-Host "4. Copy the entire SQL content" -ForegroundColor White
    Write-Host "5. Paste into SQL Editor and click 'Run'" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to open the migration file..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process $migrationFile
    exit 0
}

# Apply migration using Supabase CLI
Write-Host "🚀 Applying migration..." -ForegroundColor Cyan

try {
    $env:SUPABASE_ACCESS_TOKEN = "sbp_7d8b1f1db19be29b7bdfc1d6ccd7aa3dfcf88f0c"
    $result = supabase db push 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Visit Training Center page in the app" -ForegroundColor White
        Write-Host "  2. You should see 6 training courses" -ForegroundColor White
        Write-Host "  3. Enroll in a course to test functionality" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error applying migration: $_" -ForegroundColor Red
    exit 1
}
