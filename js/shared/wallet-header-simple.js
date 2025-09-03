/**
 * WALLET HEADER SYSTEM - VERSÃO SIMPLIFICADA
 * Cria e gerencia completamente o botão de wallet no header
 */

console.log('🚀 Carregando Wallet Header System...');

// ==================== SISTEMA PRINCIPAL ====================

class SimpleWalletHeader {
    constructor() {
        this.isConnected = false;
        this.userAddress = null;
        this.currentNetwork = null;
        
        this.init();
    }

    /**
     * Inicializa o sistema
     */
    init() {
        console.log('🔧 Inicializando SimpleWalletHeader...');
        
        // Aguardar DOM + Templates carregarem
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.waitForTemplates());
        } else {
            this.waitForTemplates();
        }
    }

    /**
     * Aguarda os templates serem carregados
     */
    waitForTemplates() {
        // Se existe template loader, aguardar evento
        if (window.templateLoader || document.querySelector('[data-component]')) {
            console.log('🔄 Aguardando templates carregarem...');
            
            // Event listener para templates carregados
            document.addEventListener('templatesLoaded', () => {
                console.log('✅ Templates carregados, configurando wallet...');
                setTimeout(() => this.setup(), 500); // delay extra para garantir
            });
            
            // Fallback - tentar após timeout
            setTimeout(() => {
                if (!this.button) {
                    console.log('🔄 Fallback - tentando configurar wallet...');
                    this.setup();
                }
            }, 3000);
            
        } else {
            // Sem template loader, configurar direto
            this.setup();
        }
    }

    /**
     * Configura o sistema
     */
    setup(attempt = 1) {
        const container = document.getElementById('wallet-container');
        
        if (!container) {
            if (attempt <= 5) {
                console.log(`⚠️ Tentativa ${attempt}/5: Container wallet-container não encontrado, tentando novamente...`);
                setTimeout(() => this.setup(attempt + 1), 1000);
            } else {
                console.error('❌ Container wallet-container não encontrado após 5 tentativas!');
            }
            return;
        }

        console.log('✅ Container encontrado, criando interface...');
        this.createInterface(container);
        this.setupEvents();
        this.checkExistingConnection();
    }

    /**
     * Cria interface completa
     */
    createInterface(container) {
        container.innerHTML = `
            <button id="wallet-btn" class="btn btn-outline-primary me-2">
                <i class="bi bi-wallet2 me-1"></i>
                <span id="wallet-text">Conectar Wallet</span>
            </button>
            <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-globe"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-end" data-component="translate-component"></div>
            </div>
        `;

        this.button = container.querySelector('#wallet-btn');
        this.text = container.querySelector('#wallet-text');
        this.icon = container.querySelector('i.bi-wallet2');

        console.log('✅ Interface criada com sucesso');
    }

    /**
     * Configura eventos
     */
    setupEvents() {
        if (!this.button) return;

        this.button.addEventListener('click', () => this.handleClick());

        // MetaMask events
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    this.userAddress = accounts[0];
                    this.isConnected = true;
                    this.updateUI();
                } else {
                    this.disconnect();
                }
            });

            window.ethereum.on('chainChanged', () => {
                this.getNetworkInfo();
            });
        }

        console.log('✅ Eventos configurados');
    }

    /**
     * Handle do clique
     */
    async handleClick() {
        if (this.isConnected) {
            this.disconnect();
        } else {
            await this.connect();
        }
    }

    /**
     * Conecta com MetaMask
     */
    async connect() {
        if (!window.ethereum) {
            alert('MetaMask não encontrado! Por favor, instale o MetaMask.');
            return;
        }

        try {
            this.setLoading(true);

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                this.userAddress = accounts[0];
                this.isConnected = true;
                await this.getNetworkInfo();
                this.updateUI();
                console.log('✅ Conectado:', this.userAddress);
            }

        } catch (error) {
            console.error('❌ Erro ao conectar:', error);
            alert('Erro ao conectar: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Desconecta
     */
    disconnect() {
        this.isConnected = false;
        this.userAddress = null;
        this.currentNetwork = null;
        this.updateUI();
        console.log('🔌 Desconectado');
    }

    /**
     * Verifica conexão existente
     */
    async checkExistingConnection() {
        if (!window.ethereum) return;

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (accounts.length > 0) {
                this.userAddress = accounts[0];
                this.isConnected = true;
                await this.getNetworkInfo();
                this.updateUI();
                console.log('✅ Reconectado:', this.userAddress);
            }
        } catch (error) {
            console.log('⚠️ Erro ao verificar conexão:', error);
        }
    }

    /**
     * Obtém info da rede
     */
    async getNetworkInfo() {
        if (!window.ethereum) return;

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            this.currentNetwork = this.getNetworkName(chainId);
        } catch (error) {
            console.log('⚠️ Erro ao obter rede:', error);
        }
    }

    /**
     * Nome da rede por Chain ID
     */
    getNetworkName(chainId) {
        const networks = {
            '0x1': { name: 'Ethereum', chainId: '1' },
            '0x38': { name: 'BSC', chainId: '56' },
            '0x61': { name: 'BSC Testnet', chainId: '97' },
            '0x89': { name: 'Polygon', chainId: '137' },
            '0xaa36a7': { name: 'Sepolia', chainId: '11155111' },
            '0x2105': { name: 'Base', chainId: '8453' }
        };
        
        return networks[chainId] || { name: `Chain ${chainId}`, chainId };
    }

    /**
     * Atualiza interface
     */
    updateUI() {
        if (!this.button || !this.text || !this.icon) return;

        if (this.isConnected && this.userAddress) {
            // Conectado
            const short = `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}`;
            this.text.textContent = short;
            this.button.className = 'btn btn-success me-2';
            this.button.title = `Conectado à ${this.currentNetwork?.name || 'rede desconhecida'}\nClique para desconectar`;
            this.icon.className = 'bi bi-check-circle me-1';
        } else {
            // Desconectado
            this.text.textContent = 'Conectar Wallet';
            this.button.className = 'btn btn-outline-primary me-2';
            this.button.title = 'Conectar com MetaMask';
            this.icon.className = 'bi bi-wallet2 me-1';
        }
    }

    /**
     * Loading state
     */
    setLoading(loading) {
        if (!this.button || !this.text) return;

        this.button.disabled = loading;
        
        if (loading) {
            this.text.textContent = 'Conectando...';
            this.icon.className = 'bi bi-hourglass-split me-1';
        }
    }

    /**
     * API pública
     */
    getWalletInfo() {
        return {
            isConnected: this.isConnected,
            address: this.userAddress,
            network: this.currentNetwork
        };
    }
}

// ==================== INICIALIZAÇÃO ====================

// Criar instância global
const walletHeader = new SimpleWalletHeader();

// Expor globalmente
window.WalletHeader = walletHeader;

console.log('📦 SimpleWalletHeader carregado e pronto!');
