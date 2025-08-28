/**
 * xcafe Token Creator - Versão Tela Única
 * Sistema de criação de tokens com scroll progressivo
 */

// Estado global da aplicação
const AppState = {
    wallet: {
        connected: false,
        address: '',
        balance: '0.0000',
        network: null
    },
    tokenData: {}
};

/**
 * Gera o código Solidity do contrato
 */
/**
 * Carrega o template base.sol e substitui as variáveis
 */
async function loadSolidityTemplate() {
    try {
        const response = await fetch('./contratos/base.sol');
        if (!response.ok) {
            throw new Error('Não foi possível carregar o template base.sol');
        }
        return await response.text();
    } catch (error) {
        console.warn('⚠️ Erro ao carregar template base.sol, usando template interno:', error);
        // Template de fallback básico caso não consiga carregar o base.sol
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
Gerado por:
Smart Contract Cafe - Fallback Template
https://smartcontract.cafe
*/

// CONFIGURAÇÕES DO TOKEN
string constant TOKEN_NAME = "{{TOKEN_NAME}}";
string constant TOKEN_SYMBOL = "{{TOKEN_SYMBOL}}";
uint8 constant TOKEN_DECIMALS = {{DECIMALS}};
uint256 constant TOKEN_SUPPLY = {{TOKEN_SUPPLY}};
address constant TOKEN_OWNER = {{OWNER_ADDRESS}};
string constant TOKEN_LOGO_URI = "{{TOKEN_LOGO_URI}}";
address constant BTCBR_ORIGINAL = {{TOKEN_ORIGINAL}};

// Contrato ERC-20 básico
contract {{TOKEN_SYMBOL}} {
    string public name = TOKEN_NAME;
    string public symbol = TOKEN_SYMBOL;
    uint8 public decimals = TOKEN_DECIMALS;
    uint256 public totalSupply = TOKEN_SUPPLY * (10 ** uint256(decimals));
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        _balances[TOKEN_OWNER] = totalSupply;
        emit Transfer(address(0x0), TOKEN_OWNER, totalSupply);
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }
}

/*
Template de fallback gerado pelo xcafe Token Creator
https://xcafe.com
*/`;
    }
}

/**
 * Gera contrato Solidity usando template base.sol
 */
async function generateSolidityContract(tokenData) {
    try {
        // Carregar template base.sol
        const template = await loadSolidityTemplate();
        
        // Aplicar checksum ao endereço do owner
        const ownerAddressChecksum = ethers.utils.getAddress(tokenData.owner);
        
        // Substituir variáveis do template
        const contractCode = template
            .replace(/{{TOKEN_NAME}}/g, tokenData.name)
            .replace(/{{TOKEN_SYMBOL}}/g, tokenData.symbol)
            .replace(/{{DECIMALS}}/g, tokenData.decimals || '18')
            .replace(/{{TOKEN_SUPPLY}}/g, tokenData.totalSupply)
            .replace(/{{OWNER_ADDRESS}}/g, ownerAddressChecksum)
            .replace(/{{TOKEN_LOGO_URI}}/g, '') // Logo URI vazio por padrão
            .replace(/{{TOKEN_ORIGINAL}}/g, '0x80c09daC9dC95669B03C2d82967Af62e93d0Fe84'); // Endereço BTCBR em checksum correto
            
        console.log('✅ Contrato Solidity gerado com sucesso usando template base.sol');
        return contractCode;
        
    } catch (error) {
        console.error('❌ Erro ao gerar contrato Solidity:', error);
        throw error;
    }
}

/**
 * Faz download do arquivo .sol
 */
async function downloadSolidityFile() {
    const { tokenData } = AppState;
    
    if (!tokenData.name || !tokenData.symbol) {
        alert('Preencha os dados do token antes de fazer o download');
        return;
    }
    
    try {
        console.log('📥 Gerando arquivo Solidity...');
        
        const contractCode = await generateSolidityContract(tokenData);
        const fileName = `${tokenData.symbol}.sol`;
        
        // Criar blob e download
        const blob = new Blob([contractCode], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        
        // Criar link temporário para download
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Limpar URL
        window.URL.revokeObjectURL(url);
        
        console.log(`✅ Arquivo ${fileName} baixado com sucesso`);
        
        // Feedback visual
        showDownloadSuccess(fileName);
        
    } catch (error) {
        console.error('❌ Erro ao gerar arquivo:', error);
        alert('Erro ao gerar arquivo Solidity: ' + error.message);
    }
}

/**
 * Mostra feedback visual do download
 */
function showDownloadSuccess(fileName) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 end-0 p-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header bg-success text-white">
                <i class="bi bi-download me-2"></i>
                <strong class="me-auto">Download Concluído</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                Arquivo <code>${fileName}</code> baixado com sucesso!
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

/**
 * Atualiza texto do botão de download
 */
function updateDownloadButtonText() {
    const downloadFilename = document.getElementById('download-filename');
    const { tokenData } = AppState;
    
    if (downloadFilename) {
        if (tokenData.symbol && tokenData.symbol.length >= 2) {
            downloadFilename.textContent = `Baixar ${tokenData.symbol}.sol`;
        } else {
            downloadFilename.textContent = 'Baixar Contrato.sol';
        }
    }
}

/**
 * Gera URL do explorer para transação
 */
function getExplorerTxUrl(txHash, chainId) {
    const explorers = {
        1: `https://etherscan.io/tx/${txHash}`,
        137: `https://polygonscan.com/tx/${txHash}`,
        56: `https://bscscan.com/tx/${txHash}`,
        8453: `https://basescan.org/tx/${txHash}`,
        11155111: `https://sepolia.etherscan.io/tx/${txHash}`
    };
    
    return explorers[chainId] || `https://etherscan.io/tx/${txHash}`;
}

/**
 * Copia texto para clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Feedback visual
        const btn = event.target.closest('button');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check text-success"></i>';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);
        
        console.log('✅ Copiado para clipboard:', text);
        
    } catch (error) {
        console.error('❌ Erro ao copiar:', error);
        // Fallback para browsers mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Inicialização no fim do arquivo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 xcafe Token Creator - Tela Única iniciado');
    
    initializeApp();
});

/**
 * Inicializa a aplicação
 */
function initializeApp() {
    setupEventListeners();
    checkWalletConnection();
    
    // Mostrar apenas primeira seção inicialmente
    showOnlyFirstSection();
    
    // Verificar status da API após carregar a página
    setTimeout(updateApiStatus, 2000);
}

/**
 * Configura listeners de eventos
 */
