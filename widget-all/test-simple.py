#!/usr/bin/env python3
"""
================================================================================
XCAFE WIDGET SAAS - TESTE SIMPLIFICADO DO SISTEMA
================================================================================
Script simples para testar todos os componentes críticos do sistema
================================================================================
"""

import requests
import json
import time
import sys

class SimpleSystemTester:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print(f"{'='*60}")
    
    def print_test(self, test_name, status, message=""):
        self.results['total_tests'] += 1
        if status:
            self.results['passed'] += 1
            print(f"✅ {test_name}: PASSOU")
            if message:
                print(f"   → {message}")
        else:
            self.results['failed'] += 1
            print(f"❌ {test_name}: FALHOU")
            if message:
                print(f"   → {message}")
                self.results['errors'].append(f"{test_name}: {message}")
    
    def test_server_status(self):
        """Teste 1: Verificar se servidor está rodando"""
        self.print_header("TESTE 1: STATUS DO SERVIDOR")
        
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                self.print_test("Servidor HTTP", True, f"Status: {data.get('status', 'Unknown')}")
                self.print_test("API Health Check", True, f"Service: {data.get('service', 'Unknown')}")
                
                # Verificar timestamp
                if 'timestamp' in data:
                    self.print_test("Timestamp Response", True, f"Time: {data['timestamp']}")
                else:
                    self.print_test("Timestamp Response", False, "Timestamp não encontrado")
                    
                return True
            else:
                self.print_test("Servidor HTTP", False, f"Status Code: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            self.print_test("Servidor HTTP", False, "Conexão recusada - servidor não está rodando")
            return False
        except Exception as e:
            self.print_test("Servidor HTTP", False, f"Erro: {str(e)}")
            return False
    
    def test_api_endpoints(self):
        """Teste 2: Verificar endpoints da API"""
        self.print_header("TESTE 2: ENDPOINTS DA API")
        
        endpoints = [
            ("/api/health", "Health Check"),
            ("/api/stats", "Statistics"),
            ("/", "Landing Page"),
            ("/auth.html", "Authentication Page"),
            ("/admin-panel.html", "Admin Panel"),
            ("/dashboard.html", "User Dashboard")
        ]
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
                
                if response.status_code == 200:
                    self.print_test(name, True, f"Status: {response.status_code}")
                else:
                    self.print_test(name, False, f"Status: {response.status_code}")
                    
            except Exception as e:
                self.print_test(name, False, f"Erro: {str(e)}")
    
    def test_static_files(self):
        """Teste 3: Verificar arquivos estáticos"""
        self.print_header("TESTE 3: ARQUIVOS ESTÁTICOS")
        
        static_files = [
            ("/js/shared/web3.js", "Web3 Utils"),
            ("/js/shared/api.js", "API Manager"),
            ("/js/shared/auth.js", "Auth Manager"),
        ]
        
        for file_path, name in static_files:
            try:
                response = requests.get(f"{self.base_url}{file_path}", timeout=5)
                
                if response.status_code == 200:
                    content_length = len(response.content)
                    self.print_test(name, True, f"Size: {content_length} bytes")
                else:
                    self.print_test(name, False, f"Status: {response.status_code}")
                    
            except Exception as e:
                self.print_test(name, False, f"Erro: {str(e)}")
    
    def print_summary(self):
        """Imprimir resumo dos testes"""
        print(f"\n{'='*60}")
        print(f"📊 RESUMO DOS TESTES")
        print(f"{'='*60}")
        
        total = self.results['total_tests']
        passed = self.results['passed']
        failed = self.results['failed']
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total de Testes: {total}")
        print(f"✅ Passou: {passed}")
        print(f"❌ Falhou: {failed}")
        print(f"📈 Taxa de Sucesso: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print(f"\n🎉 SISTEMA FUNCIONANDO BEM!")
            print(f"🚀 Pronto para próxima fase")
        elif success_rate >= 60:
            print(f"\n⚠️ SISTEMA PARCIALMENTE FUNCIONAL")
            print(f"🔧 Algumas correções necessárias")
        else:
            print(f"\n🚨 SISTEMA COM PROBLEMAS CRÍTICOS")
            print(f"🛠️ Correções urgentes necessárias")
        
        # Imprimir erros se houver
        if self.results['errors']:
            print(f"\n🔍 ERROS ENCONTRADOS:")
            for i, error in enumerate(self.results['errors'], 1):
                print(f"   {i}. {error}")
    
    def run_all_tests(self):
        """Executar todos os testes"""
        print(f"🧪 INICIANDO TESTES DO SISTEMA XCAFE WIDGET SAAS")
        print(f"⏰ {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Verificar se servidor está rodando primeiro
        if not self.test_server_status():
            print(f"\n🚨 ERRO CRÍTICO: Servidor não está rodando!")
            print(f"💡 Execute: python server.py")
            return False
        
        # Executar todos os testes
        self.test_api_endpoints()
        self.test_static_files()
        
        # Imprimir resumo
        self.print_summary()
        
        return self.results['passed'] >= self.results['total_tests'] * 0.8

if __name__ == "__main__":
    try:
        tester = SimpleSystemTester()
        success = tester.run_all_tests()
        
        # Exit code baseado no resultado
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print(f"\n⏹️ Testes interrompidos pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Erro fatal nos testes: {str(e)}")
        sys.exit(1)
