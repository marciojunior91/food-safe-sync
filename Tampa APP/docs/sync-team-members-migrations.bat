@echo off
echo ========================================
echo Syncing Team Members Migrations
echo ========================================
echo.

echo [1/2] Marking team_members table migration as applied...
call npx supabase@latest migration repair --status applied 20260103000000
echo.

echo [2/2] Marking PIN verification RPC migration as applied...
call npx supabase@latest migration repair --status applied 20260103000001
echo.

echo ========================================
echo Sync Complete! Verifying status...
echo ========================================
echo.

call npx supabase@latest migration list

echo.
echo ========================================
echo Done! Check the Remote column above.
echo The last 2 migrations should have a check mark.
echo ========================================
pause
