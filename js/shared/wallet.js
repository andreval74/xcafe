/**
 * SISTEMA DE CARTEIRA UNIFICADO - xcafe
 * 
 * ✅ Sistema unificado de conexão MetaMask
 * 
 * 🎯 FUNCIONALIDADES:
 * - Conexão com MetaMask
 * - Detecção automática de rede com Chain ID
 * - Atualização de saldo em tempo real
 * - Interface responsiva e profissional
 * - Botão de limpar que mantém conexão
 * - Event listeners para mudanças de conta/rede
 * - Suporte a múltiplas blockchains
 * 
 * 📦 USO:
 * 1. Incluir script: <script src="js/shared/wallet.js"></script>
 * 2. Chamar: Wallet.init()
 * 3. Usar: Wallet.connect()
 */

// ==================== VARIÁVEIS GLOBAIS ====================
let walletConnected = false;
let walletAddress = '';
let networkData = {};
let balanceUpdateInProgress = false;

// ==================== CONFIGURAÇÕES ====================
const WALLET_CONFIG = {
    supportedChains: [56, 97, 1, 5, 137, 80001, 11155111, 8453], // BSC, Ethereum, Polygon, Base
    defaultTimeout: 10000,
    balanceUpdateInterval: 30000, // 30 segundos
    networks: {
        '0x38': { name: 'BSC Mainnet', chainId: '56', currency: 'BNB', explorer: 'https://bscscan.com' },
        '0x61': { name: 'BSC Testnet', chainId: '97', currency: 'tBNB', explorer: 'https://testnet.bscscan.com' },
        '0x1': { name: 'Ethereum Mainnet', chainId: '1', currency: 'ETH', explorer: 'https://etherscan.io' },
        '0x89': { name: 'Polygon Mainnet', chainId: '137', currency: 'MATIC', explorer: 'https://polygonscan.com' },
        '0xaa36a7': { name: 'Sepolia Testnet', chainId: '11155111', currency: 'ETH', explorer: 'https://sepolia.etherscan.io' },
        '0x2105': { name: 'Base Mainnet', chainId: '8453', currency: 'ETH', explorer: 'https://basescan.org' }
    }
};

// ==================== CLASSE PRINCIPAL ====================
class Wallet {
    
    /**
     * Inicializa o sistema de carteira
     */
    static init() {
        console.log('🚀 Inicializando Sistema de Carteira...');
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar conexão existente
        this.checkExistingConnection();
        
        console.log('✅ Sistema de Carteira inicializado');
    }
    
    /**
     * Configura event listeners
     */
    static setupEventListeners() {
        // Botão de conexão
        const connectBtn = document.getElementById('connect-metamask-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connect());
            console.log('🔗 Event listener do botão conectar configurado');
        } else {
            console.log('⚠️ Botão connect-metamask-btn não encontrado ainda');
        }
        
        // Event listeners do MetaMask
        if (typeof window.ethereum !== 'undefined') {
            // Mudança de conta
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else if (accounts[0] !== walletAddress) {
                    console.log('🔄 Conta alterada, atualizando...');
                    walletAddress = accounts[0];
                    this.updateWalletUI();
                    this.updateWalletBalance();
                }
            });
            
