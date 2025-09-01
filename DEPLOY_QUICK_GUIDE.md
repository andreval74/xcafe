# 🎯 IMPLEMENTAÇÃO PRÁTICA - Nova API xcafe no Render

## 1. EXECUTE O SCRIPT (MAIS FÁCIL)

Abra PowerShell no diretório xcafe e execute:

```powershell
# Para API básica (atual)
.\deploy-api.ps1 -ApiType basic

# Para API estendida (com compilação)
.\deploy-api.ps1 -ApiType extended -TestLocal
```

## 2. OU FAÇA MANUAL

### Escolha sua versão:

**API BÁSICA (recomendado para começar)**

- Deploy apenas tokens pré-compilados
- Menor custo (Free tier do Render)
- Setup mais rápido

**API ESTENDIDA (funcionalidades completas)**  

- Compilação Solidity + deploy
- Requer Render Starter ($7/mês)
- Setup mais complexo

### Para API Estendida, copie os arquivos:

```powershell
cd api
Copy-Item package-extended.json package.json
Copy-Item server-extended.js server.js
```

## 3. DEPLOY NO RENDER

1. **Vá para render.com → New → Web Service**

2. **Conecte seu repositório GitHub**

3. **Configure assim:**
   ```powershell
   Name: xcafe-token-api
   Environment: Node  
   Root Directory: api/
   Build Command: npm install
   Start Command: npm start
   ```

4. **Adicione Environment Variables:**

   **OBRIGATÓRIAS:**

   ```environment
   PORT = 10000
   NODE_ENV = production
   BSC_RPC = https://bsc-dataseed1.binance.org
   DEPLOYER_PRIVATE_KEY = [sua_private_key_sem_0x]
   JWT_SECRET = [string_aleatoria_forte_32_chars]
   ```

   **OPCIONAIS (para melhor funcionamento):**

   ```environment
   ETHEREUM_RPC = https://eth-mainnet.alchemyapi.io/v2/[sua_chave]
   POLYGON_RPC = https://polygon-mainnet.infura.io/v3/[sua_chave]
   ```

   **PARA API ESTENDIDA (adicional):**

   ```environment
   SOLC_VERSION = 0.8.19
   OPTIMIZATION_ENABLED = true
   OPTIMIZATION_RUNS = 200
   ```

## 4. OBTER CHAVES NECESSÁRIAS

### Private Key (CUIDADO!)
- MetaMask → Account Details → Export Private Key
- Cole SEM o "0x" no início
- Certifique-se que tem BNB/ETH para gas

### APIs Blockchain (gratuitas)
- **Alchemy:** alchemy.com → Create App → Copiar API Key
- **Infura:** infura.io → Create Project → Copiar Project ID  

### JWT Secret
- Gere string aleatória: `openssl rand -base64 32`
- Ou use gerador online

## 5. TESTE SUA API

Após deploy, teste:

```bash
# Health check
curl https://sua-api.onrender.com/health

# Deploy token (API básica ou estendida)
curl -X POST https://sua-api.onrender.com/api/deploy-token \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Token",
    "symbol": "TEST",
    "totalSupply": "1000000", 
    "network": "bsc-testnet"
  }'
```

Se API estendida:
```bash
# Compilar contrato
curl -X POST https://sua-api.onrender.com/api/compile \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.19; contract Test { }",
    "contractName": "Test"
  }'
```

## 6. ATUALIZAR SEU FRONTEND

No arquivo `js/xcafe-extended-api.js`, mude:

```javascript
// De:
const API_BASE_URL = 'https://xcafe-token-api.onrender.com';

// Para:
const API_BASE_URL = 'https://sua-nova-api.onrender.com';
```

## ⚡ RESUMO RÁPIDO

1. **Executar:** `.\deploy-api.ps1 -ApiType extended`
2. **Render:** Novo Web Service → Configurar como acima
3. **Variables:** Adicionar chaves obrigatórias
4. **Testar:** Aguardar build → Testar endpoints
5. **Atualizar:** Mudar URL no frontend

## 🆘 PROBLEMAS COMUNS

**Build falhando?**
- Verificar se package.json está correto
- Limpar cache: deletar node_modules

**API 500?**

- Conferir environment variables
- Testar RPC URLs
- Verificar private key

**Sem fundos?**

- Adicionar BNB na testnet: BSC Faucet
- Verificar saldo da wallet

## 📊 CUSTOS

- **API Básica:** Render Free ($0) + RPCs gratuitas = **$0/mês**
- **API Estendida:** Render Starter ($7) + RPCs gratuitas = **$7/mês**

---

**🚀 PRONTO PARA COMEÇAR? Execute: `.\deploy-api.ps1 -ApiType extended`**
