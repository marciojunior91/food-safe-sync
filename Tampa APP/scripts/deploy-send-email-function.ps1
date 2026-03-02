# Deploy send-email Edge Function to Supabase
# Tampa APP - Email Integration

Write-Host "📧 Tampa APP - Deploy send-email Edge Function" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
Write-Host "🔍 Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseCheck = Get-Command npx -ErrorAction SilentlyContinue
if (-not $supabaseCheck) {
    Write-Host "❌ Error: npx not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Supabase CLI available" -ForegroundColor Green
Write-Host ""

# Get project reference
Write-Host "📋 Project Information:" -ForegroundColor Yellow
Write-Host "  Project Ref: imnecvcvhypnlvujajpn" -ForegroundColor White
Write-Host "  Function: send-email" -ForegroundColor White
Write-Host ""

# Prompt for Resend API Key
Write-Host "🔑 Configuration:" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to set the following secrets:" -ForegroundColor White
Write-Host "  1. RESEND_API_KEY (your Resend API key)" -ForegroundColor White
Write-Host "  2. RESEND_FROM_EMAIL (your sender email)" -ForegroundColor White
Write-Host ""

$apiKey = Read-Host "Enter your RESEND_API_KEY (or press Enter to skip)"
$fromEmail = Read-Host "Enter your RESEND_FROM_EMAIL (e.g., Tampa APP <noreply@yourdomain.com>)"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Set secrets if provided
if ($apiKey -and $fromEmail) {
    Write-Host "🔐 Setting Supabase secrets..." -ForegroundColor Yellow
    
    try {
        npx supabase secrets set RESEND_API_KEY="$apiKey" --project-ref imnecvcvhypnlvujajpn
        Write-Host "✅ RESEND_API_KEY set successfully" -ForegroundColor Green
        
        npx supabase secrets set RESEND_FROM_EMAIL="$fromEmail" --project-ref imnecvcvhypnlvujajpn
        Write-Host "✅ RESEND_FROM_EMAIL set successfully" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "⚠️  Warning: Failed to set secrets. You may need to set them manually." -ForegroundColor Yellow
        Write-Host "   Run: npx supabase secrets set RESEND_API_KEY=your-key --project-ref imnecvcvhypnlvujajpn" -ForegroundColor Gray
        Write-Host "   Run: npx supabase secrets set RESEND_FROM_EMAIL=your-email --project-ref imnecvcvhypnlvujajpn" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "⚠️  Skipping secrets setup. Remember to set them manually:" -ForegroundColor Yellow
    Write-Host "   npx supabase secrets set RESEND_API_KEY=your-key --project-ref imnecvcvhypnlvujajpn" -ForegroundColor Gray
    Write-Host "   npx supabase secrets set RESEND_FROM_EMAIL=your-email --project-ref imnecvcvhypnlvujajpn" -ForegroundColor Gray
    Write-Host ""
}

# Deploy function
Write-Host "🚀 Deploying send-email function..." -ForegroundColor Yellow
Write-Host ""

try {
    npx supabase functions deploy send-email --project-ref imnecvcvhypnlvujajpn
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Function Details:" -ForegroundColor Yellow
    Write-Host "  Name: send-email" -ForegroundColor White
    Write-Host "  URL: https://imnecvcvhypnlvujajpn.supabase.co/functions/v1/send-email" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Test your function:" -ForegroundColor Yellow
    Write-Host "  1. Run: npm run dev" -ForegroundColor White
    Write-Host "  2. Navigate to: http://localhost:8080/test-email" -ForegroundColor White
    Write-Host "  3. Enter your email and click test buttons" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Add RESEND_API_KEY to Vercel environment variables" -ForegroundColor White
    Write-Host "  2. Add RESEND_FROM_EMAIL to Vercel environment variables" -ForegroundColor White
    Write-Host "  3. Deploy to Vercel: git push" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Verify you're logged in: npx supabase login" -ForegroundColor White
    Write-Host "  2. Check project ref is correct: imnecvcvhypnlvujajpn" -ForegroundColor White
    Write-Host "  3. Ensure function file exists: supabase/functions/send-email/index.ts" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "================================================" -ForegroundColor Cyan
