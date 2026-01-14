# Deploy Edge Function - create-user-with-credentials
# Run this in a NEW PowerShell window (not in VS Code terminal)

Write-Host "Deploying create-user-with-credentials edge function..." -ForegroundColor Cyan

# Navigate to project directory
Set-Location "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"

# Deploy the function
npx supabase functions deploy create-user-with-credentials --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Function deployed successfully!" -ForegroundColor Green
    Write-Host "You can now create users in the application." -ForegroundColor Green
} else {
    Write-Host "`n❌ Deployment failed. Check the error above." -ForegroundColor Red
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
