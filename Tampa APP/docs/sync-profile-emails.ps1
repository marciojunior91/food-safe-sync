# Sync Profile Emails Migration
# This script pushes the profile email sync migration to Supabase

Write-Host "🔄 Syncing profile emails migration..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
$supabasePath = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabasePath) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Link to remote project (if not already linked)
Write-Host "📡 Ensuring Supabase project is linked..." -ForegroundColor Cyan
supabase link --project-ref vtvnthuhbdowazlhvqhv

# Push the migration
Write-Host "⬆️  Pushing migration to remote database..." -ForegroundColor Cyan
supabase db push

Write-Host "✅ Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "The migration has:" -ForegroundColor White
Write-Host "  1. Updated existing profiles with emails from auth.users" -ForegroundColor Gray
Write-Host "  2. Created get_user_email() function for email lookups" -ForegroundColor Gray
Write-Host "  3. Created profiles_with_email view for guaranteed email access" -ForegroundColor Gray
Write-Host ""
Write-Host "Your CreateTeamMemberDialog should now show user emails correctly!" -ForegroundColor Green
