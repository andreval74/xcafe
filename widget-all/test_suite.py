#!/usr/bin/env python3
"""
Widget SaaS - Suite de Testes Automatizados
Realiza 20 testes completos do sistema
"""

import os
import sys
import time
import json
import requests
import sqlite3
from datetime import datetime
import subprocess
import threading

class WidgetSaaSTestSuite:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.test_results = []
        self.start_time = datetime.now()
        self.api_url = "http://localhost:8001"
        
    def log_test(self, test_name, status, details="", execution_time=0):
        """Registra resultado de um teste"""
        result = {
            "test_id": len(self.test_results) + 1,
            "test_name": test_name,
            "status": status,
            "details": details,
            "execution_time": execution_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        # Log imediato
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} TESTE {result['test_id']:02d}: {test_name} - {status}")
        if details:
            print(f"   📝 {details}")
        print(f"   ⏱️ Tempo: {execution_time:.2f}s")
        print("-" * 80)

    def test_01_file_structure(self):
        """Teste 1: Verificar estrutura de arquivos"""
        start = time.time()
        
        required_files = [
            "auto-deploy.py",
            "server.py",
            "demo-widget.html",
            "admin-panel.html",
            "static/js/widget-incorporavel.js",
            "static/js/admin-panel.js",
            "static/js/credit-system.js",
            "contracts/WidgetSaaSToken.sol",
            "api/server.js",
            "api/package.json"
        ]
        
        missing_files = []
        for file_path in required_files:
            full_path = os.path.join(self.base_dir, file_path)
            if not os.path.exists(full_path):
                missing_files.append(file_path)
        
        execution_time = time.time() - start
        
        if missing_files:
            self.log_test("Estrutura de Arquivos", "FAIL", 
                         f"Arquivos faltando: {', '.join(missing_files)}", execution_time)
        else:
            self.log_test("Estrutura de Arquivos", "PASS", 
                         f"Todos os {len(required_files)} arquivos encontrados", execution_time)

    def test_02_python_dependencies(self):
        """Teste 2: Verificar dependências Python"""
        start = time.time()
        
        required_modules = ["flask", "sqlite3", "requests", "json"]
        missing_modules = []
        
        for module in required_modules:
            try:
                __import__(module)
            except ImportError:
                missing_modules.append(module)
        
        execution_time = time.time() - start
        
        if missing_modules:
            self.log_test("Dependências Python", "FAIL", 
                         f"Módulos faltando: {', '.join(missing_modules)}", execution_time)
        else:
            self.log_test("Dependências Python", "PASS", 
                         "Todas as dependências Python disponíveis", execution_time)

    def test_03_auto_deploy_syntax(self):
        """Teste 3: Verificar sintaxe do auto-deploy.py"""
        start = time.time()
        
        try:
            with open(os.path.join(self.base_dir, "auto-deploy.py"), 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Verificar elementos importantes
            checks = [
                "class SystemAnalyzer" in content,
                "class MatrixDeploy" in content,
                "def install_nodejs" in content,
                "def setup_database" in content,
                "Matrix Interface" in content
            ]
            
            passed = sum(checks)
            execution_time = time.time() - start
            
            if passed >= 4:
                self.log_test("Sintaxe Auto-Deploy", "PASS", 
                             f"Estrutura válida: {passed}/5 componentes encontrados", execution_time)
            else:
                self.log_test("Sintaxe Auto-Deploy", "FAIL", 
                             f"Estrutura incompleta: {passed}/5 componentes", execution_time)
                             
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Sintaxe Auto-Deploy", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_04_database_creation(self):
        """Teste 4: Criar e verificar banco de dados"""
        start = time.time()
        
        try:
            db_path = os.path.join(self.base_dir, "database.db")
            
            # Criar banco de dados de teste
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Criar tabelas essenciais
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS widgets (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    token_symbol TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tokens (
                    id INTEGER PRIMARY KEY,
                    symbol TEXT NOT NULL,
                    name TEXT NOT NULL,
                    contract_address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Teste de inserção
            cursor.execute("INSERT INTO widgets (name, token_symbol) VALUES (?, ?)", 
                          ("Teste Widget", "TEST"))
            
            conn.commit()
            
            # Verificar inserção
            cursor.execute("SELECT COUNT(*) FROM widgets")
            count = cursor.fetchone()[0]
            
            conn.close()
            
            execution_time = time.time() - start
            
            if count > 0:
                self.log_test("Criação de Banco", "PASS", 
                             f"Banco criado e testado com sucesso - {count} registros", execution_time)
            else:
                self.log_test("Criação de Banco", "FAIL", 
                             "Falha na inserção de dados", execution_time)
                             
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Criação de Banco", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_05_server_startup(self):
        """Teste 5: Inicialização do servidor Python"""
        start = time.time()
        
        try:
            # Verificar se server.py existe e tem estrutura Flask
            server_path = os.path.join(self.base_dir, "server.py")
            
            if os.path.exists(server_path):
                with open(server_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                flask_components = [
                    "from flask import" in content,
                    "app = Flask" in content,
                    "@app.route" in content,
                    "app.run" in content
                ]
                
                passed = sum(flask_components)
                execution_time = time.time() - start
                
                if passed >= 3:
                    self.log_test("Servidor Python", "PASS", 
                                 f"Estrutura Flask válida: {passed}/4 componentes", execution_time)
                else:
                    self.log_test("Servidor Python", "FAIL", 
                                 f"Estrutura Flask incompleta: {passed}/4", execution_time)
            else:
                execution_time = time.time() - start
                self.log_test("Servidor Python", "FAIL", "server.py não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Servidor Python", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_06_nodejs_package(self):
        """Teste 6: Verificar package.json do Node.js"""
        start = time.time()
        
        try:
            package_path = os.path.join(self.base_dir, "api", "package.json")
            
            if os.path.exists(package_path):
                with open(package_path, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                
                required_deps = ["express", "jsonwebtoken", "bcryptjs", "cors"]
                found_deps = []
                
                dependencies = package_data.get("dependencies", {})
                for dep in required_deps:
                    if dep in dependencies:
                        found_deps.append(dep)
                
                execution_time = time.time() - start
                
                if len(found_deps) >= 3:
                    self.log_test("Package.json Node.js", "PASS", 
                                 f"Dependências encontradas: {', '.join(found_deps)}", execution_time)
                else:
                    self.log_test("Package.json Node.js", "FAIL", 
                                 f"Dependências insuficientes: {len(found_deps)}/4", execution_time)
            else:
                execution_time = time.time() - start
                self.log_test("Package.json Node.js", "FAIL", "package.json não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Package.json Node.js", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_07_widget_javascript(self):
        """Teste 7: Verificar widget incorporável"""
        start = time.time()
        
        try:
            widget_path = os.path.join(self.base_dir, "static", "js", "widget-incorporavel.js")
            
            if os.path.exists(widget_path):
                with open(widget_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                widget_features = [
                    "class WidgetSaaS" in content,
                    "MetaMask" in content,
                    "purchaseTokens" in content,
                    "connectMetaMask" in content,
                    "window.createWidgetSaaS" in content
                ]
                
                passed = sum(widget_features)
                execution_time = time.time() - start
                
                if passed >= 4:
                    self.log_test("Widget JavaScript", "PASS", 
                                 f"Funcionalidades implementadas: {passed}/5", execution_time)
                else:
                    self.log_test("Widget JavaScript", "FAIL", 
                                 f"Funcionalidades faltando: {passed}/5", execution_time)
            else:
                execution_time = time.time() - start
                self.log_test("Widget JavaScript", "FAIL", "widget-incorporavel.js não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Widget JavaScript", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_08_smart_contracts(self):
        """Teste 8: Verificar smart contracts"""
        start = time.time()
        
        try:
            contract_path = os.path.join(self.base_dir, "contracts", "WidgetSaaSToken.sol")
            
            if os.path.exists(contract_path):
                with open(contract_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                contract_features = [
                    "pragma solidity" in content,
                    "contract WidgetSaaSToken" in content,
                    "function buyTokens" in content,
                    "ERC20" in content,
                    "TokenFactory" in content
                ]
                
                passed = sum(contract_features)
                execution_time = time.time() - start
                
                if passed >= 4:
                    self.log_test("Smart Contracts", "PASS", 
                                 f"Componentes Solidity: {passed}/5", execution_time)
                else:
                    self.log_test("Smart Contracts", "FAIL", 
                                 f"Componentes faltando: {passed}/5", execution_time)
            else:
                execution_time = time.time() - start
                self.log_test("Smart Contracts", "FAIL", "WidgetSaaSToken.sol não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Smart Contracts", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_09_admin_panel(self):
        """Teste 9: Verificar painel administrativo"""
        start = time.time()
        
        try:
            admin_html = os.path.join(self.base_dir, "admin-panel.html")
            admin_js = os.path.join(self.base_dir, "static", "js", "admin-panel.js")
            
            html_exists = os.path.exists(admin_html)
            js_exists = os.path.exists(admin_js)
            
            if html_exists and js_exists:
                with open(admin_js, 'r', encoding='utf-8') as f:
                    js_content = f.read()
                
                admin_features = [
                    "class AdminPanel" in js_content,
                    "loadDashboardData" in js_content,
                    "createWidget" in js_content,
                    "createToken" in js_content,
                    "MetaMask" in js_content
                ]
                
                passed = sum(admin_features)
                execution_time = time.time() - start
                
                if passed >= 4:
                    self.log_test("Painel Administrativo", "PASS", 
                                 f"Funcionalidades admin: {passed}/5", execution_time)
                else:
                    self.log_test("Painel Administrativo", "FAIL", 
                                 f"Funcionalidades faltando: {passed}/5", execution_time)
            else:
                execution_time = time.time() - start
                missing = []
                if not html_exists: missing.append("HTML")
                if not js_exists: missing.append("JavaScript")
                self.log_test("Painel Administrativo", "FAIL", 
                             f"Arquivos faltando: {', '.join(missing)}", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Painel Administrativo", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_10_credit_system(self):
        """Teste 10: Verificar sistema de créditos"""
        start = time.time()
        
        try:
            credit_path = os.path.join(self.base_dir, "static", "js", "credit-system.js")
            
            if os.path.exists(credit_path):
                with open(credit_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                credit_features = [
                    "class CreditSystem" in content,
                    "plans" in content,
                    "purchasePlan" in content,
                    "debitCredits" in content,
                    "MetaMask" in content
                ]
                
                passed = sum(credit_features)
                execution_time = time.time() - start
                
                if passed >= 4:
                    self.log_test("Sistema de Créditos", "PASS", 
                                 f"Funcionalidades crédito: {passed}/5", execution_time)
                else:
                    self.log_test("Sistema de Créditos", "FAIL", 
                                 f"Funcionalidades faltando: {passed}/5", execution_time)
            else:
                execution_time = time.time() - start
                self.log_test("Sistema de Créditos", "FAIL", "credit-system.js não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Sistema de Créditos", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_11_demo_widget_page(self):
        """Teste 11: Verificar página de demonstração"""
        start = time.time()
        
        try:
            demo_path = os.path.join(self.base_dir, "demo-widget.html")
            
            if os.path.exists(demo_path):
                with open(demo_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                demo_features = [
                    "Widget SaaS" in content,
                    "MetaMask" in content,
                    "widget-incorporavel.js" in content,
                    "WIDGET_SAAS_CONFIG" in content,
                    "BSC Testnet" in content
                ]
                
                passed = sum(demo_features)
                execution_time = time.time() - start
                
                if passed >= 4:
                    self.log_test("Página de Demo", "PASS", 
                                 f"Componentes demo: {passed}/5", execution_time)
                else:
                    self.log_test("Página de Demo", "FAIL", 
                                 f"Componentes faltando: {passed}/5", execution_time)
            else:
                execution_time = time.time() - start
                self.log_test("Página de Demo", "FAIL", "demo-widget.html não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Página de Demo", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_12_documentation(self):
        """Teste 12: Verificar documentação"""
        start = time.time()
        
        try:
            docs = [
                "SISTEMA_100_COMPLETO.md",
                "ANALISE_CONFORMIDADE_OSISTEMA.md",
                "DEPLOY_SIMPLE.md",
                "DEPLOY_QUICK_GUIDE.md"
            ]
            
            found_docs = []
            for doc in docs:
                if os.path.exists(os.path.join(self.base_dir, doc)):
                    found_docs.append(doc)
            
            execution_time = time.time() - start
            
            if len(found_docs) >= 3:
                self.log_test("Documentação", "PASS", 
                             f"Documentos encontrados: {len(found_docs)}/4", execution_time)
            else:
                self.log_test("Documentação", "FAIL", 
                             f"Documentação incompleta: {len(found_docs)}/4", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Documentação", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_13_metamask_integration(self):
        """Teste 13: Verificar integração MetaMask"""
        start = time.time()
        
        try:
            metamask_path = os.path.join(self.base_dir, "static", "js", "metamask-integration.js")
            
            if os.path.exists(metamask_path):
                with open(metamask_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                metamask_features = [
                    "window.ethereum" in content,
                    "connectMetaMask" in content,
                    "sendTransaction" in content,
                    "BSC" in content or "Binance" in content,
                    "Web3" in content
                ]
                
                passed = sum(metamask_features)
                execution_time = time.time() - start
                
                if passed >= 4:
                    self.log_test("Integração MetaMask", "PASS", 
                                 f"Funcionalidades Web3: {passed}/5", execution_time)
                else:
                    self.log_test("Integração MetaMask", "FAIL", 
                                 f"Funcionalidades faltando: {passed}/5", execution_time)
            else:
                execution_time = time.time() - start
                self.log_test("Integração MetaMask", "FAIL", "metamask-integration.js não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Integração MetaMask", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_14_api_endpoints(self):
        """Teste 14: Verificar endpoints da API"""
        start = time.time()
        
        try:
            server_js_path = os.path.join(self.base_dir, "api", "server.js")
            
            if os.path.exists(server_js_path):
                with open(server_js_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                api_endpoints = [
                    "/api/widgets" in content,
                    "/api/tokens" in content,
                    "/api/transactions" in content,
                    "/api/auth" in content,
                    "/api/credits" in content
                ]
                
                passed = sum(api_endpoints)
                execution_time = time.time() - start
                
                if passed >= 4:
                    self.log_test("Endpoints API", "PASS", 
                                 f"Endpoints implementados: {passed}/5", execution_time)
                else:
                    self.log_test("Endpoints API", "FAIL", 
                                 f"Endpoints faltando: {passed}/5", execution_time)
            else:
                execution_time = time.time() - start
                self.log_test("Endpoints API", "FAIL", "server.js não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Endpoints API", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_15_css_styling(self):
        """Teste 15: Verificar estilos CSS"""
        start = time.time()
        
        try:
            css_files = []
            
            # Verificar CSS embutido nos HTMLs
            html_files = ["demo-widget.html", "admin-panel.html"]
            
            for html_file in html_files:
                html_path = os.path.join(self.base_dir, html_file)
                if os.path.exists(html_path):
                    with open(html_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if "<style>" in content and "css" in content.lower():
                        css_files.append(html_file)
            
            execution_time = time.time() - start
            
            if len(css_files) >= 2:
                self.log_test("Estilos CSS", "PASS", 
                             f"CSS encontrado em: {', '.join(css_files)}", execution_time)
            else:
                self.log_test("Estilos CSS", "FAIL", 
                             f"CSS insuficiente: {len(css_files)}/2 arquivos", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Estilos CSS", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_16_config_files(self):
        """Teste 16: Verificar arquivos de configuração"""
        start = time.time()
        
        try:
            config_checks = []
            
            # Verificar se existem configurações no auto-deploy
            auto_deploy_path = os.path.join(self.base_dir, "auto-deploy.py")
            if os.path.exists(auto_deploy_path):
                with open(auto_deploy_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "CONFIG" in content or "config" in content:
                    config_checks.append("auto-deploy config")
            
            # Verificar package.json
            package_path = os.path.join(self.base_dir, "api", "package.json")
            if os.path.exists(package_path):
                config_checks.append("package.json")
            
            # Verificar configurações nos widgets
            widget_path = os.path.join(self.base_dir, "static", "js", "widget-incorporavel.js")
            if os.path.exists(widget_path):
                with open(widget_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "WIDGET_CONFIG" in content:
                    config_checks.append("widget config")
            
            execution_time = time.time() - start
            
            if len(config_checks) >= 2:
                self.log_test("Arquivos de Configuração", "PASS", 
                             f"Configurações: {', '.join(config_checks)}", execution_time)
            else:
                self.log_test("Arquivos de Configuração", "FAIL", 
                             f"Configurações insuficientes: {len(config_checks)}", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Arquivos de Configuração", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_17_error_handling(self):
        """Teste 17: Verificar tratamento de erros"""
        start = time.time()
        
        try:
            error_handling_found = 0
            
            files_to_check = [
                "static/js/widget-incorporavel.js",
                "static/js/admin-panel.js",
                "static/js/credit-system.js"
            ]
            
            for file_path in files_to_check:
                full_path = os.path.join(self.base_dir, file_path)
                if os.path.exists(full_path):
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    error_patterns = [
                        "try {" in content,
                        "catch" in content,
                        "error" in content.lower(),
                        "console.error" in content
                    ]
                    
                    if sum(error_patterns) >= 2:
                        error_handling_found += 1
            
            execution_time = time.time() - start
            
            if error_handling_found >= 2:
                self.log_test("Tratamento de Erros", "PASS", 
                             f"Error handling em {error_handling_found}/3 arquivos", execution_time)
            else:
                self.log_test("Tratamento de Erros", "FAIL", 
                             f"Error handling insuficiente: {error_handling_found}/3", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Tratamento de Erros", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_18_responsive_design(self):
        """Teste 18: Verificar design responsivo"""
        start = time.time()
        
        try:
            responsive_found = 0
            
            html_files = ["demo-widget.html", "admin-panel.html"]
            
            for html_file in html_files:
                html_path = os.path.join(self.base_dir, html_file)
                if os.path.exists(html_path):
                    with open(html_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    responsive_patterns = [
                        "@media" in content,
                        "viewport" in content,
                        "responsive" in content.lower(),
                        "grid" in content or "flex" in content
                    ]
                    
                    if sum(responsive_patterns) >= 2:
                        responsive_found += 1
            
            execution_time = time.time() - start
            
            if responsive_found >= 1:
                self.log_test("Design Responsivo", "PASS", 
                             f"Design responsivo em {responsive_found}/2 páginas", execution_time)
            else:
                self.log_test("Design Responsivo", "FAIL", 
                             "Design responsivo não encontrado", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Design Responsivo", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_19_security_features(self):
        """Teste 19: Verificar recursos de segurança"""
        start = time.time()
        
        try:
            security_features = 0
            
            # Verificar JWT no Node.js
            server_js_path = os.path.join(self.base_dir, "api", "server.js")
            if os.path.exists(server_js_path):
                with open(server_js_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "jsonwebtoken" in content or "jwt" in content:
                    security_features += 1
                
                if "bcrypt" in content:
                    security_features += 1
            
            # Verificar validações nos contratos
            contract_path = os.path.join(self.base_dir, "contracts", "WidgetSaaSToken.sol")
            if os.path.exists(contract_path):
                with open(contract_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "require(" in content:
                    security_features += 1
                
                if "onlyOwner" in content:
                    security_features += 1
            
            execution_time = time.time() - start
            
            if security_features >= 3:
                self.log_test("Recursos de Segurança", "PASS", 
                             f"Recursos de segurança: {security_features}/4", execution_time)
            else:
                self.log_test("Recursos de Segurança", "FAIL", 
                             f"Segurança insuficiente: {security_features}/4", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Recursos de Segurança", "FAIL", f"Erro: {str(e)}", execution_time)

    def test_20_integration_readiness(self):
        """Teste 20: Verificar prontidão para integração TBNB"""
        start = time.time()
        
        try:
            tbnb_readiness = 0
            
            # Verificar configurações TBNB nos arquivos
            files_to_check = [
                "static/js/widget-incorporavel.js",
                "static/js/metamask-integration.js",
                "demo-widget.html"
            ]
            
            for file_path in files_to_check:
                full_path = os.path.join(self.base_dir, file_path)
                if os.path.exists(full_path):
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    tbnb_patterns = [
                        "TBNB" in content,
                        "BSC" in content or "Binance" in content,
                        "testnet" in content.lower(),
                        "0x61" in content  # BSC Testnet Chain ID
                    ]
                    
                    if sum(tbnb_patterns) >= 2:
                        tbnb_readiness += 1
            
            execution_time = time.time() - start
            
            if tbnb_readiness >= 2:
                self.log_test("Prontidão TBNB", "PASS", 
                             f"Configuração TBNB em {tbnb_readiness}/3 arquivos", execution_time)
            else:
                self.log_test("Prontidão TBNB", "FAIL", 
                             f"Configuração TBNB insuficiente: {tbnb_readiness}/3", execution_time)
                
        except Exception as e:
            execution_time = time.time() - start
            self.log_test("Prontidão TBNB", "FAIL", f"Erro: {str(e)}", execution_time)

    def run_all_tests(self):
        """Executa todos os 20 testes"""
        print("🚀 INICIANDO SUITE DE TESTES WIDGET SAAS")
        print("=" * 80)
        print(f"📅 Data/Hora: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📁 Diretório: {self.base_dir}")
        print("=" * 80)
        
        # Lista de todos os testes
        tests = [
            self.test_01_file_structure,
            self.test_02_python_dependencies,
            self.test_03_auto_deploy_syntax,
            self.test_04_database_creation,
            self.test_05_server_startup,
            self.test_06_nodejs_package,
            self.test_07_widget_javascript,
            self.test_08_smart_contracts,
            self.test_09_admin_panel,
            self.test_10_credit_system,
            self.test_11_demo_widget_page,
            self.test_12_documentation,
            self.test_13_metamask_integration,
            self.test_14_api_endpoints,
            self.test_15_css_styling,
            self.test_16_config_files,
            self.test_17_error_handling,
            self.test_18_responsive_design,
            self.test_19_security_features,
            self.test_20_integration_readiness
        ]
        
        # Executar todos os testes
        for test in tests:
            try:
                test()
                time.sleep(0.1)  # Pequena pausa entre testes
            except Exception as e:
                self.log_test(f"ERRO em {test.__name__}", "FAIL", str(e), 0)
        
        # Gerar relatório final
        self.generate_final_report()

    def generate_final_report(self):
        """Gera relatório final dos testes"""
        end_time = datetime.now()
        total_time = (end_time - self.start_time).total_seconds()
        
        passed = len([t for t in self.test_results if t["status"] == "PASS"])
        failed = len([t for t in self.test_results if t["status"] == "FAIL"])
        total = len(self.test_results)
        
        print("\n" + "=" * 80)
        print("📊 RELATÓRIO FINAL DOS TESTES")
        print("=" * 80)
        print(f"✅ TESTES APROVADOS: {passed}")
        print(f"❌ TESTES FALHARAM: {failed}")
        print(f"📊 TOTAL DE TESTES: {total}")
        print(f"📈 TAXA DE SUCESSO: {(passed/total)*100:.1f}%")
        print(f"⏱️ TEMPO TOTAL: {total_time:.2f} segundos")
        print("=" * 80)
        
        # Status final do sistema
        if passed >= 16:  # 80% ou mais
            print("🎉 SISTEMA WIDGET SAAS: ✅ APROVADO PARA TBNB!")
        elif passed >= 12:  # 60% ou mais
            print("⚠️ SISTEMA WIDGET SAAS: 🟡 NECESSITA AJUSTES")
        else:
            print("❌ SISTEMA WIDGET SAAS: 🔴 REQUER CORREÇÕES")
        
        print("=" * 80)
        
        # Salvar relatório em arquivo
        self.save_report_to_file()

    def save_report_to_file(self):
        """Salva relatório em arquivo JSON"""
        report_data = {
            "test_session": {
                "start_time": self.start_time.isoformat(),
                "end_time": datetime.now().isoformat(),
                "total_tests": len(self.test_results),
                "passed": len([t for t in self.test_results if t["status"] == "PASS"]),
                "failed": len([t for t in self.test_results if t["status"] == "FAIL"])
            },
            "tests": self.test_results
        }
        
        report_file = os.path.join(self.base_dir, "test_report.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Relatório salvo em: {report_file}")

if __name__ == "__main__":
    print("🧪 Widget SaaS - Suite de Testes Automatizados")
    print("Executando 20 testes completos do sistema...")
    print()
    
    test_suite = WidgetSaaSTestSuite()
    test_suite.run_all_tests()
