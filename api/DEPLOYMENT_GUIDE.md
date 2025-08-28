# Guia Prático: Deploy da Nova API xcafe no Render

## 📋 Checklist de Preparação

### ✅ Pré-requisitos

- [ ] Conta no Render.com criada
- [ ] Repositório GitHub com código da API
- [ ] **NENHUMA** private key necessária (usuário paga via MetaMask)

## 🚀 Implementação Passo a Passo

### ⚠️ IMPORTANTE: QUEM PAGA O DEPLOY?

**PROBLEMA ATUAL:** A API paga todos os deploys com sua private key!
Isso não é sustentável para uso público.

**SOLUÇÕES DISPONÍVEIS:**

#### 🎯 Opção 1: Deploy Híbrido (RECOMENDADA)
- **API:** Apenas compila contratos (grátis)
- **Usuário:** Paga deploy via MetaMask
- **Vantagem:** Sem custos para você, usuário controla seus tokens

#### 💳 Opção 2: Sistema de Pagamento
- **API:** Cobra pelos deploys
- **Usuário:** Paga taxa antes do deploy
- **Vantagem:** Experiência mais simples

#### 🏦 Opção 3: API Paga Tudo
- **API:** Paga todos os deploys
- **Usuário:** Deploy gratuito
- **PROBLEMA:** Insustentável financeiramente

### 1. Atualizar Arquivos da API

#### 1.1 Escolher Versão da API

##### Opção A: API Básica (atual)

- Apenas deploy de tokens pré-compilados
- Menor uso de recursos
- Mais rápida para implementar

##### Opção B: API Estendida (nova)

- Compilação Solidity + deploy
- Funcionalidades completas
- Requer mais recursos

#### 1.2 Preparar package.json correto

```bash
# Se escolher API Básica
cp package.json package.json.backup
# Manter package.json atual

# Se escolher API Estendida  
cp package-extended.json package.json
cp server-extended.js server.js
```

### 2. Configurar Variáveis de Ambiente

#### 2.1 Criar arquivo .env local (para testes)

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Blockchain RPC URLs - OBRIGATÓRIAS
BSC_RPC=https://bsc-dataseed1.binance.org
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
ETHEREUM_RPC=https://eth-mainnet.alchemyapi.io/v2/SUA_CHAVE_AQUI
POLYGON_RPC=https://polygon-mainnet.infura.io/v3/SUA_CHAVE_AQUI

# Segurança - CRÍTICO
DEPLOYER_PRIVATE_KEY=sua_private_key_segura_aqui
JWT_SECRET=um_jwt_secret_muito_forte_aqui

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10

# Para API Estendida apenas
SOLC_VERSION=0.8.19
OPTIMIZATION_ENABLED=true
OPTIMIZATION_RUNS=200
```

#### 2.2 Obter Chaves de API Necessárias

**Alchemy (Ethereum/Polygon):**

1. Vá para [alchemy.com](https://alchemy.com)
2. Crie conta gratuita
3. Criar aplicação → Copiar API Key

**Infura (alternativa):**

1. Vá para [infura.io](https://infura.io)
2. Crie projeto → Copiar Project ID

### 3. Deploy no Render

#### 3.1 Preparar Repositório

```bash
# Fazer backup dos arquivos atuais
git add .
git commit -m "Backup antes do deploy da nova API"

# Se escolher API estendida, atualizar arquivos
cp package-extended.json package.json
cp server-extended.js server.js

# Commit das mudanças
git add .
git commit -m "Update para API estendida com compilação Solidity"
git push origin main
```

#### 3.2 Criar Web Service no Render

1. **Acesse render.com e faça login**

2. **Clique "New +" → "Web Service"**

3. **Conectar Repositório:**
   - Connect GitHub repository
   - Selecione seu repositório xcafe
   - Branch: main

4. **Configuração do Service:**

```yaml
Name: xcafe-token-api-extended
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: api/
Build Command: npm install
Start Command: npm start
```

#### 3.3 Configurar Environment Variables

No painel do Render, adicione estas variáveis:

```env
PORT = 10000
NODE_ENV = production
BSC_RPC = https://bsc-dataseed1.binance.org
BSC_TESTNET_RPC = https://data-seed-prebsc-1-s1.binance.org:8545
ETHEREUM_RPC = https://eth-mainnet.alchemyapi.io/v2/SUA_CHAVE_ALCHEMY
POLYGON_RPC = https://polygon-mainnet.infura.io/v3/SUA_CHAVE_INFURA
DEPLOYER_PRIVATE_KEY = sua_private_key_muito_segura
JWT_SECRET = seu_jwt_secret_super_forte
RATE_LIMIT_WINDOW = 60000
RATE_LIMIT_MAX_REQUESTS = 10
SOLC_VERSION = 0.8.19
OPTIMIZATION_ENABLED = true
OPTIMIZATION_RUNS = 200
```

### 4. Testar Deployment

#### 4.1 Aguardar Build

- Build levará 3-5 minutos
- Acompanhe logs no painel do Render
- URL será disponibilizada após sucesso

#### 4.2 Testar Endpoints

```bash
# Testar saúde da API
curl https://sua-api.onrender.com/health

