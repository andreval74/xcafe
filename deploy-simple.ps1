# Script de Deploy Simplificado - xcafe API Híbrida
# Usuário paga deploy via MetaMask, API só compila

param(
    [Parameter(Mandatory=$false)]
    [string]$RenderServiceName = "xcafe-token-api-simple",
    
    [Parameter(Mandatory=$false)]
    [switch]$TestLocal
)

Write-Host "🚀 Iniciando deploy da xcafe API HÍBRIDA..." -ForegroundColor Green
Write-Host "API compila, usuário paga deploy via MetaMask" -ForegroundColor Yellow

# Verificar se estamos no diretório correto
if (!(Test-Path "api/")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto xcafe" -ForegroundColor Red
    exit 1
}

# Entrar no diretório da API
Set-Location "api/"

# Backup dos arquivos atuais
Write-Host "📦 Criando backup dos arquivos atuais..." -ForegroundColor Blue
$backupDir = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Copy-Item "package.json" "$backupDir/" -ErrorAction SilentlyContinue
Copy-Item "server.js" "$backupDir/" -ErrorAction SilentlyContinue

# Configurar para versão híbrida
Write-Host "🔧 Configurando API Híbrida (usuário paga deploy)..." -ForegroundColor Blue

# Verificar se arquivos existem
if (!(Test-Path "server-hybrid.js")) {
    Write-Host "❌ Erro: server-hybrid.js não encontrado!" -ForegroundColor Red
    exit 1
}

# Usar versão híbrida
Copy-Item "package-extended.json" "package.json"
Copy-Item "server-hybrid.js" "server.js"

Write-Host "✅ API configurada: compila contratos, usuário paga deploy" -ForegroundColor Green

# Testar localmente se solicitado
if ($TestLocal) {
    Write-Host "🧪 Testando localmente..." -ForegroundColor Blue
    
    # Verificar se .env existe
    if (!(Test-Path ".env")) {
        Write-Host "⚠️  Arquivo .env não encontrado. Criando template..." -ForegroundColor Yellow
        
        $envContent = @"
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Blockchain RPC URLs (apenas para consultas, SEM PRIVATE KEY!)
BSC_RPC=https://bsc-dataseed1.binance.org
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545

# Para compilação Solidity
SOLC_VERSION=0.8.19
OPTIMIZATION_ENABLED=true
OPTIMIZATION_RUNS=200

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10
"@
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        
        Write-Host "📝 Template .env criado (SEM private keys!)" -ForegroundColor Green
        Write-Host "✅ API não precisa de chaves privadas - usuário paga via MetaMask" -ForegroundColor Green
    }
    
    # Instalar dependências
    Write-Host "📥 Instalando dependências..." -ForegroundColor Blue
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
    
    # Testar inicialização
    Write-Host "🔍 Testando inicialização da API..." -ForegroundColor Blue
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm start
    }
    
    Start-Sleep -Seconds 10
    
    # Testar endpoint de saúde
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API funcionando localmente!" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ API não responde localmente. Verifique logs." -ForegroundColor Red
    }
    
    # Parar o job
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
    
    Write-Host "🏁 Teste local concluído." -ForegroundColor Blue
}

# Preparar para commit
Write-Host "📝 Preparando arquivos para commit..." -ForegroundColor Blue

# Verificar se há mudanças
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📋 Arquivos modificados detectados:" -ForegroundColor Blue
    Write-Host $gitStatus -ForegroundColor Gray
    
    # Adicionar arquivos
    git add .
    
    # Commit
    $commitMessage = "Deploy: API Híbrida (usuário paga deploy) - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    git commit -m $commitMessage
    
    Write-Host "✅ Commit realizado: $commitMessage" -ForegroundColor Green
    
    # Push
    Write-Host "📤 Enviando para repositório..." -ForegroundColor Blue
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro no push. Verifique configuração Git." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ℹ️  Nenhuma mudança detectada nos arquivos." -ForegroundColor Yellow
}

# Exibir próximos passos
Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Acesse https://render.com" -ForegroundColor White
Write-Host "2. Crie novo Web Service conectado ao seu repositório" -ForegroundColor White
Write-Host "3. Configure:" -ForegroundColor White
Write-Host "   - Name: $RenderServiceName" -ForegroundColor Gray
Write-Host "   - Environment: Node" -ForegroundColor Gray
Write-Host "   - Root Directory: api/" -ForegroundColor Gray
Write-Host "   - Build Command: npm install" -ForegroundColor Gray
Write-Host "   - Start Command: npm start" -ForegroundColor Gray
Write-Host "4. Configure APENAS estas Environment Variables:" -ForegroundColor White
Write-Host "   - PORT = 10000" -ForegroundColor Gray
Write-Host "   - NODE_ENV = production" -ForegroundColor Gray
Write-Host "   - BSC_RPC = https://bsc-dataseed1.binance.org" -ForegroundColor Gray
Write-Host "   - SOLC_VERSION = 0.8.19" -ForegroundColor Gray
Write-Host "5. Aguarde o deploy automático" -ForegroundColor White

Write-Host "`n✨ VANTAGENS DESTA ABORDAGEM:" -ForegroundColor Yellow
Write-Host "- Sem private keys na API (mais seguro)" -ForegroundColor White
Write-Host "- Usuário paga próprio deploy (sustentável)" -ForegroundColor White
Write-Host "- MetaMask cuida de tudo (redes, gas, moedas)" -ForegroundColor White
Write-Host "- Deploy gratuito no Render Free Tier" -ForegroundColor White
Write-Host "- Implementação mais simples e rápida" -ForegroundColor White

Write-Host "`n🔗 DOCUMENTAÇÃO COMPLETA:" -ForegroundColor Cyan
Write-Host "Consulte: DEPLOY_SIMPLE.md" -ForegroundColor White

Write-Host "`n✅ Script de deploy concluído!" -ForegroundColor Green
Set-Location ".."