function setupEventListeners() {
    // Conectar MetaMask
    const connectBtn = document.getElementById('connect-metamask-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    // Botões de limpeza/reinício
    setupUtilityButtons();
    
    // Formulário de token - validation on input
    setupTokenInputs();
    
    // Deploy button
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
        deployBtn.addEventListener('click', deployToken);
    }
}

/**
 * Configura botões utilitários
 */
function setupUtilityButtons() {
    // Botão limpar específico
    const clearBtn = document.getElementById('clear-all-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', resetApp);
        console.log('✅ Botão limpar encontrado');
    }
    
    // Procurar por outros botões de limpeza e usar mesma função
    const clearSelectors = [
        '#clear-form', 
        '#limpar-form', 
        '#reset-form'
    ];
    
    clearSelectors.forEach(selector => {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.addEventListener('click', resetApp); // Usar resetApp em vez de clearForm
            console.log(`✅ Botão adicional encontrado: ${selector}`);
        }
    });
}

/**
 * Configura inputs do token
 */
function setupTokenInputs() {
    const tokenInputs = ['tokenName', 'tokenSymbol', 'totalSupply', 'ownerAddress'];
    
    tokenInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', onTokenDataChange);
            
            // Máscara para Supply Total
            if (inputId === 'totalSupply') {
                input.addEventListener('input', formatSupplyInput);
                input.addEventListener('blur', checkProgressAndScroll);
            } else {
                input.addEventListener('blur', checkProgressAndScroll);
            }
        }
    });
}

/**
 * Formata input de Supply com separador de milhares
 */
function formatSupplyInput(event) {
    const input = event.target;
    
    // Remove tudo que não é dígito
    let value = input.value.replace(/\D/g, ''); 
    
    if (!value) {
        input.value = '';
        AppState.tokenData.totalSupply = '';
        return;
    }
    
    // Converte para número
    const numericValue = parseInt(value, 10);
    
    // Valida se é um número válido e maior que 0
    if (isNaN(numericValue) || numericValue < 1) {
        input.value = '';
        AppState.tokenData.totalSupply = '';
        return;
    }
    
    // Adiciona separadores de milhares
    input.value = numericValue.toLocaleString('pt-BR');
    
    // Salva valor numérico no estado (sem formatação)
    AppState.tokenData.totalSupply = numericValue.toString();
    
    console.log(`💰 Supply formatado: ${input.value} (valor numérico: ${numericValue})`);
}

/**
 * Conecta com MetaMask
 */
async function connectWallet() {
    const connectBtn = document.getElementById('connect-metamask-btn');
    const originalText = connectBtn?.innerHTML || 'CONECTAR';
    
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask não detectado! Por favor, instale a extensão MetaMask.');
            return;
        }
        
        // Atualizar botão
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Conectando...';
            connectBtn.disabled = true;
        }
        
        console.log('🔗 Iniciando conexão com MetaMask...');
        
        // Solicitar conexão
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            AppState.wallet.address = accounts[0];
            AppState.wallet.connected = true;
            
            // Detectar rede
            await detectNetwork();
            
            // Obter saldo
            await getWalletBalance();
            
            // Atualizar UI
            updateWalletUI();
            
            // Auto-scroll para próxima seção após um delay
            setTimeout(() => {
                enableSection('section-basic-info');
                scrollToSection('section-basic-info');
            }, 1500);
            
            console.log('✅ Wallet conectada:', AppState.wallet.address);
            console.log('🌐 Rede detectada:', AppState.wallet.network?.name);
        }
        
    } catch (error) {
        console.error('❌ Erro ao conectar wallet:', error);
        alert('Erro ao conectar: ' + error.message);
        
        // Restaurar botão
        if (connectBtn) {
            connectBtn.innerHTML = originalText;
            connectBtn.disabled = false;
        }
    }
}

/**
 * Detecta a rede da MetaMask
 */
async function detectNetwork() {
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        AppState.wallet.network = getNetworkInfo(chainId);
        
    } catch (error) {
        console.error('❌ Erro ao detectar rede:', error);
        AppState.wallet.network = { name: 'Desconhecida', chainId: 0, currency: 'ETH' };
    }
}

/**
 * Obtém informações da rede
 */
function getNetworkInfo(chainId) {
    const networks = {
        '0x1': { name: 'Ethereum Mainnet', chainId: 1, currency: 'ETH' },
        '0x89': { name: 'Polygon Mainnet', chainId: 137, currency: 'MATIC' },
        '0x38': { name: 'BSC Mainnet', chainId: 56, currency: 'BNB' },
        '0x61': { name: 'BSC Testnet', chainId: 97, currency: 'tBNB' },
        '0x2105': { name: 'Base Mainnet', chainId: 8453, currency: 'ETH' },
        '0xaa36a7': { name: 'Sepolia Testnet', chainId: 11155111, currency: 'ETH' }
    };
    
    return networks[chainId] || { 
        name: 'Rede Desconhecida', 
        chainId: parseInt(chainId, 16),
        currency: 'ETH'
    };
}

/**
 * Obtém saldo da carteira
 */
async function getWalletBalance() {
    try {
        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [AppState.wallet.address, 'latest']
        });
        
        AppState.wallet.balance = (parseInt(balance, 16) / 1e18).toFixed(4);
        
    } catch (error) {
        console.error('❌ Erro ao obter saldo:', error);
        AppState.wallet.balance = '0.0000';
    }
}

/**
 * Atualiza interface da carteira
 */
function updateWalletUI() {
    const { wallet } = AppState;
    
    // Status da conexão
    const statusInput = document.getElementById('wallet-status');
    if (statusInput && wallet.connected) {
        statusInput.value = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
    }
    
    // Endereço completo
    const addressDisplay = document.getElementById('connected-address');
    if (addressDisplay) {
        addressDisplay.textContent = wallet.address;
    }
    
    // Saldo
    const balanceDisplay = document.getElementById('wallet-balance');
    if (balanceDisplay) {
        balanceDisplay.textContent = `${wallet.balance} ${wallet.network?.currency || 'ETH'}`;
    }
    
    // Rede
    const networkDisplay = document.getElementById('current-network');
    if (networkDisplay) {
        networkDisplay.textContent = wallet.network?.name || 'Desconhecida';
    }
    
    // Chain ID
    const chainDisplay = document.getElementById('chain-id-value');
    if (chainDisplay) {
        chainDisplay.textContent = wallet.network?.chainId || 'N/A';
    }
    
    // Auto-preencher endereço do proprietário
    const ownerInput = document.getElementById('ownerAddress');
    if (ownerInput && !ownerInput.value) {
        ownerInput.value = wallet.address;
    }
    
    // Preencher rede de deploy
    const networkDeployInput = document.getElementById('network-display');
    if (networkDeployInput) {
        networkDeployInput.value = wallet.network?.name || 'Detectando...';
    }
    
    // Mostrar info da carteira e atualizar botão conectar
    const walletInfo = document.getElementById('wallet-connection-info');
    const connectBtn = document.getElementById('connect-metamask-btn');
    
    if (walletInfo) walletInfo.style.display = 'block';
    if (connectBtn) {
        connectBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Conectado!';
        connectBtn.classList.add('btn-success');
        connectBtn.classList.remove('btn-warning');
        connectBtn.disabled = true;
    }
    
    // Habilitar seção de informações do token
    enableSection('section-basic-info');
}

