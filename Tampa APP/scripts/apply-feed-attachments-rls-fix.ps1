# ============================================================================
# Apply Feed Attachments RLS Fix Migration
# ============================================================================
# Fixes RLS policies to use auth_user_id instead of id
# Run this script from the project root directory
# ============================================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Feed Attachments RLS Fix Migration" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your Supabase credentials." -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "ERROR: Missing Supabase credentials in .env.local" -ForegroundColor Red
    Write-Host "Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "Supabase URL: $SUPABASE_URL" -ForegroundColor Green
Write-Host ""

# Read migration file
$migrationFile = "supabase/migrations/20260204000000_fix_feed_attachments_rls.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

$sql = Get-Content $migrationFile -Raw

Write-Host "Applying Feed Attachments RLS Fix..." -ForegroundColor Yellow
Write-Host ""

# Execute SQL via Supabase REST API
$headers = @{
    "apikey" = $SUPABASE_SERVICE_KEY
    "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    query = $sql
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "SUCCESS: RLS policies fixed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Changes Applied:" -ForegroundColor Cyan
    Write-Host "  - Fixed INSERT policy to use auth_user_id" -ForegroundColor White
    Write-Host "  - Fixed SELECT policy to use auth_user_id" -ForegroundColor White
    Write-Host "  - Fixed DELETE policy to use auth_user_id" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now upload attachments to feed posts!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Failed to apply migration" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Try alternative: Direct SQL execution
    Write-Host ""
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    try {
        $uri = "$SUPABASE_URL/rest/v1/"
        $sqlEncoded = [System.Uri]::EscapeDataString($sql)
        $response = Invoke-RestMethod -Uri "$uri`?sql=$sqlEncoded" -Method Get -Headers $headers
        Write-Host "SUCCESS: RLS policies fixed!" -ForegroundColor Green
    }
    catch {
        Write-Host ""
        Write-Host "Could not apply migration automatically." -ForegroundColor Yellow
        Write-Host "Please run this SQL manually in Supabase SQL Editor:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host $sql -ForegroundColor White
        Write-Host "================================================" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host ""
Write-Host "Migration complete!" -ForegroundColor Green
Write-Host ""
