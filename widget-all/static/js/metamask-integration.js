/**
 * Widget SaaS - MetaMask Integration Complete
 * Sistema completo de integração com MetaMask
 */

class MetaMaskIntegration {
    constructor() {
        this.isConnected = false;
        this.userAccount = null;
        this.chainId = null;
        this.web3 = null;
        this.supportedChains = {
            '0x1': 'Ethereum Mainnet',
            '0x38': 'BSC Mainnet', 
            '0x89': 'Polygon Mainnet',
            '0x61': 'BSC Testnet',
            '0x13881': 'Mumbai Testnet'
        };
        this.init();
    }

    async init() {
        console.log('🦊 Iniciando MetaMask Integration...');
        
        // Verificar se MetaMask está instalado
        if (typeof window.ethereum !== 'undefined') {
            console.log('✅ MetaMask detectado!');
            this.web3 = window.ethereum;
            this.setupEventListeners();
            await this.checkConnection();
        } else {
            console.log('❌ MetaMask não encontrado');
            this.showInstallPrompt();
        }
    }

    setupEventListeners() {
        // Listener para mudança de conta
        this.web3.on('accountsChanged', (accounts) => {
            console.log('👤 Conta alterada:', accounts);
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.userAccount = accounts[0];
                this.updateUI();
            }
        });

        // Listener para mudança de rede
        this.web3.on('chainChanged', (chainId) => {
            console.log('🌐 Rede alterada:', chainId);
            this.chainId = chainId;
            this.updateUI();
        });

        // Listener para conexão/desconexão
        this.web3.on('connect', (connectInfo) => {
            console.log('🔗 MetaMask conectado:', connectInfo);
            this.isConnected = true;
        });