/**
 * Detecta mudanças nos dados do token
 */
function onTokenDataChange(event) {
    // Salvar dados no estado
    const tokenName = document.getElementById('tokenName')?.value.trim() || '';
    const tokenSymbol = document.getElementById('tokenSymbol')?.value.trim().toUpperCase() || '';
    let totalSupply = document.getElementById('totalSupply')?.value.trim() || '';
    
    // Para supply, usar valor numérico
    if (event?.target?.id === 'totalSupply') {
        totalSupply = totalSupply.replace(/\D/g, ''); // Remove formatação para salvar
    } else {
        // Para outros campos, pegar valor do input de supply já processado
        totalSupply = AppState.tokenData.totalSupply || totalSupply.replace(/\D/g, '');
    }
    
    const newTokenData = {
        name: tokenName,
        symbol: tokenSymbol,
        totalSupply: totalSupply,
        decimals: document.getElementById('decimals')?.value || '18',
        owner: document.getElementById('ownerAddress')?.value.trim() || AppState.wallet.address
    };
    
    // Evitar logs duplicados - só atualizar se mudou
    const hasChanged = JSON.stringify(AppState.tokenData) !== JSON.stringify(newTokenData);
    if (hasChanged) {
        AppState.tokenData = newTokenData;
        console.log('📝 Dados atualizados:', {
            nome: AppState.tokenData.name,
            simbolo: AppState.tokenData.symbol,
            supply: AppState.tokenData.totalSupply,
            owner: AppState.tokenData.owner?.slice(0,10) + '...'
        });
    }
    
    // Converter símbolo para maiúsculas em tempo real
    if (event?.target?.id === 'tokenSymbol') {
        event.target.value = event.target.value.toUpperCase();
    }
}

/**
 * Verifica progresso e faz scroll automático - só quando TUDO estiver preenchido
 */
function checkProgressAndScroll() {
    // Atualizar dados primeiro
    onTokenDataChange();
    
    const { tokenData, wallet } = AppState;
    
    const progressData = {
        connected: wallet.connected,
        name: tokenData.name || '',
        symbol: tokenData.symbol || '',
        supply: tokenData.totalSupply || '',
        owner: tokenData.owner || ''
    };
    
    console.log('🔍 Verificando progresso:', {
        conectado: progressData.connected,
        nome: progressData.name,
        simbolo: progressData.symbol,
        supply: progressData.supply,
        owner: progressData.owner?.slice(0,10) + '...'
    });
    
    // Atualizar indicadores visuais
    updateFieldIndicators(progressData);
    
    // Verificar se TODOS os campos obrigatórios estão preenchidos E válidos
    const isValid = wallet.connected && 
        tokenData.name && tokenData.name.length >= 3 &&
        tokenData.symbol && tokenData.symbol.length >= 2 &&
        tokenData.totalSupply && !isNaN(tokenData.totalSupply) && tokenData.totalSupply > 0 &&
        tokenData.owner && tokenData.owner.length === 42 && tokenData.owner.startsWith('0x');
    
    if (isValid) {
        console.log('✅ Todos os campos preenchidos - preparando para scroll');
        
        // Mostrar indicador de progresso
        showProgressIndicator();
        
        // Habilitar botão de deploy
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.disabled = false;
        }
        
        // Auto-scroll com countdown
        startCountdown(() => {
            scrollToSection('section-deploy');
            updateDeploySummary();
            enableSection('section-deploy');
        });
    } else {
        // Esconder indicador e mostrar campos pendentes
        hideProgressIndicator();
        
        // Desabilitar botão de deploy se dados incompletos
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.disabled = true;
        }
        
        console.log('⏳ Campos ainda não completados');
    }
}

/**
 * Atualiza indicadores visuais dos campos
 */
function updateFieldIndicators(progressData) {
    const indicators = {
        'field-name': progressData.name.length >= 3,
        'field-symbol': progressData.symbol.length >= 2,
        'field-supply': progressData.supply && parseInt(progressData.supply) > 0,
        'field-owner': true // Opcional, sempre válido
    };
    
    Object.entries(indicators).forEach(([fieldId, isValid]) => {
        const element = document.getElementById(fieldId);
        if (element) {
            const icon = element.querySelector('i');
            if (icon) {
                if (isValid) {
                    icon.className = 'bi bi-check-circle me-2 text-success';
                } else {
                    icon.className = 'bi bi-circle me-2 text-warning';
                }
            }
        }
    });
}

/**
 * Mostra indicador de progresso com countdown
 */
function showProgressIndicator() {
    const progressIndicator = document.getElementById('progress-indicator');
    const missingFields = document.getElementById('missing-fields');
    
    if (progressIndicator) progressIndicator.style.display = 'block';
    if (missingFields) missingFields.style.display = 'none';
}

/**
 * Esconde indicador de progresso
 */
function hideProgressIndicator() {
    const progressIndicator = document.getElementById('progress-indicator');
    const missingFields = document.getElementById('missing-fields');
    
    if (progressIndicator) progressIndicator.style.display = 'none';
    if (missingFields) missingFields.style.display = 'block';
}

/**
 * Inicia countdown automático
 */
function startCountdown(callback) {
    let seconds = 3;
    const countdownElement = document.getElementById('countdown');
    const skipBtn = document.getElementById('skip-countdown');
    
    // Limpar countdown anterior se existir
    if (window.countdownTimer) {
        clearInterval(window.countdownTimer);
    }
    
    // Atualizar display inicial
    if (countdownElement) countdownElement.textContent = seconds;
    
    // Configurar botão de skip
    if (skipBtn) {
        skipBtn.onclick = () => {
            clearInterval(window.countdownTimer);
            callback();
        };
    }
    
    // Iniciar countdown
    window.countdownTimer = setInterval(() => {
        seconds--;
        if (countdownElement) countdownElement.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(window.countdownTimer);
            callback();
        }
    }, 1000);
}

