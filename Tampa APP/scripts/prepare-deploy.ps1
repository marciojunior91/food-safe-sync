# ============================================================================
# Script de Preparação para Deploy Vercel
# Executa verificações e prepara código para produção
# ============================================================================

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🚀 PREPARAÇÃO PARA DEPLOY VERCEL" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se está no diretório correto
Write-Host "📂 Verificando diretório..." -ForegroundColor Yellow
$currentDir = Get-Location
if ($currentDir.Path -notlike "*Tampa APP*") {
    Write-Host "❌ Execute este script no diretório do projeto!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Diretório correto" -ForegroundColor Green
Write-Host ""

# 2. Verificar se há mudanças não commitadas
Write-Host "🔍 Verificando mudanças pendentes..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Há mudanças não commitadas:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $commit = Read-Host "Deseja commitar agora? (s/n)"
    if ($commit -eq "s") {
        $message = Read-Host "Mensagem do commit"
        git add .
        git commit -m "$message"
        Write-Host "✅ Commit realizado" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Sem mudanças pendentes" -ForegroundColor Green
}
Write-Host ""

# 3. Verificar branch atual
Write-Host "🌿 Verificando branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Branch atual: $currentBranch" -ForegroundColor Cyan
Write-Host ""

# 4. Verificar arquivo .env
Write-Host "🔐 Verificando variáveis de ambiente..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Copie estas variáveis para o Vercel!" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Get-Content ".env" | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Yellow
} else {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "   Crie um arquivo .env com as variáveis necessárias" -ForegroundColor White
}
Write-Host ""

# 5. Testar build local
Write-Host "🔨 Testando build local..." -ForegroundColor Yellow
Write-Host "   (Isso pode demorar alguns minutos)" -ForegroundColor White
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build falhou! Corrija os erros antes de fazer deploy" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build local bem-sucedido" -ForegroundColor Green
Write-Host ""

# 6. Fazer push para GitHub
Write-Host "📤 Fazendo push para GitHub..." -ForegroundColor Yellow
git push origin $currentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Push falhou. Verifique sua conexão com GitHub" -ForegroundColor Yellow
} else {
    Write-Host "✅ Push realizado com sucesso" -ForegroundColor Green
}
Write-Host ""

# 7. Instruções finais
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✅ PREPARAÇÃO CONCLUÍDA!" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Acesse: https://vercel.com/signup" -ForegroundColor White
Write-Host "   → Faça login com GitHub" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Clique 'Add New... → Project'" -ForegroundColor White
Write-Host "   → Import Git Repository" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Selecione: marciojunior91/food-safe-sync" -ForegroundColor White
Write-Host "   → Branch: $currentBranch" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Configure Environment Variables:" -ForegroundColor White
Write-Host "   → Copie as variáveis mostradas acima (do .env)" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Clique 'Deploy' e aguarde ~5 minutos" -ForegroundColor White
Write-Host ""
Write-Host "📖 Guia completo em:" -ForegroundColor Yellow
Write-Host "   docs/DEPLOY_VERCEL_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Tempo estimado total: 15 minutos" -ForegroundColor Cyan
Write-Host "⏰ Horário limite: 21h" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Boa sorte com o deploy!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
