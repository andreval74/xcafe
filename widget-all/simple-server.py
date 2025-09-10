#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🚀 XCafe Widget SaaS - Servidor Simples com Endpoints Dashboard
Versão simplificada focada em funcionalidade core do dashboard
"""

import os
import json
import secrets
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes

# Configuração
HOST = '0.0.0.0'
PORT = 3001  # Porta diferente para não conflitar
DEBUG = True

class XCafeSimpleHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.data_dir = "data"
        self.ensure_data_dir()
        super().__init__(*args, **kwargs)

    def ensure_data_dir(self):
        """Garantir que diretório de dados existe"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def do_OPTIONS(self):
        """Responder a requisições OPTIONS (CORS)"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Processar requisições GET"""
        try:
            parsed_path = urlparse(self.path)
            path = parsed_path.path.lstrip('/')
            
            print(f"📥 GET: {path}")
            
            # API Endpoints
            if path.startswith('api/'):
                self.handle_api_get(path)
                return
            
            # Arquivos estáticos
            self.serve_static_file(path)
            
        except Exception as e:
            print(f"❌ GET Error: {e}")
            self.send_error_response(500, f"Internal error: {str(e)}")

    def do_POST(self):
        """Processar requisições POST"""
        try:
            parsed_path = urlparse(self.path)
            path = parsed_path.path.lstrip('/')
            
            # Ler dados do corpo da requisição
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            data = {}
            if content_length > 0:
                try:
                    data = json.loads(post_data.decode('utf-8'))
                except:
                    pass
            
            print(f"📤 POST: {path}")
            
            if path.startswith('api/'):
                self.handle_api_post(path, data)
                return
            
            self.send_error_response(404, "Endpoint not found")
            
        except Exception as e:
            print(f"❌ POST Error: {e}")
            self.send_error_response(500, f"Internal error: {str(e)}")

    # ==================== API ENDPOINTS ====================

    def handle_api_get(self, path):
        """Processar GET APIs"""
        
        if path == 'api/health':
            response = {
                "status": "OK",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0-simple",
                "service": "XCafe Simple Dashboard API"
            }
            self.send_json_response(response)
            return
        
        if path == 'api/contracts/list':
            result = self.list_contracts()
            self.send_json_response(result)
            return
            
        if path == 'api/dashboard/overview':
            result = self.get_dashboard_overview()
            self.send_json_response(result)
            return
            
        if path == 'api/stats':
            result = self.get_platform_stats()
            self.send_json_response(result)
            return
        
        self.send_error_response(404, "API endpoint not found")

    def handle_api_post(self, path, data):
        """Processar POST APIs"""
        
        if path == 'api/contracts/register':
            result = self.register_contract(data)
            self.send_json_response(result)
            return
            
        if path == 'api/contracts/update':
            result = self.update_contract(data)
            self.send_json_response(result)
            return
            
        if path == 'api/transactions/record':
            result = self.record_transaction(data)
            self.send_json_response(result)
            return
        
        self.send_error_response(404, "API endpoint not found")

    # ==================== LÓGICA DE NEGÓCIO ====================

    def list_contracts(self):
        """Listar contratos salvos"""
        try:
            contracts_file = os.path.join(self.data_dir, 'contracts.json')
            
            if not os.path.exists(contracts_file):
                return {
                    "success": True,
                    "contracts": [],
                    "total": 0,
                    "message": "Nenhum contrato encontrado"
                }
            
            with open(contracts_file, 'r', encoding='utf-8') as f:
                contracts = json.load(f)
            
            return {
                "success": True,
                "contracts": contracts,
                "total": len(contracts),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error listing contracts: {e}")
            return {
                "success": False,
                "error": "Erro ao listar contratos",
                "details": str(e)
            }

    def register_contract(self, data):
        """Registrar novo contrato"""
        try:
            # Validação básica
            required_fields = ['contractAddress', 'contractName', 'ownerWallet']
            for field in required_fields:
                if field not in data:
                    return {
                        "success": False,
                        "error": f"Campo obrigatório: {field}"
                    }
            
            # Validar endereço
            if not data['contractAddress'].startswith('0x') or len(data['contractAddress']) != 42:
                return {
                    "success": False,
                    "error": "Endereço de contrato inválido"
                }
            
            # Carregar contratos existentes
            contracts_file = os.path.join(self.data_dir, 'contracts.json')
            contracts = []
            
            if os.path.exists(contracts_file):
                with open(contracts_file, 'r', encoding='utf-8') as f:
                    contracts = json.load(f)
            
            # Verificar se já existe
            for contract in contracts:
                if contract['address'] == data['contractAddress']:
                    return {
                        "success": False,
                        "error": "Contrato já registrado"
                    }
            
            # Criar novo contrato
            new_contract = {
                "id": len(contracts) + 1,
                "address": data['contractAddress'],
                "name": data['contractName'],
                "symbol": data.get('tokenSymbol', ''),
                "description": data.get('description', ''),
                "website": data.get('website', ''),
                "category": data.get('category', 'token'),
                "owner": data['ownerWallet'],
                "apiKey": f"xcafe_{secrets.token_hex(16)}",
                "config": {
                    "platformFee": 2.5,
                    "enabled": True
                },
                "stats": {
                    "totalSales": 0,
                    "totalVolume": 0.0,
                    "totalFees": 0.0,
                    "apiCalls": 0
                },
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat(),
                "status": "active"
            }
            
            # Adicionar e salvar
            contracts.append(new_contract)
            
            with open(contracts_file, 'w', encoding='utf-8') as f:
                json.dump(contracts, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Contrato registrado: {data['contractAddress']}")
            
            return {
                "success": True,
                "contract": new_contract,
                "message": "Contrato registrado com sucesso"
            }
            
        except Exception as e:
            print(f"❌ Error registering contract: {e}")
            return {
                "success": False,
                "error": "Erro ao registrar contrato",
                "details": str(e)
            }

    def update_contract(self, data):
        """Atualizar contrato existente"""
        try:
            if 'contractAddress' not in data:
                return {
                    "success": False,
                    "error": "Endereço do contrato é obrigatório"
                }
            
            contracts_file = os.path.join(self.data_dir, 'contracts.json')
            
            if not os.path.exists(contracts_file):
                return {
                    "success": False,
                    "error": "Nenhum contrato encontrado"
                }
            
            with open(contracts_file, 'r', encoding='utf-8') as f:
                contracts = json.load(f)
            
            # Encontrar e atualizar contrato
            for contract in contracts:
                if contract['address'] == data['contractAddress']:
                    # Atualizar campos permitidos
                    if 'name' in data:
                        contract['name'] = data['name']
                    if 'description' in data:
                        contract['description'] = data['description']
                    if 'website' in data:
                        contract['website'] = data['website']
                    if 'config' in data:
                        contract['config'].update(data['config'])
                    
                    contract['updatedAt'] = datetime.now().isoformat()
                    
                    # Salvar
                    with open(contracts_file, 'w', encoding='utf-8') as f:
                        json.dump(contracts, f, ensure_ascii=False, indent=2)
                    
                    return {
                        "success": True,
                        "contract": contract,
                        "message": "Contrato atualizado com sucesso"
                    }
            
            return {
                "success": False,
                "error": "Contrato não encontrado"
            }
            
        except Exception as e:
            print(f"❌ Error updating contract: {e}")
            return {
                "success": False,
                "error": "Erro ao atualizar contrato"
            }

    def record_transaction(self, data):
        """Registrar nova transação"""
        try:
            # Validação básica
            required_fields = ['contractAddress', 'type', 'amount']
            for field in required_fields:
                if field not in data:
                    return {
                        "success": False,
                        "error": f"Campo obrigatório: {field}"
                    }
            
            # Carregar transações existentes
            transactions_file = os.path.join(self.data_dir, 'transactions.json')
            transactions = []
            
            if os.path.exists(transactions_file):
                with open(transactions_file, 'r', encoding='utf-8') as f:
                    transactions = json.load(f)
            
            # Criar nova transação
            new_transaction = {
                "id": len(transactions) + 1,
                "contractAddress": data['contractAddress'],
                "type": data['type'],  # 'sale', 'fee', 'credit'
                "amount": float(data['amount']),
                "hash": data.get('hash', ''),
                "buyer": data.get('buyer', ''),
                "timestamp": datetime.now().isoformat(),
                "status": data.get('status', 'confirmed')
            }
            
            # Adicionar e salvar
            transactions.append(new_transaction)
            
            with open(transactions_file, 'w', encoding='utf-8') as f:
                json.dump(transactions, f, ensure_ascii=False, indent=2)
            
            # Atualizar estatísticas do contrato se for venda
            if data['type'] == 'sale':
                self.update_contract_stats(data['contractAddress'], {
                    'sale_amount': float(data['amount'])
                })
            
            return {
                "success": True,
                "transaction": new_transaction,
                "message": "Transação registrada com sucesso"
            }
            
        except Exception as e:
            print(f"❌ Error recording transaction: {e}")
            return {
                "success": False,
                "error": "Erro ao registrar transação"
            }

    def update_contract_stats(self, contract_address, stats_data):
        """Atualizar estatísticas do contrato"""
        try:
            contracts_file = os.path.join(self.data_dir, 'contracts.json')
            
            if not os.path.exists(contracts_file):
                return
            
            with open(contracts_file, 'r', encoding='utf-8') as f:
                contracts = json.load(f)
            
            for contract in contracts:
                if contract['address'] == contract_address:
                    if 'sale_amount' in stats_data:
                        amount = stats_data['sale_amount']
                        fee = amount * (contract['config']['platformFee'] / 100)
                        
                        contract['stats']['totalSales'] += 1
                        contract['stats']['totalVolume'] += amount
                        contract['stats']['totalFees'] += fee
                    
                    contract['stats']['apiCalls'] += 1
                    contract['updatedAt'] = datetime.now().isoformat()
                    
                    with open(contracts_file, 'w', encoding='utf-8') as f:
                        json.dump(contracts, f, ensure_ascii=False, indent=2)
                    break
            
        except Exception as e:
            print(f"❌ Error updating stats: {e}")

    def get_dashboard_overview(self):
        """Obter dados para overview do dashboard"""
        try:
            # Carregar contratos
            contracts_file = os.path.join(self.data_dir, 'contracts.json')
            contracts = []
            
            if os.path.exists(contracts_file):
                with open(contracts_file, 'r', encoding='utf-8') as f:
                    contracts = json.load(f)
            
            # Calcular estatísticas
            total_contracts = len(contracts)
            total_sales = sum(c['stats']['totalSales'] for c in contracts)
            total_volume = sum(c['stats']['totalVolume'] for c in contracts)
            total_fees = sum(c['stats']['totalFees'] for c in contracts)
            
            # Atividade recente (simulada)
            recent_activity = [
                {
                    "type": "sale",
                    "contract": contracts[0]['name'] if contracts else "Demo Token",
                    "amount": 0.1,
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "type": "fee",
                    "contract": contracts[0]['name'] if contracts else "Demo Token",
                    "amount": 0.0025,
                    "timestamp": datetime.now().isoformat()
                }
            ]
            
            overview = {
                "summary": {
                    "totalContracts": total_contracts,
                    "totalSales": total_sales,
                    "totalVolume": round(total_volume, 4),
                    "totalFees": round(total_fees, 6)
                },
                "recentActivity": recent_activity,
                "credits": {
                    "balance": 1250,
                    "totalPurchased": 2000,
                    "totalUsed": 750
                }
            }
            
            return {
                "success": True,
                "overview": overview,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error getting overview: {e}")
            return {
                "success": False,
                "error": "Erro ao obter overview"
            }

    def get_platform_stats(self):
        """Estatísticas gerais da plataforma"""
        try:
            contracts_file = os.path.join(self.data_dir, 'contracts.json')
            transactions_file = os.path.join(self.data_dir, 'transactions.json')
            
            total_contracts = 0
            total_transactions = 0
            
            if os.path.exists(contracts_file):
                with open(contracts_file, 'r', encoding='utf-8') as f:
                    contracts = json.load(f)
                    total_contracts = len(contracts)
            
            if os.path.exists(transactions_file):
                with open(transactions_file, 'r', encoding='utf-8') as f:
                    transactions = json.load(f)
                    total_transactions = len(transactions)
            
            return {
                "success": True,
                "stats": {
                    "totalContracts": total_contracts,
                    "totalTransactions": total_transactions,
                    "serverUptime": "Funcionando",
                    "lastUpdate": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "Erro ao obter estatísticas"
            }

    # ==================== UTILITÁRIOS ====================

    def serve_static_file(self, path):
        """Servir arquivos estáticos"""
        if path == '':
            path = 'index.html'
        
        if not os.path.exists(path):
            self.send_error_response(404, f"File not found: {path}")
            return
        
        try:
            with open(path, 'rb') as f:
                content = f.read()
            
            content_type, _ = mimetypes.guess_type(path)
            if content_type is None:
                if path.endswith('.js'):
                    content_type = 'application/javascript'
                elif path.endswith('.css'):
                    content_type = 'text/css'
                elif path.endswith('.html'):
                    content_type = 'text/html'
                else:
                    content_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            print(f"❌ Error serving file {path}: {e}")
            self.send_error_response(500, f"Error reading file: {str(e)}")

    def send_cors_headers(self):
        """Enviar headers CORS"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def send_json_response(self, data, status=200):
        """Enviar resposta JSON"""
        try:
            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json_data.encode('utf-8'))
        except Exception as e:
            print(f"❌ Error sending JSON: {e}")
            self.send_error_response(500, "Error processing response")

    def send_error_response(self, status, message):
        """Enviar resposta de erro"""
        try:
            error_data = {
                "error": True,
                "status": status,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            self.send_json_response(error_data, status)
        except:
            self.send_response(status)
            self.send_header('Content-Type', 'text/plain')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(message.encode('utf-8'))

    def log_message(self, format, *args):
        """Log customizado"""
        if DEBUG:
            print(f"🌐 {datetime.now().strftime('%H:%M:%S')} - {format % args}")

def run_server():
    """Iniciar servidor"""
    try:
        server = HTTPServer((HOST, PORT), XCafeSimpleHandler)
        print(f"")
        print(f"🚀 XCafe Simple Dashboard Server")
        print(f"📡 Server: http://{HOST}:{PORT}")
        print(f"🎛️ Dashboard: http://{HOST}:{PORT}/dashboard-simple.html")
        print(f"❤️ Health: http://{HOST}:{PORT}/api/health")
        print(f"🔧 Environment: {'development' if DEBUG else 'production'}")
        print(f"🛑 Press Ctrl+C to stop")
        print(f"")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == '__main__':
    run_server()
