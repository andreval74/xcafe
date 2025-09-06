# 🚀 Widget SaaS - Instalação Rápida

## 📋 Pré-requisitos
- Python 3.7+
- Node.js 16+ (opcional, para API Express)
- Git

## ⚡ Instalação Automática

### Windows
```powershell
# Executar como Administrador
.\setup.ps1
```

### Linux/Mac
```bash
chmod +x setup.sh
./setup.sh
```

## 🏃‍♂️ Executar Rapidamente

### Iniciar Servidor
```powershell
# Windows
.\start.ps1

# Ou manualmente
python server.py
```

```bash
# Linux/Mac
python3 server.py
```

## 🌐 Acessar Sistema

- **Principal**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin-panel.html  
- **Demo Widget**: http://localhost:8000/demo-widget.html
- **API Health**: http://localhost:8000/api/health

## 📁 Estrutura Principal

```
widget-all/
├── server.py              # Servidor principal Python Flask
├── admin-panel.html       # Painel administrativo
├── demo-widget.html       # Demo do widget
├── demo.html              # Página de demonstração
├── setup.ps1             # Instalador Windows
├── setup.sh              # Instalador Linux/Mac
├── start.ps1             # Iniciador Windows
├── start.py              # Iniciador Python
├── api/                  # APIs Node.js (opcional)
├── contracts/            # Smart contracts Solidity
├── static/               # Arquivos estáticos (CSS, JS, imagens)
└── data/                 # Banco de dados SQLite
```

## ⚙️ Configuração

1. **Variáveis de Ambiente** (opcional):
   ```bash
   cp .env.example .env
   # Editar .env conforme necessário
   ```

2. **Configuração Blockchain**:
   - BSC Testnet já configurado
   - MetaMask integrado
   - Contratos inteligentes prontos

## 🔧 Solução de Problemas

### Porta 8000 ocupada
```bash
# Alterar porta no server.py linha 310
app.run(host='0.0.0.0', port=8001)  # Mudar para 8001
```

### Erro de dependências Python
```bash
pip install flask flask-cors sqlite3
```

### Erro de permissão Windows
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎯 Deploy Produção

### Servidor Local
- Sistema já configurado para produção
- CORS habilitado
- Banco SQLite integrado

### Deploy Externo (Render, Heroku, etc.)
1. Fazer upload dos arquivos
2. Instalar dependências: `pip install flask flask-cors`
3. Executar: `python server.py`
4. Configurar porta conforme provedor

## 📞 Suporte

- Sistema 100% funcional após instalação
- Logs detalhados no terminal
- Interface responsiva e moderna

---
**Widget SaaS** - Sistema completo para criação e gestão de widgets de criptomoedas
