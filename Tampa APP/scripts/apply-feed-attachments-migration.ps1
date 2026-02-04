# ============================================================================
# APPLY FEED ATTACHMENTS STORAGE MIGRATION
# ============================================================================
# Creates Supabase Storage bucket for Feed attachments
# Supports images, videos, and PDFs (max 10MB per file)
# ============================================================================

Write-Host ""
Write-Host "🗄️  APPLYING FEED ATTACHMENTS STORAGE MIGRATION" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-Not (Test-Path ".\.env.local")) {
    Write-Host "❌ ERROR: .env.local not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .env.local with:" -ForegroundColor Yellow
    Write-Host "VITE_SUPABASE_URL=your_supabase_url" -ForegroundColor Yellow
    Write-Host "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Load environment variables
Write-Host "📋 Loading environment variables..." -ForegroundColor White
Get-Content .\.env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-Not $SUPABASE_URL -or -Not $SERVICE_ROLE_KEY) {
    Write-Host "❌ ERROR: Missing required environment variables!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required:" -ForegroundColor Yellow
    Write-Host "  - VITE_SUPABASE_URL" -ForegroundColor Yellow
    Write-Host "  - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green
Write-Host "   Supabase URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

# Read migration file
$migrationFile = ".\supabase\migrations\20260201000000_create_feed_attachments_bucket.sql"

if (-Not (Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: Migration file not found!" -ForegroundColor Red
    Write-Host "   Expected: $migrationFile" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "📄 Reading migration file..." -ForegroundColor White
$sqlContent = Get-Content $migrationFile -Raw

Write-Host "✅ Migration file loaded" -ForegroundColor Green
Write-Host ""

# Execute migration
Write-Host "🚀 Applying migration to Supabase..." -ForegroundColor White
Write-Host ""

$headers = @{
    "apikey" = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    query = $sqlContent
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ MIGRATION APPLIED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Feed Attachments Storage Bucket Created:" -ForegroundColor Cyan
    Write-Host "   • Bucket ID: feed-attachments" -ForegroundColor White
    Write-Host "   • Public Access: Yes (URLs work directly)" -ForegroundColor White
    Write-Host "   • File Size Limit: 10MB per file" -ForegroundColor White
    Write-Host "   • Allowed Types:" -ForegroundColor White
    Write-Host "     - Images: JPEG, PNG, GIF, WebP, SVG" -ForegroundColor Gray
    Write-Host "     - Videos: MP4, QuickTime, WebM" -ForegroundColor Gray
    Write-Host "     - Documents: PDF" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔒 RLS Policies Applied:" -ForegroundColor Cyan
    Write-Host "   • Users can upload to their organization" -ForegroundColor White
    Write-Host "   • Users can view their organization's files" -ForegroundColor White
    Write-Host "   • Authors can delete their own files" -ForegroundColor White
    Write-Host ""
    Write-Host "📁 Storage Structure:" -ForegroundColor Cyan
    Write-Host "   feed-attachments/" -ForegroundColor White
    Write-Host "     └── {organization_id}/" -ForegroundColor Gray
    Write-Host "         └── {post_id}/" -ForegroundColor Gray
    Write-Host "             └── {timestamp}-{random}.{ext}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 Ready to use! Feed attachments are now enabled." -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host "❌ ERROR: Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
        Write-Host ""
    }
    
    Write-Host "💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Check your SUPABASE_SERVICE_ROLE_KEY in .env.local" -ForegroundColor White
    Write-Host "   2. Verify Supabase project is active" -ForegroundColor White
    Write-Host "   3. Ensure service role has admin permissions" -ForegroundColor White
    Write-Host "   4. Try applying manually via Supabase SQL Editor" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

Write-Host "✅ PHASE 2 - ITEM 3 COMPLETE!" -ForegroundColor Green
Write-Host ""
