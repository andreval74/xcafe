/**
 * xcafe Embeddable Widget
 * Sistema de widgets embarcáveis para compra de tokens
 * Usando padráo CSS xcafe
 */

// CSS PADRáO xcafe INJETADO
function injectxcafeStyles() {
  if (document.getElementById('xcafe-widget-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'xcafe-widget-styles';
  style.textContent = `
    /* xcafe Widget Styles - Baseado no globals.css */
    .xcafe-widget {
      --xcafe-primary: #f85d23;
      --xcafe-warning: #f59e0b;
      --xcafe-success: #10b981;
      --xcafe-danger: #ef4444;
      --xcafe-dark: #1a1a1a;
      --xcafe-light: #f8fafc;
      
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 400px;
      margin: 0 auto;
      border: 1px solid #374151;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      background: linear-gradient(135deg, var(--xcafe-dark) 0%, #111827 100%);
      color: #ffffff;
    }
    
    .xcafe-widget.theme-light {
      background: linear-gradient(135deg, var(--xcafe-light) 0%, #ffffff 100%);
      color: #1f2937;
      border-color: #e5e7eb;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }
    
    .xcafe-header {
      background: linear-gradient(135deg, var(--xcafe-primary) 0%, var(--xcafe-warning) 100%);
      color: white;
      padding: 16px;
      text-align: center;
      font-weight: 600;
    }
    
    .xcafe-body {
      padding: 24px;
    }
    
    .xcafe-info-card {
      background: rgba(107, 114, 128, 0.1);
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      margin-bottom: 8px;
    }
    
    .xcafe-widget.theme-light .xcafe-info-card {
      background: rgba(249, 250, 251, 0.8);
      border-color: #e5e7eb;
    }
    
    .xcafe-input {
      background: #374151;
      border: 1px solid #4b5563;
      border-radius: 8px;
      color: #ffffff;
      padding: 12px 16px;
      width: 100%;
      font-size: 14px;
      margin-bottom: 16px;
    }
    
    .xcafe-widget.theme-light .xcafe-input {
      background: #ffffff;
      border-color: #d1d5db;
      color: #1f2937;
    }
    
    .xcafe-input:focus {
      outline: none;
      border-color: var(--xcafe-primary);
      box-shadow: 0 0 0 3px rgba(248, 93, 35, 0.1);
    }
    
    .xcafe-button {
      background: linear-gradient(135deg, var(--xcafe-primary) 0%, var(--xcafe-warning) 100%);
      border: none;
      border-radius: 8px;
      color: white;
      padding: 12px 24px;
      font-weight: 600;
      width: 100%;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    
    .xcafe-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(248, 93, 35, 0.3); 
    }
    
    .xcafe-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    
    .xcafe-alert {
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 14px;
    }
    
    .xcafe-alert.success {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--xcafe-success);
      color: #10b981;
    }
    
    .xcafe-alert.error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--xcafe-danger);
      color: #ef4444;
    }
    
    .xcafe-alert.info {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid #3b82f6;
      color: #60a5fa;
    }
    
    .xcafe-spinner {
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      animation: xcafe-spin 1s linear infinite;
      display: inline-block;
      margin-right: 8px;
    }
    
    @keyframes xcafe-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .xcafe-text-muted {
      color: #9ca3af;
      font-size: 12px;
    }
    
    .xcafe-widget.theme-light .xcafe-text-muted {
      color: #6b7280;
    }
    
    .xcafe-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .xcafe-col {
      flex: 1;
    }
    
    .xcafe-input-group {
      position: relative;
      display: flex;
    }
    
    .xcafe-input-group .xcafe-input {
      margin-bottom: 0;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    
    .xcafe-input-suffix {
      background: #4b5563;
      border: 1px solid #4b5563;
      border-left: none;
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
      padding: 12px 16px;
      color: #9ca3af;
      font-size: 14px;
      display: flex;
      align-items: center;
    }
    
    .xcafe-widget.theme-light .xcafe-input-suffix {
      background: #f3f4f6;
      border-color: #d1d5db;
      color: #6b7280;
    }
  `;
  
  document.head.appendChild(style);
}

// FUNá‡áƒO PRINCIPAL PARA CRIAR WIDGET
function createxcafeWidget(config) {
  // Injeta estilos CSS
  injectxcafeStyles();
  
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.error(`Container "${config.containerId}" ná£o encontrado!`);
    return;
  }
  
  // Configuraá§á£o padrá£o
  const widgetConfig = {
    contract: config.contract || '0x7Ab950357Bb80172718a70FD04783e6949193006',
    network: config.network || 97,
    title: config.title || 'Comprar Tokens',
    logo: config.logo || 'https://via.placeholder.com/32x32/f85d23/FFFFFF?text=SC',
    price: config.price || null,
    theme: config.theme || 'dark',
    ...config
  };
  
  const widgetId = `xcafe-widget-${Date.now()}`;
  const themeClass = widgetConfig.theme === 'light' ? 'theme-light' : '';
  
  // HTML do Widget
  container.innerHTML = `
    <div class="xcafe-widget ${themeClass}" id="${widgetId}">
      <div class="xcafe-header">
        <img src="${widgetConfig.logo}" alt="Logo" height="32" style="vertical-align: middle;">
        <span style="margin-left: 8px;">${widgetConfig.title}</span>
      </div>
      <div class="xcafe-body">
        
        <!-- INFO DO CONTRATO -->
        <div class="xcafe-row">
          <div class="xcafe-col">
            <div class="xcafe-info-card">
              <div class="xcafe-text-muted">Preá§o por Token</div>
              <strong id="price-${widgetId}">Carregando...</strong>
            </div>
          </div>
          <div class="xcafe-col">
            <div class="xcafe-info-card">
              <div class="xcafe-text-muted">Disponá­vel</div>
              <strong id="available-${widgetId}">Carregando...</strong>
            </div>
          </div>
        </div>

        <!-- CALCULADORA -->
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Quantidade de Tokens</label>
          <input type="number" class="xcafe-input" 
                 id="amount-${widgetId}" 
                 value="100" 
                 min="1" 
                 placeholder="Digite a quantidade">
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Total a Pagar</label>
          <div class="xcafe-input-group">
            <input type="text" class="xcafe-input" id="total-${widgetId}" readonly>
            <div class="xcafe-input-suffix">BNB</div>
          </div>
        </div>

        <!-- BOTáƒO DE COMPRA -->
        <button class="xcafe-button" id="buy-btn-${widgetId}">
          <span id="buy-icon-${widgetId}">âš¡</span>
          <span id="buy-text-${widgetId}">Conectar e Comprar</span>
        </button>

        <!-- STATUS -->
        <div id="status-${widgetId}"></div>
      </div>
    </div>
  `;

  // Event Listeners
  document.getElementById(`amount-${widgetId}`).addEventListener('input', () => calculateTotal(widgetId, widgetConfig));
  document.getElementById(`buy-btn-${widgetId}`).addEventListener('click', () => buyTokens(widgetId, widgetConfig));

  // Carrega dados do contrato
  loadContractData(widgetId, widgetConfig);
}

// CARREGA DADOS DO CONTRATO
async function loadContractData(widgetId, config) {
  try {
    const rpcUrl = config.network === 97 ? 
      'https://data-seed-prebsc-1-s1.binance.org:8545/' : 
      config.network === 56 ?
      'https://bsc-dataseed1.binance.org/' :
      'https://eth-mainnet.public.blastapi.io';
    
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(config.contract, [
      'function price() view returns (uint256)',
      'function getPrice() view returns (uint256)', 
      'function tokenPrice() view returns (uint256)',
      'function tokensAvailable() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function totalSupply() view returns (uint256)',
      'function minimumPurchase() view returns (uint256)',
      'function minPurchase() view returns (uint256)'
    ], provider);

    const contractInfo = { price: config.price };

    // Detecta preá§o
    if (!config.price) {
      try {
        const priceWei = await contract.price();
        contractInfo.price = ethers.utils.formatEther(priceWei);
      } catch {
        try {
          const priceWei = await contract.getPrice();
          contractInfo.price = ethers.utils.formatEther(priceWei);
        } catch {
          try {
            const priceWei = await contract.tokenPrice();
            contractInfo.price = ethers.utils.formatEther(priceWei);
          } catch {
            contractInfo.price = '0.001'; // Fallback
          }
        }
      }
    }

    // Detecta tokens disponá­veis
    try {
      const availableWei = await contract.tokensAvailable();
      contractInfo.available = ethers.utils.formatEther(availableWei);
    } catch {
      try {
        const balance = await contract.balanceOf(config.contract);
        contractInfo.available = ethers.utils.formatEther(balance);
      } catch {
        contractInfo.available = '1000000'; // Fallback
      }
    }

    // Detecta compra má­nima
    try {
      const minWei = await contract.minimumPurchase();
      contractInfo.minPurchase = ethers.utils.formatEther(minWei);
    } catch {
      try {
        const minWei = await contract.minPurchase();
        contractInfo.minPurchase = ethers.utils.formatEther(minWei);
      } catch {
        contractInfo.minPurchase = '1'; // Fallback
      }
    }

    updateWidgetDisplay(widgetId, contractInfo);
    
  } catch (error) {
    console.error('Erro ao carregar contrato:', error);
    document.getElementById(`price-${widgetId}`).textContent = 'Erro';
    document.getElementById(`available-${widgetId}`).textContent = 'Erro';
  }
}

// ATUALIZA DISPLAY DO WIDGET
function updateWidgetDisplay(widgetId, contractInfo) {
  const priceEl = document.getElementById(`price-${widgetId}`);
  const availableEl = document.getElementById(`available-${widgetId}`);
  const amountInput = document.getElementById(`amount-${widgetId}`);

  if (contractInfo.price) {
    priceEl.textContent = `${contractInfo.price} BNB`;
    // Armazena preá§o para cá¡lculos
    priceEl.dataset.price = contractInfo.price;
  } else {
    priceEl.textContent = 'N/A';
  }

  if (contractInfo.available) {
    const available = Math.floor(parseFloat(contractInfo.available));
    availableEl.textContent = available.toLocaleString();
  } else {
    availableEl.textContent = 'N/A';
  }

  // Define valor má­nimo
  if (contractInfo.minPurchase && contractInfo.minPurchase > 0) {
    const minValue = Math.ceil(parseFloat(contractInfo.minPurchase));
    amountInput.value = minValue;
    amountInput.min = minValue;
  }

  calculateTotal(widgetId, { price: contractInfo.price });
}

// CALCULA TOTAL
function calculateTotal(widgetId, config) {
  const amountInput = document.getElementById(`amount-${widgetId}`);
  const totalInput = document.getElementById(`total-${widgetId}`);
  const priceEl = document.getElementById(`price-${widgetId}`);
  
  const amount = parseFloat(amountInput.value) || 0;
  const price = parseFloat(priceEl.dataset.price) || parseFloat(config.price) || 0;
  
  const total = amount * price;
  totalInput.value = total.toFixed(6);
}

// FUNá‡áƒO DE COMPRA
async function buyTokens(widgetId, config) {
  const amountInput = document.getElementById(`amount-${widgetId}`);
  const totalInput = document.getElementById(`total-${widgetId}`);
  const statusDiv = document.getElementById(`status-${widgetId}`);
  const buyBtn = document.getElementById(`buy-btn-${widgetId}`);
  const buyIcon = document.getElementById(`buy-icon-${widgetId}`);
  const buyText = document.getElementById(`buy-text-${widgetId}`);
  
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask ná£o encontrado! Instale o MetaMask para continuar.');
    }

    // Desabilita botá£o
    buyBtn.disabled = true;
    buyIcon.innerHTML = '<span class="xcafe-spinner"></span>';
    buyText.textContent = 'Conectando...';

    statusDiv.innerHTML = `
      <div class="xcafe-alert info">
        <span class="xcafe-spinner"></span>
        Conectando MetaMask...
      </div>
    `;

    // Conecta MetaMask
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // Verifica rede
    const network = await provider.getNetwork();
    const targetChainId = config.network;
    
    if (network.chainId !== targetChainId) {
      statusDiv.innerHTML = `
        <div class="xcafe-alert info">
          <span class="xcafe-spinner"></span>
          Mudando para rede correta...
        </div>
      `;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
    }

    // Prepara contrato
    const contract = new ethers.Contract(config.contract, [
      'function buy() payable',
      'function buyTokens() payable',
      'function buyWithBNB() payable',
      'function purchase() payable'
    ], signer);

    const totalCost = totalInput.value;
    const value = ethers.utils.parseEther(totalCost);

    buyText.textContent = 'Executando...';
    statusDiv.innerHTML = `
      <div class="xcafe-alert info">
        <span class="xcafe-spinner"></span>
        Executando transaá§á£o...
      </div>
    `;

    // Tenta diferentes funá§áµes de compra
    let tx;
    try {
      tx = await contract.buy({ value, gasLimit: 200000 });
    } catch {
      try {
        tx = await contract.buyTokens({ value, gasLimit: 200000 });
      } catch {
        try {
          tx = await contract.buyWithBNB({ value, gasLimit: 200000 });
        } catch {
          tx = await contract.purchase({ value, gasLimit: 200000 });
        }
      }
    }

    buyText.textContent = 'Aguardando...';
    statusDiv.innerHTML = `
      <div class="xcafe-alert info">
        <span class="xcafe-spinner"></span>
        Aguardando confirmaá§á£o na blockchain...
      </div>
    `;

    // Aguarda confirmaá§á£o
    await tx.wait();

    // URL do explorer
    const explorerUrl = config.network === 97 ? 
      `https://testnet.bscscan.com/tx/${tx.hash}` : 
      config.network === 56 ?
      `https://bscscan.com/tx/${tx.hash}` :
      `https://etherscan.io/tx/${tx.hash}`;

    statusDiv.innerHTML = `
      <div class="xcafe-alert success">
        … Compra realizada com sucesso!
        <br><a href="${explorerUrl}" target="_blank" style="color: inherit; text-decoration: underline;">Ver no Explorer</a>
      </div>
    `;

    // Reset form
    amountInput.value = amountInput.min || '1';
    calculateTotal(widgetId, config);

  } catch (error) {
    statusDiv.innerHTML = `
      <div class="xcafe-alert error">
        âŒ ${error.message}
      </div>
    `;
  } finally {
    // Restaura botá£o
    buyBtn.disabled = false;
    buyIcon.innerHTML = 'âš¡';
    buyText.textContent = 'Conectar e Comprar';
  }
}

// Exporta funá§á£o global
if (typeof window !== 'undefined') {
  window.createxcafeWidget = createxcafeWidget;
}




