#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Widget SaaS - Servidor Python Simples
Servidor de desenvolvimento para a plataforma Widget SaaS
"""

import os
import json
import time
import hashlib
import secrets
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes

class WidgetSaaSHandler(BaseHTTPRequestHandler):
    """Handler para o servidor Widget SaaS"""
    
    def __init__(self, *args, **kwargs):
        self.data_dir = "data"
        self.pages_dir = "pages"
        self.src_dir = "src"
        self.modules_dir = "modules"
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Processar requisições GET"""
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            
            # Remover barra inicial
            if path.startswith('/'):
                path = path[1:]
            
            # Rotas da API
            if path.startswith('api/'):
                self.handle_api_get(path, parsed_url.query)
            # Servir arquivos estáticos
            else:
                self.serve_static_file(path)
                
        except Exception as e:
            self.send_error_response(500, f"Erro interno: {str(e)}")
    
    def do_POST(self):
        """Processar requisições POST"""
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            
            if path.startswith('/'):
                path = path[1:]
            
            if path.startswith('api/'):
                # Ler dados do POST
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                
                try:
                    data = json.loads(post_data.decode('utf-8')) if post_data else {}
                except json.JSONDecodeError:
                    data = {}
                
                self.handle_api_post(path, data)
            else:
                self.send_error_response(404, "Endpoint não encontrado")
                
        except Exception as e:
            self.send_error_response(500, f"Erro interno: {str(e)}")
    
    def handle_api_get(self, path, query):
        """Processar rotas GET da API"""
        
        # Health check
        if path == 'api/health':
            response = {
                "status": "OK",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "service": "Widget SaaS API"
            }
            self.send_json_response(response)
            return
        
        # Estatísticas públicas
        if path == 'api/stats':
            stats = self.load_system_stats()
            self.send_json_response(stats)
            return
        
        # Validar widget
        if path.startswith('api/widget/validate/'):
            widget_id = path.split('/')[-1]
            widget = self.get_widget_by_id(widget_id)
            if widget:
                response = {
                    "valid": True,
                    "widget": {
                        "id": widget["id"],
                        "name": widget["name"],
                        "price": widget["price"],
                        "active": widget.get("active", True)
                    }
                }
            else:
                response = {"valid": False, "error": "Widget não encontrado"}
            self.send_json_response(response)
            return
        
        # Listar widgets do usuário
        if path == 'api/widgets':
            # Simular autenticação (em produção seria via header)
            user_address = self.headers.get('X-User-Address', 'demo')
            widgets = self.get_user_widgets(user_address)
            self.send_json_response({"widgets": widgets})
            return
        
        # Dados do usuário
        if path == 'api/users/me':
            user_address = self.headers.get('X-User-Address', 'demo')
            user_data = self.get_user_data(user_address)
            self.send_json_response(user_data)
            return
        
        # Endpoint não encontrado
        self.send_error_response(404, "Endpoint não encontrado")
    
    def handle_api_post(self, path, data):
        """Processar rotas POST da API"""
        
        # Registrar usuário
        if path == 'api/users/register':
            user_address = data.get('walletAddress')
            if not user_address:
                self.send_error_response(400, "Endereço da carteira obrigatório")
                return
            
            user = self.create_user(user_address)
            self.send_json_response({"success": True, "user": user})
            return
        
        # Criar widget
        if path == 'api/widgets':
            user_address = self.headers.get('X-User-Address', 'demo')
            widget = self.create_widget(user_address, data)
            if widget:
                self.send_json_response({"success": True, "widget": widget})
            else:
                self.send_error_response(400, "Erro ao criar widget")
            return
        
        # Comprar créditos
        if path == 'api/credits/purchase':
            user_address = self.headers.get('X-User-Address', 'demo')
            result = self.purchase_credits(user_address, data)
            self.send_json_response(result)
            return
        
        # Criar transação
        if path == 'api/transactions':
            result = self.create_transaction(data)
            self.send_json_response(result)
            return
        
        # Endpoint não encontrado
        self.send_error_response(404, "Endpoint não encontrado")
    
    def serve_static_file(self, path):
        """Servir arquivos estáticos"""
        # Página inicial - usar index.html na raiz
        if path == '' or path == 'index.html':
            path = 'index.html'
        elif path == 'dashboard.html':
            path = 'pages/dashboard.html'
        elif path == 'demo.html':
            path = 'demo.html'
        elif path.endswith('.js') and not '/' in path:
            # Scripts do módulo
            if os.path.exists(f"modules/{path}"):
                path = f"modules/{path}"
            elif os.path.exists(f"src/{path}"):
                path = f"src/{path}"
        
        # Verificar se arquivo existe
        if not os.path.exists(path):
            self.send_error_response(404, f"Arquivo não encontrado: {path}")
            return
        
        try:
            with open(path, 'rb') as f:
                content = f.read()
            
            # Determinar tipo MIME
            mime_type, _ = mimetypes.guess_type(path)
            if mime_type is None:
                if path.endswith('.js'):
                    mime_type = 'application/javascript'
                elif path.endswith('.css'):
                    mime_type = 'text/css'
                elif path.endswith('.html'):
                    mime_type = 'text/html'
                else:
                    mime_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-Type', mime_type + '; charset=utf-8')
            self.send_header('Content-Length', len(content))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            self.send_error_response(500, f"Erro ao ler arquivo: {str(e)}")
    
    def send_json_response(self, data, status_code=200):
        """Enviar resposta JSON"""
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(json_data.encode('utf-8')))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-User-Address')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))
    
    def send_error_response(self, status_code, message):
        """Enviar resposta de erro"""
        error_data = {
            "error": True,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.send_json_response(error_data, status_code)
    
    def load_system_stats(self):
        """Carregar estatísticas do sistema"""
        try:
            with open(f"{self.data_dir}/system_stats.json", 'r') as f:
                return json.load(f)
        except:
            return {
                "totalUsers": 127,
                "totalWidgets": 89,
                "totalTransactions": 1340,
                "totalVolume": 45230,
                "totalCredits": 15000,
                "lastUpdated": datetime.now().isoformat()
            }
    
    def get_user_data(self, user_address):
        """Obter dados do usuário"""
        try:
            with open(f"{self.data_dir}/users.json", 'r') as f:
                users = json.load(f)
            
            user = users.get(user_address, {})
            if not user:
                user = self.create_user(user_address)
            
            return user
        except:
            return self.create_user(user_address)
    
    def create_user(self, user_address):
        """Criar novo usuário"""
        user = {
            "walletAddress": user_address,
            "apiKey": f"wgt_{secrets.token_hex(16)}",
            "credits": 100,  # Créditos iniciais de boas-vindas
            "widgets": [],
            "transactions": [],
            "createdAt": datetime.now().isoformat(),
            "profile": {
                "displayName": "",
                "email": ""
            }
        }
        
        try:
            # Carregar usuários existentes
            try:
                with open(f"{self.data_dir}/users.json", 'r') as f:
                    users = json.load(f)
            except:
                users = {}
            
            # Adicionar novo usuário
            users[user_address] = user
            
            # Salvar
            with open(f"{self.data_dir}/users.json", 'w') as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
            
            return user
        except Exception as e:
            print(f"Erro ao criar usuário: {e}")
            return user
    
    def get_user_widgets(self, user_address):
        """Obter widgets do usuário"""
        try:
            with open(f"{self.data_dir}/widgets.json", 'r') as f:
                widgets = json.load(f)
            
            user_widgets = []
            for widget_id, widget in widgets.items():
                if widget.get("owner") == user_address:
                    user_widgets.append(widget)
            
            return user_widgets
        except:
            return []
    
    def get_widget_by_id(self, widget_id):
        """Obter widget por ID"""
        try:
            with open(f"{self.data_dir}/widgets.json", 'r') as f:
                widgets = json.load(f)
            return widgets.get(widget_id)
        except:
            return None
    
    def create_widget(self, user_address, data):
        """Criar novo widget"""
        widget_id = f"widget_{int(time.time())}_{secrets.token_hex(4)}"
        
        widget = {
            "id": widget_id,
            "name": data.get("name", "Meu Token"),
            "tokenAddress": data.get("tokenAddress", ""),
            "price": float(data.get("price", 0.1)),
            "network": data.get("network", "1"),
            "minPurchase": float(data.get("minPurchase", 1)),
            "maxPurchase": float(data.get("maxPurchase", 10000)),
            "theme": data.get("theme", "light"),
            "description": data.get("description", ""),
            "owner": user_address,
            "active": True,
            "sales": 0,
            "createdAt": datetime.now().isoformat()
        }
        
        try:
            # Carregar widgets existentes
            try:
                with open(f"{self.data_dir}/widgets.json", 'r') as f:
                    widgets = json.load(f)
            except:
                widgets = {}
            
            # Adicionar novo widget
            widgets[widget_id] = widget
            
            # Salvar
            with open(f"{self.data_dir}/widgets.json", 'w') as f:
                json.dump(widgets, f, indent=2, ensure_ascii=False)
            
            return widget
        except Exception as e:
            print(f"Erro ao criar widget: {e}")
            return None
    
    def purchase_credits(self, user_address, data):
        """Processar compra de créditos"""
        credits = int(data.get("credits", 100))
        price = float(data.get("price", 10))
        
        try:
            # Carregar usuários
            with open(f"{self.data_dir}/users.json", 'r') as f:
                users = json.load(f)
            
            if user_address not in users:
                return {"success": False, "error": "Usuário não encontrado"}
            
            # Adicionar créditos
            users[user_address]["credits"] += credits
            
            # Salvar
            with open(f"{self.data_dir}/users.json", 'w') as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
            
            return {
                "success": True,
                "credits": users[user_address]["credits"],
                "purchased": credits
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_transaction(self, data):
        """Criar nova transação"""
        transaction = {
            "id": f"tx_{int(time.time())}_{secrets.token_hex(8)}",
            "widgetId": data.get("widgetId"),
            "buyerAddress": data.get("buyerAddress"),
            "sellerAddress": data.get("sellerAddress"),
            "amount": float(data.get("amount", 0)),
            "quantity": float(data.get("quantity", 0)),
            "status": "pending",
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            # Carregar transações
            try:
                with open(f"{self.data_dir}/transactions.json", 'r') as f:
                    transactions = json.load(f)
            except:
                transactions = []
            
            # Adicionar transação
            transactions.append(transaction)
            
            # Manter apenas últimas 1000 transações
            if len(transactions) > 1000:
                transactions = transactions[-1000:]
            
            # Salvar
            with open(f"{self.data_dir}/transactions.json", 'w') as f:
                json.dump(transactions, f, indent=2, ensure_ascii=False)
            
            return {"success": True, "transaction": transaction}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def log_message(self, format, *args):
        """Log personalizado"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {format % args}")

def main():
    """Função principal"""
    # Verificar se estamos no diretório correto
    if not os.path.exists("data"):
        print("❌ Diretório 'data' não encontrado. Execute este script no diretório widget-all")
        return
    
    if not os.path.exists("pages"):
        print("❌ Diretório 'pages' não encontrado. Execute este script no diretório widget-all")
        return
    
    # Configurações do servidor
    HOST = "0.0.0.0"  # Aceitar conexões de qualquer IP (para produção)
    PORT = 8000       # Porta padrão (mude para 80 em produção se disponível)
    
    print("🚀 Iniciando Widget SaaS Server...")
    print(f"📡 Servidor: http://{HOST}:{PORT}")
    print(f"🌐 Landing: http://{HOST}:{PORT}/")
    print(f"📊 Dashboard: http://{HOST}:{PORT}/dashboard.html")
    print(f"🎮 Demo: http://{HOST}:{PORT}/demo.html")
    print(f"❤️  Health: http://{HOST}:{PORT}/api/health")
    print(f"📈 Stats: http://{HOST}:{PORT}/api/stats")
    print("")
    print("🌍 CONFIGURADO PARA PRODUÇÃO:")
    print(f"   - Aceita conexões externas (HOST: {HOST})")
    print(f"   - Porta {PORT} (mude para 80 se necessário)")
    print(f"   - CORS habilitado para todos domínios")
    print(f"   - API completa funcionando")
    print("")
    print("🛑 Pressione Ctrl+C para parar")
    print("")
    
    try:
        # Criar servidor
        server = HTTPServer((HOST, PORT), WidgetSaaSHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuário")
    except Exception as e:
        print(f"❌ Erro no servidor: {e}")
        if "Permission denied" in str(e):
            print("💡 Dica: Use 'sudo python3 server.py' para porta 80")
        elif "Address already in use" in str(e):
            print("💡 Dica: Porta ocupada. Mude a PORT para 8080 ou mate o processo")
        elif "No such file or directory" in str(e):
            print("💡 Dica: Execute no diretório widget-all onde estão as pastas data/ e pages/")

if __name__ == "__main__":
    main()
