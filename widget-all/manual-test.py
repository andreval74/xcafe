#!/usr/bin/env python3
"""
================================================================================
XCAFE WIDGET SAAS - MANUAL TEST
================================================================================
Teste manual simplificado para verificar o sistema
================================================================================
"""

import os
import sys

def main():
    print("🧪 TESTE MANUAL DO SISTEMA XCAFE WIDGET SAAS")
    print("=" * 60)
    
    # Verificar diretório atual
    current_dir = os.getcwd()
    print(f"📁 Diretório atual: {current_dir}")
    
    # Verificar se estamos no widget-all
    if not current_dir.endswith('widget-all'):
        print("❌ ERRO: Execute este script do diretório widget-all")
        widget_all_path = os.path.join(current_dir, 'widget-all')
        if os.path.exists(widget_all_path):
            print(f"💡 Tente: cd {widget_all_path}")
        return False
    
    # Verificar se server.py existe
    server_path = os.path.join(current_dir, 'server.py')
    if os.path.exists(server_path):
        print("✅ server.py encontrado")
    else:
        print("❌ server.py não encontrado")
        return False
    
    # Listar arquivos Python
    python_files = [f for f in os.listdir('.') if f.endswith('.py')]
    print(f"🐍 Arquivos Python: {python_files}")
    
    # Verificar requirements.txt
    req_path = os.path.join(current_dir, 'requirements.txt')
    if os.path.exists(req_path):
        print("✅ requirements.txt encontrado")
        with open(req_path, 'r') as f:
            lines = f.readlines()
            print(f"📦 {len(lines)} dependências listadas")
    else:
        print("❌ requirements.txt não encontrado")
    
    # Verificar estrutura de diretórios
    expected_dirs = ['js', 'css', 'api', 'data']
    for dir_name in expected_dirs:
        if os.path.exists(dir_name):
            print(f"✅ Diretório {dir_name} encontrado")
        else:
            print(f"❌ Diretório {dir_name} não encontrado")
    
    print("\n🎯 PRÓXIMOS PASSOS:")
    print("1. Execute: python server.py")
    print("2. Acesse: http://localhost:3000")
    print("3. Teste: http://localhost:3000/api/health")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
