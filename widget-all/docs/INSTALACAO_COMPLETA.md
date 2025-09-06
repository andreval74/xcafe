# 🚀 Guia de Instalação - Widget SaaS

## 📋 Pré-requisitos

- **Python 3.8+** instalado
- **MetaMask** extensão no navegador
- **Git** (opcional, para clone)

## ⚡ Instalação Rápida

### Windows (PowerShell)
```powershell
# 1. Clone ou baixe o projeto
git clone https://github.com/andreval74/xcafe.git
cd xcafe/widget-all

# 2. Execute o instalador automático
.\setup\setup.ps1

# 3. Inicie o servidor
python server.py
```

### Linux/Mac
```bash
# 1. Clone ou baixe o projeto
git clone https://github.com/andreval74/xcafe.git
cd xcafe/widget-all

# 2. Execute o instalador automático
chmod +x setup/setup.sh
./setup/setup.sh

# 3. Inicie o servidor
python server.py
```

## 🔧 Instalação Manual

### 1. Instalar Dependências Python
```bash
pip install -r requirements.txt
```

### 2. Configurar Banco de Dados
```bash
# O banco SQLite será criado automaticamente na primeira execução
# Ou execute manualmente:
python -c "
import sqlite3
with open('data/init.sql', 'r') as f:
    sql = f.read()
conn = sqlite3.connect('data/widget_saas.db')
conn.executescript(sql)
conn.close()
print('Banco criado com sucesso!')
"
```

### 3. Configurar Variáveis de Ambiente (Opcional)
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite conforme necessário
```

### 4. Iniciar Servidor
```bash
python server.py
```

## 🌐 Acessar o Sistema

Após inicialização, acesse:

- **Homepage**: http://localhost:8000
- **Autenticação**: http://localhost:8000/auth.html
- **Dashboard**: http://localhost:8000/dashboard.html
- **Admin Panel**: http://localhost:8000/admin-panel.html

## ⚙️ Configuração Inicial

### 1. Primeiro Acesso
1. Acesse http://localhost:8000/auth.html
2. Conecte sua MetaMask
3. Assine a mensagem de autenticação
4. O primeiro usuário será automaticamente admin

### 2. Configurar Rede Blockchain
Edite `js/shared/web3.js` para configurar a rede:
```javascript
const NETWORKS = {
    1: 'Ethereum Mainnet',
    56: 'Binance Smart Chain',
    137: 'Polygon'
};
```

### 3. Configurar Smart Contracts
Deploy os contratos em `contracts/` na rede desejada e atualize os endereços no sistema.

## 🎯 Estrutura de Arquivos

```
widget-all/
├── 📄 index.html, auth.html, dashboard.html, admin-panel.html
├── 🐍 server.py (servidor principal)
├── 📋 requirements.txt (dependências Python)
├── 
├── 🎨 css/app.css (estilos unificados)
├── ⚡ js/ (JavaScript organizado)
│   ├── xcafe-app.js (coordenador)
│   ├── shared/ (componentes)
│   └── modules/ (módulos específicos)
├── 
├── 💾 data/ (banco de dados)
│   ├── init.sql (estrutura do banco)
│   ├── widget_saas.db (SQLite - criado automaticamente)
│   └── *.json (dados do sistema)
├── 
├── 📚 docs/ (toda documentação)
├── 🛠️ setup/ (scripts de instalação)
├── 📄 contracts/ (smart contracts)
└── 🔗 api/ (servidor Node.js adicional)
```

## 🔧 Troubleshooting

### Erro: Módulo 'web3' não encontrado
```bash
pip install web3 eth-account
```

### Erro: MetaMask não conecta
1. Certifique-se que MetaMask está instalado
2. Verifique se está na rede correta
3. Limpe cache do navegador

### Erro: Banco de dados não cria
```bash
# Criar diretório data se não existir
mkdir -p data

# Executar script SQL manualmente
python -c "
import sqlite3
with open('data/init.sql', 'r') as f:
    sql = f.read()
conn = sqlite3.connect('data/widget_saas.db')
conn.executescript(sql)
conn.close()
"
```

### Porta 8000 já em uso
```bash
# Matar processo na porta 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8000 | xargs kill -9
```

## 🚀 Deploy para Produção

### VPS/Cloud Server
```bash
# 1. Clone o projeto
git clone https://github.com/andreval74/xcafe.git
cd xcafe/widget-all

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com configurações de produção

# 4. Usar PM2 ou similar para gerenciar processo
pip install gunicorn
gunicorn --bind 0.0.0.0:8000 server:app
```

### Docker (Opcional)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "server.py"]
```

## 📞 Suporte

- **Documentação completa**: `docs/`
- **Scripts de setup**: `setup/`
- **Configuração do sistema**: `.env.example`

---

**Sistema pronto para uso após instalação!** 🎯✨
