/**
 * 🎯 WIDGET EMBARCÁVEL - Sistema de Compra de Tokens
 * 
 * 📋 RESPONSABILIDADES:
 * - Renderizar interface de compra em qualquer site
 * - Conectar MetaMask e processar transações
 * - Validar chave de API e créditos
 * - Interface responsiva e customizável
 * 
 * 🔧 USO:
 * <script src="https://seudominio.com/widget-sale.js"></script>
 * <script>
 *   new TokenSaleWidget({
 *     apiKey: 'sua-api-key',
 *     containerId: 'widget-container'
 *   });
 * </script>
 * 
 * 🎨 TEMAS:
 * - light (padrão): fundo branco, texto escuro
 * - dark: fundo escuro, texto claro
 * - custom: cores personalizadas
 */

(function() {
    'use strict';

    // ==================== CONFIGURAÇÕES GLOBAIS ====================
    
    const WIDGET_CONFIG = {
        apiBaseUrl: window.WIDGET_API_BASE || 'https://api.tokenwidget.com',
        version: '1.0.0',
        defaultTheme: 'light',
        
        // Redes suportadas
        networks: {
            1: { name: 'Ethereum', symbol: 'ETH', rpc: 'https://eth.llamarpc.com' },
            56: { name: 'BSC', symbol: 'BNB', rpc: 'https://bsc.llamarpc.com' },
            137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon.llamarpc.com' }
        },
        
        // Temas de cores
        themes: {
            light: {
                primary: '#007bff',
                secondary: '#6c757d', 
                success: '#28a745',
                danger: '#dc3545',
                warning: '#ffc107',
                background: '#ffffff',
                surface: '#f8f9fa',
                text: '#333333',
                textMuted: '#6c757d'
            },
            dark: {
                primary: '#4dabf7',
                secondary: '#adb5bd',
                success: '#51cf66', 
                danger: '#ff6b6b',
                warning: '#ffd43b',
                background: '#343a40',
                surface: '#495057',
                text: '#ffffff',
                textMuted: '#adb5bd'
            }
        }
    };

    // ==================== CLASSE PRINCIPAL ====================
    
    class TokenSaleWidget {
        constructor(options = {}) {
            this.config = {
                apiKey: options.apiKey || '',
                containerId: options.containerId || 'token-sale-widget',
                theme: options.theme || 'light',
                saleId: options.saleId || '',
                showBranding: options.showBranding !== false,
                customStyles: options.customStyles || {},
                ...options
            };

            this.state = {
                connected: false,
                account: null,
                network: null,
                provider: null,
                signer: null,
                loading: false,
                saleData: null,
                userCredits: 0
            };

            this.container = null;
            this.styleElement = null;

            this.init();
        }

        // ==================== INICIALIZAÇÃO ====================
        
        async init() {
            try {
                // Verificar se container existe
                this.container = document.getElementById(this.config.containerId);
                if (!this.container) {
                    throw new Error(`Container não encontrado: ${this.config.containerId}`);
                }

                // Aplicar estilos
                this.injectStyles();

                // Renderizar interface inicial
                this.render();

                // Verificar API Key
                await this.validateApiKey();

                // Tentar conectar automaticamente
                await this.tryAutoConnect();

                console.log('✅ Widget TokenSale inicializado');
            } catch (error) {
                console.error('❌ Erro ao inicializar widget:', error);
                this.showError(error.message);
            }
        }

        // ==================== ESTILOS CSS ====================
        
        injectStyles() {
            if (this.styleElement) {
                this.styleElement.remove();
            }

            const theme = WIDGET_CONFIG.themes[this.config.theme] || WIDGET_CONFIG.themes.light;
            
            const css = `
                .token-sale-widget {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    max-width: 400px;
                    background: ${theme.background};
                    border: 1px solid ${theme.secondary}40;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    color: ${theme.text};
                    line-height: 1.5;
                }
                
                .token-sale-widget * {
                    box-sizing: border-box;
                }
                
                .widget-header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                
                .widget-title {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0 0 8px 0;
                    color: ${theme.text};
                }
                
                .widget-subtitle {
                    font-size: 14px;
                    color: ${theme.textMuted};
                    margin: 0;
                }
                
                .connection-status {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: ${theme.surface};
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-size: 14px;
                }
                
                .status-connected {
                    color: ${theme.success};
                }
                
                .status-disconnected {
                    color: ${theme.textMuted};
                }
                
                .widget-button {
                    width: 100%;
                    padding: 12px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 12px;
                }
                
                .btn-primary {
                    background: ${theme.primary};
                    color: white;
                }
                
                .btn-primary:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }
                
                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .btn-success {
                    background: ${theme.success};
                    color: white;
                }
                
                .btn-danger {
                    background: ${theme.danger};
                    color: white;
                }
                
                .widget-form {
                    margin: 20px 0;
                }
                
                .form-group {
                    margin-bottom: 16px;
                }
                
                .form-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 500;
                    color: ${theme.textMuted};
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid ${theme.secondary}40;
                    border-radius: 6px;
                    font-size: 14px;
                    background: ${theme.background};
                    color: ${theme.text};
                    transition: border-color 0.2s;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: ${theme.primary};
                }
                
                .token-info {
                    background: ${theme.surface};
                    padding: 16px;
                    border-radius: 8px;
                    margin: 16px 0;
                }
                
                .token-info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                
                .token-info-row:last-child {
                    margin-bottom: 0;
                }
                
                .info-label {
                    color: ${theme.textMuted};
                }
                
                .info-value {
                    font-weight: 500;
                    color: ${theme.text};
                }
                
                .price-breakdown {
                    background: ${theme.surface};
                    padding: 16px;
                    border-radius: 8px;
                    margin: 16px 0;
                    border-left: 4px solid ${theme.primary};
                }
                
                .price-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                
                .price-total {
                    border-top: 1px solid ${theme.secondary}40;
                    padding-top: 8px;
                    font-weight: 600;
                }
                
                .widget-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    color: ${theme.textMuted};
                }
                
                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid ${theme.secondary}40;
                    border-top: 2px solid ${theme.primary};
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 12px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .widget-error {
                    background: ${theme.danger}20;
                    color: ${theme.danger};
                    padding: 12px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    margin: 16px 0;
                    border: 1px solid ${theme.danger}40;
                }
                
                .widget-success {
                    background: ${theme.success}20;
                    color: ${theme.success};
                    padding: 12px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    margin: 16px 0;
                    border: 1px solid ${theme.success}40;
                }
                
                .widget-branding {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 16px;
                    border-top: 1px solid ${theme.secondary}40;
                    font-size: 12px;
                    color: ${theme.textMuted};
                }
                
                .widget-branding a {
                    color: ${theme.primary};
                    text-decoration: none;
                }
                
                .credits-info {
                    background: ${theme.warning}20;
                    color: ${theme.warning === '#ffc107' ? '#856404' : theme.warning};
                    padding: 12px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    margin: 16px 0;
                    text-align: center;
                    border: 1px solid ${theme.warning}40;
                }
                
                .network-info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: ${theme.textMuted};
                    margin-bottom: 16px;
                }
                
                .network-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${theme.success};
                    margin-right: 8px;
                }
                
                @media (max-width: 480px) {
                    .token-sale-widget {
                        max-width: 100%;
                        margin: 0 auto;
                        border-radius: 8px;
                    }
                }
            `;

            this.styleElement = document.createElement('style');
            this.styleElement.textContent = css;
            document.head.appendChild(this.styleElement);
        }

        // ==================== RENDERIZAÇÃO ====================
        
        render() {
            if (!this.container) return;

            const html = `
                <div class="token-sale-widget">
                    <div class="widget-header">
                        <h3 class="widget-title">🎯 Token Sale</h3>
                        <p class="widget-subtitle">Compre tokens facilmente</p>
                    </div>
                    
                    <div id="widget-content">
                        ${this.renderContent()}
                    </div>
                    
                    ${this.config.showBranding ? this.renderBranding() : ''}
                </div>
            `;

            this.container.innerHTML = html;
            this.attachEventListeners();
        }

        renderContent() {
            if (this.state.loading) {
                return this.renderLoading();
            }

            if (!this.state.connected) {
                return this.renderConnectionScreen();
            }

            if (!this.state.saleData) {
                return this.renderNoSaleData();
            }

            return this.renderSaleInterface();
        }

        renderLoading() {
            return `
                <div class="widget-loading">
                    <div class="loading-spinner"></div>
                    Carregando...
                </div>
            `;
        }

        renderConnectionScreen() {
            return `
                <div class="connection-status">
                    <span class="status-disconnected">⚠️ MetaMask não conectado</span>
                </div>
                <button id="connect-wallet" class="widget-button btn-primary">
                    🦊 Conectar MetaMask
                </button>
                <div class="widget-error" style="display: none;" id="connection-error"></div>
            `;
        }

        renderNoSaleData() {
            return `
                <div class="widget-error">
                    ❌ Configuração de venda não encontrada. Verifique a API Key e Sale ID.
                </div>
                <button id="retry-load" class="widget-button btn-primary">
                    🔄 Tentar Novamente
                </button>
            `;
        }

        renderSaleInterface() {
            const sale = this.state.saleData;
            
            return `
                <div class="connection-status">
                    <span class="status-connected">✅ ${this.formatAddress(this.state.account)}</span>
                    <button id="disconnect-wallet" class="widget-button btn-danger" style="width: auto; margin: 0; padding: 6px 12px; font-size: 12px;">
                        Desconectar
                    </button>
                </div>
                
                <div class="network-info">
                    <div class="network-dot"></div>
                    ${WIDGET_CONFIG.networks[this.state.network]?.name || 'Rede Desconhecida'}
                </div>
                
                <div class="credits-info">
                    💰 Créditos disponíveis: <strong>${this.state.userCredits}</strong>
                </div>
                
                <div class="token-info">
                    <div class="token-info-row">
                        <span class="info-label">Token:</span>
                        <span class="info-value">${sale.tokenSymbol || 'TOKEN'}</span>
                    </div>
                    <div class="token-info-row">
                        <span class="info-label">Preço:</span>
                        <span class="info-value">${sale.tokenPrice} ${sale.paymentSymbol}</span>
                    </div>
                    <div class="token-info-row">
                        <span class="info-label">Mín/Máx:</span>
                        <span class="info-value">${sale.minPurchase} - ${sale.maxPurchase}</span>
                    </div>
                </div>
                
                <form id="purchase-form" class="widget-form">
                    <div class="form-group">
                        <label class="form-label" for="token-amount">Quantidade de Tokens</label>
                        <input 
                            type="number" 
                            id="token-amount" 
                            class="form-input"
                            placeholder="Digite a quantidade"
                            min="${sale.minPurchase}"
                            max="${sale.maxPurchase}"
                            step="0.000001"
                        >
                    </div>
                    
                    <div id="price-breakdown" style="display: none;">
                        <!-- Calculado dinamicamente -->
                    </div>
                    
                    <button type="submit" id="purchase-button" class="widget-button btn-success" disabled>
                        💳 Comprar Tokens
                    </button>
                </form>
                
                <div id="transaction-status" style="display: none;"></div>
            `;
        }

        renderBranding() {
            return `
                <div class="widget-branding">
                    Powered by <a href="https://tokenwidget.com" target="_blank">TokenWidget</a>
                </div>
            `;
        }

        // ==================== EVENT LISTENERS ====================
        
        attachEventListeners() {
            // Conectar carteira
            const connectBtn = document.getElementById('connect-wallet');
            if (connectBtn) {
                connectBtn.addEventListener('click', () => this.connectWallet());
            }

            // Desconectar carteira
            const disconnectBtn = document.getElementById('disconnect-wallet');
            if (disconnectBtn) {
                disconnectBtn.addEventListener('click', () => this.disconnectWallet());
            }

            // Tentar carregar novamente
            const retryBtn = document.getElementById('retry-load');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.validateApiKey());
            }

            // Formulário de compra
            const purchaseForm = document.getElementById('purchase-form');
            if (purchaseForm) {
                purchaseForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handlePurchase();
                });
            }

            // Calcular preço dinamicamente
            const amountInput = document.getElementById('token-amount');
            if (amountInput) {
                amountInput.addEventListener('input', () => this.updatePriceBreakdown());
            }
        }

        // ==================== CONEXÃO METAMASK ====================
        
        async connectWallet() {
            try {
                if (!window.ethereum) {
                    throw new Error('MetaMask não encontrado. Por favor, instale o MetaMask.');
                }

                this.showLoading(true);

                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                if (accounts.length === 0) {
                    throw new Error('Nenhuma conta disponível');
                }

                this.state.account = accounts[0];
                this.state.provider = new ethers.providers.Web3Provider(window.ethereum);
                this.state.signer = this.state.provider.getSigner();

                // Detectar rede
                const network = await this.state.provider.getNetwork();
                this.state.network = network.chainId;

                this.state.connected = true;

                // Carregar dados do usuário
                await this.loadUserData();

                this.showLoading(false);
                this.updateContent();

            } catch (error) {
                this.showLoading(false);
                this.showError(error.message);
            }
        }

        async tryAutoConnect() {
            try {
                if (!window.ethereum) return;

                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (accounts.length > 0) {
                    await this.connectWallet();
                }
            } catch (error) {
                // Silenciar erro de auto-conexão
            }
        }

        disconnectWallet() {
            this.state.connected = false;
            this.state.account = null;
            this.state.provider = null;
            this.state.signer = null;
            this.state.network = null;
            
            this.updateContent();
        }

        // ==================== API CALLS ====================
        
        async validateApiKey() {
            try {
                if (!this.config.apiKey) {
                    throw new Error('API Key não fornecida');
                }

                this.showLoading(true);

                const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/validate-key`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        apiKey: this.config.apiKey,
                        saleId: this.config.saleId
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || 'API Key inválida');
                }

                this.state.saleData = data.saleData;
                this.showLoading(false);
                this.updateContent();

            } catch (error) {
                this.showLoading(false);
                this.showError(error.message);
            }
        }

        async loadUserData() {
            try {
                const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/user-data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        apiKey: this.config.apiKey,
                        wallet: this.state.account
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.state.userCredits = data.credits || 0;
                }

            } catch (error) {
                console.warn('Erro ao carregar dados do usuário:', error);
            }
        }

        async handlePurchase() {
            try {
                const amountInput = document.getElementById('token-amount');
                const tokenAmount = parseFloat(amountInput.value);

                if (!tokenAmount || tokenAmount <= 0) {
                    throw new Error('Digite uma quantidade válida');
                }

                if (this.state.userCredits < 1) {
                    throw new Error('Créditos insuficientes. Recarregue sua conta.');
                }

                this.showLoading(true);

                // Simular compra (integração real com contrato seria aqui)
                const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/purchase-tokens`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        apiKey: this.config.apiKey,
                        saleId: this.config.saleId,
                        wallet: this.state.account,
                        tokenAmount: tokenAmount
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || 'Erro na compra');
                }

                // Atualizar créditos
                this.state.userCredits = data.newCredits;

                this.showLoading(false);
                this.showSuccess('✅ Compra realizada com sucesso!');
                
                // Reset form
                amountInput.value = '';
                this.updatePriceBreakdown();

            } catch (error) {
                this.showLoading(false);
                this.showError(error.message);
            }
        }

        // ==================== UTILITÁRIOS ====================
        
        updateContent() {
            const contentDiv = document.getElementById('widget-content');
            if (contentDiv) {
                contentDiv.innerHTML = this.renderContent();
                this.attachEventListeners();
            }
        }

        updatePriceBreakdown() {
            const amountInput = document.getElementById('token-amount');
            const breakdownDiv = document.getElementById('price-breakdown');
            const purchaseBtn = document.getElementById('purchase-button');

            if (!amountInput || !breakdownDiv || !purchaseBtn) return;

            const amount = parseFloat(amountInput.value);
            
            if (!amount || amount <= 0) {
                breakdownDiv.style.display = 'none';
                purchaseBtn.disabled = true;
                return;
            }

            const sale = this.state.saleData;
            const totalPayment = amount * sale.tokenPrice;
            const commission = totalPayment * 0.02; // 2%
            const sellerAmount = totalPayment - commission;

            breakdownDiv.innerHTML = `
                <div class="price-breakdown">
                    <div class="price-row">
                        <span>Tokens:</span>
                        <span>${amount.toLocaleString()} ${sale.tokenSymbol}</span>
                    </div>
                    <div class="price-row">
                        <span>Preço unitário:</span>
                        <span>${sale.tokenPrice} ${sale.paymentSymbol}</span>
                    </div>
                    <div class="price-row">
                        <span>Subtotal:</span>
                        <span>${totalPayment.toFixed(6)} ${sale.paymentSymbol}</span>
                    </div>
                    <div class="price-row">
                        <span>Taxa da plataforma (2%):</span>
                        <span>${commission.toFixed(6)} ${sale.paymentSymbol}</span>
                    </div>
                    <div class="price-row price-total">
                        <span><strong>Total:</strong></span>
                        <span><strong>${totalPayment.toFixed(6)} ${sale.paymentSymbol}</strong></span>
                    </div>
                </div>
            `;

            breakdownDiv.style.display = 'block';
            purchaseBtn.disabled = false;
        }

        showLoading(show) {
            this.state.loading = show;
            if (show) {
                this.updateContent();
            }
        }

        showError(message) {
            const errorDiv = document.getElementById('connection-error') || 
                           document.getElementById('transaction-status');
            
            if (errorDiv) {
                errorDiv.className = 'widget-error';
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
                
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                }, 5000);
            }
        }

        showSuccess(message) {
            const statusDiv = document.getElementById('transaction-status');
            
            if (statusDiv) {
                statusDiv.className = 'widget-success';
                statusDiv.textContent = message;
                statusDiv.style.display = 'block';
                
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);
            }
        }

        formatAddress(address) {
            if (!address) return '';
            return `${address.substring(0, 6)}...${address.substring(38)}`;
        }
    }

    // ==================== EXPORTAÇÃO GLOBAL ====================
    
    // Disponibilizar globalmente
    window.TokenSaleWidget = TokenSaleWidget;

    // Auto-inicialização se dados estiverem disponíveis
    document.addEventListener('DOMContentLoaded', () => {
        // Procurar por elementos com configuração automática
        const autoWidgets = document.querySelectorAll('[data-token-widget]');
        
        autoWidgets.forEach((element) => {
            const config = {
                containerId: element.id,
                apiKey: element.dataset.apiKey,
                saleId: element.dataset.saleId,
                theme: element.dataset.theme || 'light',
                showBranding: element.dataset.showBranding !== 'false'
            };

            if (config.apiKey) {
                new TokenSaleWidget(config);
            }
        });
    });

})();
