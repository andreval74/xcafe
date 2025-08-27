/**
 * Sistema de Adição de Tokens usando EIP-6963
 * Detecta e conecta especificamente ao MetaMask e TrustWallet sem conflitos
 */

// Sistema de providers EIP-6963
const detectedProviders = new Map();
let isEIP6963Loaded = false;

// Interfaces EIP-6963 para TypeScript/JSDoc
/**
 * @typedef {Object} EIP6963ProviderInfo
 * @property {string} uuid - ID único do provider
 * @property {string} name - Nome da wallet
 * @property {string} icon - URL do ícone
 * @property {string} rdns - Domain name da wallet
 */

/**
 * @typedef {Object} EIP6963ProviderDetail
 * @property {EIP6963ProviderInfo} info - Informações do provider
 * @property {Object} provider - Provider EIP-1193
 */

/**
 * Configurar detecção EIP-6963 para múltiplas carteiras
 */
function setupEIP6963Detection() {
  if (isEIP6963Loaded) return Promise.resolve();
  
  return new Promise((resolve) => {
    console.log('🔍 Configurando detecção EIP-6963...');
    
    // Escutar anúncios de providers
    function handleProviderAnnounce(event) {
      const { info, provider } = event.detail;
      console.log('📢 Provider anunciado:', info.name, {
        rdns: info.rdns,
        uuid: info.uuid,
        icon: info.icon
      });
      
      // Armazenar provider com múltiplas chaves para facilitar busca
      detectedProviders.set(info.uuid, { info, provider });
      detectedProviders.set(info.rdns, { info, provider });
      detectedProviders.set(info.name.toLowerCase(), { info, provider });
    }

    window.addEventListener('eip6963:announceProvider', handleProviderAnnounce);
    
    // Solicitar que providers se anunciem
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    
    // Aguardar providers se anunciarem
    setTimeout(() => {
      isEIP6963Loaded = true;
      console.log('✅ EIP-6963 carregado. Providers detectados:', 
        Array.from(detectedProviders.keys()));
      resolve();
    }, 500);
  });
}

/**
 * Buscar provider específico por identificadores
 */
function findProviderByWallet(walletName) {
  const searchKeys = [];
  
  if (walletName === 'metamask') {
    searchKeys.push(
      'io.metamask',
      'metamask',
      'io.metamask.mobile',
      'MetaMask'
    );
  } else if (walletName === 'trustwallet') {
    searchKeys.push(
      'com.trustwallet.app',
      'trustwallet',
      'trust wallet',
      'trust',
      'TrustWallet'
    );
  }
  
  // Buscar provider pelos identificadores
  for (const key of searchKeys) {
    const provider = detectedProviders.get(key);
    if (provider) {
      console.log(`✅ Provider encontrado para ${walletName}:`, provider.info.name);
      return provider;
    }
  }
  
  console.log(`❌ Provider não encontrado para: ${walletName}`);
  return null;
}

/**
 * Detectar wallets instaladas com EIP-6963 + fallbacks
 */
async function detectInstalledWallets() {
  console.log('=== INÍCIO DA DETECÇÃO DE WALLETS ===');
  
  // Garantir que EIP-6963 foi carregado
  await setupEIP6963Detection();
  
  const wallets = [];
  
  // Verificar MetaMask via EIP-6963
  const metamaskProvider = findProviderByWallet('metamask');
  if (metamaskProvider) {
    wallets.push({
      type: 'metamask',
      name: 'MetaMask',
      provider: metamaskProvider.provider,
      source: 'EIP-6963'
    });
    console.log('🦊 MetaMask detectado via EIP-6963');
  }
  
  // Verificar TrustWallet via EIP-6963
  const trustProvider = findProviderByWallet('trustwallet');
  if (trustProvider) {
    wallets.push({
      type: 'trustwallet',
      name: 'TrustWallet',
      provider: trustProvider.provider,
      source: 'EIP-6963'
    });
    console.log('🔒 TrustWallet detectado via EIP-6963');
  }
  
  // Fallback para detecção clássica se EIP-6963 não funcionou
  if (wallets.length === 0 && window.ethereum) {
    console.log('🔄 Fallback para detecção window.ethereum');
    
    if (window.ethereum.isMetaMask) {
      wallets.push({
        type: 'metamask',
        name: 'MetaMask',
        provider: window.ethereum,
        source: 'window.ethereum'
      });
      console.log('🦊 MetaMask detectado via fallback');
    }
    
    if (window.ethereum.isTrust) {
      wallets.push({
        type: 'trustwallet',
        name: 'TrustWallet',
        provider: window.ethereum,
        source: 'window.ethereum'
      });
      console.log('🔒 TrustWallet detectado via fallback');
    }
    
    // Se não identificou especificamente, mas tem provider
    if (wallets.length === 0) {
      wallets.push({
        type: 'generic',
        name: 'Web3 Wallet',
        provider: window.ethereum,
        source: 'window.ethereum'
      });
      console.log('🌐 Wallet genérica detectada');
    }
  }
  
  console.log('🎯 Resultado da detecção:', wallets);
  console.log('=== FIM DA DETECÇÃO DE WALLETS ===');
  
  return wallets;
}

