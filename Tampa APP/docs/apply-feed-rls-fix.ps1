# Apply Feed RLS Policy Fix
# This script applies the RLS policy fix directly to Supabase

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  FEED MODULE - RLS POLICY FIX" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will update the RLS policies on feed tables to support" -ForegroundColor Yellow
Write-Host "the team member selection pattern (shared tablet accounts)." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please apply the following SQL in Supabase SQL Editor:" -ForegroundColor Green
Write-Host ""
Write-Host "Dashboard > SQL Editor > New Query" -ForegroundColor White
Write-Host ""
Write-Host "File location:" -ForegroundColor Cyan
Write-Host "supabase\migrations\20260118000001_fix_feed_posts_rls.sql" -ForegroundColor White
Write-Host ""
Write-Host "Or copy this command to open the file:" -ForegroundColor Cyan
Write-Host ""
Write-Host 'code supabase\migrations\20260118000001_fix_feed_posts_rls.sql' -ForegroundColor Yellow
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Open the file automatically
code supabase\migrations\20260118000001_fix_feed_posts_rls.sql

Write-Host "File opened in VS Code. Copy the content and paste it in Supabase SQL Editor." -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter when done..." -ForegroundColor Yellow
Read-Host
