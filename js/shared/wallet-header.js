/**
 * SISTEMA DE WALLET PARA HEADER - xcafe
 * Sistema completo de conexão MetaMask integrado ao header
 * 
 * ✅ FUNCIONALIDADES:
 * - Conexão/desconexão automática
 * - Detecção de rede e chain ID  
 * - Verificação de status ao carregar
 * - Interface responsiva
 * - Event listeners para mudanças
 * - Atualização em tempo real
 */

class WalletHeader {
    constructor() {
        this.isConnected = false;
        this.userAddress = null;
        this.currentNetwork = null;
        this.connectButton = null;
        this.walletText = null;
        
        this.init();
    }

    /**
     * Inicializa o sistema
     */
    init() {
        console.log('🚀 Inicializando Wallet Header System...');
        
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    /**
     * Configura elementos DOM
     */
    setupElements() {
        // Procurar por container da wallet
        const walletContainer = document.getElementById('wallet-container');
        
        if (!walletContainer) {
            console.log('⚠️ Container da wallet não encontrado ainda...');
            setTimeout(() => this.setupElements(), 1000);
            return;
        }
        
        // Criar botão da wallet dinamicamente
        this.createWalletButton(walletContainer);
        
        console.log('✅ Elementos encontrados, configurando eventos...');
        
        // Event listener para botão
        this.connectButton.addEventListener('click', () => this.handleWalletClick());
        
        // Verificar se já está conectado
        this.checkConnection();
        
        // Setup event listeners do MetaMask
        this.setupMetaMaskEvents();
    }

    /**
     * Cria o botão da wallet dinamicamente
     */
    createWalletButton(container) {
        // Limpar container
        container.innerHTML = '';
        
        // Criar botão
        this.connectButton = document.createElement('button');
        this.connectButton.className = 'btn btn-outline-primary me-2';
        this.connectButton.id = 'connectWallet';
        
        // Criar ícone
        const icon = document.createElement('i');
        icon.className = 'bi bi-wallet2 me-1';
        
        // Criar texto
        this.walletText = document.createElement('span');
        this.walletText.textContent = 'Conectar Wallet';
        this.walletText.id = 'walletText';
        
        // Montar botão
        this.connectButton.appendChild(icon);
        this.connectButton.appendChild(this.walletText);
        
        // Adicionar ao container
        container.appendChild(this.connectButton);
        
        // Adicionar dropdown de tradução se necessário
        this.addTranslateDropdown(container);
        
        console.log('✅ Botão da wallet criado dinamicamente');
    }

    /**
     * Adiciona dropdown de tradução
     */
    addTranslateDropdown(container) {
        const dropdownDiv = document.createElement('div');
        dropdownDiv.className = 'dropdown';
        
        const dropdownButton = document.createElement('button');
        dropdownButton.className = 'btn btn-outline-secondary dropdown-toggle';
        dropdownButton.type = 'button';
        dropdownButton.setAttribute('data-bs-toggle', 'dropdown');
        dropdownButton.setAttribute('aria-expanded', 'false');
        
        const globeIcon = document.createElement('i');
        globeIcon.className = 'bi bi-globe';
        dropdownButton.appendChild(globeIcon);
        
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu dropdown-menu-end';
        dropdownMenu.setAttribute('data-component', 'translate-component');
        
        dropdownDiv.appendChild(dropdownButton);
        dropdownDiv.appendChild(dropdownMenu);
        container.appendChild(dropdownDiv);
    }

    /**
     * Handle do clique no botão
     */
    async handleWalletClick() {
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
            this.showError('MetaMask não encontrado! Por favor, instale o MetaMask.');
            return;
        }

        try {
            this.setLoading(true);
            
            console.log('🔗 Conectando com MetaMask...');
            
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length > 0) {
                this.userAddress = accounts[0];
                this.isConnected = true;
                
                // Obter informações da rede
                await this.getNetworkInfo();
                
                // Atualizar interface
                this.updateUI();
                
                console.log('✅ Wallet conectada:', this.userAddress);
                console.log('🌍 Rede:', this.currentNetwork);
                
            } else {
                throw new Error('Nenhuma conta encontrada');
            }
            
        } catch (error) {
            console.error('❌ Erro ao conectar wallet:', error);
            this.showError('Erro ao conectar: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Desconecta wallet
     */
    disconnect() {
        this.isConnected = false;
        this.userAddress = null;
        this.currentNetwork = null;
        this.updateUI();
        console.log('🔌 Wallet desconectada');
    }

    /**
     * Verifica se já está conectado
     */
    async checkConnection() {
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
                console.log('✅ Reconectado automaticamente:', this.userAddress);
            }
        } catch (error) {
            console.log('⚠️ Não foi possível verificar conexão:', error.message);
        }
    }

