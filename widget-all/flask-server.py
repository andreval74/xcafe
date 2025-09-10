#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🚀 XCafe Widget SaaS - Servidor API Dashboard (Flask)
Versão simplificada e confiável usando Flask
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import secrets
from datetime import datetime

# Configuração
app = Flask(__name__)
CORS(app)  # Permitir CORS para todas as rotas

# Configurações
DEBUG = True
DATA_DIR = "data"

def ensure_data_dir():
    """Garantir que diretório de dados existe"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

# ==================== ROTAS DE API ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificação de saúde da API"""
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0-flask",
        "service": "XCafe Dashboard API"
    })

@app.route('/api/contracts/list', methods=['GET'])
def list_contracts():
    """Listar contratos salvos"""
    try:
        ensure_data_dir()
        contracts_file = os.path.join(DATA_DIR, 'contracts.json')
        
        if not os.path.exists(contracts_file):
            return jsonify({
                "success": True,
                "contracts": [],
                "total": 0,
                "message": "Nenhum contrato encontrado"
            })
        
        with open(contracts_file, 'r', encoding='utf-8') as f:
            contracts = json.load(f)
        
        return jsonify({
            "success": True,
            "contracts": contracts,
            "total": len(contracts),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error listing contracts: {e}")
        return jsonify({
            "success": False,
            "error": "Erro ao listar contratos",
            "details": str(e)
        }), 500

@app.route('/api/contracts/register', methods=['POST'])
def register_contract():
    """Registrar novo contrato"""
    try:
        data = request.get_json()
        
        # Validação básica
        required_fields = ['contractAddress', 'contractName', 'ownerWallet']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Campo obrigatório: {field}"
                }), 400
        
        # Validar endereço
        if not data['contractAddress'].startswith('0x') or len(data['contractAddress']) != 42:
            return jsonify({
                "success": False,
                "error": "Endereço de contrato inválido"
            }), 400
        
        ensure_data_dir()
        contracts_file = os.path.join(DATA_DIR, 'contracts.json')
        contracts = []
        
        if os.path.exists(contracts_file):
            with open(contracts_file, 'r', encoding='utf-8') as f:
                contracts = json.load(f)
        
        # Verificar se já existe
        for contract in contracts:
            if contract['address'] == data['contractAddress']:
                return jsonify({
                    "success": False,
                    "error": "Contrato já registrado"
                }), 409
        
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
        
        return jsonify({
            "success": True,
            "contract": new_contract,
            "message": "Contrato registrado com sucesso"
        })
        
    except Exception as e:
        print(f"❌ Error registering contract: {e}")
        return jsonify({
            "success": False,
            "error": "Erro ao registrar contrato",
            "details": str(e)
        }), 500

@app.route('/api/dashboard/overview', methods=['GET'])
def dashboard_overview():
    """Obter dados para overview do dashboard"""
    try:
        ensure_data_dir()
        contracts_file = os.path.join(DATA_DIR, 'contracts.json')
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
        recent_activity = []
        if contracts:
            recent_activity = [
                {
                    "type": "sale",
                    "contract": contracts[0]['name'],
                    "amount": 0.1,
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "type": "fee",
                    "contract": contracts[0]['name'],
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
        
        return jsonify({
            "success": True,
            "overview": overview,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error getting overview: {e}")
        return jsonify({
            "success": False,
            "error": "Erro ao obter overview"
        }), 500

@app.route('/api/transactions/record', methods=['POST'])
def record_transaction():
    """Registrar nova transação"""
    try:
        data = request.get_json()
        
        # Validação básica
        required_fields = ['contractAddress', 'type', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Campo obrigatório: {field}"
                }), 400
        
        ensure_data_dir()
        transactions_file = os.path.join(DATA_DIR, 'transactions.json')
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
            update_contract_stats(data['contractAddress'], {
                'sale_amount': float(data['amount'])
            })
        
        return jsonify({
            "success": True,
            "transaction": new_transaction,
            "message": "Transação registrada com sucesso"
        })
        
    except Exception as e:
        print(f"❌ Error recording transaction: {e}")
        return jsonify({
            "success": False,
            "error": "Erro ao registrar transação"
        }), 500

@app.route('/api/stats', methods=['GET'])
def platform_stats():
    """Estatísticas gerais da plataforma"""
    try:
        ensure_data_dir()
        contracts_file = os.path.join(DATA_DIR, 'contracts.json')
        transactions_file = os.path.join(DATA_DIR, 'transactions.json')
        
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
        
        return jsonify({
            "success": True,
            "stats": {
                "totalContracts": total_contracts,
                "totalTransactions": total_transactions,
                "serverUptime": "Funcionando",
                "lastUpdate": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Erro ao obter estatísticas"
        }), 500

# ==================== FUNÇÕES AUXILIARES ====================

def update_contract_stats(contract_address, stats_data):
    """Atualizar estatísticas do contrato"""
    try:
        contracts_file = os.path.join(DATA_DIR, 'contracts.json')
        
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

# ==================== ROTAS ESTÁTICAS ====================

@app.route('/')
def index():
    """Página inicial"""
    return send_from_directory('../', 'index.html')

@app.route('/dashboard-simple.html')
def dashboard():
    """Dashboard simples"""
    return send_from_directory('../', 'dashboard-simple.html')

@app.route('/<path:filename>')
def static_files(filename):
    """Servir arquivos estáticos"""
    return send_from_directory('../', filename)

# ==================== INICIALIZAÇÃO ====================

if __name__ == '__main__':
    print(f"🚀 XCafe Dashboard API Server (Flask)")
    print(f"📡 Server: http://localhost:3001")
    print(f"🎛️ Dashboard: http://localhost:3001/dashboard-simple.html")
    print(f"❤️ Health: http://localhost:3001/api/health")
    print(f"🔧 Environment: {'development' if DEBUG else 'production'}")
    print(f"🛑 Press Ctrl+C to stop")
    print(f"")
    
    app.run(host='0.0.0.0', port=3001, debug=DEBUG)
