# Widget SaaS - Sistema de Criação e Venda de Tokens 🚀

## 📋 O que é o Sistema

O **Widget SaaS** é uma plataforma completa para criação e gerenciamento de widgets de venda de tokens criptomoedas. O sistema permite que proprietários de tokens criem facilmente widgets incorporáveis para vender seus tokens diretamente em seus websites, sem necessidade de conhecimento técnico avançado.

## 🎯 Objetivo Principal

**Democratizar a venda de tokens cryptocurrency** fornecendo uma solução completa que permite:

- **Para Proprietários de Tokens**: Criar widgets de venda profissionais sem codificar
- **Para Compradores**: Comprar tokens de forma segura e simples através de MetaMask
- **Para a Plataforma**: Gerar receita através de comissões automáticas (2%)

## � Como Funciona

### 1. **Autenticação Web3 (Sem Senhas)**
- Sistema 100% baseado em carteiras cryptocurrency (MetaMask)
- Autenticação por assinatura digital
- Não requer senhas ou emails obrigatórios
- Detecção automática de perfil (Admin/Usuário)

### 2. **Criação de Widgets**
- Interface simples para configurar tokens
- Personalização visual (temas, cores)
- Configuração de preços e quantidades
- Geração automática de código incorporável

### 3. **Sistema de Créditos**
- Usuários compram créditos para usar a plataforma
- 1 crédito = 1 transação processada
- Cobrança apenas por vendas realizadas
- Pacotes econômicos disponíveis

### 4. **Processo de Venda**
```
Comprador → Widget → MetaMask → Smart Contract → Tokens Enviados
                              ↓
                        98% para Vendedor
                        2% para Plataforma
```

### 5. **Gerenciamento Completo**
- Dashboard para monitorar vendas
- Painel administrativo hierárquico
- Analytics detalhadas
- Histórico de transações

## 🏗️ Arquitetura do Sistema

### **Frontend (Interface)**
- **index.html**: Homepage com apresentação e registro
- **auth.html**: Autenticação Web3 via MetaMask
- **dashboard.html**: Painel do usuário com widgets e estatísticas
- **admin-panel.html**: Painel administrativo completo

### **Backend (Servidor)**
- **server.py**: Servidor Flask com APIs REST
- **Banco de Dados**: SQLite com estrutura completa
- **Web3 Integration**: Conexão com blockchain Ethereum/BSC

### **Smart Contracts**
- **UniversalSaleContract.sol**: Contrato principal de vendas
- **WidgetSaaSToken.sol**: Token exemplo para testes

### **Sistema de Arquivos**
```
├── 🏠 index.html, auth.html, dashboard.html, admin-panel.html
├── 🎨 css/app.css (estilos unificados)
├── ⚡ js/ (JavaScript modular)
├── 💾 data/ (banco SQLite + JSONs)
├── 📚 docs/ (documentação completa)
├── 🛠️ setup/ (scripts de instalação)
├── 📄 contracts/ (smart contracts)
└── 🔗 api/ (servidor adicional Node.js)
```

## 💰 Modelo de Negócio

### **Receita da Plataforma**
- **2% de comissão** em cada venda realizada
- Cobrança automática via smart contract
- Receita passiva e escalável

### **Benefícios para Usuários**
- **98% do valor** vai para o vendedor
- Sem taxas mensais ou anuais
- Pague apenas pelo que usar
- Interface profissional e confiável

### **Sistema de Créditos**
| Pacote | Créditos | Valor | Custo/Transação |
|--------|----------|-------|-----------------|
| Starter | 100 | $10 | $0.10 |
| Pro | 500 | $40 | $0.08 |
| Business | 1000 | $75 | $0.075 |
| Enterprise | 5000 | $300 | $0.06 |

## 🔐 Segurança e Confiabilidade

### **Smart Contract Security**
- Auditoria de segurança implementada
- Proteção contra ataques de reentrada
- Controles de acesso rigorosos
- Pausas de emergência disponíveis

