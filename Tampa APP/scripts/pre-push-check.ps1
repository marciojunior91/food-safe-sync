# Pre-Push Safety Check Script
# Run this before pushing to main branch

Write-Host "🔍 Pre-Push Safety Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$hasErrors = $false

# Check 1: TypeScript Compilation
Write-Host "1️⃣  Checking TypeScript compilation..." -ForegroundColor Yellow
try {
    npm run type-check 2>&1 | Out-Null
    Write-Host "   ✅ TypeScript check passed" -ForegroundColor Green
} catch {
    Write-Host "   ❌ TypeScript errors found!" -ForegroundColor Red
    $hasErrors = $true
}

# Check 2: Production Build
Write-Host ""
Write-Host "2️⃣  Building production bundle..." -ForegroundColor Yellow
try {
    npm run build 2>&1 | Out-Null
    Write-Host "   ✅ Production build successful" -ForegroundColor Green
    
    # Check bundle size
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   📦 Bundle size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
    
    if ($distSize -gt 10) {
        Write-Host "   ⚠️  Warning: Bundle size is large (>10MB)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Production build failed!" -ForegroundColor Red
    $hasErrors = $true
}

# Check 3: Lint Check
Write-Host ""
Write-Host "3️⃣  Running linter..." -ForegroundColor Yellow
try {
    npm run lint 2>&1 | Out-Null
    Write-Host "   ✅ Linting passed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Linting warnings found (non-blocking)" -ForegroundColor Yellow
}

# Check 4: Git Status
Write-Host ""
Write-Host "4️⃣  Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   ⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
} else {
    Write-Host "   ✅ Working directory clean" -ForegroundColor Green
}

# Check 5: Current Branch
Write-Host ""
Write-Host "5️⃣  Checking current branch..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "   📍 Current branch: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -eq "main") {
    Write-Host "   ⚠️  You're pushing directly to main!" -ForegroundColor Yellow
    Write-Host "   💡 Consider using feature branches for risky changes" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($hasErrors) {
    Write-Host "❌ SAFETY CHECK FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors before pushing to production." -ForegroundColor Red
    Write-Host "This could cause a production outage like the one on Jan 26, 2026." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ SAFETY CHECK PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Pre-Push Checklist:" -ForegroundColor Cyan
    Write-Host "  [ ] TypeScript compilation: ✅" -ForegroundColor Green
    Write-Host "  [ ] Production build: ✅" -ForegroundColor Green
    Write-Host "  [ ] Manual testing: ⏳ (Do this now!)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🚀 You can now push, but please:" -ForegroundColor Cyan
    Write-Host "   1. Test the preview build locally: npm run preview" -ForegroundColor Gray
    Write-Host "   2. Check browser console for errors" -ForegroundColor Gray
    Write-Host "   3. Test critical user flows" -ForegroundColor Gray
    Write-Host "   4. Monitor Vercel deployment after push" -ForegroundColor Gray
    Write-Host ""
    
    $response = Read-Host "Ready to push? (y/n)"
    if ($response -ne "y") {
        Write-Host "Push cancelled. Good choice! Test more." -ForegroundColor Yellow
        exit 1
    }
}
