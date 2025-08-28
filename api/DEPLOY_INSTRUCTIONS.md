# Instruções de Deploy - API xcafe Token Creator

## Visão Geral

Esta documentação cobre o deploy da API xcafe Token Creator, incluindo tanto a versão atual quanto as funcionalidades estendidas com compilação Solidity.

## Preparação do Ambiente

### 1. Instalar Dependências

```bash
# Para API básica
npm install

# Para API estendida com compilação
npm install --save solc ethers helmet compression winston
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

### 3. Estrutura de Arquivos

```text
api/
├── server.js              # API básica atual
├── server-extended.js     # API com compilação Solidity
├── package.json           # Dependências básicas
├── package-extended.json  # Dependências completas
├── .env                   # Configurações
└── DEPLOY_INSTRUCTIONS.md
```

## Configuração de Variáveis de Ambiente (.env)

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Blockchain RPC URLs
ETHEREUM_RPC=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
BSC_RPC=https://bsc-dataseed1.binance.org
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
POLYGON_RPC=https://polygon-mainnet.infura.io/v3/YOUR_API_KEY
BASE_RPC=https://mainnet.base.org
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc

# Segurança (usar HSM em produção)
DEPLOYER_PRIVATE_KEY=your_secure_private_key_here
JWT_SECRET=your_jwt_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/api.log

# APIs de Verificação de Contratos
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key

# Configurações de Compilação (apenas para API estendida)
SOLC_VERSION=0.8.19
OPTIMIZATION_ENABLED=true
OPTIMIZATION_RUNS=200
COMPILE_TIMEOUT=120000
```

## Deploy no Render (Recomendado)

### 1. Preparar Repositório

```bash
# Fazer commit dos arquivos da API
git add api/
git commit -m "Add xcafe token deploy API"
git push origin main
```

### 2. Criar Web Service no Render

1. Acesse [render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:

```yaml
Name: xcafe-token-deploy-api
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: api
Build Command: npm install
Start Command: npm start
Node Version: 18
Auto-Deploy: Yes
```

### 3. Configurar Health Check

```text
Health Check Path: /
Expected Status: 200
```

### 4. Adicionar Variáveis de Ambiente

No painel do Render, seção "Environment", adicione todas as variáveis do arquivo `.env`.

### 5. URL Final

Após deploy: `https://xcafe-token-api.onrender.com`

## Deploy no Railway

### 1. Instalar CLI e Deploy

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Inicializar projeto
railway init

# Deploy
railway up
```

### 2. Configurar Variáveis

```bash
# Adicionar variáveis de ambiente
railway variables set NODE_ENV=production
railway variables set PORT=3000
# ... outras variáveis
```

## Deploy com Docker

### 1. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Criar diretório de logs
RUN mkdir -p logs

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
```

### 2. Build e Deploy

```bash
# Build da imagem
docker build -t xcafe-token-api .

# Executar container
docker run -d -p 3000:3000 --name xcafe-api xcafe-token-api
```

## Testes e Validação

### Teste Básico de Status

```bash
curl https://your-api-url.com/
```

### Teste de Deploy de Token

```bash
curl -X POST "https://your-api-url.com/deploy-token" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenName": "Test Token",
    "tokenSymbol": "TEST",
    "totalSupply": "1000000",
    "decimals": 18,
    "ownerAddress": "0x742d35Cc622C7CF4C81Ca2e8DE4b5cA0bC2A9eE0",
    "chainId": 97,
    "deployerPrivateKey": "auto"
  }'
```

### Teste de Compilação (API Estendida)

```bash
curl -X POST "https://your-api-url.com/api/compile" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.19; contract Test { string public name = \"Test\"; }",
    "contractName": "Test"
  }'
```

## Monitoramento

### Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('./package.json').version,
        memory: process.memoryUsage()
    });
});
```

### Configuração de Logs

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ]
});
```

## Configurações de Segurança

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Helmet para segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW || 60000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 10,
    message: { error: "Rate limit exceeded" }
});

app.use('/api/', limiter);

// CORS específico
app.use(cors({
    origin: [
        'https://xcafe.com',
        'https://www.xcafe.com',
        'http://localhost:3000'
    ],
    credentials: true
}));
```

## Resolução de Problemas

### Problemas Frequentes

**Erro de memória**: Aumentar limite do Node.js

```bash
node --max-old-space-size=4096 server.js
```

**Timeout de compilação**: Aumentar timeout

```javascript
const timeout = process.env.COMPILE_TIMEOUT || 120000;
```

**Gas estimation falha**: Usar valores padrão

```javascript
const defaultGasLimit = ethers.parseUnits('2000000', 'wei');
```

### Debug de Problemas

```bash
# Verificar logs
tail -f logs/combined.log

# Testar conectividade
curl -v https://your-api-url.com/health

# Verificar variáveis de ambiente
echo $NODE_ENV
```

## URLs e Links Importantes

- **API Produção**: <https://xcafe-token-api.onrender.com>
- **Health Check**: <https://xcafe-token-api.onrender.com/health>
- **Repositório**: <https://github.com/andreval74/xcafe>
- **Render Dashboard**: <https://render.com>

## Suporte Técnico

Para suporte:

1. Verificar logs da aplicação
2. Consultar esta documentação
3. Testar endpoints com curl
4. Verificar configurações de rede

---

**Versão**: 3.0.0  
**Última atualização**: 28 de agosto de 2025
