# ✅ Checklist Final - Deploy xcafe API

## 📋 PRÉ-REQUISITOS
- [ ] Conta criada no [Render.com](https://render.com)
- [ ] Repositório GitHub atualizado
- [ ] Chaves de API blockchain obtidas
- [ ] Private key segura disponível
- [ ] JWT secret gerado

## 🔧 PREPARAÇÃO LOCAL
- [ ] Script `deploy-api.ps1` executado
- [ ] Tipo de API escolhido (basic/extended)
- [ ] Arquivos corretos configurados
- [ ] Backup dos arquivos originais criado
- [ ] Teste local realizado (se solicitado)

## 🚀 CONFIGURAÇÃO NO RENDER

### Criação do Service
- [ ] Novo Web Service criado
- [ ] Repositório GitHub conectado
- [ ] Branch "main" selecionada
- [ ] Configurações inseridas:
  - [ ] Name: xcafe-token-api-extended
  - [ ] Environment: Node  
  - [ ] Root Directory: api/
  - [ ] Build Command: npm install
  - [ ] Start Command: npm start

### Environment Variables
- [ ] PORT = 10000
- [ ] NODE_ENV = production
- [ ] BSC_RPC = https://bsc-dataseed1.binance.org
- [ ] BSC_TESTNET_RPC = https://data-seed-prebsc-1-s1.binance.org:8545
- [ ] ETHEREUM_RPC = https://eth-mainnet.alchemyapi.io/v2/[SUA_CHAVE]
- [ ] POLYGON_RPC = https://polygon-mainnet.infura.io/v3/[SUA_CHAVE]
- [ ] DEPLOYER_PRIVATE_KEY = [SUA_PRIVATE_KEY]
- [ ] JWT_SECRET = [SEU_JWT_SECRET]
- [ ] RATE_LIMIT_WINDOW = 60000
- [ ] RATE_LIMIT_MAX_REQUESTS = 10

### Para API Estendida (adicional)
- [ ] SOLC_VERSION = 0.8.19
- [ ] OPTIMIZATION_ENABLED = true
- [ ] OPTIMIZATION_RUNS = 200
- [ ] COMPILE_TIMEOUT = 120000

## 🧪 TESTES PÓS-DEPLOY

### Health Check
```bash
curl https://seu-service.onrender.com/health
```
- [ ] Status 200 retornado
- [ ] Resposta JSON válida

### API Básica
```bash
curl -X POST https://seu-service.onrender.com/api/deploy-token \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Token",
    "symbol": "TEST", 
    "totalSupply": "1000000",
    "network": "bsc-testnet"
  }'
```
- [ ] Deploy funciona
- [ ] Transaction hash retornado
- [ ] Token criado na blockchain

### API Estendida (adicional)
```bash
curl -X POST https://seu-service.onrender.com/api/compile \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "pragma solidity ^0.8.19; contract Test { string public name = \"Test\"; }",
    "contractName": "Test"
  }'
```
- [ ] Compilação funciona
- [ ] ABI e bytecode retornados
- [ ] Sem erros de compilação

## 🔗 ATUALIZAÇÃO DO FRONTEND

### Arquivo js/xcafe-extended-api.js
- [ ] API_BASE_URL atualizada para nova URL
- [ ] Endpoints configurados corretamente
- [ ] Testes de integração realizados

### Exemplo de atualização:
```javascript
const API_BASE_URL = 'https://seu-service.onrender.com';
```

## 🔍 MONITORAMENTO

### Logs e Performance
- [ ] Logs do Render verificados
- [ ] Tempo de resposta aceitável (<5s)
- [ ] Sem erros 500 nos logs
- [ ] Rate limiting funcionando

### Alertas (recomendado)
- [ ] Monitoramento de uptime configurado
- [ ] Alertas de erro configurados
- [ ] Backup/rollback planejado

## 💰 CUSTOS E LIMITES

### Render Plan
- [ ] Free: Limitado, com sleep
- [ ] Starter ($7/mês): Recomendado para produção
- [ ] Standard ($25/mês): Alta performance

### APIs Blockchain
- [ ] Limites das APIs monitorados
- [ ] Plano de upgrade definido se necessário

## 🛡️ SEGURANÇA

### Chaves e Secrets
- [ ] Private keys nunca commitadas no git
- [ ] JWT secrets fortes (32+ caracteres)
- [ ] Environment variables configuradas no Render
- [ ] Backup seguro das chaves

### Rate Limiting
- [ ] Limites apropriados configurados
- [ ] Monitoramento de abuso
- [ ] Logs de requests suspeitos

## 📚 DOCUMENTAÇÃO

- [ ] README.md atualizado
- [ ] URLs da API documentadas
- [ ] Exemplos de uso atualizados
- [ ] Equipe informada das mudanças

## 🎯 PRÓXIMOS PASSOS

1. **Após Deploy Bem-sucedido:**
   - [ ] Comunicar nova URL à equipe
   - [ ] Atualizar frontend em produção  
   - [ ] Monitorar primeiras 24h
   - [ ] Documentar lições aprendidas

2. **Se Problemas no Deploy:**
   - [ ] Verificar logs do Render
   - [ ] Confirmar environment variables
   - [ ] Testar localmente primeiro
   - [ ] Rollback se necessário

3. **Melhorias Futuras:**
   - [ ] Implementar testes automatizados
   - [ ] Configurar CI/CD pipeline
   - [ ] Adicionar mais redes blockchain
   - [ ] Implementar cache Redis

---

## 📞 SUPORTE RÁPIDO

**Build falhando?**
1. Verificar package.json correto
2. Limpar cache: rm -rf node_modules
3. Verificar versão Node.js

**API retornando 500?**
1. Verificar environment variables
2. Testar RPC URLs manualmente
3. Confirmar private key válida

**Compilação falhando?**
1. Verificar código Solidity válido
2. Confirmar versão solc compatível
3. Aumentar timeout se necessário

**Deploy de token falhando?**
1. Verificar saldo da wallet
2. Confirmar rede correta
3. Testar na testnet primeiro

---

**Status:** ⏳ Aguardando execução
**Tempo estimado:** 1-2 horas
**Última atualização:** $(Get-Date -Format 'yyyy-MM-dd HH:mm')
