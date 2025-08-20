/**
 * ¦Š METAMASK CONNECTOR - Má“DULO COMPARTILHADO
 * 
 * “ RESPONSABILIDADES:
 * - Detectar MetaMask e outras carteiras Web3
 * - Conectar carteira e obter endereá§o do usuá¡rio
 * - Verificar e trocar de rede
 * - Monitorar mudaná§as de conta/rede
 * 
 * ”— USADO POR:
 * - Todos os má³dulos que precisam de interaá§á£o blockchain
 * - Especialmente: má³dulo de dados bá¡sicos e deploy
 * 
 * “¤ EXPORTS:
 * - MetaMaskConnector: Classe principal
 * - connectWallet(): Funá§á£o de conexá£o rá¡pida
 * - getCurrentAccount(): Obter conta atual
 * - switchToNetwork(): Trocar rede
 */

// ==================== CONFIGURAá‡á•ES DE REDES ====================

/**
 * Configuraá§áµes das redes suportadas
 */
const NETWORKS = {
  // BSC Mainnet
  56: {
    chainId: '0x38',
    chainName: 'BNB Smart Chain Mainnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
  },
  
  // BSC Testnet
  97: {
    chainId: '0x61',
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
    blockExplorerUrls: ['https://testnet.bscscan.com/']
  },
  
  // Ethereum Mainnet
  1: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io/']
  },
  
  // Ethereum Sepolia
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Ethereum Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/']
  }
};

// ==================== CLASSE PRINCIPAL ====================

/**
 * Classe principal para gerenciar conexá£o com MetaMask
 */
class MetaMaskConnector {
  constructor() {
    this.provider = null;
    this.currentAccount = null;
    this.currentChainId = null;
    this.isConnected = false;
    
    // Configuraá§áµes
    this.config = {
      showDebugLogs: true,
      autoConnect: false,
      preferredNetwork: 56 // BSC Mainnet por padrá£o
    };
    
    // Eventos
    this.onAccountChange = null;
    this.onNetworkChange = null;
    this.onConnect = null;
    this.onDisconnect = null;
    
    this.log('MetaMask Connector inicializado');
  }
  
  /**
   * Sistema de logging
   */
  log(message, type = 'info') {
    if (this.config.showDebugLogs) {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = {
        info: '¦Š',
        success: '…',
        warning: 'âš ï¸',
        error: 'âŒ',
        debug: '”§'
      }[type] || '“‹';
      
      console.log(`${prefix} [METAMASK ${timestamp}] ${message}`);
    }
  }
  
  /**
   * Detecta se MetaMask está¡ instalado
   */
  isMetaMaskInstalled() {
    const isInstalled = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    this.log(`MetaMask ${isInstalled ? 'detectado' : 'ná£o encontrado'}`, isInstalled ? 'success' : 'warning');
    return isInstalled;
  }
  