            // Mudança de rede
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('🌐 Rede alterada, atualizando...');
                this.detectNetwork();
            });
        }
    }
    
    /**
     * Conecta com MetaMask
     */
    static async connect() {
        try {
            if (!this.isMetaMaskAvailable()) {
                alert('MetaMask não detectado! Por favor, instale a MetaMask.');
                return false;
            }
            
            console.log('🔗 Conectando com MetaMask...');
            
            // Mostra loading
            this.showButtonLoading('connect-metamask-btn', 'Conectando...');
            
            // Solicita conexão
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                walletConnected = true;
                
                // Atualiza UI
                await this.detectNetwork();
                this.updateWalletUI();
                
                // Carregar saldo após conectar
                setTimeout(() => {
                    this.updateWalletBalance();
                }, 800);
                
                console.log('✅ Wallet conectada:', walletAddress);
                console.log('🌐 Rede:', networkData.name);
                
                // Callback para páginas específicas
                if (typeof window.onWalletConnected === 'function') {
                    window.onWalletConnected({
                        address: walletAddress,
                        network: networkData
                    });
                }
                
                return true;
            }
            
        } catch (error) {
            console.error('❌ Erro ao conectar wallet:', error);
            alert('Erro ao conectar com a MetaMask: ' + error.message);
            
            // Restaura botão em caso de erro
            this.hideButtonLoading('connect-metamask-btn', '<i class="bi bi-wallet2 me-2"></i>CONECTAR');
            return false;
        }
    }
    
    /**
     * Desconecta wallet (apenas interface)
     */
    static disconnect() {
        walletConnected = false;
        walletAddress = '';
        networkData = {};
        
        this.updateWalletUI();
        
        // Callback para páginas específicas
        if (typeof window.onWalletDisconnected === 'function') {
            window.onWalletDisconnected();
        }
        
        console.log('🔌 Wallet desconectada da interface');
    }
    
    /**
     * Verifica se MetaMask está disponível
     */
    static isMetaMaskAvailable() {
        return typeof window.ethereum !== 'undefined';
    }
    
    /**
     * Aguarda elementos carregarem e re-configura sistema
     */
    static async waitForElementsAndReconfigure() {
        console.log('⏳ Aguardando elementos da interface carregarem...');
        
        // Aguarda até o botão aparecer (máximo 5 segundos)
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos / 100ms
        
        while (attempts < maxAttempts) {
            const connectBtn = document.getElementById('connect-metamask-btn');
            const statusInput = document.getElementById('wallet-status');
            
            if (connectBtn && statusInput) {
                console.log('✅ Elementos da interface carregados!');
                
                // Re-configura event listeners
                this.setupEventListeners();
                
                // Se já estava conectado, atualiza UI
                if (walletConnected && walletAddress) {
                    console.log('🔄 Atualizando UI para conexão existente...');
                    console.log('📍 Endereço conectado:', walletAddress);
                    console.log('🌐 Rede:', networkData.name);
                    this.updateWalletUI();
                } else {
                    console.log('⚠️ Nenhuma conexão existente detectada');
                }
                
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.log('⚠️ Timeout aguardando elementos da interface');
        return false;
    }
    
    /**
     * Verifica conexão existente
     */
    static async checkExistingConnection() {
        if (!this.isMetaMaskAvailable()) return false;
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                walletConnected = true;
                
                await this.detectNetwork();
                this.updateWalletUI();
                
                console.log('🔗 Conexão existente detectada:', walletAddress);
                return true;
            }
            
        } catch (error) {
            console.log('Nenhuma conexão prévia detectada');
        }
        
        return false;
    }
    
    /**
     * Detecta a rede atual
     */
    static async detectNetwork() {
        try {
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });
            
            networkData = this.getNetworkInfo(chainId);
            
            // Atualiza UI da rede
            const currentNetworkSpan = document.getElementById('current-network');
            const chainIdSpan = document.getElementById('chain-id-value');
            
            if (currentNetworkSpan) {
                currentNetworkSpan.textContent = networkData.name;
            }
            
            if (chainIdSpan) {
                chainIdSpan.textContent = networkData.chainId;
            }
            
            console.log(`🌐 Rede detectada: ${networkData.name} (ID: ${networkData.chainId})`);
            
            // Se carteira já conectada, atualiza saldo ao detectar rede
            if (walletConnected && walletAddress) {
                setTimeout(() => {
                    this.updateWalletBalance();
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ Erro ao detectar rede:', error);
        }
    }
    
    /**
     * Obtém informações da rede baseado no chainId
     */
    static getNetworkInfo(chainId) {
        return WALLET_CONFIG.networks[chainId] || { 
            name: 'Rede Desconhecida', 
            chainId: parseInt(chainId, 16).toString(),
            currency: 'ETH',
            explorer: ''
        };
    }
    
    /**
     * Atualiza interface da wallet
     */
    static updateWalletUI() {
        const statusInput = document.getElementById('wallet-status');
        const connectBtn = document.getElementById('connect-metamask-btn');
        const networkSection = document.getElementById('network-info-section');
        
        console.log('🎨 Atualizando UI da wallet...');
        console.log('📊 Estado atual:', { connected: walletConnected, address: walletAddress });
        
        if (walletConnected && walletAddress) {
            console.log('✅ Atualizando para estado conectado');
            
            // Status da wallet - mostrar endereço completo
            if (statusInput) {
                statusInput.value = walletAddress;
                statusInput.classList.add('text-success');
                statusInput.classList.remove('border-secondary');
                statusInput.classList.add('border-success');
                console.log('✅ Input de status atualizado');
            } else {
                console.log('⚠️ Input wallet-status não encontrado');
            }
            
            // Botão conectar
            if (connectBtn) {
                connectBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>CONECTADO';
                connectBtn.classList.remove('btn-warning');
                connectBtn.classList.add('btn-success');
                connectBtn.disabled = true;
                console.log('✅ Botão atualizado para conectado');
            } else {
                console.log('⚠️ Botão connect-metamask-btn não encontrado');
            }
            
            // Mostra info da rede
            if (networkSection) {
                networkSection.style.display = 'block';
                console.log('✅ Seção de rede mostrada');
            } else {
                console.log('⚠️ Seção network-info-section não encontrada');
            }
            
            // Auto-preencher endereço do proprietário se existir
            const ownerInput = document.getElementById('ownerAddress');
            if (ownerInput && !ownerInput.value) {
                ownerInput.value = walletAddress;
            }
            
            // Habilitar seções dependentes
            this.enableDependentSections();
            
        } else {
            console.log('⚠️ Atualizando para estado desconectado');
            
            // Estado desconectado
            if (statusInput) {
                statusInput.value = '';
                statusInput.placeholder = 'Clique em "Conectar" para iniciar';
                statusInput.classList.remove('text-success', 'border-success');
                statusInput.classList.add('border-secondary');
            }
            
            if (connectBtn) {
                connectBtn.innerHTML = '<i class="bi bi-wallet2 me-2"></i>CONECTAR';
                connectBtn.classList.remove('btn-success');
                connectBtn.classList.add('btn-warning');
                connectBtn.disabled = false;
            }
            
            if (networkSection) {
                networkSection.style.display = 'none';
            }
            
            // Desabilitar seções dependentes
            this.disableDependentSections();
        }
    }
    
    /**
     * Atualiza saldo da carteira
     */
    static async updateWalletBalance() {
        if (balanceUpdateInProgress || !walletConnected || !walletAddress) {
            return;
        }
        
        try {
            balanceUpdateInProgress = true;
            
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [walletAddress, 'latest']
            });
            
            const balanceInEth = (parseInt(balance, 16) / 1e18).toFixed(4);
            
            // Atualizar elementos de saldo se existirem
            const balanceElements = document.querySelectorAll('[data-wallet-balance]');
            balanceElements.forEach(element => {
                element.textContent = `${balanceInEth} ${networkData.currency || 'ETH'}`;
            });
            
            console.log(`💰 Saldo atualizado: ${balanceInEth} ${networkData.currency}`);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar saldo:', error);
        } finally {
            balanceUpdateInProgress = false;
        }
    }
    
    /**
     * Habilita seções que dependem da conexão
     */
    static enableDependentSections() {
        // Habilitar seção básica (se existir)
        const basicSection = document.getElementById('section-basic-info');
        if (basicSection) {
            basicSection.classList.add('section-enabled');
            basicSection.style.opacity = '1';
            basicSection.style.pointerEvents = 'all';
            
            // Auto-scroll para próxima seção após um delay
            setTimeout(() => {
                if (typeof enableSection === 'function') {
                    enableSection('section-basic-info');
                }
            }, 1500);
        }
        
        // Habilitar campos dependentes
        const dependentElements = document.querySelectorAll('[data-requires-wallet="true"]');
        dependentElements.forEach(element => {
            element.disabled = false;
            element.placeholder = element.dataset.enabledPlaceholder || '';
        });
        
        // Habilitar seção de contrato se existir (para compra-token)
        const contractSection = document.getElementById('contract-section');
        if (contractSection) {
            contractSection.style.display = 'block';
            
            // Animação
            contractSection.style.opacity = '0';
            contractSection.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                contractSection.style.transition = 'all 0.3s ease-in-out';
                contractSection.style.opacity = '1';
                contractSection.style.transform = 'translateY(0)';
            }, 100);
            
            // Habilitar campos
            const contractInput = document.getElementById('contract-address');
            if (contractInput) {
                contractInput.disabled = false;
                contractInput.placeholder = "0x1234567890123456789012345678901234567890";
                contractInput.classList.add('border-success');
            }
        }
        
        // Atualizar progresso visual se existir
        if (typeof updateVisualProgress === 'function') {
            updateVisualProgress();
        }
    }
    
    /**
     * Desabilita seções que dependem da conexão
     */
    static disableDependentSections() {
        const dependentElements = document.querySelectorAll('[data-requires-wallet="true"]');
        dependentElements.forEach(element => {
            element.disabled = true;
            element.placeholder = element.dataset.disabledPlaceholder || 'Conecte sua carteira primeiro...';
        });
        
        // Ocultar seção de contrato se existir
        const contractSection = document.getElementById('contract-section');
        if (contractSection) {
            contractSection.style.display = 'none';
        }
    }
    
    /**
     * Obtém status atual da conexão
     */
    static getStatus() {
        return {
            connected: walletConnected,
            address: walletAddress,
            network: networkData,
            isConnected: walletConnected // Para compatibilidade
        };
    }
    
    /**
     * Limpa apenas dados dos formulários, mantém conexão
     */
    static clearFormData() {
        console.log('🧹 Limpando dados do formulário (mantendo conexão)...');
        
        // Limpar campos de formulário específicos, mas não da wallet
        const formInputs = document.querySelectorAll('input:not([id*="wallet"]):not([id*="network"]):not([id*="owner"])');
        formInputs.forEach(input => {
            if (input.type !== 'hidden' && !input.readOnly) {
                input.value = '';
            }
        });
        
        // Limpar selects
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            if (select.id !== 'decimals') {
                select.selectedIndex = 0;
            }
        });
        
        console.log('✅ Dados do formulário limpos (conexão mantida)');
    }
    
    // ==================== FUNÇÕES UTILITÁRIAS ====================
    
    /**
     * Mostra loading em botão
     */
    static showButtonLoading(buttonId, loadingText = 'Carregando...') {
        const button = document.getElementById(buttonId);
        if (button) {
            button.originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${loadingText}`;
        }
    }
    
    /**
     * Remove loading do botão
     */
    static hideButtonLoading(buttonId, newText = null) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.innerHTML = newText || button.originalText || 'Botão';
        }
    }
    
    /**
     * Função para inserir HTML da conexão em qualquer página
     */
    static insertConnectionHTML(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Container não encontrado:', containerId);
            return;
        }
        
        const {
            title = '1. Conexão da Carteira',
            description = 'Conecte sua carteira Web3 para acessar a funcionalidade',
            cardClass = 'border-warning',
            headerClass = 'bg-warning text-dark'
        } = options;
        
        container.innerHTML = `
            <div class="card bg-dark ${cardClass} shadow mb-4">
                <div class="card-header ${headerClass}">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-wallet2 me-2"></i>${title}
                    </h5>
                </div>
                <div class="card-body">
                    <p class="text-secondary mb-3">${description}</p>
                    <div class="row g-3 align-items-end">
                        <div class="col-md-8">
                            <label for="wallet-status" class="form-label text-white">Status da Conexão</label>
                            <input type="text" class="form-control bg-dark text-white border-secondary" id="wallet-status" 
                                   placeholder="Clique em 'Conectar' para iniciar" style="font-family: monospace;" readonly>
                        </div>
                        <div class="col-md-4">
                            <button id="connect-metamask-btn" type="button" class="btn btn-warning w-100 fw-bold">
                                <i class="bi bi-wallet2 me-2"></i>CONECTAR
                            </button>
                        </div>
                    </div>
                    <div class="row mt-3" id="network-info-section" style="display: none;">
                        <div class="col-12">
                            <div class="alert alert-info mb-0">
                                <i class="bi bi-wifi me-2"></i>
                                <strong>Rede:</strong> <span id="current-network" class="fw-bold">-</span>
                                <span class="ms-3">
                                    <i class="bi bi-link-45deg me-1"></i>
                                    <strong>Chain ID:</strong> <span id="chain-id-value" class="fw-bold">-</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Re-configurar event listeners após inserir HTML
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
    }
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

// Auto-inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    Wallet.init();
    
    // Aguarda componentes carregarem (para template-loader)
    setTimeout(() => {
        Wallet.waitForElementsAndReconfigure();
    }, 1000); // 1 segundo após DOM ready
});

// Listener adicional para quando template loader terminar
document.addEventListener('templatesLoaded', () => {
    console.log('📦 Componentes carregados - reconfigurando wallet...');
    Wallet.waitForElementsAndReconfigure();
});

// ==================== EXPORTS GLOBAIS ====================

// Disponibilizar globalmente
window.Wallet = Wallet;

// Aliases para compatibilidade com código existente
window.UniversalWallet = Wallet;
window.WalletManager = {
    connect: () => Wallet.connect(),
    disconnect: () => Wallet.disconnect(),
    getStatus: () => Wallet.getStatus(),
    updateWalletUI: () => Wallet.updateWalletUI()
};

// Funções globais para compatibilidade
window.connectWallet = () => Wallet.connect();
window.walletConnected = () => walletConnected;
window.getWalletAddress = () => walletAddress;
window.getWalletNetwork = () => networkData;

console.log('🚀 Sistema de Carteira Unificado carregado!');
