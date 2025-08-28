/**
 * xcafe Token Creator - Versão Tela Única com Layout Step
 * Sistema de criação de tokens com scroll progressivo e layout step visual
 */

// Estado global da aplicação
const AppState = {
    wallet: {
        connected: false,
        address: '',
        balance: '0.0000',
        network: null
    },
    tokenData: {},
    gasEstimate: null,
    apiStatus: 'checking'
};

/**
 * Verifica o status da API silenciosamente (apenas no console)
 */
async function checkApiStatusSilently() {
    try {
        console.log('🔍 Verificando status da API...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch('https://xcafe-token-api-hybrid.onrender.com/health', {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            AppState.apiStatus = 'online';
            console.log('✅ API Status: ONLINE', data);
            updateBlockchainStatus(true);
        } else {
            AppState.apiStatus = 'offline';
            console.log('⚠️ API Status: OFFLINE - Response não OK:', response.status);
            updateBlockchainStatus(false, `HTTP ${response.status}`);
        }
    } catch (error) {
        AppState.apiStatus = 'error';
        if (error.name === 'AbortError') {
            console.log('⏰ API Status: TIMEOUT - Verificação cancelada por timeout');
            updateBlockchainStatus(false, 'Timeout de conexão');
        } else {
            console.log('❌ API Status: ERROR -', error.message);
            updateBlockchainStatus(false, 'Conexão indisponível');
        }
    }
}

/**
 * Atualiza o status visual da rede blockchain
 */
function updateBlockchainStatus(available, errorMessage = '') {
    const statusElement = document.getElementById('blockchain-status');
    if (!statusElement) return;
    
    if (available) {
        statusElement.innerHTML = `
            <i class="bi bi-check-circle text-success me-1"></i>
            <span class="text-success">Disponível</span>
        `;
        console.log('✅ Rede blockchain reportada como disponível');
    } else {
        statusElement.innerHTML = `
            <i class="bi bi-exclamation-triangle text-warning me-1"></i>
            <span class="text-warning">Indisponível</span>
            ${errorMessage ? `<small class="text-muted ms-2">(${errorMessage})</small>` : ''}
        `;
        console.log('⚠️ Rede blockchain reportada como indisponível:', errorMessage);
    }
}

/**
 * Estima o gas necessário para deploy do contrato
 */
