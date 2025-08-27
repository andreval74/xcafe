// ConfigurAção global do widget
let widgetConfig = {
  contract: '',
  network: 97,
  title: 'Widget de Token',
  logo: '',
  price: null,
  initialQuantity: '',
  minQuantity: null,
  maxQuantity: null,
  theme: 'dark'
};

// InicializAção da página
document.addEventListener('DOMContentLoaded', function() {
  console.log('Página carregada - aguardando ConfigurAção manual...');
});

// FUNÇÕES DO WIDGET
async function createPreviewWidget(config, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container não encontrado:', containerId);
    return;
  }
  
  const logoHtml = config.logo ? `<img src="${config.logo}" height="32" class="me-2" onerror="this.style.display='none'">` : '';
  const networkName = getNetworkName(config.network);
  
  // Mostrar loading inicial
  container.innerHTML = `
    <div class="card bg-dark text-light border-secondary" style="max-width:400px;">
      <div class="card-header text-center text-white" style="background:linear-gradient(135deg,#f85d23,#f59e0b)">
        ${logoHtml}
        <span class="fw-bold">${config.title}</span>
        <div><small class="opacity-75">${networkName}</small></div>
      </div>
      <div class="card-body text-center">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">Buscando dados do contrato...</span>
        </div>
        <div class="mt-2"><small class="text-muted">Conectando com ${networkName}...</small></div>
      </div>
    </div>
  `;
  
  // Buscar dados reais do contrato
  try {
    const contractData = await fetchContractData(config.contract, config.network);
    
    // Usar preço do configurador se definido, senão usar o do contrato
    const finalPrice = config.price || contractData.price;
    const priceDisplay = `${finalPrice} BNB`;
    
    // Valores de quantidade do configurador
    const minQuantity = config.minQuantity || contractData.minPurchase || 1;
    const maxQuantity = config.maxQuantity || contractData.maxPurchase || null;
    const initialQuantity = config.initialQuantity || minQuantity || '1';
    
    // função para calcular total
    const calculateTotal = (quantity, price) => {
      if (!quantity || isNaN(quantity)) return '0.000000';
      return (quantity * parseFloat(price)).toFixed(6);
    };
    
    container.innerHTML = `
      <div class="card bg-dark text-light border-secondary" style="max-width:400px;">
        <div class="card-header text-center text-white" style="background:linear-gradient(135deg,#f85d23,#f59e0b)">
          ${logoHtml}
          <span class="fw-bold">${config.title}</span>
          <div><small class="opacity-75">${networkName}</small></div>
        </div>
        <div class="card-body">
          <div class="row g-2 mb-3">
            <div class="col-6">
              <div class="text-center p-2 rounded bg-secondary">
                <small class="text-muted">Preço/Token</small>
                <div class="fw-bold">${priceDisplay}</div>
              </div>
            </div>
            <div class="col-6">
              <div class="text-center p-2 rounded bg-secondary">
                <small class="text-muted">Disponível</small>
                <div class="fw-bold">${contractData.totalSupply} ${contractData.symbol}</div>
              </div>
            </div>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label small">Quantidade</label>
              <input type="number" 
                     id="widget-quantity" 
                     class="form-control bg-dark text-light border-secondary" 
                     value="${initialQuantity}" 
                     min="${minQuantity}"
                     ${maxQuantity ? `max="${maxQuantity}"` : ''}
                     placeholder="Digite aqui"
                     oninput="updateTotal(this, ${finalPrice})">
            </div>
            <div class="col-6">
              <label class="form-label small">Total BNB</label>
              <input type="text" 
                     id="widget-total" 
                     class="form-control bg-dark text-light border-secondary" 
                     value="${calculateTotal(initialQuantity, finalPrice)}" 
                     readonly>
            </div>
          </div>
          <button class="btn btn-primary w-100" onclick="handlePurchase('${contractData.symbol}', '${contractData.contractAddress}')">⚡ Comprar ${contractData.symbol}</button>
        </div>
      </div>
    `;
    
    // Adicionar script para calculadora
    if (!window.updateTotal) {
      window.updateTotal = function(quantityInput, price) {
        const quantity = parseFloat(quantityInput.value) || 0;
        const total = (quantity * price).toFixed(6);
        const totalInput = document.getElementById('widget-total');
        if (totalInput) {
          totalInput.value = total;
        }
        
        // Validar limites
        const min = parseFloat(quantityInput.min);
        const max = parseFloat(quantityInput.max);
        
        if (min && quantity < min) {
          quantityInput.setCustomValidity('Quantidade mínima: ' + min);
        } else if (max && quantity > max) {
          quantityInput.setCustomValidity('Quantidade máxima: ' + max);
        } else {
          quantityInput.setCustomValidity('');
        }
      };
    }
    
    console.log('Preview widget criado com dados reais:', contractData);
  } catch (error) {
    console.error('Erro ao buscar dados do contrato:', error);
    
    // Mostrar preview com dados Padrão em caso de erro
    const priceDisplay = config.price ? `${config.price} BNB` : '0.000009 BNB';
    const minQuantity = config.minQuantity || 1;
    const initialQuantity = config.initialQuantity || minQuantity;
    
    container.innerHTML = `
      <div class="card bg-dark text-light border-secondary" style="max-width:400px;">
        <div class="card-header text-center text-white" style="background:linear-gradient(135deg,#f85d23,#f59e0b)">
          ${logoHtml}
          <span class="fw-bold">${config.title}</span>
          <div><small class="opacity-75">${networkName}</small></div>
        </div>
        <div class="card-body">
          <div class="alert alert-warning p-2 mb-3">
            <small>⚠️ Não foi possível conectar ao contrato. Usando dados de exemplo.</small>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <div class="text-center p-2 rounded bg-secondary">
                <small class="text-muted">Preço/Token</small>
                <div class="fw-bold">${priceDisplay}</div>
              </div>
            </div>
            <div class="col-6">
              <div class="text-center p-2 rounded bg-secondary">
                <small class="text-muted">Disponível</small>
                <div class="fw-bold">---</div>
              </div>
            </div>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label small">Quantidade</label>
              <input type="number" 
                     id="widget-quantity" 
                     class="form-control bg-dark text-light border-secondary" 
                     value="${initialQuantity}" 
                     placeholder="Digite aqui"
                     oninput="updateTotal(this, ${parseFloat(config.price || '0.000009')})">
            </div>
            <div class="col-6">
              <label class="form-label small">Total BNB</label>
              <input type="text" 
                     id="widget-total" 
                     class="form-control bg-dark text-light border-secondary" 
                     value="0.000000" readonly>
            </div>
          </div>
          <button class="btn btn-secondary w-100" disabled>⚠️ Contrato não encontrado</button>
        </div>
      </div>
    `;
  }
}