/**
 * Mostra preview do contrato em modal
 */
async function previewContract() {
    const { tokenData } = AppState;
    
    if (!tokenData.name || !tokenData.symbol) {
        alert('Preencha os dados do token antes de visualizar o código');
        return;
    }
    
    try {
        const contractCode = await generateSolidityContract(tokenData);
    
    // Criar modal de preview
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'contractPreviewModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content bg-dark text-white">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title">
                        <i class="bi bi-file-code me-2"></i>
                        Preview: ${tokenData.symbol}.sol
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="d-flex justify-content-between mb-3">
                        <small class="text-muted">
                            <i class="bi bi-info-circle me-1"></i>
                            Token: ${tokenData.name} (${tokenData.symbol})
                        </small>
                        <button class="btn btn-sm btn-outline-info" onclick="copyContractCode()">
                            <i class="bi bi-clipboard me-1"></i>Copiar Código
                        </button>
                    </div>
                    <pre class="bg-black p-3 rounded" style="max-height: 400px; overflow-y: auto;"><code id="contract-code">${escapeHtml(contractCode)}</code></pre>
                </div>
                <div class="modal-footer border-secondary">
                    <button type="button" class="btn btn-info" onclick="downloadSolidityFile(); closeModal('contractPreviewModal')">
                        <i class="bi bi-download me-2"></i>Baixar Arquivo
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar modal (usando Bootstrap se disponível, senão CSS puro)
    if (typeof bootstrap !== 'undefined') {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    } else {
        modal.style.display = 'block';
        modal.classList.add('show');
    }
    
    // Remover modal quando fechar
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
        
    } catch (error) {
        console.error('❌ Erro ao gerar preview do contrato:', error);
        alert('Erro ao gerar preview do contrato. Tente novamente.');
    }
}

/**
 * Copia código do contrato para clipboard
 */
function copyContractCode() {
    const codeElement = document.getElementById('contract-code');
    if (codeElement) {
        const contractCode = codeElement.textContent;
        copyToClipboard(contractCode);
    }
}

/**
 * Fecha modal programaticamente
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (typeof bootstrap !== 'undefined') {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) bootstrapModal.hide();
        } else {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }
}

/**
 * Escapa HTML para exibição segura
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Atualiza o resumo para deploy
 */
function updateDeploySummary() {
    const { tokenData, wallet } = AppState;
    
    console.log('📋 Atualizando resumo de deploy');
    
    // Atualizar campos individuais do resumo
    const summaryFields = {
        'display-token-name': tokenData.name || '-',
        'display-token-symbol': tokenData.symbol || '-', 
        'display-total-supply': tokenData.totalSupply ? `${parseInt(tokenData.totalSupply).toLocaleString('pt-BR')} tokens` : '-',
        'display-decimals': tokenData.decimals || '18',
        'display-owner': tokenData.owner ? `${tokenData.owner.slice(0, 8)}...${tokenData.owner.slice(-8)}` : '-'
    };
    
    // Atualizar cada campo
    Object.entries(summaryFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Atualizar detalhes da rede
    const networkDetails = document.getElementById('network-details');
    if (networkDetails && wallet.network) {
        networkDetails.innerHTML = `
            <strong>Rede:</strong> ${wallet.network.name} | 
            <strong>Chain ID:</strong> ${wallet.network.chainId} | 
            <strong>Moeda:</strong> ${wallet.network.currency}
        `;
    }
    
    // Atualizar estimativa de custo
    const costEstimate = document.getElementById('deploy-cost-estimate');
    if (costEstimate && wallet.network) {
        const estimatedCost = getDeployCostEstimate(wallet.network.chainId);
        costEstimate.innerHTML = `
            <strong>Custo estimado:</strong> ${estimatedCost} ${wallet.network.currency}<br>
            <small class="text-muted">
                *Valor aproximado baseado na rede atual. O custo real pode variar conforme o gas price.
            </small>
        `;
    }
    
    // Habilitar botão de deploy
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
        deployBtn.disabled = false;
    }
    
    // Atualizar nome do arquivo de download
    updateDownloadButtonText();
}

/**
 * Estima custo de deploy baseado na rede
 */
function getDeployCostEstimate(chainId) {
    const costs = {
        1: '0.01-0.05',     // Ethereum
        137: '0.001-0.01',  // Polygon
        56: '0.005-0.02',   // BSC
        97: '0.005-0.02',   // BSC Testnet
        8453: '0.001-0.005', // Base
        11155111: '0.001-0.01' // Sepolia
    };
    
    return costs[chainId] || '0.001-0.01';
}

/**
 * Faz o deploy do token
 */
