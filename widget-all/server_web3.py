#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Widget SaaS - Servidor Python Web3
Sistema completo com autenticacao MetaMask
"""

import os
import json
import time
import hashlib
import secrets
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler

# Imports Web3
try:
    import jwt
    from eth_account.messages import encode_defunct
    from eth_account import Account
    WEB3_AVAILABLE = True
    print("✅ Dependencias Web3 carregadas com sucesso")
except ImportError as e:
    WEB3_AVAILABLE = False
    print(f"⚠️ Dependencias Web3 nao encontradas: {e}")
    print("Execute: pip install PyJWT eth-account web3")

# Chave secreta para JWT
SECRET_KEY = "xcafe_secret_2024_web3_auth"

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

    # === METODOS WEB3 DE AUTENTICACAO ===
    
    def verify_signature(self, address, message, signature):
        """Verificar assinatura do MetaMask"""
        if not WEB3_AVAILABLE:
            print("⚠️ Web3 nao disponivel - pulando verificacao")
            return True  # Para desenvolvimento
            
        try:
            # Recrear a mensagem assinada
            message_hash = encode_defunct(text=message)
            
            # Recuperar endereco da assinatura
            recovered_address = Account.recover_message(message_hash, signature=signature)
            
            # Verificar se coincide
            return recovered_address.lower() == address.lower()
        except Exception as e:
            print(f"Erro na verificacao de assinatura: {e}")
            return False

    def generate_jwt_token(self, address, user_type):
        """Gerar token JWT"""
        if not WEB3_AVAILABLE:
            return f"temp_token_{secrets.token_hex(16)}"
            
        try:
            payload = {
                'address': address.lower(),
                'userType': user_type,
                'exp': datetime.utcnow() + timedelta(hours=24),
                'iat': datetime.utcnow()
            }
            return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        except Exception as e:
            print(f"Erro ao gerar JWT: {e}")
            return f"temp_token_{secrets.token_hex(16)}"

    def verify_jwt_token(self, token):
        """Verificar token JWT"""
        if not WEB3_AVAILABLE:
            return {'address': 'test', 'userType': 'Super Admin'}  # Para desenvolvimento
            
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            return payload
        except Exception as e:
            print(f"Token invalido: {e}")
            return None

    def get_user_type(self, address):
        """Determinar tipo de usuario pela carteira"""
        address = address.lower()
        
        # Verificar se e admin
        try:
            with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                admins = json.load(f)
                
            if address in admins:
                if admins[address].get('active', True):
                    return admins[address]['userType']
                else:
                    return "inactive"
        except:
            pass
        
        # Verificar se e primeira carteira (setup inicial)
        if self.is_first_admin():
            return "first_admin"
        
        # Usuario normal
        return "normal"

    def is_first_admin(self):
        """Verificar se e a primeira carteira do sistema"""
        try:
            with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                admins = json.load(f)
                return len(admins) == 0
        except:
            return True

    def auto_register_user(self, address):
        """Auto-registrar usuario normal"""
        try:
            # Carregar usuarios existentes
            try:
                with open(f'{self.data_dir}/users.json', 'r', encoding='utf-8') as f:
                    users = json.load(f)
            except:
                users = {}
            
            # Se usuario nao existe, criar
            if address.lower() not in users:
                users[address.lower()] = {
                    "address": address.lower(),
                    "firstLogin": datetime.now().isoformat(),
                    "lastAccess": datetime.now().isoformat(),
                    "widgetsUsed": [],
                    "profile": {
                        "nickname": f"User{address[:8]}",
                        "preferences": {}
                    }
                }
                
                # Garantir que o diretorio existe
                os.makedirs(self.data_dir, exist_ok=True)
                
                # Salvar usuario
                with open(f'{self.data_dir}/users.json', 'w', encoding='utf-8') as f:
                    json.dump(users, f, indent=2, ensure_ascii=False)
                    
                print(f"✅ Usuario auto-registrado: {address}")
            else:
                # Atualizar ultimo acesso
                users[address.lower()]['lastAccess'] = datetime.now().isoformat()
                with open(f'{self.data_dir}/users.json', 'w', encoding='utf-8') as f:
                    json.dump(users, f, indent=2, ensure_ascii=False)
                    
        except Exception as e:
            print(f"Erro no auto-registro: {e}")

    def authenticate_wallet(self, data):
        """Autenticar carteira e determinar tipo de usuario"""
        try:
            address = data.get('address', '').lower()
            message = data.get('message', '')
            signature = data.get('signature', '')
            timestamp = data.get('timestamp', 0)
            
            # Verificar se assinatura e valida
            if not self.verify_signature(address, message, signature):
                return {"success": False, "error": "Assinatura invalida"}
            
            # Verificar se timestamp e recente (5 minutos)
            if abs(time.time() * 1000 - timestamp) > 300000:
                return {"success": False, "error": "Token expirado"}
            
            # Verificar tipo de usuario
            user_type = self.get_user_type(address)
            
            # Auto-registrar se for usuario normal
            if user_type == "normal":
                self.auto_register_user(address)
            
            # Gerar token JWT
            token = self.generate_jwt_token(address, user_type)
            
            return {
                "success": True,
                "address": address,
                "userType": user_type,
                "token": token,
                "permissions": self.get_user_permissions(address)
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro na autenticacao: {str(e)}"}

    def get_user_permissions(self, address):
        """Obter permissoes do usuario"""
        try:
            with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                admins = json.load(f)
                
            if address.lower() in admins:
                return admins[address.lower()].get('permissions', [])
        except:
            pass
        
        return []

    def setup_first_admin(self, data):
        """Configurar primeiro administrador"""
        try:
            address = data.get('address', '').lower()
            
            # Verificar se realmente e o primeiro
            if not self.is_first_admin():
                return {"success": False, "error": "Sistema ja foi configurado"}
            
            # Criar estrutura de dados
            os.makedirs(self.data_dir, exist_ok=True)
            
            # Configurar Super Admin
            admin_data = {
                address: {
                    "address": address,
                    "userType": "Super Admin",
                    "name": "Super Administrador",
                    "department": "Sistema",
                    "jobTitle": "Super Admin",
                    "permissions": [
                        "full_access", "user_management", "system_config",
                        "admin_management", "data_management", "system_reset"
                    ],
                    "addedBy": "system",
                    "addedAt": datetime.now().isoformat(),
                    "lastAccess": datetime.now().isoformat(),
                    "active": True,
                    "apiKey": f"super_{secrets.token_hex(16)}"
                }
            }
            
            # Salvar admin
            with open(f'{self.data_dir}/admins.json', 'w', encoding='utf-8') as f:
                json.dump(admin_data, f, indent=2, ensure_ascii=False)
            
            # Criar arquivos iniciais
            self.initialize_system_files()
            
            print(f"🚀 Sistema configurado com Super Admin: {address}")
            
            return {
                "success": True,
                "message": "Sistema configurado com sucesso",
                "admin": admin_data[address]
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro no setup: {str(e)}"}

    def initialize_system_files(self):
        """Inicializar arquivos do sistema"""
        try:
            # Criar arquivo de usuarios vazio
            if not os.path.exists(f'{self.data_dir}/users.json'):
                with open(f'{self.data_dir}/users.json', 'w', encoding='utf-8') as f:
                    json.dump({}, f)
            
            # Criar arquivo de widgets vazio
            if not os.path.exists(f'{self.data_dir}/widgets.json'):
                with open(f'{self.data_dir}/widgets.json', 'w', encoding='utf-8') as f:
                    json.dump({}, f)
            
            # Criar arquivo de configuracoes
            if not os.path.exists(f'{self.data_dir}/config.json'):
                config = {
                    "system": {
                        "initialized": True,
                        "version": "1.0.0",
                        "setupDate": datetime.now().isoformat()
                    }
                }
                with open(f'{self.data_dir}/config.json', 'w', encoding='utf-8') as f:
                    json.dump(config, f, indent=2, ensure_ascii=False)
                    
        except Exception as e:
            print(f"Erro ao inicializar arquivos: {e}")

    def change_super_admin_wallet(self, current_address, new_address, signature):
        """Alterar carteira do Super Admin (apenas Super Admin pode fazer)"""
        try:
            current_address = current_address.lower()
            new_address = new_address.lower()
            
            # Verificar se o usuario atual e Super Admin
            try:
                with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                    admins = json.load(f)
            except:
                return {"success": False, "error": "Nenhum admin encontrado"}
            
            if current_address not in admins:
                return {"success": False, "error": "Usuario nao e admin"}
            
            if admins[current_address]['userType'] != 'Super Admin':
                return {"success": False, "error": "Apenas Super Admin pode alterar carteira"}
            
            # Verificar se nova carteira ja existe
            if new_address in admins:
                return {"success": False, "error": "Nova carteira ja e admin"}
            
            # Transferir dados para nova carteira
            admin_data = admins[current_address].copy()
            admin_data['address'] = new_address
            admin_data['walletChangedAt'] = datetime.now().isoformat()
            admin_data['previousWallet'] = current_address
            
            # Remover carteira antiga e adicionar nova
            del admins[current_address]
            admins[new_address] = admin_data
            
            # Salvar alteracoes
            with open(f'{self.data_dir}/admins.json', 'w', encoding='utf-8') as f:
                json.dump(admins, f, indent=2, ensure_ascii=False)
            
            print(f"🔄 Carteira Super Admin alterada: {current_address} → {new_address}")
            
            return {
                "success": True,
                "message": "Carteira alterada com sucesso. Faca login novamente.",
                "newAddress": new_address,
                "requiresReauth": True
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao alterar carteira: {str(e)}"}

    def system_reset(self, data):
        """Reset completo do sistema (apenas Super Admin)"""
        try:
            # Verificar se quem esta fazendo e Super Admin
            token = data.get('token')
            if not token:
                return {"success": False, "error": "Token de autenticacao necessario"}
            
            payload = self.verify_jwt_token(token)
            if not payload:
                return {"success": False, "error": "Token invalido"}
            
            # Verificar se e Super Admin
            if payload.get('userType') != 'Super Admin':
                return {"success": False, "error": "Apenas Super Admin pode resetar o sistema"}
            
            # Resetar arquivos
            files_to_reset = [
                f'{self.data_dir}/admins.json',
                f'{self.data_dir}/users.json',
                f'{self.data_dir}/widgets.json',
                f'{self.data_dir}/config.json'
            ]
            
            removed_count = 0
            for file_path in files_to_reset:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    removed_count += 1
            
            print("🗑️ Sistema resetado completamente")
            
            return {
                "success": True,
                "message": "Sistema resetado com sucesso",
                "filesRemoved": removed_count
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro no reset: {str(e)}"}

    def create_admin_web3(self, data):
        """Criar administrador via Web3"""
        try:
            # Verificar autenticacao
            token = data.get('token')
            if not token:
                return {"success": False, "error": "Token de autenticacao necessario"}
            
            payload = self.verify_jwt_token(token)
            if not payload:
                return {"success": False, "error": "Token invalido"}
            
            # Verificar permissoes (apenas Super Admin e Admin podem criar outros admins)
            if payload.get('userType') not in ['Super Admin', 'Admin']:
                return {"success": False, "error": "Sem permissao para criar administradores"}
            
            # Dados do novo admin
            new_address = data.get('address', '').lower()
            user_type = data.get('userType', 'Moderator')
            name = data.get('name', f'Admin {new_address[:8]}')
            department = data.get('department', '')
            permissions = data.get('permissions', [])
            
            if not new_address:
                return {"success": False, "error": "Endereco da carteira obrigatorio"}
            
            # Verificar hierarquia de permissoes
            creator_type = payload.get('userType')
            if creator_type == 'Admin' and user_type in ['Super Admin', 'Admin']:
                return {"success": False, "error": "Admin so pode criar Moderadores"}
            
            # Carregar admins existentes
            try:
                with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                    admins = json.load(f)
            except:
                admins = {}
            
            # Verificar se carteira ja e admin
            if new_address in admins:
                return {"success": False, "error": "Carteira ja e administrador"}
            
            # Criar novo admin
            new_admin = {
                "address": new_address,
                "userType": user_type,
                "name": name,
                "department": department,
                "jobTitle": f"{user_type} - {department}" if department else user_type,
                "permissions": permissions,
                "addedBy": payload.get('address'),
                "addedAt": datetime.now().isoformat(),
                "lastAccess": None,
                "active": True,
                "apiKey": f"adm_{secrets.token_hex(16)}"
            }
            
            # Salvar admin
            admins[new_address] = new_admin
            
            os.makedirs(self.data_dir, exist_ok=True)
            with open(f'{self.data_dir}/admins.json', 'w', encoding='utf-8') as f:
                json.dump(admins, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Novo admin criado: {new_address} ({user_type})")
            
            return {
                "success": True,
                "message": "Administrador criado com sucesso",
                "admin": new_admin
            }
            
        except Exception as e:
            return {"success": False, "error": f"Erro ao criar admin: {str(e)}"}
    
    def do_GET(self):
        """Processar requisicoes GET"""
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            
            # Remover barra inicial
            if path.startswith('/'):
                path = path[1:]
            
            # Rotas da API
            if path.startswith('api/'):
                self.handle_api_get(path, parsed_url.query)
                return
            
            # Servir arquivos estaticos
            self.serve_static_file(path)
            
        except Exception as e:
            print(f"Erro no GET: {e}")
            self.send_error_response(500, str(e))
    
    def do_POST(self):
        """Processar requisicoes POST"""
        try:
            # Ler dados do corpo da requisicao
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length).decode('utf-8')
                try:
                    data = json.loads(post_data)
                except json.JSONDecodeError:
                    data = {}
            else:
                data = {}
            
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            
            # Remover barra inicial
            if path.startswith('/'):
                path = path[1:]
            
            # Rotas da API
            if path.startswith('api/'):
                self.handle_api_post(path, data)
                return
            
            # Endpoint nao encontrado
            self.send_error_response(404, "Endpoint nao encontrado")
            
        except Exception as e:
            print(f"Erro no POST: {e}")
            self.send_error_response(500, str(e))
    
    def handle_api_get(self, path, query_params):
        """Processar rotas GET da API"""
        
        # Health check
        if path == 'api/health':
            response = {
                "status": "OK",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "service": "Widget SaaS API Web3",
                "web3Available": WEB3_AVAILABLE
            }
            self.send_json_response(response)
            return
        
        # Estatisticas publicas
        if path == 'api/stats':
            stats = self.load_system_stats()
            self.send_json_response(stats)
            return
        
        # === ROTAS WEB3 AUTENTICACAO ===
        
        # Verificar status do sistema
        if path == 'api/system/status':
            status = {
                "initialized": not self.is_first_admin(),
                "web3Available": WEB3_AVAILABLE,
                "timestamp": datetime.now().isoformat()
            }
            self.send_json_response(status)
            return
        
        # Listar administradores
        if path == 'api/admin/list':
            admins_list = self.get_admin_list()
            self.send_json_response(admins_list)
            return
        
        # Endpoint nao encontrado
        self.send_error_response(404, "Endpoint nao encontrado")
    
    def handle_api_post(self, path, data):
        """Processar rotas POST da API"""
        
        # === ROTAS WEB3 AUTENTICACAO ===
        
        # Autenticacao via MetaMask
        if path == 'api/auth/verify':
            result = self.authenticate_wallet(data)
            self.send_json_response(result)
            return
        
        # Setup do primeiro admin
        if path == 'api/system/setup':
            result = self.setup_first_admin(data)
            self.send_json_response(result)
            return
        
        # Alterar carteira Super Admin
        if path == 'api/admin/change-wallet':
            current_address = data.get('currentAddress')
            new_address = data.get('newAddress')
            signature = data.get('signature')
            result = self.change_super_admin_wallet(current_address, new_address, signature)
            self.send_json_response(result)
            return
        
        # Reset do sistema (apenas Super Admin)
        if path == 'api/system/reset':
            result = self.system_reset(data)
            self.send_json_response(result)
            return

        # Cadastrar administrador (Web3)
        if path == 'api/admin/register':
            result = self.create_admin_web3(data)
            self.send_json_response(result)
            return
        
        # Endpoint nao encontrado
        self.send_error_response(404, "Endpoint nao encontrado")
    
    def serve_static_file(self, path):
        """Servir arquivos estaticos"""
        # Pagina inicial - redireciona para pages/index.html
        if path == '' or path == 'index.html':
            path = 'index.html'
        elif path == 'setup.html':
            path = 'setup.html'
        elif path == 'dashboard.html':
            path = 'pages/dashboard.html'
        elif path == 'demo.html':
            path = 'demo.html'
        elif path.endswith('.js') and not '/' in path:
            # Scripts do modulo
            if os.path.exists(f"modules/{path}"):
                path = f"modules/{path}"
            elif os.path.exists(f"src/{path}"):
                path = f"src/{path}"
        
        # Verificar se arquivo existe
        if not os.path.exists(path):
            self.send_error_response(404, f"Arquivo nao encontrado: {path}")
            return
        
        try:
            with open(path, 'rb') as f:
                content = f.read()
            
            # Determinar tipo de conteudo
            content_type, _ = mimetypes.guess_type(path)
            if content_type is None:
                if path.endswith('.html'):
                    content_type = 'text/html'
                elif path.endswith('.js'):
                    content_type = 'application/javascript'
                elif path.endswith('.css'):
                    content_type = 'text/css'
                else:
                    content_type = 'application/octet-stream'
            
            # Enviar resposta
            self.send_response(200)
            self.send_header('Content-Type', content_type + '; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            self.wfile.write(content)
            
        except Exception as e:
            print(f"Erro ao servir arquivo {path}: {e}")
            self.send_error_response(500, f"Erro interno: {str(e)}")
    
    def send_json_response(self, data, status=200):
        """Enviar resposta JSON"""
        try:
            json_data = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
            
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(json_data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            self.wfile.write(json_data)
            
        except Exception as e:
            print(f"Erro ao enviar JSON: {e}")
            self.send_error_response(500, "Erro na resposta JSON")
    
    def send_error_response(self, status, message):
        """Enviar resposta de erro"""
        try:
            error_data = {
                "error": message,
                "status": status,
                "timestamp": datetime.now().isoformat()
            }
            
            json_data = json.dumps(error_data, ensure_ascii=False).encode('utf-8')
            
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(json_data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json_data)
            
        except:
            # Fallback se JSON falhar
            self.send_response(status)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(message.encode('utf-8'))
    
    def do_OPTIONS(self):
        """Processar requisicoes OPTIONS (CORS)"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def load_system_stats(self):
        """Carregar estatisticas do sistema"""
        try:
            stats = {
                "timestamp": datetime.now().isoformat(),
                "totalUsers": 0,
                "totalAdmins": 0,
                "systemInitialized": not self.is_first_admin(),
                "web3Available": WEB3_AVAILABLE
            }
            
            # Contar usuarios
            try:
                with open(f'{self.data_dir}/users.json', 'r', encoding='utf-8') as f:
                    users = json.load(f)
                    stats["totalUsers"] = len(users)
            except:
                pass
            
            # Contar admins
            try:
                with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                    admins = json.load(f)
                    stats["totalAdmins"] = len(admins)
            except:
                pass
            
            return stats
            
        except Exception as e:
            print(f"Erro ao carregar estatisticas: {e}")
            return {"error": "Erro ao carregar estatisticas"}

    def get_admin_list(self):
        """Obter lista de administradores"""
        try:
            with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                admins = json.load(f)
            
            # Remover dados sensiveis da resposta
            admin_list = []
            for email, admin in admins.items():
                admin_safe = admin.copy()
                if 'apiKey' in admin_safe:
                    del admin_safe['apiKey']
                admin_list.append(admin_safe)
            
            return admin_list
            
        except Exception as e:
            print(f"Erro ao carregar admins: {e}")
            return []
    
    def log_message(self, format, *args):
        """Log personalizado"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {format % args}")

def main():
    """Funcao principal"""
    # Verificar se estamos no diretorio correto
    if not os.path.exists('widget-all') and os.path.basename(os.getcwd()) != 'widget-all':
        print("⚠️ Navegue para o diretorio widget-all antes de executar")
        return
    
    # Configuracoes do servidor
    HOST = "0.0.0.0"  # Aceita conexoes de qualquer IP
    PORT = 8000
    
    print("🚀 Iniciando Widget SaaS Server...")
    print(f"📡 Servidor: http://{HOST}:{PORT}")
    print(f"🌐 Landing: http://{HOST}:{PORT}/")
    print(f"🔐 Auth: http://{HOST}:{PORT}/auth.html")
    print(f"🎛️ Admin: http://{HOST}:{PORT}/admin-panel.html")
    print(f"❤️ Health: http://{HOST}:{PORT}/api/health")
    print(f"📈 Stats: http://{HOST}:{PORT}/api/stats")
    print()
    print("🌍 CONFIGURADO PARA PRODUCAO:")
    print(f"   - Aceita conexoes externas (HOST: {HOST})")
    print(f"   - Porta {PORT} (mude para 80 se necessario)")
    print("   - CORS habilitado para todos dominios")
    print("   - Sistema Web3 com MetaMask")
    print(f"   - Web3 disponivel: {'✅ Sim' if WEB3_AVAILABLE else '❌ Nao'}")
    print()
    print("🛑 Pressione Ctrl+C para parar")
    print()
    
    try:
        # Criar servidor
        server = HTTPServer((HOST, PORT), WidgetSaaSHandler)
        
        # Iniciar servidor
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuario")
    except Exception as e:
        print(f"\n❌ Erro no servidor: {e}")
    finally:
        print("👋 Ate logo!")

if __name__ == "__main__":
    main()