// função auxiliar para nome da rede
function getNetworkName(networkId) {
  const networks = {
    97: 'BSC Testnet',
    56: 'BSC Mainnet', 
    1: 'Ethereum Mainnet',
    11155111: 'Ethereum Sepolia',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai'
  };
  return networks[networkId] || `Network ${networkId}`;
}

// função para buscar dados reais do contrato
async function fetchContractData(contractAddress, networkId) {
  try {
    console.log('Buscando dados do contrato:', contractAddress, 'na rede:', networkId);
    
    // URLs dos RPCs para cada rede
    const rpcUrls = {
      97: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      56: 'https://bsc-dataseed.binance.org/',
      1: 'https://eth.llamarpc.com',
      11155111: 'https://ethereum-sepolia.publicnode.com',
      137: 'https://polygon-rpc.com/',
      80001: 'https://rpc-mumbai.maticvigil.com/'
    };
    
    const rpcUrl = rpcUrls[networkId];
    if (!rpcUrl) {
      throw new Error(`RPC URL não configurado para a rede ${networkId}`);
    }
    
    // Conectar ao provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Verificar se é um contrato primeiro
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('Endereço não é um contrato inteligente');
    }
    
    // ABI básica de token ERC20 + funções de compra
    const tokenABI = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function totalSupply() view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function balanceOf(address) view returns (uint256)',
      // Funções comuns de contratos de venda
      'function minPurchase() view returns (uint256)',
      'function maxPurchase() view returns (uint256)',
      'function tokenPrice() view returns (uint256)',
      'function rate() view returns (uint256)',
      'function weiRaised() view returns (uint256)'
    ];
    
    const contract = new ethers.Contract(contractAddress, tokenABI, provider);
    
    // Buscar dados básicos do token com timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: OperAção demorou mais de 10 segundos')), 10000)
    );
    
    const dataPromise = Promise.all([
      contract.name(),
      contract.symbol(),
      contract.totalSupply(),
      contract.decimals()
    ]);
    
    const [name, symbol, totalSupply, decimals] = await Promise.race([dataPromise, timeoutPromise]);
    
    // Validar dados básicos
    if (!name || !symbol) {
      throw new Error('Contrato não retorna nome ou símbolo válidos');
    }
    
    // Tentar buscar dados de compra (pode falhar se não for contrato de venda)
    let minPurchase = null;
    let maxPurchase = null;
    let contractPrice = null;
    
    try {
      // Tentar diferentes nomes de função para preço
      try {
        contractPrice = await contract.tokenPrice();
        contractPrice = ethers.utils.formatEther(contractPrice);
      } catch {
        try {
          const rate = await contract.rate();
          contractPrice = ethers.utils.formatEther(rate);
        } catch {
          // Usar preço Padrão se não encontrar
          contractPrice = '0.000009';
        }
      }
      
      // Tentar buscar limites de compra
      try {
        minPurchase = await contract.minPurchase();
        minPurchase = ethers.utils.formatUnits(minPurchase, decimals);
      } catch {
        minPurchase = '1'; // Padrão: 1 token mínimo
      }
      
      try {
        maxPurchase = await contract.maxPurchase();
        maxPurchase = ethers.utils.formatUnits(maxPurchase, decimals);
      } catch {
        maxPurchase = null; // Sem limite máximo
      }
      
    } catch (error) {
      console.log('Dados de compra não encontrados, usando padrões');
      contractPrice = '0.000009';
      minPurchase = '1';
      maxPurchase = null;
    }
    
    // Formatear totalSupply
    const formattedSupply = ethers.utils.formatUnits(totalSupply, decimals);
    const displaySupply = parseFloat(formattedSupply).toLocaleString('pt-BR', {maximumFractionDigits: 0});
    
    return {
      name: name.trim(),
      symbol: symbol.trim(),
      totalSupply: displaySupply,
      decimals: decimals,
      price: contractPrice,
      minPurchase: minPurchase,
      maxPurchase: maxPurchase,
      contractAddress: contractAddress,
      networkId: networkId
    };
    
  } catch (error) {
    console.error('Erro no fetchContractData:', error);
    throw error;
  }
}