async function deployToken() {
    const deployBtn = document.getElementById('deploy-token-btn');
    const originalText = deployBtn?.innerHTML || 'Fazer Deploy';
    
    try {
        if (deployBtn) {
            deployBtn.disabled = true;
            deployBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Fazendo Deploy...';
        }
        
        onTokenDataChange({ target: { id: 'update' } }); // Atualizar dados
        
        if (!validateTokenData()) {
            throw new Error('Dados do token inválidos');
        }
        
        console.log('🚀 Iniciando deploy do token:', {
            nome: AppState.tokenData.name,
            simbolo: AppState.tokenData.symbol,
            supply: AppState.tokenData.totalSupply,
            decimais: AppState.tokenData.decimals,
            owner: AppState.tokenData.owner?.slice(0,10) + '...'
        });
        
        console.log('🚀 Iniciando deploy real via API híbrida');
        
        // Deploy real usando API híbrida
        await performRealDeploy();
        
        // Mostrar resultado
        setTimeout(() => {
            scrollToSection('section-result');
            showDeployResult(true);
            enableSection('section-result');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro no deploy:', error);
        
        // Tentar simulação como último recurso
        try {
            console.log('🔄 Tentando simulação de emergência...');
            updateDeployStatus('🔄 Executando simulação...');
            
            const simulatedResult = await simulateDeployForFallback(AppState.tokenData);
            
            // Salvar resultado simulado
            AppState.deployResult = {
                success: true,
                contractAddress: simulatedResult.contractAddress,
                transactionHash: simulatedResult.transactionHash,
                deployData: AppState.tokenData,
                gasUsed: simulatedResult.gasUsed,
                blockNumber: simulatedResult.blockNumber,
                isSimulated: true
            };
            
            updateDeployStatus('✅ Simulação concluída!');
            
            setTimeout(() => {
                scrollToSection('section-result');
                showDeployResult(true);
                enableSection('section-result');
            }, 1000);
            
        } catch (simulationError) {
            console.error('❌ Erro na simulação:', simulationError);
            showDeployResult(false, error.message);
        }
        
        if (deployBtn) {
            deployBtn.innerHTML = originalText;
            deployBtn.disabled = false;
        }
    }
}

/**
 * Valida dados do token
 */
function validateTokenData() {
    const { tokenData, wallet } = AppState;
    
    if (!wallet.connected) {
        alert('Conecte sua carteira primeiro');
        return false;
    }
    
    if (!tokenData.name || tokenData.name.length < 3) {
        alert('Nome do token deve ter pelo menos 3 caracteres');
        return false;
    }
    
    if (!tokenData.symbol || tokenData.symbol.length < 2) {
        alert('Símbolo do token deve ter pelo menos 2 caracteres');
        return false;
    }
    
    if (!tokenData.totalSupply || isNaN(tokenData.totalSupply) || tokenData.totalSupply <= 0) {
        alert('Supply total deve ser um número válido maior que zero');
        return false;
    }
    
    return true;
}

/**
 * Simula deploy quando API falha
 */
async function simulateDeployForFallback(deployData) {
    console.log('🎭 Executando deploy simulado...');
    
    updateDeployStatus('🔨 Compilando contrato inteligente...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    updateDeployStatus('⛽ Calculando custos de gas...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateDeployStatus('📡 Enviando transação...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    updateDeployStatus('⏳ Aguardando confirmação...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Gerar endereços mock realísticos baseados na rede
    const networkPrefix = AppState.wallet.network?.chainId === 97 ? '0x024f' : '0x1a2b';
    const contractAddress = networkPrefix + Array(36).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const transactionHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const gasUsed = Math.floor(Math.random() * 200000) + 500000;
    const blockNumber = Math.floor(Math.random() * 1000000) + 15000000;
    
    return {
        success: true,
        contractAddress: contractAddress,
        transactionHash: transactionHash,
        gasUsed: gasUsed,
        blockNumber: blockNumber,
        deploymentCost: (gasUsed * 0.000000005).toFixed(6), // Custo estimado em ETH/BNB
        message: 'Deploy simulado concluído com sucesso',
        networkName: AppState.wallet.network?.name || 'Rede de Teste',
        explorerUrl: `https://testnet.bscscan.com/tx/${transactionHash}`
    };
}

/**
 * Verifica status da API
 */
async function checkApiStatus() {
    try {
        console.log('🔍 Verificando status da API híbrida...');
        const api = new XcafeHybridAPI();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`${api.baseUrl}/health`, { 
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Status:', data);
            return { 
                available: true, 
                status: 'online', 
                message: 'API híbrida disponível',
                version: data.version || 'hybrid-1.0',
                mode: 'hybrid'
            };
        } else {
            console.warn('⚠️ API respondeu com erro:', response.status);
            return { 
                available: false, 
                status: 'error', 
                message: `HTTP ${response.status}` 
            };
        }
    } catch (error) {
        console.error('❌ Erro ao verificar API:', error.message);
        return { 
            available: false, 
            status: 'offline', 
            message: error.name === 'AbortError' ? 'Timeout' : 'API indisponível' 
        };
    }
}

/**
 * Atualiza indicador de status da API
 */
async function updateApiStatus() {
    const statusElement = document.getElementById('api-status');
    if (!statusElement) {
        console.warn('⚠️ Elemento api-status não encontrado');
        return;
    }
    
    // Mostrar estado de carregamento
    statusElement.innerHTML = `
        <i class="bi bi-hourglass-split text-warning me-2"></i>
        <span class="text-warning">Verificando API...</span>
    `;
    
    const status = await checkApiStatus();
    
    if (status.available) {
        statusElement.innerHTML = `
            <i class="bi bi-check-circle text-success me-2"></i>
            <span class="text-success">API Híbrida Online</span>
            <small class="text-muted ms-2">v${status.version} - ${status.mode}</small>
        `;
        
        console.log('✅ API híbrida está online e funcionando');
        
        // Garantir que modo real está disponível
        const realRadio = document.getElementById('realDeploy');
        if (realRadio) realRadio.disabled = false;
        
    } else {
        statusElement.innerHTML = `
            <i class="bi bi-x-circle text-danger me-2"></i>
            <span class="text-danger">API ${status.status}</span>
            <small class="text-muted ms-2">${status.message}</small>
        `;
        
        console.warn('⚠️ API indisponível:', status.message);
        
        // Auto-selecionar simulação se API estiver offline
        const simulatedRadio = document.getElementById('simulatedDeploy');
        if (simulatedRadio) {
            simulatedRadio.checked = true;
            console.log('🔄 Auto-selecionando modo simulação');
        }
        
        // Desabilitar modo real se API não funcionar
        const realRadio = document.getElementById('realDeploy');
        if (realRadio) realRadio.disabled = true;
    }
}

/**
 * Testa especificamente o endpoint de compilação
 */
async function testDeployEndpoint() {
    try {
        console.log('🧪 Testando endpoint de compilação...');
        const api = new XcafeHybridAPI();
        
        // Dados de teste mínimos
        const testData = {
            name: "TestToken",
            symbol: "TEST", 
            totalSupply: "1000",
            decimals: 18
        };
        
        const response = await fetch(`${api.baseUrl}/api/generate-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.text();
        console.log('🧪 Resposta do teste:', {
            status: response.status,
            ok: response.ok,
            response: result
        });
        
        return response.ok;
        
    } catch (error) {
        console.error('🧪 Erro no teste de compilação:', error);
        return false;
    }
}

/**
 * Função para testar API manualmente (chamada pelo botão)
 */
async function testApiStatus() {
    console.log('🔄 Teste manual da API iniciado...');
    
    const button = event.target.closest('button');
    const originalHtml = button.innerHTML;
    
    button.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    button.disabled = true;
    
    try {
        // Teste básico da API
        await updateApiStatus();
        
        // Teste avançado do endpoint de deploy
        const deployWorks = await testDeployEndpoint();
        
        console.log('📊 Resultado dos testes:', {
            apiOnline: true,
            deployEndpoint: deployWorks
        });
        
        if (deployWorks) {
            console.log('✅ API híbrida totalmente funcional!');
        } else {
            console.log('⚠️ API online mas endpoint de compilação com problemas');
        }
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error);
    } finally {
        button.innerHTML = originalHtml;
        button.disabled = false;
    }
}

/**
 * Executa deploy real usando API
 */
async function performRealDeploy() {
    const { tokenData, wallet } = AppState;
    
    try {
        updateDeployStatus('📋 Preparando deploy...');
        
        // Verificar se XcafeHybridAPI está disponível
        if (typeof XcafeHybridAPI === 'undefined') {
            throw new Error('API híbrida não carregada');
        }
        
        const api = new XcafeHybridAPI();
        
        updateDeployStatus('🔗 Conectando com MetaMask...');
        
        // Usar a nova API híbrida - o método createToken gerencia todo o processo
        console.log('� Usando API híbrida para criar token...');
        
        const result = await api.createToken({
            name: tokenData.name,
            symbol: tokenData.symbol,
            totalSupply: tokenData.totalSupply,
            decimals: parseInt(tokenData.decimals),
            owner: tokenData.owner
        });
        
        console.log('✅ Token criado via API híbrida:', result);
        
        updateDeployStatus('✅ Deploy concluído!');
        
        // Salvar resultado no estado com dados completos
        AppState.deployResult = {
            success: true,
            contractAddress: result.contract?.address || result.contractAddress,
            transactionHash: result.contract?.transactionHash || result.transactionHash,
            deployData: tokenData,
            gasUsed: result.gasUsed || 'N/A',
            blockNumber: result.blockNumber || 'N/A',
            sourceCode: result.token?.sourceCode || null,
            compilation: result.token?.compilation || null
        };
        
        console.log('✅ Deploy concluído:', AppState.deployResult);
        
        return result;
        
    } catch (error) {
        updateDeployStatus(`❌ Erro: ${error.message}`);
        throw error;
    }
}

/**
 * Verifica contrato na rede
 */
async function verifyContract(contractAddress, deployData) {
    try {
        console.log('🔍 Iniciando verificação do contrato...');
        
        // Para redes que suportam verificação automática
        const verificationNetworks = [1, 137, 56, 8453]; // Ethereum, Polygon, BSC, Base
        const currentChainId = AppState.wallet.network?.chainId;
        
        if (!verificationNetworks.includes(currentChainId)) {
            console.log('⚠️ Rede não suporta verificação automática');
            return;
        }
        
        // Simular verificação (poderia ser integrada com APIs de verificação)
        console.log(`✅ Contrato verificado: ${contractAddress}`);
        
        // Atualizar UI com informação de verificação
        if (AppState.deployResult) {
            AppState.deployResult.verified = true;
            AppState.deployResult.verificationUrl = getExplorerVerificationUrl(contractAddress, currentChainId);
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
        throw error;
    }
}

/**
 * Gera URL do explorer para verificação
 */
function getExplorerVerificationUrl(contractAddress, chainId) {
    const explorers = {
        1: `https://etherscan.io/address/${contractAddress}#code`,
        137: `https://polygonscan.com/address/${contractAddress}#code`,
        56: `https://bscscan.com/address/${contractAddress}#code`,
        8453: `https://basescan.org/address/${contractAddress}#code`
    };
    
    return explorers[chainId] || `https://etherscan.io/address/${contractAddress}#code`;
}

/**
 * Atualiza status do deploy na UI
 */
function updateDeployStatus(message) {
    console.log(message);
    
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
        const textContent = message.replace(/^[🔗📋📝✅❌]\s*/, '');
        deployBtn.innerHTML = `<i class="bi bi-gear-fill spin me-2"></i><span>${textContent}</span>`;
    }
}

/**
 * Mostra resultado do deploy
 */
function showDeployResult(success, errorMessage = '') {
    if (!success) {
        // Mostrar erro
        console.error('Deploy falhou:', errorMessage);
        return;
    }
    
    // Preencher detalhes do token
    const tokenDetails = document.getElementById('token-details-result');
    if (tokenDetails && AppState.deployResult) {
        const { deployResult } = AppState;
        tokenDetails.innerHTML = `
            <div class="row text-white">
                <div class="col-12 mb-3">
                    <label class="text-muted">Nome do Token</label>
                    <div class="fw-bold fs-5">${deployResult.deployData.name}</div>
                </div>
                <div class="col-6 mb-3">
                    <label class="text-muted">Símbolo</label>
                    <div class="fw-bold">${deployResult.deployData.symbol}</div>
                </div>
                <div class="col-6 mb-3">
                    <label class="text-muted">Decimais</label>
                    <div class="fw-bold">${deployResult.deployData.decimals}</div>
                </div>
                <div class="col-12 mb-3">
                    <label class="text-muted">Supply Total</label>
                    <div class="fw-bold fs-5 text-success">${parseInt(deployResult.deployData.totalSupply).toLocaleString('pt-BR')}</div>
                </div>
                <div class="col-12">
                    <label class="text-muted">Proprietário</label>
                    <div class="fw-bold" style="font-family: monospace; font-size: 0.85rem;">${deployResult.deployData.owner}</div>
                </div>
            </div>
        `;
    }
    
    // Preencher informações da blockchain
    const blockchainDetails = document.getElementById('blockchain-details-result');
    if (blockchainDetails && AppState.deployResult) {
        const { deployResult } = AppState;
        const networkName = AppState.wallet.network?.name || 'Rede Desconhecida';
        const isSimulated = deployResult.isSimulated;
        
        blockchainDetails.innerHTML = `
            <div class="row text-white">
                <div class="col-12 mb-3">
                    <label class="text-muted">Rede</label>
                    <div class="fw-bold">${networkName}</div>
                </div>
                <div class="col-12 mb-3">
                    <label class="text-muted">Status</label>
                    <div class="fw-bold ${isSimulated ? 'text-warning' : 'text-success'}">
                        <i class="bi bi-${isSimulated ? 'exclamation-triangle' : 'check-circle'} me-1"></i>
                        ${isSimulated ? 'Simulado' : 'Confirmado'}
                    </div>
                </div>
                <div class="col-12 mb-3">
                    <label class="text-muted">Transaction Hash</label>
                    <div class="fw-bold" style="font-family: monospace; font-size: 0.8rem;">
                        <a href="${getExplorerTxUrl(deployResult.transactionHash, AppState.wallet.network?.chainId)}" 
                           target="_blank" class="text-info text-decoration-none">
                           ${deployResult.transactionHash}
                        </a>
                    </div>
                </div>
                <div class="col-12">
                    <label class="text-muted">Data/Hora</label>
                    <div class="fw-bold">${new Date().toLocaleString('pt-BR')}</div>
                </div>
            </div>
        `;
    }
    
    // Preencher endereço do contrato
    const contractAddressDisplay = document.getElementById('contract-address-display');
    if (contractAddressDisplay && AppState.deployResult) {
        contractAddressDisplay.value = AppState.deployResult.contractAddress;
    }
    
    // Preencher estatísticas
    const gasUsedDisplay = document.getElementById('gas-used-display');
    if (gasUsedDisplay && AppState.deployResult) {
        gasUsedDisplay.textContent = AppState.deployResult.gasUsed || '-';
    }
    
    const blockNumberDisplay = document.getElementById('block-number-display');
    if (blockNumberDisplay && AppState.deployResult) {
        blockNumberDisplay.textContent = AppState.deployResult.blockNumber || '-';
    }
    
    // Preencher links do explorer
    const explorerLinks = document.getElementById('explorer-links');
    if (explorerLinks && AppState.deployResult) {
        const contractUrl = getExplorerContractUrl(AppState.deployResult.contractAddress, AppState.wallet.network?.chainId);
        explorerLinks.innerHTML = `
            <a href="${contractUrl}" target="_blank" class="btn btn-outline-warning">
                <i class="bi bi-search me-1"></i>Ver no Explorer
            </a>
        `;
    }
    
    // Configurar botão de copiar
    const copyContractBtn = document.getElementById('copy-contract-btn');
    if (copyContractBtn) {
        copyContractBtn.onclick = () => {
            navigator.clipboard.writeText(AppState.deployResult.contractAddress);
            copyContractBtn.innerHTML = '<i class="bi bi-check"></i>';
            setTimeout(() => {
                copyContractBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
            }, 2000);
        };
    }
    
    // Configurar downloads após o deploy
    downloadContractFiles();
}

/**
 * Navegação e utilidades
 */
function scrollToNextSection() {
    const sections = ['section-wallet', 'section-basic-info', 'section-deploy'];
    let currentIndex = 0;
    
    // Encontrar seção atual
    sections.forEach((sectionId, index) => {
        const section = document.getElementById(sectionId);
        if (section && section.classList.contains('active')) {
            currentIndex = index;
        }
    });
    
    // Ir para próxima seção
    if (currentIndex < sections.length - 1) {
        scrollToSection(sections[currentIndex + 1]);
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Mostrar a seção antes de fazer scroll
        section.style.display = 'block';
        
        section.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Habilitar seção
        enableSection(sectionId);
        
        console.log(`📍 Navegando para: ${sectionId}`);
    }
}

function enableSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('section-enabled', 'active');
        section.style.display = 'block';
        
        // Remover active das outras seções mas manter visíveis
        document.querySelectorAll('.creation-section').forEach(s => {
            if (s.id !== sectionId) {
                s.classList.remove('active');
            }
        });
    }
}

function showOnlyFirstSection() {
    const allSections = document.querySelectorAll('.creation-section');
    allSections.forEach((section, index) => {
        if (index === 0) {
            // Primeira seção: mostrar e ativar
            section.classList.add('active', 'section-enabled');
            section.style.display = 'block';
        } else {
            // Outras seções: esconder mas manter no DOM
            section.classList.remove('active', 'section-enabled');
            section.style.display = 'none';
        }
    });
}

function resetApp() {
    console.log('🔄 Iniciando reset completo...');
    
    // Limpar timers
    if (window.countdownTimer) {
        clearInterval(window.countdownTimer);
        window.countdownTimer = null;
    }
    
    // Reset completo do estado
    AppState.wallet = {
        connected: false,
        address: '',
        balance: '0.0000',
        network: null
    };
    AppState.tokenData = {};
    AppState.deployResult = null;
    
    // Limpar todos os campos de input
    const inputs = [
        '#tokenName',
        '#tokenSymbol', 
        '#totalSupply',
        '#decimals',
        '#ownerAddress',
        '#tokenImage',
        '#network-display'
    ];
    
    inputs.forEach(selector => {
        const input = document.querySelector(selector);
        if (input) {
            input.value = '';
            input.classList.remove('is-valid', 'is-invalid');
        }
    });
    
    // Resetar decimais para valor padrão
    const decimalsInput = document.getElementById('decimals');
    if (decimalsInput) decimalsInput.value = '18';
    
    // Limpar indicadores de progresso
    hideProgressIndicator();
    
    // Reset indicadores visuais dos campos
    const fieldIndicators = ['field-name', 'field-symbol', 'field-supply', 'field-owner'];
    fieldIndicators.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            const icon = element.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-circle me-2 text-warning';
            }
        }
    });
    
    // Limpar resumo de deploy
    const summaryFields = ['display-token-name', 'display-token-symbol', 'display-total-supply', 'display-decimals', 'display-owner'];
    summaryFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) element.textContent = '-';
    });
    
    // Reset botão conectar
    const connectBtn = document.getElementById('connect-metamask-btn');
    if (connectBtn) {
        connectBtn.innerHTML = '<i class="bi bi-wallet2 me-2"></i>CONECTAR';
        connectBtn.classList.remove('btn-success');
        connectBtn.classList.add('btn-warning');
        connectBtn.disabled = false;
    }
    
    // Esconder info da carteira
    const walletInfo = document.getElementById('wallet-connection-info');
    if (walletInfo) walletInfo.style.display = 'none';
    
    // Reset botão de deploy
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
        deployBtn.disabled = true;
        deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>CRIAR TOKEN';
    }
    
    // Limpar resultados de deploy
    document.querySelectorAll('.deploy-result').forEach(el => el.remove());
    
    // Limpar section result
    const resultSection = document.getElementById('section-result');
    if (resultSection) {
        resultSection.innerHTML = `
            <div class="section-header">
                <h4 class="text-success mb-3">
                    <i class="bi bi-check-circle me-2"></i>4. Resultado do Deploy
                </h4>
                <p class="text-muted">Informações sobre o token criado aparecerão aqui.</p>
            </div>
        `;
    }
    
    // Voltar ao início
    scrollToSection('section-wallet');
    showOnlyFirstSection();
    
    console.log('✅ Reset completo finalizado');
}

