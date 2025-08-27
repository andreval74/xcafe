/**
 * xcafe Token Creator - Simplified Version
 * Sistema simplificado de criação de tokens baseado nas melhores práticas do mercado
 */

// Estado global
let walletConnected = false;
let walletAddress = '';
let selectedPlan = 'basic';
let networkData = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 xcafe Token Creator (Simplified) iniciado');
    
    initializeApp();
    setupEventListeners();
    checkWalletConnection();
});

/**
 * Inicializa a aplicação
 */
function initializeApp() {
    // Define plano padrão
    updatePlanSelection('basic');
    
    // Esconde seções que dependem da carteira
    hideSection('token-form');
    hideSection('deploy-section');
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Conectar carteira
    const connectBtn = document.getElementById('connect-wallet-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    // Seleção de planos
    const planInputs = document.querySelectorAll('input[name="planType"]');
    planInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            updatePlanSelection(e.target.value);
        });
    });
    
    // Deploy button
    const deployBtn = document.getElementById('deploy-btn');
    if (deployBtn) {
        deployBtn.addEventListener('click', deployToken);
    }
    
    // Auto-uppercase symbol
    const symbolInput = document.getElementById('token-symbol');
    if (symbolInput) {
        symbolInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
    
    // Validação de sufixo personalizado
    const customSuffix = document.getElementById('custom-suffix');
    if (customSuffix) {
        customSuffix.addEventListener('input', validateCustomSuffix);
        customSuffix.addEventListener('change', calculatePredictedAddress);
    }
    
    // Auto-validação dos campos
    const requiredFields = ['token-name', 'token-symbol', 'token-supply'];
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', validateAndUpdateSummary);
            field.addEventListener('input', debounce(validateAndUpdateSummary, 500));
        }
    });
    
    // Cliques nos cards de preço
    document.getElementById('basic-plan')?.addEventListener('click', () => {
        document.getElementById('plan-basic').click();
    });
    
    document.getElementById('premium-plan')?.addEventListener('click', () => {
        document.getElementById('plan-premium').click();
    });
}

/**
 * Conecta com a MetaMask
 */
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showAlert('MetaMask não detectado! Por favor, instale a MetaMask.', 'error');
            return;
        }
        
        console.log('🔗 Conectando com MetaMask...');
        
        // Altera estado do botão
        const connectBtn = document.getElementById('connect-wallet-btn');
        connectBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>CONECTANDO...';
        connectBtn.disabled = true;
        
        // Solicita conexão
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            walletAddress = accounts[0];
            walletConnected = true;
            
            // Atualiza UI
            updateWalletUI();
            
            // Detecta rede
            await detectNetwork();
            
            // Mostra formulário do token
            showSection('token-form');
            
            console.log('✅ Wallet conectada:', walletAddress);
            
            // Scroll suave para o formulário
            document.getElementById('token-form').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao conectar wallet:', error);
        showAlert('Erro ao conectar com a MetaMask: ' + error.message, 'error');
        
        // Restaura botão
        const connectBtn = document.getElementById('connect-wallet-btn');
        connectBtn.innerHTML = '<i class="bi bi-wallet2 me-2"></i>CONECTAR';
        connectBtn.disabled = false;
    }
}

/**
 * Verifica conexão existente da carteira
 */
async function checkWalletConnection() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });
            
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                walletConnected = true;
                updateWalletUI();
                await detectNetwork();
                showSection('token-form');
            }
        }
    } catch (error) {
        console.error('Erro ao verificar conexão:', error);
    }
}

/**
 * Detecta a rede atual
 */
async function detectNetwork() {
    try {
        const chainId = await window.ethereum.request({ 
            method: 'eth_chainId' 
        });
        
        networkData = {
            chainId: chainId,
            name: getNetworkName(chainId),
            isSupported: chainId === '0x38' // BSC Mainnet
        };
        
        console.log('🌐 Rede detectada:', networkData);
        
        if (!networkData.isSupported) {
            showAlert('Por favor, conecte-se à rede BSC (Binance Smart Chain) para continuar.', 'warning');
        }
        
    } catch (error) {
        console.error('Erro ao detectar rede:', error);
    }
}

