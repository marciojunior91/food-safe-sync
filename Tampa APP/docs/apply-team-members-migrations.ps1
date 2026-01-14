# ============================================================================
# Apply Team Members Migrations to Remote Supabase
# ============================================================================
# This script applies the team members migrations to your remote database
# Project ID: imnecvcvhypnlvujajpn
# ============================================================================

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "APPLYING TEAM MEMBERS MIGRATIONS TO REMOTE SUPABASE" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$projectId = "imnecvcvhypnlvujajpn"
$migrationFile = "supabase\APPLY_TEAM_MEMBERS_MIGRATIONS.sql"

# Check if migration file exists
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Migration file: $migrationFile" -ForegroundColor Yellow
Write-Host "🎯 Project ID: $projectId" -ForegroundColor Yellow
Write-Host ""

# Read the SQL file and remove \echo commands (not supported by psql in this context)
Write-Host "📖 Reading migration file..." -ForegroundColor Cyan
$sqlContent = Get-Content $migrationFile -Raw

# Remove \echo commands
$sqlContent = $sqlContent -replace "\\echo '[^']*'", ""

# Save to temp file without \echo commands
$tempFile = "temp_team_members_migration.sql"
$sqlContent | Set-Content $tempFile -Encoding UTF8

Write-Host "✅ Prepared migration script" -ForegroundColor Green
Write-Host ""

# Prompt for confirmation
Write-Host "⚠️  This will apply the following migrations:" -ForegroundColor Yellow
Write-Host "   1. Add team_member_id to routine tasks" -ForegroundColor White
Write-Host "   2. Create PIN verification functions" -ForegroundColor White
Write-Host "   3. Enhance RLS policies" -ForegroundColor White
Write-Host "   4. Add validation functions" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Migration cancelled by user" -ForegroundColor Yellow
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 0
}

Write-Host ""
Write-Host "🚀 Applying migrations..." -ForegroundColor Cyan
Write-Host ""

# Execute the SQL using Supabase CLI
try {
    # Use npx to run supabase db execute
    $output = npx supabase db execute --project-id $projectId --file $tempFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "====================================================================" -ForegroundColor Green
        Write-Host "TEAM MEMBERS MIGRATIONS APPLIED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "====================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Applied:" -ForegroundColor White
        Write-Host "  ✓ Added team_member_id columns to routine tasks" -ForegroundColor Green
        Write-Host "  ✓ Created PIN verification functions" -ForegroundColor Green
        Write-Host "  ✓ Enhanced RLS policies with user_roles validation" -ForegroundColor Green
        Write-Host "  ✓ Created helper functions for team member management" -ForegroundColor Green
        Write-Host "  ✓ Added validation function for routine tasks" -ForegroundColor Green
        Write-Host "  ✓ Created performance indexes" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Regenerate TypeScript types" -ForegroundColor White
        Write-Host "     Run: npx supabase gen types typescript --project-id $projectId > src/integrations/supabase/types.ts" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Test the application" -ForegroundColor White
        Write-Host "     Run: npm run dev" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  3. Apply seed data (optional)" -ForegroundColor White
        Write-Host "     Use: supabase/seeds/seed_test_team_members_simple.sql" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ ERROR: Migration failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Output:" -ForegroundColor Yellow
        Write-Host $output -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  - Check if you're logged in: npx supabase login" -ForegroundColor White
        Write-Host "  - Verify project ID: $projectId" -ForegroundColor White
        Write-Host "  - Try applying manually in Supabase Dashboard SQL Editor" -ForegroundColor White
        Write-Host ""
        Remove-Item $tempFile -ErrorAction SilentlyContinue
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Exception occurred!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor White
    Write-Host ""
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 1
}

# Clean up temp file
Remove-Item $tempFile -ErrorAction SilentlyContinue

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
