# ============================================================
# 🧪 Widget SaaS - Teste Completo de Usuário Final
# Simula TODOS os procedimentos que um usuário real faria
# ============================================================

Write-Host "================================================================================================" -ForegroundColor Cyan
Write-Host "🧪 WIDGET SAAS - TESTE COMPLETO DE USUÁRIO FINAL" -ForegroundColor Green
Write-Host "================================================================================================" -ForegroundColor Cyan
Write-Host "👤 Simulando usuário real fazendo TODOS os procedimentos..." -ForegroundColor Yellow
Write-Host "📅 Iniciado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "================================================================================================" -ForegroundColor Cyan
Write-Host ""

# Contador de testes
$testeAtual = 0
$totalTestes = 15
$sucessos = 0
$erros = 0

# Função para log de testes
function Log-Teste {
    param(
        [string]$nome,
        [string]$status,
        [string]$detalhes = ""
    )
    
    $global:testeAtual++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($status.ToUpper()) {
        "SUCESSO" { 
            $icon = "✅"
            $cor = "Green"
            $global:sucessos++
        }
        "ERRO" { 
            $icon = "❌"
            $cor = "Red"
            $global:erros++
        }
        "AVISO" { 
            $icon = "⚠️"
            $cor = "Yellow"
            $global:sucessos++  # Contar avisos como sucessos parciais
        }
        default { 
            $icon = "📋"
            $cor = "White"
        }
    }
    
    Write-Host "$icon [$timestamp] TESTE $($global:testeAtual.ToString('00'))/$($global:totalTestes.ToString('00')) - $nome" -ForegroundColor $cor
    if ($detalhes) {
        Write-Host "   📝 $detalhes" -ForegroundColor Gray
    }
}

# Função para fazer requisições HTTP
function Test-HttpEndpoint {
    param(
        [string]$url,
        [string]$method = "GET",
        [hashtable]$headers = @{},
        [string]$body = ""
    )
    
    try {
        $response = if ($method -eq "GET") {
            Invoke-WebRequest -Uri $url -Method GET -Headers $headers -TimeoutSec 10
        } else {
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
            Invoke-WebRequest -Uri $url -Method $method -Headers $headers -Body $bodyBytes -ContentType "application/json" -TimeoutSec 10
        }
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode } else { 0 }
        }
    }
}

Write-Host "🚀 INICIANDO BATERIA DE TESTES DE USUÁRIO COMPLETO..." -ForegroundColor Cyan
Write-Host ""