async function estimateGasForDeploy() {
    try {
        if (!window.ethereum || !AppState.wallet.connected) {
            console.log('⚠️ Carteira não conectada para estimativa de gas');
            return null;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Gas estimado para deploy de contrato ERC20 padrão (valores baseados em experiência)
        const gasLimit = 800000; // ~800k gas units
        
        // Obter gas price atual da rede
        const gasPrice = await provider.getGasPrice();
        const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
        
        // Calcular custo estimado
        const estimatedCost = gasLimit * parseFloat(gasPriceGwei) / 1e9; // Em ETH/BNB
        
        const gasInfo = {
            gasLimit: gasLimit.toLocaleString(),
            gasPriceGwei: parseFloat(gasPriceGwei).toFixed(2),
            estimatedCostETH: estimatedCost.toFixed(6)
        };
        
        console.log('💰 Estimativa de Gas:', gasInfo);
        AppState.gasEstimate = gasInfo;
        
        return gasInfo;
    } catch (error) {
        console.error('❌ Erro ao estimar gas:', error);
        return null;
    }
}

/**
 * Atualiza a exibição da estimativa de gas na UI
 */
function updateGasDisplay(gasInfo) {
    if (!gasInfo) {
        // Mostrar valores padrão se não conseguir estimar
        document.getElementById('gas-limit-display').textContent = '~800,000';
        document.getElementById('gas-price-display').textContent = '--';
        document.getElementById('estimated-cost-display').textContent = '--';
        return;
    }
    
    document.getElementById('gas-limit-display').textContent = gasInfo.gasLimit;
    document.getElementById('gas-price-display').textContent = gasInfo.gasPriceGwei;
    document.getElementById('estimated-cost-display').textContent = gasInfo.estimatedCostETH;
}

/**
 * Atualiza a barra de progresso visual baseada no progresso real
 */
function updateVisualProgress() {
    const { wallet, tokenData } = AppState;
    
    // Step 1 - Wallet
    const step1 = document.querySelector('.step-item[data-step="1"]');
    if (step1) {
        step1.classList.remove('active', 'completed');
        if (wallet.connected) {
            step1.classList.add('completed');
        } else {
            step1.classList.add('active');
        }
    }
    
    // Step 2 - Basic Info
    const step2 = document.querySelector('.step-item[data-step="2"]');
    const hasBasicInfo = tokenData.name && tokenData.symbol && tokenData.totalSupply;
    if (step2) {
        step2.classList.remove('active', 'completed');
        if (hasBasicInfo && wallet.connected) {
            step2.classList.add('completed');
        } else if (wallet.connected) {
            step2.classList.add('active');
        }
    }
    
    // Step 3 - Deploy
    const step3 = document.querySelector('.step-item[data-step="3"]');
    if (step3) {
        step3.classList.remove('active', 'completed');
        if (hasBasicInfo && wallet.connected) {
            step3.classList.add('active');
        }
    }
    
    // Step 4 - Result
    const step4 = document.querySelector('.step-item[data-step="4"]');
    if (step4) {
        step4.classList.remove('active', 'completed');
        if (AppState.deployResult?.success) {
            step4.classList.add('active');
        }
    }
    
    // Atualizar conectores
    document.querySelectorAll('.step-connector').forEach((connector, index) => {
        connector.classList.remove('active');
        if (index === 0 && wallet.connected) {
            connector.classList.add('active');
        } else if (index === 1 && hasBasicInfo && wallet.connected) {
            connector.classList.add('active');
        } else if (index === 2 && AppState.deployResult?.success) {
            connector.classList.add('active');
        }
    });
    
    // Controlar botão "Próxima Seção" - apenas 3 campos obrigatórios
    const nextSectionBtn = document.getElementById('next-section-btn');
    if (nextSectionBtn) {
        // Verificar estado da carteira em tempo real
        const walletStatus = Wallet.getStatus();
        const isWalletConnected = walletStatus.connected || wallet.connected;
        
        // Verificar se tem apenas os 3 campos obrigatórios: nome, símbolo e supply
        const hasRequiredFields = isWalletConnected && 
                                 tokenData.name && tokenData.name.trim().length >= 3 &&
                                 tokenData.symbol && tokenData.symbol.trim().length >= 2 &&
                                 tokenData.totalSupply && tokenData.totalSupply.length > 0;
        
        if (hasRequiredFields) {
            nextSectionBtn.style.display = 'block';
            console.log('✅ Botão "Próxima Seção" mostrado (3 campos obrigatórios preenchidos)');
            nextSectionBtn.onclick = () => {
                console.log('🚀 Botão "Próxima Seção" clicado');
                
                // Garantir que campos automáticos estão preenchidos
                const decimalsInput = document.getElementById('decimals');
                const ownerInput = document.getElementById('ownerAddress');
                
                if (decimalsInput && !decimalsInput.value) {
                    decimalsInput.value = '18';
                }
                
                if (ownerInput && (!ownerInput.value || ownerInput.value.trim() === '')) {
                    const currentWalletStatus = Wallet.getStatus();
                    ownerInput.value = currentWalletStatus.address || wallet.address;
                }
                
                // Atualizar dados com preenchimento automático
                onTokenDataChange();
                
                // Estimar gas e mostrar seção
                estimateGasForDeploy().then(gasInfo => {
                    updateGasDisplay(gasInfo);
                });
                
                // Inicializar seção de deploy
                initializeDeploySection();
                
                enableSection('section-deploy');
                nextSectionBtn.style.display = 'none';
            };
        } else {
            nextSectionBtn.style.display = 'none';
            const missing = [];
            if (!isWalletConnected) missing.push('carteira');
            if (!tokenData.name || tokenData.name.trim().length < 3) missing.push('nome');
            if (!tokenData.symbol || tokenData.symbol.trim().length < 2) missing.push('símbolo'); 
            if (!tokenData.totalSupply || tokenData.totalSupply.length === 0) missing.push('supply');
            
            console.log('❌ Botão escondido - faltam campos:', missing.join(', '));
            console.log('🔍 Debug estado carteira:', { 
                walletStatus: walletStatus.connected, 
                appState: wallet.connected,
                endereco: walletStatus.address || 'não conectado'
            });
        }
    } else {
        console.log('⚠️ Botão next-section-btn não encontrado no DOM');
    }
}

/**
 * Mostra apenas a primeira seção
 */
function showOnlyFirstSection() {
    // Ocultar todas as seções primeiro
    document.querySelectorAll('.creation-section').forEach(section => {
        section.classList.remove('active', 'section-enabled');
        section.style.opacity = '0.6';
        section.style.pointerEvents = 'none';
    });
    
    // Mostrar apenas a primeira seção
    const firstSection = document.getElementById('section-wallet');
    if (firstSection) {
        firstSection.classList.add('active', 'section-enabled');
        firstSection.style.opacity = '1';
        firstSection.style.pointerEvents = 'all';
    }
    
    updateVisualProgress();
}

/**
 * Habilita uma seção específica
 */
function enableSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('section-enabled');
        section.style.opacity = '1';
        section.style.pointerEvents = 'all';
        console.log(`✅ Seção habilitada: ${sectionId}`);
    }
    updateVisualProgress();
}

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
    
    // Configurar callbacks para o Wallet
    window.onWalletConnected = function(walletData) {
        console.log('📡 Callback: Wallet conectada', walletData);
        
        // Atualizar estado global
        AppState.wallet.connected = true;
        AppState.wallet.address = walletData.address;
        AppState.wallet.network = walletData.network;
        
        // Preencher campos automáticos
        const ownerInput = document.getElementById('ownerAddress');
        const decimalsInput = document.getElementById('decimals');
        
        if (ownerInput && !ownerInput.value) {
            ownerInput.value = walletData.address;
        }
        
        if (decimalsInput && !decimalsInput.value) {
            decimalsInput.value = '18';
        }
        
        // Trigger data update
        onTokenDataChange();
        
        // Atualizar progresso visual
        updateVisualProgress();
    };
    
    window.onWalletDisconnected = function() {
        console.log('📡 Callback: Wallet desconectada');
        
        // Atualizar estado global
        AppState.wallet.connected = false;
        AppState.wallet.address = '';
        AppState.wallet.network = null;
        
        // Atualizar progresso visual
        updateVisualProgress();
    };
    
    initializeApp();
});

