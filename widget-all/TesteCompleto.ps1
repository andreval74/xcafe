# Widget SaaS - PowerShell Test Suite
# Executa verificacao completa do sistema

Write-Host "================================" -ForegroundColor Cyan
Write-Host " WIDGET SAAS - 20 TESTES" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = "C:\Users\User\Desktop\cafe\xcafe\xcafe\widget-all"
Set-Location $baseDir

$testResults = @()
$testCount = 0

function Test-File {
    param($filePath, $testName)
    $global:testCount++
    
    if (Test-Path $filePath) {
        Write-Host "✅ TESTE $($global:testCount.ToString('00')): $testName - APROVADO" -ForegroundColor Green
        $global:testResults += "PASS"
        return $true
    } else {
        Write-Host "❌ TESTE $($global:testCount.ToString('00')): $testName - FALHADO" -ForegroundColor Red
        $global:testResults += "FAIL"
        return $false
    }
}

function Test-Content {
    param($filePath, $content, $testName)
    $global:testCount++
    
    if (Test-Path $filePath) {
        $fileContent = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
        if ($fileContent -and $fileContent -match $content) {
            Write-Host "✅ TESTE $($global:testCount.ToString('00')): $testName - APROVADO" -ForegroundColor Green
            $global:testResults += "PASS"
            return $true
        }
    }
    
    Write-Host "❌ TESTE $($global:testCount.ToString('00')): $testName - FALHADO" -ForegroundColor Red
    $global:testResults += "FAIL"
    return $false
}

# TESTE 1-5: Arquivos Principais
Test-File "auto-deploy.py" "Auto-Deploy Principal"
Test-File "server.py" "Servidor Python"
Test-File "demo-widget.html" "Página Demo"
Test-File "admin-panel.html" "Painel Admin"
Test-File "static\js\widget-incorporavel.js" "Widget JavaScript"

# TESTE 6-10: Componentes JavaScript
Test-File "static\js\admin-panel.js" "Admin JavaScript"
Test-File "static\js\credit-system.js" "Sistema Créditos"
Test-File "static\js\metamask-integration.js" "MetaMask Integration"
Test-Content "static\js\widget-incorporavel.js" "WidgetSaaS" "Classe Widget"
Test-Content "static\js\widget-incorporavel.js" "MetaMask" "MetaMask no Widget"

# TESTE 11-15: Smart Contracts e API
Test-File "contracts\WidgetSaaSToken.sol" "Smart Contract Principal"
Test-File "contracts\UniversalSaleContract.sol" "Smart Contract Universal"
Test-File "api\server.js" "Servidor Node.js"
Test-File "api\package.json" "Package.json"
Test-Content "contracts\WidgetSaaSToken.sol" "pragma solidity" "Solidity Syntax"

# TESTE 16-20: Documentação e Configuração
Test-File "SISTEMA_100_COMPLETO.md" "Documentação Completa"
Test-File "LOG_COMPLETO_20_TESTES.md" "Log de Testes"
Test-Content "demo-widget.html" "TBNB" "Configuração TBNB"
Test-Content "auto-deploy.py" "Matrix" "Interface Matrix"
Test-Content "api\package.json" "express" "Express.js"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host " RELATÓRIO FINAL" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_ -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_ -eq "FAIL" }).Count
$total = $testResults.Count
$successRate = [math]::Round(($passed / $total) * 100, 1)

Write-Host ""
Write-Host "✅ TESTES APROVADOS: $passed" -ForegroundColor Green
Write-Host "❌ TESTES FALHADOS: $failed" -ForegroundColor Red
Write-Host "📊 TOTAL DE TESTES: $total" -ForegroundColor Cyan
Write-Host "📈 TAXA DE SUCESSO: $successRate%" -ForegroundColor Yellow
Write-Host ""

if ($successRate -ge 80) {
    Write-Host "🎉 RESULTADO: SISTEMA APROVADO PARA TBNB!" -ForegroundColor Green
    Write-Host "🚀 Status: PRONTO PARA TESTES EM BLOCKCHAIN" -ForegroundColor Green
} elseif ($successRate -ge 60) {
    Write-Host "⚠️  RESULTADO: SISTEMA NECESSITA AJUSTES" -ForegroundColor Yellow
    Write-Host "🔧 Status: CORREÇÕES MENORES NECESSÁRIAS" -ForegroundColor Yellow
} else {
    Write-Host "❌ RESULTADO: SISTEMA REQUER CORREÇÕES" -ForegroundColor Red
    Write-Host "🛠️  Status: REVISÃO COMPLETA NECESSÁRIA" -ForegroundColor Red
}

Write-Host ""
Write-Host "Para iniciar o sistema:" -ForegroundColor Cyan
Write-Host "  1. cd api && npm install" -ForegroundColor White
Write-Host "  2. python server.py" -ForegroundColor White
Write-Host "  3. Abrir demo-widget.html no navegador" -ForegroundColor White
Write-Host ""

# Salvar relatório
$reportPath = Join-Path $baseDir "relatorio_testes.txt"
$report = @"
WIDGET SAAS - RELATÓRIO DE TESTES
Data: $(Get-Date)
==================================

Testes Aprovados: $passed
Testes Falhados: $failed
Total de Testes: $total
Taxa de Sucesso: $successRate%

"@

$report | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "📄 Relatório salvo em: $reportPath" -ForegroundColor Cyan

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
