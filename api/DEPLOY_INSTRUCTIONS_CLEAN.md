# Instruções de Deploy - API xcafe Estendida

## Deploy da API com Funcionalidades Estendidas

### 1. Preparação do Ambiente

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### 2. Variáveis de Ambiente (.env)

```env
# Servidor
PORT=3000
NODE_ENV=production

# Blockchain RPC URLs
ETHEREUM_RPC=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
BSC_RPC=https://bsc-dataseed1.binance.org
POLYGON_RPC=https://polygon-mainnet.infura.io/v3/YOUR_API_KEY

# Carteiras para Deploy (usar HSM em produção)
DEPLOYER_PRIVATE_KEY=your_secure_private_key_here

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/api.log

# Verificação de Contratos
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### 3. Deploy no Render

1. **Conectar repositório** ao Render
2. **Configurar build command**: `npm install`
3. **Configurar start command**: `npm start`
4. **Adicionar variáveis de ambiente** no dashboard do Render

### 4. Deploy no Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

### 5. Deploy no Vercel (Serverless)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 6. Configuração Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## Testes da API

### Teste Manual com cURL

```bash
# 1. Testar compilação
curl -X POST "https://your-api-url.com/api/compile" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.19; contract Test { string public name = \"Test\"; }",
    "contractName": "Test"
  }'

# 2. Testar compilação + deploy
curl -X POST "https://your-api-url.com/api/compile-and-deploy" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.19; import \"@openzeppelin/contracts/token/ERC20/ERC20.sol\"; contract TestToken is ERC20 { constructor() ERC20(\"Test Token\", \"TEST\") { _mint(msg.sender, 1000000 * 10**decimals()); } }",
    "contractName": "TestToken",
    "chainId": 97,
    "ownerAddress": "0x742d35Cc622C7CF4C81Ca2e8DE4b5cA0bC2A9eE0"
  }'
```

## Configurações Avançadas

### Segurança

```javascript
// Adicionar ao server.js
const helmet = require('helmet');
const compression = require('compression');

app.use(helmet());
app.use(compression());

// CORS específico
app.use(cors({
    origin: ['https://xcafe.com', 'https://www.xcafe.com'],
    credentials: true
}));
```

### Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

### Monitoramento

```javascript
// Endpoint de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('./package.json').version
    });
});
```

## Métricas e Monitoramento

### Prometheus/Grafana

```javascript
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
});

// Middleware para métricas
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration
            .labels(req.method, req.route?.path || req.url, res.statusCode)
            .observe(duration);
    });
    next();
});
```

## Troubleshooting

### Problemas Comuns

**Erro de memória**: Aumentar limite do Node.js

```bash
node --max-old-space-size=4096 server.js
```

**Timeout de compilação**: Aumentar timeout para contratos complexos

```javascript
const timeout = process.env.COMPILE_TIMEOUT || 120000;
```

**Gas estimation falha**: Usar valores padrão

```javascript
const defaultGasLimit = ethers.parseUnits('2000000', 'wei');
```

## Próximos Passos

1. **Implementar cache** para compilações frequentes
2. **Adicionar suporte a proxy contracts**
3. **Integrar análise de segurança** com Mythril/Slither
4. **Implementar fila** para deploys em alta demanda
5. **Adicionar webhooks** para notificações de status

Com essas funcionalidades, a API xcafe se tornará uma plataforma completa para desenvolvimento e deploy de contratos inteligentes!
