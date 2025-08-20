/**
 * xcafe Widget Core - Sistema Minimalista
 * Versá£o ultra-compacta com funá§áµes centralizadas
 */

window.xcafe = window.xcafe || {};

// CONFIGURAá‡áƒO PADRáƒO
xcafe.config = {
  rpcUrls: {
    97: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    56: 'https://bsc-dataseed1.binance.org/',
    1: 'https://mainnet.infura.io/v3/YOUR_KEY'
  },
  explorers: {
    97: 'https://testnet.bscscan.com/tx/',
    56: 'https://bscscan.com/tx/',
    1: 'https://etherscan.io/tx/'
  },
  networks: {
    97: { chainId: '0x61', name: 'BSC Testnet', symbol: 'BNB', rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/', explorer: 'https://testnet.bscscan.com/' },
    56: { chainId: '0x38', name: 'BSC Mainnet', symbol: 'BNB', rpc: 'https://bsc-dataseed1.binance.org/', explorer: 'https://bscscan.com/' }
  }
};

// ABI MáNIMA PARA CONTRATOS
xcafe.abi = [
  'function buy() payable',
  'function price() view returns (uint256)',
  'function getPrice() view returns (uint256)',
  'function tokenPrice() view returns (uint256)',
  'function tokensAvailable() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function minimumPurchase() view returns (uint256)',
  'function minPurchase() view returns (uint256)',
  'function minTokens() view returns (uint256)'
];

// FUNá‡áƒO PRINCIPAL - CRIAR WIDGET
xcafe.createWidget = function(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container ná£o encontrado:', containerId);
    return;
  }

  const config = {
    contract: options.contract || '0x7Ab950357Bb80172718a70FD04783e6949193006',
    network: options.network || 97,
    title: options.title || 'Comprar Token xcafe',
    logo: options.logo || '',
    theme: options.theme || 'dark',
    price: options.price || null
  };

  // Salva configuraá§á£o globalmente
  container._xcafeConfig = config;
  
  // Gera HTML má­nimo - APENAS TEMA ESCURO
  const themeClasses = 'bg-dark text-light border-secondary';
  const cardBg = 'bg-secondary';
  const inputClasses = 'bg-dark text-light border-secondary';
  
  container.innerHTML = `
    <div class="card ${themeClasses}" style="max-width:400px;margin:20px auto">
      <div class="card-header text-center text-white" style="background:linear-gradient(135deg,#f85d23,#f59e0b)">
        ${config.logo ? `<img src="${config.logo}" height="32" class="me-2" onerror="this.style.display='none'">` : ''}
        <span class="fw-bold">${config.title}</span>
      </div>
      <div class="card-body">
        <div class="row g-2 mb-3">
          <div class="col-6">
            <div class="text-center p-2 rounded ${cardBg}">
              <small class="text-muted">Preá§o/Token</small>
              <div id="${containerId}_price" class="fw-bold">...</div>
            </div>
          </div>
          <div class="col-6">
            <div class="text-center p-2 rounded ${cardBg}">
              <small class="text-muted">Disponá­vel</small>
              <div id="${containerId}_available" class="fw-bold">...</div>
            </div>
          </div>
        </div>
        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="form-label small">Quantidade</label>
            <input type="number" class="form-control ${inputClasses}" id="${containerId}_amount" value="0" min="1" oninput="xcafe.calculate('${containerId}')">
          </div>
          <div class="col-6">
            <label class="form-label small">Total BNB</label>
            <input type="text" class="form-control ${inputClasses}" id="${containerId}_total" readonly>
          </div>
        </div>
        <button class="btn btn-primary w-100" onclick="xcafe.buy('${containerId}')">âš¡ Comprar Tokens</button>
        <div id="${containerId}_status"></div>
      </div>
    </div>
  `;

  // Carrega dados do contrato
  xcafe.loadContract(containerId);
};

