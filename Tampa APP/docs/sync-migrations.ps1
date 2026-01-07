# Sync Migration History with Supabase Remote Database
# This script marks all local migrations as applied in the remote database

Write-Host "Starting migration sync..." -ForegroundColor Green
Write-Host ""

$migrations = @(
    "20241227000000",
    "20241227120000",
    "20241227130000",
    "20241228000000",
    "20241228010000",
    "20250101000000",
    "20250101000001",
    "20250101000002",
    "20250101000002",
    "20250101000003",
    "20250820125502",
    "20250821020722",
    "20250821021540",
    "20250821023701",
    "20250821024304",
    "20250821061804",
    "20250821063315",
    "20250821063346",
    "20251006205806",
    "20251006212603",
    "20251006214310",
    "20251006214931",
    "20251006215528",
    "20251006215603",
    "20251016014922",
    "20251023031219",
    "20251026034330",
    "20251026040135",
    "20251026",
    "20251027",
    "20251202100000",
    "20251202120000",
    "20251203000000",
    "20251203120000",
    "20251203130000",
    "20251203140000",
    "20251203150000",
    "20251205000000",
    "20251209140000",
    "20251209140100",
    "20251209140200",
    "20251209140300",
    "20251209140400",
    "20251209140500",
    "20251215000000",
    "20251216000000",
    "20251216000000",
    "20251216120000",
    "20251216130000",
    "20251217000000",
    "20260103000000",
    "20260103000001"
)

$total = $migrations.Count
$current = 0

foreach ($migration in $migrations) {
    $current++
    $percent = [math]::Round(($current / $total) * 100)
    Write-Host "[$current/$total] ($percent%) Marking migration $migration as applied..." -ForegroundColor Cyan
    
    npx supabase@latest migration repair --status applied $migration
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Error marking migration $migration" -ForegroundColor Red
    } else {
        Write-Host "  ✓ Success" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Migration sync complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying migration status..." -ForegroundColor Yellow
npx supabase@latest migration list
