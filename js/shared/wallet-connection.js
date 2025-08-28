/**
 * SISTEMA DE CONEXÃO DE CARTEIRA PADRÃO - xcafe
 * 
 * 🎯 RESPONSABILIDADES:
 * - Conexão padronizada com MetaMask
 * - Detecção automática de rede
 * - Atualização de saldo
 * - Interface unificada para todos os módulos
 * - Validações de segurança
 * 
 * 📦 DEPENDENCIES:
 * - ethers.js v5.7.2
 * - MetaMask Extension
 * 
 * 🔧 USAGE:
 * - WalletManager.connect()
 * - WalletManager.disconnect()
 * - WalletManager.getStatus()
 */

class WalletConnection {
    constructor() {
        this.isConnected = false;
        this.address = '';
        this.balance = '0.0000';
        this.network = null;
        this.provider = null;
        this.signer = null;
        this.balanceUpdateInProgress = false;
        
        // Configurações
        this.config = {
            supportedChains: [56, 97, 1, 5, 137, 80001], // BSC, Ethereum, Polygon
            defaultTimeout: 10000,
            balanceUpdateInterval: 30000 // 30 segundos
        };
        
        // Event listeners para mudanças de conta/rede
        this.setupEventListeners();
    }
    
    /**
     * Conecta com MetaMask
     */
    async connect() {
        try {
            if (!this.isMetaMaskAvailable()) {
                throw new Error('MetaMask não detectado! Por favor, instale a extensão MetaMask.');
            }
            
            console.log('🔗 Iniciando conexão com MetaMask...');
            
            // Mostrar loading no botão
            this.showButtonLoading('connect-metamask-btn', 'Conectando...');
            
            // Solicitar conexão
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                throw new Error('Nenhuma conta encontrada. Desbloqueie sua MetaMask.');
            }
            
            // Configurar estado
            this.address = accounts[0];
            this.isConnected = true;
            
            // Inicializar provider
            await this.initializeProvider();
            
            // Detectar rede
            await this.detectNetwork();
            
            // Atualizar UI
            this.updateWalletUI();
            
            // Carregar saldo
            setTimeout(() => {
                this.updateBalance();
            }, 800);
            
            console.log('✅ Wallet conectada:', this.address);
            console.log('🌐 Rede detectada:', this.network?.name);
            
            return {
                success: true,
                address: this.address,
                network: this.network
            };
            
        } catch (error) {
            console.error('❌ Erro ao conectar wallet:', error);
            
            // Restaurar botão
            this.hideButtonLoading('connect-metamask-btn', '<i class="bi bi-wallet2 me-2"></i>CONECTAR');
            
            throw error;
        }
    }
    
    /**
     * Desconecta wallet
     */
    disconnect() {
        this.isConnected = false;
        this.address = '';
        this.balance = '0.0000';
        this.network = null;
        this.provider = null;
        this.signer = null;
        
        this.updateWalletUI();
        console.log('🔌 Wallet desconectada');
    }
    
    /**
     * Verifica se MetaMask está disponível
     */
    isMetaMaskAvailable() {
        return typeof window.ethereum !== 'undefined';
    }
    
    /**
     * Inicializa provider do ethers.js
     */
    async initializeProvider() {
        try {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            console.log('✅ Provider inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar provider:', error);
            throw error;
        }
    }
    
    /**
     * Detecta rede atual
     */
    async detectNetwork() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            this.network = this.getNetworkInfo(chainId);
            
            console.log(`🌐 Rede detectada: ${this.network.name} (${chainId})`);
            
        } catch (error) {
            console.error('❌ Erro ao detectar rede:', error);
            this.network = { name: 'Desconhecida', chainId: 0, currency: 'ETH' };
        }
    }
    
    /**
     * Obtém informações da rede baseado no chainId
     */
    getNetworkInfo(chainId) {
        const networks = {
            '0x1': { name: 'Ethereum Mainnet', chainId: 1, currency: 'ETH', explorer: 'https://etherscan.io' },
            '0x5': { name: 'Goerli Testnet', chainId: 5, currency: 'ETH', explorer: 'https://goerli.etherscan.io' },
            '0x38': { name: 'BSC Mainnet', chainId: 56, currency: 'BNB', explorer: 'https://bscscan.com' },
            '0x61': { name: 'BSC Testnet', chainId: 97, currency: 'BNB', explorer: 'https://testnet.bscscan.com' },
            '0x89': { name: 'Polygon Mainnet', chainId: 137, currency: 'MATIC', explorer: 'https://polygonscan.com' },
            '0x13881': { name: 'Polygon Mumbai', chainId: 80001, currency: 'MATIC', explorer: 'https://mumbai.polygonscan.com' }
        };
        
        return networks[chainId] || { 
            name: 'Rede Desconhecida', 
            chainId: parseInt(chainId, 16), 
            currency: 'ETH',
            explorer: '#'
        };
    }
    
    /**
     * Atualiza saldo da carteira
     */
    async updateBalance() {
        if (this.balanceUpdateInProgress || !this.isConnected || !this.address) {
            return;
        }
        
        const balanceElement = document.getElementById('wallet-balance-display');
        if (!balanceElement) return;
        
        try {
            this.balanceUpdateInProgress = true;
            
            // Mostrar loading
            balanceElement.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Carregando...';
            
            // Buscar saldo
            const balance = await this.provider.getBalance(this.address);
            const balanceInEth = ethers.utils.formatEther(balance);
            
            // Formatar para exibição
            this.balance = parseFloat(balanceInEth).toFixed(4);
            
            // Atualizar UI
            balanceElement.innerHTML = `${this.balance} ${this.network?.currency || 'ETH'}`;
            
            console.log(`💰 Saldo atualizado: ${this.balance} ${this.network?.currency}`);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar saldo:', error);
            balanceElement.innerHTML = 'Erro ao carregar';
        } finally {
            this.balanceUpdateInProgress = false;
        }
    }
    
    /**
     * Atualiza interface do usuário
     */
    updateWalletUI() {
        // Status da conexão
        const statusInput = document.getElementById('wallet-status');
        const connectBtn = document.getElementById('connect-metamask-btn');
        const networkInfoSection = document.getElementById('network-info-section');
        const currentNetworkDisplay = document.getElementById('current-network');
        const chainIdDisplay = document.getElementById('chain-id-value');
        
        // Informações detalhadas da wallet (se existir)
        const walletConnectionInfo = document.getElementById('wallet-connection-info');
        const connectedAddress = document.getElementById('connected-address');
        const walletBalance = document.getElementById('wallet-balance');
        const currentNetworkSimple = document.getElementById('current-network-simple');
        const chainIdValueSimple = document.getElementById('chain-id-value-simple');
        
        if (this.isConnected) {
            // Atualizar status
            if (statusInput) {
                statusInput.value = this.address;
                statusInput.classList.remove('border-secondary');
                statusInput.classList.add('border-success');
            }
            
            // Atualizar botão
            if (connectBtn) {
                connectBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>CONECTADO';
                connectBtn.classList.remove('btn-warning');
                connectBtn.classList.add('btn-success');
                connectBtn.disabled = true;
            }
            
            // Mostrar informações da rede
            if (networkInfoSection) {
                networkInfoSection.style.display = 'block';
                console.log('🌐 Mostrando seção de rede');
            }
            if (currentNetworkDisplay) {
                currentNetworkDisplay.textContent = this.network?.name || 'Desconhecida';
                console.log('🌐 Rede atualizada:', this.network?.name);
            }
            if (chainIdDisplay) {
                chainIdDisplay.textContent = this.network?.chainId || '0';
                console.log('🔗 Chain ID atualizado:', this.network?.chainId);
            }
            
            // Atualizar informações detalhadas (se existir)
            if (walletConnectionInfo) {
                walletConnectionInfo.style.display = 'block';
            }
            if (connectedAddress) {
                connectedAddress.textContent = this.address;
            }
            if (walletBalance) {
                walletBalance.textContent = `${this.balance} ${this.network?.currency || 'ETH'}`;
            }
            if (currentNetworkSimple) {
                currentNetworkSimple.textContent = this.network?.name || 'Desconhecida';
            }
            if (chainIdValueSimple) {
                chainIdValueSimple.textContent = this.network?.chainId || '0';
            }
            
            // Habilitar seções dependentes
            this.enableDependentSections();
            
        } else {
            // Resetar para estado desconectado
            if (statusInput) {
                statusInput.value = '';
                statusInput.placeholder = 'Clique em "Conectar" para iniciar';
                statusInput.classList.remove('border-success');
                statusInput.classList.add('border-secondary');
            }
            
            if (connectBtn) {
                connectBtn.innerHTML = '<i class="bi bi-wallet2 me-2"></i>CONECTAR';
                connectBtn.classList.remove('btn-success');
                connectBtn.classList.add('btn-warning');
                connectBtn.disabled = false;
            }
            
            if (networkInfoSection) {
                networkInfoSection.style.display = 'none';
            }
            
            if (walletConnectionInfo) {
                walletConnectionInfo.style.display = 'none';
            }
            
            // Desabilitar seções dependentes
            this.disableDependentSections();
        }
    }
    
    /**
     * Habilita seções que dependem da conexão
     */
    enableDependentSections() {
        // Habilitar seção básica (se existir)
        const basicSection = document.getElementById('section-basic-info');
        if (basicSection) {
            basicSection.classList.add('section-enabled');
            basicSection.style.opacity = '1';
            basicSection.style.pointerEvents = 'all';
        }
        
        // Habilitar outros campos dependentes
        const dependentElements = document.querySelectorAll('[data-requires-wallet="true"]');
        dependentElements.forEach(element => {
            element.disabled = false;
            element.placeholder = element.dataset.enabledPlaceholder || '';
        });
        
        // Preencher endereço do proprietário automaticamente
        const ownerAddressInput = document.getElementById('ownerAddress');
        if (ownerAddressInput && !ownerAddressInput.value) {
            ownerAddressInput.value = this.address;
        }
        
        // Atualizar progresso visual se existir
        if (typeof updateVisualProgress === 'function') {
            updateVisualProgress();
        }
        
        // Auto-scroll para próxima seção (comportamento original)
        setTimeout(() => {
            if (typeof enableSection === 'function') {
                enableSection('section-basic-info');
            }
            if (typeof scrollToSection === 'function') {
                scrollToSection('section-basic-info');
            }
        }, 1500);
        
        // Atualizar saldo se ainda não foi atualizado
        if (!this.balanceUpdateInProgress) {
            setTimeout(() => {
                this.updateBalance();
            }, 1000);
        }
    }
    
    /**
     * Desabilita seções que dependem da conexão
     */
    disableDependentSections() {
        const dependentElements = document.querySelectorAll('[data-requires-wallet="true"]');
        dependentElements.forEach(element => {
            element.disabled = true;
            element.placeholder = element.dataset.disabledPlaceholder || 'Conecte sua carteira primeiro...';
        });
    }
    
    /**
     * Configura event listeners para mudanças de conta/rede
     */
    setupEventListeners() {
        if (typeof window.ethereum !== 'undefined') {
            // Mudança de conta
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else if (accounts[0] !== this.address) {
                    console.log('🔄 Conta alterada, reconectando...');
                    this.address = accounts[0];
                    this.updateWalletUI();
                    this.updateBalance();
                }
            });
            
            // Mudança de rede
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('🌐 Rede alterada, atualizando...');
                this.network = this.getNetworkInfo(chainId);
                this.updateWalletUI();
                this.updateBalance();
            });
        }
    }
    
    /**
     * Verifica conexão existente
     */
    async checkExistingConnection() {
        try {
            if (!this.isMetaMaskAvailable()) return false;
            
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
                this.address = accounts[0];
                this.isConnected = true;
                
                await this.initializeProvider();
                await this.detectNetwork();
                this.updateWalletUI();
                
                console.log('🔗 Conexão existente detectada:', this.address);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao verificar conexão existente:', error);
            return false;
        }
    }
    
    /**
     * Obtém status atual da conexão
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            address: this.address,
            balance: this.balance,
            network: this.network,
            provider: this.provider,
            signer: this.signer
        };
    }
    
    /**
     * Utilitários para UI
     */
    showButtonLoading(buttonId, text) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
            button.disabled = true;
        }
    }
    
    hideButtonLoading(buttonId, originalText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// Instância global
const WalletManager = new WalletConnection();

// Auto-verificar conexão ao carregar
document.addEventListener('DOMContentLoaded', () => {
    WalletManager.checkExistingConnection();
    
    // Configurar botão de conexão
    const connectBtn = document.getElementById('connect-metamask-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            try {
                await WalletManager.connect();
            } catch (error) {
                alert('Erro ao conectar: ' + error.message);
            }
        });
    }
});

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WalletConnection, WalletManager };
} else {
    window.WalletConnection = WalletConnection;
    window.WalletManager = WalletManager;
}





