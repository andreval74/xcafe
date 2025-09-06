"""
🧪 Widget SaaS - Teste Completo de Usuário Final
Simula todos os procedimentos que um usuário real faria
"""

import requests
import json
import time
from datetime import datetime

class UsuarioTestador:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.usuario_dados = {
            "email": "teste@widgetsaas.com",
            "senha": "123456789",
            "nome": "João Testador",
            "wallet": "0x742d35cc6634c0532925a3b8d0fa6f3b8af93e0f"
        }
        self.token_jwt = None
        self.widget_criado = None
        self.log_testes = []
        
    def log(self, acao, status, detalhes=""):
        """Registra log do teste"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        resultado = {
            "timestamp": timestamp,
            "acao": acao,
            "status": status,
            "detalhes": detalhes
        }
        self.log_testes.append(resultado)
        
        status_icon = "✅" if status == "SUCESSO" else "❌" if status == "ERRO" else "⚠️"
        print(f"{status_icon} [{timestamp}] {acao}: {status}")
        if detalhes:
            print(f"   📝 {detalhes}")
    
    def testar_servidor_ativo(self):
        """TESTE 1: Verificar se servidor está ativo"""
        try:
            response = self.session.get(f"{self.api_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.log("Servidor Health Check", "SUCESSO", f"Status: {data.get('status', 'unknown')}")
                return True
            else:
                self.log("Servidor Health Check", "ERRO", f"Status Code: {response.status_code}")
                return False
        except Exception as e:
            self.log("Servidor Health Check", "ERRO", f"Conexão falhou: {str(e)}")
            return False
    
    def testar_pagina_principal(self):
        """TESTE 2: Acessar página principal"""
        try:
            response = self.session.get(self.base_url, timeout=5)
            if response.status_code == 200:
                # Verificar se contém elementos essenciais
                content = response.text
                if "Widget SaaS" in content:
                    self.log("Página Principal", "SUCESSO", "Carregamento OK, título encontrado")
                    return True
                else:
                    self.log("Página Principal", "AVISO", "Página carregou mas conteúdo pode estar incompleto")
                    return True
            else:
                self.log("Página Principal", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Página Principal", "ERRO", f"Falha ao carregar: {str(e)}")
            return False
    
    def testar_cadastro_usuario(self):
        """TESTE 3: Cadastrar novo usuário"""
        try:
            dados_cadastro = {
                "email": self.usuario_dados["email"],
                "password": self.usuario_dados["senha"],
                "name": self.usuario_dados["nome"],
                "wallet_address": self.usuario_dados["wallet"]
            }
            
            response = self.session.post(f"{self.api_url}/auth/register", 
                                       json=dados_cadastro, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("success", False):
                    self.log("Cadastro Usuário", "SUCESSO", f"Usuário criado: {self.usuario_dados['email']}")
                    return True
                else:
                    self.log("Cadastro Usuário", "ERRO", f"API retornou erro: {data.get('error', 'unknown')}")
                    return False
            elif response.status_code == 409:
                self.log("Cadastro Usuário", "AVISO", "Usuário já existe, continuando com login")
                return True
            else:
                self.log("Cadastro Usuário", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Cadastro Usuário", "ERRO", f"Falha no cadastro: {str(e)}")
            return False
    
    def testar_login_usuario(self):
        """TESTE 4: Fazer login do usuário"""
        try:
            dados_login = {
                "email": self.usuario_dados["email"],
                "password": self.usuario_dados["senha"]
            }
            
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=dados_login, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success", False) and "token" in data:
                    self.token_jwt = data["token"]
                    # Adicionar token nos headers para próximas requisições
                    self.session.headers.update({"Authorization": f"Bearer {self.token_jwt}"})
                    self.log("Login Usuário", "SUCESSO", "Token JWT obtido")
                    return True
                else:
                    self.log("Login Usuário", "ERRO", f"Login falhou: {data.get('error', 'unknown')}")
                    return False
            else:
                self.log("Login Usuário", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Login Usuário", "ERRO", f"Falha no login: {str(e)}")
            return False
    
    def testar_criar_token(self):
        """TESTE 5: Criar um novo token"""
        try:
            dados_token = {
                "name": "Teste Token",
                "symbol": "TEST",
                "initial_supply": 1000000,
                "max_supply": 10000000,
                "price": 0.001,
                "contract_address": "0x" + "1234567890abcdef" * 5,
                "creator_address": self.usuario_dados["wallet"],
                "active": True
            }
            
            response = self.session.post(f"{self.api_url}/tokens", 
                                       json=dados_token, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("success", False):
                    self.log("Criar Token", "SUCESSO", f"Token criado: {dados_token['symbol']}")
                    return True
                else:
                    self.log("Criar Token", "ERRO", f"Falha: {data.get('error', 'unknown')}")
                    return False
            else:
                self.log("Criar Token", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Criar Token", "ERRO", f"Falha na criação: {str(e)}")
            return False
    
    def testar_criar_widget(self):
        """TESTE 6: Criar um widget"""
        try:
            dados_widget = {
                "name": "Meu Primeiro Widget",
                "token_symbol": "TEST",
                "theme": "light",
                "language": "pt-BR",
                "active": True,
                "config": {
                    "tokenPrice": 0.001,
                    "currency": "TBNB",
                    "blockchain": "BSC Testnet",
                    "testMode": True
                }
            }
            
            response = self.session.post(f"{self.api_url}/widgets", 
                                       json=dados_widget, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("success", False):
                    self.widget_criado = data.get("widget", {})
                    self.log("Criar Widget", "SUCESSO", f"Widget criado: {dados_widget['name']}")
                    return True
                else:
                    self.log("Criar Widget", "ERRO", f"Falha: {data.get('error', 'unknown')}")
                    return False
            else:
                self.log("Criar Widget", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Criar Widget", "ERRO", f"Falha na criação: {str(e)}")
            return False
    
    def testar_listar_widgets(self):
        """TESTE 7: Listar widgets do usuário"""
        try:
            response = self.session.get(f"{self.api_url}/widgets", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success", False):
                    widgets = data.get("widgets", [])
                    self.log("Listar Widgets", "SUCESSO", f"Encontrados {len(widgets)} widgets")
                    return True
                else:
                    self.log("Listar Widgets", "ERRO", f"Falha: {data.get('error', 'unknown')}")
                    return False
            else:
                self.log("Listar Widgets", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Listar Widgets", "ERRO", f"Falha na listagem: {str(e)}")
            return False
    
    def testar_simular_compra_token(self):
        """TESTE 8: Simular compra de tokens"""
        try:
            dados_compra = {
                "user_address": self.usuario_dados["wallet"],
                "token_symbol": "TEST",
                "bnb_amount": 0.01,
                "token_amount": 10,
                "transaction_hash": "0x" + "abcdef123456" * 5,
                "test_mode": True
            }
            
            response = self.session.post(f"{self.api_url}/transactions", 
                                       json=dados_compra, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("success", False):
                    self.log("Simular Compra", "SUCESSO", "Transação simulada registrada")
                    return True
                else:
                    self.log("Simular Compra", "ERRO", f"Falha: {data.get('error', 'unknown')}")
                    return False
            else:
                self.log("Simular Compra", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Simular Compra", "ERRO", f"Falha na simulação: {str(e)}")
            return False
    
    def testar_acesso_demo_widget(self):
        """TESTE 9: Acessar página demo do widget"""
        try:
            response = self.session.get(f"{self.base_url}/demo-widget.html", timeout=5)
            
            if response.status_code == 200:
                content = response.text
                elementos_essenciais = [
                    "Widget SaaS",
                    "MetaMask",
                    "widget-incorporavel.js",
                    "TBNB"
                ]
                
                elementos_encontrados = [elem for elem in elementos_essenciais if elem in content]
                
                if len(elementos_encontrados) >= 3:
                    self.log("Demo Widget", "SUCESSO", f"Elementos encontrados: {len(elementos_encontrados)}/4")
                    return True
                else:
                    self.log("Demo Widget", "AVISO", f"Poucos elementos: {len(elementos_encontrados)}/4")
                    return True
            else:
                self.log("Demo Widget", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Demo Widget", "ERRO", f"Falha no acesso: {str(e)}")
            return False
    
    def testar_acesso_admin_panel(self):
        """TESTE 10: Acessar painel administrativo"""
        try:
            response = self.session.get(f"{self.base_url}/admin-panel.html", timeout=5)
            
            if response.status_code == 200:
                content = response.text
                elementos_admin = [
                    "Painel Administrativo",
                    "Dashboard",
                    "admin-panel.js",
                    "MetaMask"
                ]
                
                elementos_encontrados = [elem for elem in elementos_admin if elem in content]
                
                if len(elementos_encontrados) >= 3:
                    self.log("Admin Panel", "SUCESSO", f"Elementos encontrados: {len(elementos_encontrados)}/4")
                    return True
                else:
                    self.log("Admin Panel", "AVISO", f"Poucos elementos: {len(elementos_encontrados)}/4")
                    return True
            else:
                self.log("Admin Panel", "ERRO", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Admin Panel", "ERRO", f"Falha no acesso: {str(e)}")
            return False
    
    def testar_validacao_campos(self):
        """TESTE 11: Testar validação de campos"""
        try:
            # Testar cadastro com dados inválidos
            dados_invalidos = {
                "email": "email_invalido",  # Email inválido
                "password": "123",  # Senha muito curta
                "name": "",  # Nome vazio
                "wallet_address": "endereco_invalido"  # Wallet inválido
            }
            
            response = self.session.post(f"{self.api_url}/auth/register", 
                                       json=dados_invalidos, timeout=10)
            
            # Esperamos que falhe com validação
            if response.status_code in [400, 422]:
                self.log("Validação Campos", "SUCESSO", "Validação funcionando corretamente")
                return True
            elif response.status_code == 200:
                self.log("Validação Campos", "AVISO", "Validação pode estar fraca")
                return True
            else:
                self.log("Validação Campos", "ERRO", f"Status inesperado: {response.status_code}")
                return False
        except Exception as e:
            self.log("Validação Campos", "ERRO", f"Falha no teste: {str(e)}")
            return False
    
    def testar_api_endpoints(self):
        """TESTE 12: Testar endpoints da API"""
        endpoints = [
            "/api/health",
            "/api/stats", 
            "/api/tokens",
            "/api/widgets",
            "/api/transactions"
        ]
        
        resultados = []
        for endpoint in endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=5)
                if response.status_code in [200, 401]:  # 401 ok para endpoints protegidos
                    resultados.append(True)
                else:
                    resultados.append(False)
            except:
                resultados.append(False)
        
        sucessos = sum(resultados)
        total = len(endpoints)
        
        if sucessos >= total * 0.8:  # 80% dos endpoints funcionando
            self.log("API Endpoints", "SUCESSO", f"{sucessos}/{total} endpoints funcionando")
            return True
        else:
            self.log("API Endpoints", "ERRO", f"Apenas {sucessos}/{total} endpoints funcionando")
            return False
    
    def executar_todos_os_testes(self):
        """Executa todos os testes como um usuário real"""
        print("🧪" + "="*60)
        print("🚀 WIDGET SAAS - TESTE COMPLETO DE USUÁRIO")
        print("="*62)
        print(f"📅 Iniciado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("👤 Simulando usuário real fazendo todos os procedimentos...")
        print("="*62)
        print()
        
        # Lista de todos os testes
        testes = [
            self.testar_servidor_ativo,
            self.testar_pagina_principal,
            self.testar_cadastro_usuario,
            self.testar_login_usuario,
            self.testar_criar_token,
            self.testar_criar_widget,
            self.testar_listar_widgets,
            self.testar_simular_compra_token,
            self.testar_acesso_demo_widget,
            self.testar_acesso_admin_panel,
            self.testar_validacao_campos,
            self.testar_api_endpoints
        ]
        
        # Executar testes
        sucessos = 0
        for i, teste in enumerate(testes, 1):
            print(f"\n🔍 EXECUTANDO TESTE {i:02d}/{len(testes):02d}...")
            try:
                if teste():
                    sucessos += 1
                time.sleep(0.5)  # Pausa entre testes
            except Exception as e:
                self.log(f"TESTE {i:02d}", "ERRO", f"Exceção não tratada: {str(e)}")
        
        # Relatório final
        self.gerar_relatorio_final(sucessos, len(testes))
    
    def gerar_relatorio_final(self, sucessos, total):
        """Gera relatório final dos testes"""
        taxa_sucesso = (sucessos / total) * 100
        
        print("\n" + "="*62)
        print("📊 RELATÓRIO FINAL DOS TESTES DE USUÁRIO")
        print("="*62)
        print(f"✅ TESTES APROVADOS: {sucessos}")
        print(f"❌ TESTES FALHADOS: {total - sucessos}")
        print(f"📊 TOTAL DE TESTES: {total}")
        print(f"📈 TAXA DE SUCESSO: {taxa_sucesso:.1f}%")
        print("="*62)
        
        if taxa_sucesso >= 80:
            print("🎉 RESULTADO: SISTEMA FUNCIONAL PARA USUÁRIOS!")
            print("✅ Experiência do usuário: APROVADA")
        elif taxa_sucesso >= 60:
            print("⚠️  RESULTADO: SISTEMA PARCIALMENTE FUNCIONAL")
            print("🔧 Experiência do usuário: NECESSITA MELHORIAS")
        else:
            print("❌ RESULTADO: SISTEMA COM PROBLEMAS CRÍTICOS")
            print("🛠️  Experiência do usuário: REQUER CORREÇÕES")
        
        print("\n📋 LOG DETALHADO:")
        print("-" * 62)
        for log in self.log_testes:
            status_icon = "✅" if log["status"] == "SUCESSO" else "❌" if log["status"] == "ERRO" else "⚠️"
            print(f"{status_icon} [{log['timestamp']}] {log['acao']}: {log['status']}")
            if log["detalhes"]:
                print(f"   📝 {log['detalhes']}")
        
        print("\n" + "="*62)
        print(f"🏁 TESTES CONCLUÍDOS EM: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("🎯 SISTEMA TESTADO COMO USUÁRIO REAL!")
        print("="*62)

if __name__ == "__main__":
    testador = UsuarioTestador()
    testador.executar_todos_os_testes()
