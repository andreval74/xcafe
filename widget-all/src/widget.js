/**
 * XCAFE Widget SaaS - Token Creator Widget
 * Version: 2.0.0
 * 
 * Sistema unificado para criação de tokens com pagamento por créditos
 */

(function() {
    'use strict';

    // Configurações globais
    const WIDGET_CONFIG = {
        apiBaseUrl: 'http://localhost:3000/api',
        version: '2.0.0',
        supportedNetworks: {
            1: { name: 'Ethereum', symbol: 'ETH', rpc: 'https://eth.llamarpc.com' },
            137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon.llamarpc.com' },
            56: { name: 'BSC', symbol: 'BNB', rpc: 'https://bsc.llamarpc.com' }
        }
    };

    // Classe principal do Widget
    class XCAFEWidget {
        constructor(config = {}) {
            this.config = {
                apiKey: config.apiKey || '',
                theme: config.theme || 'light',
                language: config.language || 'pt-BR',
                containerId: config.containerId || 'xcafe-widget',
                ...config
            };
            
            this.provider = null;
            this.signer = null;
            this.userAddress = null;
            this.isInitialized = false;
            
            this.init();
        }

        async init() {
            try {
                await this.validateConfig();
                this.createWidgetHTML();
                this.setupEventListeners();
                this.isInitialized = true;
                
                console.log(`✅ XCAFE Widget v${WIDGET_CONFIG.version} initialized`);
            } catch (error) {
                console.error('❌ Widget initialization failed:', error);
                this.showError('Erro ao inicializar widget');
            }
        }

        validateConfig() {
            if (!this.config.apiKey) {
                throw new Error('API Key é obrigatória');
            }
            
            if (!this.config.apiKey.startsWith('wk_')) {
                throw new Error('API Key inválida');
            }
            
            const container = document.getElementById(this.config.containerId);
            if (!container) {
                throw new Error(`Container ${this.config.containerId} não encontrado`);
            }
        }

        createWidgetHTML() {
            const container = document.getElementById(this.config.containerId);
            
            container.innerHTML = `
                <div class="xcafe-widget" data-theme="${this.config.theme}">
                    <style>
                        .xcafe-widget {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            max-width: 600px;
                            margin: 0 auto;
                            border: 1px solid #e0e0e0;
                            border-radius: 12px;
                            padding: 24px;
                            background: #ffffff;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }
                        
                        .xcafe-widget[data-theme="dark"] {
                            background: #1a1a1a;
                            border-color: #333;
                            color: #ffffff;
                        }
                        
                        .xcafe-header {
                            text-align: center;
                            margin-bottom: 24px;
                        }
                        
                        .xcafe-logo {
                            width: 48px;
                            height: 48px;
                            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                            border-radius: 12px;
                            margin: 0 auto 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 18px;
                        }
                        
                        .xcafe-title {
                            font-size: 24px;
                            font-weight: 600;
                            margin: 0 0 8px;
                        }
                        
                        .xcafe-subtitle {
                            color: #666;
                            margin: 0;
                        }
                        
                        .xcafe-form {
                            display: grid;
                            gap: 16px;
                        }
                        
                        .xcafe-field {
                            display: flex;
                            flex-direction: column;
                            gap: 6px;
                        }
                        
                        .xcafe-label {
                            font-weight: 500;
                            font-size: 14px;
                        }
                        
                        .xcafe-input, .xcafe-select, .xcafe-textarea {
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            font-size: 14px;
                            transition: border-color 0.2s;
                        }
                        
                        .xcafe-input:focus, .xcafe-select:focus, .xcafe-textarea:focus {
                            outline: none;
                            border-color: #667eea;
                            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                        }
                        
                        .xcafe-textarea {
                            resize: vertical;
                            min-height: 80px;
                        }
                        
                        .xcafe-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 16px;
                        }
                        
                        .xcafe-button {
                            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            padding: 14px 24px;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: transform 0.2s, box-shadow 0.2s;
                            font-size: 16px;
                        }
                        
                        .xcafe-button:hover {
                            transform: translateY(-1px);
                            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                        }
                        
                        .xcafe-button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                            transform: none;
                        }
                        
                        .xcafe-connect-button {
                            background: #fff;
                            color: #333;
                            border: 1px solid #ddd;
                            margin-bottom: 16px;
                        }
                        
                        .xcafe-status {
                            padding: 12px;
                            border-radius: 8px;
                            font-size: 14px;
                            margin-bottom: 16px;
                        }
                        
                        .xcafe-status.success {
                            background: #d4edda;
                            color: #155724;
                            border: 1px solid #c3e6cb;
                        }
                        
                        .xcafe-status.error {
                            background: #f8d7da;
                            color: #721c24;
                            border: 1px solid #f5c6cb;
                        }
                        
                        .xcafe-status.info {
                            background: #d1ecf1;
                            color: #0c5460;
                            border: 1px solid #bee5eb;
                        }
                        
                        .xcafe-loading {
                            display: inline-block;
                            width: 16px;
                            height: 16px;
                            border: 2px solid #f3f3f3;
                            border-top: 2px solid #667eea;
                            border-radius: 50%;
                            animation: xcafe-spin 1s linear infinite;
                            margin-right: 8px;
                        }
                        
                        @keyframes xcafe-spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        
                        .xcafe-hidden {
                            display: none;
                        }
                        
                        .xcafe-footer {
                            margin-top: 24px;
                            text-align: center;
                            font-size: 12px;
                            color: #999;
                        }
                        
                        @media (max-width: 640px) {
                            .xcafe-grid {
                                grid-template-columns: 1fr;
                            }
                        }
                    </style>
                    
                    <div class="xcafe-header">
                        <div class="xcafe-logo">X</div>
                        <h2 class="xcafe-title">Criador de Tokens</h2>
                        <p class="xcafe-subtitle">Crie seu token personalizado em segundos</p>
                    </div>
                    
                    <div id="xcafe-status" class="xcafe-status xcafe-hidden"></div>
                    
                    <div id="xcafe-connect-section">
                        <button id="xcafe-connect-btn" class="xcafe-button xcafe-connect-button">
                            🦊 Conectar MetaMask
                        </button>
                    </div>
                    
                    <form id="xcafe-token-form" class="xcafe-form xcafe-hidden">
                        <div class="xcafe-field">
                            <label class="xcafe-label">Nome do Token *</label>
                            <input type="text" id="token-name" class="xcafe-input" placeholder="Ex: MeuToken" required>
                        </div>
                        
                        <div class="xcafe-field">
                            <label class="xcafe-label">Símbolo *</label>
                            <input type="text" id="token-symbol" class="xcafe-input" placeholder="Ex: MTK" required maxlength="10">
                        </div>
                        
                        <div class="xcafe-grid">
                            <div class="xcafe-field">
                                <label class="xcafe-label">Supply Total *</label>
                                <input type="number" id="token-supply" class="xcafe-input" placeholder="1000000" required min="1">
                            </div>
                            
                            <div class="xcafe-field">
                                <label class="xcafe-label">Decimais</label>
                                <select id="token-decimals" class="xcafe-select">
                                    <option value="18">18 (Padrão)</option>
                                    <option value="8">8</option>
                                    <option value="6">6</option>
                                    <option value="0">0</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="xcafe-field">
                            <label class="xcafe-label">Descrição</label>
                            <textarea id="token-description" class="xcafe-textarea" placeholder="Descreva seu token..."></textarea>
                        </div>
                        
                        <div class="xcafe-field">
                            <label class="xcafe-label">Rede Blockchain</label>
                            <select id="token-network" class="xcafe-select">
                                <option value="1">Ethereum Mainnet</option>
                                <option value="137">Polygon</option>
                                <option value="56">Binance Smart Chain</option>
                            </select>
                        </div>
                        
                        <button type="submit" id="xcafe-create-btn" class="xcafe-button">
                            🚀 Criar Token (1 Crédito)
                        </button>
                    </form>
                    
                    <div class="xcafe-footer">
                        Powered by XCAFE Widget v${WIDGET_CONFIG.version}
                    </div>
                </div>
            `;
        }

        setupEventListeners() {
            const connectBtn = document.getElementById('xcafe-connect-btn');
            const tokenForm = document.getElementById('xcafe-token-form');
            
            connectBtn.addEventListener('click', () => this.connectWallet());
            tokenForm.addEventListener('submit', (e) => this.handleTokenCreation(e));
        }

        async connectWallet() {
            try {
                if (typeof window.ethereum === 'undefined') {
                    throw new Error('MetaMask não encontrado. Instale a extensão MetaMask.');
                }

                this.showStatus('Conectando carteira...', 'info');
                
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                this.signer = this.provider.getSigner();
                this.userAddress = await this.signer.getAddress();
                
                this.showStatus(`✅ Conectado: ${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`, 'success');
                
                // Show form
                document.getElementById('xcafe-connect-section').classList.add('xcafe-hidden');
                document.getElementById('xcafe-token-form').classList.remove('xcafe-hidden');
                
            } catch (error) {
                console.error('Wallet connection error:', error);
                this.showError(error.message);
            }
        }

        async handleTokenCreation(event) {
            event.preventDefault();
            
            if (!this.userAddress) {
                this.showError('Conecte sua carteira primeiro');
                return;
            }

            const formData = this.getFormData();
            
            if (!this.validateFormData(formData)) {
                return;
            }

            const createBtn = document.getElementById('xcafe-create-btn');
            const originalText = createBtn.innerHTML;
            
            try {
                createBtn.disabled = true;
                createBtn.innerHTML = '<span class="xcafe-loading"></span>Criando token...';
                
                this.showStatus('Enviando solicitação...', 'info');
                
                const response = await this.callAPI('/widget/create-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        api_key: this.config.apiKey,
                        ...formData,
                        user_address: this.userAddress
                    })
                });

                if (response.success) {
                    this.showSuccess(response);
                    this.resetForm();
                } else {
                    throw new Error(response.error || response.message || 'Erro desconhecido');
                }
                
            } catch (error) {
                console.error('Token creation error:', error);
                this.showError(error.message);
            } finally {
                createBtn.disabled = false;
                createBtn.innerHTML = originalText;
            }
        }

        getFormData() {
            return {
                name: document.getElementById('token-name').value.trim(),
                symbol: document.getElementById('token-symbol').value.trim().toUpperCase(),
                totalSupply: document.getElementById('token-supply').value,
                decimals: parseInt(document.getElementById('token-decimals').value),
                description: document.getElementById('token-description').value.trim(),
                network: parseInt(document.getElementById('token-network').value)
            };
        }

        validateFormData(data) {
            if (!data.name) {
                this.showError('Nome do token é obrigatório');
                return false;
            }
            
            if (!data.symbol) {
                this.showError('Símbolo do token é obrigatório');
                return false;
            }
            
            if (!data.totalSupply || data.totalSupply <= 0) {
                this.showError('Supply total deve ser maior que zero');
                return false;
            }
            
            return true;
        }

        async callAPI(endpoint, options = {}) {
            const url = `${WIDGET_CONFIG.apiBaseUrl}${endpoint}`;
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
            }
            
            return await response.json();
        }

        showStatus(message, type = 'info') {
            const statusEl = document.getElementById('xcafe-status');
            statusEl.className = `xcafe-status ${type}`;
            statusEl.textContent = message;
            statusEl.classList.remove('xcafe-hidden');
        }

        showSuccess(response) {
            const message = `
                ✅ Token criado com sucesso!
                
                📍 Endereço: ${response.tokenAddress}
                🧾 TX Hash: ${response.transactionHash}
            `;
            
            this.showStatus(message, 'success');
        }

        showError(message) {
            this.showStatus(`❌ ${message}`, 'error');
        }

        resetForm() {
            document.getElementById('xcafe-token-form').reset();
            setTimeout(() => {
                document.getElementById('xcafe-status').classList.add('xcafe-hidden');
            }, 5000);
        }
    }

    // Global API
    window.XCAFEWidget = XCAFEWidget;
    
    // Auto-init se tiver config global
    if (window.XCAFE_CONFIG) {
        new XCAFEWidget(window.XCAFE_CONFIG);
    }

    // Função helper para inicialização rápida
    window.initXCAFEWidget = function(config) {
        return new XCAFEWidget(config);
    };

})();

// Export para uso com import/require
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XCAFEWidget;
}
