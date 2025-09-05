# 🚀 GUIA DE DEPLOY - Widget SaaS para Servidor Web

## ✅ SIM! Pode colocar direto no seu servidor HTTP

O sistema Widget SaaS foi desenvolvido para ser **plug-and-play** em qualquer servidor web com Python. Aqui está o guia completo de deploy:

---

## 📋 REQUISITOS DO SERVIDOR

### Mínimos:
- **Python 3.7+** (recomendado Python 3.9+)
- **2GB RAM** mínimo
- **10GB espaço em disco**
- **Acesso SSH/FTP** para upload

### Recomendados:
- **4GB RAM** 
- **20GB SSD**
- **Ubuntu 20.04+** ou **CentOS 8+**
- **Nginx** como proxy reverso (opcional)
- **SSL/TLS** certificate

---

## 🎯 DEPLOY EM 5 PASSOS

### 1. **Upload dos Arquivos**

Envie toda a pasta `widget-all` para seu servidor:

```bash
# Via SCP
scp -r widget-all/ user@seu-servidor.com:/var/www/

# Via FTP
# Upload toda a pasta widget-all para /var/www/ ou /home/user/
```

### 2. **Configurar Permissões**

```bash
# Conectar via SSH
ssh user@seu-servidor.com

# Ir para o diretório
cd /var/www/widget-all

# Dar permissões
chmod +x server.py
chmod 755 -R .
chown -R www-data:www-data . # Ubuntu/Debian
# ou
chown -R nginx:nginx .       # CentOS/RHEL
```

### 3. **Configurar para Produção**

Editar o arquivo `server.py` linha 334:

```python
# Mudar de:
HOST = "localhost"
PORT = 8000

# Para:
HOST = "0.0.0.0"  # Aceitar de qualquer IP
PORT = 80         # Porta padrão HTTP (ou 8000 se 80 ocupada)
```

### 4. **Iniciar o Servidor**

```bash
# Método 1: Direto (para teste)
cd /var/www/widget-all
python3 server.py

# Método 2: Em background
nohup python3 server.py > server.log 2>&1 &

# Método 3: Com systemd (recomendado)
# Ver seção "Deploy Avançado" abaixo
```

### 5. **Testar**

```bash
# Testar localmente
curl http://localhost/api/health

# Testar externamente
curl http://seu-dominio.com/api/health
```

---

## 🔧 CONFIGURAÇÕES DE PRODUÇÃO

### Editar `server.py` para produção:

```python
# Linha 334 - Configurações do servidor
HOST = "0.0.0.0"        # Aceitar conexões externas
PORT = 80               # Porta HTTP padrão (ou 8080/8000)

# Opcional: Adicionar antes da linha 'server.serve_forever()'
print(f"🌍 Servidor público em: http://seu-dominio.com")
print(f"🔗 API disponível em: http://seu-dominio.com/api/health")
```

---

## 🏗️ DEPLOY AVANÇADO (RECOMENDADO)

### 1. **Criar Serviço Systemd**

```bash
sudo nano /etc/systemd/system/widget-saas.service
```

Conteúdo do arquivo:

```ini
[Unit]
Description=Widget SaaS Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/widget-all
ExecStart=/usr/bin/python3 /var/www/widget-all/server.py
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Ativar o serviço:

```bash
sudo systemctl daemon-reload
sudo systemctl enable widget-saas
sudo systemctl start widget-saas
sudo systemctl status widget-saas
```

### 2. **Configurar Nginx (Opcional)**

```bash
sudo nano /etc/nginx/sites-available/widget-saas
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/widget-saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🌐 OPÇÕES DE HOSPEDAGEM

### **VPS/Cloud (Recomendado)**
- ✅ **DigitalOcean**: $5/mês - Droplet básico
- ✅ **Vultr**: $3.50/mês - Cloud Compute
- ✅ **Linode**: $5/mês - Nanode
- ✅ **AWS EC2**: $3-10/mês - t2.micro/small
- ✅ **Google Cloud**: $5-15/mês - e2-micro/small

