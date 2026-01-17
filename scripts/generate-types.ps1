# Supabase Type Generation Script
# Run this after applying new migrations

Write-Host "🚀 Tampa APP - Supabase Type Generation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: npx not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Step 1: Check Supabase status
Write-Host "📊 Checking Supabase status..." -ForegroundColor Yellow
$status = npx supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Local Supabase is not running. Starting..." -ForegroundColor Yellow
    npx supabase start
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to start Supabase. Please check your Docker installation." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Supabase is running" -ForegroundColor Green
}

Write-Host ""

# Step 2: Apply migrations
Write-Host "📦 Applying migrations..." -ForegroundColor Yellow
npx supabase migration up
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed. Please check your migration files." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migrations applied successfully" -ForegroundColor Green

Write-Host ""

# Step 3: Generate TypeScript types
Write-Host "🔧 Generating TypeScript types..." -ForegroundColor Yellow
$typesPath = "src/integrations/supabase/types.ts"
npx supabase gen types typescript --local > $typesPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type generation failed." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Types generated successfully at $typesPath" -ForegroundColor Green

Write-Host ""

# Step 4: Verify TypeScript compilation
Write-Host "🔍 Verifying TypeScript compilation..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  TypeScript errors found. Please review above." -ForegroundColor Yellow
} else {
    Write-Host "✅ No TypeScript errors!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ Type generation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review any TypeScript errors above" -ForegroundColor White
Write-Host "  2. Run: npm run dev" -ForegroundColor White
Write-Host "  3. Test onboarding flow" -ForegroundColor White
Write-Host ""