  /**
   * Conecta com a carteira MetaMask
   */
  async connect() {
    this.log('Iniciando conexá£o com MetaMask...');
    
    try {
      // Verificar se MetaMask está¡ instalado
      if (!this.isMetaMaskInstalled()) {
        throw new Error('MetaMask ná£o está¡ instalado. Instale em https://metamask.io');
      }
      
      // Obter provider
      this.provider = window.ethereum;
      
      // Solicitar conexá£o
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length === 0) {
        throw new Error('Nenhuma conta autorizada');
      }
      
      // Configurar conta atual
      this.currentAccount = accounts[0];
      this.isConnected = true;
      
      // Obter rede atual
      const chainId = await this.provider.request({
        method: 'eth_chainId'
      });
      this.currentChainId = parseInt(chainId, 16);
      
      // Configurar listeners de eventos
      this.setupEventListeners();
      
      this.log(`Conectado com sucesso: ${this.currentAccount}`, 'success');
      this.log(`Rede atual: ${this.getNetworkName(this.currentChainId)}`, 'info');
      
      // Callback de conexá£o
      if (this.onConnect) {
        this.onConnect({
          account: this.currentAccount,
          chainId: this.currentChainId,
          networkName: this.getNetworkName(this.currentChainId)
        });
      }
      
      return {
        account: this.currentAccount,
        chainId: this.currentChainId,
        networkName: this.getNetworkName(this.currentChainId)
      };
      
    } catch (error) {
      this.log(`Erro na conexá£o: ${error.message}`, 'error');
      this.isConnected = false;
      throw error;
    }
  }
  
  /**
   * Desconecta da carteira (apenas local)
   */
  disconnect() {
    this.log('Desconectando...');
    
    this.provider = null;
    this.currentAccount = null;
    this.currentChainId = null;
    this.isConnected = false;
    
    // Callback de desconexá£o
    if (this.onDisconnect) {
      this.onDisconnect();
    }
    
    this.log('Desconectado', 'success');
  }
  
  /**
   * Configura listeners para eventos do MetaMask
   */
  setupEventListeners() {
    if (!this.provider) return;
    
    this.log('Configurando listeners de eventos...', 'debug');
    
    // Mudaná§a de conta
    this.provider.on('accountsChanged', (accounts) => {
      this.log(`Conta alterada: ${accounts[0] || 'desconectada'}`);
      
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.currentAccount = accounts[0];
        
        if (this.onAccountChange) {
          this.onAccountChange(this.currentAccount);
        }
      }
    });
    
    // Mudaná§a de rede
    this.provider.on('chainChanged', (chainId) => {
      this.currentChainId = parseInt(chainId, 16);
      const networkName = this.getNetworkName(this.currentChainId);
      
      this.log(`Rede alterada: ${networkName} (${this.currentChainId})`);
      
      if (this.onNetworkChange) {
        this.onNetworkChange({
          chainId: this.currentChainId,
          networkName: networkName
        });
      }
    });
    
    this.log('Listeners configurados', 'success');
  }
  
  /**
   * Troca para uma rede especá­fica
   */
  async switchToNetwork(chainId) {
    this.log(`Solicitando troca para rede ${chainId}...`);
    
    try {
      if (!this.provider) {
        throw new Error('MetaMask ná£o conectado');
      }
      
      const networkConfig = NETWORKS[chainId];
      if (!networkConfig) {
        throw new Error(`Rede ${chainId} ná£o suportada`);
      }
      
      // Tentar trocar para a rede
      try {
        await this.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkConfig.chainId }]
        });
        
        this.log(`Trocou para ${networkConfig.chainName}`, 'success');
        
      } catch (switchError) {
        // Se a rede ná£o existe, tentar adicionar
        if (switchError.code === 4902) {
          this.log(`Rede ná£o encontrada, adicionando ${networkConfig.chainName}...`);
          
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig]
          });
          
          this.log(`Rede ${networkConfig.chainName} adicionada e selecionada`, 'success');
        } else {
          throw switchError;
        }
      }
      
      return true;
      
    } catch (error) {
      this.log(`Erro ao trocar rede: ${error.message}`, 'error');
      throw error;
    }
  }
  
  /**
   * Obtá©m informaá§áµes da conta atual
   */
  async getCurrentAccount() {
    if (!this.isConnected) {
      return null;
    }
    
    try {
      // Verificar se ainda está¡ conectado
      const accounts = await this.provider.request({
        method: 'eth_accounts'
      });
      
      if (accounts.length === 0) {
        this.disconnect();
        return null;
      }
      
      this.currentAccount = accounts[0];
      
      return {
        address: this.currentAccount,
        chainId: this.currentChainId,
        networkName: this.getNetworkName(this.currentChainId),
        isConnected: true
      };
      
    } catch (error) {
      this.log(`Erro ao obter conta: ${error.message}`, 'error');
      return null;
    }
  }
  
  /**
   * Obtá©m saldo da conta atual
   */
  async getBalance() {
    if (!this.isConnected || !this.currentAccount) {
      return null;
    }
    
    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [this.currentAccount, 'latest']
      });
      
      // Converter para ETH/BNB
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      
      return {
        wei: balance,
        eth: balanceInEth,
        formatted: balanceInEth.toFixed(4)
      };
      
    } catch (error) {
      this.log(`Erro ao obter saldo: ${error.message}`, 'error');
      return null;
    }
  }
  
  /**
   * Obtá©m nome da rede por chainId
   */
  getNetworkName(chainId) {
    const network = NETWORKS[chainId];
    return network ? network.chainName : `Rede Desconhecida (${chainId})`;
  }
  
  /**
   * Verifica se está¡ na rede correta
   */
  isOnCorrectNetwork(requiredChainId) {
    return this.currentChainId === requiredChainId;
  }
  
  /**
   * Obtá©m configuraá§á£o da rede atual
   */
  getCurrentNetworkConfig() {
    return NETWORKS[this.currentChainId] || null;
  }
  
  /**
   * Assina uma mensagem
   */
  async signMessage(message) {
    if (!this.isConnected || !this.currentAccount) {
      throw new Error('MetaMask ná£o conectado');
    }
    
    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.currentAccount]
      });
      
      this.log('Mensagem assinada com sucesso', 'success');
      return signature;
      
    } catch (error) {
      this.log(`Erro ao assinar mensagem: ${error.message}`, 'error');
      throw error;
    }
  }
}

// ==================== INSTá‚NCIA GLOBAL ====================

