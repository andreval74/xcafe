#!/usr/bin/env python3
"""
Script simplificado para iniciar o Widget SaaS em produção
Uso: python3 start.py
"""

import subprocess
import sys
import os

def check_python():
    """Verifica se Python está disponível"""
    try:
        version = sys.version_info
        if version.major >= 3 and version.minor >= 7:
            print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
            return True
        else:
            print(f"❌ Python {version.major}.{version.minor} muito antigo. Precisa 3.7+")
            return False
    except Exception as e:
        print(f"❌ Erro verificando Python: {e}")
        return False

def check_directories():
    """Verifica se os diretórios necessários existem"""
    required_dirs = ["data", "pages", "src"]
    missing = []
    
    for dir_name in required_dirs:
        if not os.path.exists(dir_name):
            missing.append(dir_name)
    
    if missing:
        print(f"❌ Diretórios não encontrados: {', '.join(missing)}")
        print("💡 Execute este script no diretório widget-all")
        return False
    
    print("✅ Todos os diretórios encontrados")
    return True

def main():
    """Função principal"""
    print("🚀 Widget SaaS - Iniciador de Produção")
    print("=" * 40)
    
    # Verificações
    if not check_python():
        sys.exit(1)
    
    if not check_directories():
        sys.exit(1)
    
    # Iniciar servidor
    print("🌐 Iniciando servidor em modo produção...")
    print("📡 Servidor aceitará conexões externas")
    print("🛑 Pressione Ctrl+C para parar")
    print("")
    
    try:
        subprocess.run([sys.executable, "server.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro executando servidor: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ Arquivo server.py não encontrado")
        sys.exit(1)

if __name__ == "__main__":
    main()
