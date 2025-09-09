#!/usr/bin/env python3
"""
Teste de API Endpoints - XCafe Widget Server
Script para testar os endpoints API do servidor
"""

import requests
import json
import time
import sys
from urllib.parse import urljoin

def test_api_endpoint(base_url, endpoint, description):
    """Testa um endpoint específico"""
    url = urljoin(base_url, endpoint)
    print(f"\n🧪 Testando: {description}")
    print(f"🔗 URL: {url}")
    
    try:
        response = requests.get(url, timeout=5)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Resposta JSON válida:")
                print(json.dumps(data, indent=2, ensure_ascii=False))
                return True
            except json.JSONDecodeError:
                print(f"❌ Resposta não é JSON válido: {response.text[:200]}")
                return False
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            print(f"📝 Resposta: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Erro de conexão: Servidor não está executando em {url}")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Timeout: Servidor demorou muito para responder")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def main():
    print("🚀 XCafe Widget Server - Teste de API Endpoints")
    print("=" * 60)
    
    base_url = "http://localhost:8080/"
    
    # Lista de endpoints para testar
    endpoints = [
        ("api/health", "Health Check - Status do servidor"),
        ("api/stats", "Estatísticas do servidor"),
        ("api/version", "Informações de versão"),
        ("", "Página principal (index.html)"),
        ("index.html", "Página principal direta")
    ]
    
    results = []
    
    for endpoint, description in endpoints:
        success = test_api_endpoint(base_url, endpoint, description)
        results.append((endpoint, success))
        time.sleep(0.5)  # Pequena pausa entre testes
    
    # Resumo dos resultados
    print("\n" + "=" * 60)
    print("📋 RESUMO DOS TESTES:")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for endpoint, success in results:
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"  {endpoint:20} | {status}")
        if success:
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 RESULTADO FINAL: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 Todos os testes foram bem-sucedidos!")
        return 0
    else:
        print(f"⚠️  {total - passed} teste(s) falharam")
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n🛑 Teste interrompido pelo usuário")
        sys.exit(1)
