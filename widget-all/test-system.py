#!/usr/bin/env python3
"""
================================================================================
XCAFE WIDGET SAAS - TESTE AUTOMATIZADO DO SISTEMA
================================================================================
Script para testar todos os componentes críticos do sistema
================================================================================
"""

import requests
import json
import time
import sys
from colorama import init, Fore, Back, Style

# Inicializar colorama para Windows
init()

class SystemTester:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def print_header(self, title):
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"{Fore.CYAN}🧪 {title}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    
    def print_test(self, test_name, status, message=""):
        self.results['total_tests'] += 1
        if status:
            self.results['passed'] += 1
            print(f"{Fore.GREEN}✅ {test_name}: PASSOU{Style.RESET_ALL}")
            if message:
                print(f"   {Fore.WHITE}→ {message}{Style.RESET_ALL}")
        else:
            self.results['failed'] += 1
            print(f"{Fore.RED}❌ {test_name}: FALHOU{Style.RESET_ALL}")
            if message:
                print(f"   {Fore.YELLOW}→ {message}{Style.RESET_ALL}")
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
            ("/css/app.css", "Main CSS"),
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
    
    def test_web3_integration(self):
        """Teste 4: Verificar integração Web3"""
        self.print_header("TESTE 4: INTEGRAÇÃO WEB3")
        
        try:
            # Testar endpoint de stats que usa Web3
            response = requests.get(f"{self.base_url}/api/stats", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                self.print_test("API Stats", True, "Resposta recebida")
                
                # Verificar estrutura da resposta
                expected_fields = ['timestamp', 'status']
                for field in expected_fields:
                    if field in data:
                        self.print_test(f"Campo {field}", True, f"Valor: {data[field]}")
                    else:
                        self.print_test(f"Campo {field}", False, "Campo não encontrado")
            else:
                self.print_test("API Stats", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.print_test("Web3 Integration", False, f"Erro: {str(e)}")
    
    def test_cors_headers(self):
        """Teste 5: Verificar headers CORS"""
        self.print_header("TESTE 5: HEADERS CORS")
        
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            headers = response.headers
            
            cors_headers = {
                'Access-Control-Allow-Origin': 'CORS Origin',
                'Access-Control-Allow-Methods': 'CORS Methods',
                'Access-Control-Allow-Headers': 'CORS Headers'
            }
            
            for header, name in cors_headers.items():
                if header in headers:
                    self.print_test(name, True, f"Value: {headers[header]}")
                else:
                    self.print_test(name, False, "Header não encontrado")
                    
        except Exception as e:
            self.print_test("CORS Headers", False, f"Erro: {str(e)}")
    
    def test_security_headers(self):
        """Teste 6: Verificar headers de segurança"""
        self.print_header("TESTE 6: HEADERS DE SEGURANÇA")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            headers = response.headers
            
            security_headers = {
                'X-Content-Type-Options': 'Content Type Options',
                'X-Frame-Options': 'Frame Options',
                'X-XSS-Protection': 'XSS Protection',
                'Content-Security-Policy': 'CSP Header'
            }
            
            for header, name in security_headers.items():
                if header in headers:
                    self.print_test(name, True, f"Present")
                else:
                    self.print_test(name, False, f"Missing (Recomendado)")
                    
        except Exception as e:
            self.print_test("Security Headers", False, f"Erro: {str(e)}")
    
    def print_summary(self):
        """Imprimir resumo dos testes"""
        print(f"\n{Fore.MAGENTA}{'='*60}")
        print(f"{Fore.MAGENTA}📊 RESUMO DOS TESTES")
        print(f"{Fore.MAGENTA}{'='*60}{Style.RESET_ALL}")
        
        total = self.results['total_tests']
        passed = self.results['passed']
        failed = self.results['failed']
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"{Fore.WHITE}Total de Testes: {total}")
        print(f"{Fore.GREEN}✅ Passou: {passed}")
        print(f"{Fore.RED}❌ Falhou: {failed}")
        print(f"{Fore.CYAN}📈 Taxa de Sucesso: {success_rate:.1f}%{Style.RESET_ALL}")
        
        if success_rate >= 80:
            print(f"\n{Fore.GREEN}🎉 SISTEMA FUNCIONANDO BEM!")
            print(f"🚀 Pronto para próxima fase{Style.RESET_ALL}")
        elif success_rate >= 60:
            print(f"\n{Fore.YELLOW}⚠️ SISTEMA PARCIALMENTE FUNCIONAL")
            print(f"🔧 Algumas correções necessárias{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.RED}🚨 SISTEMA COM PROBLEMAS CRÍTICOS")
            print(f"🛠️ Correções urgentes necessárias{Style.RESET_ALL}")
        
        # Imprimir erros se houver
        if self.results['errors']:
            print(f"\n{Fore.RED}🔍 ERROS ENCONTRADOS:")
            for i, error in enumerate(self.results['errors'], 1):
                print(f"{Fore.YELLOW}   {i}. {error}{Style.RESET_ALL}")
    
    def run_all_tests(self):
        """Executar todos os testes"""
        print(f"{Fore.BLUE}🧪 INICIANDO TESTES DO SISTEMA XCAFE WIDGET SAAS")
        print(f"{Fore.BLUE}⏰ {time.strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")
        
        # Verificar se servidor está rodando primeiro
        if not self.test_server_status():
            print(f"\n{Fore.RED}🚨 ERRO CRÍTICO: Servidor não está rodando!")
            print(f"💡 Execute: python server.py{Style.RESET_ALL}")
            return False
        
        # Executar todos os testes
        self.test_api_endpoints()
        self.test_static_files()
        self.test_web3_integration()
        self.test_cors_headers()
        self.test_security_headers()
        
        # Imprimir resumo
        self.print_summary()
        
        return self.results['passed'] >= self.results['total_tests'] * 0.8

if __name__ == "__main__":
    try:
        tester = SystemTester()
        success = tester.run_all_tests()
        
        # Exit code baseado no resultado
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}⏹️ Testes interrompidos pelo usuário{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}💥 Erro fatal nos testes: {str(e)}{Style.RESET_ALL}")
        sys.exit(1)
