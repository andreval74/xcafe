/**
 * 🌐 WEB3 MANAGER - Sistema de Conexão Blockchain
 * 
 * 📋 RESPONSABILIDADES:
 * - Conectar/desconectar MetaMask
 * - Gerenciar estado da carteira
 * - Interagir com contratos inteligentes
 * - Monitorar mudanças de rede/conta
 * 
 * 🔧 DEPENDÊNCIAS:
 * - MetaMask ou carteira compatível
 * - Web3 Provider
 * 
 * 🎯 USO:
 * - const web3 = new Web3Manager();
 * - await web3.connectWallet();
 * - const balance = await web3.getBalance();
 */

class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.currentAccount = null;
        this.currentNetwork = null;
        this.isConnected = false;
        
        // Contratos suportados
        this.contracts = {};
        
        // Redes suportadas
        this.supportedNetworks = {
            1: { name: 'Ethereum Mainnet', symbol: 'ETH', rpc: 'https://eth-mainnet.g.alchemy.com/v2/', explorer: 'https://etherscan.io' },
            56: { name: 'BSC Mainnet', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org/', explorer: 'https://bscscan.com' },
            97: { name: 'BSC Testnet', symbol: 'tBNB', rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/', explorer: 'https://testnet.bscscan.com' },
            137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon-rpc.com/', explorer: 'https://polygonscan.com' },
            80001: { name: 'Polygon Mumbai', symbol: 'MATIC', rpc: 'https://rpc-mumbai.maticvigil.com/', explorer: 'https://mumbai.polygonscan.com' }
        };

        this.init();
    }

    // ==================== INICIALIZAÇÃO ====================
    
    /**
     * Inicializa o Web3Manager
     */
    async init() {
        try {
            console.log('🌐 Inicializando Web3Manager...');
            
            // Verificar se MetaMask está disponível
            if (!this.isMetaMaskAvailable()) {
                console.warn('⚠️ MetaMask não detectado');
                return;
            }

            // Configurar event listeners
            this.setupEventListeners();
            
            // Verificar se já está conectado
            await this.checkExistingConnection();
            
            console.log('✅ Web3Manager inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar Web3Manager:', error);
        }
    }

    /**
     * Verifica se MetaMask está disponível
     */
    isMetaMaskAvailable() {
        return typeof window.ethereum !== 'undefined';
    }

    /**
     * Configura event listeners para mudanças de conta/rede
     */
    setupEventListeners() {
        if (!window.ethereum) return;

        // Mudança de conta
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('📱 Conta alterada:', accounts);
            this.handleAccountsChanged(accounts);
        });

        // Mudança de rede
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('🔗 Rede alterada:', chainId);
            this.handleChainChanged(chainId);
        });

        // Conexão/desconexão
        window.ethereum.on('connect', (connectInfo) => {
            console.log('🔌 Conectado:', connectInfo);
        });

        window.ethereum.on('disconnect', (error) => {
            console.log('🔌 Desconectado:', error);
            this.handleDisconnect();
        });
    }

    // ==================== CONEXÃO ====================
    
    /**
     * Conecta à carteira MetaMask
     */
    async connectWallet() {
        try {
            if (!this.isMetaMaskAvailable()) {
                throw new Error('MetaMask não detectado. Instale a extensão MetaMask.');
            }

            console.log('🔌 Conectando carteira...');
            
            // Solicitar conexão
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('Nenhuma conta autorizada');
            }

            // Configurar provider
            this.provider = window.ethereum;
            this.currentAccount = accounts[0];
            this.isConnected = true;

            // Obter informações da rede
            await this.updateNetworkInfo();

            // Salvar no localStorage
            this.saveConnectionState();

            console.log('✅ Carteira conectada:', this.currentAccount);
            
            // Disparar evento customizado
            this.dispatchEvent('walletConnected', {
                account: this.currentAccount,
                network: this.currentNetwork
            });

            return this.currentAccount;
            
        } catch (error) {
            console.error('❌ Erro ao conectar carteira:', error);
            throw error;
        }
    }

    /**
     * Desconecta da carteira - Desconexão REAL do MetaMask
     */
    async disconnect() {
        try {
            console.log('🔌 Iniciando desconexão real...');

            // Tentar desconexão real via MetaMask API
            if (window.ethereum && window.ethereum.selectedAddress) {
                try {
                    // Método 1: wallet_revokePermissions (mais recente)
                    if (window.ethereum.request) {
                        await window.ethereum.request({
                            method: "wallet_revokePermissions",
                            params: [{
                                eth_accounts: {}
                            }]
                        });
                        console.log('✅ Permissões revogadas via wallet_revokePermissions');
                    }
                } catch (revokeError) {
                    console.log('⚠️ wallet_revokePermissions não suportado, tentando método alternativo...');
                    
                    // Método 2: Solicitar desconexão via wallet_requestPermissions com contas vazias
                    try {
                        await window.ethereum.request({
                            method: 'wallet_requestPermissions',
                            params: [{ eth_accounts: {} }]
                        });
                        
                        // Depois cancelar/rejeitar para forçar desconexão
                        const accounts = await window.ethereum.request({
                            method: 'eth_accounts'
                        });
                        
                        if (accounts.length > 0) {
                            console.log('⚠️ Usuário ainda autorizado, limpando estado local apenas');
                        }
                    } catch (altError) {
                        console.log('⚠️ Métodos de desconexão não suportados, limpando estado local');
                    }
                }
            }

            // Limpar estado local independentemente
            this.provider = null;
            this.signer = null;
            this.currentAccount = null;
            this.currentNetwork = null;
            this.isConnected = false;

            // Limpar localStorage
            this.clearConnectionState();

            // Forçar reload da página para garantir limpeza completa
            console.log('� Recarregando página para garantir desconexão completa...');
            
            // Disparar evento antes do reload
            this.dispatchEvent('walletDisconnected');
            
            // Pequeno delay para eventos processarem
            setTimeout(() => {
                window.location.reload();
            }, 500);
            
        } catch (error) {
            console.error('❌ Erro ao desconectar:', error);
            
            // Mesmo com erro, limpar estado local
            this.provider = null;
            this.signer = null;
            this.currentAccount = null;
            this.currentNetwork = null;
            this.isConnected = false;
            this.clearConnectionState();
            this.dispatchEvent('walletDisconnected');
        }
    }

    /**
     * Verifica conexão existente
     */
    async checkExistingConnection() {
        try {
            if (!this.isMetaMaskAvailable()) return false;

            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (accounts.length > 0) {
                this.provider = window.ethereum;
                this.currentAccount = accounts[0];
                this.isConnected = true;
                await this.updateNetworkInfo();
                
                console.log('🔄 Conexão existente detectada:', this.currentAccount);
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erro ao verificar conexão:', error);
            return false;
        }
    }

    // ==================== INFORMAÇÕES DA REDE ====================
    
    /**
     * Atualiza informações da rede atual
     */
    async updateNetworkInfo() {
        try {
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            const networkId = parseInt(chainId, 16);
            this.currentNetwork = {
                chainId: chainId,
                networkId: networkId,
                ...this.supportedNetworks[networkId]
            };

            return this.currentNetwork;
        } catch (error) {
            console.error('❌ Erro ao obter info da rede:', error);
            return null;
        }
    }

    /**
     * Verifica se a rede atual é suportada
     */
    isNetworkSupported() {
        return this.currentNetwork && this.supportedNetworks[this.currentNetwork.networkId];
    }

    /**
     * Solicita mudança de rede
     */
    async switchNetwork(networkId) {
        try {
            const network = this.supportedNetworks[networkId];
            if (!network) {
                throw new Error('Rede não suportada');
            }

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${networkId.toString(16)}` }]
            });

        } catch (error) {
            console.error('❌ Erro ao trocar rede:', error);
            throw error;
        }
    }

    // ==================== DADOS DA CARTEIRA ====================
    
    /**
     * Obtém saldo da carteira atual
     */
    async getBalance(address = null) {
        try {
            const account = address || this.currentAccount;
            if (!account) throw new Error('Nenhuma conta conectada');

            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [account, 'latest']
            });

            return {
                wei: balance,
                eth: parseFloat(parseInt(balance, 16) / Math.pow(10, 18)).toFixed(6)
            };
        } catch (error) {
            console.error('❌ Erro ao obter saldo:', error);
            throw error;
        }
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

    // ==================== EVENT HANDLERS ====================
    
    /**
     * Manipula mudança de contas
     */
    async handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // Usuário desconectou
            await this.disconnect();
        } else if (accounts[0] !== this.currentAccount) {
            // Mudou de conta
            this.currentAccount = accounts[0];
            this.saveConnectionState();
            
            this.dispatchEvent('accountChanged', {
                account: this.currentAccount
            });
        }
    }

    /**
     * Manipula mudança de rede
     */
    async handleChainChanged(chainId) {
        await this.updateNetworkInfo();
        this.saveConnectionState();
        
        this.dispatchEvent('networkChanged', {
            network: this.currentNetwork
        });
    }

    /**
     * Manipula desconexão
     */
    async handleDisconnect() {
        await this.disconnect();
    }

    // ==================== PERSISTÊNCIA ====================
    
    /**
     * Salva estado da conexão
     */
    saveConnectionState() {
        try {
            const state = {
                account: this.currentAccount,
                network: this.currentNetwork,
                isConnected: this.isConnected,
                timestamp: Date.now()
            };
            
            localStorage.setItem('web3_connection_state', JSON.stringify(state));
        } catch (error) {
            console.error('❌ Erro ao salvar estado:', error);
        }
    }

    /**
     * Limpa estado da conexão
     */
    clearConnectionState() {
        try {
            localStorage.removeItem('web3_connection_state');
        } catch (error) {
            console.error('❌ Erro ao limpar estado:', error);
        }
    }

    /**
     * Carrega estado da conexão
     */
    loadConnectionState() {
        try {
            const state = localStorage.getItem('web3_connection_state');
            return state ? JSON.parse(state) : null;
        } catch (error) {
            console.error('❌ Erro ao carregar estado:', error);
            return null;
        }
    }

    // ==================== EVENTOS CUSTOMIZADOS ====================
    
    /**
     * Dispara evento customizado
     */
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`web3:${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // ==================== UTILIDADES ====================
    
    /**
     * Formata endereço para exibição
     */
    formatAddress(address, length = 6) {
        if (!address) return '';
        return `${address.substring(0, length)}...${address.substring(address.length - 4)}`;
    }

    /**
     * Obtém URL do explorer para endereço
     */
    getExplorerUrl(address) {
        if (!this.currentNetwork || !this.currentNetwork.explorer) return '#';
        return `${this.currentNetwork.explorer}/address/${address}`;
    }

    /**
     * Verifica se endereço é válido
     */
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Obtém informações completas do estado
     */
    getState() {
        return {
            isConnected: this.isConnected,
            currentAccount: this.currentAccount,
            currentNetwork: this.currentNetwork,
            supportedNetworks: this.supportedNetworks,
            isMetaMaskAvailable: this.isMetaMaskAvailable()
        };
    }
}

// ==================== EXPORTAÇÃO ====================

// Disponibilizar globalmente
window.Web3Manager = Web3Manager;

// Log de carregamento
console.log('📦 Web3Manager carregado');

/**
 * 📚 EXEMPLOS DE USO:
 * 
 * // Inicializar
 * const web3 = new Web3Manager();
 * 
 * // Conectar
 * await web3.connectWallet();
 * 
 * // Verificar estado
 * console.log(web3.getState());
 * 
 * // Event listeners
 * document.addEventListener('web3:walletConnected', (e) => {
 *     console.log('Carteira conectada:', e.detail);
 * });
 * 
 * document.addEventListener('web3:accountChanged', (e) => {
 *     console.log('Conta alterada:', e.detail);
 * });
 */