### **Hospedagem Compartilhada**
- ⚠️ **Hostinger**: Se permitir Python
- ⚠️ **cPanel**: Com acesso SSH
- ❌ **Shared hosting básico**: Geralmente não funciona

### **Plataformas PaaS**
- ✅ **Heroku**: Deploy fácil com Git
- ✅ **Railway**: Deploy com GitHub
- ✅ **PythonAnywhere**: Especializado em Python
- ✅ **Render**: Deploy automático

---

## 🔒 CONFIGURAÇÕES DE SEGURANÇA

### 1. **Firewall**

```bash
# Ubuntu UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# CentOS Firewalld
sudo firewall-cmd --add-port=80/tcp --permanent
sudo firewall-cmd --add-port=443/tcp --permanent
sudo firewall-cmd --reload
```

### 2. **SSL Certificate (Let's Encrypt)**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Auto-renovação
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 MONITORAMENTO

### **Logs do Sistema**

```bash
# Ver logs do serviço
sudo journalctl -u widget-saas -f

# Ver logs do arquivo
tail -f /var/www/widget-all/server.log

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
```

### **Status do Servidor**

```bash
# Status do serviço
sudo systemctl status widget-saas

# Processos Python
ps aux | grep python

# Uso de memória
free -h

# Espaço em disco
df -h
```

---

## 🎯 DEPLOY RÁPIDO - RECEITA COMPLETA

Para **Ubuntu 20.04+**:

```bash
# 1. Conectar no servidor
ssh user@seu-servidor.com

# 2. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 3. Instalar Python
sudo apt install python3 python3-pip -y

# 4. Upload dos arquivos (do seu computador local)
scp -r widget-all/ user@seu-servidor.com:/var/www/

# 5. Configurar (no servidor)
cd /var/www/widget-all
sudo chown -R www-data:www-data .
sudo chmod +x server.py

# 6. Editar configuração
sudo nano server.py
# Mudar HOST = "0.0.0.0" e PORT = 80

# 7. Testar
sudo python3 server.py

# 8. Se funcionou, criar serviço
sudo nano /etc/systemd/system/widget-saas.service
# Cole o conteúdo do systemd mostrado acima

# 9. Ativar serviço
sudo systemctl daemon-reload
sudo systemctl enable widget-saas
sudo systemctl start widget-saas

# 10. Testar
curl http://localhost/api/health
```

---

## ✅ CHECKLIST DE DEPLOY

- [ ] Servidor com Python 3.7+
- [ ] Upload da pasta `widget-all`
- [ ] Permissões configuradas
- [ ] `HOST = "0.0.0.0"` no server.py
- [ ] Porta liberada no firewall
- [ ] Servidor iniciado com sucesso
- [ ] `/api/health` retorna status OK
- [ ] DNS apontando para o servidor
- [ ] SSL configurado (recomendado)
- [ ] Backup dos dados configurado

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### **Erro: Permission Denied**
```bash
sudo chown -R $USER:$USER /var/www/widget-all
chmod +x server.py
```

### **Erro: Port in use**
```bash
# Ver qual processo usa a porta
sudo lsof -i :80
sudo kill -9 PID_DO_PROCESSO
```

### **Erro: Module not found**
```bash
# Instalar dependências Python
sudo apt install python3-pip
# (O servidor não tem dependências externas)
```

### **Erro: Data directory not found**
```bash
# Certificar que está no diretório correto
cd /var/www/widget-all
ls -la data/
```

---

## 🎉 RESULTADO FINAL

Após o deploy, seu Widget SaaS estará disponível em:

- **🌐 Site**: `http://seu-dominio.com/`
- **📊 Dashboard**: `http://seu-dominio.com/dashboard.html`
- **❤️ Health**: `http://seu-dominio.com/api/health`
- **📈 Stats**: `http://seu-dominio.com/api/stats`
- **🎮 Demo**: `http://seu-dominio.com/demo.html`

**✅ Sistema 100% funcional em produção!** 🚀
