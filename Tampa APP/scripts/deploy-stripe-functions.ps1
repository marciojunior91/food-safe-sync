# =====================================================
# DEPLOY STRIPE EDGE FUNCTIONS
# =====================================================
# Script para fazer deploy das Edge Functions no Supabase
# Created: January 14, 2026
# =====================================================

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║          🚀 DEPLOY STRIPE EDGE FUNCTIONS 🚀                  ║" -ForegroundColor Yellow
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if Supabase CLI is installed
Write-Host "🔍 Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCLI) {
    Write-Host "❌ Supabase CLI não encontrado!`n" -ForegroundColor Red
    Write-Host "📥 Instale com: npm install -g supabase" -ForegroundColor White
    Write-Host "   Ou: scoop install supabase`n" -ForegroundColor White
    exit 1
}

Write-Host "✅ Supabase CLI encontrado!`n" -ForegroundColor Green

# Check if logged in
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1

if ($loginCheck -match "not logged in" -or $loginCheck -match "no access token") {
    Write-Host "❌ Não autenticado no Supabase!`n" -ForegroundColor Red
    Write-Host "🔑 Faça login com: supabase login`n" -ForegroundColor White
    exit 1
}

Write-Host "✅ Autenticado!`n" -ForegroundColor Green

# Set secrets
Write-Host "🔐 Configurando secrets..." -ForegroundColor Yellow

$secrets = @{
    "STRIPE_SECRET_KEY" = $env:STRIPE_SECRET_KEY
    "STRIPE_WEBHOOK_SECRET" = $env:STRIPE_WEBHOOK_SECRET
    "VITE_STRIPE_PRICE_STARTER" = $env:VITE_STRIPE_PRICE_STARTER
    "VITE_STRIPE_PRICE_PROFESSIONAL" = $env:VITE_STRIPE_PRICE_PROFESSIONAL
    "VITE_STRIPE_PRICE_ENTERPRISE" = $env:VITE_STRIPE_PRICE_ENTERPRISE
}

foreach ($key in $secrets.Keys) {
    $value = $secrets[$key]
    if ($value) {
        Write-Host "   Setting $key..." -ForegroundColor Gray
        supabase secrets set "$key=$value" 2>&1 | Out-Null
    } else {
        Write-Host "   ⚠️  $key not set in environment" -ForegroundColor Yellow
    }
}

Write-Host "✅ Secrets configurados!`n" -ForegroundColor Green

# Deploy functions
Write-Host "📦 Fazendo deploy das Edge Functions...`n" -ForegroundColor Yellow

Write-Host "   1️⃣  Deploying stripe-create-checkout..." -ForegroundColor Cyan
supabase functions deploy stripe-create-checkout
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ stripe-create-checkout deployed!`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro no deploy de stripe-create-checkout`n" -ForegroundColor Red
    exit 1
}

Write-Host "   2️⃣  Deploying stripe-webhook..." -ForegroundColor Cyan
supabase functions deploy stripe-webhook
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ stripe-webhook deployed!`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro no deploy de stripe-webhook`n" -ForegroundColor Red
    exit 1
}

# Get webhook URL
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║          ✅ DEPLOY COMPLETO! ✅                               ║" -ForegroundColor White
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 PRÓXIMOS PASSOS:`n" -ForegroundColor Yellow

Write-Host "1️⃣  Configure o Webhook no Stripe Dashboard:" -ForegroundColor White
Write-Host "   URL: https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook" -ForegroundColor Cyan
Write-Host "   (Substitua YOUR_PROJECT_ID pelo seu Project ID)`n" -ForegroundColor Gray

Write-Host "2️⃣  Eventos para adicionar:" -ForegroundColor White
Write-Host "   • customer.subscription.created" -ForegroundColor Gray
Write-Host "   • customer.subscription.updated" -ForegroundColor Gray
Write-Host "   • customer.subscription.deleted" -ForegroundColor Gray
Write-Host "   • invoice.payment_succeeded" -ForegroundColor Gray
Write-Host "   • invoice.payment_failed`n" -ForegroundColor Gray

Write-Host "3️⃣  Copie o Webhook Secret e adicione aos secrets:" -ForegroundColor White
Write-Host "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`n" -ForegroundColor Cyan

Write-Host "4️⃣  Teste o pagamento:" -ForegroundColor White
Write-Host "   • Acesse: http://localhost:5173/pricing" -ForegroundColor Cyan
Write-Host "   • Clique em 'Start Trial'" -ForegroundColor Gray
Write-Host "   • Use o cartão de teste: 4242 4242 4242 4242`n" -ForegroundColor Gray

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🎉 Tudo pronto para processar pagamentos! 🎉                ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
