/**
 * WIDGET SALE MODULE
 * Módulo responsável por criar e gerenciar widgets de venda de tokens
 * Sistema isolado com CSS próprio
 */

class TokenSaleWidget {
    constructor(options = {}) {
        this.apiKey = options.apiKey;
        this.containerId = options.containerId || 'widget-demo-container';
        this.theme = options.theme || 'light';
        this.saleId = options.saleId || 'demo-sale';
        
        // Configurações do token
        this.tokenPrice = options.tokenPrice || 0.01;
        this.minAmount = options.minAmount || 100; // Quantidade mínima do contrato
        this.maxAmount = options.maxAmount || 10000;
        this.available = options.available || '1M';
        this.currency = options.currency || 'USDT';
        
        this.init();
    }

    async init() {
        try {
            console.log('🎮 Inicializando Widget Sale...');
            this.loadWidgetCSS();
            this.createWidget();
        } catch (error) {
            console.error('❌ Erro ao inicializar Widget Sale:', error);
        }
    }

    /**
     * Carrega CSS específico do widget
     */
    loadWidgetCSS() {
        // Verificar se o CSS já foi carregado
        if (document.getElementById('widget-sale-css')) return;

        const link = document.createElement('link');
        link.id = 'widget-sale-css';
        link.rel = 'stylesheet';
        link.href = 'css/widget-sale.css';
        document.head.appendChild(link);
    }

