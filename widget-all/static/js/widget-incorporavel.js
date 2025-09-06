/**
 * Widget SaaS - Widget Incorporável Completo
 * Widget JavaScript que pode ser incorporado em qualquer site
 */

(function() {
    'use strict';
    
    // Configuração global do widget
    const WIDGET_CONFIG = {
        apiBaseUrl: window.WIDGET_API_URL || 'http://localhost:8001/api',
        version: '1.0.0',
        debug: window.WIDGET_DEBUG || false
    };

    class WidgetSaaS {
        constructor(config = {}) {
            this.config = {
                containerId: config.containerId || 'widget-saas-container',
                apiKey: config.apiKey || '',
                tokenAddress: config.tokenAddress || '',
                tokenSymbol: config.tokenSymbol || 'TOKEN',
                tokenPrice: config.tokenPrice || 1,
                currency: config.currency || 'TBNB',
                blockchain: config.blockchain || 'BSC Testnet',
                theme: config.theme || 'light',
                language: config.language || 'pt-BR',
                testMode: config.testMode || true,
                ...config
            };
            
            this.isInitialized = false;
            this.metaMaskConnected = false;
            this.userAccount = null;
            this.web3 = null;
            
            this.init();
        }

        async init() {
            console.log('🚀 Inicializando Widget SaaS v' + WIDGET_CONFIG.version);
            
            // Verificar container
            const container = document.getElementById(this.config.containerId);
            if (!container) {
                console.error('❌ Container não encontrado:', this.config.containerId);
                return;
            }

            // Injetar CSS
            this.injectCSS();
            
            // Criar estrutura do widget
            this.createWidgetStructure(container);
            
            // Inicializar MetaMask se disponível
            await this.initializeMetaMask();
            
            // Verificar API Key
            await this.validateApiKey();
            
            this.isInitialized = true;
            console.log('✅ Widget SaaS inicializado com sucesso!');
        }

        injectCSS() {
            const css = `
                .widget-saas {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    max-width: 400px;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #e0e0e0;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    background: ${this.config.theme === 'dark' ? '#2d3748' : '#ffffff'};
                    color: ${this.config.theme === 'dark' ? '#ffffff' : '#333333'};
                }
                
                .widget-saas.dark {
                    background: #2d3748;
                    color: #ffffff;
                    border-color: #4a5568;
                }
                
                .widget-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .widget-title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .widget-subtitle {
                    font-size: 0.9rem;
                    opacity: 0.7;
                }
                
                .token-info {
                    background: ${this.config.theme === 'dark' ? '#4a5568' : '#f7fafc'};
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .token-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .token-row:last-child {
                    margin-bottom: 0;
                }
                
                .purchase-form {
                    margin-bottom: 20px;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                
                .form-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 1rem;
                    background: ${this.config.theme === 'dark' ? '#4a5568' : '#ffffff'};
                    color: ${this.config.theme === 'dark' ? '#ffffff' : '#333333'};
                }
                
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                    margin-bottom: 10px;
                }
                
                .btn-primary {
                    background: #3182ce;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #2c5aa0;
                }
                
                .btn-success {
                    background: #38a169;
                    color: white;
                }
                
                .btn-secondary {
                    background: #718096;
                    color: white;
                }
                
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .metamask-section {
                    margin-bottom: 20px;
                    padding: 15px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                }
                
                .status-message {
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    text-align: center;
                }
                
                .status-success {
                    background: #c6f6d5;
                    color: #22543d;
                    border: 1px solid #38a169;
                }
                
                .status-error {
                    background: #fed7d7;
                    color: #742a2a;
                    border: 1px solid #e53e3e;
                }
                
                .status-warning {
                    background: #fefcbf;
                    color: #744210;
                    border: 1px solid #d69e2e;
                }
                
                .loading {
                    text-align: center;
                    padding: 20px;
                }
                
                .spinner {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #3182ce;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .widget-footer {
                    text-align: center;
                    font-size: 0.8rem;
                    opacity: 0.6;
                    margin-top: 15px;
                }
                
                .amount-calculator {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .amount-display {
                    font-weight: bold;
                    color: #3182ce;
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.textContent = css;
            document.head.appendChild(styleSheet);
        }

        createWidgetStructure(container) {
            container.innerHTML = `
                <div class="widget-saas ${this.config.theme}">
                    <div class="widget-header">
                        <div class="widget-title">💎 Comprar ${this.config.tokenSymbol}</div>
                        <div class="widget-subtitle">Token Sale Widget</div>
                    </div>
                    
                    <div id="status-message"></div>
                    
                    <div class="token-info">
                        <div class="token-row">
                            <span>Token:</span>
                            <span><strong>${this.config.tokenSymbol}</strong></span>
                        </div>
                        <div class="token-row">
                            <span>Preço:</span>
                            <span><strong>1 ${this.config.tokenSymbol} = ${this.config.tokenPrice} ${this.config.currency}</strong></span>
                        </div>
                        <div class="token-row">
                            <span>Blockchain:</span>
                            <span><strong>${this.config.blockchain}</strong></span>
                        </div>
                        ${this.config.testMode ? '<div class="token-row"><span>Modo:</span><span><strong>🧪 TESTE</strong></span></div>' : ''}
                    </div>
                    
                    <div class="metamask-section">
                        <div id="metamask-container">
                            <div class="loading">
                                <div class="spinner"></div>
                                <div>Verificando MetaMask...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="purchase-form" id="purchase-form" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">Quantidade de ${this.config.currency}:</label>
                            <input type="number" 
                                   class="form-input" 
                                   id="currency-amount" 
                                   placeholder="0.00" 
                                   step="0.01" 
                                   min="0.01">
                            <div class="amount-calculator">
                                <span>Você receberá:</span>
                                <span class="amount-display" id="token-amount">0 ${this.config.tokenSymbol}</span>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary" id="buy-button" onclick="widget.purchaseTokens()">
                            🛒 Comprar Tokens
                        </button>
                    </div>
                    
                    <div class="widget-footer">
                        Powered by Widget SaaS v${WIDGET_CONFIG.version}
                    </div>
                </div>
            `;
            
            // Adicionar event listeners
            this.setupEventListeners();
        }

        setupEventListeners() {
            // Calculator de quantidade
            const currencyInput = document.getElementById('currency-amount');
            const tokenAmountDisplay = document.getElementById('token-amount');
            
            if (currencyInput && tokenAmountDisplay) {
                currencyInput.addEventListener('input', (e) => {
                    const currencyAmount = parseFloat(e.target.value) || 0;
                    const tokenAmount = currencyAmount / this.config.tokenPrice;
                    tokenAmountDisplay.textContent = `${tokenAmount.toFixed(4)} ${this.config.tokenSymbol}`;
                });
            }
        }

        async initializeMetaMask() {
            const container = document.getElementById('metamask-container');
            
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = window.ethereum;
                
                // Verificar se já está conectado
                try {
                    const accounts = await this.web3.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        this.userAccount = accounts[0];
                        this.metaMaskConnected = true;
                        this.showConnectedState();
                    } else {
                        this.showDisconnectedState();
                    }
                } catch (error) {
                    console.error('❌ Erro ao verificar MetaMask:', error);
                    this.showMetaMaskError('Erro ao conectar com MetaMask');
                }
                
                // Setup listeners
                this.web3.on('accountsChanged', (accounts) => {
                    if (accounts.length > 0) {
                        this.userAccount = accounts[0];
                        this.metaMaskConnected = true;
                        this.showConnectedState();
                    } else {
                        this.userAccount = null;
                        this.metaMaskConnected = false;
                        this.showDisconnectedState();
                    }
                });
                
            } else {
                this.showMetaMaskNotFound();
            }
        }

        async connectMetaMask() {
            try {
                this.showStatus('Conectando...', 'loading');
                
                const accounts = await this.web3.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length > 0) {
                    this.userAccount = accounts[0];
                    this.metaMaskConnected = true;
                    this.showConnectedState();
                    this.showStatus('MetaMask conectado com sucesso!', 'success');
                    
                    // Mostrar formulário de compra
                    document.getElementById('purchase-form').style.display = 'block';
                } else {
                    this.showStatus('Falha ao conectar MetaMask', 'error');
                }
            } catch (error) {
                console.error('❌ Erro ao conectar MetaMask:', error);
                this.showStatus('Erro ao conectar: ' + error.message, 'error');
            }
        }

        showConnectedState() {
            const container = document.getElementById('metamask-container');
            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div>🦊 <strong>Conectado</strong></div>
                        <div style="font-size: 0.8rem; opacity: 0.7;">${this.formatAddress(this.userAccount)}</div>
                    </div>
                    <button class="btn btn-secondary" style="width: auto; margin: 0;" onclick="widget.disconnectMetaMask()">
                        Desconectar
                    </button>
                </div>
            `;
            
            // Mostrar formulário de compra
            document.getElementById('purchase-form').style.display = 'block';
        }

        showDisconnectedState() {
            const container = document.getElementById('metamask-container');
            container.innerHTML = `
                <button class="btn btn-primary" onclick="widget.connectMetaMask()">
                    🦊 Conectar MetaMask
                </button>
            `;
            
            // Esconder formulário de compra
            document.getElementById('purchase-form').style.display = 'none';
        }

        showMetaMaskNotFound() {
            const container = document.getElementById('metamask-container');
            container.innerHTML = `
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px;">🦊 MetaMask não encontrado</div>
                    <a href="https://metamask.io/download/" target="_blank" class="btn btn-primary">
                        Instalar MetaMask
                    </a>
                </div>
            `;
        }

        showMetaMaskError(message) {
            const container = document.getElementById('metamask-container');
            container.innerHTML = `
                <div style="text-align: center; color: #e53e3e;">
                    ❌ ${message}
                </div>
            `;
        }

        disconnectMetaMask() {
            this.userAccount = null;
            this.metaMaskConnected = false;
            this.showDisconnectedState();
            this.showStatus('MetaMask desconectado', 'warning');
        }

        async validateApiKey() {
            if (!this.config.apiKey) {
                this.showStatus('API Key não configurada', 'error');
                return false;
            }

            try {
                const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/validate-key`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        apiKey: this.config.apiKey
                    })
                });

                const data = await response.json();
                
                if (data.valid) {
                    console.log('✅ API Key válida');
                    return true;
                } else {
                    this.showStatus('API Key inválida', 'error');
                    return false;
                }
            } catch (error) {
                console.error('❌ Erro ao validar API Key:', error);
                this.showStatus('Erro na validação da API Key', 'error');
                return false;
            }
        }

        async purchaseTokens() {
            if (!this.metaMaskConnected) {
                this.showStatus('Conecte sua carteira primeiro', 'error');
                return;
            }

            const currencyAmount = parseFloat(document.getElementById('currency-amount').value);
            
            if (!currencyAmount || currencyAmount <= 0) {
                this.showStatus('Digite uma quantidade válida', 'error');
                return;
            }

            const tokenAmount = currencyAmount / this.config.tokenPrice;
            
            try {
                this.showStatus('Processando compra...', 'loading');
                
                if (this.config.testMode) {
                    // Simular transação em modo teste
                    await this.simulateTransaction(currencyAmount, tokenAmount);
                } else {
                    // Transação real
                    await this.executeRealTransaction(currencyAmount, tokenAmount);
                }
                
            } catch (error) {
                console.error('❌ Erro na compra:', error);
                this.showStatus('Erro na compra: ' + error.message, 'error');
            }
        }

        async simulateTransaction(currencyAmount, tokenAmount) {
            // Simular delay de transação
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simular hash de transação
            const fakeHash = '0x' + Math.random().toString(16).substr(2, 64);
            
            // Registrar transação no backend
            const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: this.config.apiKey,
                    userAccount: this.userAccount,
                    currencyAmount: currencyAmount,
                    tokenAmount: tokenAmount,
                    transactionHash: fakeHash,
                    testMode: true
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showStatus(`✅ Compra simulada com sucesso! Hash: ${fakeHash.substring(0, 10)}...`, 'success');
                
                // Limpar formulário
                document.getElementById('currency-amount').value = '';
                document.getElementById('token-amount').textContent = `0 ${this.config.tokenSymbol}`;
                
            } else {
                throw new Error(data.error || 'Falha na simulação');
            }
        }

        async executeRealTransaction(currencyAmount, tokenAmount) {
            // Implementar transação real via smart contract
            // Por enquanto, simular
            return this.simulateTransaction(currencyAmount, tokenAmount);
        }

        showStatus(message, type) {
            const statusContainer = document.getElementById('status-message');
            
            if (type === 'loading') {
                statusContainer.innerHTML = `
                    <div class="status-message">
                        <div class="spinner" style="width: 16px; height: 16px; margin-right: 10px;"></div>
                        ${message}
                    </div>
                `;
            } else {
                statusContainer.innerHTML = `
                    <div class="status-message status-${type}">
                        ${message}
                    </div>
                `;
            }
            
            // Remover mensagem após 5 segundos (exceto loading)
            if (type !== 'loading') {
                setTimeout(() => {
                    statusContainer.innerHTML = '';
                }, 5000);
            }
        }

        formatAddress(address) {
            if (!address) return '';
            return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        }
    }

    // Função para inicializar o widget
    window.createWidgetSaaS = function(config) {
        return new WidgetSaaS(config);
    };

    // Auto-inicializar se encontrar configuração na página
    document.addEventListener('DOMContentLoaded', function() {
        const autoConfig = window.WIDGET_SAAS_CONFIG;
        if (autoConfig) {
            window.widget = new WidgetSaaS(autoConfig);
        }
    });

    console.log('📦 Widget SaaS carregado e pronto para uso!');

})();
