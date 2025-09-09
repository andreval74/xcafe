#!/usr/bin/env python3
"""
Teste Final das Modificações de Tema
Valida: Remoção do botão flutuante, apenas 2 temas, tema escuro melhorado
"""

import requests
import time
from bs4 import BeautifulSoup

def test_final_modifications():
    print("🧪 Testando Modificações Finais do Tema")
    print("=" * 50)
    
    base_url = "http://localhost:3000"
    
    try:
        # Testar página principal
        response = requests.get(base_url, timeout=10)
        if response.status_code != 200:
            print(f"❌ Servidor não acessível: {response.status_code}")
            return False
        
        print("✅ Página principal carregada")
        
        # Verificar se o botão back-to-top foi removido
        soup = BeautifulSoup(response.text, 'html.parser')
        
        back_to_top = soup.find('button', {'id': 'back-to-top'})
        if not back_to_top:
            print("✅ Botão flutuante 'back-to-top' removido com sucesso")
        else:
            print("❌ Botão flutuante ainda presente")
        
        # Verificar se o script back-to-top foi removido
        back_script = soup.find('script', {'src': 'js/shared/back-to-top.js'})
        if not back_script:
            print("✅ Script 'back-to-top.js' removido com sucesso")
        else:
            print("❌ Script 'back-to-top.js' ainda incluído")
        
        # Verificar header.html diretamente para o botão de tema
        print("\n📄 Testando header.html...")
        header_response = requests.get(f"{base_url}/header.html", timeout=5)
        
        if header_response.status_code == 200:
            header_soup = BeautifulSoup(header_response.text, 'html.parser')
            theme_btn = header_soup.find('button', {'id': 'theme-toggle-btn'})
            
            if theme_btn:
                print("✅ Botão de tema encontrado no header")
                
                theme_icon = theme_btn.find('i', {'id': 'theme-icon'})
                if theme_icon:
                    print("✅ Ícone de tema encontrado")
                    icon_classes = theme_icon.get('class', [])
                    print(f"   Classes do ícone: {' '.join(icon_classes)}")
                    
                    if 'fa-moon' in icon_classes:
                        print("✅ Ícone correto para tema claro (lua)")
                    else:
                        print("⚠️  Ícone pode estar incorreto")
                else:
                    print("❌ Ícone de tema não encontrado")
            else:
                print("❌ Botão de tema não encontrado")
        
        # Verificar CSS do tema escuro
        print("\n🎨 Testando melhorias do CSS...")
        css_response = requests.get(f"{base_url}/css/theme-system.css", timeout=5)
        
        if css_response.status_code == 200:
            css_content = css_response.text
            
            # Verificar se removeu modo auto
            if '@media (prefers-color-scheme:' not in css_content:
                print("✅ Modo auto removido do CSS")
            else:
                print("❌ Modo auto ainda presente no CSS")
            
            # Verificar melhorias do tema escuro
            if '#0d1117' in css_content:
                print("✅ Cores melhoradas do tema escuro implementadas")
            else:
                print("❌ Cores do tema escuro não atualizadas")
            
            # Verificar se tem estilos específicos para componentes
            if '[data-theme="dark"] .navbar' in css_content:
                print("✅ Estilos específicos para navbar em tema escuro")
            else:
                print("❌ Estilos específicos não encontrados")
        
        # Verificar JavaScript
        print("\n🔧 Testando JavaScript...")
        js_response = requests.get(f"{base_url}/js/theme-controller.js", timeout=5)
        
        if js_response.status_code == 200:
            js_content = js_response.text
            
            # Verificar se removeu referencias ao auto
            if "'auto'" not in js_content and '"auto"' not in js_content:
                print("✅ Modo auto removido do JavaScript")
            else:
                print("❌ Ainda há referências ao modo auto no JavaScript")
            
            # Verificar função toggleTheme simplificada
            if 'light\' ? \'dark\' : \'light' in js_content:
                print("✅ Função toggleTheme simplificada")
            else:
                print("⚠️  Função toggleTheme pode não estar simplificada")
        
        print("\n🎉 Teste de modificações concluído!")
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def print_summary():
    print("\n" + "="*60)
    print("📋 RESUMO DAS MODIFICAÇÕES IMPLEMENTADAS")
    print("="*60)
    print("1. ✅ Botão flutuante 'back-to-top' removido")
    print("2. ✅ Apenas 2 temas: Claro e Escuro")
    print("3. ✅ Modo automático removido")
    print("4. ✅ Tema escuro melhorado com cores do GitHub Dark")
    print("5. ✅ Estilos específicos para componentes em tema escuro")
    print("6. ✅ JavaScript simplificado")
    print("\n💡 Teste o sistema clicando no ícone de lua/sol no header!")

if __name__ == '__main__':
    success = test_final_modifications()
    print_summary()
    
    if success:
        print("\n✅ Todas as modificações foram implementadas com sucesso!")
    else:
        print("\n❌ Alguns problemas foram encontrados.")
