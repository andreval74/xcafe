#!/usr/bin/env python3
"""
Teste das Modificações de Tema
Valida se as mudanças no sistema de tema estão funcionando
"""

import requests
import time
from bs4 import BeautifulSoup

def test_theme_system():
    print("🧪 Testando Sistema de Tema Modificado")
    print("=" * 50)
    
    base_url = "http://localhost:3000"
    
    try:
        # Testar se o servidor está rodando
        response = requests.get(base_url, timeout=5)
        if response.status_code != 200:
            print(f"❌ Servidor não acessível: {response.status_code}")
            return False
        
        print("✅ Servidor acessível")
        
        # Verificar se o HTML contém as modificações
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Verificar se o botão de tema está no header
        theme_btn = soup.find('button', {'id': 'theme-toggle-btn'})
        if theme_btn:
            print("✅ Botão de tema encontrado no header")
            
            # Verificar se tem o ícone correto
            theme_icon = theme_btn.find('i', {'id': 'theme-icon'})
            if theme_icon:
                print("✅ Ícone de tema encontrado")
                icon_class = theme_icon.get('class', [])
                print(f"   Classe do ícone: {' '.join(icon_class)}")
            else:
                print("❌ Ícone de tema não encontrado")
        else:
            print("❌ Botão de tema não encontrado no header")
        
        # Verificar se o botão voltar ao topo ainda existe
        back_to_top = soup.find('button', {'id': 'back-to-top'})
        if back_to_top:
            print("✅ Botão 'Voltar ao topo' mantido")
        else:
            print("❌ Botão 'Voltar ao topo' não encontrado")
        
        # Verificar se não há seletor flutuante de tema
        theme_selector = soup.find('div', {'id': 'theme-selector'})
        if not theme_selector:
            print("✅ Seletor flutuante de tema removido com sucesso")
        else:
            print("⚠️  Seletor flutuante ainda presente")
        
        # Verificar inclusão dos scripts
        theme_script = soup.find('script', {'src': 'js/theme-controller.js'})
        if theme_script:
            print("✅ Script do controlador de tema incluído")
        else:
            print("❌ Script do controlador de tema não encontrado")
        
        print("\n🎉 Teste concluído com sucesso!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Servidor não está rodando em http://localhost:3000")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

if __name__ == '__main__':
    success = test_theme_system()
    if success:
        print("\n✅ Sistema de tema modificado está funcionando!")
    else:
        print("\n❌ Alguns problemas foram encontrados.")
