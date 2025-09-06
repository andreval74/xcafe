# Script para iniciar o Widget SaaS
Write-Host "🚀 Iniciando Widget SaaS..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "api\server.js")) {
    Write-Host "❌ Arquivo server.js não encontrado. Execute este script no diretório widget-all" -ForegroundColor Red
    exit 1
}

# Ir para o diretório da API
Set-Location api

Write-Host "📡 Servidor iniciando na porta 3000..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs importantes:" -ForegroundColor Green
Write-Host "   Landing page:  ..\pages\index.html" -ForegroundColor Yellow
Write-Host "   Dashboard:     ..\pages\dashboard.html" -ForegroundColor Yellow
Write-Host "   API:           http://localhost:3000/api" -ForegroundColor Yellow
Write-Host "   Health check:  http://localhost:3000/api/health" -ForegroundColor Yellow
Write-Host "   Stats:         http://localhost:3000/api/stats" -ForegroundColor Yellow
Write-Host ""
Write-Host "🛑 Pressione Ctrl+C para parar o servidor" -ForegroundColor Red
Write-Host ""

# Iniciar o servidor
node server.js
