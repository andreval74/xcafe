# 🚀 Widget SaaS Platform

Sistema completo para criação e gerenciamento de widgets de criptomoedas na blockchain BSC.

## ⚡ Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/andreval74/xcafe.git
cd xcafe/widget-all

# Execute a instalação automática
./setup.ps1  # Windows
./setup.sh   # Linux/Mac

# Inicie o servidor
python server.py
```

**Acesse**: http://localhost:8000

## 🎯 Funcionalidades Principais

✅ **Widget Incorporável** - Widgets JavaScript para compra de tokens  
✅ **Painel Admin** - Interface completa de gerenciamento  
✅ **API RESTful** - Backend com autenticação JWT  
✅ **Blockchain BSC** - Integração com MetaMask  
✅ **Sistema Completo** - Pronto para produção  

## 📁 Arquivos Principais

- `server.py` - Servidor Flask principal
- `admin-panel.html` - Painel administrativo
- `demo-widget.html` - Demo do widget
- `setup.ps1/setup.sh` - Instaladores automáticos

## 📋 Estrutura do Sistema

```
widget-all/
├── api/                    # Backend Node.js
│   ├── server.js          # Servidor principal
│   └── package.json       # Dependências
├── modules/               # Módulos compartilhados
│   ├── data-manager.js    # Gerenciamento de dados
│   └── auth-manager.js    # Autenticação MetaMask
├── contracts/             # Smart Contracts
│   └── UniversalSaleContract.sol
├── pages/                 # Frontend
│   ├── index.html         # Landing page
│   └── dashboard.html     # Dashboard do usuário
├── src/                   # Widget embeddable
│   └── widget-sale.js     # Widget principal
├── data/                  # Armazenamento local
├── assets/               # Assets estáticos
└── shared/               # Utilitários compartilhados
```

## 🚀 Instalação e Configuração

### 1. Pré-requisitos

- **Node.js** 16+ 
- **NPM** 8+
- **MetaMask** instalado no navegador
- **Conta em rede blockchain** (Ethereum, BSC, etc.)

### 2. Configuração do Backend

```bash
cd widget-all/api
npm install
```

Criar arquivo `.env`:
```env
PORT=3000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Iniciar servidor:
```bash
npm run dev
```

### 3. Configuração do Frontend

Abrir `pages/index.html` em um servidor local ou hospedar os arquivos.

### 4. Deploy do Smart Contract

1. Compilar o contrato `contracts/UniversalSaleContract.sol`
2. Deploy na rede desejada
3. Atualizar endereço no sistema

## 📖 Como Usar

### Para Proprietários de Tokens

1. **Conectar MetaMask** na landing page
2. **Comprar créditos** no dashboard
3. **Criar widget** configurando seu token
4. **Copiar código** gerado
5. **Integrar** no seu website

### Para Compradores

1. **Conectar MetaMask** no widget
2. **Escolher quantidade** de tokens
3. **Confirmar transação** na blockchain
4. **Receber tokens** automaticamente

## 🔧 API Endpoints

### Autenticação
```
POST /api/users/register     # Registrar usuário
GET  /api/users/me          # Dados do usuário
PUT  /api/users/profile     # Atualizar perfil
```

### Créditos
```
POST /api/credits/purchase  # Comprar créditos
GET  /api/credits/history   # Histórico de créditos
```

### Widgets
```
POST /api/widgets           # Criar widget
GET  /api/widgets           # Listar widgets
GET  /api/widgets/:id       # Obter widget específico
PUT  /api/widgets/:id       # Atualizar widget
```

### Transações
```
POST /api/transactions      # Criar transação
GET  /api/transactions      # Listar transações
PUT  /api/transactions/:id  # Atualizar transação
```

### Público
```
GET /api/health             # Health check
GET /api/stats              # Estatísticas públicas
GET /api/widget/validate/:id # Validar widget
```

## 🎯 Integração do Widget

### Método 1: Script Tag
```html
<div id="token-widget"></div>
<script src="https://yourapi.com/widget.js"></script>
<script>
new TokenSaleWidget({
  apiKey: 'sua-api-key',
  containerId: 'token-widget',
  theme: 'light'
});
</script>
```

### Método 2: Data Attributes
```html
<div data-token-widget 
     data-api-key="sua-api-key" 
     data-sale-id="widget-id"
     data-theme="light">
</div>
<script src="https://yourapi.com/widget.js"></script>
```

### Parâmetros de Configuração

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `apiKey` | string | Sua chave de API |
| `containerId` | string | ID do container |
| `theme` | string | Tema: light, dark, blue, green |
| `autoConnect` | boolean | Conectar MetaMask automaticamente |
| `showLogo` | boolean | Mostrar logo da plataforma |