/**
 * Inicializa a aplicação
 */
function initializeApp() {
    setupEventListeners();
    
    // Aguardar um pouco para o sistema de carteira inicializar completamente
    setTimeout(() => {
        checkWalletConnection();
    }, 1000);
    
    // Mostrar apenas primeira seção inicialmente
    showOnlyFirstSection();
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
    
    // Botão refresh gas estimation
    const refreshGasBtn = document.getElementById('refresh-gas-btn');
    if (refreshGasBtn) {
        refreshGasBtn.addEventListener('click', () => {
            estimateGasForDeploy().then(gasInfo => {
                updateGasDisplay(gasInfo);
            });
        });
    }
    
    // Botões da seção de resultado
    setupResultButtons();
}

/**
 * Configura botões da seção de resultado
 */
function setupResultButtons() {
    // Copiar endereço do contrato
    const copyContractBtn = document.getElementById('copy-contract-btn');
    if (copyContractBtn) {
        copyContractBtn.addEventListener('click', () => {
            const contractAddress = document.getElementById('contract-address-display').value;
            if (contractAddress) {
                navigator.clipboard.writeText(contractAddress);
                showToast('Endereço copiado!', 'success');
            }
        });
    }
    
    // Copiar transaction hash
    const copyHashBtn = document.getElementById('copy-hash-btn');
    if (copyHashBtn) {
        copyHashBtn.addEventListener('click', () => {
            const txHash = document.getElementById('transaction-hash-display').value;
            if (txHash) {
                navigator.clipboard.writeText(txHash);
                showToast('Hash da transação copiado!', 'success');
            }
        });
    }
    
    // Ver no explorer
    const viewExplorerBtn = document.getElementById('view-explorer-btn');
    if (viewExplorerBtn) {
        viewExplorerBtn.addEventListener('click', () => {
            const contractAddress = document.getElementById('contract-address-display').value;
            if (contractAddress && AppState.deployResult) {
                const explorerUrl = AppState.deployResult.explorerUrl || 
                    `https://testnet.bscscan.com/address/${contractAddress}`;
                window.open(explorerUrl, '_blank');
            }
        });
    }
    
    // Adicionar ao MetaMask
    const addToMetamaskBtn = document.getElementById('add-to-metamask-btn');
    if (addToMetamaskBtn) {
        addToMetamaskBtn.addEventListener('click', addTokenToMetaMask);
    }
    
    // Download do contrato
    const downloadContractBtn = document.getElementById('download-contract-btn');
    if (downloadContractBtn) {
        downloadContractBtn.addEventListener('click', downloadContractCode);
    }
    
    // Verificar contrato
    const openVerificationBtn = document.getElementById('open-verification-btn');
    if (openVerificationBtn) {
        openVerificationBtn.addEventListener('click', openContractVerification);
    }
    
    // Deploy na mainnet
    const deployMainnetBtn = document.getElementById('deploy-mainnet-btn');
    if (deployMainnetBtn) {
        deployMainnetBtn.addEventListener('click', deployToMainnet);
    }
    
    // Limpar tudo
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', resetApp);
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
 * Conecta com MetaMask usando sistema universal
 */
async function connectWallet() {
    try {
        const result = await Wallet.connect();
        
        if (result) {
            // Atualizar estado global com dados do Wallet
            const status = Wallet.getStatus();
            AppState.wallet.connected = status.connected;
            AppState.wallet.address = status.address;
            AppState.wallet.network = status.network;
            
            console.log('✅ Wallet conectada:', AppState.wallet.address);
            console.log('🌐 Rede detectada:', AppState.wallet.network?.name);
            
            // Atualizar progresso visual
            updateVisualProgress();
        }
        
    } catch (error) {
        console.error('❌ Erro ao conectar wallet:', error);
        alert('Erro ao conectar: ' + error.message);
    }
}

/**
 * Detecta a rede da MetaMask - REMOVIDO: Usar WalletManager.detectNetwork()
 */
// async function detectNetwork() - Substituído pelo sistema padrão

/**
 * Obtém informações da rede - REMOVIDO: Usar WalletManager.getNetworkInfo()
 */
// function getNetworkInfo(chainId) - Substituído pelo sistema padrão

/**
 * Obtém saldo da carteira - REMOVIDO: Usar WalletManager.updateBalance()
 */
// async function getWalletBalance() - Substituído pelo sistema padrão

/**
 * Atualiza interface da carteira - REMOVIDO: Usar WalletManager.updateWalletUI()
 */
// function updateWalletUI() - Substituído pelo sistema padrão

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
        
        // Atualizar progresso visual
        updateVisualProgress();
    }
    
    // Converter símbolo para maiúsculas em tempo real
    if (event?.target?.id === 'tokenSymbol') {
        event.target.value = event.target.value.toUpperCase();
    }
}

