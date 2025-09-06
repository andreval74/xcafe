# ==================== WIDGET SAAS - SCRIPT DE INICIALIZAÇÃO (WINDOWS) ====================

Write-Host "🚀 Iniciando configuração do Widget SaaS..." -ForegroundColor Green

# Função para logging colorido
function Write-Log {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "[INFO] $Message" -ForegroundColor $Color
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar se Node.js está instalado
function Test-Node {
    try {
        $nodeVersion = node -v
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($versionNumber -lt 16) {
            Write-Error "Node.js versão 16+ é necessária. Versão atual: $nodeVersion"
            Write-Host "Visite: https://nodejs.org/" -ForegroundColor Cyan
            exit 1
        }
        
        Write-Log "Node.js $nodeVersion encontrado ✓"
        return $true
    }
    catch {
        Write-Error "Node.js não encontrado. Instale Node.js 16+ primeiro."
        Write-Host "Visite: https://nodejs.org/" -ForegroundColor Cyan
        exit 1
    }
}

# Verificar se npm está instalado
function Test-Npm {
    try {
        $npmVersion = npm -v
        Write-Log "npm $npmVersion encontrado ✓"
        return $true
    }
    catch {
        Write-Error "npm não encontrado."
        exit 1
    }
}

# Instalar dependências do backend
function Install-Backend {
    Write-Log "Instalando dependências do backend..."
    
    Set-Location api
    
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json não encontrado no diretório api/"
        exit 1
    }
    
    try {
        npm install
        Write-Log "Dependências do backend instaladas ✓"
    }
    catch {
        Write-Error "Falha ao instalar dependências do backend"
        exit 1
    }
    
    Set-Location ..
}

# Criar arquivo .env se não existir
function New-EnvFile {
    Write-Log "Configurando arquivo de ambiente..."
    
    if (-not (Test-Path "api\.env")) {
        $envContent = @'
# Configuração do Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# URLs das Redes Blockchain (opcional)
ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
BSC_RPC=https://bsc-dataseed.binance.org
POLYGON_RPC=https://polygon-rpc.com

# Segurança (alterar em produção)
JWT_SECRET=your-jwt-secret-change-in-production
API_SECRET=your-api-secret-change-in-production

# Debug
DEBUG=widget-saas:*
'@
        
        $envContent | Out-File -FilePath "api\.env" -Encoding UTF8
        Write-Log "Arquivo .env criado ✓"
        Write-Warn "⚠️  Altere as configurações em api\.env antes de usar em produção!"
    }
    else {
        Write-Log "Arquivo .env já existe ✓"
    }
}

# Criar diretórios necessários
function New-Directories {
    Write-Log "Criando diretórios necessários..."
    
    $directories = @("data", "assets\images", "assets\css", "logs")
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Log "Diretórios criados ✓"
}

# Inicializar dados do sistema
function Initialize-Data {
    Write-Log "Inicializando dados do sistema..."
    
    # Estatísticas do sistema
    if (-not (Test-Path "data\system_stats.json")) {
        $systemStats = @{
            totalUsers = 0
            totalWidgets = 0
            totalTransactions = 0
            totalVolume = 0
            totalCredits = 0
            lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        } | ConvertTo-Json -Depth 3
        
        $systemStats | Out-File -FilePath "data\system_stats.json" -Encoding UTF8
        Write-Log "Estatísticas do sistema inicializadas ✓"
    }
    
    # Bases de dados vazias
    $dataFiles = @{
        "data\users.json" = "{}"
        "data\widgets.json" = "{}"
        "data\transactions.json" = "[]"
        "data\credits.json" = "{}"
        "data\api_keys.json" = "{}"
    }
    
    foreach ($file in $dataFiles.GetEnumerator()) {
        if (-not (Test-Path $file.Key)) {
            $file.Value | Out-File -FilePath $file.Key -Encoding UTF8
        }
    }
    
    Write-Log "Bases de dados inicializadas ✓"
}

# Testar se o servidor inicia corretamente
function Test-Server {
    Write-Log "Testando inicialização do servidor..."
    
    Set-Location api
    
    try {
        $job = Start-Job -ScriptBlock { node server.js }
        Start-Sleep -Seconds 3
        
        if ($job.State -eq "Running") {
            Write-Log "Servidor iniciou corretamente ✓"
            Stop-Job $job
            Remove-Job $job
        }
        else {
            Write-Error "Falha ao iniciar servidor"
            Remove-Job $job -Force
            exit 1
        }
    }
    catch {
        Write-Error "Erro ao testar servidor: $_"
        exit 1
    }
    
    Set-Location ..
}

