#!/usr/bin/env python3
"""
================================================================================
XCAFE WIDGET SAAS - SISTEMA FINAL DE TESTE
================================================================================
Executar teste completo do sistema independente de problemas de terminal
================================================================================
"""

import subprocess
import sys
import os
import time
import threading
import requests
from pathlib import Path

class FinalSystemTest:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.venv_python = self.project_root.parent / '.venv' / 'Scripts' / 'python.exe'
        self.server_process = None
        
    def print_banner(self):
        print("=" * 80)
        print("🎯 XCAFE WIDGET SAAS - TESTE FINAL DO SISTEMA")
        print("=" * 80)
        print(f"📁 Project: {self.project_root}")
        print(f"🐍 Python: {self.venv_python}")
        print(f"⏰ Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print()
    
    def check_files(self):
        """Verificar arquivos essenciais"""
        print("🔍 VERIFICANDO ARQUIVOS...")
        
        files_to_check = [
            'server.py',
            '.env',
            'requirements.txt',
            'auth.html',
            'dashboard.html',
            'admin-panel.html',
            'js/shared/auth.js',
            'js/shared/api.js',
            'js/shared/web3.js'
        ]
        
        all_good = True
        for file_path in files_to_check:
            full_path = self.project_root / file_path
            if full_path.exists():
                print(f"✅ {file_path}")
            else:
                print(f"❌ {file_path}")
                all_good = False
        
        return all_good
    
    def start_server_background(self):
        """Iniciar servidor em background"""
        print("\n🚀 INICIANDO SERVIDOR...")
        
        try:
            # Usar subprocess para iniciar servidor
            self.server_process = subprocess.Popen([
                str(self.venv_python), 'server.py'
            ], cwd=self.project_root, 
               stdout=subprocess.PIPE, 
               stderr=subprocess.STDOUT,
               universal_newlines=True)
            
            print("📡 Servidor iniciado em background")
            print("⏳ Aguardando 3 segundos para inicialização...")
            time.sleep(3)
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao iniciar servidor: {e}")
            return False
    
    def test_endpoints(self):
        """Testar endpoints principais"""
        print("\n🧪 TESTANDO ENDPOINTS...")
        
        base_url = "http://localhost:3000"
        endpoints = [
            ("/api/health", "Health Check"),
            ("/api/stats", "Statistics"),
            ("/", "Landing Page"),
            ("/auth.html", "Authentication"),
            ("/dashboard.html", "Dashboard"),
            ("/admin-panel.html", "Admin Panel")
        ]
        
        results = []
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ {name}: OK ({response.status_code})")
                    results.append(True)
                else:
                    print(f"⚠️ {name}: {response.status_code}")
                    results.append(False)
            except requests.exceptions.ConnectionError:
                print(f"❌ {name}: Conexão falhou")
                results.append(False)
            except Exception as e:
                print(f"❌ {name}: {str(e)}")
                results.append(False)
        
        return results
    
    def check_server_output(self):
        """Verificar output do servidor"""
        print("\n📋 OUTPUT DO SERVIDOR:")
        print("-" * 40)
        
        if self.server_process and self.server_process.poll() is None:
            try:
                # Ler algumas linhas do output
                for i in range(10):
                    line = self.server_process.stdout.readline()
                    if line:
                        print(f"🖥️  {line.strip()}")
                    else:
                        break
            except:
                print("⚠️ Não foi possível ler output do servidor")
        else:
            print("❌ Servidor não está rodando")
    
    def stop_server(self):
        """Parar servidor"""
        print("\n🛑 PARANDO SERVIDOR...")
        
        if self.server_process:
            self.server_process.terminate()
            try:
                self.server_process.wait(timeout=5)
                print("✅ Servidor parado com sucesso")
            except subprocess.TimeoutExpired:
                self.server_process.kill()
                print("⚠️ Servidor forçado a parar")
        else:
            print("⚠️ Nenhum processo de servidor encontrado")
    
    def generate_report(self, files_ok, endpoints_results):
        """Gerar relatório final"""
        print("\n" + "=" * 80)
        print("📊 RELATÓRIO FINAL DO SISTEMA")
        print("=" * 80)
        
        # Arquivos
        print(f"📁 Arquivos Essenciais: {'✅ OK' if files_ok else '❌ PROBLEMAS'}")
        
        # Endpoints
        endpoints_ok = sum(endpoints_results)
        total_endpoints = len(endpoints_results)
        success_rate = (endpoints_ok / total_endpoints * 100) if total_endpoints > 0 else 0
        
        print(f"🌐 Endpoints: {endpoints_ok}/{total_endpoints} OK ({success_rate:.1f}%)")
        
        # Status geral
        if files_ok and success_rate >= 80:
            print("\n🎉 SISTEMA FUNCIONANDO CORRETAMENTE!")
            print("✅ Pronto para uso em produção")
            status = "SUCCESS"
        elif success_rate >= 60:
            print("\n⚠️ SISTEMA PARCIALMENTE FUNCIONAL")
            print("🔧 Algumas correções recomendadas")
            status = "PARTIAL"
        else:
            print("\n🚨 SISTEMA COM PROBLEMAS")
            print("🛠️ Correções necessárias")
            status = "FAILED"
        
        # Salvar relatório
        self.save_report(status, files_ok, endpoints_results, success_rate)
        
        return status == "SUCCESS"
    
    def save_report(self, status, files_ok, endpoints_results, success_rate):
        """Salvar relatório em arquivo"""
        try:
            report_path = self.project_root / 'system-test-report.txt'
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write("XCAFE WIDGET SAAS - RELATÓRIO DE TESTE\n")
                f.write("=" * 50 + "\n")
                f.write(f"Data: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Status: {status}\n")
                f.write(f"Arquivos: {'OK' if files_ok else 'PROBLEMAS'}\n")
                f.write(f"Endpoints: {success_rate:.1f}% funcionando\n")
                f.write(f"Endpoints individuais: {endpoints_results}\n")
            
            print(f"📄 Relatório salvo em: {report_path}")
        except Exception as e:
            print(f"⚠️ Erro ao salvar relatório: {e}")
    
    def run(self):
        """Executar teste completo"""
        self.print_banner()
        
        # Verificar arquivos
        files_ok = self.check_files()
        if not files_ok:
            print("\n❌ Arquivos essenciais ausentes - abortando teste")
            return False
        
        # Iniciar servidor
        if not self.start_server_background():
            print("\n❌ Falha ao iniciar servidor - abortando teste")
            return False
        
        try:
            # Testar endpoints
            endpoints_results = self.test_endpoints()
            
            # Verificar output do servidor
            self.check_server_output()
            
            # Gerar relatório
            success = self.generate_report(files_ok, endpoints_results)
            
            return success
            
        finally:
            # Sempre parar o servidor
            self.stop_server()

if __name__ == "__main__":
    try:
        tester = FinalSystemTest()
        success = tester.run()
        
        print(f"\n🏁 TESTE FINALIZADO: {'SUCESSO' if success else 'FALHA'}")
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⏹️ Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Erro fatal: {e}")
        sys.exit(1)
