# 🚀 Widget SaaS - Deploy Rápido

## Para colocar no seu servidor HTTP:

### 1. Upload dos arquivos
```bash
# Faça upload de toda a pasta widget-all para seu servidor
# Estrutura necessária:
widget-all/
├── server.py      ← Servidor principal
├── start.py       ← Iniciador simplificado
├── data/          ← Dados (JSON)
├── pages/         ← Páginas web
├── src/           ← Widget JavaScript
└── contracts/     ← Smart contracts
```

### 2. No seu servidor (via SSH):
```bash
# Entrar na pasta
cd widget-all

# Dar permissão de execução
chmod +x start.py
chmod +x server.py

# Iniciar o servidor
python3 start.py
```

### 3. Para rodar na porta 80 (padrão web):
```bash
# Editar server.py linha ~505:
PORT = 80

# Executar com privilégios de administrador:
sudo python3 start.py
```

### 4. Para rodar em background (servidor fica sempre ativo):
```bash
# Opção 1: nohup (simples)
nohup python3 start.py &

# Opção 2: screen (recomendado)
screen -S widget-saas
python3 start.py
# Pressionar Ctrl+A, depois D para "detach"

# Para voltar ao screen:
screen -r widget-saas
```

### 5. URLs do sistema:
- **Landing Page**: `http://seu-servidor.com/`
- **Dashboard**: `http://seu-servidor.com/dashboard.html`
- **Demo**: `http://seu-servidor.com/demo.html`
- **API Health**: `http://seu-servidor.com/api/health`
- **API Stats**: `http://seu-servidor.com/api/stats`

### 6. Teste rápido:
```bash
# Verificar se está funcionando:
curl http://localhost:8000/api/health

# Deve retornar:
{"status": "ok", "message": "Widget SaaS API Online"}
```

## ⚡ PRONTO PARA USAR!

O sistema é **100% Python puro** (sem dependências externas).
Funciona em qualquer servidor com Python 3.7+

### 🔧 Configurações opcionais:

1. **Mudar porta**: Edite `PORT = 8000` no `server.py`
2. **SSL/HTTPS**: Use proxy nginx ou apache
3. **Domínio próprio**: Configure DNS apontando para seu servidor
4. **Firewall**: Libere a porta escolhida (8000 ou 80)

### 📞 Suporte:
- Todos os logs aparecem no terminal
- Sistema auto-explicativo
- Dados salvos em JSON (fácil backup)

**Pronto! Seu Widget SaaS está online! 🎉**