// função para buscar e preencher informações do contrato
async function fetchAndFillContractInfo() {
  const contractAddress = document.getElementById('config-contract').value.trim();
  const networkId = parseInt(document.getElementById('config-network').value);
  const btn = document.querySelector('button[onclick="fetchAndFillContractInfo()"]');
  
  if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
    alert('Por favor, insira um endereço de contrato válido (deve começar com 0x e ter 42 caracteres)');
    return;
  }
  
  // Feedback visual no Botão
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Buscando...';
  btn.disabled = true;
  
  try {
    console.log('Buscando informações do contrato:', contractAddress);

    // Buscar dados do contrato
    const contractData = await fetchContractData(contractAddress, networkId);
    
    // Atualizar título automaticamente se estiver vazio
    const titleField = document.getElementById('config-title');
    if (titleField && !titleField.value.trim()) {
      titleField.value = `Comprar ${contractData.name} (${contractData.symbol})`;
    }

    // Preencher campos de ConfigurAção com valores do contrato
    const configMinEl = document.getElementById('config-min-quantity');
    const configMaxEl = document.getElementById('config-max-quantity');

    if (configMinEl && !configMinEl.value) {
      configMinEl.value = contractData.minPurchase;
      configMinEl.setAttribute('data-contract-min', contractData.minPurchase);
    }
    if (configMaxEl && contractData.maxPurchase && !configMaxEl.value) {
      configMaxEl.value = contractData.maxPurchase;
      configMaxEl.setAttribute('data-contract-max', contractData.maxPurchase);
    }

    // Preencher preço fixo com valor da pesquisa
    const priceField = document.getElementById('config-price');
    const priceHint = document.getElementById('price-hint');
    
    if (priceField && contractData.price) {
      priceField.value = contractData.price;
      priceField.setAttribute('data-min-price', contractData.price);
      
      // Atualizar hint
      if (priceHint) {
        priceHint.innerHTML = `<i class="bi bi-info-circle me-1"></i>Preço mínimo: ${contractData.price} BNB`;
      }
      
      // Adicionar validAção em tempo real
      priceField.oninput = function() {
        const currentValue = parseFloat(this.value);
        const minPrice = parseFloat(this.getAttribute('data-min-price'));
        const feedback = this.parentElement.querySelector('.invalid-feedback');
        
        if (currentValue && currentValue < minPrice) {
          this.setCustomValidity(`O preço não pode ser menor que ${minPrice} BNB`);
          this.classList.add('is-invalid');
          if (feedback) {
            feedback.textContent = `Preço mínimo permitido: ${minPrice} BNB`;
          }
        } else {
          this.setCustomValidity('');
          this.classList.remove('is-invalid');
          if (feedback) {
            feedback.textContent = '';
          }
        }
      };
    }

    // Feedback de sucesso
    btn.innerHTML = '<i class="bi bi-check me-1"></i>Encontrado!';
    btn.classList.remove('btn-outline-info');
    btn.classList.add('btn-success');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('btn-success');
      btn.classList.add('btn-outline-info');
      btn.disabled = false;
    }, 2000);
    
    // Atualizar preview automaticamente
    await updateWidget();
    
  } catch (error) {
    console.error('Erro ao buscar informações do contrato:', error);
    
    // Mostrar seção de erro ao invés de esconder
    const networkName = getNetworkName(networkId);
    
    let errorMessage = 'Erro desconhecido';
    if (error.message.includes('call revert exception')) {
      errorMessage = `O contrato não existe na rede ${networkName} ou não é um token ERC20 válido`;
    } else if (error.message.includes('network')) {
      errorMessage = `Erro de Conexão com a rede ${networkName}`;
    } else if (error.message.includes('elementos do formulário')) {
      errorMessage = 'Erro interno da página. Recarregue a página.';
    } else {
      errorMessage = error.message;
    }

    // Mostrar erro no preview ao invés de seção inexistente
    const previewContainer = document.getElementById('widget-preview');
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="alert alert-danger text-center m-3">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <div>
            <strong>Erro ao buscar contrato</strong><br>
            <small>${errorMessage}</small>
            <div class="mt-2">
              <small class="opacity-75">
                Verifique se:
                • O endereço está correto<br>
                • O contrato existe na rede ${networkName}<br>
                • O contrato implementa o Padrão ERC20
              </small>
            </div>
          </div>
        </div>
      `;
    }

    // Feedback de erro no Botão
    btn.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Não encontrado';
    btn.classList.remove('btn-outline-info');
    btn.classList.add('btn-danger');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-outline-info');
      btn.disabled = false;
    }, 3000);
  }
}

// função chamada quando a rede é alterada
async function onNetworkChange() {
  const networkSelect = document.getElementById('config-network');
  const networkName = networkSelect.options[networkSelect.selectedIndex].text;
  
  console.log('Rede alterada para:', networkName);
  
  // Mostrar mensagem informativa
  const previewContainer = document.getElementById('widget-preview');
  previewContainer.innerHTML = `
    <div class="alert alert-info">
      <i class="bi bi-info-circle me-2"></i>
      Rede alterada para <strong>${networkName}</strong><br>
      <small>Digite um endereço de contrato e clique em "Buscar" para continuar</small>
    </div>
  `;
}

// FUNÇÕES DE ConfigurAção
async function updateWidget() {
  try {
    const contractAddress = document.getElementById('config-contract').value.trim();
    
    // Se não tem contrato, mostrar mensagem
    if (!contractAddress) {
      const previewContainer = document.getElementById('widget-preview');
      previewContainer.innerHTML = `
        <div class="alert alert-warning text-center">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <div>
            <strong>Nenhum contrato configurado</strong><br>
            <small>Digite um endereço de contrato e clique em "Buscar"</small>
          </div>
        </div>
      `;
      return;
    }
    
    widgetConfig.contract = contractAddress;
    widgetConfig.network = parseInt(document.getElementById('config-network').value);
    widgetConfig.title = document.getElementById('config-title').value || 'Widget de Token';
    widgetConfig.logo = document.getElementById('config-logo').value;
    
    // Capturar preço do campo, com validAção
    const priceField = document.getElementById('config-price');
    const priceValue = priceField ? priceField.value.trim() : '';
    widgetConfig.price = priceValue || null;
    
    // Capturar configurações de quantidade
    widgetConfig.initialQuantity = document.getElementById('config-initial-quantity').value || '';
    widgetConfig.minQuantity = document.getElementById('config-min-quantity').value || null;
    widgetConfig.maxQuantity = document.getElementById('config-max-quantity').value || null;
    
    widgetConfig.theme = 'dark'; // Sempre tema escuro

    console.log('Atualizando widget com config:', widgetConfig);
    
  // Feedback visual ao usuário
  const previewContainer = document.getElementById('widget-preview');
  previewContainer.innerHTML = '<div class="spinner-border text-warning" role="status"><span class="visually-hidden">Carregando...</span></div>';
    
  // Gerar o código embed e usar para preview
  generateSimpleCode();
  // Limpar preview
  previewContainer.innerHTML = '<div id="wg-widget-preview"></div>';
    // Cria o widget real no preview, mas com Botão de compra real visível
    const configPreview = {...widgetConfig, containerId: 'wg-widget-preview'};
    window.createxcafeWidget && createxcafeWidget(configPreview);
    // Adiciona Botão de compra real só no preview
    setTimeout(() => {
      const previewDiv = document.getElementById('wg-widget-preview');
      if (previewDiv) {
        const realBtn = document.createElement('button');
        realBtn.className = 'btn btn-danger w-100 mt-3';
        realBtn.innerHTML = '⚡ Comprar REAL (Teste)';
        realBtn.onclick = function() {
          // Força a compra real usando o widget
          const buyBtn = previewDiv.querySelector('button');
          if (buyBtn) buyBtn.click();
        };
        previewDiv.appendChild(realBtn);
      }
    }, 800);
    
    // Feedback de sucesso
    const btn = document.querySelector('button[onclick="updateWidget()"]');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check me-1"></i>Preview Atualizado!';
      btn.classList.remove('btn-warning');
      btn.classList.add('btn-success');
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-warning');
      }, 2000);
    }
    
  } catch (error) {
    console.error('Erro ao atualizar widget:', error);
    const previewContainer = document.getElementById('widget-preview');
    previewContainer.innerHTML = `
      <div class="alert alert-danger text-center">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <div>
          <strong>Erro ao carregar preview</strong><br>
          <small>${error.message}</small>
        </div>
      </div>
    `;
  }
}

function clearAllData() {
  // Limpar todos os campos de entrada
  document.getElementById('config-contract').value = '';
  document.getElementById('config-title').value = '';
  document.getElementById('config-logo').value = '';
  document.getElementById('config-price').value = '';
  document.getElementById('config-initial-quantity').value = '';
  document.getElementById('config-min-quantity').value = '';
  document.getElementById('config-max-quantity').value = '';
  
  // Resetar rede para BSC Testnet
  document.getElementById('config-network').value = '97';
  
  // Resetar preview
  const previewContainer = document.getElementById('widget-preview');
  previewContainer.innerHTML = `
    <div class="alert alert-info text-center m-3">
      <i class="bi bi-info-circle me-2"></i>
      <div>
        <strong>Preview do Widget</strong><br>
        <small>Configure um contrato acima para ver o preview aqui</small>
      </div>
    </div>
  `;
  
  // Resetar hint do preço
  const priceHint = document.getElementById('price-hint');
  if (priceHint) {
    priceHint.innerHTML = 'Será preenchido automaticamente após buscar o contrato';
  }
  
  // Feedback visual
  const btn = document.querySelector('button[onclick="clearAllData()"]');
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check me-1"></i>Limpo!';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-success');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('btn-success');
      btn.classList.add('btn-danger');
    }, 1500);
  }
}

function generateSimpleCode() {
  // CÓDIGO ULTRA-MINIMALISTA - APENAS 8 LINHAS!
  var code = '<!-- xcafe Widget Ultra-Compacto -->\n';
  code += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n';
  code += '<link href="https://cdn.jsdelivr.net/gh/andreval74/xcafe@main/styles/globals.css" rel="stylesheet">\n';
  code += '<div id="wg-widget"></div>\n';
  code += '<script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"><\/script>\n';
  code += '<script src="https://cdn.jsdelivr.net/gh/andreval74/xcafe@main/js/wg-widget.js"><\/script>\n';
  code += '<script>\n';
  code += `createxcafeWidget({\n`;
  code += `  containerId: 'wg-widget',\n`;
  code += `  contract: ${JSON.stringify(widgetConfig.contract)},\n`;
  code += `  network: ${JSON.stringify(widgetConfig.network)},\n`;
  code += `  title: ${JSON.stringify(widgetConfig.title)},\n`;
  code += `  logo: ${JSON.stringify(widgetConfig.logo)},\n`;
  code += `  price: ${JSON.stringify(widgetConfig.price)},\n`;
  code += `  initialQuantity: ${JSON.stringify(widgetConfig.initialQuantity)},\n`;
  code += `  minQuantity: ${JSON.stringify(widgetConfig.minQuantity)},\n`;
  code += `  maxQuantity: ${JSON.stringify(widgetConfig.maxQuantity)},\n`;
  code += `  theme: ${JSON.stringify(widgetConfig.theme)}\n`;
  code += `});\n`;
  code += '<\/script>';

  // Mostrar no textarea
  const textarea = document.getElementById('embed-code');
  textarea.value = code;
  
  // Feedback visual no Botão
  const btn = document.querySelector('button[onclick="generateSimpleCode()"]');
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check me-1"></i>Gerado!';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-primary');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-success');
    }, 2000);
  }
}

function copyEmbedCode() {
  const textarea = document.getElementById('embed-code');
  textarea.select();
  document.execCommand('copy');
  
  // Feedback visual
  const btn = document.querySelector('button[onclick="copyEmbedCode()"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-check me-1"></i>Copiado!';
  btn.classList.remove('btn-outline-light');
  btn.classList.add('btn-success');
  
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.classList.remove('btn-success');
    btn.classList.add('btn-outline-light');
  }, 2000);
}

// função para lidar com a compra no preview
function handlePurchase(symbol, contractAddress) {
  const quantity = document.getElementById('widget-quantity')?.value || '0';
  const total = document.getElementById('widget-total')?.value || '0';
  
  alert(`🎯 PREVIEW - Comprar ${symbol}\n\n` +
        `Quantidade: ${quantity} tokens\n` +
        `Total: ${total} BNB\n` +
        `Contrato: ${contractAddress}\n\n` +
        `💡 Este é apenas o preview. No widget real, esta Ação conectaria com MetaMask para realizar a compra.`);
}

