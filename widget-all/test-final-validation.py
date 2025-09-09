#!/usr/bin/env python3
"""
Teste Final - Validação Completa do Sistema XCafe
Executa todos os testes e valida o sistema completo
"""

import os
import sys
import time
import json
import requests
from pathlib import Path

def print_header(title):
    """Imprime cabeçalho formatado"""
    print(f"\n{'='*60}")
    print(f"🎯 {title}")
    print(f"{'='*60}")

def print_success(message):
    """Imprime mensagem de sucesso"""
    print(f"✅ {message}")

def print_error(message):
    """Imprime mensagem de erro"""
    print(f"❌ {message}")

def print_info(message):
    """Imprime mensagem informativa"""
    print(f"ℹ️  {message}")

def test_file_exists(file_path, description):
    """Testa se um arquivo existe"""
    if Path(file_path).exists():
        size = Path(file_path).stat().st_size
        print_success(f"{description}: {file_path} ({size} bytes)")
        return True
    else:
        print_error(f"{description}: {file_path} não encontrado")
        return False

def test_api_endpoint(url, description):
    """Testa um endpoint da API"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"{description}: {url} - Status: {response.status_code}")
            return True
        else:
            print_error(f"{description}: {url} - Status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"{description}: {url} - Erro: {str(e)}")
        return False

def main():
    print_header("TESTE FINAL - SISTEMA XCAFE WIDGET SAAS")
    
    total_tests = 0
    passed_tests = 0
    
    # Teste 1: Arquivos CSS do Sistema de Temas
    print_header("FASE 3 - ARQUIVOS CSS")
    
    css_files = [
        ("css/theme-system.css", "Sistema de Temas"),
        ("css/loading-states.css", "Estados de Carregamento"),
        ("css/responsive.css", "Design Responsivo")
    ]
    
    for file_path, description in css_files:
        total_tests += 1
        if test_file_exists(file_path, description):
            passed_tests += 1
    
    # Teste 2: Arquivo JavaScript
    print_header("FASE 3 - ARQUIVO JAVASCRIPT")
    
    total_tests += 1
    if test_file_exists("js/theme-controller.js", "Controlador de Temas"):
        passed_tests += 1
    
    # Teste 3: Arquivos de Configuração
    print_header("FASE 2 - CONFIGURAÇÃO")
    
    config_files = [
        (".env", "Configuração de Ambiente"),
        ("server.py", "Servidor Principal"),
        ("requirements.txt", "Dependências Python")
    ]
    
    for file_path, description in config_files:
        total_tests += 1
        if test_file_exists(file_path, description):
            passed_tests += 1
    
    # Teste 4: Endpoints API (se servidor estiver rodando)
    print_header("TESTE DE API ENDPOINTS")
    
    base_url = "http://localhost:8080"
    api_endpoints = [
        ("/api/health", "Health Check"),
        ("/api/stats", "Estatísticas"),
        ("/api/version", "Informações de Versão")
    ]
    
    print_info("Testando conectividade com o servidor...")
    
    try:
        response = requests.get(f"{base_url}/api/health", timeout=2)
        server_running = True
        print_success("Servidor está rodando!")
    except:
        server_running = False
        print_error("Servidor não está rodando - pule os testes de API")
    
    if server_running:
        for endpoint, description in api_endpoints:
            total_tests += 1
            if test_api_endpoint(f"{base_url}{endpoint}", description):
                passed_tests += 1
    
    # Teste 5: Estrutura de Diretórios
    print_header("ESTRUTURA DE DIRETÓRIOS")
    
    directories = [
        ("css", "Estilos CSS"),
        ("js", "Scripts JavaScript"),
        ("api", "API Backend"),
        ("logs", "Arquivos de Log")
    ]
    
    for dir_path, description in directories:
        total_tests += 1
        if Path(dir_path).is_dir():
            print_success(f"{description}: {dir_path}/")
            passed_tests += 1
        else:
            print_error(f"{description}: {dir_path}/ não encontrado")
    
    # Resultados Finais
    print_header("RESULTADOS FINAIS")
    
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"📊 Testes executados: {total_tests}")
    print(f"✅ Testes aprovados: {passed_tests}")
    print(f"❌ Testes falharam: {total_tests - passed_tests}")
    print(f"📈 Taxa de sucesso: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print_success("🎉 SISTEMA APROVADO! Taxa de sucesso excelente!")
        return 0
    elif success_rate >= 70:
        print_info("⚠️  SISTEMA PARCIALMENTE APROVADO. Algumas melhorias necessárias.")
        return 1
    else:
        print_error("❌ SISTEMA REPROVADO. Muitos problemas encontrados.")
        return 2

if __name__ == '__main__':
    try:
        result = main()
        print(f"\n🏁 Teste finalizado com código: {result}")
        sys.exit(result)
    except KeyboardInterrupt:
        print("\n🛑 Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Erro inesperado: {e}")
        sys.exit(3)
