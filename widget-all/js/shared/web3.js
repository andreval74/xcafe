/*
================================================================================
XCAFE WIDGET SAAS - WEB3 UTILITIES
================================================================================
Funções para integração com MetaMask e Web3
================================================================================
*/

class Web3Manager {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.isConnected = false;
        this.chainId = null;
        this.supportedChains = {
            1: 'Ethereum Mainnet',
            56: 'Binance Smart Chain',
            137: 'Polygon',
            43114: 'Avalanche',
            250: 'Fantom'
        };
        
        this.init();
    }

    async init() {
        if (typeof window.ethereum !== 'undefined') {
            this.web3 = window.ethereum;
            await this.checkConnection();
            this.setupEventListeners();
        } else {
            console.warn('MetaMask não encontrado');
            this.showInstallMetaMask();
        }
    }

    setupEventListeners() {
        if (this.web3) {
            this.web3.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });

            this.web3.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });

            this.web3.on('disconnect', () => {
                this.handleDisconnect();
            });
        }
    }

    async checkConnection() {
        try {
            const accounts = await this.web3.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                this.account = accounts[0];
                this.isConnected = true;
                this.chainId = await this.web3.request({ method: 'eth_chainId' });
                this.updateUI();
            }
        } catch (error) {
            console.error('Erro ao verificar conexão:', error);
        }
    }

    async connectWallet() {
        if (!this.web3) {
            this.showInstallMetaMask();
            return false;
        }

        try {
            const accounts = await this.web3.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length > 0) {
                this.account = accounts[0];
                this.isConnected = true;
                this.chainId = await this.web3.request({ method: 'eth_chainId' });
                this.updateUI();
                this.showSuccess('Wallet conectada com sucesso!');
                return true;
            }
        } catch (error) {
            console.error('Erro ao conectar wallet:', error);
            if (error.code === 4001) {
                this.showError('Conexão rejeitada pelo usuário');
            } else {
                this.showError('Erro ao conectar wallet: ' + error.message);
            }
            return false;
        }
    }

    async disconnectWallet() {
        this.account = null;
        this.isConnected = false;
        this.chainId = null;
        this.updateUI();
        this.showInfo('Wallet desconectada');
    }

    async signMessage(message) {
        if (!this.isConnected) {
            throw new Error('Wallet não conectada');
        }

        try {
            const signature = await this.web3.request({
                method: 'personal_sign',
                params: [message, this.account]
            });
            
            return signature;
        } catch (error) {
            console.error('Erro ao assinar mensagem:', error);
            throw error;
        }
    }

    async switchChain(chainId) {
        try {
            await this.web3.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainId }],
            });
        } catch (error) {
            console.error('Erro ao trocar rede:', error);
            throw error;
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.handleDisconnect();
        } else if (accounts[0] !== this.account) {
            this.account = accounts[0];
            this.updateUI();
            this.showInfo('Conta alterada: ' + this.formatAddress(this.account));
        }
    }

    handleChainChanged(chainId) {
        this.chainId = chainId;
        this.updateUI();
        const chainName = this.supportedChains[parseInt(chainId, 16)] || 'Rede desconhecida';
        this.showInfo('Rede alterada: ' + chainName);
    }

    handleDisconnect() {
        this.account = null;
        this.isConnected = false;
        this.chainId = null;
        this.updateUI();
        this.showWarning('Wallet desconectada');
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    getChainName() {
        if (!this.chainId) return 'Não conectado';
        const chainIdDecimal = parseInt(this.chainId, 16);
        return this.supportedChains[chainIdDecimal] || `Chain ID: ${chainIdDecimal}`;
    }

    updateUI() {
        // Atualizar elementos da interface
        const walletAddress = document.getElementById('walletAddress');
        const walletStatus = document.getElementById('walletStatus');
        const connectBtn = document.getElementById('connectWallet');
        const chainInfo = document.getElementById('chainInfo');

        if (walletAddress) {
            walletAddress.textContent = this.isConnected ? 
                this.formatAddress(this.account) : 'Não conectado';
        }

        if (walletStatus) {
            walletStatus.className = this.isConnected ? 
                'wallet-status connected' : 'wallet-status disconnected';
            walletStatus.textContent = this.isConnected ? 'Conectado' : 'Desconectado';
        }

        if (connectBtn) {
            connectBtn.textContent = this.isConnected ? 'Desconectar' : 'Conectar Wallet';
            connectBtn.onclick = this.isConnected ? 
                () => this.disconnectWallet() : () => this.connectWallet();
        }

        if (chainInfo) {
            chainInfo.textContent = this.getChainName();
        }

        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('walletStatusChanged', {
            detail: {
                isConnected: this.isConnected,
                account: this.account,
                chainId: this.chainId
            }
        }));
    }

    showInstallMetaMask() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">MetaMask Necessário</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Para usar este sistema, você precisa instalar a extensão MetaMask.</p>
                    <div class="text-center">
                        <a href="https://metamask.io/download/" target="_blank" class="btn btn-primary">
                            Instalar MetaMask
                        </a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Instância global
const web3Manager = new Web3Manager();

// Funções auxiliares globais
window.connectWallet = () => web3Manager.connectWallet();
window.disconnectWallet = () => web3Manager.disconnectWallet();
window.getWalletAddress = () => web3Manager.account;
window.isWalletConnected = () => web3Manager.isConnected;
window.signMessage = (message) => web3Manager.signMessage(message);

// CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .wallet-status.connected {
        color: var(--success-color);
    }
    
    .wallet-status.disconnected {
        color: var(--danger-color);
    }
`;
document.head.appendChild(style);
