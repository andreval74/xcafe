/**
 * WIDGET SALE MODULE
 * Módulo responsável por criar e gerenciar widgets de venda de tokens
 */

class TokenSaleWidget {
    constructor(options = {}) {
        this.apiKey = options.apiKey;
        this.containerId = options.containerId || 'widget-demo-container';
        this.theme = options.theme || 'light';
        this.saleId = options.saleId || 'demo-sale';
        
        this.init();
    }

    async init() {
        try {
            console.log('🎮 Inicializando Widget Sale...');
            this.createWidget();
        } catch (error) {
            console.error('❌ Erro ao inicializar Widget Sale:', error);
        }
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
                    <div class="d-flex align-items-center justify-content-between">
                        <h5 class="mb-0">
                            <i class="fas fa-coins text-warning me-2"></i>
                            Comprar Tokens
                        </h5>
                        <span class="badge bg-success">Demo</span>
                    </div>
                </div>
                
                <div class="widget-body">
                    <div class="token-info mb-3">
                        <div class="row">
                            <div class="col-6">
                                <small class="text-muted">Preço</small>
                                <div class="fw-bold">$0.01 USDT</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Disponível</small>
                                <div class="fw-bold">1M Tokens</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="purchase-form">
                        <div class="mb-3">
                            <label class="form-label">Quantidade de Tokens</label>
                            <div class="input-group">
                                <input type="number" class="form-control" id="token-amount" 
                                       placeholder="1000" min="1" max="10000" value="1000">
                                <span class="input-group-text">Tokens</span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Total:</span>
                                <span class="fw-bold" id="total-price">$10.00 USDT</span>
                            </div>
                        </div>
                        
                        <div class="connection-status mb-3" id="widget-connection-status">
                            <div class="alert alert-warning">
                                <i class="fas fa-wallet me-2"></i>
                                Conecte sua carteira para continuar
                            </div>
                        </div>
                        
                        <button class="btn btn-primary w-100" id="widget-connect-btn">
                            <i class="fab fa-ethereum me-2"></i>
                            Conectar MetaMask
                        </button>
                        
                        <button class="btn btn-success w-100 d-none" id="widget-buy-btn">
                            <i class="fas fa-shopping-cart me-2"></i>
                            Comprar Tokens
                        </button>
                    </div>
                </div>
                
                <div class="widget-footer">
                    <small class="text-muted">
                        <i class="fas fa-shield-alt me-1"></i>
                        Transação segura via blockchain
                    </small>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Input de quantidade
        const amountInput = document.getElementById('token-amount');
        if (amountInput) {
            amountInput.addEventListener('input', () => this.updateTotal());
        }

        // Botão de conectar
        const connectBtn = document.getElementById('widget-connect-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnect());
        }

        // Botão de comprar
        const buyBtn = document.getElementById('widget-buy-btn');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => this.handlePurchase());
        }

        // Verificar se já está conectado
        this.checkConnection();
    }

    updateTotal() {
        const amountInput = document.getElementById('token-amount');
        const totalPrice = document.getElementById('total-price');
        
        if (amountInput && totalPrice) {
            const amount = parseFloat(amountInput.value) || 0;
            const price = amount * 0.01; // $0.01 per token
            totalPrice.textContent = `$${price.toFixed(2)} USDT`;
        }
    }

    async checkConnection() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                
                if (accounts.length > 0) {
                    this.updateConnectionUI(true, accounts[0]);
                }
            }
        } catch (error) {
            console.warn('Erro ao verificar conexão:', error);
        }
    }

    async handleConnect() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length > 0) {
                    this.updateConnectionUI(true, accounts[0]);
                }
            } else {
                alert('MetaMask não encontrado. Por favor instale a extensão MetaMask.');
            }
        } catch (error) {
            console.error('Erro ao conectar carteira:', error);
            alert('Erro ao conectar carteira: ' + error.message);
        }
    }

    updateConnectionUI(connected, account = null) {
        const statusDiv = document.getElementById('widget-connection-status');
        const connectBtn = document.getElementById('widget-connect-btn');
        const buyBtn = document.getElementById('widget-buy-btn');
        
        if (!statusDiv || !connectBtn || !buyBtn) return;

        if (connected && account) {
            statusDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    Conectado: ${account.substring(0, 6)}...${account.substring(38)}
                </div>
            `;
            connectBtn.classList.add('d-none');
            buyBtn.classList.remove('d-none');
        } else {
            statusDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-wallet me-2"></i>
                    Conecte sua carteira para continuar
                </div>
            `;
            connectBtn.classList.remove('d-none');
            buyBtn.classList.add('d-none');
        }
    }

    async handlePurchase() {
        try {
            const amountInput = document.getElementById('token-amount');
            const amount = parseFloat(amountInput.value) || 0;
            
            if (amount <= 0) {
                alert('Por favor insira uma quantidade válida de tokens.');
                return;
            }
            
            // Simular compra (em produção seria uma transação real)
            const buyBtn = document.getElementById('widget-buy-btn');
            buyBtn.disabled = true;
            buyBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processando...';
            
            // Simular delay de transação
            setTimeout(() => {
                buyBtn.disabled = false;
                buyBtn.innerHTML = '<i class="fas fa-shopping-cart me-2"></i>Comprar Tokens';
                
                // Mostrar sucesso
                const statusDiv = document.getElementById('widget-connection-status');
                statusDiv.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        Compra simulada com sucesso! ${amount} tokens
                    </div>
                `;
                
                setTimeout(() => {
                    this.checkConnection(); // Restaurar status
                }, 3000);
            }, 2000);
            
        } catch (error) {
            console.error('Erro na compra:', error);
            alert('Erro na compra: ' + error.message);
        }
    }
}

// Auto-inicializar widgets na página
document.addEventListener('DOMContentLoaded', () => {
    const widgetContainers = document.querySelectorAll('[data-token-widget]');
    
    widgetContainers.forEach(container => {
        const apiKey = container.dataset.apiKey || 'demo-key';
        const saleId = container.dataset.saleId || 'demo-sale';
        const theme = container.dataset.theme || 'light';
        
        new TokenSaleWidget({
            apiKey: apiKey,
            containerId: container.id,
            saleId: saleId,
            theme: theme
        });
    });
});

// Exportar para uso global
window.TokenSaleWidget = TokenSaleWidget;
