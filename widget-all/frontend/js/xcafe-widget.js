// XCAFE Widget - Sistema de Cobrança Incorporável
// Widget para integração em sites externos com cobrança em USDT

(function() {
    'use strict';
    
    // Widget configuration
    const WIDGET_CONFIG = {
        apiBaseUrl: 'http://localhost:3000/api',
        usdtContractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT Mainnet
        version: '1.0.0',
        defaultStyles: true
    };
    
    // Widget CSS styles
    const WIDGET_STYLES = `
        .xcafe-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 12px;
            padding: 24px;
            color: #ffffff;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
        }
        
        .xcafe-widget::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #f85d23, #f59e0b);
        }
        
        .xcafe-widget-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .xcafe-widget-logo {
            font-size: 24px;
            font-weight: bold;
            color: #f85d23;
            margin-bottom: 8px;
        }
        
        .xcafe-widget-title {
            font-size: 18px;
            margin-bottom: 4px;
        }
        
        .xcafe-widget-subtitle {
            font-size: 14px;
            color: #94a3b8;
        }
        
        .xcafe-service-info {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .xcafe-service-name {
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .xcafe-service-description {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 12px;
        }
        
        .xcafe-price-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .xcafe-price {
            font-size: 20px;
            font-weight: bold;
            color: #f85d23;
        }
        
        .xcafe-credits {
            font-size: 14px;
            color: #94a3b8;
        }
        
        .xcafe-payment-section {
            margin-bottom: 20px;
        }
        
        .xcafe-input-group {
            margin-bottom: 16px;
        }
        
        .xcafe-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 6px;
            color: #e2e8f0;
        }
        
        .xcafe-input {
            width: 100%;
            padding: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .xcafe-input:focus {
            outline: none;
            border-color: #f85d23;
            box-shadow: 0 0 0 3px rgba(248, 93, 35, 0.1);
        }
        
        .xcafe-input::placeholder {
            color: #64748b;
        }
        
        .xcafe-button {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .xcafe-button-primary {
            background: linear-gradient(135deg, #f85d23, #f59e0b);
            color: #ffffff;
        }
        
        .xcafe-button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(248, 93, 35, 0.3);
        }
        
        .xcafe-button-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .xcafe-button-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
        }
        
        .xcafe-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .xcafe-loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #ffffff;
            animation: xcafe-spin 1s ease-in-out infinite;
        }
        
        @keyframes xcafe-spin {
            to { transform: rotate(360deg); }
        }
        
        .xcafe-status {
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 14px;
            text-align: center;
        }
        
        .xcafe-status-success {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
        }
        
        .xcafe-status-error {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }
        
        .xcafe-status-warning {
            background: rgba(245, 158, 11, 0.2);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #f59e0b;
        }
        
        .xcafe-footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .xcafe-powered-by {
            font-size: 12px;
            color: #64748b;
        }
        
        .xcafe-powered-by a {
            color: #f85d23;
            text-decoration: none;
        }
        
        .xcafe-hidden {
            display: none !important;
        }
        
        @media (max-width: 480px) {
            .xcafe-widget {
                margin: 0;
                border-radius: 0;
                max-width: none;
            }
        }
    `;
    
    class XCAFEWidget {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.options = {
                apiKey: options.apiKey || '',
                serviceName: options.serviceName || 'Premium Service',
                serviceDescription: options.serviceDescription || 'Access to premium service',
                creditsRequired: options.creditsRequired || 10,
                pricePerCredit: options.pricePerCredit || 0.1,
                onSuccess: options.onSuccess || null,
                onError: options.onError || null,
                theme: options.theme || 'dark',
                showPoweredBy: options.showPoweredBy !== false,
                ...options
            };
            
            this.container = null;
            this.web3 = null;
            this.userAddress = null;
            this.isProcessing = false;
            
            this.init();
        }
        
        init() {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                console.error(`XCAFE Widget: Container with ID '${this.containerId}' not found`);
                return;
            }
            
            this.injectStyles();
            this.render();
            this.setupEventListeners();
            
            console.log('XCAFE Widget initialized successfully');
        }
        
        injectStyles() {
            if (!document.getElementById('xcafe-widget-styles')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'xcafe-widget-styles';
                styleSheet.textContent = WIDGET_STYLES;
                document.head.appendChild(styleSheet);
            }
        }
        
        render() {
            const totalPrice = (this.options.creditsRequired * this.options.pricePerCredit).toFixed(2);
            
            this.container.innerHTML = `
                <div class="xcafe-widget">
                    <div class="xcafe-widget-header">
                        <div class="xcafe-widget-logo">XCAFE</div>
                        <div class="xcafe-widget-title">Pagamento Seguro</div>
                        <div class="xcafe-widget-subtitle">Powered by Blockchain</div>
                    </div>
                    
                    <div class="xcafe-service-info">
                        <div class="xcafe-service-name">${this.options.serviceName}</div>
                        <div class="xcafe-service-description">${this.options.serviceDescription}</div>
                        <div class="xcafe-price-info">
                            <div class="xcafe-price">${totalPrice} USDT</div>
                            <div class="xcafe-credits">${this.options.creditsRequired} credits</div>
                        </div>
                    </div>
                    
                    <div id="xcafe-status-container"></div>
                    
                    <div class="xcafe-payment-section">
                        <div class="xcafe-input-group">
                            <label class="xcafe-label" for="xcafe-api-key">Chave API</label>
                            <input 
                                type="text" 
                                id="xcafe-api-key" 
                                class="xcafe-input" 
                                placeholder="Digite sua chave API"
                                value="${this.options.apiKey}"
                            >
                        </div>
                        
                        <div class="xcafe-input-group">
                            <label class="xcafe-label" for="xcafe-operation-tag">Operation Tag</label>
                            <input 
                                type="text" 
                                id="xcafe-operation-tag" 
                                class="xcafe-input" 
                                placeholder="Unique tag for this operation"
                            >
                        </div>
                        
                        <button id="xcafe-connect-btn" class="xcafe-button xcafe-button-secondary">
                            Conectar MetaMask
                        </button>
                        
                        <button id="xcafe-pay-btn" class="xcafe-button xcafe-button-primary xcafe-hidden">
                            Pagar ${totalPrice} USDT
                        </button>
                    </div>
                    
                    ${this.options.showPoweredBy ? `
                        <div class="xcafe-footer">
                            <div class="xcafe-powered-by">
                                Powered by <a href="#" target="_blank">XCAFE</a>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        setupEventListeners() {
            const connectBtn = document.getElementById('xcafe-connect-btn');
            const payBtn = document.getElementById('xcafe-pay-btn');
            
            connectBtn.addEventListener('click', () => this.connectWallet());
            payBtn.addEventListener('click', () => this.processPayment());
        }
        
        async connectWallet() {
            try {
                if (typeof window.ethereum === 'undefined') {
                    this.showStatus('MetaMask not found. Please install the extension.', 'error');
                    return;
                }
                
                this.showStatus('Conectando com MetaMask...', 'warning');
                
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length === 0) {
                    this.showStatus('Nenhuma conta selecionada.', 'error');
                    return;
                }
                
                this.userAddress = accounts[0];
                this.web3 = window.ethereum;
                
                // Check if user has sufficient credits
                await this.checkUserCredits();
                
                this.showStatus(`Conectado: ${this.userAddress.substring(0, 10)}...`, 'success');
                
                // Show payment button
                document.getElementById('xcafe-connect-btn').classList.add('xcafe-hidden');
                document.getElementById('xcafe-pay-btn').classList.remove('xcafe-hidden');
                
            } catch (error) {
                console.error('Erro ao conectar wallet:', error);
                this.showStatus('Erro ao conectar com MetaMask.', 'error');
            }
        }
        
        async checkUserCredits() {
            try {
                const apiKey = document.getElementById('xcafe-api-key').value;
                if (!apiKey) {
                    this.showStatus('Por favor, insira sua chave API.', 'warning');
                    return;
                }
                
                const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/user/credits`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const userCredits = data.credits || 0;
                    
                    if (userCredits < this.options.creditsRequired) {
                        this.showStatus(
                            `Insufficient credits. You have ${userCredits}, need ${this.options.creditsRequired}.`,
                            'warning'
                        );
                    }
                } else {
                    this.showStatus('Error checking credits. Invalid API key?', 'warning');
                }
            } catch (error) {
                console.error('Error checking credits:', error);
            }
        }
        
        async processPayment() {
            if (this.isProcessing) return;
            
            try {
                this.isProcessing = true;
                this.setButtonLoading('xcafe-pay-btn', true);
                
                const apiKey = document.getElementById('xcafe-api-key').value;
                const operationTag = document.getElementById('xcafe-operation-tag').value;
                
                if (!apiKey) {
                    this.showStatus('Por favor, insira sua chave API.', 'error');
                    return;
                }
                
                if (!operationTag) {
                    this.showStatus('Please enter a tag for the operation.', 'error');
                    return;
                }
                
                this.showStatus('Processando pagamento...', 'warning');
                
                // Verify operation tag and process payment
                const result = await this.verifyAndProcessPayment(apiKey, operationTag);
                
                if (result.success) {
                    this.showStatus('Pagamento processado com sucesso!', 'success');
                    
                    if (this.options.onSuccess) {
                        this.options.onSuccess({
                            operationTag,
                            creditsUsed: this.options.creditsRequired,
                            transactionId: result.transactionId
                        });
                    }
                } else {
                    this.showStatus(result.message || 'Erro ao processar pagamento.', 'error');
                    
                    if (this.options.onError) {
                        this.options.onError(new Error(result.message));
                    }
                }
                
            } catch (error) {
                console.error('Erro no pagamento:', error);
                this.showStatus('Erro ao processar pagamento.', 'error');
                
                if (this.options.onError) {
                    this.options.onError(error);
                }
            } finally {
                this.isProcessing = false;
                this.setButtonLoading('xcafe-pay-btn', false);
            }
        }
        
        async verifyAndProcessPayment(apiKey, operationTag) {
            try {
                const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/widget/process-payment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        operationTag,
                        creditsRequired: this.options.creditsRequired,
                        serviceName: this.options.serviceName,
                        userAddress: this.userAddress
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    return {
                        success: true,
                        transactionId: data.transactionId
                    };
                } else {
                    return {
                        success: false,
                        message: data.message || 'Erro desconhecido'
                    };
                }
            } catch (error) {
                console.error('Verification error:', error);
                return {
                    success: false,
                    message: 'Server connection error'
                };
            }
        }
        
        showStatus(message, type = 'info') {
            const container = document.getElementById('xcafe-status-container');
            container.innerHTML = `
                <div class="xcafe-status xcafe-status-${type}">
                    ${message}
                </div>
            `;
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    container.innerHTML = '';
                }, 5000);
            }
        }
        
        setButtonLoading(buttonId, loading) {
            const button = document.getElementById(buttonId);
            if (loading) {
                button.disabled = true;
                button.innerHTML = '<span class="xcafe-loading"></span> Processando...';
            } else {
                button.disabled = false;
                const totalPrice = (this.options.creditsRequired * this.options.pricePerCredit).toFixed(2);
                button.innerHTML = `Pagar ${totalPrice} USDT`;
            }
        }
        
        // Public methods
        updateOptions(newOptions) {
            this.options = { ...this.options, ...newOptions };
            this.render();
            this.setupEventListeners();
        }
        
        destroy() {
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    }
    
    // Global function to create widget
    window.createXCAFEWidget = function(containerId, options) {
        return new XCAFEWidget(containerId, options);
    };
    
    // Auto-initialize widgets with data attributes
    document.addEventListener('DOMContentLoaded', function() {
        const widgets = document.querySelectorAll('[data-xcafe-widget]');
        
        widgets.forEach(element => {
            const options = {
                apiKey: element.dataset.apiKey || '',
                serviceName: element.dataset.serviceName || 'Premium Service',
                serviceDescription: element.dataset.serviceDescription || 'Access to premium service',
                creditsRequired: parseInt(element.dataset.creditsRequired) || 10,
                pricePerCredit: parseFloat(element.dataset.pricePerCredit) || 0.1
            };
            
            new XCAFEWidget(element.id, options);
        });
    });
    
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createXCAFEWidget: window.createXCAFEWidget };
}