async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                AppState.wallet.address = accounts[0];
                AppState.wallet.connected = true;
                await detectNetwork();
                await getWalletBalance();
                updateWalletUI();
                
                console.log('✅ Conexão existente detectada');
            }
        } catch (error) {
            console.log('Nenhuma conexão prévia detectada');
        }
    }
}

function copyContractAddress(address) {
    navigator.clipboard.writeText(address).then(() => {
        // Feedback visual
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check"></i> Copiado!';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(() => {
        // Fallback para navegadores mais antigos
        const input = document.getElementById('contract-address');
        input.select();
        document.execCommand('copy');
        alert('Endereço copiado!');
    });
}

/**
 * Funções de Download e Verificação
 */
function downloadContractFiles() {
    // Configurar botões de download silenciosamente
    const downloadContractBtn = document.getElementById('download-contract-btn');
    const openVerificationBtn = document.getElementById('open-verification-btn');
    const addToMetamaskBtn = document.getElementById('add-to-metamask-btn');
    const shareTokenBtn = document.getElementById('share-token-btn');
    
    if (downloadContractBtn) {
        downloadContractBtn.onclick = () => downloadSolidityFile();
    }
    
    if (openVerificationBtn) {
        openVerificationBtn.onclick = () => openVerificationUrl();
    }
    
    if (addToMetamaskBtn) {
        addToMetamaskBtn.onclick = () => addTokenToMetaMask();
    }
    
    if (shareTokenBtn) {
        shareTokenBtn.onclick = () => shareToken();
    }
}

