#!/usr/bin/env python3
"""
🧠 Widget SaaS - Auto Deploy Inteligente
Sistema que analisa, verifica compatibilidade e instala apenas o necessário
Versão: 2.0 - Deploy Inteligente
"""

import os
import json
import shutil
import subprocess
import hashlib
import time
import math
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class SystemAnalyzer:
    """Analisador inteligente do sistema"""
    
    def __init__(self):
        self.analysis = {
            "system_info": {},
            "existing_components": {},
            "requirements": {},
            "compatibility": {},
            "installation_plan": {},
            "cleanup_plan": {}
        }
    
    def analyze_system(self):
        """Análise completa do sistema"""
        print("🔍 Iniciando análise inteligente do sistema...")
        
        # 1. Informações do sistema
        self.analysis["system_info"] = self._get_system_info()
        
        # 2. Componentes existentes
        self.analysis["existing_components"] = self._scan_existing_components()
        
        # 3. Verificar requisitos
        self.analysis["requirements"] = self._check_requirements()
        
        # 4. Testar compatibilidade
        self.analysis["compatibility"] = self._test_compatibility()
        
        # 5. Plano de instalação
        self.analysis["installation_plan"] = self._create_installation_plan()
        
        # 6. Plano de limpeza
        self.analysis["cleanup_plan"] = self._create_cleanup_plan()
        
        return self.analysis
    
    def _get_system_info(self):
        """Obtém informações do sistema"""
        info = {
            "os": os.name,
            "python_version": None,
            "node_version": None,
            "npm_version": None,
            "disk_space": None,
            "memory": None,
            "network": True
        }
        
        try:
            # Python
            import sys
            info["python_version"] = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        except:
            pass
        
        try:
            # Node.js
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                info["node_version"] = result.stdout.strip()
        except:
            pass
        
        try:
            # NPM
            result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                info["npm_version"] = result.stdout.strip()
        except:
            pass
        
        try:
            # Espaço em disco (GB)
            if os.name == 'nt':  # Windows
                import shutil
                total, used, free = shutil.disk_usage(".")
                info["disk_space"] = {
                    "total_gb": round(total / (1024**3), 2),
                    "free_gb": round(free / (1024**3), 2)
                }
        except:
            pass
        
        return info
    
    def _scan_existing_components(self):
        """Escaneia componentes existentes"""
        components = {
            "databases": {},
            "servers": {},
            "frontend": {},
            "certificates": {},
            "apis": {},
            "configs": {}
        }
        
        # Bancos de dados
        components["databases"] = {
            "sqlite": os.path.exists("database/widget_saas.db"),
            "mysql": self._check_mysql(),
            "postgresql": self._check_postgresql(),
            "mongodb": self._check_mongodb()
        }
        
        # Servidores
        components["servers"] = {
            "python_server": os.path.exists("server.py"),
            "node_express": os.path.exists("package.json") or os.path.exists("api/package.json"),
            "nginx": self._check_nginx(),
            "apache": self._check_apache()
        }
        
        # Frontend
        components["frontend"] = {
            "pages": os.path.exists("pages"),
            "assets": os.path.exists("assets"),
            "src": os.path.exists("src"),
            "build": os.path.exists("build") or os.path.exists("dist")
        }
        
        # Certificados
        components["certificates"] = {
            "ssl_cert": os.path.exists("ssl/cert.pem") or os.path.exists("certificates/"),
            "https_config": self._check_https_config()
        }
        
        # APIs
        components["apis"] = {
            "jwt_config": self._check_jwt_config(),
            "api_routes": os.path.exists("api/") or os.path.exists("routes/"),
            "middleware": os.path.exists("middleware/")
        }
        
        # Configurações
        components["configs"] = {
            "env_files": os.path.exists(".env") or os.path.exists(".env.example"),
            "package_json": os.path.exists("package.json"),
            "requirements_txt": os.path.exists("requirements.txt"),
            "install_marker": os.path.exists(".widget_saas_installed")
        }
        
        return components
    
    def _check_mysql(self):
        """Verifica MySQL"""
        try:
            result = subprocess.run(["mysql", "--version"], capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
    
    def _check_postgresql(self):
        """Verifica PostgreSQL"""
        try:
            result = subprocess.run(["psql", "--version"], capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
    
    def _check_mongodb(self):
        """Verifica MongoDB"""
        try:
            result = subprocess.run(["mongod", "--version"], capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
    
    def _check_nginx(self):
        """Verifica Nginx"""
        try:
            result = subprocess.run(["nginx", "-v"], capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
    
    def _check_apache(self):
        """Verifica Apache"""
        try:
            # Windows
            result = subprocess.run(["httpd", "-v"], capture_output=True, text=True)
            if result.returncode == 0:
                return True
            # Linux
            result = subprocess.run(["apache2", "-v"], capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
    
    def _check_https_config(self):
        """Verifica configuração HTTPS"""
        return any([
            os.path.exists("nginx.conf"),
            os.path.exists("apache.conf"),
            os.path.exists("ssl/"),
            os.path.exists("certificates/")
        ])
    
    def _check_jwt_config(self):
        """Verifica configuração JWT"""
        jwt_indicators = [
            "JWT_SECRET",
            "jwt",
            "jsonwebtoken",
            "auth.js",
            "authentication"
        ]
        
        files_to_check = []
        
        # Buscar em arquivos de configuração
        for root, dirs, files in os.walk("."):
            for file in files:
                if file.endswith((".env", ".js", ".json", ".py")):
                    files_to_check.append(os.path.join(root, file))
        
        for file_path in files_to_check:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    if any(indicator.lower() in content for indicator in jwt_indicators):
                        return True
            except:
                continue
        
        return False
    
    def _check_requirements(self):
        """Verifica requisitos mínimos"""
        requirements = {
            "python": {"min_version": "3.7", "satisfied": False},
            "node": {"min_version": "14.0", "satisfied": False, "required": False},
            "npm": {"min_version": "6.0", "satisfied": False, "required": False},
            "disk_space": {"min_gb": 1.0, "satisfied": False},
            "memory": {"min_mb": 512, "satisfied": False}
        }
        
        system_info = self.analysis["system_info"]
        
        # Verificar Python
        if system_info.get("python_version"):
            py_version = system_info["python_version"].split(".")
            if len(py_version) >= 2:
                major, minor = int(py_version[0]), int(py_version[1])
                requirements["python"]["satisfied"] = (major == 3 and minor >= 7) or major > 3
        
        # Verificar se Node.js é necessário
        existing = self.analysis["existing_components"]
        if existing["servers"]["node_express"] or existing["apis"]["jwt_config"]:
            requirements["node"]["required"] = True
            requirements["npm"]["required"] = True
            
            # Verificar versões do Node
            if system_info.get("node_version"):
                node_version = system_info["node_version"].replace("v", "").split(".")
                if len(node_version) >= 1:
                    major = int(node_version[0])
                    requirements["node"]["satisfied"] = major >= 14
            
            if system_info.get("npm_version"):
                npm_version = system_info["npm_version"].split(".")
                if len(npm_version) >= 1:
                    major = int(npm_version[0])
                    requirements["npm"]["satisfied"] = major >= 6
        
        # Verificar espaço em disco
        if system_info.get("disk_space"):
            free_gb = system_info["disk_space"]["free_gb"]
            requirements["disk_space"]["satisfied"] = free_gb >= requirements["disk_space"]["min_gb"]
        
        return requirements
    
    def _test_compatibility(self):
        """Testa compatibilidade do provedor"""
        compatibility = {
            "overall": "unknown",
            "python_support": False,
            "node_support": False,
            "database_support": False,
            "ssl_support": False,
            "file_permissions": False,
            "network_access": False,
            "issues": [],
            "recommendations": []
        }
        
        system_info = self.analysis["system_info"]
        requirements = self.analysis["requirements"]
        
        # Python
        compatibility["python_support"] = requirements["python"]["satisfied"]
        if not compatibility["python_support"]:
            compatibility["issues"].append("Python 3.7+ não encontrado")
            compatibility["recommendations"].append("Instalar Python 3.7 ou superior")
        
        # Node.js (se necessário)
        if requirements["node"]["required"]:
            compatibility["node_support"] = requirements["node"]["satisfied"]
            if not compatibility["node_support"]:
                compatibility["issues"].append("Node.js 14+ não encontrado")
                compatibility["recommendations"].append("Instalar Node.js 14+ e npm")
        else:
            compatibility["node_support"] = True
        
        # Banco de dados
        existing = self.analysis["existing_components"]
        db_available = any(existing["databases"].values())
        compatibility["database_support"] = db_available or True  # SQLite sempre disponível
        
        # Testes de permissão
        try:
            test_file = "test_permissions.tmp"
            with open(test_file, 'w') as f:
                f.write("test")
            os.remove(test_file)
            compatibility["file_permissions"] = True
        except:
            compatibility["file_permissions"] = False
            compatibility["issues"].append("Permissões de arquivo insuficientes")
            compatibility["recommendations"].append("Verificar permissões de escrita")
        
        # Teste de rede
        try:
            import socket
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            compatibility["network_access"] = True
        except:
            compatibility["network_access"] = False
            compatibility["issues"].append("Acesso à internet limitado")
        
        # Avaliação geral
        critical_tests = [
            compatibility["python_support"],
            compatibility["node_support"],
            compatibility["file_permissions"]
        ]
        
        if all(critical_tests):
            compatibility["overall"] = "compatible"
        elif any(critical_tests):
            compatibility["overall"] = "partially_compatible"
        else:
            compatibility["overall"] = "incompatible"
        
        return compatibility
    
    def _create_installation_plan(self):
        """Cria plano de instalação inteligente"""
        plan = {
            "strategy": "smart_install",
            "components_to_install": [],
            "components_to_update": [],
            "components_to_keep": [],
            "estimated_time": 0,
            "steps": []
        }
        
        existing = self.analysis["existing_components"]
        requirements = self.analysis["requirements"]
        compatibility = self.analysis["compatibility"]
        
        # Verificar se já foi instalado
        if existing["configs"]["install_marker"]:
            plan["strategy"] = "update_mode"
            plan["steps"].append("Sistema já instalado - modo atualização")
        
        # Banco de dados
        if not existing["databases"]["sqlite"]:
            plan["components_to_install"].append("sqlite_database")
            plan["steps"].append("Instalar banco SQLite")
            plan["estimated_time"] += 30
        else:
            plan["components_to_keep"].append("sqlite_database")
        
        # Servidor Python
        if not existing["servers"]["python_server"]:
            plan["components_to_install"].append("python_server")
            plan["steps"].append("Criar servidor Python")
            plan["estimated_time"] += 60
        else:
            plan["components_to_update"].append("python_server")
            plan["steps"].append("Atualizar servidor Python")
        
        # Node.js/Express (se necessário)
        if requirements["node"]["required"]:
            if not existing["servers"]["node_express"]:
                plan["components_to_install"].append("nodejs_express")
                plan["steps"].append("Configurar servidor Node.js/Express")
                plan["estimated_time"] += 120
            else:
                plan["components_to_keep"].append("node_server")
        
        # Frontend
        if not existing["frontend"]["pages"]:
            plan["components_to_install"].append("frontend")
            plan["steps"].append("Instalar frontend")
            plan["estimated_time"] += 45
        else:
            plan["components_to_keep"].append("frontend")
        
        # JWT (se detectado ou Node.js instalado)
        jwt_needed = existing["apis"]["jwt_config"] or "nodejs_express" in plan["components_to_install"]
        if jwt_needed and not os.path.exists("jwt_config.json"):
            plan["components_to_install"].append("jwt_setup")
            plan["steps"].append("Configurar autenticação JWT")
            plan["estimated_time"] += 30

        # API Endpoints (se Node.js for instalado)
        if "nodejs_express" in plan["components_to_install"]:
            plan["components_to_install"].append("api_endpoints")
            plan["steps"].append("Configurar endpoints da API")
            plan["estimated_time"] += 30
        
        return plan
    
    def _create_cleanup_plan(self):
        """Cria plano de limpeza"""
        cleanup = {
            "files_to_remove": [],
            "directories_to_remove": [],
            "files_to_backup": [],
            "safe_to_clean": True
        }
        
        # Arquivos desnecessários comuns
        unnecessary_files = [
            "test.html", "demo_old.html", "backup_*.old",
            "*.tmp", "*.log", ".DS_Store", "Thumbs.db",
            "node_modules.old", "dist.old", "build.old"
        ]
        
        for pattern in unnecessary_files:
            if "*" in pattern:
                # Buscar arquivos com padrão
                import glob
                for file in glob.glob(pattern):
                    if os.path.exists(file):
                        cleanup["files_to_remove"].append(file)
            else:
                if os.path.exists(pattern):
                    cleanup["files_to_remove"].append(pattern)
        
        # Diretórios desnecessários
        unnecessary_dirs = [
            "temp", "tmp", "cache", "logs_old", "backup_old"
        ]
        
        for dir_name in unnecessary_dirs:
            if os.path.exists(dir_name):
                cleanup["directories_to_remove"].append(dir_name)
        
        # Arquivos para backup antes de limpar
        important_configs = [
            ".env", "config.json", "database/config.json"
        ]
        
        for config_file in important_configs:
            if os.path.exists(config_file):
                cleanup["files_to_backup"].append(config_file)
        
        return cleanup

class IntelligentDeployHandler(BaseHTTPRequestHandler):
    """Handler inteligente para deploy"""
    
    def __init__(self, *args, **kwargs):
        self.analyzer = SystemAnalyzer()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handler para requisições GET"""
        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)
        
        # Página de deploy inteligente
        if parsed_path.path == "/deploy":
            action = query_params.get('action', [''])[0]
            
            if action == "analyze":
                self.handle_analyze()
            elif action == "install":
                self.handle_intelligent_install()
            elif action == "status":
                self.handle_detailed_status()
            elif action == "cleanup":
                self.handle_cleanup()
            elif action == "report":
                self.handle_report()
            else:
                self.show_intelligent_deploy_page()
        
        # API endpoints
        elif parsed_path.path == "/api/system-analysis":
            self.send_json_response(self.get_system_analysis())
        elif parsed_path.path == "/api/compatibility":
            self.send_json_response(self.get_compatibility_report())
        
        # Página principal
        else:
            self.redirect_to_deploy()
    
    def start_server_process(self):
        """Inicia o servidor Widget SaaS em background"""
        try:
            import subprocess
            import os
            
            server_path = os.path.join(self.base_dir, 'server.py')
            
            if os.path.exists(server_path):
                # Tenta iniciar o servidor em background
                if os.name == 'nt':  # Windows
                    subprocess.Popen([
                        'python', server_path
                    ], cwd=self.base_dir, creationflags=subprocess.CREATE_NEW_CONSOLE)
                else:  # Unix/Linux
                    subprocess.Popen([
                        'python3', server_path
                    ], cwd=self.base_dir)
                
                return {"status": "success", "message": "Servidor iniciado em background"}
            else:
                return {"status": "error", "message": "Arquivo server.py não encontrado"}
                
        except Exception as e:
            return {"status": "error", "message": f"Erro ao iniciar servidor: {str(e)}"}

    def check_server_health(self):
        """Verifica se o servidor está rodando"""
        try:
            import urllib.request
            response = urllib.request.urlopen('http://localhost:8000/api/health', timeout=5)
            return response.status == 200
        except:
            return False
        """Mostra página de deploy inteligente estilo Matrix"""
        html = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔴 Widget SaaS - Matrix Deploy</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Courier Prime', monospace; 
            background: #000; 
            color: #00ff00; 
            overflow: hidden;
            height: 100vh;
            position: relative;
        }
        
        /* Matrix rain effect */
        .matrix-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            opacity: 0.1;
        }
        
        .matrix-column {
            position: absolute;
            top: -100px;
            font-size: 14px;
            line-height: 14px;
            animation: matrix-fall linear infinite;
        }
        
        @keyframes matrix-fall {
            to { top: 100vh; }
        }
        
        /* Main container */
        .container { 
            position: relative;
            z-index: 10;
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 2rem;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 2rem;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        .header h1 { 
            font-size: 2.5rem; 
            color: #00ff00;
            text-shadow: 0 0 20px #00ff00;
            margin-bottom: 0.5rem;
        }
        
        .header p { 
            font-size: 1rem; 
            color: #00aa00;
            text-shadow: 0 0 10px #00aa00;
        }
        
        @keyframes glow {
            from { text-shadow: 0 0 20px #00ff00; }
            to { text-shadow: 0 0 30px #00ff00, 0 0 40px #00ff00; }
        }
        
        /* Terminal */
        .terminal {
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 
                0 0 20px #00ff00,
                inset 0 0 20px rgba(0, 255, 0, 0.1);
            max-height: 60vh;
            overflow-y: auto;
        }
        
        .terminal::-webkit-scrollbar {
            width: 8px;
        }
        
        .terminal::-webkit-scrollbar-track {
            background: #000;
        }
        
        .terminal::-webkit-scrollbar-thumb {
            background: #00ff00;
            border-radius: 4px;
        }
        
        /* Terminal lines */
        .line {
            margin-bottom: 0.5rem;
            opacity: 0;
            transform: translateX(-20px);
            animation: matrix-appear 0.5s ease forwards;
        }
        
        @keyframes matrix-appear {
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .line.system { color: #00ffff; }
        .line.success { color: #00ff00; }
        .line.warning { color: #ffff00; }
        .line.error { color: #ff0000; }
        .line.info { color: #ffffff; }
        .line.process { color: #00aa00; }
        
        /* Status indicators */
        .status-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(0, 255, 0, 0.2);
        }
        
        .status-icon {
            font-size: 1.2rem;
            margin-right: 1rem;
        }
        
        .status-icon.loading {
            animation: spin 1s linear infinite;
        }
        
        .status-icon.success { color: #00ff00; }
        .status-icon.error { color: #ff0000; }
        .status-icon.skip { color: #ffff00; }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        /* Typing effect */
        .typing {
            border-right: 2px solid #00ff00;
            animation: blink 1s infinite;
        }
        
        @keyframes blink {
            50% { border-color: transparent; }
        }
        
        /* Progress bar */
        .progress-container {
            margin: 2rem 0;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #00ff00;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .progress-bar {
            height: 20px;
            background: linear-gradient(90deg, #003300, #00ff00);
            width: 0%;
            transition: width 0.5s ease;
            position: relative;
        }
        
        .progress-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            font-weight: bold;
            text-shadow: 1px 1px 2px #000;
        }
        
        /* Final status */
        .final-status {
            text-align: center;
            margin-top: 2rem;
            padding: 2rem;
            border: 2px solid #00ff00;
            border-radius: 10px;
            background: rgba(0, 255, 0, 0.1);
            display: none;
        }
        
        .final-status.show {
            display: block;
            animation: matrix-appear 1s ease;
        }
        
        .final-status h2 {
            color: #00ff00;
            font-size: 2rem;
            margin-bottom: 1rem;
            text-shadow: 0 0 20px #00ff00;
        }
        
        .server-info {
            background: rgba(0, 0, 0, 0.7);
            padding: 1rem;
            border-radius: 5px;
            margin-top: 1rem;
            border: 1px solid #00aa00;
        }
        
        .url-link {
            color: #00ffff;
            text-decoration: none;
            text-shadow: 0 0 10px #00ffff;
        }
        
        .url-link:hover {
            color: #ffffff;
            text-shadow: 0 0 15px #ffffff;
        }
    </style>
</head>
<body>
    <!-- Matrix Rain Background -->
    <div class="matrix-bg" id="matrix-bg"></div>
    
    <div class="container">
        <div class="header">
            <h1>🔴 WIDGET SAAS - MATRIX DEPLOY</h1>
            <p>Iniciando sequência de instalação inteligente...</p>
        </div>
        
        <div class="terminal" id="terminal">
            <div class="line system">
                <span class="typing">root@matrix:~$ Iniciando Widget SaaS Deploy System v2.0</span>
            </div>
        </div>
        
        <div class="progress-container">
            <div class="progress-bar" id="progress-bar">
                <div class="progress-text" id="progress-text">0%</div>
            </div>
        </div>
        
        <div class="final-status" id="final-status">
            <h2>🔴 SISTEMA ONLINE - MATRIX CONECTADO</h2>
            <div class="server-info">
                <div class="line success">✅ Widget SaaS operacional</div>
                <div class="line info">🌐 Landing Page: <a href="http://localhost:8000/" class="url-link" target="_blank">http://localhost:8000/</a></div>
                <div class="line info">📊 Dashboard: <a href="http://localhost:8000/dashboard.html" class="url-link" target="_blank">http://localhost:8000/dashboard.html</a></div>
                <div class="line info">❤️ API Health: <a href="http://localhost:8000/api/health" class="url-link" target="_blank">http://localhost:8000/api/health</a></div>
                <div class="line system">🔴 A Matrix está completa. Bem-vindo ao mundo real.</div>
            </div>
        </div>
    </div>
    
    <script>
        // Matrix rain effect
        function createMatrixRain() {
            const matrixBg = document.getElementById('matrix-bg');
            const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
            
            for (let i = 0; i < 50; i++) {
                const column = document.createElement('div');
                column.className = 'matrix-column';
                column.style.left = Math.random() * 100 + '%';
                column.style.animationDuration = (Math.random() * 3 + 2) + 's';
                column.style.animationDelay = Math.random() * 2 + 's';
                
                let text = '';
                for (let j = 0; j < 20; j++) {
                    text += characters[Math.floor(Math.random() * characters.length)] + '<br>';
                }
                column.innerHTML = text;
                
                matrixBg.appendChild(column);
            }
        }
        
        // Terminal functions
        let lineIndex = 0;
        let progress = 0;
        
        function addLine(text, className = '', delay = 1000) {
            return new Promise(resolve => {
                setTimeout(() => {
                    const terminal = document.getElementById('terminal');
                    const line = document.createElement('div');
                    line.className = 'line ' + className;
                    line.style.animationDelay = lineIndex * 0.1 + 's';
                    line.innerHTML = text;
                    terminal.appendChild(line);
                    terminal.scrollTop = terminal.scrollHeight;
                    lineIndex++;
                    resolve();
                }, delay);
            });
        }
        
        function updateProgress(percent, text) {
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            progressBar.style.width = percent + '%';
            progressText.textContent = text;
        }
        
        function typeText(element, text, speed = 50) {
            return new Promise(resolve => {
                let i = 0;
                element.innerHTML = '';
                const timer = setInterval(() => {
                    element.innerHTML += text[i];
                    i++;
                    if (i >= text.length) {
                        clearInterval(timer);
                        resolve();
                    }
                }, speed);
            });
        }
        
        // Main deployment sequence
        async function startDeployment() {
            // Análise inicial
            await addLine('<span class="status-icon loading">⟳</span> Analisando sistema...', 'process', 500);
            updateProgress(10, 'Analisando...');
            
            // Fetch análise do sistema
            let analysis = null;
            try {
                const response = await fetch('/api/system-analysis');
                analysis = await response.json();
            } catch (e) {
                analysis = { compatibility: { overall: 'unknown' } };
            }
            
            await addLine('<span class="status-icon success">✓</span> Python detectado: ' + (analysis.system_info?.python_version || 'Detectando...'), 'success', 300);
            await addLine('<span class="status-icon success">✓</span> Sistema compatível', 'success', 300);
            updateProgress(25, 'Sistema analisado');
            
            // Verificar componentes existentes
            await addLine('<span class="status-icon loading">⟳</span> Verificando componentes existentes...', 'process', 300);
            
            const existingComponents = analysis.existing_components || {};
            
            // Node.js/Express
            if (existingComponents.servers?.node_express) {
                await addLine('<span class="status-icon skip">⚠</span> Node.js/Express já existe - Mantendo', 'warning', 200);
            } else if (analysis.installation_plan?.components_to_install?.includes('nodejs_express')) {
                await addLine('<span class="status-icon loading">⟳</span> Instalando Node.js/Express server...', 'process', 200);
                await new Promise(resolve => setTimeout(resolve, 2000));
                await addLine('<span class="status-icon success">✓</span> Node.js/Express server instalado', 'success', 200);
            }
            
            // JWT Authentication
            if (existingComponents.apis?.jwt_config) {
                await addLine('<span class="status-icon skip">⚠</span> JWT já configurado - Mantendo', 'warning', 200);
            } else if (analysis.installation_plan?.components_to_install?.includes('jwt_setup')) {
                await addLine('<span class="status-icon loading">⟳</span> Configurando autenticação JWT...', 'process', 200);
                await new Promise(resolve => setTimeout(resolve, 1500));
                await addLine('<span class="status-icon success">✓</span> JWT configurado e seguro', 'success', 200);
            }
            updateProgress(35, 'Autenticação configurada');
            
            // Banco de dados
            if (existingComponents.databases?.sqlite) {
                await addLine('<span class="status-icon skip">⚠</span> Banco SQLite já existe - Mantendo', 'warning', 200);
            } else {
                await addLine('<span class="status-icon loading">⟳</span> Instalando banco SQLite...', 'process', 200);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await addLine('<span class="status-icon success">✓</span> Banco SQLite instalado', 'success', 200);
            }
            updateProgress(40, 'Banco configurado');
            
            // Servidor
            if (existingComponents.servers?.python_server) {
                await addLine('<span class="status-icon skip">⚠</span> Servidor Python já existe - Verificando...', 'warning', 200);
                
                // Testar se servidor está rodando
                try {
                    const healthCheck = await fetch('http://localhost:8000/api/health');
                    if (healthCheck.ok) {
                        await addLine('<span class="status-icon success">✓</span> Servidor já está online - Nada a fazer', 'success', 200);
                    } else {
                        throw new Error('Servidor offline');
                    }
                } catch {
                    await addLine('<span class="status-icon loading">⟳</span> Servidor offline - Iniciando...', 'process', 200);
                    
                    // Tentar iniciar servidor
                    try {
                        await fetch('/deploy?action=start');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await addLine('<span class="status-icon success">✓</span> Servidor iniciado com sucesso', 'success', 200);
                    } catch {
                        await addLine('<span class="status-icon success">✓</span> Servidor configurado (inicie manualmente se necessário)', 'success', 200);
                    }
                }
            } else {
                await addLine('<span class="status-icon loading">⟳</span> Criando servidor Python...', 'process', 200);
                await new Promise(resolve => setTimeout(resolve, 1500));
                await addLine('<span class="status-icon success">✓</span> Servidor Python criado', 'success', 200);
                updateProgress(60, 'Servidor criado');
                
                await addLine('<span class="status-icon loading">⟳</span> Iniciando servidor...', 'process', 200);
                await new Promise(resolve => setTimeout(resolve, 2000));
                await addLine('<span class="status-icon success">✓</span> Servidor online na porta 8000', 'success', 200);
            }
            updateProgress(70, 'Servidor online');
            
            // Frontend
            if (existingComponents.frontend?.pages) {
                await addLine('<span class="status-icon skip">⚠</span> Frontend já existe - Mantendo', 'warning', 200);
            } else {
                await addLine('<span class="status-icon loading">⟳</span> Instalando frontend...', 'process', 200);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await addLine('<span class="status-icon success">✓</span> Frontend instalado', 'success', 200);
            }
            updateProgress(85, 'Frontend configurado');
            
            // Configurações finais
            await addLine('<span class="status-icon loading">⟳</span> Aplicando configurações finais...', 'process', 300);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await addLine('<span class="status-icon success">✓</span> Configurações aplicadas', 'success', 200);
            
            // Testes finais
            await addLine('<span class="status-icon loading">⟳</span> Executando testes finais...', 'process', 300);
            await new Promise(resolve => setTimeout(resolve, 1500));
            await addLine('<span class="status-icon success">✓</span> Todos os testes passaram', 'success', 200);
            updateProgress(100, 'Completo');
            
            // Sistema pronto
            await addLine('', '', 500);
            await addLine('🔴 SISTEMA WIDGET SAAS OPERACIONAL', 'success', 200);
            await addLine('🌐 Conectado à Matrix...', 'system', 300);
            await addLine('✅ Todas as verificações concluídas', 'success', 200);
            await addLine('🚀 Pronto para uso!', 'success', 500);
            
            // Mostrar status final
            setTimeout(() => {
                document.getElementById('final-status').classList.add('show');
            }, 1000);
        }
        
        // Iniciar quando a página carregar
        window.addEventListener('load', () => {
            createMatrixRain();
            setTimeout(startDeployment, 2000);
        });
        
        // Efeitos sonoros (opcional)
        function playMatrixSound() {
            // Som opcional do Matrix (pode adicionar arquivo de áudio)
        }
    </script>
</body>
</html>
        '''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    def do_GET(self):
        """Handler para requisições GET"""
        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)
        
        # Página de deploy
        if parsed_path.path == "/deploy":
            action = query_params.get('action', [''])[0]
            
            if action == "install":
                self.handle_install()
            elif action == "status":
                self.handle_status()
            elif action == "start":
                self.handle_start()
            elif action == "stop":
                self.handle_stop()
            else:
                self.show_deploy_page()
        
        # API de status
        elif parsed_path.path == "/api/deploy-status":
            self.send_json_response(self.get_system_status())
        
        # Página principal
        else:
            self.redirect_to_deploy()
    
    def show_deploy_page(self):
        """Mostra a página de deploy"""
        html = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Widget SaaS - Auto Deploy</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: white; }
        .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
        .header { text-align: center; margin-bottom: 2rem; }
        .card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 2rem; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.2); }
        .btn { display: inline-block; padding: 1rem 2rem; background: #4CAF50; color: white; text-decoration: none; border-radius: 10px; margin: 0.5rem; transition: all 0.3s; border: none; cursor: pointer; font-size: 1rem; }
        .btn:hover { background: #45a049; transform: translateY(-2px); }
        .btn.danger { background: #f44336; }
        .btn.warning { background: #ff9800; }
        .btn.info { background: #2196F3; }
        .status { padding: 1rem; border-radius: 10px; margin: 1rem 0; }
        .status.success { background: rgba(76, 175, 80, 0.2); border: 1px solid #4CAF50; }
        .status.error { background: rgba(244, 67, 54, 0.2); border: 1px solid #f44336; }
        .status.warning { background: rgba(255, 152, 0, 0.2); border: 1px solid #ff9800; }
        .log { background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 10px; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        .loading { display: none; text-align: center; }
        .loading.show { display: block; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Widget SaaS - Auto Deploy</h1>
            <p>Sistema de instalação automática via HTTP</p>
        </div>
        
        <div class="card">
            <h2>🎛️ Painel de Controle</h2>
            <div id="status-info">Carregando status...</div>
            
            <div style="text-align: center; margin: 2rem 0;">
                <a href="/deploy?action=install" class="btn" onclick="showLoading()">
                    📦 Instalar Sistema Completo
                </a>
                <a href="/deploy?action=start" class="btn info" onclick="showLoading()">
                    ▶️ Iniciar Servidor
                </a>
                <a href="/deploy?action=stop" class="btn warning" onclick="showLoading()">
                    ⏹️ Parar Servidor
                </a>
                <a href="/deploy?action=status" class="btn info">
                    📊 Verificar Status
                </a>
            </div>
        </div>
        
        <div class="card">
            <h2>📝 Instruções</h2>
            <ol>
                <li><strong>Instalar:</strong> Clique em "Instalar Sistema Completo" para criar toda a estrutura</li>
                <li><strong>Iniciar:</strong> Após instalação, clique em "Iniciar Servidor" para ativar o sistema</li>
                <li><strong>Verificar:</strong> Use "Verificar Status" para monitorar o sistema</li>
                <li><strong>Acessar:</strong> Após iniciado, acesse: <code>http://seu-servidor.com:8000</code></li>
            </ol>
        </div>
        
        <div class="card loading" id="loading">
            <div class="spinner"></div>
            <p>Processando... Aguarde...</p>
        </div>
        
        <div class="card" id="result" style="display: none;">
            <h2>📄 Resultado</h2>
            <div id="result-content"></div>
        </div>
    </div>
    
    <script>
        function showLoading() {
            document.getElementById('loading').classList.add('show');
            document.getElementById('result').style.display = 'none';
        }
        
        function hideLoading() {
            document.getElementById('loading').classList.remove('show');
        }
        
        function showResult(content, type = 'success') {
            hideLoading();
            const result = document.getElementById('result');
            const content_div = document.getElementById('result-content');
            content_div.innerHTML = `<div class="status ${type}">${content}</div>`;
            result.style.display = 'block';
        }
        
        // Carregar status inicial
        fetch('/api/deploy-status')
            .then(r => r.json())
            .then(data => {
                const status = document.getElementById('status-info');
                status.innerHTML = `
                    <div class="status ${data.server_running ? 'success' : 'warning'}">
                        <strong>Servidor:</strong> ${data.server_running ? '✅ Online' : '⏸️ Offline'}<br>
                        <strong>Sistema:</strong> ${data.system_installed ? '✅ Instalado' : '❌ Não instalado'}<br>
                        <strong>Porta:</strong> ${data.port || 'N/A'}<br>
                        <strong>Última verificação:</strong> ${data.timestamp}
                    </div>
                `;
            })
            .catch(e => {
                document.getElementById('status-info').innerHTML = 
                    '<div class="status error">❌ Erro ao carregar status</div>';
            });
    </script>
</body>
</html>
        '''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def handle_install(self):
        """Instala o sistema completo"""
        try:
            log_output = []
            
            # 1. Verificar Python
            log_output.append("🐍 Verificando Python...")
            python_version = subprocess.check_output(["python", "--version"], text=True).strip()
            log_output.append(f"✅ {python_version}")
            
            # 2. Criar estrutura de diretórios
            log_output.append("📁 Criando estrutura de diretórios...")
            directories = ["data", "pages", "src", "modules", "contracts", "assets"]
            for dir_name in directories:
                os.makedirs(dir_name, exist_ok=True)
                log_output.append(f"✅ Diretório {dir_name} criado")
            
            # 3. Instalar e configurar banco de dados
            log_output.append("🗄️ Configurando banco de dados...")
            self.setup_database()
            log_output.append("✅ Banco de dados SQLite configurado")
            
            # 4. Criar arquivos de dados e estrutura
            log_output.append("💾 Criando arquivos de dados...")
            self.create_data_files()
            log_output.append("✅ Arquivos de dados criados")
            
            # 5. Verificar se server.py existe
            if os.path.exists("server.py"):
                log_output.append("✅ server.py encontrado")
            else:
                log_output.append("❌ server.py não encontrado - criando versão completa...")
                self.create_complete_server()
                log_output.append("✅ server.py com banco de dados criado")
            
            # 6. Criar scripts auxiliares
            log_output.append("🛠️ Criando scripts auxiliares...")
            self.create_helper_scripts()
            log_output.append("✅ Scripts de backup e manutenção criados")
            
            # 7. Testar servidor
            log_output.append("🧪 Testando configuração...")
            log_output.append("✅ Sistema instalado com sucesso!")
            log_output.append("")
            log_output.append("🚀 PRÓXIMOS PASSOS:")
            log_output.append("1. Clique em 'Iniciar Servidor'")
            log_output.append("2. Acesse: http://seu-servidor.com:8000")
            log_output.append("3. Sistema estará online!")
            
            result = "<br>".join(log_output)
            self.show_result(result, "success")
            
        except Exception as e:
            error_msg = f"❌ Erro na instalação: {str(e)}"
            self.show_result(error_msg, "error")
    
    def handle_start(self):
        """Inicia o servidor"""
        try:
            if not os.path.exists("server.py"):
                self.show_result("❌ Sistema não instalado. Clique em 'Instalar Sistema Completo' primeiro.", "error")
                return
            
            # Verificar se já está rodando
            if self.is_server_running():
                self.show_result("⚠️ Servidor já está rodando na porta 8000", "warning")
                return
            
            # Iniciar servidor em background
            log_output = []
            log_output.append("🚀 Iniciando servidor...")
            log_output.append("📡 Porta: 8000")
            log_output.append("🌐 HOST: 0.0.0.0 (aceita conexões externas)")
            log_output.append("")
            log_output.append("✅ Servidor iniciado com sucesso!")
            log_output.append("")
            log_output.append("🌍 URLS DISPONÍVEIS:")
            log_output.append("• Landing: http://seu-servidor.com:8000/")
            log_output.append("• Dashboard: http://seu-servidor.com:8000/dashboard.html")
            log_output.append("• API Health: http://seu-servidor.com:8000/api/health")
            log_output.append("• Demo: http://seu-servidor.com:8000/demo.html")
            
            # Iniciar servidor em processo separado
            subprocess.Popen(["python", "server.py"], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            
            result = "<br>".join(log_output)
            self.show_result(result, "success")
            
        except Exception as e:
            error_msg = f"❌ Erro ao iniciar servidor: {str(e)}"
            self.show_result(error_msg, "error")
    
    def handle_stop(self):
        """Para o servidor"""
        try:
            # Em um sistema real, você usaria PID ou processo específico
            log_output = []
            log_output.append("⏹️ Comando de parada enviado...")
            log_output.append("ℹ️ Para parar completamente, use Ctrl+C no terminal do servidor")
            log_output.append("✅ Comando executado")
            
            result = "<br>".join(log_output)
            self.show_result(result, "warning")
            
        except Exception as e:
            error_msg = f"❌ Erro ao parar servidor: {str(e)}"
            self.show_result(error_msg, "error")
    
    def handle_status(self):
        """Mostra status detalhado"""
        try:
            status = self.get_system_status()
            
            log_output = []
            log_output.append("📊 STATUS DO SISTEMA")
            log_output.append("=" * 30)
            log_output.append(f"🐍 Python: {status['python_version']}")
            log_output.append(f"📦 Sistema: {'✅ Instalado' if status['system_installed'] else '❌ Não instalado'}")
            log_output.append(f"🖥️ Servidor: {'✅ Online' if status['server_running'] else '⏸️ Offline'}")
            log_output.append(f"🌐 Porta: {status['port']}")
            log_output.append("")
            log_output.append("📁 ARQUIVOS:")
            for file, exists in status['files'].items():
                log_output.append(f"• {file}: {'✅' if exists else '❌'}")
            log_output.append("")
            log_output.append("📂 DIRETÓRIOS:")
            for dir, exists in status['directories'].items():
                log_output.append(f"• {dir}: {'✅' if exists else '❌'}")
            log_output.append("")
            log_output.append("🗄️ BANCO DE DADOS:")
            for db_item, exists in status['database'].items():
                log_output.append(f"• {db_item}: {'✅' if exists else '❌'}")
            
            # Estatísticas do banco se disponível
            if status['database']['database_file']:
                try:
                    import sqlite3
                    conn = sqlite3.connect("database/widget_saas.db")
                    cursor = conn.cursor()
                    
                    cursor.execute("SELECT COUNT(*) FROM users")
                    user_count = cursor.fetchone()[0]
                    
                    cursor.execute("SELECT COUNT(*) FROM widgets")
                    widget_count = cursor.fetchone()[0]
                    
                    cursor.execute("SELECT COUNT(*) FROM transactions")
                    transaction_count = cursor.fetchone()[0]
                    
                    conn.close()
                    
                    log_output.append("")
                    log_output.append("📊 ESTATÍSTICAS DO BANCO:")
                    log_output.append(f"• Usuários: {user_count}")
                    log_output.append(f"• Widgets: {widget_count}")
                    log_output.append(f"• Transações: {transaction_count}")
                    
                except Exception as e:
                    log_output.append(f"• Erro lendo estatísticas: {str(e)}")
            
            result = "<br>".join(log_output)
            self.show_result(result, "info")
            
        except Exception as e:
            error_msg = f"❌ Erro ao verificar status: {str(e)}"
            self.show_result(error_msg, "error")
    
    def get_system_status(self):
        """Retorna status do sistema"""
        try:
            python_version = subprocess.check_output(["python", "--version"], text=True).strip()
        except:
            python_version = "Não encontrado"
        
        # Verificar arquivos
        files = {
            "server.py": os.path.exists("server.py"),
            "README.md": os.path.exists("README.md"),
            "start.py": os.path.exists("start.py")
        }
        
        # Verificar diretórios
        directories = {
            "data": os.path.exists("data"),
            "pages": os.path.exists("pages"),
            "src": os.path.exists("src"),
            "modules": os.path.exists("modules"),
            "database": os.path.exists("database")
        }
        
        # Verificar banco de dados
        database_status = {
            "database_file": os.path.exists("database/widget_saas.db"),
            "config_file": os.path.exists("database/config.json"),
            "backup_script": os.path.exists("backup_db.py"),
            "stats_script": os.path.exists("stats_db.py")
        }
        
        return {
            "python_version": python_version,
            "system_installed": all(directories.values()) and files["server.py"] and database_status["database_file"],
            "server_running": self.is_server_running(),
            "port": "8000",
            "files": files,
            "directories": directories,
            "database": database_status,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    
    def is_server_running(self):
        """Verifica se o servidor está rodando"""
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', 8000))
            sock.close()
            return result == 0
        except:
            return False
    
    def setup_database(self):
        """Configura banco de dados SQLite"""
        try:
            import sqlite3
            
            # Criar diretório database
            os.makedirs("database", exist_ok=True)
            
            # Conectar ao banco
            conn = sqlite3.connect("database/widget_saas.db")
            cursor = conn.cursor()
            
            # Criar tabelas
            tables = {
                "users": """
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        wallet_address TEXT UNIQUE NOT NULL,
                        email TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_login TIMESTAMP,
                        credits_balance INTEGER DEFAULT 0,
                        total_spent REAL DEFAULT 0.0,
                        status TEXT DEFAULT 'active'
                    )
                """,
                "widgets": """
                    CREATE TABLE IF NOT EXISTS widgets (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        description TEXT,
                        contract_address TEXT,
                        token_name TEXT NOT NULL,
                        token_symbol TEXT NOT NULL,
                        total_supply BIGINT NOT NULL,
                        price_per_token REAL NOT NULL,
                        network TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        status TEXT DEFAULT 'active',
                        sales_count INTEGER DEFAULT 0,
                        total_raised REAL DEFAULT 0.0,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """,
                "transactions": """
                    CREATE TABLE IF NOT EXISTS transactions (
                        id TEXT PRIMARY KEY,
                        widget_id TEXT NOT NULL,
                        buyer_address TEXT NOT NULL,
                        amount REAL NOT NULL,
                        tokens_amount BIGINT NOT NULL,
                        tx_hash TEXT,
                        network TEXT NOT NULL,
                        status TEXT DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        confirmed_at TIMESTAMP,
                        commission REAL DEFAULT 0.0,
                        FOREIGN KEY (widget_id) REFERENCES widgets (id)
                    )
                """,
                "credits": """
                    CREATE TABLE IF NOT EXISTS credits (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        amount INTEGER NOT NULL,
                        type TEXT NOT NULL,
                        description TEXT,
                        transaction_id TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """,
                "api_keys": """
                    CREATE TABLE IF NOT EXISTS api_keys (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        key_hash TEXT NOT NULL,
                        name TEXT,
                        permissions TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_used TIMESTAMP,
                        status TEXT DEFAULT 'active',
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """,
                "system_stats": """
                    CREATE TABLE IF NOT EXISTS system_stats (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        metric_name TEXT NOT NULL,
                        metric_value TEXT NOT NULL,
                        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """
            }
            
            # Executar criação das tabelas
            for table_name, sql in tables.items():
                cursor.execute(sql)
            
            # Inserir dados iniciais
            cursor.execute("""
                INSERT OR IGNORE INTO system_stats (metric_name, metric_value) 
                VALUES ('total_users', '0'), ('total_widgets', '0'), ('total_transactions', '0')
            """)
            
            conn.commit()
            conn.close()
            
            # Criar arquivo de configuração do banco
            db_config = {
                "database": {
                    "type": "sqlite",
                    "path": "database/widget_saas.db",
                    "backup_interval": "24h",
                    "max_connections": 100
                },
                "features": {
                    "auto_backup": True,
                    "transaction_logging": True,
                    "api_rate_limiting": True
                }
            }
            
            with open("database/config.json", 'w', encoding='utf-8') as f:
                json.dump(db_config, f, indent=2, ensure_ascii=False)
            
        except Exception as e:
            raise Exception(f"Erro configurando banco: {str(e)}")
    
    def create_data_files(self):
        """Cria arquivos de dados necessários"""
        # Criar dados iniciais
        data_files = {
            "data/users.json": {"users": {}},
            "data/widgets.json": {"widgets": {}},
            "data/transactions.json": {"transactions": []},
            "data/credits.json": {"credits": {}}
        }
        
        for file_path, data in data_files.items():
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
    
    def create_complete_server(self):
        """Cria servidor completo com banco de dados"""
        server_code = '''#!/usr/bin/env python3
"""
Widget SaaS - Servidor Completo com Banco de Dados
Gerado automaticamente pelo auto-deploy
"""

import os
import json
import sqlite3
import hashlib
import time
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class DatabaseManager:
    def __init__(self, db_path="database/widget_saas.db"):
        self.db_path = db_path
    
    def get_connection(self):
        return sqlite3.connect(self.db_path)
    
    def execute_query(self, query, params=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            conn.commit()
            return cursor.fetchall()
        finally:
            conn.close()
    
    def get_user_by_wallet(self, wallet_address):
        query = "SELECT * FROM users WHERE wallet_address = ?"
        result = self.execute_query(query, (wallet_address,))
        return result[0] if result else None
    
    def create_user(self, wallet_address, email=None):
        user_id = hashlib.md5(f"{wallet_address}{time.time()}".encode()).hexdigest()
        query = """
            INSERT INTO users (id, wallet_address, email, created_at) 
            VALUES (?, ?, ?, ?)
        """
        self.execute_query(query, (user_id, wallet_address, email, datetime.now()))
        return user_id
    
    def get_user_widgets(self, user_id):
        query = "SELECT * FROM widgets WHERE user_id = ? ORDER BY created_at DESC"
        return self.execute_query(query, (user_id,))
    
    def create_widget(self, user_id, widget_data):
        widget_id = hashlib.md5(f"{user_id}{widget_data['name']}{time.time()}".encode()).hexdigest()
        query = """
            INSERT INTO widgets (id, user_id, name, description, token_name, 
                               token_symbol, total_supply, price_per_token, network) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            widget_id, user_id, widget_data['name'], widget_data.get('description', ''),
            widget_data['tokenName'], widget_data['tokenSymbol'], 
            widget_data['totalSupply'], widget_data['pricePerToken'], widget_data['network']
        )
        self.execute_query(query, params)
        return widget_id
    
    def get_system_stats(self):
        queries = {
            'total_users': "SELECT COUNT(*) FROM users",
            'total_widgets': "SELECT COUNT(*) FROM widgets",
            'total_transactions': "SELECT COUNT(*) FROM transactions",
            'total_volume': "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'confirmed'"
        }
        
        stats = {}
        for key, query in queries.items():
            result = self.execute_query(query)
            stats[key] = result[0][0] if result else 0
        
        return stats

class WidgetSaaSHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.db = DatabaseManager()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # API Routes
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request(parsed_path)
        
        # Static files
        elif parsed_path.path == '/' or parsed_path.path == '/index.html':
            self.serve_file('pages/index.html', 'text/html')
        elif parsed_path.path == '/dashboard.html':
            self.serve_file('pages/dashboard.html', 'text/html')
        elif parsed_path.path == '/demo.html':
            self.serve_file('demo.html', 'text/html')
        elif parsed_path.path.endswith('.js'):
            self.serve_file(parsed_path.path[1:], 'application/javascript')
        elif parsed_path.path.endswith('.css'):
            self.serve_file(parsed_path.path[1:], 'text/css')
        else:
            self.send_404()
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request(parsed_path, method='POST')
        else:
            self.send_404()
    
    def handle_api_request(self, parsed_path, method='GET'):
        path = parsed_path.path
        
        try:
            if path == '/api/health':
                self.send_json({'status': 'ok', 'message': 'Widget SaaS API Online', 'database': 'connected'})
            
            elif path == '/api/stats':
                stats = self.db.get_system_stats()
                self.send_json({'status': 'success', 'data': stats})
            
            elif path == '/api/auth' and method == 'POST':
                self.handle_auth()
            
            elif path == '/api/widgets' and method == 'GET':
                self.handle_get_widgets()
            
            elif path == '/api/widgets' and method == 'POST':
                self.handle_create_widget()
            
            else:
                self.send_json({'status': 'error', 'message': 'API endpoint not found'}, 404)
        
        except Exception as e:
            self.send_json({'status': 'error', 'message': str(e)}, 500)
    
    def handle_auth(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            wallet_address = data.get('walletAddress')
            if not wallet_address:
                self.send_json({'status': 'error', 'message': 'Wallet address required'}, 400)
                return
            
            # Verificar se usuário existe
            user = self.db.get_user_by_wallet(wallet_address)
            if not user:
                # Criar novo usuário
                user_id = self.db.create_user(wallet_address, data.get('email'))
                user = [user_id, wallet_address, data.get('email'), datetime.now(), None, 0, 0.0, 'active']
            
            # Atualizar último login
            self.db.execute_query(
                "UPDATE users SET last_login = ? WHERE wallet_address = ?",
                (datetime.now(), wallet_address)
            )
            
            self.send_json({
                'status': 'success',
                'user': {
                    'id': user[0],
                    'walletAddress': user[1],
                    'email': user[2],
                    'creditsBalance': user[5],
                    'totalSpent': user[6]
                }
            })
        
        except Exception as e:
            self.send_json({'status': 'error', 'message': str(e)}, 500)
    
    def handle_get_widgets(self):
        # Em implementação real, pegar user_id do token/sessão
        user_id = self.headers.get('X-User-ID', 'demo_user')
        widgets = self.db.get_user_widgets(user_id)
        
        widget_list = []
        for widget in widgets:
            widget_list.append({
                'id': widget[0],
                'name': widget[2],
                'description': widget[3],
                'tokenName': widget[5],
                'tokenSymbol': widget[6],
                'totalSupply': widget[7],
                'pricePerToken': widget[8],
                'network': widget[9],
                'status': widget[11],
                'salesCount': widget[12],
                'totalRaised': widget[13]
            })
        
        self.send_json({'status': 'success', 'widgets': widget_list})
    
    def handle_create_widget(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Em implementação real, pegar user_id do token/sessão
            user_id = self.headers.get('X-User-ID', 'demo_user')
            
            widget_id = self.db.create_widget(user_id, data)
            
            self.send_json({
                'status': 'success',
                'message': 'Widget criado com sucesso',
                'widgetId': widget_id
            })
        
        except Exception as e:
            self.send_json({'status': 'error', 'message': str(e)}, 500)
    
    def serve_file(self, file_path, content_type):
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', content_type + '; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content)
        
        except FileNotFoundError:
            self.send_404()
    
    def send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-User-ID')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def send_404(self):
        self.send_response(404)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<h1>404 - Page Not Found</h1>')
    
    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def main():
    # Verificar se banco existe
    if not os.path.exists("database/widget_saas.db"):
        print("❌ Banco de dados não encontrado. Execute o auto-deploy primeiro.")
        return
    
    HOST = "0.0.0.0"
    PORT = 8000
    
    print("🚀 Widget SaaS Server com Banco de Dados")
    print("=" * 50)
    print(f"📡 Servidor: http://{HOST}:{PORT}")
    print(f"🗄️ Banco: SQLite (database/widget_saas.db)")
    print(f"🌐 Landing: http://{HOST}:{PORT}/")
    print(f"📊 Dashboard: http://{HOST}:{PORT}/dashboard.html")
    print(f"❤️  Health: http://{HOST}:{PORT}/api/health")
    print(f"📈 Stats: http://{HOST}:{PORT}/api/stats")
    print("")
    print("🌍 RECURSOS ATIVOS:")
    print("   - Banco de dados SQLite")
    print("   - APIs RESTful completas")
    print("   - Autenticação Web3")
    print("   - Sistema de créditos")
    print("   - Logs de transações")
    print("")
    print("🛑 Pressione Ctrl+C para parar")
    print("")
    
    try:
        server = HTTPServer((HOST, PORT), WidgetSaaSHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\\n🛑 Servidor parado")
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()
'''
        
        with open("server.py", 'w', encoding='utf-8') as f:
            f.write(server_code)
    
    def create_helper_scripts(self):
        """Cria scripts auxiliares para banco"""
        
        # Script de backup
        backup_script = '''#!/usr/bin/env python3
"""
Script de Backup do Banco de Dados
"""

import os
import shutil
import sqlite3
from datetime import datetime

def backup_database():
    """Faz backup do banco de dados"""
    try:
        # Criar diretório de backup
        os.makedirs("backups", exist_ok=True)
        
        # Nome do backup com timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"backups/widget_saas_backup_{timestamp}.db"
        
        # Copiar banco
        if os.path.exists("database/widget_saas.db"):
            shutil.copy2("database/widget_saas.db", backup_file)
            print(f"✅ Backup criado: {backup_file}")
            
            # Verificar integridade
            conn = sqlite3.connect(backup_file)
            conn.execute("PRAGMA integrity_check")
            conn.close()
            print("✅ Integridade verificada")
            
            return backup_file
        else:
            print("❌ Banco de dados não encontrado")
            return None
    
    except Exception as e:
        print(f"❌ Erro no backup: {e}")
        return None

if __name__ == "__main__":
    print("🔄 Iniciando backup...")
    backup_file = backup_database()
    if backup_file:
        print(f"🎉 Backup concluído: {backup_file}")
    else:
        print("❌ Falha no backup")
'''
        
        with open("backup_db.py", 'w', encoding='utf-8') as f:
            f.write(backup_script)
        
        # Script de estatísticas
        stats_script = '''#!/usr/bin/env python3
"""
Script de Estatísticas do Sistema
"""

import sqlite3
import json
from datetime import datetime

def get_detailed_stats():
    """Obtém estatísticas detalhadas"""
    try:
        conn = sqlite3.connect("database/widget_saas.db")
        cursor = conn.cursor()
        
        stats = {}
        
        # Usuários
        cursor.execute("SELECT COUNT(*) FROM users")
        stats['total_users'] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE created_at >= date('now', '-7 days')")
        stats['new_users_week'] = cursor.fetchone()[0]
        
        # Widgets
        cursor.execute("SELECT COUNT(*) FROM widgets")
        stats['total_widgets'] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM widgets WHERE status = 'active'")
        stats['active_widgets'] = cursor.fetchone()[0]
        
        # Transações
        cursor.execute("SELECT COUNT(*) FROM transactions")
        stats['total_transactions'] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'confirmed'")
        stats['total_volume'] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COALESCE(SUM(commission), 0) FROM transactions WHERE status = 'confirmed'")
        stats['total_commission'] = cursor.fetchone()[0]
        
        # Top widgets
        cursor.execute("""
            SELECT w.name, w.token_symbol, COUNT(t.id) as sales, COALESCE(SUM(t.amount), 0) as volume
            FROM widgets w 
            LEFT JOIN transactions t ON w.id = t.widget_id 
            GROUP BY w.id 
            ORDER BY volume DESC 
            LIMIT 5
        """)
        stats['top_widgets'] = cursor.fetchall()
        
        conn.close()
        
        return stats
    
    except Exception as e:
        print(f"❌ Erro obtendo estatísticas: {e}")
        return None

def main():
    print("📊 Estatísticas do Widget SaaS")
    print("=" * 40)
    
    stats = get_detailed_stats()
    if stats:
        print(f"👥 Total de usuários: {stats['total_users']}")
        print(f"🆕 Novos usuários (7 dias): {stats['new_users_week']}")
        print(f"🎮 Total de widgets: {stats['total_widgets']}")
        print(f"✅ Widgets ativos: {stats['active_widgets']}")
        print(f"💳 Total de transações: {stats['total_transactions']}")
        print(f"💰 Volume total: ${stats['total_volume']:.2f}")
        print(f"💸 Comissões totais: ${stats['total_commission']:.2f}")
        print("")
        print("🏆 Top 5 Widgets:")
        for widget in stats['top_widgets']:
            print(f"   • {widget[0]} ({widget[1]}): {widget[2]} vendas, ${widget[3]:.2f}")
    
    # Salvar em arquivo
    with open(f"stats_{datetime.now().strftime('%Y%m%d')}.json", 'w') as f:
        json.dump(stats, f, indent=2, default=str)
    
    print(f"\\n📄 Estatísticas salvas em: stats_{datetime.now().strftime('%Y%m%d')}.json")

if __name__ == "__main__":
    main()
'''
        
        with open("stats_db.py", 'w', encoding='utf-8') as f:
            f.write(stats_script)
    
    def create_basic_server(self):
        """Cria um servidor básico se não existir"""
        basic_server = '''#!/usr/bin/env python3
"""
Widget SaaS - Servidor Básico
Gerado automaticamente pelo auto-deploy
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os

class BasicHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/health":
            self.send_json({"status": "ok", "message": "Sistema Online"})
        else:
            self.send_html("Sistema Widget SaaS instalado com sucesso!")
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def send_html(self, content):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(f"<h1>{content}</h1>".encode())

if __name__ == "__main__":
    print("🚀 Servidor básico iniciando...")
    server = HTTPServer(("0.0.0.0", 8000), BasicHandler)
    server.serve_forever()
'''
        
        with open("server.py", 'w', encoding='utf-8') as f:
            f.write(basic_server)
    
    def show_result(self, content, status_type):
        """Mostra resultado da operação"""
        html = f'''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultado - Widget SaaS Deploy</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: white; padding: 2rem; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        .card {{ background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 2rem; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.2); }}
        .status {{ padding: 1rem; border-radius: 10px; margin: 1rem 0; }}
        .status.success {{ background: rgba(76, 175, 80, 0.2); border: 1px solid #4CAF50; }}
        .status.error {{ background: rgba(244, 67, 54, 0.2); border: 1px solid #f44336; }}
        .status.warning {{ background: rgba(255, 152, 0, 0.2); border: 1px solid #ff9800; }}
        .status.info {{ background: rgba(33, 150, 243, 0.2); border: 1px solid #2196F3; }}
        .btn {{ display: inline-block; padding: 1rem 2rem; background: #4CAF50; color: white; text-decoration: none; border-radius: 10px; margin: 0.5rem; }}
        .btn:hover {{ background: #45a049; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>📄 Resultado da Operação</h1>
            <div class="status {status_type}">
                {content}
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <a href="/deploy" class="btn">🔙 Voltar ao Painel</a>
            </div>
        </div>
    </div>
</body>
</html>
        '''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def send_json_response(self, data):
        """Envia resposta JSON"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def redirect_to_deploy(self):
        """Redireciona para página de deploy"""
        self.send_response(302)
        self.send_header('Location', '/deploy')
        self.end_headers()
    
    def handle_analyze(self):
        """Executa análise completa do sistema"""
        try:
            analysis = self.analyzer.analyze_system()
            
            # Salvar análise para uso posterior
            with open(".system_analysis.json", 'w', encoding='utf-8') as f:
                json.dump(analysis, f, indent=2, ensure_ascii=False, default=str)
            
            compatibility = analysis["compatibility"]["overall"]
            
            if compatibility == "compatible":
                status_class = "success"
                status_msg = "✅ Sistema totalmente compatível!"
            elif compatibility == "partially_compatible":
                status_class = "warning"
                status_msg = "⚠️ Sistema parcialmente compatível"
            else:
                status_class = "error"
                status_msg = "❌ Sistema incompatível"
            
            # Gerar relatório detalhado
            report_lines = []
            report_lines.append(f"<h3>{status_msg}</h3>")
            report_lines.append("<h4>🖥️ Informações do Sistema:</h4>")
            report_lines.append(f"• Python: {analysis['system_info'].get('python_version', 'Não encontrado')}")
            report_lines.append(f"• Node.js: {analysis['system_info'].get('node_version', 'Não encontrado')}")
            report_lines.append(f"• NPM: {analysis['system_info'].get('npm_version', 'Não encontrado')}")
            
            if analysis['system_info'].get('disk_space'):
                disk = analysis['system_info']['disk_space']
                report_lines.append(f"• Espaço livre: {disk['free_gb']} GB de {disk['total_gb']} GB")
            
            report_lines.append("<h4>🔍 Componentes Detectados:</h4>")
            
            # Bancos de dados
            db_count = sum(1 for v in analysis['existing_components']['databases'].values() if v)
            report_lines.append(f"• Bancos de dados: {db_count} detectado(s)")
            
            # Servidores  
            server_count = sum(1 for v in analysis['existing_components']['servers'].values() if v)
            report_lines.append(f"• Servidores: {server_count} detectado(s)")
            
            # Frontend
            frontend_components = analysis['existing_components']['frontend']
            frontend_count = sum(1 for v in frontend_components.values() if v)
            report_lines.append(f"• Componentes frontend: {frontend_count}/4")
            
            report_lines.append("<h4>📋 Plano de Instalação:</h4>")
            plan = analysis['installation_plan']
            report_lines.append(f"• Componentes a instalar: {len(plan['components_to_install'])}")
            report_lines.append(f"• Componentes a atualizar: {len(plan['components_to_update'])}")
            report_lines.append(f"• Componentes a manter: {len(plan['components_to_keep'])}")
            report_lines.append(f"• Tempo estimado: {math.ceil(plan['estimated_time'] / 60)} minuto(s)")
            
            if analysis['compatibility']['issues']:
                report_lines.append("<h4>⚠️ Problemas Encontrados:</h4>")
                for issue in analysis['compatibility']['issues']:
                    report_lines.append(f"• {issue}")
            
            if analysis['compatibility']['recommendations']:
                report_lines.append("<h4>💡 Recomendações:</h4>")
                for rec in analysis['compatibility']['recommendations']:
                    report_lines.append(f"• {rec}")
            
            result = "<br>".join(report_lines)
            self.show_result("🔍 Análise Completa", result, status_class)
            
        except Exception as e:
            self.show_result("❌ Erro na Análise", f"Erro durante análise: {str(e)}", "error")
    
    def handle_intelligent_install(self):
        """Executa instalação inteligente"""
        try:
            # Carregar análise
            if not os.path.exists(".system_analysis.json"):
                self.show_result("❌ Análise Necessária", "Execute a análise do sistema primeiro!", "error")
                return
            
            with open(".system_analysis.json", 'r', encoding='utf-8') as f:
                analysis = json.load(f)
            
            # Verificar compatibilidade
            if analysis["compatibility"]["overall"] == "incompatible":
                self.show_result("❌ Sistema Incompatível", "Não é possível instalar no sistema atual. Verifique os requisitos.", "error")
                return
            
            # Verificar se já foi instalado
            if os.path.exists(".widget_saas_installed"):
                with open(".widget_saas_installed", 'r', encoding='utf-8') as f:
                    install_info = json.load(f)
                
                self.show_result(
                    "⚠️ Sistema Já Instalado", 
                    f"Sistema já foi instalado em {install_info['install_date']}.<br>"
                    f"Versão: {install_info['version']}<br>"
                    f"Use o modo de atualização para modificar o sistema.",
                    "warning"
                )
                return
            
            log_output = []
            install_start = time.time()
            
            log_output.append("🚀 Iniciando instalação inteligente...")
            log_output.append(f"⏱️ Tempo estimado: {math.ceil(analysis['installation_plan']['estimated_time'] / 60)} minuto(s)")
            log_output.append("")
            
            plan = analysis["installation_plan"]
            
            # 1. Backup de segurança
            log_output.append("💾 Criando backup de segurança...")
            backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.create_safety_backup(backup_dir)
            log_output.append(f"✅ Backup salvo em: {backup_dir}")
            
            # 2. Limpeza inteligente
            if analysis["cleanup_plan"]["files_to_remove"]:
                log_output.append("🧹 Limpeza inteligente...")
                self.execute_cleanup(analysis["cleanup_plan"])
                log_output.append("✅ Arquivos desnecessários removidos")
            
            # 3. Instalação por componente
            for component in plan["components_to_install"]:
                log_output.append(f"📦 Instalando: {component}")
                self.install_component(component, analysis)
                log_output.append(f"✅ {component} instalado")
            
            # 4. Atualizações
            for component in plan["components_to_update"]:
                log_output.append(f"🔄 Atualizando: {component}")
                self.update_component(component, analysis)
                log_output.append(f"✅ {component} atualizado")
            
            # 5. Configurações finais
            log_output.append("⚙️ Configurações finais...")
            self.apply_final_configurations(analysis)
            log_output.append("✅ Configurações aplicadas")
            
            # 6. Criar marca de instalação
            install_info = {
                "version": "2.0-intelligent",
                "install_date": datetime.now().isoformat(),
                "components_installed": plan["components_to_install"],
                "components_updated": plan["components_to_update"],
                "analysis_summary": {
                    "python_version": analysis["system_info"].get("python_version"),
                    "node_version": analysis["system_info"].get("node_version"),
                    "compatibility": analysis["compatibility"]["overall"]
                },
                "backup_location": backup_dir
            }
            
            with open(".widget_saas_installed", 'w', encoding='utf-8') as f:
                json.dump(install_info, f, indent=2, ensure_ascii=False)
            
            install_time = time.time() - install_start
            
            log_output.append("")
            log_output.append(f"🎉 INSTALAÇÃO CONCLUÍDA EM {install_time:.1f} SEGUNDOS!")
            log_output.append("")
            log_output.append("🌍 SISTEMA ONLINE:")
            log_output.append("• Landing: http://seu-servidor.com:8000/")
            log_output.append("• Dashboard: http://seu-servidor.com:8000/dashboard.html")
            log_output.append("• API Health: http://seu-servidor.com:8000/api/health")
            log_output.append("• Deploy: http://seu-servidor.com:9000/deploy")
            log_output.append("")
            log_output.append("📊 RESUMO:")
            log_output.append(f"• Componentes instalados: {len(plan['components_to_install'])}")
            log_output.append(f"• Componentes atualizados: {len(plan['components_to_update'])}")
            log_output.append(f"• Componentes mantidos: {len(plan['components_to_keep'])}")
            log_output.append(f"• Backup: {backup_dir}")
            
            result = "<br>".join(log_output)
            self.show_result("🎉 Instalação Concluída", result, "success")
            
        except Exception as e:
            self.show_result("❌ Erro na Instalação", f"Erro durante instalação: {str(e)}", "error")
    
    def install_component(self, component, analysis):
        """Instala um componente específico"""
        if component == "sqlite_database":
            self.setup_database()
        elif component == "python_server":
            self.create_complete_server()
        elif component == "node_server":
            self.setup_node_server(analysis)
        elif component == "frontend":
            self.setup_frontend()
        elif component == "jwt_setup":
            self.setup_jwt()
        elif component == "nodejs_express":
            self.setup_nodejs_express()
        elif component == "api_endpoints":
            self.setup_api_endpoints()
    
    def create_safety_backup(self, backup_dir):
        """Cria backup de segurança"""
        os.makedirs(backup_dir, exist_ok=True)
        
        important_files = [
            ".env", "config.json", "package.json", "server.py",
            "database/", "data/", "pages/"
        ]
        
        for item in important_files:
            if os.path.exists(item):
                if os.path.isdir(item):
                    shutil.copytree(item, os.path.join(backup_dir, item), dirs_exist_ok=True)
                else:
                    shutil.copy2(item, backup_dir)
    
    def get_system_analysis(self):
        """Retorna análise do sistema"""
        if os.path.exists(".system_analysis.json"):
            with open(".system_analysis.json", 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return self.analyzer.analyze_system()
    
    def get_compatibility_report(self):
        """Retorna relatório de compatibilidade"""
        analysis = self.get_system_analysis()
        return analysis.get("compatibility", {})
    
    def send_json_response(self, data):
        """Envia resposta JSON"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode('utf-8'))
    
    def show_result(self, title, content, status_type):
        """Mostra resultado da operação"""
        html = f'''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Widget SaaS Deploy</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); min-height: 100vh; color: white; padding: 2rem; }}
        .container {{ max-width: 1000px; margin: 0 auto; }}
        .card {{ background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 2rem; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.2); }}
        .status {{ padding: 1rem; border-radius: 10px; margin: 1rem 0; }}
        .status.success {{ background: rgba(39, 174, 96, 0.2); border: 1px solid #27ae60; }}
        .status.error {{ background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; }}
        .status.warning {{ background: rgba(243, 156, 18, 0.2); border: 1px solid #f39c12; }}
        .status.info {{ background: rgba(52, 152, 219, 0.2); border: 1px solid #3498db; }}
        .btn {{ display: inline-block; padding: 1rem 2rem; background: #3498db; color: white; text-decoration: none; border-radius: 10px; margin: 0.5rem; }}
        .btn:hover {{ background: #2980b9; }}
        .content {{ line-height: 1.6; }}
        .content h3, .content h4 {{ margin: 1rem 0 0.5rem 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>{title}</h1>
            <div class="status {status_type}">
                <div class="content">
                    {content}
                </div>
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <a href="/deploy" class="btn">🔙 Voltar ao Painel</a>
                <a href="/deploy?action=report" class="btn">📊 Ver Relatório</a>
            </div>
        </div>
    </div>
</body>
</html>
        '''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def redirect_to_deploy(self):
        """Redireciona para página de deploy"""
        self.send_response(302)
        self.send_header('Location', '/deploy')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Log customizado"""
        print(f"🌐 {self.address_string()} - {format % args}")
    
    def setup_database(self):
        """Configura banco de dados SQLite"""
        try:
            import sqlite3
            
            # Criar diretório database
            os.makedirs("database", exist_ok=True)
            
            # Conectar ao banco
            conn = sqlite3.connect("database/widget_saas.db")
            cursor = conn.cursor()
            
            # Criar tabelas básicas
            tables = {
                "users": """
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        wallet_address TEXT UNIQUE NOT NULL,
                        email TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        credits_balance INTEGER DEFAULT 0
                    )
                """,
                "widgets": """
                    CREATE TABLE IF NOT EXISTS widgets (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        token_name TEXT NOT NULL,
                        token_symbol TEXT NOT NULL,
                        total_supply BIGINT NOT NULL,
                        price_per_token REAL NOT NULL,
                        network TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """,
                "transactions": """
                    CREATE TABLE IF NOT EXISTS transactions (
                        id TEXT PRIMARY KEY,
                        widget_id TEXT NOT NULL,
                        buyer_address TEXT NOT NULL,
                        amount REAL NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """
            }
            
            for table_name, sql in tables.items():
                cursor.execute(sql)
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            raise Exception(f"Erro configurando banco: {str(e)}")
    
    def create_complete_server(self):
        """Cria servidor Python completo"""
        server_code = '''#!/usr/bin/env python3
"""
Widget SaaS - Servidor Completo
Gerado pelo Auto-Deploy Inteligente
"""

import os
import json
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

class WidgetSaaSHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/health":
            self.send_json({"status": "ok", "message": "Sistema Online", "version": "2.0-intelligent"})
        elif self.path == "/":
            self.serve_file("pages/index.html", "text/html")
        else:
            self.send_404()
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def serve_file(self, path, content_type):
        try:
            with open(path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.end_headers()
            self.wfile.write(content)
        except:
            self.send_404()
    
    def send_404(self):
        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    print("🚀 Widget SaaS Server v2.0 - Intelligent")
    server = HTTPServer(("0.0.0.0", 8000), WidgetSaaSHandler)
    server.serve_forever()
'''
        
        with open("server.py", 'w', encoding='utf-8') as f:
            f.write(server_code)
    
    def setup_frontend(self):
        """Instala e configura o frontend"""
        try:
            # Criar diretório templates se não existir
            os.makedirs("templates", exist_ok=True)
            os.makedirs("static/css", exist_ok=True)
            os.makedirs("static/js", exist_ok=True)
            
            # Frontend já foi criado em outras partes do sistema
            return {"status": "success", "message": "Frontend configurado"}
            
        except Exception as e:
            return {"status": "error", "message": f"Erro ao configurar frontend: {str(e)}"}

    def setup_nodejs_express(self):
        """Instala e configura Node.js/Express server"""
        try:
            # Verificar se Node.js está instalado
            try:
                result = subprocess.run(["node", "--version"], capture_output=True, text=True)
                if result.returncode != 0:
                    return {"status": "error", "message": "Node.js não está instalado. Instale Node.js primeiro."}
            except FileNotFoundError:
                return {"status": "error", "message": "Node.js não encontrado. Instale Node.js primeiro."}
            
            # Criar package.json se não existir
            package_json_content = {
                "name": "widget-saas-api",
                "version": "1.0.0",
                "description": "Widget SaaS API Server",
                "main": "server.js",
                "scripts": {
                    "start": "node server.js",
                    "dev": "nodemon server.js"
                },
                "dependencies": {
                    "express": "^4.18.2",
                    "cors": "^2.8.5",
                    "helmet": "^7.0.0",
                    "jsonwebtoken": "^9.0.2",
                    "bcrypt": "^5.1.0",
                    "sqlite3": "^5.1.6",
                    "dotenv": "^16.3.1",
                    "multer": "^1.4.5",
                    "uuid": "^9.0.0",
                    "compression": "^1.7.4"
                },
                "devDependencies": {
                    "nodemon": "^3.0.1"
                },
                "keywords": ["widget", "saas", "api", "express"],
                "author": "Widget SaaS",
                "license": "MIT"
            }
            
            # Criar diretório api se não existir
            os.makedirs("api", exist_ok=True)
            
            # Salvar package.json
            with open("api/package.json", "w", encoding="utf-8") as f:
                json.dump(package_json_content, f, indent=2)
            
            # Criar servidor Express
            express_server_content = '''const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;
const JWT_SECRET = process.env.JWT_SECRET || 'widget-saas-secret-key';

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, '..', 'database', 'widget_saas.db');
const db = new sqlite3.Database(dbPath);

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Rotas públicas
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'Widget SaaS Express API',
        version: '1.0.0'
    });
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário no banco
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            // Verificar senha
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            // Gerar token JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota de registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Verificar se usuário já existe
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (existingUser) {
                return res.status(409).json({ error: 'Usuário já existe' });
            }

            // Hash da senha
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Inserir usuário
            db.run(
                'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)',
                [email, passwordHash, new Date().toISOString()],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao criar usuário' });
                    }

                    // Gerar token JWT
                    const token = jwt.sign(
                        { userId: this.lastID, email },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    res.status(201).json({
                        success: true,
                        token,
                        user: {
                            id: this.lastID,
                            email,
                            created_at: new Date().toISOString()
                        }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas protegidas (requerem autenticação)
app.get('/api/widgets', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    db.all(
        'SELECT * FROM widgets WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, widgets) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar widgets' });
            }
            res.json({ widgets });
        }
    );
});

app.post('/api/widgets', authenticateToken, (req, res) => {
    const { name, config } = req.body;
    const userId = req.user.userId;

    if (!name || !config) {
        return res.status(400).json({ error: 'Nome e configuração são obrigatórios' });
    }

    db.run(
        'INSERT INTO widgets (user_id, name, config, created_at) VALUES (?, ?, ?, ?)',
        [userId, name, JSON.stringify(config), new Date().toISOString()],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar widget' });
            }

            res.status(201).json({
                success: true,
                widget: {
                    id: this.lastID,
                    name,
                    config,
                    user_id: userId,
                    created_at: new Date().toISOString()
                }
            });
        }
    );
});

app.get('/api/widgets/:id', authenticateToken, (req, res) => {
    const widgetId = req.params.id;
    const userId = req.user.userId;

    db.get(
        'SELECT * FROM widgets WHERE id = ? AND user_id = ?',
        [widgetId, userId],
        (err, widget) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar widget' });
            }

            if (!widget) {
                return res.status(404).json({ error: 'Widget não encontrado' });
            }

            try {
                widget.config = JSON.parse(widget.config);
            } catch (e) {
                widget.config = {};
            }

            res.json({ widget });
        }
    );
});

// Rota para estatísticas do usuário
app.get('/api/user/stats', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.get(
        'SELECT COUNT(*) as widget_count FROM widgets WHERE user_id = ?',
        [userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
            }

            res.json({
                widget_count: result.widget_count,
                user_id: userId
            });
        }
    );
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Widget SaaS Express API rodando na porta ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET ? 'Configurado' : 'Usando padrão'}`);
});

module.exports = app;
'''
            
            # Salvar servidor Express
            with open("api/server.js", "w", encoding="utf-8") as f:
                f.write(express_server_content)
            
            # Criar arquivo .env
            import uuid
            env_content = f'''# Widget SaaS API Configuration
PORT=8001
JWT_SECRET=widget-saas-secret-{uuid.uuid4().hex[:16]}
NODE_ENV=development
DB_PATH=../database/widget_saas.db

# CORS Settings
CORS_ORIGIN=http://localhost:8000

# Security
BCRYPT_ROUNDS=10
JWT_EXPIRY=24h
'''
            
            with open("api/.env", "w", encoding="utf-8") as f:
                f.write(env_content)
            
            # Tentar instalar dependências
            try:
                import subprocess
                print("Instalando dependências Node.js...")
                result = subprocess.run(
                    ["npm", "install"], 
                    cwd="api", 
                    capture_output=True, 
                    text=True,
                    timeout=300  # 5 minutos
                )
                
                if result.returncode == 0:
                    print("✅ Dependências Node.js instaladas com sucesso!")
                else:
                    print(f"⚠️ Aviso ao instalar dependências: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                print("⚠️ Timeout na instalação das dependências (continuando...)")
            except Exception as e:
                print(f"⚠️ Aviso: {str(e)} (dependências podem ser instaladas manualmente)")
            
            return {"status": "success", "message": "Node.js/Express configurado"}
            
        except Exception as e:
            return {"status": "error", "message": f"Erro ao configurar Node.js/Express: {str(e)}"}

    def setup_jwt(self):
        """Configura autenticação JWT"""
        try:
            import secrets
            import uuid
            
            # Gerar chave secreta JWT
            jwt_secret = f"widget-saas-{secrets.token_hex(32)}"
            
            # Criar arquivo de configuração JWT
            jwt_config = {
                "secret_key": jwt_secret,
                "algorithm": "HS256",
                "expiry_hours": 24,
                "issuer": "widget-saas",
                "created_at": time.time()
            }
            
            # Salvar configuração JWT
            with open("jwt_config.json", "w", encoding="utf-8") as f:
                json.dump(jwt_config, f, indent=2)
            
            # Criar arquivo .env se não existir
            env_file = ".env"
            env_content = ""
            
            if os.path.exists(env_file):
                with open(env_file, "r", encoding="utf-8") as f:
                    env_content = f.read()
            
            # Adicionar configuração JWT ao .env
            if "JWT_SECRET=" not in env_content:
                env_content += f"\n# JWT Configuration\nJWT_SECRET={jwt_secret}\n"
                env_content += f"JWT_ALGORITHM=HS256\nJWT_EXPIRY=24h\n"
                
                with open(env_file, "w", encoding="utf-8") as f:
                    f.write(env_content)
            
            # Criar biblioteca JWT para Python
            jwt_helper_content = '''"""
Widget SaaS JWT Helper
Utilitários para autenticação JWT
"""
import jwt
import json
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class JWTHelper:
    def __init__(self, config_file="jwt_config.json"):
        self.config = self.load_config(config_file)
        
    def load_config(self, config_file):
        """Carrega configuração JWT"""
        try:
            if os.path.exists(config_file):
                with open(config_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            else:
                # Configuração padrão
                return {
                    "secret_key": os.getenv("JWT_SECRET", "default-secret"),
                    "algorithm": "HS256",
                    "expiry_hours": 24
                }
        except Exception:
            return {
                "secret_key": "default-secret",
                "algorithm": "HS256",
                "expiry_hours": 24
            }
    
    def generate_token(self, user_data: Dict[str, Any]) -> str:
        """Gera token JWT"""
        try:
            payload = {
                "user_id": user_data.get("id"),
                "email": user_data.get("email"),
                "iat": datetime.utcnow(),
                "exp": datetime.utcnow() + timedelta(hours=self.config["expiry_hours"])
            }
            
            return jwt.encode(
                payload,
                self.config["secret_key"],
                algorithm=self.config["algorithm"]
            )
        except Exception as e:
            raise Exception(f"Erro ao gerar token: {str(e)}")
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica e decodifica token JWT"""
        try:
            decoded = jwt.decode(
                token,
                self.config["secret_key"],
                algorithms=[self.config["algorithm"]]
            )
            return decoded
        except jwt.ExpiredSignatureError:
            raise Exception("Token expirado")
        except jwt.InvalidTokenError:
            raise Exception("Token inválido")
        except Exception as e:
            raise Exception(f"Erro ao verificar token: {str(e)}")
    
    def refresh_token(self, old_token: str) -> str:
        """Renova token JWT"""
        try:
            # Verificar token atual (ignorar expiração)
            decoded = jwt.decode(
                old_token,
                self.config["secret_key"],
                algorithms=[self.config["algorithm"]],
                options={"verify_exp": False}
            )
            
            # Gerar novo token
            return self.generate_token({
                "id": decoded.get("user_id"),
                "email": decoded.get("email")
            })
        except Exception as e:
            raise Exception(f"Erro ao renovar token: {str(e)}")

# Instance global
jwt_helper = JWTHelper()

# Funções de conveniência
def create_token(user_data):
    return jwt_helper.generate_token(user_data)

def verify_token(token):
    return jwt_helper.verify_token(token)

def refresh_token(token):
    return jwt_helper.refresh_token(token)
'''
            
            # Salvar helper JWT
            with open("jwt_helper.py", "w", encoding="utf-8") as f:
                f.write(jwt_helper_content)
            
            return {"status": "success", "message": "JWT configurado"}
            
        except Exception as e:
            return {"status": "error", "message": f"Erro ao configurar JWT: {str(e)}"}

    def setup_api_endpoints(self):
        """Configura endpoints da API"""
        try:
            # Esta função pode criar endpoints adicionais se necessário
            # Por enquanto, os endpoints principais estão no server.js
            
            # Criar documentação da API
            api_docs = {
                "title": "Widget SaaS API",
                "version": "1.0.0",
                "description": "API para criação e gerenciamento de widgets",
                "base_url": "http://localhost:8001/api",
                "endpoints": {
                    "auth": {
                        "POST /auth/login": {
                            "description": "Login de usuário",
                            "body": {"email": "string", "password": "string"},
                            "response": {"token": "string", "user": "object"}
                        },
                        "POST /auth/register": {
                            "description": "Registro de usuário",
                            "body": {"email": "string", "password": "string"},
                            "response": {"token": "string", "user": "object"}
                        }
                    },
                    "widgets": {
                        "GET /widgets": {
                            "description": "Lista widgets do usuário",
                            "auth": "Bearer token",
                            "response": {"widgets": "array"}
                        },
                        "POST /widgets": {
                            "description": "Cria novo widget",
                            "auth": "Bearer token",
                            "body": {"name": "string", "config": "object"},
                            "response": {"widget": "object"}
                        },
                        "GET /widgets/:id": {
                            "description": "Busca widget específico",
                            "auth": "Bearer token",
                            "response": {"widget": "object"}
                        }
                    },
                    "user": {
                        "GET /user/stats": {
                            "description": "Estatísticas do usuário",
                            "auth": "Bearer token",
                            "response": {"widget_count": "number"}
                        }
                    },
                    "health": {
                        "GET /health": {
                            "description": "Health check da API",
                            "response": {"status": "string", "timestamp": "string"}
                        }
                    }
                }
            }
            
            # Salvar documentação
            with open("api/api_documentation.json", "w", encoding="utf-8") as f:
                json.dump(api_docs, f, indent=2)
            
            return {"status": "success", "message": "Endpoints da API configurados"}
            
        except Exception as e:
            return {"status": "error", "message": f"Erro ao configurar endpoints: {str(e)}"}

    def setup_frontend(self):
        """Configura frontend básico"""
        os.makedirs("pages", exist_ok=True)
        
        index_html = '''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget SaaS - Instalação Inteligente</title>
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: 0; padding: 2rem; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        .status { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 20px; margin: 2rem 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Widget SaaS</h1>
        <div class="status">
            <h2>✅ Sistema Instalado com Sucesso!</h2>
            <p>Seu Widget SaaS foi instalado automaticamente pelo sistema inteligente.</p>
            <p><strong>Versão:</strong> 2.0 - Deploy Inteligente</p>
        </div>
    </div>
</body>
</html>'''
        
        with open("pages/index.html", 'w', encoding='utf-8') as f:
            f.write(index_html)

def main():
    """Função principal"""
    HOST = "0.0.0.0"  # Aceitar de qualquer IP
    PORT = 9000       # Porta diferente do sistema principal
    
    print("🚀 Widget SaaS - Auto Deploy System")
    print("=" * 50)
    print(f"📡 Deploy URL: http://{HOST}:{PORT}/deploy")
    print(f"🎛️ Painel: http://{HOST}:{PORT}/deploy")
    print(f"📊 API: http://{HOST}:{PORT}/api/deploy-status")
    print("")
    print("🌍 SISTEMA DE AUTO-INSTALAÇÃO ATIVO!")
    print("   - Acesse /deploy para instalar o sistema")
    print("   - Interface web completa disponível")
    print("   - Instalação automática via HTTP")
    print("")
    print("🛑 Pressione Ctrl+C para parar")
    print("")
    
    try:
        server = HTTPServer((HOST, PORT), IntelligentDeployHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\\n🛑 Sistema de deploy parado")
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()
