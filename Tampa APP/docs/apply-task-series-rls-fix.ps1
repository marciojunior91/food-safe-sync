# Fix task_series and task_occurrences RLS Policies
# Root cause: policies used profiles.id = auth.uid() but auth.uid() matches profiles.user_id

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  TASK SERIES / OCCURRENCES - RLS POLICY FIX" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Root cause:" -ForegroundColor Red
Write-Host "  Original policy used: profiles WHERE id = auth.uid()" -ForegroundColor White
Write-Host "  But auth.uid() matches profiles.user_id, not profiles.id" -ForegroundColor White
Write-Host "  This caused all task_series SELECTs to return 0 rows." -ForegroundColor White
Write-Host ""
Write-Host "Fix: replace with the same pattern used by routine_tasks (which works):" -ForegroundColor Green
Write-Host "  profiles WHERE user_id = auth.uid()" -ForegroundColor White
Write-Host ""
Write-Host "Apply the SQL in Supabase Dashboard > SQL Editor > New Query" -ForegroundColor Green
Write-Host ""
Write-Host "File location:" -ForegroundColor Cyan
Write-Host "supabase\migrations\20260318000001_fix_task_series_rls.sql" -ForegroundColor White
Write-Host ""

# Open the file automatically in VS Code
code "supabase\migrations\20260318000001_fix_task_series_rls.sql"

Write-Host "File opened in VS Code." -ForegroundColor Green
Write-Host "Copy the content and paste it in:" -ForegroundColor Yellow
Write-Host "https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter when done..." -ForegroundColor Yellow
Read-Host
