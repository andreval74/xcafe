# 🎛️ Sistema de Administradores - Widget SaaS

## ✅ Sistema Completo Implementado

O sistema de administradores foi completamente implementado e está funcionando. Aqui está como usar:

### 🚀 Acesso Rápido

1. **Iniciar Sistema**: `python server.py` na pasta `widget-all`
2. **Acessar Painel**: http://localhost:3000/admin-panel.html
3. **Fazer Login**: http://localhost:3000/auth.html
4. **Testar Sistema**: http://localhost:3000/api/health

### 👨‍💼 Como Cadastrar Administradores

#### Método 1: Interface Web (Recomendado)
1. Acesse: http://localhost:8000/admin-register.html
2. Preencha os dados do administrador:
   - Nome completo
   - Email (será o login)
   - Senha
   - Tipo de usuário (Super Admin, Admin, Moderador)
   - Departamento e cargo (opcional)
   - Permissões específicas
3. Clique em "Cadastrar Administrador"

#### Método 2: API Direta
```javascript
// Cadastro via API
const response = await fetch('/api/admin/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: "Admin Teste",
        email: "admin@xcafe.app", 
        password: "123456",
        userType: "Super Admin",
        department: "TI",
        jobTitle: "Administrador",
        permissions: ["full_access", "user_management"]
    })
});
```

### 🔑 Sistema de Login

1. **Login Web**: No painel admin (admin-panel.html)
2. **Login API**: POST para `/api/admin/login`
```javascript
const login = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: "admin@xcafe.app",
        password: "123456"
    })
});
```

### 👥 Tipos de Usuário

- **Super Admin**: Acesso total ao sistema
- **Admin**: Acesso administrativo limitado
- **Moderador**: Acesso básico de moderação

### 🛡️ Permissões Disponíveis

- `full_access`: Acesso completo
- `user_management`: Gerenciar usuários
- `system_config`: Configurações do sistema
- `widget_management`: Gerenciar widgets
- `financial_access`: Acesso financeiro
- `analytics_view`: Visualizar analytics
- `backup_restore`: Backup e restauração

### 📁 Arquivos de Dados

- **Admins**: `data/admins.json` - Dados dos administradores
- **Estrutura**:
```json
{
  "admin@xcafe.app": {
    "name": "Admin Teste",
    "email": "admin@xcafe.app",
    "password_hash": "hash_da_senha",
    "userType": "Super Admin",
    "department": "TI",
    "jobTitle": "Administrador",
    "active": true,
    "permissions": ["full_access"],
    "apiKey": "adm_chave_unica",
    "createdAt": "2024-01-01T00:00:00",
    "lastAccess": "2024-01-01T00:00:00",
    "loginCount": 5
  }
}
```

### 🧪 Teste do Sistema

Use a API de saúde: http://localhost:3000/api/health

1. **Testar Sistema**: Verifica status do servidor
2. **Testar Web3**: Conecta com MetaMask  
3. **Listar Status**: Mostra estatísticas do sistema

### 🔧 APIs Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/admin/register` | POST | Cadastrar novo admin |
| `/api/admin/login` | POST | Login de admin |
| `/api/admin/list` | GET | Listar todos os admins |

### 🌐 Configuração para xcafe.app

O sistema está configurado para funcionar em `xcafe.app/widget-all/`:

1. **URL Principal**: https://xcafe.app/widget-all/
2. **Painel Admin**: https://xcafe.app/widget-all/admin-panel.html
3. **Cadastro**: https://xcafe.app/widget-all/admin-register.html

### 🛠️ Manutenção

#### Resetar Sistema de Admins
1. Parar o servidor
2. Deletar `data/admins.json`
3. Reiniciar o servidor
4. Cadastrar novo admin

#### Backup dos Dados
```bash
# Fazer backup
cp data/admins.json backup/admins_backup_$(date +%Y%m%d).json

# Restaurar backup
cp backup/admins_backup_YYYYMMDD.json data/admins.json
```

### 🚨 Segurança

- Senhas são hasheadas com SHA-256
- Tokens únicos para cada admin
- Verificação de email único
- Sistema de permissões granular
- Logs de acesso e login

### ✅ Status: Sistema Pronto

✅ Interface de cadastro criada  
✅ APIs de backend implementadas  
✅ Sistema de login funcionando  
✅ Painel administrativo integrado  
✅ Página de testes disponível  
✅ Documentação completa  

**O sistema está pronto para uso em produção!**

---
*Criado em: $(date)*
*Versão: 1.0*
*Status: Funcional*
