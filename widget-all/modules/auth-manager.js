/**
 * 🔐 AUTH MANAGER - Sistema de Autenticação MetaMask
 * 
 * 📋 RESPONSABILIDADES:
 * - Conectar/desconectar MetaMask
 * - Validar carteira conectada
 * - Gerenciar sessões de usuário
 * - Detectar mudanças de conta/rede
 * 
 * 🔧 DEPENDÊNCIAS:
 * - MetaMask instalado no navegador
 * - DataManager para persistência
 * 
 * 🎯 USO:
 * - const auth = new AuthManager();
 * - await auth.connect();
 * - auth.isConnected();
 */

class AuthManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentAccount = null;
        this.currentNetwork = null;
        this.isAuthenticated = false;
        
        // Configurações de redes suportadas
        this.supportedNetworks = {
            1: { name: 'Ethereum Mainnet', symbol: 'ETH', color: '#627eea' },
            56: { name: 'BSC Mainnet', symbol: 'BNB', color: '#f3ba2f' },
            97: { name: 'BSC Testnet', symbol: 'tBNB', color: '#f3ba2f' },
            137: { name: 'Polygon', symbol: 'MATIC', color: '#8247e5' }
        };

        this.init();
    }

    // ==================== INICIALIZAÇÃO ====================
    
    /**
     * Inicializa sistema de autenticação
     */
    async init() {
        try {
            // Verificar se MetaMask está disponível
            if (!this.isMetaMaskAvailable()) {
                console.warn('⚠️ MetaMask não detectado');
                return;
            }

            // Configurar listeners para mudanças
            this.setupEventListeners();

            // Tentar reconectar automaticamente
            await this.tryAutoConnect();

            console.log('✅ AuthManager inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar AuthManager:', error);
        }
    }

    /**
     * Verifica se MetaMask está disponível
     */
    isMetaMaskAvailable() {
        return typeof window !== 'undefined' && 
               typeof window.ethereum !== 'undefined' && 
               window.ethereum.isMetaMask;
    }

    /**
     * Configura listeners para eventos MetaMask
     */
    setupEventListeners() {
        if (!window.ethereum) return;

        // Mudança de conta
        window.ethereum.on('accountsChanged', (accounts) => {
            this.handleAccountChange(accounts);
        });

        // Mudança de rede
        window.ethereum.on('chainChanged', (chainId) => {
            this.handleNetworkChange(chainId);
        });

        // Desconexão
        window.ethereum.on('disconnect', () => {
            this.handleDisconnect();
        });
    }

    // ==================== CONEXÃO ====================
    
    /**
     * Conecta carteira MetaMask
     */
    async connect() {
        try {
            if (!this.isMetaMaskAvailable()) {
                throw new Error('MetaMask não está instalado. Por favor, instale o MetaMask.');
            }

            // Solicitar conexão
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('Nenhuma conta disponível no MetaMask');
            }

            // Definir conta atual
            this.currentAccount = accounts[0];

            // Detectar rede atual
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });
            this.currentNetwork = parseInt(chainId, 16);

            // Verificar se rede é suportada
            if (!this.supportedNetworks[this.currentNetwork]) {
                console.warn(`⚠️ Rede não suportada: ${this.currentNetwork}`);
            }

            // Registrar usuário no sistema
            await this.registerUser();

            // Marcar como autenticado
            this.isAuthenticated = true;

            // Salvar estado na sessão
            this.saveSessionState();

            await this.dataManager.log(`Usuário conectado: ${this.currentAccount}`);

            return {
                success: true,
                account: this.currentAccount,
                network: this.currentNetwork,
                networkName: this.supportedNetworks[this.currentNetwork]?.name || 'Desconhecida'
            };

        } catch (error) {
            await this.dataManager.log(`Erro na conexão: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Tenta reconectar automaticamente
     */
    async tryAutoConnect() {
        try {
            if (!this.isMetaMaskAvailable()) return;

            // Verificar se já existe conexão
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (accounts.length > 0) {
                this.currentAccount = accounts[0];
                
                const chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                });
                this.currentNetwork = parseInt(chainId, 16);
                
                this.isAuthenticated = true;
                this.saveSessionState();

                console.log(`🔄 Reconectado automaticamente: ${this.currentAccount}`);
            }

        } catch (error) {
            console.log('ℹ️ Reconexão automática não disponível');
        }
    }

    /**
     * Registra usuário no sistema
     */
    async registerUser() {
        try {
            // Verificar se usuário já existe
            const existingUser = await this.dataManager.getUser(this.currentAccount);
            
            if (!existingUser) {
                // Criar novo usuário
                const result = await this.dataManager.createUser(this.currentAccount, {
                    name: `Usuário ${this.currentAccount.substring(0, 6)}`,
                    email: '',
                    registrationDate: new Date().toISOString()
                });

                if (result.success) {
                    console.log('✅ Novo usuário criado');
                } else {
                    console.warn('⚠️ Erro ao criar usuário:', result.message);
                }
            }

        } catch (error) {
            console.error('❌ Erro ao registrar usuário:', error);
        }
    }

    // ==================== GERENCIAMENTO DE ESTADO ====================
    
    /**
     * Verifica se usuário está conectado
     */
    isConnected() {
        return this.isAuthenticated && this.currentAccount !== null;
    }

    /**
     * Obtém conta atual
     */
    getCurrentAccount() {
        return this.currentAccount;
    }

    /**
     * Obtém rede atual
     */
    getCurrentNetwork() {
        return this.currentNetwork;
    }

    /**
     * Obtém informações da rede atual
     */
    getCurrentNetworkInfo() {
        if (!this.currentNetwork) return null;
        
        return this.supportedNetworks[this.currentNetwork] || {
            name: `Rede ${this.currentNetwork}`,
            symbol: 'ETH',
            color: '#888888'
        };
    }

    /**
     * Salva estado da sessão
     */
    saveSessionState() {
        if (typeof localStorage !== 'undefined') {
            const sessionData = {
                account: this.currentAccount,
                network: this.currentNetwork,
                timestamp: Date.now()
            };
            
            localStorage.setItem('widget_session', JSON.stringify(sessionData));
        }
    }

    /**
     * Carrega estado da sessão
     */
    loadSessionState() {
        if (typeof localStorage === 'undefined') return null;
        
        try {
            const sessionData = localStorage.getItem('widget_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                
                // Verificar se sessão não expirou (24 horas)
                const maxAge = 24 * 60 * 60 * 1000; // 24 horas
                if (Date.now() - data.timestamp < maxAge) {
                    return data;
                }
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar sessão:', error);
        }
        
        return null;
    }

    // ==================== TROCA DE REDE ====================
    
    /**
     * Troca para rede específica
     */
    async switchToNetwork(chainId) {
        try {
            if (!this.isMetaMaskAvailable()) {
                throw new Error('MetaMask não disponível');
            }

            const networkConfig = this.supportedNetworks[chainId];
            if (!networkConfig) {
                throw new Error('Rede não suportada');
            }

            // Tentar trocar de rede
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }]
            });

            this.currentNetwork = chainId;
            this.saveSessionState();

            await this.dataManager.log(`Rede alterada para: ${networkConfig.name}`);

            return {
                success: true,
                network: chainId,
                networkName: networkConfig.name
            };

        } catch (error) {
            // Se rede não estiver adicionada, tentar adicionar
            if (error.code === 4902) {
                return await this.addNetwork(chainId);
            }

            await this.dataManager.log(`Erro ao trocar rede: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Adiciona nova rede ao MetaMask
     */
    async addNetwork(chainId) {
        try {
            const networkConfig = this.getNetworkConfig(chainId);
            if (!networkConfig) {
                throw new Error('Configuração de rede não encontrada');
            }

            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig]
            });

            this.currentNetwork = chainId;
            this.saveSessionState();

            return {
                success: true,
                network: chainId,
                networkName: networkConfig.chainName
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtém configuração completa da rede
     */
    getNetworkConfig(chainId) {
        const configs = {
            1: {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                blockExplorerUrls: ['https://etherscan.io/']
            },
            56: {
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
            },
            97: {
                chainId: '0x61',
                chainName: 'BNB Smart Chain Testnet',
                nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                blockExplorerUrls: ['https://testnet.bscscan.com/']
            },
            137: {
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/']
            }
        };

        return configs[chainId];
    }

    // ==================== EVENTOS ====================
    
    /**
     * Manipula mudança de conta
     */
    async handleAccountChange(accounts) {
        if (accounts.length === 0) {
            // Usuário desconectou
            await this.disconnect();
        } else if (accounts[0] !== this.currentAccount) {
            // Conta alterada
            const oldAccount = this.currentAccount;
            this.currentAccount = accounts[0];
            
            // Registrar novo usuário se necessário
            await this.registerUser();
            
            this.saveSessionState();
            
            await this.dataManager.log(`Conta alterada: ${oldAccount} → ${this.currentAccount}`);
            
            // Disparar evento customizado
            this.dispatchEvent('accountChanged', {
                oldAccount,
                newAccount: this.currentAccount
            });
        }
    }

    /**
     * Manipula mudança de rede
     */
    async handleNetworkChange(chainId) {
        const oldNetwork = this.currentNetwork;
        this.currentNetwork = parseInt(chainId, 16);
        
        this.saveSessionState();
        
        const networkInfo = this.getCurrentNetworkInfo();
        await this.dataManager.log(`Rede alterada: ${oldNetwork} → ${this.currentNetwork} (${networkInfo.name})`);
        
        // Disparar evento customizado
        this.dispatchEvent('networkChanged', {
            oldNetwork,
            newNetwork: this.currentNetwork,
            networkInfo
        });
    }

    /**
     * Manipula desconexão
     */
    async handleDisconnect() {
        await this.disconnect();
    }

    /**
     * Desconecta usuário
     */
    async disconnect() {
        const oldAccount = this.currentAccount;
        
        this.currentAccount = null;
        this.currentNetwork = null;
        this.isAuthenticated = false;
        
        // Limpar sessão
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('widget_session');
        }
        
        if (oldAccount) {
            await this.dataManager.log(`Usuário desconectado: ${oldAccount}`);
        }
        
        // Disparar evento customizado
        this.dispatchEvent('disconnected', { account: oldAccount });
    }

    // ==================== EVENTOS CUSTOMIZADOS ====================
    
    /**
     * Dispara evento customizado
     */
    dispatchEvent(eventName, data) {
        if (typeof window !== 'undefined') {
            const event = new CustomEvent(`auth_${eventName}`, {
                detail: data
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * Adiciona listener para eventos de autenticação
     */
    addEventListener(eventName, callback) {
        if (typeof window !== 'undefined') {
            window.addEventListener(`auth_${eventName}`, callback);
        }
    }

    /**
     * Remove listener para eventos de autenticação
     */
    removeEventListener(eventName, callback) {
        if (typeof window !== 'undefined') {
            window.removeEventListener(`auth_${eventName}`, callback);
        }
    }

    // ==================== VALIDAÇÕES ====================
    
    /**
     * Valida se usuário tem créditos suficientes
     */
    async hasCredits(amount = 1) {
        if (!this.isConnected()) return false;
        
        try {
            const credits = await this.dataManager.getCredits(this.currentAccount);
            return credits >= amount;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtém dados completos do usuário autenticado
     */
    async getUserData() {
        if (!this.isConnected()) return null;
        
        try {
            const user = await this.dataManager.getUser(this.currentAccount);
            const credits = await this.dataManager.getCredits(this.currentAccount);
            const transactions = await this.dataManager.getUserTransactions(this.currentAccount, 10);
            
            return {
                ...user,
                credits,
                recentTransactions: transactions,
                network: this.getCurrentNetworkInfo()
            };
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            return null;
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