## 💼 Sistema de Comissões

- **Vendedor**: Recebe 98% do valor
- **Plataforma**: Fica com 2% (comissão automática)
- **Comprador**: Paga preço definido pelo vendedor

### Fluxo de Pagamento

1. Comprador paga valor total
2. 98% vai para carteira do vendedor
3. 2% vai para carteira da plataforma
4. Tokens são enviados para comprador

## 📊 Sistema de Créditos

### Pacotes Disponíveis

| Pacote | Créditos | Preço | Preço/Crédito |
|--------|----------|-------|---------------|
| Starter | 100 | $10 | $0.10 |
| Professional | 500 | $40 | $0.08 |
| Business | 1000 | $75 | $0.075 |
| Enterprise | 5000 | $300 | $0.06 |

### Consumo de Créditos

- **1 crédito** = 1 transação processada
- Créditos são consumidos apenas em vendas concluídas
- Sem cobrança por visualizações ou tentativas falhadas

## 🛡️ Segurança

### Smart Contract
- **ReentrancyGuard**: Proteção contra ataques de reentrada
- **Ownable**: Controle de propriedade
- **Pausable**: Pausa de emergência
- **Validações**: Verificações completas de entrada

### API
- **Rate Limiting**: Máximo 100 requests/15min
- **Helmet**: Headers de segurança
- **CORS**: Controle de origem
- **Validação**: Sanitização de entrada

### Frontend
- **CSP**: Content Security Policy
- **XSS Protection**: Prevenção de scripts maliciosos
- **HTTPS Only**: Forçar conexões seguras

## 🚀 Deploy e Hospedagem

### Opções de Deploy

#### Opção 1: Vercel/Netlify (Frontend)
```bash
# Build estático
npm run build
# Deploy automático via Git
```

#### Opção 2: VPS/Cloud (Completo)
```bash
# PM2 para gerenciar processo
npm install -g pm2
pm2 start api/server.js --name widget-api
pm2 startup
pm2 save
```

#### Opção 3: Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Variáveis de Ambiente

```env
# Servidor
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Blockchain
ETHEREUM_RPC=https://mainnet.infura.io/v3/your-key
BSC_RPC=https://bsc-dataseed.binance.org
POLYGON_RPC=https://polygon-rpc.com

# Segurança
JWT_SECRET=your-secret
API_SECRET=your-api-secret
```

## 📈 Monitoramento

### Métricas Importantes
- Número de usuários ativos
- Widgets criados
- Volume de transações
- Taxa de conversão
- Receita de comissões

### Logs e Debugging
```bash
# Ver logs em tempo real
pm2 logs widget-api

# Monitoramento
pm2 monit
```

## 🔧 Desenvolvimento

### Estrutura de Dados

#### Usuário
```json
{
  "walletAddress": "0x...",
  "apiKey": "wgt_...",
  "credits": 100,
  "widgets": ["widget-id-1"],
  "profile": {
    "displayName": "Nome",
    "email": "email@domain.com"
  }
}
```

#### Widget
```json
{
  "id": "widget-id",
  "name": "Meu Token",
  "tokenAddress": "0x...",
  "price": 0.1,
  "network": 1,
  "theme": "light",
  "active": true,
  "sales": 150
}
```

#### Transação
```json
{
  "id": "tx-id",
  "widgetId": "widget-id",
  "buyerAddress": "0x...",
  "sellerAddress": "0x...",
  "amount": 100,
  "quantity": 1000,
  "status": "completed"
}
```

### Testes

```bash
# Executar testes
npm test

# Cobertura
npm run test:coverage

# Testes de integração
npm run test:integration
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: suporte@widget-saas.com
- **Discord**: [Widget SaaS Community](https://discord.gg/widget-saas)
- **Documentação**: [docs.widget-saas.com](https://docs.widget-saas.com)
- **Status**: [status.widget-saas.com](https://status.widget-saas.com)

## 🎯 Roadmap

### V1.1 (Próximo)
- [ ] Suporte a mais redes blockchain
- [ ] Sistema de afiliados
- [ ] API GraphQL
- [ ] Dashboard analytics avançado

### V1.2 (Futuro)
- [ ] White label completo
- [ ] Integração com Stripe
- [ ] Sistema de notificações
- [ ] Mobile app

### V2.0 (Longo Prazo)
- [ ] Marketplace de widgets
- [ ] IA para otimização de vendas
- [ ] Sistema de governança
- [ ] Token nativo da plataforma

---

**🎉 Obrigado por usar Widget SaaS!**

Ajude-nos a crescer ⭐ starring este repositório!
