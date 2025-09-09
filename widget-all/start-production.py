#!/usr/bin/env python3
"""
================================================================================
XCAFE WIDGET SAAS - PRODUCTION STARTUP SCRIPT
================================================================================
Script para inicializar o sistema em produção com todas as verificações
================================================================================
"""

import os
import sys
import subprocess
import time
from pathlib import Path

class ProductionStarter:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.venv_path = self.project_root.parent / '.venv'
        
    def print_banner(self):
        print("=" * 80)
        print("🚀 XCAFE WIDGET SAAS - PRODUCTION STARTUP")
        print("=" * 80)
        print(f"📁 Project Root: {self.project_root}")
        print(f"🐍 Virtual Env: {self.venv_path}")
        print(f"⏰ Started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print()
    
    def check_environment(self):
        """Verificar environment e dependências"""
        print("🔍 CHECKING ENVIRONMENT...")
        
        # Verificar .env
        env_file = self.project_root / '.env'
        if env_file.exists():
            print("✅ .env file found")
        else:
            print("⚠️ .env file not found - creating from template")
            self.create_env_file()
        
        # Verificar virtual environment
        if self.venv_path.exists():
            print("✅ Virtual environment found")
        else:
            print("❌ Virtual environment not found")
            return False
        
        # Verificar requirements
        req_file = self.project_root / 'requirements.txt'
        if req_file.exists():
            print("✅ requirements.txt found")
        else:
            print("❌ requirements.txt not found")
            return False
        
        return True
    
    def create_directories(self):
        """Criar diretórios necessários"""
        print("\n📁 CREATING DIRECTORIES...")
        
        directories = [
            'data',
            'data/backups',
            'logs',
            'data/users',
            'data/widgets',
            'data/sessions'
        ]
        
        for dir_name in directories:
            dir_path = self.project_root / dir_name
            if not dir_path.exists():
                dir_path.mkdir(parents=True, exist_ok=True)
                print(f"✅ Created: {dir_name}")
            else:
                print(f"📁 Exists: {dir_name}")
    
    def install_dependencies(self):
        """Instalar dependências"""
        print("\n📦 INSTALLING DEPENDENCIES...")
        
        python_exe = self.venv_path / 'Scripts' / 'python.exe'
        if not python_exe.exists():
            python_exe = self.venv_path / 'bin' / 'python'  # Linux/Mac
        
        if not python_exe.exists():
            print("❌ Python executable not found in virtual environment")
            return False
        
        try:
            result = subprocess.run([
                str(python_exe), '-m', 'pip', 'install', '-r', 'requirements.txt'
            ], cwd=self.project_root, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Dependencies installed successfully")
                return True
            else:
                print(f"❌ Error installing dependencies: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Exception installing dependencies: {e}")
            return False
    
    def check_server_file(self):
        """Verificar se server.py existe e é válido"""
        print("\n🔍 CHECKING SERVER FILE...")
        
        server_file = self.project_root / 'server.py'
        if not server_file.exists():
            print("❌ server.py not found")
            return False
        
        # Verificar se o arquivo tem conteúdo válido
        try:
            with open(server_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'Flask' in content and 'app.run' in content:
                    print("✅ server.py appears to be valid")
                    return True
                else:
                    print("⚠️ server.py may not be a valid Flask application")
                    return False
        except Exception as e:
            print(f"❌ Error reading server.py: {e}")
            return False
    
    def start_server(self):
        """Iniciar o servidor"""
        print("\n🚀 STARTING SERVER...")
        
        python_exe = self.venv_path / 'Scripts' / 'python.exe'
        if not python_exe.exists():
            python_exe = self.venv_path / 'bin' / 'python'  # Linux/Mac
        
        try:
            # Executar servidor
            print("🔄 Launching Python server...")
            print(f"📍 Working directory: {self.project_root}")
            print(f"🐍 Python executable: {python_exe}")
            print(f"📄 Server file: server.py")
            print()
            print("🌐 Server should be available at:")
            print("   → http://localhost:3000")
            print("   → http://localhost:3000/auth.html")
            print("   → http://localhost:3000/dashboard.html")
            print("   → http://localhost:3000/admin-panel.html")
            print()
            print("🛑 Press Ctrl+C to stop the server")
            print("=" * 80)
            
            # Executar servidor (blocking)
            subprocess.run([
                str(python_exe), 'server.py'
            ], cwd=self.project_root)
            
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
        except Exception as e:
            print(f"\n❌ Error starting server: {e}")
            return False
        
        return True
    
    def run(self):
        """Executar startup completo"""
        self.print_banner()
        
        if not self.check_environment():
            print("❌ Environment check failed")
            return False
        
        self.create_directories()
        
        if not self.install_dependencies():
            print("❌ Dependencies installation failed")
            return False
        
        if not self.check_server_file():
            print("❌ Server file check failed")
            return False
        
        print("\n🎉 ALL CHECKS PASSED - STARTING SERVER...")
        time.sleep(2)
        
        return self.start_server()

if __name__ == "__main__":
    starter = ProductionStarter()
    success = starter.run()
    sys.exit(0 if success else 1)