/**
 * Configurar botões de wallet baseado na detecção
 */
async function setupWalletButtons(address, symbol, decimals, name, chainId) {
  const walletDetected = document.getElementById('wallet-detected');
  const walletButtonsContainer = document.getElementById('wallet-buttons');
  const copyBtn = document.getElementById('copy-btn');
  
  if (!walletDetected || !walletButtonsContainer) {
    console.error('❌ Elementos de wallet não encontrados no DOM');
    return;
  }
  
  // Detectar wallets disponíveis
  const availableWallets = await detectInstalledWallets();
  
  // Limpar container
  walletButtonsContainer.innerHTML = '';
  
  if (availableWallets.length === 0) {
    // Nenhuma wallet detectada
    walletDetected.innerHTML = '<i class="bi bi-exclamation-triangle text-warning"></i> Nenhuma wallet Web3 detectada';
    
    const fallbackBtn = createWalletButton(
      'fallback-btn',
      '<i class="bi bi-link-45deg me-2"></i>ABRIR NO TRUSTWALLET',
      'btn btn-primary btn-lg',
      () => addTokenViaDeepLink('trustwallet', address, symbol, decimals, name, chainId)
    );
    walletButtonsContainer.appendChild(fallbackBtn);
    
  } else if (availableWallets.length === 1) {
    // Uma wallet detectada
    const wallet = availableWallets[0];
    walletDetected.innerHTML = `<i class="bi bi-check-circle text-success"></i> ${wallet.name} detectado (${wallet.source})`;
    
    const walletBtn = createWalletButton(
      `${wallet.type}-btn`,
      getWalletButtonHTML(wallet.type),
      getWalletButtonClass(wallet.type),
      () => addTokenToSpecificWallet(wallet, address, symbol, decimals, name, chainId)
    );
    walletButtonsContainer.appendChild(walletBtn);
    
  } else {
    // Múltiplas wallets detectadas
    walletDetected.innerHTML = '<i class="bi bi-check-circle text-success"></i> Múltiplas wallets detectadas';
    
    const buttonRow = document.createElement('div');
    buttonRow.className = 'row g-2';
    
    // Criar botão para cada wallet
    availableWallets.forEach(wallet => {
      const colDiv = document.createElement('div');
      colDiv.className = availableWallets.length === 2 ? 'col-6' : 'col-12 col-md-6';
      
      const walletBtn = createWalletButton(
        `${wallet.type}-btn`,
        getWalletButtonHTML(wallet.type),
        getWalletButtonClass(wallet.type) + ' w-100',
        () => addTokenToSpecificWallet(wallet, address, symbol, decimals, name, chainId)
      );
      
      colDiv.appendChild(walletBtn);
      buttonRow.appendChild(colDiv);
    });
    
    walletButtonsContainer.appendChild(buttonRow);
  }
  
  // Configurar botão de copiar
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(address).then(() => {
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="bi bi-check me-2"></i>Copiado!';
        this.className = 'btn btn-success';
        
        setTimeout(() => {
          this.innerHTML = originalText;
          this.className = 'btn btn-outline-secondary';
        }, 2000);
      }).catch(() => {
        prompt('Copie o endereço do contrato:', address);
      });
    });
  }
}

/**
 * Obter HTML do botão baseado no tipo de wallet
 */
function getWalletButtonHTML(walletType) {
  switch (walletType) {
    case 'metamask':
      return '<img src="imgs/metamask-fox.svg" width="20" height="20" style="margin-right: 8px;"> METAMASK';
    case 'trustwallet':
      return '<i class="bi bi-shield-check me-2"></i> TRUSTWALLET';
    default:
      return '<i class="bi bi-wallet2 me-2"></i> ADICIONAR À WALLET';
  }
}

/**
 * Obter classe CSS do botão baseado no tipo de wallet
 */
function getWalletButtonClass(walletType) {
  switch (walletType) {
    case 'metamask':
      return 'btn btn-warning btn-lg';
    case 'trustwallet':
      return 'btn btn-primary btn-lg';
    default:
      return 'btn btn-success btn-lg';
  }
}

/**
 * Criar botão de wallet dinamicamente
 */
function createWalletButton(id, innerHTML, className, clickHandler) {
  const button = document.createElement('button');
  button.id = id;
  button.className = className;
  button.innerHTML = innerHTML;
  button.addEventListener('click', clickHandler);
  return button;
}