    /**
     * Obtém informações da rede
     */
    async getNetworkInfo() {
        if (!window.ethereum) return;
        
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const networkInfo = this.getNetworkName(chainId);
            this.currentNetwork = networkInfo;
        } catch (error) {
            console.log('⚠️ Erro ao obter info da rede:', error);
            this.currentNetwork = { name: 'Desconhecida', chainId: 'unknown' };
        }
    }

    /**
     * Obtém nome da rede pelo Chain ID
     */
    getNetworkName(chainId) {
        const networks = {
            '0x1': { name: 'Ethereum Mainnet', chainId: '1' },
            '0x38': { name: 'BSC Mainnet', chainId: '56' },
            '0x61': { name: 'BSC Testnet', chainId: '97' },
            '0x89': { name: 'Polygon', chainId: '137' },
            '0xaa36a7': { name: 'Sepolia Testnet', chainId: '11155111' },
            '0x2105': { name: 'Base Mainnet', chainId: '8453' }
        };
        
        return networks[chainId] || { name: `Chain ${chainId}`, chainId };
    }

    /**
     * Atualiza interface do usuário
     */
    updateUI() {
        if (!this.connectButton || !this.walletText) return;
        
        if (this.isConnected && this.userAddress) {
            // Endereço abreviado
            const shortAddress = `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}`;
            
            // Atualizar texto e estilo
            this.walletText.textContent = shortAddress;
            this.connectButton.classList.remove('btn-outline-primary');
            this.connectButton.classList.add('btn-success');
            this.connectButton.title = `Conectado à ${this.currentNetwork?.name || 'rede desconhecida'}\nClique para desconectar`;
            
            // Adicionar badge da rede
            const icon = this.connectButton.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-check-circle me-1';
            }
            
        } else {
            // Estado desconectado
            this.walletText.textContent = 'Conectar Wallet';
            this.connectButton.classList.remove('btn-success');
            this.connectButton.classList.add('btn-outline-primary');
            this.connectButton.title = 'Conectar com MetaMask';
            
            const icon = this.connectButton.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-wallet2 me-1';
            }
        }
    }

    /**
     * Define estado de loading
     */
    setLoading(loading) {
        if (!this.connectButton || !this.walletText) return;
        
        if (loading) {
            this.walletText.textContent = 'Conectando...';
            this.connectButton.disabled = true;
            
            const icon = this.connectButton.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-hourglass-split me-1';
            }
        } else {
            this.connectButton.disabled = false;
        }
    }

    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        console.error('🚨', message);
        
        // Toast ou alert simples
        if (window.bootstrap && window.bootstrap.Toast) {
            // Se Bootstrap estiver disponível, usar toast
            this.showToast(message, 'error');
        } else {
            // Fallback para alert
            alert(message);
        }
    }

    /**
     * Configura event listeners do MetaMask
     */
    setupMetaMaskEvents() {
        if (!window.ethereum) return;
        
        // Mudança de conta
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('👤 Conta alterada:', accounts);
            if (accounts.length > 0) {
                this.userAddress = accounts[0];
                this.isConnected = true;
                this.updateUI();
            } else {
                this.disconnect();
            }
        });
        
        // Mudança de rede
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('🌍 Rede alterada:', chainId);
            this.getNetworkInfo().then(() => this.updateUI());
        });
        
        // Desconexão
        window.ethereum.on('disconnect', () => {
            console.log('🔌 MetaMask desconectado');
            this.disconnect();
        });
    }

    /**
     * Obtém informações da wallet (público)
     */
    getWalletInfo() {
        return {
            isConnected: this.isConnected,
            address: this.userAddress,
            network: this.currentNetwork
        };
    }
}

// ==================== INICIALIZAÇÃO GLOBAL ====================

// Instanciar sistema quando script carregar
const walletHeader = new WalletHeader();

// Expor globalmente para outras partes da aplicação
window.WalletHeader = walletHeader;

// Event customizado quando wallet conectar
document.addEventListener('walletConnected', (event) => {
    console.log('🎉 Wallet conectada globalmente:', event.detail);
});

console.log('📦 Wallet Header System carregado');