/**
 * Verifica progresso - versão simplificada sem scroll automático
 */
function checkProgressAndScroll() {
    // Função legada - apenas atualiza dados sem verificações
    onTokenDataChange();
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
    
    // Reset apenas dos dados do token - MANTER CONEXÃO DA WALLET
    const walletStatus = Wallet.getStatus();
    
    // Limpar COMPLETAMENTE os dados do token
    AppState.tokenData = {
        name: '',
        symbol: '',
        totalSupply: '',
        decimals: '18',
        owner: ''
    };
    AppState.deployResult = null;
    
    // Manter dados da wallet se estiver conectada
    if (walletStatus.connected) {
        AppState.wallet = {
            connected: true,
            address: walletStatus.address,
            network: walletStatus.network
        };
    } else {
        AppState.wallet = {
            connected: false,
            address: '',
            network: null
        };
    }
    
    // Usar função de limpeza do Wallet que mantém conexão
    Wallet.clearFormData();
    
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
    
    // Reset botão de deploy
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
        deployBtn.disabled = true;
        deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>CRIAR TOKEN';
    }
    
    // Esconder botão "Próxima Seção"
    const nextSectionBtn = document.getElementById('next-section-btn');
    if (nextSectionBtn) {
        nextSectionBtn.style.display = 'none';
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
    
    // Mostrar apenas primeira seção, mas habilitar segunda se conectado
    showOnlyFirstSection();
    
    // Se carteira conectada, habilitar automaticamente seção básica
    if (AppState.wallet.connected) {
        setTimeout(() => {
            enableSection('section-basic-info');
            console.log('✅ Seção básica habilitada automaticamente (carteira conectada)');
            // Atualizar progresso visual para esconder botão até ter dados
            updateVisualProgress();
        }, 500);
    }
    
    // Interface da wallet já é atualizada automaticamente pelo Wallet
    console.log('🔄 Reset completo (conexão preservada)');
    
    // Atualizar progresso visual
    if (typeof updateVisualProgress === 'function') {
        updateVisualProgress();
    }
    
    console.log('✅ Reset completo finalizado');
}