// CARREGA DADOS DO CONTRATO
xcafe.loadContract = async function(containerId) {
  const container = document.getElementById(containerId);
  const config = container._xcafeConfig;
  
  try {
    // Evita conflitos com outras bibliotecas
    if (typeof ethers === 'undefined') {
      console.error('ethers.js ná£o carregado');
      return;
    }

    const provider = new ethers.providers.JsonRpcProvider(xcafe.config.rpcUrls[config.network]);
    const contract = new ethers.Contract(config.contract, xcafe.abi, provider);

    // Detecta preá§o
    let price = config.price;
    if (!price) {
      try {
        const methods = ['price', 'getPrice', 'tokenPrice'];
        for (const method of methods) {
          try {
            const priceWei = await contract[method]();
            price = ethers.utils.formatEther(priceWei);
            break;
          } catch (e) { continue; }
        }
        if (!price) price = '0.001';
      } catch (e) {
        price = '0.001';
      }
    }

    // Detecta disponá­vel
    let available = '1000000';
    try {
      const methods = ['tokensAvailable', 'balanceOf'];
      for (const method of methods) {
        try {
          const availableWei = method === 'balanceOf' ? 
            await contract[method](config.contract) : 
            await contract[method]();
          available = Math.floor(parseFloat(ethers.utils.formatEther(availableWei))).toLocaleString();
          break;
        } catch (e) { continue; }
      }
    } catch (e) {}

    // Detecta má­nimo
    let minAmount = 1;
    let maxAmount = null;
    try {
      const methods = ['minimumPurchase', 'minPurchase', 'minTokens'];
      for (const method of methods) {
        try {
          const minWei = await contract[method]();
          minAmount = Math.ceil(parseFloat(ethers.utils.formatEther(minWei)));
          if (minAmount > 0) break;
        } catch (e) { continue; }
      }
      
      // Detecta má¡ximo se existir
      try {
        const maxMethods = ['maximumPurchase', 'maxPurchase', 'maxTokens'];
        for (const method of maxMethods) {
          try {
            const maxWei = await contract[method]();
            maxAmount = Math.floor(parseFloat(ethers.utils.formatEther(maxWei)));
            if (maxAmount > 0) break;
          } catch (e) { continue; }
        }
      } catch (e) {}
      
    } catch (e) {}

    // Se ná£o conseguiu detectar má­nimo e ná£o tem preá§o fixo, usa 0.001 como base
    if (minAmount <= 1 && !config.price) {
      const basePrice = parseFloat(price) || 0.001;
      minAmount = Math.ceil(0.001 / basePrice); // Má­nimo para 0.001 BNB
    }

    // Atualiza interface
    document.getElementById(`${containerId}_price`).textContent = `${price} BNB`;
    document.getElementById(`${containerId}_available`).textContent = available;
    
    const amountInput = document.getElementById(`${containerId}_amount`);
    amountInput.value = minAmount;
    amountInput.min = minAmount;
    
    // Salva dados no container
    container._contractData = { price, available, minAmount, maxAmount };
    
    xcafe.calculate(containerId);

  } catch (error) {
    console.error('Erro ao carregar contrato:', error);
    // Valores padrá£o em caso de erro - com má­nimo baseado em 0.001 BNB
    const defaultPrice = config.price || '0.001';
    const defaultMinAmount = Math.ceil(0.001 / parseFloat(defaultPrice));
    
    document.getElementById(`${containerId}_price`).textContent = `${defaultPrice} BNB`;
    document.getElementById(`${containerId}_available`).textContent = '1,000,000';
    
    const amountInput = document.getElementById(`${containerId}_amount`);
    amountInput.value = defaultMinAmount;
    amountInput.min = defaultMinAmount;
    
    container._contractData = { price: defaultPrice, available: '1000000', minAmount: defaultMinAmount, maxAmount: null };
    xcafe.calculate(containerId);
  }
};

// CALCULA TOTAL COM VALIDAá‡áƒO
xcafe.calculate = function(containerId) {
  const container = document.getElementById(containerId);
  const contractData = container._contractData || { price: '0.001' };
  
  const amountInput = document.getElementById(`${containerId}_amount`);
  const amount = parseFloat(amountInput.value) || 0;
  const price = parseFloat(contractData.price) || 0.001;
  const total = (amount * price).toFixed(6);
  
  // Validaá§á£o de má¡ximo
  const statusDiv = document.getElementById(`${containerId}_status`);
  if (contractData.maxAmount && amount > contractData.maxAmount) {
    statusDiv.innerHTML = `<div class="text-center mt-2"><small class="text-warning" style="font-size:0.8em">âš ï¸ Má¡ximo: ${contractData.maxAmount.toLocaleString()} tokens</small></div>`;
    amountInput.value = contractData.maxAmount;
    document.getElementById(`${containerId}_total`).value = (contractData.maxAmount * price).toFixed(6);
    return;
  } else {
    statusDiv.innerHTML = '';
  }
  
  document.getElementById(`${containerId}_total`).value = total;
};