# Criar scripts de desenvolvimento
function New-DevScripts {
    Write-Log "Criando scripts de desenvolvimento..."
    
    # Script de desenvolvimento
    $devScript = @'
# Script de desenvolvimento para Widget SaaS
Write-Host "🚀 Iniciando Widget SaaS em modo desenvolvimento..." -ForegroundColor Green

# Verificar dependências
if (-not (Test-Path "api\node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    Set-Location api
    npm install
    Set-Location ..
}

# Iniciar servidor
Set-Location api
Write-Host "📡 Servidor iniciando na porta 3000..." -ForegroundColor Cyan
Write-Host "🌐 API: http://localhost:3000/api" -ForegroundColor Green
Write-Host "❤️  Health: http://localhost:3000/api/health" -ForegroundColor Green
Write-Host "📊 Stats: http://localhost:3000/api/stats" -ForegroundColor Green
Write-Host ""
Write-Host "🛑 Pressione Ctrl+C para parar o servidor" -ForegroundColor Red
Write-Host ""

npm run dev
'@
    
    $devScript | Out-File -FilePath "start-dev.ps1" -Encoding UTF8
    Write-Log "Script de desenvolvimento criado ✓"
    
    # Script de produção
    $prodScript = @'
# Script de produção para Widget SaaS
Write-Host "🚀 Iniciando Widget SaaS em modo produção..." -ForegroundColor Green

Set-Location api

# Verificar PM2
try {
    pm2 -v | Out-Null
}
catch {
    Write-Host "Instalando PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# Parar processo anterior
try {
    pm2 delete widget-saas 2>$null
}
catch {
    # Ignorar erro se processo não existir
}

# Iniciar com PM2
pm2 start server.js --name widget-saas
pm2 save

Write-Host "✅ Servidor rodando em produção" -ForegroundColor Green
Write-Host "📊 Monitor: pm2 monit" -ForegroundColor Cyan
Write-Host "📜 Logs: pm2 logs widget-saas" -ForegroundColor Cyan
Write-Host "🔄 Restart: pm2 restart widget-saas" -ForegroundColor Cyan
'@
    
    $prodScript | Out-File -FilePath "start-prod.ps1" -Encoding UTF8
    Write-Log "Script de produção criado ✓"
}

# Mostrar informações finais
function Show-FinalInfo {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "🎉 WIDGET SAAS CONFIGURADO COM SUCESSO!" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "📁 Estrutura criada:" -ForegroundColor Green
    Write-Host "   ├── api\              (Backend Node.js)"
    Write-Host "   ├── modules\          (Módulos compartilhados)"
    Write-Host "   ├── contracts\        (Smart contracts)"
    Write-Host "   ├── pages\            (Frontend)"
    Write-Host "   ├── src\              (Widget embeddable)"
    Write-Host "   ├── data\             (Base de dados)"
    Write-Host "   └── assets\           (Assets estáticos)"
    Write-Host ""
    
    Write-Host "🚀 Para iniciar em desenvolvimento:" -ForegroundColor Green
    Write-Host "   .\start-dev.ps1" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🏭 Para iniciar em produção:" -ForegroundColor Green
    Write-Host "   .\start-prod.ps1" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🔗 URLs importantes:" -ForegroundColor Green
    Write-Host "   Landing page: pages\index.html" -ForegroundColor Cyan
    Write-Host "   Dashboard:    pages\dashboard.html" -ForegroundColor Cyan
    Write-Host "   API:          http://localhost:3000/api" -ForegroundColor Cyan
    Write-Host "   Health:       http://localhost:3000/api/health" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "⚠️  Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Configure suas chaves de API blockchain em api\.env"
    Write-Host "   2. Deploy o smart contract UniversalSaleContract.sol"
    Write-Host "   3. Atualize os endereços dos contratos no sistema"
    Write-Host "   4. Configure um servidor web para servir as páginas HTML"
    Write-Host ""
    
    Write-Host "📚 Documentação completa no README.md" -ForegroundColor Green
    Write-Host ""
}

# Função principal
function Main {
    Write-Log "Verificando requisitos do sistema..."
    Test-Node
    Test-Npm
    
    Write-Log "Configurando ambiente..."
    New-Directories
    New-EnvFile
    Initialize-Data
    
    Write-Log "Instalando dependências..."
    Install-Backend
    
    Write-Log "Testando configuração..."
    Test-Server
    
    Write-Log "Criando scripts auxiliares..."
    New-DevScripts
    
    Show-FinalInfo
}

# Executar função principal
try {
    Main
}
catch {
    Write-Error "Erro durante a configuração: $_"
    exit 1
}