/**
 * Instá¢ncia global do connector
 */
window.metaMaskConnector = new MetaMaskConnector();

// ==================== FUNá‡á•ES DE CONVENIáŠNCIA ====================

/**
 * Funá§á£o rá¡pida para conectar carteira
 */
async function connectWallet() {
  console.log('¦Š [QUICK-CONNECT] Conectando carteira...');
  
  try {
    const result = await window.metaMaskConnector.connect();
    console.log('… [QUICK-CONNECT] Conectado:', result);
    return result;
  } catch (error) {
    console.error('âŒ [QUICK-CONNECT] Erro:', error.message);
    throw error;
  }
}

/**
 * Funá§á£o rá¡pida para obter conta atual
 */
async function getCurrentAccount() {
  return await window.metaMaskConnector.getCurrentAccount();
}

/**
 * Funá§á£o rá¡pida para trocar rede
 */
async function switchToNetwork(chainId) {
  return await window.metaMaskConnector.switchToNetwork(chainId);
}

/**
 * Funá§á£o para verificar se MetaMask está¡ instalado
 */
function isMetaMaskInstalled() {
  return window.metaMaskConnector.isMetaMaskInstalled();
}

/**
 * Mostra modal de instalaá§á£o do MetaMask
 */
function showMetaMaskInstallModal() {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'metamaskInstallModal';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-wallet2 me-2"></i>MetaMask Necessá¡rio
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body text-center">
          <img src="../imgs/metamask-fox.svg" alt="MetaMask" style="width: 80px; height: 80px;" class="mb-3">
          <h6>MetaMask ná£o está¡ instalado</h6>
          <p>Para interagir com a blockchain, vocáª precisa ter o MetaMask instalado no seu navegador.</p>
          <div class="d-grid gap-2">
            <a href="https://metamask.io/download/" target="_blank" class="btn btn-primary">
              <i class="bi bi-download me-2"></i>Instalar MetaMask
            </a>
            <button type="button" class="btn btn-outline-secondary" onclick="location.reload()">
              <i class="bi bi-arrow-clockwise me-2"></i>Recarregar Pá¡gina
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const bootstrapModal = new bootstrap.Modal(modal);
  bootstrapModal.show();
  
  // Remover modal quando fechado
  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
}

/**
 * Configuraá§á£o automá¡tica de eventos comuns
 */
function setupCommonWalletEvents() {
  const connector = window.metaMaskConnector;
  
  // Atualizar interface quando conta mudar
  connector.onAccountChange = (account) => {
    // Atualizar elementos que mostram endereá§o
    const addressElements = document.querySelectorAll('[data-account-address]');
    addressElements.forEach(el => {
      el.textContent = account ? 
        account.substring(0, 8) + '...' + account.substring(account.length - 6) : 
        '';
    });
    
    // Atualizar botáµes de conexá£o
    const connectButtons = document.querySelectorAll('[data-connect-button]');
    connectButtons.forEach(btn => {
      btn.textContent = account ? 'Carteira Conectada' : 'Conectar Carteira';
      btn.disabled = !!account;
    });
  };
  
  // Atualizar interface quando rede mudar
  connector.onNetworkChange = ({ networkName }) => {
    const networkElements = document.querySelectorAll('[data-network-name]');
    networkElements.forEach(el => {
      el.textContent = networkName;
    });
  };
  
  console.log('”§ [METAMASK] Eventos comuns configurados');
}

// ==================== INICIALIZAá‡áƒO AUTOMáTICA ====================

document.addEventListener('DOMContentLoaded', function() {
  console.log('¦Š [METAMASK] MetaMask Connector carregado');
  
  // Configurar eventos comuns
  setupCommonWalletEvents();
  
  // Auto-conectar se já¡ autorizado
  if (window.metaMaskConnector.config.autoConnect) {
    setTimeout(async () => {
      try {
        if (window.metaMaskConnector.isMetaMaskInstalled()) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await window.metaMaskConnector.connect();
          }
        }
      } catch (error) {
        console.log('”§ [METAMASK] Auto-connect falhou (normal se ná£o autorizado)');
      }
    }, 1000);
  }
});

// ==================== EXPORTS GLOBAIS ====================

// Disponibilizar funá§áµes globalmente
window.connectWallet = connectWallet;
window.getCurrentAccount = getCurrentAccount;
window.switchToNetwork = switchToNetwork;
window.isMetaMaskInstalled = isMetaMaskInstalled;
window.showMetaMaskInstallModal = showMetaMaskInstallModal;
window.setupCommonWalletEvents = setupCommonWalletEvents;

console.log('… [METAMASK] MetaMask Connector inicializado');