// FUNá‡áƒO DE COMPRA
xcafe.buy = async function(containerId) {
  const container = document.getElementById(containerId);
  const config = container._xcafeConfig;
  const status = document.getElementById(`${containerId}_status`);
  const total = document.getElementById(`${containerId}_total`).value;

  try {
    // Limpa erros anteriores do console (silencioso)
    if (console.clear && window.location.hostname !== 'localhost') {
      // Ná£o limpa em desenvolvimento
    }

    if (!window.ethereum) {
      throw new Error('MetaMask ná£o instalado!');
    }

    status.innerHTML = `<div class="text-center mt-2"><small class="text-info" style="font-size:0.8em">”„ Conectando...</small></div>`;

    // Conecta MetaMask
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();

    // Adiciona/troca rede se necessá¡rio
    if (network.chainId !== config.network) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: xcafe.config.networks[config.network].chainId }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          const networkConfig = xcafe.config.networks[config.network];
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: networkConfig.chainId,
              chainName: networkConfig.name,
              nativeCurrency: { name: networkConfig.symbol, symbol: networkConfig.symbol, decimals: 18 },
              rpcUrls: [networkConfig.rpc],
              blockExplorerUrls: [networkConfig.explorer]
            }]
          });
        } else {
          throw switchError;
        }
      }
    }

    status.innerHTML = `<div class="text-center mt-2"><small class="text-warning" style="font-size:0.8em">âš¡ Executando...</small></div>`;

    // Executa transaá§á£o
    const signer = provider.getSigner();
    const contract = new ethers.Contract(config.contract, xcafe.abi, signer);
    
    const tx = await contract.buy({ 
      value: ethers.utils.parseEther(total),
      gasLimit: 200000 
    });

    status.innerHTML = `<div class="text-center mt-2"><small class="text-info" style="font-size:0.8em">â³ Aguardando confirmaá§á£o...</small></div>`;
    await tx.wait();

    // Sucesso com hash
    const explorerUrl = xcafe.config.explorers[config.network];
    const shortHash = tx.hash.substring(0, 10) + '...' + tx.hash.substring(tx.hash.length - 8);
    status.innerHTML = `
      <div class="text-center mt-3">
        <small class="text-success">
          … <a href="${explorerUrl}${tx.hash}" target="_blank" class="text-success text-decoration-none" style="font-size:0.8em">${shortHash}</a>
        </small>
      </div>
    `;

  } catch (error) {
    status.innerHTML = `
      <div class="text-center mt-3">
        <small class="text-danger" style="font-size:0.8em">âŒ ${error.message}</small>
      </div>
    `;
  }
};

// PREVINE ERROS DE OUTRAS BIBLIOTECAS - VERSáƒO ULTRA-ROBUSTA
xcafe.preventErrors = function() {
  // CAPTURA E SILENCIA TODOS OS ERROS CONHECIDOS
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  // Lista de termos que devem ser silenciados
  const silenceTerms = [
    'JQMIGRATE', 'jQuery Migrate', 'jquery-migrate',
    'preloaded-elements-handlers', 'webpack', 'webpackJsonpCallback',
    'Class extends value undefined', '__webpack_require__',
    'TypeError: Class extends', 'webpackJsonp', 'elementor'
  ];
  
  function shouldSilence(message) {
    return silenceTerms.some(term => message.toLowerCase().includes(term.toLowerCase()));
  }
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (!shouldSilence(message)) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (!shouldSilence(message)) {
      originalWarn.apply(console, args);
    }
  };

  console.log = function(...args) {
    const message = args.join(' ');
    if (!shouldSilence(message)) {
      originalLog.apply(console, args);
    }
  };

  // Captura erros globais de JavaScript
  window.addEventListener('error', function(e) {
    if (e.filename && silenceTerms.some(term => e.filename.includes(term))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    if (e.message && shouldSilence(e.message)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // Captura promises rejeitadas
  window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && shouldSilence(e.reason.toString())) {
      e.preventDefault();
    }
  });

  // Sobrescreve má©todos que podem causar conflito
  if (window.webpackJsonp && typeof window.webpackJsonp === 'function') {
    const original = window.webpackJsonp;
    window.webpackJsonp = function(...args) {
      try {
        return original.apply(this, args);
      } catch (e) {
        // Silencia erros do webpack
        return null;
      }
    };
  }
};

// AUTO-INICIALIZAá‡áƒO COM PREVENá‡áƒO IMEDIATA
(function() {
  // Executa imediatamente a prevená§á£o de erros
  xcafe.preventErrors();
  
  // Adiciona um listener adicional para quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Re-aplica a prevená§á£o apá³s o DOM carregar
      setTimeout(xcafe.preventErrors, 100);
    });
  } else {
    // Re-aplica apá³s um pequeno delay se o DOM já¡ estiver carregado
    setTimeout(xcafe.preventErrors, 100);
  }
})();