/**
 * Atualiza a UI da carteira
 */
function updateWalletUI() {
    const walletDisplay = document.getElementById('wallet-display');
    const connectBtn = document.getElementById('connect-wallet-btn');
    
    if (walletConnected && walletAddress) {
        const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        walletDisplay.value = `✅ Conectado: ${shortAddress}`;
        walletDisplay.classList.add('text-success');
        
        connectBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>CONECTADO';
        connectBtn.classList.remove('btn-warning');
        connectBtn.classList.add('btn-success');
        connectBtn.disabled = true;
    }
}

/**
 * Atualiza seleção do plano
 */
function updatePlanSelection(plan) {
    selectedPlan = plan;
    
    // Remove seleção anterior
    document.querySelectorAll('.price-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Adiciona seleção atual
    const selectedCard = plan === 'basic' ? 
        document.getElementById('basic-plan') : 
        document.getElementById('premium-plan');
    
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Mostra/esconde opções premium
    const premiumOptions = document.getElementById('premium-options');
    if (premiumOptions) {
        premiumOptions.style.display = plan === 'premium' ? 'block' : 'none';
    }
    
    console.log('📋 Plano selecionado:', plan);
}

/**
 * Valida sufixo personalizado
 */
function validateCustomSuffix(e) {
    const value = e.target.value.toLowerCase();
    const isValid = /^[0-9a-f]*$/.test(value);
    
    if (!isValid && value.length > 0) {
        e.target.classList.add('is-invalid');
        showAlert('Sufixo deve conter apenas caracteres hexadecimais (0-9, a-f)', 'error');
    } else {
        e.target.classList.remove('is-invalid');
        e.target.value = value;
    }
}

/**
 * Calcula endereço previsto (simulação)
 */
function calculatePredictedAddress() {
    const suffix = document.getElementById('custom-suffix').value;
    const predictedField = document.getElementById('predicted-address');
    
    if (suffix && suffix.length === 4 && walletAddress) {
        // Simulação de endereço - em produção seria calculado via CREATE2
        const mockAddress = `0x${Math.random().toString(16).slice(2, 38)}${suffix}`;
        predictedField.value = mockAddress;
    } else {
        predictedField.value = '';
    }
}

/**
 * Valida formulário e atualiza resumo
 */
function validateAndUpdateSummary() {
    const tokenName = document.getElementById('token-name').value.trim();
    const tokenSymbol = document.getElementById('token-symbol').value.trim();
    const tokenSupply = document.getElementById('token-supply').value.trim();
    
    // Validação básica
    let isValid = true;
    
    if (!tokenName) isValid = false;
    if (!tokenSymbol) isValid = false;
    if (!tokenSupply || isNaN(tokenSupply) || parseFloat(tokenSupply) <= 0) isValid = false;
    if (!walletConnected) isValid = false;
    
    // Se válido, mostra seção de deploy e atualiza resumo
    if (isValid) {
        showSection('deploy-section');
        updateTokenSummary();
        
        // Scroll suave para o deploy
        setTimeout(() => {
            document.getElementById('deploy-section').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 300);
    } else {
        hideSection('deploy-section');
    }
}

/**
 * Atualiza resumo do token
 */
function updateTokenSummary() {
    const summaryContainer = document.getElementById('token-summary');
    const tokenName = document.getElementById('token-name').value.trim();
    const tokenSymbol = document.getElementById('token-symbol').value.trim();
    const tokenSupply = document.getElementById('token-supply').value.trim();
    const decimals = document.getElementById('token-decimals').value;
    
    const planPrice = selectedPlan === 'basic' ? '0.01 BNB' : '0.02 BNB';
    const planType = selectedPlan === 'basic' ? 'Básico' : 'Premium';
    
    summaryContainer.innerHTML = `
        <div class="col-md-6">
            <div class="summary-item">
                <strong>Nome:</strong> ${tokenName}
            </div>
        </div>
        <div class="col-md-6">
            <div class="summary-item">
                <strong>Símbolo:</strong> ${tokenSymbol}
            </div>
        </div>
        <div class="col-md-6">
            <div class="summary-item">
                <strong>Supply:</strong> ${formatNumber(tokenSupply)}
            </div>
        </div>
        <div class="col-md-6">
            <div class="summary-item">
                <strong>Decimais:</strong> ${decimals}
            </div>
        </div>
        <div class="col-md-6">
            <div class="summary-item">
                <strong>Plano:</strong> ${planType}
            </div>
        </div>
        <div class="col-md-6">
            <div class="summary-item">
                <strong>Preço:</strong> ${planPrice}
            </div>
        </div>
    `;
}

/**
 * Deploy do token
 */
async function deployToken() {
    try {
        if (!walletConnected) {
            showAlert('Por favor, conecte sua carteira primeiro.', 'error');
            return;
        }
        
        if (!networkData.isSupported) {
            showAlert('Por favor, conecte-se à rede BSC (Binance Smart Chain).', 'error');
            return;
        }
        
        // Valida dados
        if (!validateTokenData()) {
            return;
        }
        
        const deployBtn = document.getElementById('deploy-btn');
        deployBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>CRIANDO...';
        deployBtn.disabled = true;
        
        console.log('🚀 Iniciando deploy do token...');
        
        // Simula processo de deploy
        await simulateTokenDeploy();
        
        // Mostra modal de sucesso
        showSuccessModal();
        
    } catch (error) {
        console.error('❌ Erro no deploy:', error);
        showAlert('Erro ao criar token: ' + error.message, 'error');
        
        // Restaura botão
        const deployBtn = document.getElementById('deploy-btn');
        deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>CRIAR MEU TOKEN';
        deployBtn.disabled = false;
    }
}

/**
 * Valida dados do token
 */
function validateTokenData() {
    const tokenName = document.getElementById('token-name').value.trim();
    const tokenSymbol = document.getElementById('token-symbol').value.trim();
    const tokenSupply = document.getElementById('token-supply').value.trim();
    
    if (!tokenName) {
        showAlert('Por favor, preencha o nome do token.', 'error');
        return false;
    }
    
    if (!tokenSymbol || tokenSymbol.length < 2) {
        showAlert('Por favor, preencha um símbolo válido (mínimo 2 caracteres).', 'error');
        return false;
    }
    
    if (!tokenSupply || isNaN(tokenSupply) || parseFloat(tokenSupply) <= 0) {
        showAlert('Por favor, preencha um supply válido.', 'error');
        return false;
    }
    
    if (selectedPlan === 'premium') {
        const customSuffix = document.getElementById('custom-suffix').value.trim();
        if (customSuffix && customSuffix.length !== 4) {
            showAlert('Sufixo personalizado deve ter exatamente 4 caracteres.', 'error');
            return false;
        }
    }
    
    return true;
}

/**
 * Simula processo de deploy (para demonstração)
 */
async function simulateTokenDeploy() {
    // Em produção, aqui seria feita a interação real com a blockchain
    
    // Simula tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Token criado com sucesso (simulação)');
    
    return {
        hash: '0x' + Math.random().toString(16).slice(2),
        address: '0x' + Math.random().toString(16).slice(2, 42),
        gasUsed: '150000',
        gasPrice: '5'
    };
}

/**
 * Mostra modal de sucesso
 */
function showSuccessModal() {
    const tokenName = document.getElementById('token-name').value.trim();
    const tokenSymbol = document.getElementById('token-symbol').value.trim();
    const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
    const mockTxHash = '0x' + Math.random().toString(16).slice(2);
    
    const successDetails = document.getElementById('success-details');
    successDetails.innerHTML = `
        <div class="alert alert-success">
            <h6 class="text-success mb-3">🎉 Token "${tokenName} (${tokenSymbol})" criado com sucesso!</h6>
            
            <div class="row g-2 mb-3">
                <div class="col-12">
                    <strong>Endereço do Token:</strong>
                    <div class="font-monospace small bg-light text-dark p-2 rounded mt-1">
                        ${mockAddress}
                    </div>
                </div>
                <div class="col-12">
                    <strong>Hash da Transação:</strong>
                    <div class="font-monospace small bg-light text-dark p-2 rounded mt-1">
                        ${mockTxHash}
                    </div>
                </div>
            </div>
            
            <div class="d-flex gap-2 flex-wrap">
                <a href="https://bscscan.com/address/${mockAddress}" target="_blank" 
                   class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-box-arrow-up-right me-1"></i>Ver no BSCScan
                </a>
                <button class="btn btn-outline-success btn-sm" onclick="copyToClipboard('${mockAddress}')">
                    <i class="bi bi-clipboard me-1"></i>Copiar Endereço
                </button>
            </div>
        </div>
        
        <div class="alert alert-info">
            <strong>Próximos passos:</strong>
            <ul class="mb-0 mt-2">
                <li>Adicione o token à sua MetaMask</li>
                <li>Crie liquidez em uma exchange descentralizada</li>
                <li>Promova seu token na comunidade</li>
            </ul>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    modal.show();
}

/**
 * Função para criar outro token
 */
function createAnother() {
    // Fecha modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('successModal'));
    modal.hide();
    
    // Reset do formulário
    document.getElementById('token-name').value = '';
    document.getElementById('token-symbol').value = '';
    document.getElementById('token-supply').value = '';
    document.getElementById('custom-suffix').value = '';
    document.getElementById('predicted-address').value = '';
    
    // Esconde seções
    hideSection('deploy-section');
    
    // Reset do botão de deploy
    const deployBtn = document.getElementById('deploy-btn');
    deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>CRIAR MEU TOKEN';
    deployBtn.disabled = false;
    
    // Scroll para o topo do formulário
    document.getElementById('token-form').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Funções utilitárias

/**
 * Mostra uma seção
 */
function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        section.classList.add('fade-in');
    }
}

/**
 * Esconde uma seção
 */
function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
        section.classList.remove('fade-in');
    }
}

/**
 * Mostra alerta
 */
function showAlert(message, type = 'info') {
    // Cria toast do Bootstrap
    const toastContainer = getOrCreateToastContainer();
    
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-white bg-${getBootstrapAlertClass(type)} border-0`;
    toastElement.setAttribute('role', 'alert');
    
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-${getAlertIcon(type)} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastElement);
    
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    
    // Remove elemento após esconder
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Obtém ou cria container de toasts
 */
function getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Obtém classe de alerta do Bootstrap
 */
function getBootstrapAlertClass(type) {
    const map = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return map[type] || 'info';
}

/**
 * Obtém ícone do alerta
 */
function getAlertIcon(type) {
    const map = {
        'success': 'check-circle-fill',
        'error': 'exclamation-triangle-fill',
        'warning': 'exclamation-triangle-fill',
        'info': 'info-circle-fill'
    };
    return map[type] || 'info-circle-fill';
}

/**
 * Obtém nome da rede
 */
function getNetworkName(chainId) {
    const networks = {
        '0x38': 'BSC Mainnet',
        '0x61': 'BSC Testnet',
        '0x1': 'Ethereum',
        '0x89': 'Polygon'
    };
    return networks[chainId] || 'Rede desconhecida';
}

/**
 * Formata números
 */
function formatNumber(num) {
    return parseFloat(num).toLocaleString('pt-BR');
}

/**
 * Copia texto para clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Endereço copiado para a área de transferência!', 'success');
    }).catch(() => {
        showAlert('Erro ao copiar endereço.', 'error');
    });
}

/**
 * Debounce para evitar muitas chamadas
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exporta funções globais
window.createAnother = createAnother;
window.copyToClipboard = copyToClipboard;