/**
 * Adicionar token a uma wallet específica usando seu provider dedicado
 */
async function addTokenToSpecificWallet(wallet, address, symbol, decimals, name, chainId) {
  const button = document.getElementById(`${wallet.type}-btn`);
  if (!button) return;
  
  const originalText = button.innerHTML;
  const originalClass = button.className;
  
  button.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Processando...';
  button.disabled = true;
  
  try {
    console.log(`🚀 Adicionando token ao ${wallet.name} usando provider específico`);
    
    // Usar o provider específico da wallet
    const provider = wallet.provider;
    
    // Primeiro, garantir conexão
    await provider.request({ method: 'eth_requestAccounts' });
    console.log(`✅ ${wallet.name} conectado com sucesso`);
    
    // Tentar adicionar token
    const result = await provider.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: address,
          symbol: symbol,
          decimals: parseInt(decimals),
          image: ''
        }
      }
    });
    
    console.log(`📋 Resultado do ${wallet.name}:`, result);
    
    if (result) {
      button.innerHTML = '<i class="bi bi-check-circle me-2"></i>Token Adicionado!';
      button.className = originalClass.replace(/btn-\w+/, 'btn-success');
      showAlert(`✅ Token adicionado ao ${wallet.name} com sucesso!`, 'success');
    } else {
      button.innerHTML = '<i class="bi bi-x-circle me-2"></i>Cancelado';
      button.className = originalClass.replace(/btn-\w+/, 'btn-warning');
      showAlert('❌ Adição do token foi cancelada pelo usuário.', 'warning');
    }
    
  } catch (error) {
    console.error(`❌ Erro ao adicionar token ao ${wallet.name}:`, error);
    
    // Tratar erros específicos
    if (error.code === -32602 || error.message?.toLowerCase().includes('exist')) {
      button.innerHTML = '<i class="bi bi-check-circle me-2"></i>Já existe!';
      button.className = originalClass.replace(/btn-\w+/, 'btn-success');
      showAlert(`✅ Token já existe no ${wallet.name}!`, 'success');
    } else {
      // Fallback para deep link se API falhar
      console.log(`🔗 Tentando deep link para ${wallet.name}`);
      addTokenViaDeepLink(wallet.type, address, symbol, decimals, name, chainId);
      
      button.innerHTML = '<i class="bi bi-external-link me-2"></i>Link Aberto';
      button.className = originalClass.replace(/btn-\w+/, 'btn-info');
    }
  }
  
  // Restaurar botão após 3 segundos
  setTimeout(() => {
    button.innerHTML = originalText;
    button.className = originalClass;
    button.disabled = false;
  }, 3000);
}

/**
 * Adicionar token via deep link (fallback)
 */
function addTokenViaDeepLink(walletType, address, symbol, decimals, name, chainId) {
  console.log(`🔗 Usando deep link para ${walletType}`);
  
  if (walletType === 'metamask') {
    // Deep link do MetaMask
    const metamaskUrl = `https://metamask.app.link/add-token?address=${address}&symbol=${symbol}&decimals=${decimals}`;
    window.open(metamaskUrl, '_blank');
    showAlert('🔗 Redirecionando para MetaMask...', 'info');
    
  } else if (walletType === 'trustwallet') {
    // Deep link do TrustWallet
    const trustWalletUrl = `https://link.trustwallet.com/add_asset?asset=c${chainId}_t${address}&symbol=${symbol}&decimals=${decimals}&name=${encodeURIComponent(name)}`;
    const trustProtocol = `trustwallet://add_asset?asset=c${chainId}_t${address}&symbol=${symbol}&decimals=${decimals}&name=${encodeURIComponent(name)}`;
    
    try {
      // Tentar protocolo nativo primeiro
      window.location.href = trustProtocol;
      setTimeout(() => window.open(trustWalletUrl, '_blank'), 1000);
    } catch (error) {
      window.open(trustWalletUrl, '_blank');
    }
    
    showAlert('🔗 Redirecionando para TrustWallet...', 'info');
  }
}

/**
 * Mostrar alerta na interface
 */
function showAlert(message, type = 'info') {
  // Criar elemento de alerta se não existir
  let alertContainer = document.getElementById('alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alert-container';
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '9999';
    document.body.appendChild(alertContainer);
  }
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  alertContainer.appendChild(alert);
  
  // Remover alerta após 5 segundos
  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  }, 5000);
}

// Exportar funções principais para uso global
window.setupWalletButtons = setupWalletButtons;
window.addTokenToSpecificWallet = addTokenToSpecificWallet;
window.addTokenViaDeepLink = addTokenViaDeepLink;

console.log('✅ Sistema EIP-6963 carregado com sucesso');