        this.web3.on('disconnect', (error) => {
            console.log('❌ MetaMask desconectado:', error);
            this.disconnect();
        });
    }

    async checkConnection() {
        try {
            const accounts = await this.web3.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                this.userAccount = accounts[0];
                this.isConnected = true;
                
                // Obter chain ID atual
                this.chainId = await this.web3.request({
                    method: 'eth_chainId'
                });
                
                console.log('✅ Já conectado:', this.userAccount);
                this.updateUI();
                return true;
            }
        } catch (error) {
            console.error('❌ Erro ao verificar conexão:', error);
        }
        return false;
    }

    async connect() {
        try {
            console.log('🔗 Conectando ao MetaMask...');
            
            const accounts = await this.web3.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                this.userAccount = accounts[0];
                this.isConnected = true;
                
                // Obter chain ID
                this.chainId = await this.web3.request({
                    method: 'eth_chainId'
                });

                console.log('✅ Conectado com sucesso!');
                console.log('👤 Conta:', this.userAccount);
                console.log('🌐 Rede:', this.getChainName(this.chainId));
                
                this.updateUI();
                
                // Autenticar via JWT
                await this.authenticateWithJWT();
                
                return {
                    success: true,
                    account: this.userAccount,
                    chainId: this.chainId
                };
            }
        } catch (error) {
            console.error('❌ Erro ao conectar:', error);
            this.showError('Erro ao conectar com MetaMask: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    async authenticateWithJWT() {
        try {
            console.log('🔐 Autenticando via JWT...');
            
            // Criar mensagem para assinar
            const message = `Widget SaaS Login\\nAccount: ${this.userAccount}\\nTimestamp: ${Date.now()}`;
            
            // Solicitar assinatura
            const signature = await this.web3.request({
                method: 'personal_sign',
                params: [message, this.userAccount]
            });

            // Enviar para backend para validação
            const response = await fetch('/api/auth/metamask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    account: this.userAccount,
                    message: message,
                    signature: signature
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Salvar token JWT
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userAccount', this.userAccount);
                
                console.log('✅ Autenticado com sucesso via JWT!');
                this.showSuccess('Login realizado com sucesso!');
                
                return data.token;
            } else {
                throw new Error(data.error || 'Falha na autenticação');
            }
        } catch (error) {
            console.error('❌ Erro na autenticação JWT:', error);
            this.showError('Erro na autenticação: ' + error.message);
            throw error;
        }
    }

    async switchToChain(chainId) {
        try {
            await this.web3.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainId }]
            });
            
            this.chainId = chainId;
            console.log('🔄 Rede alterada para:', this.getChainName(chainId));
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Erro ao trocar rede:', error);
            
            // Se a rede não estiver adicionada, tentar adicionar
            if (error.code === 4902) {
                await this.addChain(chainId);
            } else {
                this.showError('Erro ao trocar rede: ' + error.message);
            }
        }
    }

    async addChain(chainId) {
        // Configurações das redes
        const chainConfigs = {
            '0x38': {
                chainId: '0x38',
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
            },
            '0x89': {
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/']
            }
        };

        try {
            await this.web3.request({
                method: 'wallet_addEthereumChain',
                params: [chainConfigs[chainId]]
            });
            
            console.log('✅ Rede adicionada:', this.getChainName(chainId));
            
        } catch (error) {
            console.error('❌ Erro ao adicionar rede:', error);
            this.showError('Erro ao adicionar rede: ' + error.message);
        }
    }

    async getBalance() {
        if (!this.isConnected) return '0';
        
        try {
            const balance = await this.web3.request({
                method: 'eth_getBalance',
                params: [this.userAccount, 'latest']
            });
            
            // Converter de Wei para Ether
            const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18);
            return balanceInEther.toFixed(4);
            
        } catch (error) {
            console.error('❌ Erro ao obter saldo:', error);
            return '0';
        }
    }

    async sendTransaction(to, value, data = '0x') {
        if (!this.isConnected) {
            throw new Error('MetaMask não conectado');
        }

        try {
            const transactionParameters = {
                to: to,
                from: this.userAccount,
                value: '0x' + parseInt(value * Math.pow(10, 18)).toString(16),
                data: data
            };

            const txHash = await this.web3.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters]
            });

            console.log('✅ Transação enviada:', txHash);
            return txHash;
            
        } catch (error) {
            console.error('❌ Erro ao enviar transação:', error);
            this.showError('Erro na transação: ' + error.message);
            throw error;
        }
    }

    disconnect() {
        this.isConnected = false;
        this.userAccount = null;
        this.chainId = null;
        
        // Limpar storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userAccount');
        
        console.log('🔌 MetaMask desconectado');
        this.updateUI();
    }

    getChainName(chainId) {
        return this.supportedChains[chainId] || 'Rede Desconhecida';
    }

    showInstallPrompt() {
        const installHtml = `
            <div class="metamask-install-prompt">
                <h3>🦊 MetaMask Necessário</h3>
                <p>Para usar este widget, você precisa instalar a extensão MetaMask:</p>
                <a href="https://metamask.io/download/" target="_blank" class="btn btn-primary">
                    Instalar MetaMask
                </a>
            </div>
        `;
        
        document.getElementById('metamask-container').innerHTML = installHtml;
    }

    updateUI() {
        const container = document.getElementById('metamask-container');
        if (!container) return;

        if (this.isConnected) {
            container.innerHTML = `
                <div class="metamask-connected">
                    <div class="account-info">
                        <span class="account-address">${this.formatAddress(this.userAccount)}</span>
                        <span class="chain-info">${this.getChainName(this.chainId)}</span>
                    </div>
                    <button onclick="metaMask.disconnect()" class="btn btn-outline-secondary btn-sm">
                        Desconectar
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button onclick="metaMask.connect()" class="btn btn-primary">
                    🦊 Conectar MetaMask
                </button>
            `;
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Inicializar quando a página carregar
let metaMask;
document.addEventListener('DOMContentLoaded', function() {
    metaMask = new MetaMaskIntegration();
    
    // Expor globalmente para uso em outros scripts
    window.metaMask = metaMask;
});

// Expor classe para uso externo
window.MetaMaskIntegration = MetaMaskIntegration;
