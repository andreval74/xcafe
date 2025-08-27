/**
 * xcafe Embeddable Widget
 * Sistema de widgets embarcáveis para compra de tokens
 * Usando Padrão CSS xcafe
 */

// CSS Padrão xcafe INJETADO
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
    
    .xcafe-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .xcafe-col {
      flex: 1;
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
    
    .xcafe-text-muted {
      color: #9ca3af;
      font-size: 12px;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .xcafe-widget.theme-light .xcafe-text-muted {
      color: #6b7280;
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
    
    .xcafe-input-group {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
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
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
    }
    
    .xcafe-widget.theme-light .xcafe-input-suffix {
      background: #f3f4f6;
      border-color: #d1d5db;
      color: #1f2937;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .xcafe-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(248, 93, 35, 0.3);
    }
    
    .xcafe-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .xcafe-alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 14px;
    }
    
    .xcafe-alert.success {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--xcafe-success);
      color: #6ee7b7;
    }
    
    .xcafe-alert.error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--xcafe-danger);
      color: #fca5a5;
    }
    
    .xcafe-alert.info {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid #3b82f6;
      color: #93c5fd;
    }
    
    .xcafe-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-left-color: #ffffff;
      border-radius: 50%;
      animation: xcafe-spin 1s linear infinite;
    }
    
    @keyframes xcafe-spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    .xcafe-powered-by {
      text-align: center;
      padding: 12px;
      border-top: 1px solid #374151;
      background: rgba(0, 0, 0, 0.2);
      font-size: 12px;
      color: #9ca3af;
    }
    
    .xcafe-widget.theme-light .xcafe-powered-by {
      border-color: #e5e7eb;
      background: rgba(249, 250, 251, 0.8);
      color: #6b7280;
    }
    
    .xcafe-powered-by a {
      color: var(--xcafe-primary);
      text-decoration: none;
    }
    
    .xcafe-powered-by a:hover {
      text-decoration: underline;
    }
  `;
  
  document.head.appendChild(style);
}

// função PRINCIPAL PARA CRIAR WIDGET
function createxcafeWidget(config) {
  // Injeta estilos CSS
  injectxcafeStyles();
  
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.error(`Container "${config.containerId}" não encontrado!`);
    return;
  }
  
  // ConfigurAção Padrão
  const widgetConfig = {
    contractAddress: config.contractAddress || config.contract,
    tokenPrice: config.tokenPrice || config.price || '0.001',
    receiverWallet: config.receiverWallet || config.receiver,
    tokenSymbol: config.tokenSymbol || config.symbol || 'TOKEN',
    tokenName: config.tokenName || config.title || 'Token',
    preferredNetwork: config.preferredNetwork || config.network || 97,
    theme: config.theme || 'dark',
    showLogo: config.showLogo !== false,
    showPoweredBy: config.showPoweredBy !== false,
    ...config
  };
  
  const widgetId = `xcafe-widget-${Date.now()}`;
  const themeClass = widgetConfig.theme === 'light' ? 'theme-light' : '';
  
  // HTML do Widget
  container.innerHTML = `
    <div class="xcafe-widget ${themeClass}" id="${widgetId}">
      <div class="xcafe-header">
        ${widgetConfig.tokenName || 'Comprar Token'}
      </div>
      <div class="xcafe-body">
        
        <!-- INFO DO CONTRATO -->
        <div class="xcafe-row">
          <div class="xcafe-col">
            <div class="xcafe-info-card">
              <div class="xcafe-text-muted">Preço por Token</div>
              <strong id="price-${widgetId}">Carregando...</strong>
            </div>
          </div>
          <div class="xcafe-col">
            <div class="xcafe-info-card">
              <div class="xcafe-text-muted">Disponível</div>
              <strong id="available-${widgetId}">Carregando...</strong>
            </div>
          </div>
        </div>
        
        <!-- QUANTIDADE DE TOKENS -->
        <div>
          <label class="xcafe-text-muted">Quantidade de Tokens</label>
          <input type="number" class="xcafe-input" 
                 id="amount-${widgetId}" 
                 min="1" 
                 step="1" 
                 placeholder="Digite a quantidade">
        </div>
        
        <!-- TOTAL EM BNB -->
        <div>
          <label class="xcafe-text-muted">Total a Pagar</label>
          <div class="xcafe-input-group">
            <input type="text" class="xcafe-input" id="total-${widgetId}" readonly>
            <div class="xcafe-input-suffix">BNB</div>
          </div>
        </div>

        <!-- Botão DE COMPRA -->
        <button class="xcafe-button" id="buy-btn-${widgetId}">
          <span id="buy-icon-${widgetId}">⚡</span>
          <span id="buy-text-${widgetId}">Conectar e Comprar</span>
        </button>
        
        <!-- STATUS -->
        <div id="status-${widgetId}"></div>
      </div>
      
      ${widgetConfig.showPoweredBy ? `
        <div class="xcafe-powered-by">
          Powered by <a href="https://xcafe.com.br" target="_blank">xcafe</a>
        </div>
      ` : ''}
    </div>
  `;
  
  // Adiciona event listeners
  document.getElementById(`amount-${widgetId}`).addEventListener('input', () => calculateTotal(widgetId, widgetConfig));
  document.getElementById(`buy-btn-${widgetId}`).addEventListener('click', () => buyTokens(widgetId, widgetConfig));
  
  // Carrega dados do contrato
  loadContractData(widgetId, widgetConfig);
}

// função PARA CARREGAR DADOS DO CONTRATO
async function loadContractData(widgetId, config) {
  const priceEl = document.getElementById(`price-${widgetId}`);
  const availableEl = document.getElementById(`available-${widgetId}`);
  const amountInput = document.getElementById(`amount-${widgetId}`);
  
  try {
    if (!window.ethereum) {
      priceEl.textContent = config.tokenPrice ? `${config.tokenPrice} BNB` : 'N/A';
      availableEl.textContent = 'N/A';
      return;
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(config.contractAddress, [
      'function price() view returns (uint256)',
      'function getPrice() view returns (uint256)',
      'function tokenPrice() view returns (uint256)',
      'function tokensAvailable() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function minimumPurchase() view returns (uint256)',
      'function minPurchase() view returns (uint256)'
    ], provider);

    const contractInfo = { price: config.tokenPrice };

    // Detecta preço
    if (!config.tokenPrice) {
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

    // Detecta tokens disponíveis
    try {
      const availableWei = await contract.tokensAvailable();
      contractInfo.available = ethers.utils.formatEther(availableWei);
    } catch {
      try {
        const balance = await contract.balanceOf(config.contractAddress);
        contractInfo.available = ethers.utils.formatEther(balance);
      } catch {
        contractInfo.available = null;
      }
    }

    // Detecta compra mínima
    try {
      const minWei = await contract.minimumPurchase();
      contractInfo.minPurchase = ethers.utils.formatEther(minWei);
    } catch {
      try {
        const minWei = await contract.minPurchase();
        contractInfo.minPurchase = ethers.utils.formatEther(minWei);
      } catch {
        contractInfo.minPurchase = 1;
      }
    }

    // Atualiza interface
    updateContractInfo(widgetId, contractInfo, config);

  } catch (error) {
    console.error('Erro ao carregar dados do contrato:', error);
    priceEl.textContent = config.tokenPrice ? `${config.tokenPrice} BNB` : 'N/A';
    availableEl.textContent = 'N/A';
  }
}

// função PARA ATUALIZAR INFO DO CONTRATO
function updateContractInfo(widgetId, contractInfo, config) {
  const priceEl = document.getElementById(`price-${widgetId}`);
  const availableEl = document.getElementById(`available-${widgetId}`);
  const amountInput = document.getElementById(`amount-${widgetId}`);

  if (contractInfo.price) {
    priceEl.textContent = `${contractInfo.price} BNB`;
    // Armazena preço para cálculos
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

  // Define valor mínimo
  if (contractInfo.minPurchase && contractInfo.minPurchase > 0) {
    const minValue = Math.ceil(parseFloat(contractInfo.minPurchase));
    amountInput.value = minValue;
    amountInput.min = minValue;
  } else {
    amountInput.value = '1';
    amountInput.min = '1';
  }

  // Calcula total inicial
  calculateTotal(widgetId, config);
}

// função PARA CALCULAR TOTAL
function calculateTotal(widgetId, config) {
  const amountInput = document.getElementById(`amount-${widgetId}`);
  const totalInput = document.getElementById(`total-${widgetId}`);
  const priceEl = document.getElementById(`price-${widgetId}`);

  const amount = parseFloat(amountInput.value) || 0;
  const price = parseFloat(priceEl.dataset.price || config.tokenPrice || '0.001');
  const total = amount * price;

  totalInput.value = total.toFixed(6);
}

// função DE COMPRA
async function buyTokens(widgetId, config) {
  const amountInput = document.getElementById(`amount-${widgetId}`);
  const totalInput = document.getElementById(`total-${widgetId}`);
  const statusDiv = document.getElementById(`status-${widgetId}`);
  const buyBtn = document.getElementById(`buy-btn-${widgetId}`);
  const buyIcon = document.getElementById(`buy-icon-${widgetId}`);
  const buyText = document.getElementById(`buy-text-${widgetId}`);
  
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask não encontrado! Instale o MetaMask para continuar.');
    }

    // Desabilita Botão
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
    const expectedNetwork = config.preferredNetwork || 97;
    
    if (network.chainId !== expectedNetwork) {
      const networkName = expectedNetwork === 97 ? 'BSC Testnet' : 'BSC Mainnet';
      throw new Error(`Conecte à rede ${networkName} (Chain ID: ${expectedNetwork})`);
    }

    // Contrato
    const contract = new ethers.Contract(config.contractAddress, [
      'function buy() payable',
      'function buyTokens() payable',
      'function purchase() payable'
    ], signer);

    const amount = parseFloat(amountInput.value);
    const total = parseFloat(totalInput.value);
    const value = ethers.utils.parseEther(total.toString());

    buyText.textContent = 'Executando...';
    statusDiv.innerHTML = `
      <div class="xcafe-alert info">
        <span class="xcafe-spinner"></span>
        Executando transAção...
      </div>
    `;

    // Tenta diferentes funções de compra
    let tx;
    try {
      tx = await contract.buy({ value, gasLimit: 200000 });
    } catch {
      try {
        tx = await contract.buyTokens({ value, gasLimit: 200000 });
      } catch {
        tx = await contract.purchase({ value, gasLimit: 200000 });
      }
    }

    buyText.textContent = 'Confirmando...';
    statusDiv.innerHTML = `
      <div class="xcafe-alert info">
        <span class="xcafe-spinner"></span>
        Aguardando confirmAção na blockchain...
      </div>
    `;

    // Aguarda confirmAção
    await tx.wait();

    // URL do explorer
    const explorerUrl = config.preferredNetwork === 97 ? 
      `https://testnet.bscscan.com/tx/${tx.hash}` : 
      `https://bscscan.com/tx/${tx.hash}`;

    statusDiv.innerHTML = `
      <div class="xcafe-alert success">
        ✅ Compra realizada com sucesso!
        <br><a href="${explorerUrl}" target="_blank" style="color: inherit; text-decoration: underline;">Ver no Explorer</a>
      </div>
    `;

    // Reset form
    amountInput.value = amountInput.min || '1';
    calculateTotal(widgetId, config);

  } catch (error) {
    statusDiv.innerHTML = `
      <div class="xcafe-alert error">
        ❌ ${error.message}
      </div>
    `;
  } finally {
    // Restaura Botão
    buyBtn.disabled = false;
    buyIcon.innerHTML = '⚡';
    buyText.textContent = 'Conectar e Comprar';
  }
}

// Expor função globalmente
window.createxcafeWidget = createxcafeWidget;





