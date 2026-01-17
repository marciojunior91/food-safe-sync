# Apply Team Members Migrations to Remote Supabase
# Project ID: imnecvcvhypnlvujajpn

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "APPLYING TEAM MEMBERS MIGRATIONS TO REMOTE SUPABASE" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$projectId = "imnecvcvhypnlvujajpn"
$migrationFile = "supabase\APPLY_TEAM_MEMBERS_MIGRATIONS.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Migration file: $migrationFile" -ForegroundColor Yellow
Write-Host "Project ID: $projectId" -ForegroundColor Yellow
Write-Host ""

# Read and clean SQL
$sqlContent = Get-Content $migrationFile -Raw
$sqlContent = $sqlContent -replace "\\echo '[^']*'", ""
$tempFile = "temp_team_members_migration.sql"
$sqlContent | Set-Content $tempFile -Encoding UTF8

Write-Host "Prepared migration script" -ForegroundColor Green
Write-Host ""
Write-Host "This will apply:" -ForegroundColor Yellow
Write-Host "  1. Add team_member_id to routine tasks" -ForegroundColor White
Write-Host "  2. Create PIN verification functions" -ForegroundColor White
Write-Host "  3. Enhance RLS policies" -ForegroundColor White
Write-Host "  4. Add validation functions" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Migration cancelled" -ForegroundColor Yellow
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 0
}

Write-Host ""
Write-Host "Applying migrations..." -ForegroundColor Cyan
Write-Host ""

try {
    npx supabase db execute --project-id $projectId --file $tempFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "===================================================================" -ForegroundColor Green
        Write-Host "TEAM MEMBERS MIGRATIONS APPLIED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "===================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Regenerate types: npx supabase gen types typescript --project-id $projectId > src/integrations/supabase/types.ts" -ForegroundColor White
        Write-Host "  2. Test the application: npm run dev" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "ERROR: Migration failed!" -ForegroundColor Red
        Write-Host "Try applying manually in Supabase Dashboard SQL Editor" -ForegroundColor White
        Write-Host ""
        Remove-Item $tempFile -ErrorAction SilentlyContinue
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Exception occurred!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor White
    Write-Host ""
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $tempFile -ErrorAction SilentlyContinue
Write-Host "Done!" -ForegroundColor Cyan
