#!/usr/bin/env python3
"""
XCafe Widget Server - Versão Simplificada para Teste de API
Servidor HTTP para o widget XCafe com API endpoints básicos
"""

import os
import sys
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
import datetime
import time
from pathlib import Path

# Configurar logging simples
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

class XCafeRequestHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.start_time = time.time()
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        """Override para usar nosso sistema de logging"""
        logging.info(f"[{self.client_address[0]}] {format % args}")

    def send_cors_headers(self):
        """Envia headers CORS e de segurança"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '3600')
        
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        self.send_header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:")

    def send_error_response(self, status_code, message):
        """Envia resposta de erro em JSON"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        error_response = {
            'error': True,
            'message': message,
            'status_code': status_code,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        self.wfile.write(json.dumps(error_response, indent=2).encode())

    def send_json_response(self, data, status_code=200):
        """Envia resposta JSON"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        response_data = {
            'success': True,
            'data': data,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        self.wfile.write(json.dumps(response_data, indent=2).encode())

    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path[1:] if parsed_url.path.startswith('/') else parsed_url.path
            
            print(f"GET request: {path}")  # Debug log
            
            if path.startswith('api/'):
                print(f"API endpoint detected: {path}")  # Debug log
                self.handle_api_get(path)
            else:
                print(f"Static file request: {path}")  # Debug log
                self.serve_static_file(path)
        except Exception as e:
            print(f"GET error: {e}")
            self.send_error_response(500, f"Internal error: {str(e)}")

    def handle_api_get(self, path):
        """Handle API GET requests"""
        try:
            if path == 'api/health':
                uptime = time.time() - self.start_time
                health_data = {
                    'status': 'healthy',
                    'uptime_seconds': round(uptime, 2),
                    'version': '3.0.0',
                    'timestamp': datetime.datetime.now().isoformat(),
                    'server': 'XCafe Widget Server'
                }
                self.send_json_response(health_data)
                
            elif path == 'api/stats':
                stats_data = {
                    'server_info': {
                        'name': 'XCafe Widget Server',
                        'version': '3.0.0',
                        'python_version': sys.version,
                        'platform': sys.platform
                    },
                    'runtime_stats': {
                        'uptime_seconds': round(time.time() - self.start_time, 2),
                        'memory_usage': 'N/A (simplified version)',
                        'cpu_usage': 'N/A (simplified version)'
                    },
                    'api_endpoints': [
                        '/api/health',
                        '/api/stats',
                        '/api/version'
                    ]
                }
                self.send_json_response(stats_data)
                
            elif path == 'api/version':
                version_data = {
                    'version': '3.0.0',
                    'build_date': '2025-09-09',
                    'features': [
                        'Theme System',
                        'Responsive Design',
                        'Loading States',
                        'API Endpoints'
                    ]
                }
                self.send_json_response(version_data)
                
            else:
                self.send_error_response(404, f"API endpoint not found: {path}")
                
        except Exception as e:
            logging.error(f"API error in {path}: {e}")
            self.send_error_response(500, f"API error: {str(e)}")

    def serve_static_file(self, path):
        """Serve static files"""
        try:
            if path == '' or path == '/':
                path = 'index.html'
            
            # Sanitize path
            path = path.replace('..', '').strip('/')
            file_path = Path(path)
            
            print(f"Trying to serve file: {file_path}")  # Debug log
            
            if not file_path.exists():
                self.send_error_response(404, f"File not found: {path}")
                return
            
            # Determine content type
            suffix = file_path.suffix.lower()
            content_types = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon'
            }
            
            content_type = content_types.get(suffix, 'text/plain')
            
            # Read and serve file
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Content-length', str(len(content)))
            self.send_cors_headers()
            self.end_headers()
            
            self.wfile.write(content)
            
        except Exception as e:
            logging.error(f"Static file error for {path}: {e}")
            self.send_error_response(500, f"File serve error: {str(e)}")

def main():
    try:
        # Mudar para o diretório do script
        script_dir = Path(__file__).parent
        os.chdir(script_dir)
        
        # Garantir que o diretório de logs existe
        os.makedirs('logs', exist_ok=True)
        
        # Configurar servidor
        port = int(os.environ.get('PORT', 8080))
        server_address = ('0.0.0.0', port)
        httpd = HTTPServer(server_address, XCafeRequestHandler)
        
        print(f"🚀 XCafe Widget Server (Simplified) iniciado em http://localhost:{port}")
        print(f"📊 API endpoints disponíveis:")
        print(f"   - http://localhost:{port}/api/health")
        print(f"   - http://localhost:{port}/api/stats")
        print(f"   - http://localhost:{port}/api/version")
        print(f"🎯 Diretório de trabalho: {os.getcwd()}")
        print(f"📁 Servindo arquivos de: {Path.cwd()}")
        print(f"⏰ Servidor iniciado em: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("🔄 Pressione Ctrl+C para parar o servidor\n")
        
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Servidor interrompido pelo usuário")
        httpd.server_close()
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        logging.error(f"Server startup error: {e}")

if __name__ == '__main__':
    main()