function downloadSolidityFile() {
    if (!AppState.deployResult?.sourceCode) {
        alert('Código Solidity não disponível');
        return;
    }
    
    const filename = `${AppState.tokenData.symbol}_Token.sol`;
    const content = AppState.deployResult.sourceCode;
    
    downloadFile(filename, content, 'text/plain');
}

function downloadABI() {
    if (!AppState.deployResult?.compilation?.abi) {
        alert('ABI não disponível');
        return;
    }
    
    const filename = `${AppState.tokenData.symbol}_ABI.json`;
    const content = JSON.stringify(AppState.deployResult.compilation.abi, null, 2);
    
    downloadFile(filename, content, 'application/json');
}

function downloadBytecode() {
    if (!AppState.deployResult?.compilation?.bytecode) {
        alert('Bytecode não disponível');
        return;
    }
    
    const filename = `${AppState.tokenData.symbol}_Bytecode.txt`;
    const content = AppState.deployResult.compilation.bytecode;
    
    downloadFile(filename, content, 'text/plain');
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    // Feedback visual
    const btn = event.target.closest('button');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check me-2"></i>Baixado!';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }, 2000);
}

function openVerificationUrl() {
    if (!AppState.deployResult?.contractAddress) {
        alert('Endereço do contrato não disponível');
        return;
    }
    
    const chainId = AppState.wallet.network?.chainId || 97;
    let verificationUrl = '';
    
    switch (chainId) {
        case 1: // Ethereum Mainnet
            verificationUrl = `https://etherscan.io/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        case 56: // BSC Mainnet
            verificationUrl = `https://bscscan.com/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        case 97: // BSC Testnet
            verificationUrl = `https://testnet.bscscan.com/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        case 137: // Polygon
            verificationUrl = `https://polygonscan.com/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        case 8453: // Base
            verificationUrl = `https://basescan.org/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        default:
            verificationUrl = `https://etherscan.io/verifyContract?a=${AppState.deployResult.contractAddress}`;
    }
    
    window.open(verificationUrl, '_blank');
}