    createWidget() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn('Container não encontrado:', this.containerId);
            return;
        }

        container.innerHTML = this.getWidgetHTML();
        this.setupEventListeners();
    }

    getWidgetHTML() {
        return `
            <div class="token-sale-widget ${this.theme}">
                <div class="widget-header">
                    <h5 class="mb-0">
                        <span>
                            <i class="fas fa-coins" style="color: #ffc107; margin-right: 8px;"></i>
                            Comprar Tokens
                        </span>
                        <span class="badge">Demo</span>
                    </h5>
                </div>
                
                <div class="widget-body">
                    <div class="token-info mb-3">
                        <div class="row">
                            <div class="col-6">
                                <small>Preço</small>
                                <div class="fw-bold">$${this.tokenPrice} ${this.currency}</div>
                            </div>
                            <div class="col-6">
                                <small>Disponível</small>
                                <div class="fw-bold">${this.available} Tokens</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="purchase-form">
                        <div class="mb-3">
                            <label class="form-label">Quantidade de Tokens</label>
                            <div class="input-group">
                                <input type="number" class="form-control" id="token-amount-${this.saleId}" 
                                       placeholder="${this.minAmount}" min="${this.minAmount}" max="${this.maxAmount}" value="${this.minAmount}">
                                <span class="input-group-text">Tokens</span>
                            </div>
                        </div>
                        
                        <div class="total-display">
                            <span>Total:</span>
                            <span id="total-price-${this.saleId}">$${(this.minAmount * this.tokenPrice).toFixed(2)} ${this.currency}</span>
                        </div>
                        
                        <div class="connection-status" id="widget-connection-status-${this.saleId}">
                            <div class="alert alert-warning">
                                <i class="fas fa-wallet"></i>
                                Conecte sua carteira para continuar
                            </div>
                        </div>
                        
                        <button class="btn btn-primary" id="widget-connect-btn-${this.saleId}">
                            <i class="fab fa-ethereum"></i>
                            Conectar MetaMask
                        </button>
                        
                        <button class="btn btn-success d-none" id="widget-buy-btn-${this.saleId}">
                            <i class="fas fa-shopping-cart"></i>
                            Comprar Tokens
                        </button>
                    </div>
                </div>
                
                <div class="widget-footer">
                    <small>
                        <i class="fas fa-shield-alt"></i>
                        Transação segura via blockchain
                    </small>
                    <a href="https://xcafe.app" target="_blank" class="powered-by">
                        <i class="fas fa-code"></i>
                        Desenvolvido por xcafe.app
                    </a>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Input de quantidade com ID único
        const amountInput = document.getElementById(`token-amount-${this.saleId}`);
        if (amountInput) {
            amountInput.addEventListener('input', () => this.updateTotal());
        }

        // Botão de conectar com ID único
        const connectBtn = document.getElementById(`widget-connect-btn-${this.saleId}`);
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnect());
        }

        // Botão de comprar com ID único
        const buyBtn = document.getElementById(`widget-buy-btn-${this.saleId}`);
        if (buyBtn) {
            buyBtn.addEventListener('click', () => this.handlePurchase());
        }

        // Verificar se já está conectado
        this.checkConnection();
    }

    updateTotal() {
        const amountInput = document.getElementById(`token-amount-${this.saleId}`);
        const totalPrice = document.getElementById(`total-price-${this.saleId}`);
        
        if (amountInput && totalPrice) {
            const amount = parseFloat(amountInput.value) || 0;
            const price = amount * this.tokenPrice;
            totalPrice.textContent = `$${price.toFixed(2)} ${this.currency}`;
        }
    }

    async checkConnection() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                
                if (accounts.length > 0) {
                    this.updateConnectionStatus(true, accounts[0]);
                } else {
                    this.updateConnectionStatus(false);
                }
            } else {
                this.updateConnectionStatus(false, null, 'MetaMask não detectado');
            }
        } catch (error) {
            console.error('Erro ao verificar conexão:', error);
            this.updateConnectionStatus(false, null, 'Erro na conexão');
        }
    }

    updateConnectionStatus(connected, account = null, error = null) {
        const statusContainer = document.getElementById(`widget-connection-status-${this.saleId}`);
        const connectBtn = document.getElementById(`widget-connect-btn-${this.saleId}`);
        const buyBtn = document.getElementById(`widget-buy-btn-${this.saleId}`);
        
        if (!statusContainer || !connectBtn || !buyBtn) return;

        if (connected && account) {
            statusContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    Conectado: ${account.substring(0, 6)}...${account.substring(38)}
                </div>
            `;
            connectBtn.classList.add('d-none');
            buyBtn.classList.remove('d-none');
        } else {
            const message = error || 'Conecte sua carteira para continuar';
            statusContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-wallet"></i>
                    ${message}
                </div>
            `;
            connectBtn.classList.remove('d-none');
            buyBtn.classList.add('d-none');
        }
    }

    async handleConnect() {
        try {
            if (typeof window.ethereum === 'undefined') {
                alert('MetaMask não detectado. Por favor instale a extensão.');
                return;
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                this.updateConnectionStatus(true, accounts[0]);
                this.showMessage('Carteira conectada com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro ao conectar:', error);
            this.showMessage('Erro ao conectar carteira', 'error');
        }
    }

    async handlePurchase() {
        try {
            const amountInput = document.getElementById(`token-amount-${this.saleId}`);
            const amount = parseInt(amountInput.value);
            
            if (amount < this.minAmount) {
                this.showMessage(`Quantidade mínima: ${this.minAmount} tokens`, 'warning');
                return;
            }

            if (amount > this.maxAmount) {
                this.showMessage(`Quantidade máxima: ${this.maxAmount} tokens`, 'warning');
                return;
            }

            // Simulação da transação
            this.showMessage('Processando transação...', 'info');
            
            // Aqui seria feita a chamada real para o contrato
            setTimeout(() => {
                this.showMessage('Compra realizada com sucesso!', 'success');
            }, 2000);

        } catch (error) {
            console.error('Erro na compra:', error);
            this.showMessage('Erro ao processar transação', 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Implementação básica de notificação
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Aqui poderia ser integrado com um sistema de notificações
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * Atualiza configurações do widget
     */
    updateConfig(newConfig) {
        Object.assign(this, newConfig);
        this.createWidget(); // Recriar widget com novas configurações
    }

    /**
     * Destroi o widget
     */
    destroy() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Exportar para uso global
window.TokenSaleWidget = TokenSaleWidget;