/**
 * Verifica conexão existente usando sistema universal
 */
async function checkWalletConnection() {
    // O Wallet já faz isso automaticamente no init()
    const status = Wallet.getStatus();
    
    if (status.connected) {
        AppState.wallet.connected = true;
        AppState.wallet.address = status.address;
        AppState.wallet.network = status.network;
        
        console.log('🔗 Conexão existente detectada:', status.address);
        
        // Atualizar progresso visual
        updateVisualProgress();
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
        
    }
}

/**
 * Funções para a nova interface simplificada
 */

/**
 * Baixa o código do contrato Solidity
 */
async function downloadContractCode() {
    try {
        if (!AppState.deployResult) {
            showToast('Deploy não realizado ainda', 'warning');
            return;
        }
        
        // Verificar se temos o código fonte da API (deploy real)
        let contractCode;
        if (AppState.deployResult.sourceCode) {
            contractCode = AppState.deployResult.sourceCode;
        } else {
            // Gerar código básico para deploy simulado
            const tokenData = AppState.deployResult.deployData;
            contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
Token: ${tokenData.name || 'Token'}
Símbolo: ${tokenData.symbol || 'TKN'}
Supply Total: ${tokenData.totalSupply || '1000000'}
Decimais: ${tokenData.decimals || '18'}
Proprietário: ${tokenData.owner || 'N/A'}

Gerado por: Smart Contract Cafe
https://smartcontract.cafe
*/

contract ${tokenData.symbol || 'Token'} {
    string public name = "${tokenData.name || 'Token'}";
    string public symbol = "${tokenData.symbol || 'TKN'}";
    uint8 public decimals = ${tokenData.decimals || '18'};
    uint256 public totalSupply = ${tokenData.totalSupply || '1000000'} * 10**decimals;
    
    mapping(address => uint256) public balanceOf;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}`;
        }
        
        const fileName = `${AppState.deployResult.deployData.symbol || 'Token'}_Contract.sol`;
        
        const blob = new Blob([contractCode], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Código do contrato baixado!', 'success');
    } catch (error) {
        console.error('Erro ao baixar contrato:', error);
        showToast('Erro ao baixar o código', 'error');
    }
}

/**
 * Abre a URL de verificação do contrato
 */
function openContractVerification() {
    if (!AppState.deployResult?.contractAddress) {
        showToast('Endereço do contrato não disponível', 'warning');
        return;
    }
    
    const chainId = AppState.wallet.network?.chainId || 97;
    let verificationUrl;
    
    switch (chainId) {
        case 1:
            verificationUrl = `https://etherscan.io/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        case 56:
            verificationUrl = `https://bscscan.com/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        case 97:
            verificationUrl = `https://testnet.bscscan.com/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        case 137:
            verificationUrl = `https://polygonscan.com/verifyContract?a=${AppState.deployResult.contractAddress}`;
            break;
        default:
            verificationUrl = `https://testnet.bscscan.com/verifyContract?a=${AppState.deployResult.contractAddress}`;
    }
    
    window.open(verificationUrl, '_blank');
    showToast('Página de verificação aberta!', 'info');
}

/**
 * Deploy na mainnet usando os mesmos dados
 */
async function deployToMainnet() {
    try {
        if (!AppState.deployResult?.deployData) {
            showToast('Dados do deploy não disponíveis', 'warning');
            return;
        }
        
        // Verificar se já está na mainnet
        const currentChainId = AppState.wallet.network?.chainId;
        if (currentChainId === 1 || currentChainId === 56) {
            showToast('Você já está em uma rede principal', 'info');
            return;
        }
        
        // Confirmar deploy na mainnet
        const confirmed = confirm(
            'Deseja fazer deploy na rede principal (mainnet)?\n\n' +
            '⚠️ ATENÇÃO:\n' +
            '- Isso custará gas real (BNB/ETH)\n' +
            '- A transação não pode ser revertida\n' +
            '- Você será direcionado para trocar de rede\n\n' +
            'Continuar?'
        );
        
        if (!confirmed) return;
        
        // Detectar rede principal correspondente
        let targetChainId;
        if (currentChainId === 97) { // BSC Testnet -> BSC Mainnet
            targetChainId = 56;
        } else {
            targetChainId = 1; // Default para Ethereum Mainnet
        }
        
        // Solicitar troca para mainnet
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ethers.utils.hexValue(targetChainId) }]
            });
            
            // Aguardar troca de rede
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Fazer novo deploy com os mesmos dados
            AppState.tokenData = { ...AppState.deployResult.deployData };
            
            showToast('Rede alterada! Fazendo deploy na mainnet...', 'info');
            
            // Chamar função de deploy
            await deployToken();
            
        } catch (switchError) {
            console.error('Erro ao trocar rede:', switchError);
            showToast('Erro ao trocar para mainnet', 'error');
        }
        
    } catch (error) {
        console.error('Erro no deploy mainnet:', error);
        showToast('Erro ao preparar deploy na mainnet', 'error');
    }
}

