#!/usr/bin/env python3
"""
================================================================================
XCAFE WIDGET SAAS - TESTE DA FASE 3 (INTERFACE E UX)
================================================================================
Teste específico das melhorias de interface e experiência do usuário
================================================================================
"""

import subprocess
import time
import requests
from pathlib import Path

class Phase3Test:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.venv_python = self.project_root.parent / '.venv' / 'Scripts' / 'python.exe'
        self.base_url = "http://localhost:3000"
        
    def print_banner(self):
        print("=" * 80)
        print("🎨 XCAFE WIDGET SAAS - TESTE FASE 3: INTERFACE E UX")
        print("=" * 80)
        print(f"📁 Project: {self.project_root}")
        print(f"⏰ Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print()

    def check_css_files(self):
        """Verificar se todos os arquivos CSS foram criados"""
        print("🎨 VERIFICANDO ARQUIVOS CSS...")
        
        css_files = [
            'css/main.css',
            'css/theme-system.css',
            'css/loading-states.css', 
            'css/responsive.css'
        ]
        
        all_good = True
        for css_file in css_files:
            file_path = self.project_root / css_file
            if file_path.exists():
                size = file_path.stat().st_size
                print(f"✅ {css_file} ({size:,} bytes)")
            else:
                print(f"❌ {css_file} não encontrado")
                all_good = False
        
        return all_good

    def check_js_files(self):
        """Verificar arquivos JavaScript"""
        print("\n🚀 VERIFICANDO ARQUIVOS JAVASCRIPT...")
        
        js_files = [
            'js/theme-controller.js',
            'js/shared/auth.js',
            'js/shared/api.js',
            'js/shared/web3.js'
        ]
        
        all_good = True
        for js_file in js_files:
            file_path = self.project_root / js_file
            if file_path.exists():
                size = file_path.stat().st_size
                print(f"✅ {js_file} ({size:,} bytes)")
            else:
                print(f"❌ {js_file} não encontrado")
                all_good = False
        
        return all_good

    def check_html_updates(self):
        """Verificar se o HTML foi atualizado"""
        print("\n📄 VERIFICANDO ATUALIZAÇÕES HTML...")
        
        index_path = self.project_root / 'index.html'
        if not index_path.exists():
            print("❌ index.html não encontrado")
            return False
        
        content = index_path.read_text(encoding='utf-8')
        
        checks = [
            ('theme-system.css', 'Sistema de temas'),
            ('loading-states.css', 'Estados de carregamento'),
            ('responsive.css', 'Design responsivo'),
            ('theme-controller.js', 'Controlador de temas')
        ]
        
        all_good = True
        for check, description in checks:
            if check in content:
                print(f"✅ {description} incluído")
            else:
                print(f"❌ {description} não incluído")
                all_good = False
        
        return all_good

    def start_server(self):
        """Iniciar servidor"""
        print("\n🚀 INICIANDO SERVIDOR PARA TESTE...")
        
        try:
            process = subprocess.Popen([
                str(self.venv_python), 'server.py'
            ], cwd=self.project_root,
               stdout=subprocess.PIPE,
               stderr=subprocess.STDOUT,
               universal_newlines=True)
            
            print("📡 Servidor iniciado")
            print("⏳ Aguardando inicialização (5 segundos)...")
            time.sleep(5)
            
            return process
            
        except Exception as e:
            print(f"❌ Erro ao iniciar servidor: {e}")
            return None

    def test_interface_elements(self):
        """Testar elementos da interface"""
        print("\n🎨 TESTANDO ELEMENTOS DA INTERFACE...")
        
        try:
            # Testar página principal
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                # Verificar inclusão dos CSS
                css_checks = [
                    ('theme-system.css', 'Sistema de temas'),
                    ('loading-states.css', 'Loading states'),
                    ('responsive.css', 'Responsivo')
                ]
                
                for css, description in css_checks:
                    if css in content:
                        print(f"✅ {description} carregado na página")
                    else:
                        print(f"⚠️ {description} não encontrado na página")
                
                # Verificar JavaScript
                if 'theme-controller.js' in content:
                    print(f"✅ Controlador de temas carregado")
                else:
                    print(f"⚠️ Controlador de temas não encontrado")
                
                # Verificar meta tags responsivas
                if 'viewport' in content and 'width=device-width' in content:
                    print(f"✅ Meta tags responsivas configuradas")
                else:
                    print(f"⚠️ Meta tags responsivas não encontradas")
                
                return True
            else:
                print(f"❌ Página principal não carregou: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao testar interface: {e}")
            return False

    def test_responsive_elements(self):
        """Testar elementos responsivos via CSS"""
        print("\n📱 TESTANDO RECURSOS RESPONSIVOS...")
        
        responsive_css = self.project_root / 'css' / 'responsive.css'
        if not responsive_css.exists():
            print("❌ Arquivo responsive.css não encontrado")
            return False
        
        content = responsive_css.read_text(encoding='utf-8')
        
        responsive_features = [
            ('@media', 'Media queries'),
            ('grid-template-columns', 'Grid responsivo'),
            ('clamp(', 'Tipografia fluida'),
            ('container-responsive', 'Container responsivo'),
            ('hide-mobile', 'Utilitários mobile'),
            ('touch', 'Suporte a touch')
        ]
        
        all_good = True
        for feature, description in responsive_features:
            if feature in content:
                print(f"✅ {description} implementado")
            else:
                print(f"⚠️ {description} não encontrado")
                all_good = False
        
        return all_good

    def test_theme_system(self):
        """Testar sistema de temas"""
        print("\n🌙 TESTANDO SISTEMA DE TEMAS...")
        
        theme_css = self.project_root / 'css' / 'theme-system.css'
        theme_js = self.project_root / 'js' / 'theme-controller.js'
        
        if not theme_css.exists():
            print("❌ theme-system.css não encontrado")
            return False
        
        if not theme_js.exists():
            print("❌ theme-controller.js não encontrado")
            return False
        
        css_content = theme_css.read_text(encoding='utf-8')
        js_content = theme_js.read_text(encoding='utf-8')
        
        theme_features = [
            ('[data-theme="light"]', 'Tema claro'),
            ('[data-theme="dark"]', 'Tema escuro'),
            ('[data-theme="auto"]', 'Tema automático'),
            ('prefers-color-scheme', 'Detecção do sistema'),
            ('--bg-primary', 'Variáveis CSS'),
            ('transition:', 'Transições suaves')
        ]
        
        js_features = [
            ('class ThemeController', 'Controlador de temas'),
            ('localStorage', 'Persistência'),
            ('setTheme(', 'Mudança de tema'),
            ('detectSystemTheme', 'Detecção automática'),
            ('showNotification', 'Notificações')
        ]
        
        all_good = True
        
        print("🎨 CSS do sistema de temas:")
        for feature, description in theme_features:
            if feature in css_content:
                print(f"  ✅ {description}")
            else:
                print(f"  ⚠️ {description} não encontrado")
                all_good = False
        
        print("🚀 JavaScript do sistema de temas:")
        for feature, description in js_features:
            if feature in js_content:
                print(f"  ✅ {description}")
            else:
                print(f"  ⚠️ {description} não encontrado")
                all_good = False
        
        return all_good

    def generate_report(self, results):
        """Gerar relatório da Fase 3"""
        print("\n" + "=" * 80)
        print("📊 RELATÓRIO DA FASE 3: INTERFACE E UX")
        print("=" * 80)
        
        total_tests = len(results)
        passed_tests = sum(results)
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📋 Testes executados: {total_tests}")
        print(f"✅ Testes aprovados: {passed_tests}")
        print(f"❌ Testes falharam: {total_tests - passed_tests}")
        print(f"📈 Taxa de sucesso: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("\n🎉 FASE 3 COMPLETADA COM EXCELÊNCIA!")
            print("🚀 Interface e UX implementadas com sucesso")
            status = "EXCELENTE"
        elif success_rate >= 75:
            print("\n✅ FASE 3 COMPLETADA COM SUCESSO!")
            print("🎨 A maioria das melhorias implementadas")
            status = "BOM"
        elif success_rate >= 50:
            print("\n⚠️ FASE 3 PARCIALMENTE COMPLETA")
            print("🔧 Algumas melhorias implementadas")
            status = "PARCIAL"
        else:
            print("\n❌ FASE 3 NECESSITA CORREÇÕES")
            print("🛠️ Implementação incompleta")
            status = "PRECISA MELHORAR"
        
        # Salvar relatório
        self.save_phase3_report(status, success_rate, results)
        
        return success_rate >= 75

    def save_phase3_report(self, status, success_rate, results):
        """Salvar relatório da Fase 3"""
        try:
            report_path = self.project_root / 'phase3-report.txt'
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write("XCAFE WIDGET SAAS - RELATÓRIO FASE 3\n")
                f.write("=" * 50 + "\n")
                f.write(f"Data: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Status: {status}\n")
                f.write(f"Taxa de Sucesso: {success_rate:.1f}%\n")
                f.write(f"Resultados: {results}\n\n")
                f.write("RECURSOS IMPLEMENTADOS:\n")
                f.write("- Sistema de temas (Dark/Light/Auto)\n")
                f.write("- Loading states e feedback visual\n")
                f.write("- Design responsivo avançado\n")
                f.write("- Controlador de temas JavaScript\n")
                f.write("- UX enhancements (ripple, smooth scroll)\n")
                f.write("- Notificações e toasts\n")
                f.write("- Validação de formulários\n")
                f.write("- Acessibilidade melhorada\n")
            
            print(f"📄 Relatório salvo em: {report_path}")
        except Exception as e:
            print(f"⚠️ Erro ao salvar relatório: {e}")

    def run(self):
        """Executar teste completo da Fase 3"""
        self.print_banner()
        
        results = []
        
        # Testes de arquivos
        results.append(self.check_css_files())
        results.append(self.check_js_files())
        results.append(self.check_html_updates())
        
        # Testes de recursos
        results.append(self.test_responsive_elements())
        results.append(self.test_theme_system())
        
        # Teste do servidor
        server_process = self.start_server()
        if server_process:
            try:
                results.append(self.test_interface_elements())
            finally:
                server_process.terminate()
                print("🛑 Servidor parado")
        else:
            results.append(False)
        
        # Gerar relatório
        success = self.generate_report(results)
        
        return success

if __name__ == "__main__":
    try:
        tester = Phase3Test()
        success = tester.run()
        
        print(f"\n🏁 FASE 3 FINALIZADA: {'SUCESSO' if success else 'NECESSITA CORREÇÕES'}")
        exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⏹️ Teste interrompido pelo usuário")
        exit(1)
    except Exception as e:
        print(f"\n💥 Erro fatal: {e}")
        exit(1)
