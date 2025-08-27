# xcafe Token Deploy API

API para deploy de tokens ERC-20 em múltiplas redes blockchain.

## 🌟 Novidades v2.0

- **Multi-Chain**: Suporte automático para múltiplas redes via `chains.json`
- **Configuração Dinâmica**: Gas price e limits otimizados por rede
- **Expansível**: Fácil adição de novas redes sem alterar código
- **Inteligente**: Deploy habilitado apenas para redes suportadas

## Deploy no Render

1. **Criar novo Web Service no Render**
2. **Conectar o repositório GitHub**
3. **Configurar Build:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node.js

## Endpoints

### GET `/`
Informações da API e redes suportadas

### GET `/networks`
Lista todas as redes disponíveis
- Query param: `?deployOnly=true` - retorna apenas redes com deploy ativo

### GET `/network/:chainId`
Informações detalhadas de uma rede específica

**Response:**
```json
{
  "success": true,
  "network": {
    "name": "BNB Smart Chain Mainnet",
    "chainId": 56,
    "symbol": "BNB",
    "explorerUrl": "https://bscscan.com",
    "deploySupported": true,
    "gasPrice": "5 gwei",
    "gasLimit": 800000
  }
}
```

### POST `/deploy-token`
Deploy de um novo token

**Body:**
```json
{
  "tokenName": "Meu Token",
  "tokenSymbol": "MTK",
  "decimals": 18,
  "totalSupply": "1000000",
  "ownerAddress": "0x...",
  "chainId": 56,
  "deployerPrivateKey": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "address": "0x...",
    "name": "Meu Token",
    "symbol": "MTK",
    "decimals": 18,
    "totalSupply": "1000000",
    "owner": "0x..."
  },
  "transaction": {
    "hash": "0x...",
    "blockNumber": 12345,
    "gasUsed": "500000"
  },
  "network": {
    "name": "BNB Smart Chain Mainnet",
    "chainId": 56,
    "symbol": "BNB",
    "explorer": "https://bscscan.com/tx/0x..."
  }
}
```

### GET `/transaction/:hash/:chainId`
Verificar status de uma transação

## Redes Suportadas

A API carrega automaticamente as redes do arquivo `chains.json`. Redes com deploy ativo:

- ✅ **BSC Mainnet** (56) - BNB
- ✅ **BSC Testnet** (97) - tBNB  
- ✅ **Ethereum Mainnet** (1) - ETH
- ✅ **Polygon Mainnet** (137) - MATIC
- ✅ **Polygon Mumbai** (80001) - MATIC
- ✅ **Avalanche C-Chain** (43114) - AVAX
- ✅ **Fantom Opera** (250) - FTM
- ✅ **Arbitrum One** (42161) - ETH
- ✅ **Optimism** (10) - ETH
- ✅ **Base** (8453) - ETH

### Adicionar Novas Redes

Para adicionar uma nova rede, basta incluir no `chains.json`:

```json
{
  "name": "Nova Rede",
  "chainId": 12345,
  "rpc": ["https://rpc.nova-rede.com"],
  "explorers": [{"url": "https://explorer.nova-rede.com"}],
  "nativeCurrency": {"symbol": "TOKEN", "decimals": 18}
}
```

E adicionar o chainId na lista `supportedChains` na função `isDeploySupported()`.

## Segurança

- Rate limiting: 3 requests por minuto por IP
- Validação rigorosa de parâmetros
- Verificação de saldo antes do deploy
- Logs detalhados de todas operações
- Configurações de gas otimizadas por rede

## Custos por Rede

| Rede | Gas Típico | Taxa Nativa |
|------|------------|-------------|
| BSC Mainnet | ~0.003 BNB | $1-2 |
| BSC Testnet | ~0.003 tBNB | Grátis |
| Ethereum | ~0.02 ETH | $30-60 |
| Polygon | ~0.01 MATIC | $0.01-0.05 |
| Avalanche | ~0.01 AVAX | $0.20-0.50 |
| Fantom | ~0.1 FTM | $0.05-0.20 |

## Como usar no Frontend

```javascript
// Listar redes disponíveis
const networks = await fetch('https://sua-api.render.com/networks?deployOnly=true')
  .then(r => r.json());

// Deploy em rede específica
const deployResult = await fetch('https://sua-api.render.com/deploy-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenName: "Meu Token",
    tokenSymbol: "MTK", 
    decimals: 18,
    totalSupply: "1000000",
    ownerAddress: "0x...",
    chainId: 56, // BSC Mainnet
    deployerPrivateKey: "0x..."
  })
}).then(r => r.json());
```

## Instalação Local

```bash
npm install
cp .env.example .env
npm run dev
```

## Arquitetura

```
chains.json → loadNetworksFromChains() → SUPPORTED_NETWORKS
                                      ↓
                                  providers{}
                                      ↓
                              Deploy API Endpoints
```

A API é completamente configurada pelo `chains.json`, tornando fácil adicionar ou remover redes sem alterações de código.
