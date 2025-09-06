#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import hashlib
import secrets
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes

# Imports Web3
try:
    import jwt
    from eth_account.messages import encode_defunct
    from eth_account import Account
    WEB3_AVAILABLE = True
    print("✅ Web3 dependencies loaded successfully")
except ImportError as e:
    WEB3_AVAILABLE = False
    print(f"⚠️ Web3 dependencies not found: {e}")

# JWT Secret
SECRET_KEY = "xcafe_secret_2024_web3_auth"

class WidgetSaaSHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.data_dir = "data"
        super().__init__(*args, **kwargs)

    def verify_signature(self, address, message, signature):
        if not WEB3_AVAILABLE:
            return True  # Dev mode
        try:
            message_hash = encode_defunct(text=message)
            recovered_address = Account.recover_message(message_hash, signature=signature)
            return recovered_address.lower() == address.lower()
        except Exception as e:
            print(f"Signature verification error: {e}")
            return False

    def generate_jwt_token(self, address, user_type):
        if not WEB3_AVAILABLE:
            return f"temp_token_{secrets.token_hex(16)}"
        try:
            payload = {
                'address': address.lower(),
                'userType': user_type,
                'exp': datetime.utcnow() + timedelta(hours=24),
                'iat': datetime.utcnow()
            }
            return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        except Exception as e:
            print(f"JWT generation error: {e}")
            return f"temp_token_{secrets.token_hex(16)}"

    def verify_jwt_token(self, token):
        if not WEB3_AVAILABLE:
            return {"address": "dev_mode", "userType": "Super Admin"}
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            return payload
        except Exception as e:
            print(f"Invalid token: {e}")
            return None

    def get_user_type(self, address):
        address = address.lower()
        try:
            with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                admins = json.load(f)
            if address in admins:
                if admins[address].get('active', True):
                    return admins[address]['userType']
                else:
                    return "inactive"
        except:
            pass
        
        if self.is_first_admin():
            return "first_admin"
        return "normal"

    def is_first_admin(self):
        try:
            with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                admins = json.load(f)
                return len(admins) == 0
        except:
            return True

    def authenticate_wallet(self, data):
        try:
            address = data.get('address', '').lower()
            message = data.get('message', '')
            signature = data.get('signature', '')
            timestamp = data.get('timestamp', 0)
            
            if not self.verify_signature(address, message, signature):
                return {"success": False, "error": "Invalid signature"}
            
            if abs(time.time() * 1000 - timestamp) > 300000:
                return {"success": False, "error": "Expired token"}
            
            user_type = self.get_user_type(address)
            token = self.generate_jwt_token(address, user_type)
            
            return {
                "success": True,
                "address": address,
                "userType": user_type,
                "token": token,
                "permissions": []
            }
        except Exception as e:
            return {"success": False, "error": f"Authentication error: {str(e)}"}

    def setup_first_admin(self, data):
        try:
            address = data.get('address', '').lower()
            
            if not self.is_first_admin():
                return {"success": False, "error": "System already configured"}
            
            os.makedirs(self.data_dir, exist_ok=True)
            
            admin_data = {
                address: {
                    "address": address,
                    "userType": "Super Admin",
                    "name": "Super Administrator",
                    "department": "System",
                    "permissions": ["full_access", "system_reset"],
                    "addedBy": "system",
                    "addedAt": datetime.now().isoformat(),
                    "active": True
                }
            }
            
            with open(f'{self.data_dir}/admins.json', 'w', encoding='utf-8') as f:
                json.dump(admin_data, f, indent=2, ensure_ascii=False)
            
            print(f"🚀 System configured with Super Admin: {address}")
            
            return {
                "success": True,
                "message": "System configured successfully",
                "admin": admin_data[address]
            }
        except Exception as e:
            return {"success": False, "error": f"Setup error: {str(e)}"}

    def create_admin_web3(self, data):
        try:
            token = data.get('token')
            if not token:
                return {"success": False, "error": "Authentication token required"}
            
            payload = self.verify_jwt_token(token)
            if not payload:
                return {"success": False, "error": "Invalid token"}
            
            if payload.get('userType') not in ['Super Admin', 'Admin']:
                return {"success": False, "error": "No permission to create administrators"}
            
            new_address = data.get('address', '').lower()
            user_type = data.get('userType', 'Moderator')
            name = data.get('name', f'Admin {new_address[:8]}')
            department = data.get('department', '')
            
            if not new_address:
                return {"success": False, "error": "Wallet address required"}
            
            try:
                with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                    admins = json.load(f)
            except:
                admins = {}
            
            if new_address in admins:
                return {"success": False, "error": "Wallet is already an administrator"}
            
            new_admin = {
                "address": new_address,
                "userType": user_type,
                "name": name,
                "department": department,
                "permissions": data.get('permissions', []),
                "addedBy": payload.get('address'),
                "addedAt": datetime.now().isoformat(),
                "active": True
            }
            
            admins[new_address] = new_admin
            
            with open(f'{self.data_dir}/admins.json', 'w', encoding='utf-8') as f:
                json.dump(admins, f, indent=2, ensure_ascii=False)
            
            print(f"✅ New admin created: {new_address} ({user_type})")
            
            return {
                "success": True,
                "message": "Administrator created successfully",
                "admin": new_admin
            }
        except Exception as e:
            return {"success": False, "error": f"Error creating admin: {str(e)}"}

    def system_reset(self, data):
        try:
            token = data.get('token')
            if not token:
                return {"success": False, "error": "Authentication token required"}
            
            payload = self.verify_jwt_token(token)
            if not payload or payload.get('userType') != 'Super Admin':
                return {"success": False, "error": "Only Super Admin can reset the system"}
            
            files_to_reset = [
                f'{self.data_dir}/admins.json',
                f'{self.data_dir}/users.json',
                f'{self.data_dir}/config.json'
            ]
            
            for file_path in files_to_reset:
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            print("🗑️ System completely reset")
            
            return {
                "success": True,
                "message": "System reset successfully"
            }
        except Exception as e:
            return {"success": False, "error": f"Reset error: {str(e)}"}

    def get_admin_list(self):
        try:
            with open(f'{self.data_dir}/admins.json', 'r', encoding='utf-8') as f:
                admins = json.load(f)
            
            admin_list = []
            for address, admin in admins.items():
                admin_safe = admin.copy()
                admin_list.append(admin_safe)
            
            return admin_list
        except Exception as e:
            print(f"Error loading admins: {e}")
            return []

    def do_GET(self):
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path[1:] if parsed_url.path.startswith('/') else parsed_url.path
            
            if path.startswith('api/'):
                self.handle_api_get(path)
            else:
                self.serve_static_file(path)
        except Exception as e:
            print(f"GET error: {e}")
            self.send_error_response(500, f"Internal error: {str(e)}")

    def do_POST(self):
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path[1:] if parsed_url.path.startswith('/') else parsed_url.path
            
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                except:
                    data = {}
            else:
                data = {}
            
            if path.startswith('api/'):
                self.handle_api_post(path, data)
            else:
                self.send_error_response(404, "Endpoint not found")
        except Exception as e:
            print(f"POST error: {e}")
            self.send_error_response(500, f"Internal error: {str(e)}")

    def handle_api_get(self, path):
        if path == 'api/health':
            response = {
                "status": "OK",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "service": "Widget SaaS API Web3",
                "web3Available": WEB3_AVAILABLE
            }
            self.send_json_response(response)
            return
        
        if path == 'api/stats':
            stats = {
                "timestamp": datetime.now().isoformat(),
                "totalAdmins": len(self.get_admin_list()),
                "systemInitialized": not self.is_first_admin(),
                "web3Available": WEB3_AVAILABLE
            }
            self.send_json_response(stats)
            return
        
        if path == 'api/system/status':
            status = {
                "initialized": not self.is_first_admin(),
                "web3Available": WEB3_AVAILABLE,
                "timestamp": datetime.now().isoformat()
            }
            self.send_json_response(status)
            return
        
        if path == 'api/admin/list':
            admin_list = self.get_admin_list()
            self.send_json_response(admin_list)
            return
        
        self.send_error_response(404, "Endpoint not found")

    def handle_api_post(self, path, data):
        if path == 'api/auth/verify':
            result = self.authenticate_wallet(data)
            self.send_json_response(result)
            return
        
        if path == 'api/system/setup':
            result = self.setup_first_admin(data)
            self.send_json_response(result)
            return
        
        if path == 'api/system/reset':
            result = self.system_reset(data)
            self.send_json_response(result)
            return

        if path == 'api/admin/register':
            result = self.create_admin_web3(data)
            self.send_json_response(result)
            return
        
        self.send_error_response(404, "Endpoint not found")

    def serve_static_file(self, path):
        if path == '' or path == 'index.html':
            path = 'index.html'
        
        if not os.path.exists(path):
            self.send_error_response(404, f"File not found: {path}")
            return
        
        try:
            with open(path, 'rb') as f:
                content = f.read()
            
            content_type, _ = mimetypes.guess_type(path)
            if content_type is None:
                if path.endswith('.js'):
                    content_type = 'application/javascript'
                elif path.endswith('.css'):
                    content_type = 'text/css'
                elif path.endswith('.html'):
                    content_type = 'text/html'
                else:
                    content_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            print(f"Error serving file {path}: {e}")
            self.send_error_response(500, f"Error reading file: {str(e)}")

    def send_json_response(self, data, status=200):
        try:
            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json_data.encode('utf-8'))
        except Exception as e:
            print(f"Error sending JSON: {e}")
            self.send_error_response(500, "Error processing response")

    def send_error_response(self, status, message):
        try:
            error_data = {
                "error": True,
                "status": status,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            self.send_json_response(error_data, status)
        except:
            self.send_response(status)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(message.encode('utf-8'))

    def log_message(self, format, *args):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {format % args}")

def main():
    if not os.path.exists('auth.html') and not os.path.exists('admin-panel.html'):
        print("⚠️ Run server in widget-all/ directory")
        return
    
    HOST = '0.0.0.0'
    PORT = 8000
    
    server = HTTPServer((HOST, PORT), WidgetSaaSHandler)
    
    print("🚀 Starting Widget SaaS Server Web3...")
    print(f"📡 Server: http://{HOST}:{PORT}")
    print(f"🔐 Auth: http://{HOST}:{PORT}/auth.html")
    print(f"🎛️ Admin: http://{HOST}:{PORT}/admin-panel.html")
    print(f"❤️ Health: http://{HOST}:{PORT}/api/health")
    print(f"📈 Stats: http://{HOST}:{PORT}/api/stats")
    print(f"🌐 Web3 Status: {'✅ Active' if WEB3_AVAILABLE else '⚠️ Dev Mode'}")
    print("🛑 Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        server.shutdown()

if __name__ == "__main__":
    main()