### **Autenticação Segura**
- Sem armazenamento de senhas
- Verificação por assinatura criptográfica
- JWT tokens com expiração
- Rate limiting nas APIs

### **Transações Blockchain**
- Todas as vendas registradas on-chain
- Rastreabilidade completa
- Comissões automáticas e transparentes
- Sem possibilidade de fraude

## 📊 Funcionalidades Principais

### **Para Usuários**
- ✅ Criar widgets ilimitados (dentro do plano)
- ✅ Personalizar aparência e comportamento
- ✅ Monitorar vendas em tempo real
- ✅ Receber pagamentos automaticamente
- ✅ Analytics detalhadas

### **Para Administradores**
- ✅ Gerenciar todos os usuários
- ✅ Monitorar estatísticas globais
- ✅ Configurar taxas e limites
- ✅ Suporte e moderação
- ✅ Relatórios financeiros

### **Integração nos Websites**
```html
<!-- Código simples para incorporar -->
<div id="token-widget"></div>
<script src="https://widgets.xcafe.app/widget.js"></script>
<script>
new TokenWidget({
  apiKey: 'sua-chave-api',
  tokenAddress: '0x...',
  theme: 'dark'
});
</script>
```

## 🌐 Redes Blockchain Suportadas

- **Ethereum Mainnet** (Rede principal)
- **Binance Smart Chain** (BSC)
- **Polygon** (MATIC)
- Expansão para outras redes planejada

## 🎨 Temas e Personalização

- **Light Theme**: Tema claro profissional
- **Dark Theme**: Tema escuro moderno
- **Blue Theme**: Tema azul corporativo
- **Custom Colors**: Cores personalizáveis
- **Responsive Design**: Funciona em mobile e desktop

## 📈 Vantagens Competitivas

1. **Facilidade de Uso**: Interface intuitiva sem necessidade técnica
2. **Segurança Blockchain**: Todas as transações on-chain verificáveis
3. **Sem Lock-in**: Usuário mantém controle total dos tokens
4. **Escalabilidade**: Suporta milhares de widgets simultâneos
5. **Custo-Benefício**: Pague apenas pelas vendas realizadas

## 🔄 Fluxo de Funcionamento Completo

### **1. Registro do Vendedor**
1. Acessa a plataforma
2. Conecta MetaMask
3. Cria conta automaticamente
4. Recebe API key único

### **2. Criação do Widget**
1. Define token a ser vendido
2. Configura preço e quantidade
3. Escolhe tema visual
4. Gera código para incorporar

### **3. Integração no Site**
1. Copia código gerado
2. Cola no HTML do website
3. Widget aparece automaticamente
4. Pronto para receber vendas

### **4. Processo de Venda**
1. Comprador clica no widget
2. Conecta sua MetaMask
3. Confirma quantidade desejada
4. Paga via smart contract
5. Tokens enviados automaticamente
6. Vendedor recebe 98% do valor

### **5. Monitoramento**
1. Vendedor acompanha no dashboard
2. Vê estatísticas em tempo real
3. Histórico completo disponível
4. Pode ajustar preços a qualquer momento

## 🎯 Casos de Uso Ideais

- **Projetos DeFi**: Venda de tokens de governança
- **NFT Projects**: Venda de tokens utilitários
- **Startups Crypto**: Distribuição inicial de tokens
- **Comunidades**: Tokens de membership
- **Gaming**: Tokens de jogos e recompensas
- **E-commerce**: Tokens de fidelidade

## 📞 Informações Técnicas

- **Linguagem Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Banco de Dados**: SQLite (escalável para PostgreSQL)
- **Blockchain**: Web3.py para integração
- **Autenticação**: JWT + MetaMask Signatures
- **Deploy**: Compatível com VPS, Cloud, Docker

---

**O Widget SaaS é a solução completa para democratizar a venda de tokens cryptocurrency, oferecendo simplicidade para usuários e segurança blockchain para todas as transações.** 🎯✨

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
