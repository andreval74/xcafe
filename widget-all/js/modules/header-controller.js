/**
 * 🎯 HEADER CONTROLLER - Controlador do Cabeçalho
 * 
 * 📋 RESPONSABILIDADES:
 * - Gerenciar estado visual do botão de conexão
 * - Atualizar interface baseada no status da carteira
 * - Controlar navegação para dashboard
 * - Mostrar feedback visual de conexão
 * 
 * 🎨 ESTADOS VISUAIS:
 * - Desconectado: Botão vermelho "Conectar Carteira" + Dashboard cinza/desabilitado
 * - Conectado: Botão verde com endereço + Dashboard azul/habilitado
 * - Conectando: Botão com spinner de loading
 * 
 * 🔧 DEPENDÊNCIAS:
 * - Web3Manager para estado da carteira
 * - Bootstrap para classes CSS
 * 
 * 🎯 USO:
 * - new HeaderController(web3Manager);
 * - Integração automática com eventos Web3
 */

class HeaderController {
    constructor(web3Manager) {
        this.web3Manager = web3Manager;
        this.elements = {};
        
        // Estados da interface
        this.states = {
            DISCONNECTED: 'disconnected',
            CONNECTING: 'connecting', 
            CONNECTED: 'connected',
            ERROR: 'error'
        };
        
        this.currentState = this.states.DISCONNECTED;
        
        this.init();
    }

    // ==================== INICIALIZAÇÃO ====================
    
