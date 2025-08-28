# Instruções de Deploy da API no Render

## 1. Preparar o Repositório

1. Faça commit dos arquivos da API:
   ```bash
   git add api/
   git commit -m "Add token deploy API"
   git push
   ```

## 2. Deploy no Render

### Passo 1: Criar Web Service
1. Acesse [render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub `andreval74/xcafe`

### Passo 2: Configurações do Build
```
Name: xcafe-token-deploy-api
Environment: Node
Region: Oregon (US West) ou Frankfurt (Europe)
Branch: main
Root Directory: api
Build Command: npm install
Start Command: npm start
```

### Passo 3: Configurações Avançadas
```
Node Version: 18
Auto-Deploy: Yes (recomendado)
```

### Passo 4: Health Check (Opcional)
```
Health Check Path: /
```

## 3. Configurar Variáveis de Ambiente

No painel do Render, vá em "Environment" e adicione:

```
NODE_ENV=production
PORT=3000
```

## 4. URL da API

Após o deploy, sua API estará disponível em:
```
https://xcafe-token-api.onrender.com
```

## 5. Atualizar o Frontend

No arquivo `js/token-deploy-api.js`, atualize a URL:

```javascript
class TokenDeployAPI {
    constructor(apiBaseUrl = 'https://xcafe-token-api.onrender.com') {
        this.baseUrl = apiBaseUrl;
        // ...
    }
}
```

## 6. Testar a API

### Teste básico:
```bash
curl https://xcafe-token-api.onrender.com/
```

### Teste de redes:
```bash
curl https://xcafe-token-api.onrender.com/networks
```

## 7. Monitoramento

- Render fornece logs automáticos
- Monitore a aba "Logs" para debug
- A API hiberna após 15min sem uso (plano gratuito)
- Primeira requisição após hibernação demora ~30s

## 8. Custos

**Render (Plano Gratuito):**
- 750 horas/mês
- Hiberna após 15min inativo
- Limitações de RAM/CPU

**Render (Plano Pago - $7/mês):**
- Sem hibernação
- Mais recursos
- Custom domain

## 9. Backup da Configuração

Mantenha backup dos arquivos:
- `api/package.json`
- `api/server.js` 
- `api/.env.example`

## 10. Troubleshooting

### API não responde:
1. Verifique logs no Render
2. Confirme se PORT está definido
3. Teste com curl

### Deploy falha:
1. Verifique se `package.json` está correto
2. Confirme dependências no `api/`
3. Verifique Node version compatibility

### Erro de CORS:
- API já configurada com CORS
- Se necessário, ajuste origins em `server.js`

## 11. URL para Usar no Frontend

Depois que a API estiver no ar, use esta URL no arquivo `token-deploy-api.js`:

```javascript
// Produção
const API_URL = 'https://xcafe-token-api.onrender.com';

// Local (para desenvolvimento)
const API_URL = 'http://localhost:3000';
```
