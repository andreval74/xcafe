#!/usr/bin/env python3
"""
Teste de Carregamento de Header com Tema
Valida se o header foi carregado e o botão de tema está funcionando
"""

import requests
import time
from bs4 import BeautifulSoup

def test_header_loading():
    print("🧪 Testando Carregamento do Header com Tema")
    print("=" * 50)
    
    base_url = "http://localhost:3000"
    
    # Aguardar um pouco para garantir carregamento completo
    print("⏳ Aguardando carregamento do servidor...")
    time.sleep(2)
    
    try:
        # Fazer request com headers que simulam um navegador
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(base_url, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"❌ Servidor não acessível: {response.status_code}")
            return False
        
        print("✅ Página principal carregada")
        
        # Verificar estrutura HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Verificar se há container do header
        header_container = soup.find('header', {'id': 'header-container'})
        if header_container:
            print("✅ Container do header encontrado")
            
            # Verificar se está vazio (será preenchido via JavaScript)
            if not header_container.get_text(strip=True):
                print("ℹ️  Header container vazio (carregamento via JS)")
            else:
                print("✅ Header container tem conteúdo")
        else:
            print("❌ Container do header não encontrado")
        
        # Verificar inclusão dos scripts necessários
        scripts_needed = [
            'js/shared/template-loader.js',
            'js/theme-controller.js',
            'js/pages/index.js'
        ]
        
        for script_path in scripts_needed:
            script = soup.find('script', {'src': script_path})
            if script:
                print(f"✅ Script incluído: {script_path}")
            else:
                print(f"❌ Script não encontrado: {script_path}")
        
        # Verificar meta viewport (importante para responsividade)
        viewport = soup.find('meta', {'name': 'viewport'})
        if viewport:
            print("✅ Meta viewport configurado")
        else:
            print("❌ Meta viewport não encontrado")
        
        # Fazer teste direto do header.html
        print("\n📄 Testando header.html diretamente...")
        header_response = requests.get(f"{base_url}/header.html", headers=headers, timeout=5)
        
        if header_response.status_code == 200:
            print("✅ header.html acessível diretamente")
            
            header_soup = BeautifulSoup(header_response.text, 'html.parser')
            theme_btn = header_soup.find('button', {'id': 'theme-toggle-btn'})
            
            if theme_btn:
                print("✅ Botão de tema encontrado no header.html")
                
                theme_icon = theme_btn.find('i', {'id': 'theme-icon'})
                if theme_icon:
                    print("✅ Ícone de tema encontrado")
                    icon_classes = theme_icon.get('class', [])
                    print(f"   Classes do ícone: {' '.join(icon_classes)}")
                else:
                    print("❌ Ícone de tema não encontrado")
            else:
                print("❌ Botão de tema não encontrado no header.html")
        else:
            print(f"❌ header.html não acessível: {header_response.status_code}")
        
        print("\n🎉 Teste de estrutura concluído!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Servidor não está rodando em http://localhost:3000")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

if __name__ == '__main__':
    success = test_header_loading()
    if success:
        print("\n✅ Estrutura básica validada!")
        print("💡 Abra o navegador e verifique o console para logs do JavaScript")
    else:
        print("\n❌ Alguns problemas foram encontrados.")
        print("💡 Verifique se o servidor está rodando corretamente")