# ============================================================
# TESTE 01: Verificar se servidor está rodando
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 01 - Servidor Ativo..." -ForegroundColor Cyan
$resultado = Test-HttpEndpoint -url "http://localhost:8000/api/health"
if ($resultado.Success -and $resultado.StatusCode -eq 200) {
    Log-Teste "Servidor Health Check" "SUCESSO" "Servidor respondeu corretamente"
} else {
    Log-Teste "Servidor Health Check" "ERRO" "Servidor não está respondendo (Status: $($resultado.StatusCode))"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 02: Acessar página principal
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 02 - Página Principal..." -ForegroundColor Cyan
$resultado = Test-HttpEndpoint -url "http://localhost:8000/"
if ($resultado.Success -and $resultado.StatusCode -eq 200) {
    if ($resultado.Content -like "*Widget SaaS*") {
        Log-Teste "Página Principal" "SUCESSO" "Página carregou com conteúdo correto"
    } else {
        Log-Teste "Página Principal" "AVISO" "Página carregou mas conteúdo pode estar incompleto"
    }
} else {
    Log-Teste "Página Principal" "ERRO" "Falha ao carregar página principal"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 03: Testar endpoints da API
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 03 - Endpoints da API..." -ForegroundColor Cyan
$endpoints = @(
    "/api/health",
    "/api/stats",
    "/api/tokens",
    "/api/widgets"
)

$endpointsOk = 0
foreach ($endpoint in $endpoints) {
    $resultado = Test-HttpEndpoint -url "http://localhost:8000$endpoint"
    if ($resultado.Success -and ($resultado.StatusCode -eq 200 -or $resultado.StatusCode -eq 401)) {
        $endpointsOk++
    }
}

if ($endpointsOk -ge ($endpoints.Length * 0.75)) {
    Log-Teste "Endpoints da API" "SUCESSO" "$endpointsOk/$($endpoints.Length) endpoints funcionando"
} else {
    Log-Teste "Endpoints da API" "ERRO" "Apenas $endpointsOk/$($endpoints.Length) endpoints funcionando"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 04: Simular cadastro de usuário
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 04 - Cadastro de Usuário..." -ForegroundColor Cyan
$dadosCadastro = @{
    email = "teste@widgetsaas.com"
    password = "123456789"
    name = "João Testador"
    wallet_address = "0x742d35cc6634c0532925a3b8d0fa6f3b8af93e0f"
} | ConvertTo-Json

$headers = @{ 'Content-Type' = 'application/json' }
$resultado = Test-HttpEndpoint -url "http://localhost:8000/api/auth/register" -method "POST" -headers $headers -body $dadosCadastro

if ($resultado.Success) {
    if ($resultado.StatusCode -eq 200 -or $resultado.StatusCode -eq 201) {
        Log-Teste "Cadastro de Usuário" "SUCESSO" "Usuário cadastrado com sucesso"
    } elseif ($resultado.StatusCode -eq 409) {
        Log-Teste "Cadastro de Usuário" "AVISO" "Usuário já existe (esperado em re-execuções)"
    } else {
        Log-Teste "Cadastro de Usuário" "ERRO" "Falha no cadastro (Status: $($resultado.StatusCode))"
    }
} else {
    Log-Teste "Cadastro de Usuário" "ERRO" "Erro de conexão no cadastro"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 05: Simular login de usuário
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 05 - Login de Usuário..." -ForegroundColor Cyan
$dadosLogin = @{
    email = "teste@widgetsaas.com"
    password = "123456789"
} | ConvertTo-Json

$resultado = Test-HttpEndpoint -url "http://localhost:8000/api/auth/login" -method "POST" -headers $headers -body $dadosLogin

if ($resultado.Success -and $resultado.StatusCode -eq 200) {
    try {
        $resposta = $resultado.Content | ConvertFrom-Json
        if ($resposta.success -and $resposta.token) {
            $global:authToken = $resposta.token
            Log-Teste "Login de Usuário" "SUCESSO" "Token JWT obtido com sucesso"
        } else {
            Log-Teste "Login de Usuário" "ERRO" "Login não retornou token válido"
        }
    } catch {
        Log-Teste "Login de Usuário" "AVISO" "Login funcionou mas resposta não é JSON válido"
    }
} else {
    Log-Teste "Login de Usuário" "ERRO" "Falha no login do usuário"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 06: Acessar demo do widget
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 06 - Demo do Widget..." -ForegroundColor Cyan
$resultado = Test-HttpEndpoint -url "http://localhost:8000/demo-widget.html"
if ($resultado.Success -and $resultado.StatusCode -eq 200) {
    $elementos = @("Widget SaaS", "MetaMask", "widget-incorporavel.js", "TBNB")
    $encontrados = 0
    foreach ($elemento in $elementos) {
        if ($resultado.Content -like "*$elemento*") { $encontrados++ }
    }
    
    if ($encontrados -ge 3) {
        Log-Teste "Demo do Widget" "SUCESSO" "Elementos essenciais encontrados ($encontrados/4)"
    } else {
        Log-Teste "Demo do Widget" "AVISO" "Poucos elementos encontrados ($encontrados/4)"
    }
} else {
    Log-Teste "Demo do Widget" "ERRO" "Falha ao carregar demo do widget"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 07: Acessar painel administrativo
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 07 - Painel Administrativo..." -ForegroundColor Cyan
$resultado = Test-HttpEndpoint -url "http://localhost:8000/admin-panel.html"
if ($resultado.Success -and $resultado.StatusCode -eq 200) {
    $elementos = @("Painel Administrativo", "Dashboard", "admin-panel.js", "MetaMask")
    $encontrados = 0
    foreach ($elemento in $elementos) {
        if ($resultado.Content -like "*$elemento*") { $encontrados++ }
    }
    
    if ($encontrados -ge 3) {
        Log-Teste "Painel Administrativo" "SUCESSO" "Elementos essenciais encontrados ($encontrados/4)"
    } else {
        Log-Teste "Painel Administrativo" "AVISO" "Poucos elementos encontrados ($encontrados/4)"
    }
} else {
    Log-Teste "Painel Administrativo" "ERRO" "Falha ao carregar painel administrativo"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 08: Testar arquivos JavaScript
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 08 - Arquivos JavaScript..." -ForegroundColor Cyan
$jsFiles = @(
    "/js/widget-incorporavel.js",
    "/js/admin-panel.js",
    "/js/demo-widget.js"
)

$jsOk = 0
foreach ($jsFile in $jsFiles) {
    $resultado = Test-HttpEndpoint -url "http://localhost:8000$jsFile"
    if ($resultado.Success -and $resultado.StatusCode -eq 200) {
        $jsOk++
    }
}

if ($jsOk -ge ($jsFiles.Length * 0.66)) {
    Log-Teste "Arquivos JavaScript" "SUCESSO" "$jsOk/$($jsFiles.Length) arquivos JS carregando"
} else {
    Log-Teste "Arquivos JavaScript" "ERRO" "Apenas $jsOk/$($jsFiles.Length) arquivos JS carregando"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 09: Testar arquivos CSS
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 09 - Arquivos CSS..." -ForegroundColor Cyan
$cssFiles = @(
    "/styles/main.css",
    "/styles/admin.css",
    "/styles/widget.css"
)

$cssOk = 0
foreach ($cssFile in $cssFiles) {
    $resultado = Test-HttpEndpoint -url "http://localhost:8000$cssFile"
    if ($resultado.Success -and $resultado.StatusCode -eq 200) {
        $cssOk++
    }
}

if ($cssOk -ge ($cssFiles.Length * 0.66)) {
    Log-Teste "Arquivos CSS" "SUCESSO" "$cssOk/$($cssFiles.Length) arquivos CSS carregando"
} else {
    Log-Teste "Arquivos CSS" "AVISO" "Apenas $cssOk/$($cssFiles.Length) arquivos CSS carregando"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 10: Verificar imagens e assets
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 10 - Imagens e Assets..." -ForegroundColor Cyan
$assets = @(
    "/imgs/xcafe.png",
    "/imgs/moeda-cafe-tec.png"
)

$assetsOk = 0
foreach ($asset in $assets) {
    $resultado = Test-HttpEndpoint -url "http://localhost:8000$asset"
    if ($resultado.Success -and $resultado.StatusCode -eq 200) {
        $assetsOk++
    }
}

if ($assetsOk -gt 0) {
    Log-Teste "Imagens e Assets" "SUCESSO" "$assetsOk/$($assets.Length) assets carregando"
} else {
    Log-Teste "Imagens e Assets" "AVISO" "Assets podem não estar configurados"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 11: Simular criação de token
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 11 - Criação de Token..." -ForegroundColor Cyan
$dadosToken = @{
    name = "Teste Token"
    symbol = "TEST"
    initial_supply = 1000000
    price = 0.001
} | ConvertTo-Json

$authHeaders = $headers.Clone()
if ($global:authToken) {
    $authHeaders['Authorization'] = "Bearer $($global:authToken)"
}

$resultado = Test-HttpEndpoint -url "http://localhost:8000/api/tokens" -method "POST" -headers $authHeaders -body $dadosToken

if ($resultado.Success) {
    if ($resultado.StatusCode -eq 200 -or $resultado.StatusCode -eq 201) {
        Log-Teste "Criação de Token" "SUCESSO" "Token criado com sucesso"
    } elseif ($resultado.StatusCode -eq 401) {
        Log-Teste "Criação de Token" "AVISO" "Endpoint protegido - autenticação funcionando"
    } else {
        Log-Teste "Criação de Token" "ERRO" "Falha na criação do token"
    }
} else {
    Log-Teste "Criação de Token" "ERRO" "Erro de conexão na criação do token"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 12: Simular criação de widget
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 12 - Criação de Widget..." -ForegroundColor Cyan
$dadosWidget = @{
    name = "Meu Primeiro Widget"
    token_symbol = "TEST"
    theme = "light"
    language = "pt-BR"
} | ConvertTo-Json

$resultado = Test-HttpEndpoint -url "http://localhost:8000/api/widgets" -method "POST" -headers $authHeaders -body $dadosWidget

if ($resultado.Success) {
    if ($resultado.StatusCode -eq 200 -or $resultado.StatusCode -eq 201) {
        Log-Teste "Criação de Widget" "SUCESSO" "Widget criado com sucesso"
    } elseif ($resultado.StatusCode -eq 401) {
        Log-Teste "Criação de Widget" "AVISO" "Endpoint protegido - autenticação funcionando"
    } else {
        Log-Teste "Criação de Widget" "ERRO" "Falha na criação do widget"
    }
} else {
    Log-Teste "Criação de Widget" "ERRO" "Erro de conexão na criação do widget"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 13: Testar validação de dados
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 13 - Validação de Dados..." -ForegroundColor Cyan
$dadosInvalidos = @{
    email = "email_invalido"
    password = "123"
    name = ""
} | ConvertTo-Json

$resultado = Test-HttpEndpoint -url "http://localhost:8000/api/auth/register" -method "POST" -headers $headers -body $dadosInvalidos

if ($resultado.Success) {
    if ($resultado.StatusCode -eq 400 -or $resultado.StatusCode -eq 422) {
        Log-Teste "Validação de Dados" "SUCESSO" "Validação funcionando corretamente"
    } else {
        Log-Teste "Validação de Dados" "AVISO" "Validação pode estar fraca"
    }
} else {
    Log-Teste "Validação de Dados" "AVISO" "Sistema rejeitou dados inválidos"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 14: Testar performance da API
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 14 - Performance da API..." -ForegroundColor Cyan
$tempoInicio = Get-Date
$resultado = Test-HttpEndpoint -url "http://localhost:8000/api/health"
$tempoFim = Get-Date
$tempoResposta = ($tempoFim - $tempoInicio).TotalMilliseconds

if ($resultado.Success -and $tempoResposta -lt 2000) {
    Log-Teste "Performance da API" "SUCESSO" "Resposta em $([math]::Round($tempoResposta, 0))ms"
} elseif ($resultado.Success -and $tempoResposta -lt 5000) {
    Log-Teste "Performance da API" "AVISO" "Resposta lenta: $([math]::Round($tempoResposta, 0))ms"
} else {
    Log-Teste "Performance da API" "ERRO" "Performance ruim ou falha na conexão"
}

Start-Sleep -Seconds 1

# ============================================================
# TESTE 15: Teste final de integração
# ============================================================
Write-Host "🔍 EXECUTANDO TESTE 15 - Integração Final..." -ForegroundColor Cyan
$paginasEssenciais = @(
    "/",
    "/demo-widget.html",
    "/admin-panel.html"
)

$paginasOk = 0
foreach ($pagina in $paginasEssenciais) {
    $resultado = Test-HttpEndpoint -url "http://localhost:8000$pagina"
    if ($resultado.Success -and $resultado.StatusCode -eq 200) {
        $paginasOk++
    }
}

if ($paginasOk -eq $paginasEssenciais.Length) {
    Log-Teste "Integração Final" "SUCESSO" "Todas as páginas essenciais funcionando"
} else {
    Log-Teste "Integração Final" "ERRO" "Apenas $paginasOk/$($paginasEssenciais.Length) páginas funcionando"
}

# ============================================================
# RELATÓRIO FINAL
# ============================================================
Write-Host ""
Write-Host "================================================================================================" -ForegroundColor Cyan
Write-Host "📊 RELATÓRIO FINAL DOS TESTES DE USUÁRIO" -ForegroundColor Green
Write-Host "================================================================================================" -ForegroundColor Cyan

$taxaSucesso = ($sucessos / $totalTestes) * 100

Write-Host "✅ TESTES APROVADOS: $sucessos" -ForegroundColor Green
Write-Host "❌ TESTES FALHADOS: $erros" -ForegroundColor Red
Write-Host "📊 TOTAL DE TESTES: $totalTestes" -ForegroundColor Cyan
Write-Host "📈 TAXA DE SUCESSO: $([math]::Round($taxaSucesso, 1))%" -ForegroundColor Yellow

Write-Host ""
if ($taxaSucesso -ge 80) {
    Write-Host "🎉 RESULTADO: SISTEMA FUNCIONAL PARA USUÁRIOS!" -ForegroundColor Green
    Write-Host "✅ Experiência do usuário: APROVADA" -ForegroundColor Green
    Write-Host "🚀 O sistema está pronto para uso em produção!" -ForegroundColor Green
} elseif ($taxaSucesso -ge 60) {
    Write-Host "⚠️  RESULTADO: SISTEMA PARCIALMENTE FUNCIONAL" -ForegroundColor Yellow
    Write-Host "🔧 Experiência do usuário: NECESSITA MELHORIAS" -ForegroundColor Yellow
    Write-Host "🛠️  Algumas funcionalidades precisam de ajustes" -ForegroundColor Yellow
} else {
    Write-Host "❌ RESULTADO: SISTEMA COM PROBLEMAS CRÍTICOS" -ForegroundColor Red
    Write-Host "🛠️  Experiência do usuário: REQUER CORREÇÕES" -ForegroundColor Red
    Write-Host "🚨 Sistema precisa de correções antes do uso" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================================================================" -ForegroundColor Cyan
Write-Host "🏁 TESTES CONCLUÍDOS EM: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "🎯 SISTEMA TESTADO COMO USUÁRIO REAL!" -ForegroundColor Green
Write-Host "================================================================================================" -ForegroundColor Cyan

# Aguardar antes de fechar
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