# Se API estendida, testar compilação
curl -X POST https://sua-api.onrender.com/api/compile \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.19; contract Test { string public name = \"Test\"; }",
    "contractName": "Test"
  }'
```

### 5. Atualizar Frontend

#### 5.1 Modificar URLs da API

No arquivo `js/xcafe-extended-api.js`:

```javascript
// Atualizar URL da API
const API_BASE_URL = 'https://sua-nova-api.onrender.com';

// Se usar API estendida, habilitar novos endpoints
const API_ENDPOINTS = {
    compile: `${API_BASE_URL}/api/compile`,
    deploy: `${API_BASE_URL}/api/deploy`,
    verify: `${API_BASE_URL}/api/verify`,
    status: `${API_BASE_URL}/api/status`
};
```

### 6. Monitoramento e Manutenção

#### 6.1 Logs

```bash
# Ver logs no Render Dashboard
# Ou usar Render CLI
render logs -s seu-service-id
```

#### 6.2 Scaling

- **Free Tier:** 0.1 CPU, 512MB RAM
- **Starter:** 0.5 CPU, 512MB RAM - $7/mês
- **Standard:** 1 CPU, 2GB RAM - $25/mês

Para API estendida com compilação, recomenda-se no mínimo Starter.

## ⚠️ Problemas Comuns e Soluções

### Build Falhando

```bash
# Se build falhar, verificar:
1. package.json está correto?
2. Node version compatível?
3. Dependências instalando?

# Solução: Limpar cache
rm -rf node_modules package-lock.json
npm install
```

### API Retornando 500

```bash
# Verificar:
1. Environment variables definidas?
2. RPC URLs funcionando?
3. Private key válida?
```

### Compilação Falhando (API Estendida)

```bash
# Verificar:
1. solc instalado corretamente?
2. Código Solidity válido?
3. Versão solc compatível?
```

## 🔐 Segurança em Produção

### Private Keys

**⚠️ NUNCA faça commit de private keys!**

```bash
# Usar .env local apenas para testes
# No Render, definir via Environment Variables
# Considerar usar HSM (Hardware Security Module) para produção
```

### Rate Limiting

```javascript
// Configurar limites apropriados
RATE_LIMIT_MAX_REQUESTS=10  // Para testes
RATE_LIMIT_MAX_REQUESTS=50  // Para produção
```

## 📊 Custos Estimados

### Render Pricing

| Plan | CPU | RAM | Preço/mês | Recomendação |
|------|-----|-----|-----------|-------------|
| Free | 0.1 | 512MB | $0 | Testes apenas |
| Starter | 0.5 | 512MB | $7 | API Básica |
| Standard | 1.0 | 2GB | $25 | API Estendida |

### APIs Blockchain

| Provider | Free Tier | Paid |
|----------|-----------|------|
| Alchemy | 300M requests | $199+/mês |
| Infura | 100k requests/dia | $50+/mês |
| BSC RPC | Gratuito | - |

## 🎯 Próximos Passos

1. **Escolher versão da API** (básica ou estendida)
2. **Obter chaves de API** necessárias
3. **Configurar ambiente** local para testes
4. **Deploy no Render** seguindo passos acima
5. **Testar funcionalidades** antes de ir ao ar
6. **Atualizar frontend** com nova URL
7. **Monitorar performance** após deploy

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs no painel do Render
2. Testar localmente primeiro
3. Verificar configurações de ambiente
4. Documentar erro específico para suporte

---

**Status:** ✅ Pronto para implementação
**Tempo estimado:** 2-4 horas
**Dificuldade:** Intermediária
