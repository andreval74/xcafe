# XCAFE Widget System

Sistema completo de cobrança em USDT com widget incorporável, dashboard de usuário e painel administrativo.

## 🚀 Características

- **Sistema de Créditos**: Compra e recarga via MetaMask
- **Widget Incorporável**: Integração fácil em sites externos
- **Cobrança em USDT**: Pagamentos seguros na blockchain
- **Verificação por Tag**: Sistema de validação de operações
- **Painel Administrativo**: Gerenciamento completo do sistema
- **Dashboard do Usuário**: Interface intuitiva para usuários
- **Smart Contract**: Comissão automática de 2%
- **Autenticação MetaMask**: Login seguro via carteira

## 📁 Estrutura do Projeto

```
widget-all/
├── frontend/           # Interface do usuário
│   ├── js/            # Scripts JavaScript
│   ├── dashboard.html # Dashboard do usuário
│   ├── admin.html     # Painel administrativo
│   └── widget-example.html # Exemplo de uso
├── backend/           # API e servidor
│   ├── server.js      # Servidor principal
│   ├── database.js    # Configuração do banco
│   └── routes/        # Rotas da API
├── contracts/         # Smart contracts
│   ├── XCAFESaleContract.sol # Contrato principal
│   ├── scripts/       # Scripts de deploy
│   └── test/          # Testes do contrato
└── README.md          # Este arquivo
```

## 🛠️ Instalação

### 1. Backend

```bash
cd backend
npm install
npm start
```

O servidor estará disponível em:
- Frontend: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Admin: http://localhost:3000/admin

### 2. Smart Contracts

```bash
cd contracts
npm install

# Compilar contratos
npm run compile

# Executar testes
npm test

# Deploy local (Hardhat Network)
npm run deploy:local

# Deploy testnet
npm run deploy:testnet
```

### 3. Configuração

Crie um arquivo `.env` no diretório `contracts/` baseado no `.env.example`:

```env
PRIVATE_KEY=sua_chave_privada
TREASURY_WALLET=endereco_carteira_treasury
BACKEND_WALLET=endereco_carteira_backend
BSCSCAN_API_KEY=sua_api_key_bscscan
```

## 🎯 Como Usar

### Para Usuários

1. **Acesse o Dashboard**: http://localhost:3000/dashboard
2. **Conecte MetaMask**: Clique em "Conectar Carteira"
3. **Compre Créditos**: Escolha um pacote e confirme a transação
4. **Gere Chaves API**: Use para integrar o widget
5. **Monitore Uso**: Acompanhe transações e saldo

### Para Desenvolvedores

1. **Integre o Widget**:

```html
<!-- Inclua o script -->
<script src="http://localhost:3000/js/xcafe-widget.js"></script>

<!-- Crie o container -->
<div id="xcafe-widget"></div>

<!-- Inicialize o widget -->
<script>
createXCAFEWidget({
  containerId: 'xcafe-widget',
  apiKey: 'sua-api-key',
  amount: 10.00,
  description: 'Pagamento do serviço',
  onSuccess: function(result) {
    console.log('Pagamento realizado:', result);
  },
  onError: function(error) {
    console.error('Erro no pagamento:', error);
  }
});
</script>
```

2. **Configure o Backend**:

```javascript
// Verificar pagamento via API
fetch('/api/verify-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sua-api-key'
  },
  body: JSON.stringify({
    operationTag: 'tag-da-operacao'
  })
})
.then(response => response.json())
.then(data => {
  if (data.verified) {
    // Liberar acesso ao serviço
  }
});
```

### Para Administradores

1. **Acesse o Painel**: http://localhost:3000/admin
2. **Autentique-se**: Use MetaMask para login admin
3. **Gerencie Usuários**: Visualize e administre contas
4. **Monitore Transações**: Acompanhe pagamentos
5. **Configure Sistema**: Ajuste parâmetros

## 🔧 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login via MetaMask
- `POST /api/auth/verify` - Verificar token

### Usuários
- `GET /api/users/profile` - Perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `GET /api/users/credits` - Saldo de créditos

### Chaves API
- `GET /api/keys` - Listar chaves
- `POST /api/keys` - Gerar nova chave
- `DELETE /api/keys/:id` - Revogar chave

### Transações
- `GET /api/transactions` - Histórico
- `POST /api/transactions/verify` - Verificar pagamento
- `POST /api/transactions/process` - Processar transação

### Admin
- `GET /api/admin/users` - Listar usuários
- `GET /api/admin/transactions` - Todas transações
- `GET /api/admin/stats` - Estatísticas

## 🔐 Segurança

- **Autenticação MetaMask**: Login seguro via assinatura
- **Chaves API**: Tokens únicos para cada integração
- **Rate Limiting**: Proteção contra spam
- **Validação de Transações**: Verificação on-chain
- **Logs de Auditoria**: Rastreamento completo

## 🌐 Redes Suportadas

- **BSC Mainnet**: Binance Smart Chain
- **BSC Testnet**: Rede de testes
- **Polygon**: Matic Network
- **Polygon Mumbai**: Rede de testes
- **Localhost**: Desenvolvimento local

## 📊 Smart Contract

### Endereços USDT
- **BSC Mainnet**: `0x55d398326f99059fF775485246999027B3197955`
- **BSC Testnet**: `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd`
- **Polygon**: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`

### Funcionalidades
- Compra de créditos com USDT
- Sistema de comissão 2%
- Verificação por tag de operação
- Controle de acesso por roles
- Pausar/despausar contrato

## 🧪 Testes

### Backend
```bash
cd backend
npm test
```

### Smart Contracts
```bash
cd contracts
npm test
```

### Cobertura
```bash
npm run coverage
```

## 📈 Monitoramento

### Logs
- Transações processadas
- Erros de sistema
- Tentativas de acesso
- Performance da API

### Métricas
- Volume de transações
- Usuários ativos
- Taxa de conversão
- Receita gerada

## 🚨 Troubleshooting

### Problemas Comuns

1. **MetaMask não conecta**
   - Verifique se está na rede correta
   - Atualize a página
   - Limpe cache do navegador

2. **Transação falha**
   - Verifique saldo USDT
   - Confirme allowance do contrato
   - Aguarde confirmação na blockchain

3. **Widget não carrega**
   - Verifique chave API
   - Confirme URL do servidor
   - Verifique console do navegador

4. **Erro de autenticação**
   - Reconecte MetaMask
   - Verifique assinatura
   - Limpe localStorage

### Logs de Debug

```javascript
// Ativar logs detalhados
localStorage.setItem('xcafe-debug', 'true');
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: suporte@xcafe.com
- **Discord**: [XCAFE Community](https://discord.gg/xcafe)
- **Documentação**: [docs.xcafe.com](https://docs.xcafe.com)

## 🔄 Atualizações

### v1.0.0
- Sistema básico de créditos
- Widget incorporável
- Dashboard e admin
- Smart contract com comissão
- Autenticação MetaMask

---

**XCAFE Widget System** - Sistema completo de pagamentos em USDT para desenvol