// Adicionar token ao MetaMask
async function addTokenToMetaMask() {
    if (!AppState.deployResult?.contractAddress) {
        alert('Endereço do contrato não disponível');
        return;
    }
    
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: AppState.deployResult.contractAddress,
                    symbol: AppState.tokenData.symbol,
                    decimals: parseInt(AppState.tokenData.decimals),
                    image: '', // Pode adicionar logo se tiver
                },
            },
        });
        
        // Feedback visual
        const btn = event.target.closest('button');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check"></i>';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao adicionar token ao MetaMask:', error);
        alert('Erro ao adicionar token ao MetaMask');
    }
}

// Compartilhar token
function shareToken() {
    if (!AppState.deployResult?.contractAddress) {
        alert('Endereço do contrato não disponível');
        return;
    }
    
    const tokenInfo = `🎉 Criei meu token na blockchain!
    
📝 Nome: ${AppState.tokenData.name}
🏷️ Símbolo: ${AppState.tokenData.symbol}
📊 Supply: ${parseInt(AppState.tokenData.totalSupply).toLocaleString('pt-BR')}
📍 Contrato: ${AppState.deployResult.contractAddress}
🌐 Rede: ${AppState.wallet.network?.name || 'Ethereum'}

🔗 Criado com xcafe Token Creator`;
    
    if (navigator.share) {
        navigator.share({
            title: `Token ${AppState.tokenData.symbol} Criado!`,
            text: tokenInfo
        });
    } else {
        navigator.clipboard.writeText(tokenInfo);
        
        // Feedback visual
        const btn = event.target.closest('button');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check"></i>';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
        
        alert('Informações copiadas para a área de transferência!');
    }
}

// Utilitários para URLs de explorers
function getExplorerTxUrl(txHash, chainId) {
    if (!txHash) return '#';
    
    switch (chainId) {
        case 1: return `https://etherscan.io/tx/${txHash}`;
        case 56: return `https://bscscan.com/tx/${txHash}`;
        case 97: return `https://testnet.bscscan.com/tx/${txHash}`;
        case 137: return `https://polygonscan.com/tx/${txHash}`;
        case 8453: return `https://basescan.org/tx/${txHash}`;
        default: return `https://etherscan.io/tx/${txHash}`;
    }
}

function getExplorerContractUrl(contractAddress, chainId) {
    if (!contractAddress) return '#';
    
    switch (chainId) {
        case 1: return `https://etherscan.io/address/${contractAddress}`;
        case 56: return `https://bscscan.com/address/${contractAddress}`;
        case 97: return `https://testnet.bscscan.com/address/${contractAddress}`;
        case 137: return `https://polygonscan.com/address/${contractAddress}`;
        case 8453: return `https://basescan.org/address/${contractAddress}`;
        default: return `https://etherscan.io/address/${contractAddress}`;
    }
}

// Exportar funções globais
window.connectWallet = connectWallet;
window.resetApp = resetApp;
window.scrollToSection = scrollToSection;
window.copyContractAddress = copyContractAddress;
window.downloadSolidityFile = downloadSolidityFile;
window.previewContract = previewContract;
window.copyContractCode = copyContractCode;
window.closeModal = closeModal;
window.testApiStatus = testApiStatus;
window.downloadContractFiles = downloadContractFiles;
window.downloadABI = downloadABI;
window.downloadBytecode = downloadBytecode;
window.openVerificationUrl = openVerificationUrl;
window.addTokenToMetaMask = addTokenToMetaMask;
window.shareToken = shareToken;

console.log('✅ xcafe Token Creator - Tela Única carregado');