    /**
     * Inicializa o controlador do header
     */
    async init() {
        try {
            console.log('🎯 Inicializando Header Controller...');
            
            // Aguardar carregamento do DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupAfterDOM());
            } else {
                this.setupAfterDOM();
            }
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Header Controller:', error);
        }
    }

    /**
     * Configuração após DOM carregado
     */
    async setupAfterDOM() {
        // Aguardar template loader carregar o header
        await this.waitForHeaderLoad();
        
        // Obter elementos do DOM
        this.getElements();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar estado inicial
        await this.updateUI();
        
        console.log('✅ Header Controller inicializado');
    }

    /**
     * Aguarda o header ser carregado pelo template loader
     */
    async waitForHeaderLoad() {
        return new Promise((resolve) => {
            const checkHeader = () => {
                const connectBtn = document.getElementById('connect-wallet-btn');
                if (connectBtn) {
                    resolve();
                } else {
                    setTimeout(checkHeader, 100);
                }
            };
            checkHeader();
        });
    }

    // ==================== ELEMENTOS DO DOM ====================
    
    /**
     * Obtém referências dos elementos do DOM
     */
    getElements() {
        this.elements = {
            connectBtn: document.getElementById('connect-wallet-btn'),
            dashboardBtn: document.getElementById('dashboard-btn'),
            languageBtn: document.getElementById('language-btn')
        };

        // Verificar se todos os elementos foram encontrados
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`⚠️ Elemento não encontrado: ${key}`);
            }
        }
    }

    // ==================== EVENT LISTENERS ====================
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botão de conectar carteira
        if (this.elements.connectBtn) {
            this.elements.connectBtn.addEventListener('click', () => this.handleConnectClick());
        }

        // Botão do dashboard
        if (this.elements.dashboardBtn) {
            this.elements.dashboardBtn.addEventListener('click', () => this.handleDashboardClick());
        }

        // Botão de idiomas
        if (this.elements.languageBtn) {
            this.elements.languageBtn.addEventListener('click', () => this.handleLanguageClick());
        }

        // Event listeners do Web3Manager
        if (this.web3Manager) {
            // Carteira conectada
            document.addEventListener('web3:walletConnected', (e) => {
                console.log('🔌 Header: Carteira conectada', e.detail);
                this.updateUI();
            });

            // Carteira desconectada
            document.addEventListener('web3:walletDisconnected', () => {
                console.log('🔌 Header: Carteira desconectada');
                this.updateUI();
            });

            // Conta alterada
            document.addEventListener('web3:accountChanged', (e) => {
                console.log('👤 Header: Conta alterada', e.detail);
                this.updateUI();
            });

            // Rede alterada
            document.addEventListener('web3:networkChanged', (e) => {
                console.log('🔗 Header: Rede alterada', e.detail);
                this.updateUI();
            });
        }
    }

    // ==================== HANDLERS DE EVENTOS ====================
    
    /**
     * Manipula clique no botão de conectar
     */
    async handleConnectClick() {
        try {
            if (!this.web3Manager) {
                this.showError('Web3Manager não disponível');
                return;
            }

            if (this.currentState === this.states.CONNECTED) {
                // Se conectado, desconectar
                await this.handleDisconnect();
            } else {
                // Se desconectado, conectar
                await this.handleConnect();
            }
        } catch (error) {
            console.error('❌ Erro no clique do botão conectar:', error);
            this.showError('Erro ao conectar: ' + error.message);
        }
    }

    /**
     * Manipula processo de conexão
     */
    async handleConnect() {
        try {
            this.setState(this.states.CONNECTING);
            
            const account = await this.web3Manager.connectWallet();
            
            if (account) {
                this.setState(this.states.CONNECTED);
                this.showSuccess('Carteira conectada com sucesso!');
            }
        } catch (error) {
            this.setState(this.states.ERROR);
            throw error;
        }
    }

    /**
     * Manipula processo de desconexão
     */
    async handleDisconnect() {
        try {
            await this.web3Manager.disconnect();
            this.setState(this.states.DISCONNECTED);
            this.showInfo('Carteira desconectada');
        } catch (error) {
            console.error('❌ Erro ao desconectar:', error);
        }
    }

    /**
     * Manipula clique no botão do dashboard
     */
    handleDashboardClick() {
        if (this.currentState === this.states.CONNECTED) {
            window.location.href = 'dashboard.html';
        } else {
            this.showWarning('Conecte sua carteira primeiro');
        }
    }

    /**
     * Manipula clique no botão de idiomas
     */
    handleLanguageClick() {
        // Placeholder - Sistema de tradução será implementado futuramente
        console.log('🌐 Sistema de tradução ainda não implementado');
        this.showInfo('Sistema de tradução em desenvolvimento');
    }

    // ==================== CONTROLE DE ESTADO ====================
    
    /**
     * Define estado atual e atualiza UI
     */
    setState(newState) {
        this.currentState = newState;
        this.updateUI();
    }

    /**
     * Atualiza interface baseada no estado atual
     */
    async updateUI() {
        try {
            // Determinar estado atual
            if (this.web3Manager && this.web3Manager.isConnected) {
                this.currentState = this.states.CONNECTED;
            } else {
                this.currentState = this.states.DISCONNECTED;
            }

            // Atualizar elementos baseado no estado
            this.updateConnectButton();
            this.updateDashboardButton();
            this.updateLanguageFlag();
            
        } catch (error) {
            console.error('❌ Erro ao atualizar UI:', error);
        }
    }

    /**
     * Atualiza botão de conectar carteira
     */
    updateConnectButton() {
        if (!this.elements.connectBtn) return;

        const btn = this.elements.connectBtn;

        switch (this.currentState) {
            case this.states.CONNECTED:
                const account = this.web3Manager.getCurrentAccount();
                
                btn.className = 'btn btn-sm btn-primary btn-custom';
                btn.innerHTML = '<i class="fas fa-wallet"></i>';
                btn.title = `Conectado: ${account}\nClique para desconectar`;
                btn.disabled = false;
                break;
                
            case this.states.CONNECTING:
                btn.className = 'btn btn-sm btn-outline-secondary btn-custom btn-loading';
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                btn.title = 'Conectando...';
                btn.disabled = true;
                break;
                
            case this.states.ERROR:
                btn.className = 'btn btn-sm btn-outline-danger btn-custom';
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                btn.title = 'Erro - Clique para tentar novamente';
                btn.disabled = false;
                break;
                
            default: // DISCONNECTED
                btn.className = 'btn btn-sm btn-outline-secondary btn-custom';
                btn.innerHTML = '<i class="fas fa-wallet"></i>';
                btn.title = 'Conectar carteira MetaMask';
                btn.disabled = false;
        }
    }

    /**
     * Atualiza botão do dashboard
     */
    updateDashboardButton() {
        if (!this.elements.dashboardBtn) return;

        const btn = this.elements.dashboardBtn;

        if (this.currentState === this.states.CONNECTED) {
            // Habilitado - verde
            btn.className = 'btn btn-sm btn-success btn-custom';
            btn.disabled = false;
            btn.title = 'Abrir Dashboard';
        } else {
            // Desabilitado - cinza
            btn.className = 'btn btn-sm btn-outline-secondary btn-custom';
            btn.disabled = true;
            btn.title = 'Conecte sua carteira primeiro';
        }
    }

    /**
     * Atualiza botão/flag de idioma
     */
    updateLanguageFlag() {
        if (!this.elements.languageBtn) return;

        const btn = this.elements.languageBtn;
        
        // Por enquanto, sistema básico de PT-BR
        btn.innerHTML = '<i class="fas fa-globe me-1"></i>PT';
        btn.title = 'Sistema de tradução em desenvolvimento';
        btn.className = 'btn btn-sm btn-outline-secondary btn-custom';
        
        // Desabilitado temporariamente até implementar tradução completa
        btn.disabled = true;
    }

    // ==================== NOTIFICAÇÕES ====================
    
    /**
     * Mostra notificação de sucesso
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Mostra notificação de erro
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Mostra notificação de aviso
     */
    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    /**
     * Mostra notificação informativa
     */
    showInfo(message) {
        this.showNotification(message, 'info');
    }

    /**
     * Sistema de notificações (integração com IndexPage se disponível)
     */
    showNotification(message, type) {
        // Tentar usar sistema do IndexPage se disponível
        if (window.IndexPage && window.getIndexPageInstance) {
            const indexInstance = window.getIndexPageInstance();
            if (indexInstance && indexInstance.showToast) {
                indexInstance.showToast(message, type);
                return;
            }
        }

        // Fallback simples
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Toast simples com Bootstrap se disponível
        if (typeof bootstrap !== 'undefined') {
            this.createSimpleToast(message, type);
        }
    }

    /**
     * Cria toast simples
     */
    createSimpleToast(message, type) {
        const toastHTML = `
            <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        // Adicionar ao DOM temporariamente
        const container = document.createElement('div');
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        container.innerHTML = toastHTML;
        document.body.appendChild(container);

        // Ativar toast
        const toastElement = container.querySelector('.toast');
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Remover após fechamento
        toastElement.addEventListener('hidden.bs.toast', () => {
            container.remove();
        });
    }

    // ==================== UTILIDADES ====================
    
    /**
     * Obtém estado atual
     */
    getState() {
        return {
            currentState: this.currentState,
            isConnected: this.currentState === this.states.CONNECTED,
            account: this.web3Manager ? this.web3Manager.getCurrentAccount() : null,
            network: this.web3Manager ? this.web3Manager.getCurrentNetwork() : null
        };
    }

    /**
     * Força atualização da UI
     */
    refresh() {
        this.updateUI();
    }
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

// Aguardar carregamento dos módulos e inicializar automaticamente
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar Web3Manager estar disponível
    const initHeader = () => {
        if (window.Web3Manager) {
            // Aguardar instância do Web3Manager (pode ser criada pelo IndexPage)
            setTimeout(() => {
                // Criar ou obter instância do Web3Manager
                let web3Manager = window.web3ManagerInstance;
                if (!web3Manager) {
                    web3Manager = new window.Web3Manager();
                    window.web3ManagerInstance = web3Manager;
                }
                
                // Criar HeaderController
                const headerController = new HeaderController(web3Manager);
                window.headerController = headerController;
                
                console.log('🎯 HeaderController inicializado automaticamente');
            }, 500);
        } else {
            // Tentar novamente em 100ms
            setTimeout(initHeader, 100);
        }
    };
    
    initHeader();
});

// ==================== EXPORTAÇÃO ====================

// Disponibilizar globalmente
window.HeaderController = HeaderController;

// Log de carregamento
console.log('📦 HeaderController carregado');

/**
 * 📚 EXEMPLO DE USO:
 * 
 * // Inicialização manual
 * const web3 = new Web3Manager();
 * const header = new HeaderController(web3);
 * 
 * // Verificar estado
 * console.log(header.getState());
 * 
 * // Atualizar manualmente
 * header.refresh();
 */