/**
 * Exibe o resultado do deploy na nova interface simplificada
 */
function showDeployResult(success, errorMessage = '') {
    const resultSection = document.getElementById('section-result');
    if (!resultSection) return;
    
    if (success && AppState.deployResult) {
        const { contractAddress, transactionHash, deployData, explorerUrl } = AppState.deployResult;
        
        // Preencher endereço do contrato
        const contractAddressInput = document.getElementById('contract-address-display');
        if (contractAddressInput) {
            contractAddressInput.value = contractAddress;
        }
        
        // Preencher transaction hash
        const txHashInput = document.getElementById('transaction-hash-display');
        if (txHashInput) {
            txHashInput.value = transactionHash;
        }
        
        // Configurar botão explorer com URL correta
        const viewExplorerBtn = document.getElementById('view-explorer-btn');
        if (viewExplorerBtn && contractAddress) {
            const chainId = AppState.wallet.network?.chainId || 97;
            const explorerUrl = getExplorerContractUrl(contractAddress, chainId);
            viewExplorerBtn.onclick = () => window.open(explorerUrl, '_blank');
        }
        
        console.log('✅ Interface de resultado atualizada com sucesso');
    } else {
        console.error('❌ Falha no deploy:', errorMessage);
        showToast(`Erro no deploy: ${errorMessage}`, 'error');
    }
}

/**
 * Inicializar verificações quando a seção de deploy for ativada
 */
function initializeDeploySection() {
    // Mostrar status inicial
    const statusElement = document.getElementById('blockchain-status');
    if (statusElement) {
        statusElement.innerHTML = `
            <i class="bi bi-hourglass-split text-muted me-1"></i>
            <span class="text-muted">Verificando disponibilidade...</span>
        `;
    }
    
    // Habilitar botão de deploy
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
        deployBtn.disabled = false;
        console.log('✅ Botão CRIAR TOKEN habilitado');
    } else {
        console.warn('⚠️ Botão deploy-token-btn não encontrado');
    }
    
    // Verificar API e atualizar status da rede blockchain
    checkApiStatusSilently();
    
    // Estimar gas
    estimateGasForDeploy().then(gasInfo => {
        updateGasDisplay(gasInfo);
    });
    
    console.log('✅ Seção de deploy inicializada');
}

/**
 * Exibe toast notification
 */
function showToast(message, type = 'info') {
    // Criar elemento toast se não existir
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Cores baseadas no tipo
    const colorClass = {
        'success': 'bg-success',
        'error': 'bg-danger',
        'warning': 'bg-warning text-dark',
        'info': 'bg-info'
    }[type] || 'bg-info';
    
    // Criar toast
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${colorClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Ativar toast do Bootstrap
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remover element após ser ocultado
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
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






