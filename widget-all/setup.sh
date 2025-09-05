#!/bin/bash

# ==================== WIDGET SAAS - SCRIPT DE INICIALIZAÇÃO ====================

echo "🚀 Iniciando configuração do Widget SaaS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Node.js está instalado
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js não encontrado. Instale Node.js 16+ primeiro."
        echo "Visite: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        error "Node.js versão 16+ é necessária. Versão atual: $(node -v)"
        exit 1
    fi
    
    log "Node.js $(node -v) encontrado ✓"
}

# Verificar se npm está instalado
check_npm() {
    if ! command -v npm &> /dev/null; then
        error "npm não encontrado."
        exit 1
    fi
    
    log "npm $(npm -v) encontrado ✓"
}

# Instalar dependências do backend
install_backend() {
    log "Instalando dependências do backend..."
    cd api
    
    if [ ! -f "package.json" ]; then
        error "package.json não encontrado no diretório api/"
        exit 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        log "Dependências do backend instaladas ✓"
    else
        error "Falha ao instalar dependências do backend"
        exit 1
    fi
    
    cd ..
}

# Criar arquivo .env se não existir
create_env() {
    log "Configurando arquivo de ambiente..."
    
    if [ ! -f "api/.env" ]; then
        cat > api/.env << EOF
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
EOF
        log "Arquivo .env criado ✓"
        warn "⚠️  Altere as configurações em api/.env antes de usar em produção!"
    else
        log "Arquivo .env já existe ✓"
    fi
}

# Criar diretórios necessários
create_directories() {
    log "Criando diretórios necessários..."
    
    mkdir -p data
    mkdir -p assets/images
    mkdir -p assets/css
    mkdir -p logs
    
    log "Diretórios criados ✓"
}

# Inicializar dados do sistema
init_data() {
    log "Inicializando dados do sistema..."
    
    # Criar arquivos de dados básicos se não existirem
    if [ ! -f "data/system_stats.json" ]; then
        cat > data/system_stats.json << EOF
{
  "totalUsers": 0,
  "totalWidgets": 0,
  "totalTransactions": 0,
  "totalVolume": 0,
  "totalCredits": 0,
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
        log "Estatísticas do sistema inicializadas ✓"
    fi
    
    if [ ! -f "data/users.json" ]; then
        echo "{}" > data/users.json
        log "Base de dados de usuários criada ✓"
    fi
    
    if [ ! -f "data/widgets.json" ]; then
        echo "{}" > data/widgets.json
        log "Base de dados de widgets criada ✓"
    fi
    
    if [ ! -f "data/transactions.json" ]; then
        echo "[]" > data/transactions.json
        log "Base de dados de transações criada ✓"
    fi
    
    if [ ! -f "data/credits.json" ]; then
        echo "{}" > data/credits.json
        log "Base de dados de créditos criada ✓"
    fi
    
    if [ ! -f "data/api_keys.json" ]; then
        echo "{}" > data/api_keys.json
        log "Base de dados de API keys criada ✓"
    fi
}

# Testar se o servidor inicia corretamente
test_server() {
    log "Testando inicialização do servidor..."
    
    cd api
    timeout 10s node server.js &
    SERVER_PID=$!
    
    sleep 3
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        log "Servidor iniciou corretamente ✓"
        kill $SERVER_PID 2>/dev/null
    else
        error "Falha ao iniciar servidor"
        exit 1
    fi
    
    cd ..
}

# Criar script de desenvolvimento
create_dev_script() {
    log "Criando scripts de desenvolvimento..."
    
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Widget SaaS em modo desenvolvimento..."

# Verificar se as dependências estão instaladas
if [ ! -d "api/node_modules" ]; then
    echo "Instalando dependências..."
    cd api && npm install && cd ..
fi

# Iniciar servidor
cd api
echo "📡 Servidor iniciando na porta 3000..."
echo "🌐 API: http://localhost:3000/api"
echo "❤️  Health: http://localhost:3000/api/health"
echo "📊 Stats: http://localhost:3000/api/stats"
echo ""
echo "🛑 Pressione Ctrl+C para parar o servidor"
echo ""

npm run dev
EOF

    chmod +x start-dev.sh
    log "Script de desenvolvimento criado ✓"
    
    cat > start-prod.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Widget SaaS em modo produção..."

cd api

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi

# Parar processo anterior se existir
pm2 delete widget-saas 2>/dev/null || true

# Iniciar com PM2
pm2 start server.js --name widget-saas
pm2 save

echo "✅ Servidor rodando em produção"
echo "📊 Monitor: pm2 monit"
echo "📜 Logs: pm2 logs widget-saas"
echo "🔄 Restart: pm2 restart widget-saas"
EOF

    chmod +x start-prod.sh
    log "Script de produção criado ✓"
}

# Mostrar informações finais
show_final_info() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}🎉 WIDGET SAAS CONFIGURADO COM SUCESSO!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${GREEN}📁 Estrutura criada:${NC}"
    echo "   ├── api/              (Backend Node.js)"
    echo "   ├── modules/          (Módulos compartilhados)"
    echo "   ├── contracts/        (Smart contracts)"
    echo "   ├── pages/            (Frontend)"
    echo "   ├── src/              (Widget embeddable)"
    echo "   ├── data/             (Base de dados)"
    echo "   └── assets/           (Assets estáticos)"
    echo ""
    echo -e "${GREEN}🚀 Para iniciar em desenvolvimento:${NC}"
    echo "   ./start-dev.sh"
    echo ""
    echo -e "${GREEN}🏭 Para iniciar em produção:${NC}"
    echo "   ./start-prod.sh"
    echo ""
    echo -e "${GREEN}🔗 URLs importantes:${NC}"
    echo "   Landing page: pages/index.html"
    echo "   Dashboard:    pages/dashboard.html"
    echo "   API:          http://localhost:3000/api"
    echo "   Health:       http://localhost:3000/api/health"
    echo ""
    echo -e "${YELLOW}⚠️  Próximos passos:${NC}"
    echo "   1. Configure suas chaves de API blockchain em api/.env"
    echo "   2. Deploy o smart contract UniversalSaleContract.sol"
    echo "   3. Atualize os endereços dos contratos no sistema"
    echo "   4. Configure um servidor web para servir as páginas HTML"
    echo ""
    echo -e "${GREEN}📚 Documentação completa no README.md${NC}"
    echo ""
}

# Função principal
main() {
    log "Verificando requisitos do sistema..."
    check_node
    check_npm
    
    log "Configurando ambiente..."
    create_directories
    create_env
    init_data
    
    log "Instalando dependências..."
    install_backend
    
    log "Testando configuração..."
    test_server
    
    log "Criando scripts auxiliares..."
    create_dev_script
    
    show_final_info
}

# Executar função principal
main
