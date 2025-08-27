/**
 * ›’ COMPRA DE TOKENS DINá‚MICA - Má“DULO ESPECáFICO
 * 
 * “ RESPONSABILIDADES:
 * - Interface diná¢mica para compra de tokens via MetaMask
 * - Verificaá§á£o de conexá£o e habilitaá§á£o de campos
 * - Leitura diná¢mica de contratos da blockchain
 * - Verificaá§á£o de compatibilidade para compra direta
 * - Cá¡lculo diná¢mico de preá§os e execuá§á£o de transaá§áµes
 * 
 * ”— DEPENDáŠNCIAS:
 * - ethers.js v5.7.2
 * - MetaMaskConnector (shared/metamask-connector.js) - REUTILIZADO
 * - CommonUtils (shared/common-utils.js) - REUTILIZADO
 * - TokenGlobal (shared/token-global.js) - REUTILIZADO
 * 
 * “¤ EXPORTS:
 * - DynamicTokenPurchase: Classe principal
 * - Funá§áµes utilitá¡rias especá­ficas de compra diná¢mica
 */

// ==================== CONFIGURAá‡á•ES ====================

const CONFIG = {
    // Configuraá§áµes diná¢micas (sem contrato fixo)
    defaultTokenPrice: "0.001", // BNB por token (padrá£o)
    supportedChains: [56, 97], // BSC Mainnet e Testnet
    
    // ABI estendido para verificaá§á£o completa e diagná³stico
    tokenABI: [
        // Funá§áµes bá¡sicas ERC-20
        "function balanceOf(address owner) view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function transfer(address to, uint256 amount) returns (bool)",
        
        // Funá§áµes para verificar compra direta (expandido)
        "function buy() payable",
        "function buy(uint256 amount) payable",
        "function buyTokens() payable",
        "function buyTokens(uint256 amount) payable",
        "function purchase() payable",
        "function purchase(uint256 amount) payable",
        
        // Funá§áµes para detectar preá§o (expandido)
        "function tokenPrice() view returns (uint256)",
        "function price() view returns (uint256)",
        "function getPrice() view returns (uint256)",
        "function buyPrice() view returns (uint256)",
        "function tokenCost() view returns (uint256)",
        "function cost() view returns (uint256)",
        "function salePrice() view returns (uint256)",
        "function pricePerToken() view returns (uint256)",
        
        // Funá§áµes para diagná³stico avaná§ado
        "function owner() view returns (address)",
        "function paused() view returns (bool)",
        "function saleActive() view returns (bool)",
        "function saleEnabled() view returns (bool)",
        "function maxPurchase() view returns (uint256)",
        "function minPurchase() view returns (uint256)",
        "function tokensForSale() view returns (uint256)",
        "function tokensAvailable() view returns (uint256)",
        "function isWhitelisted(address) view returns (bool)",
        "function purchaseLimit(address) view returns (uint256)",
        "function hasPurchased(address) view returns (bool)",
        
        // Funá§áµes de cá¡lculo especá­ficas
        "function calculateTokensForEth(uint256 ethAmount) view returns (uint256)",
        "function calculateEthForTokens(uint256 tokenAmount) view returns (uint256)",
        "function getTokensForEth(uint256 ethAmount) view returns (uint256)",
        "function getEthForTokens(uint256 tokenAmount) view returns (uint256)"
    ],
    
    // ABI para contratos de venda (sale contracts)
    saleContractABI: [
        // Funá§áµes para detectar token
        "function token() view returns (address)",
        "function tokenAddress() view returns (address)",
        "function getToken() view returns (address)",
        "function tokenContract() view returns (address)",
        "function saleToken() view returns (address)",
        "function targetToken() view returns (address)",
        "function purchaseToken() view returns (address)",
        "function sellToken() view returns (address)",
        
        // Funá§áµes de compra em contratos de venda
        "function buyTokens() payable",
        "function buyTokens(uint256) payable",
        "function buy() payable",
        "function buy(uint256) payable",
        "function purchase() payable",
        "function purchase(uint256) payable",
        
        // Funá§áµes de informaá§á£o do contrato de venda
        "function tokenPrice() view returns (uint256)",
        "function price() view returns (uint256)",
        "function getPrice() view returns (uint256)",
        "function salePrice() view returns (uint256)",
        "function tokensForSale() view returns (uint256)",
        "function tokensAvailable() view returns (uint256)",
        "function saleActive() view returns (bool)",
        "function saleEnabled() view returns (bool)"
    ],
    
    // Configuraá§áµes de gas
    gasLimit: 200000,
    gasPrice: "5000000000" // 5 gwei
};

// ==================== ESTADO GLOBAL ====================

let currentProvider = null;
let currentSigner = null;
let walletConnected = false;
let walletAddress = '';
let networkData = {};
let currentContract = null;
let currentSaleContract = null;
let selectedTokenIndex = null;
let tokenInfo = {};

// Variá¡veis de controle para evitar execuá§áµes máºltiplas
let walletBalanceLoaded = false;
let providerInitialized = false;
let balanceUpdateInProgress = false;
let buyFunctionName = null;

// ==================== INICIALIZAá‡áƒO ====================

/**
 * Inicializaá§á£o principal
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('›’ Sistema de Compra Diná¢mica iniciado');
    
    // ”’ GARANTIA: Seá§á£o de compra inicia OCULTA atá© validaá§á£o completa
    ensurePurchaseSectionHidden();
    
    initializeWalletConnection();
    setupEventListeners();
    checkInitialWalletState();
});

/**
 * Garante que a seá§á£o de compra inicie oculta
 */
function ensurePurchaseSectionHidden() {
    const section = document.getElementById('purchase-section');
    const purchaseBtn = document.getElementById('execute-purchase-btn');
    const quantityInput = document.getElementById('token-quantity');
    
    if (section) {
        section.style.display = 'none';
    }
    
    if (purchaseBtn) {
        purchaseBtn.disabled = true;
        purchaseBtn.style.opacity = '0.5';
        purchaseBtn.style.cursor = 'not-allowed';
    }
    
    if (quantityInput) {
        quantityInput.disabled = true;
    }
}

/**
 * Verifica estado inicial da wallet (sem tentar conectar)
 */
async function checkInitialWalletState() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Apenas verifica se já¡ está¡ conectado, sem solicitar
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                walletConnected = true;
                await detectNetwork();
                updateWalletUI();
                // Carregar saldo inicial se já¡ conectado (apenas uma vez)
                if (!walletBalanceLoaded) {
                    setTimeout(() => {
                        updateWalletBalance();
                        walletBalanceLoaded = true;
                    }, 800);
                }
            }
        } catch (error) {
            console.log('Wallet ná£o conectada previamente');
        }
    }
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Conexá£o MetaMask
    const connectBtn = document.getElementById('connect-metamask-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    // Verificaá§á£o de contrato
    const verifyBtn = document.getElementById('verify-contract-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyContract);
    }
    
    // Campo de endereá§o do contrato
    const contractInput = document.getElementById('contract-address');
    if (contractInput) {
        contractInput.addEventListener('input', validateContractAddress);
    }
    
    // Campos de compra
    const quantityInput = document.getElementById('token-quantity');
    
    if (quantityInput) {
        quantityInput.addEventListener('input', calculateTotal);
    }
    
    // PREá‡O á‰ READ-ONLY - removido listener pois á© detectado do contrato
    // O campo de preá§o ná£o deve ser editá¡vel pelo usuá¡rio
    
    // Botá£o de compra
    const purchaseBtn = document.getElementById('execute-purchase-btn');
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', executePurchase);
    } else {
        console.error('âŒ Botá£o de compra ná£o encontrado ao configurar listeners');
    }
    
    // Botá£o de limpar dados - SIMPLIFICADO: apenas recarrega a pá¡gina e vai ao topo
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            window.scrollTo(0, 0); // Vai para o topo
            location.reload();
        });
    }
    
    // Botá£o de atualizar saldo
    const refreshBalanceBtn = document.getElementById('refresh-balance-btn');
    if (refreshBalanceBtn) {
        refreshBalanceBtn.addEventListener('click', () => {
            updateWalletBalance();
        });
    }
}

// ==================== INDICADORES DE CARREGAMENTO ====================

/**
 * Mostra indicador de carregamento em um botá£o
 */
function showButtonLoading(buttonId, loadingText = 'Carregando...') {
    const button = document.getElementById(buttonId);
    if (button) {
        button.originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${loadingText}`;
    }
}

/**
 * Remove indicador de carregamento de um botá£o
 */
function hideButtonLoading(buttonId, newText = null) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
        button.innerHTML = newText || button.originalText || button.textContent.replace(/Carregando\.\.\./g, '').trim();
    }
}

/**
 * Mostra indicador de carregamento em uma mensagem
 */
function showLoadingMessage(containerId, message = 'Processando...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-info border-0 mb-3">
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
                    <div>
                        <strong>${message}</strong>
                        <br><small class="text-muted">Aguarde, isso pode levar alguns segundos...</small>
                    </div>
                </div>
            </div>
        `;
    }
}

// ==================== GERENCIAMENTO DE WALLET ====================

/**
 * Conecta com a MetaMask
 */
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask ná£o detectado! Por favor, instale a MetaMask.');
            return;
        }
        
        console.log('”— Conectando com MetaMask...');
        
        // Mostra loading
        showButtonLoading('connect-metamask-btn', 'Conectando...');
        
        // Solicita conexá£o
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            walletAddress = accounts[0];
            walletConnected = true;
            
            // Atualiza UI
            await detectNetwork();
            updateWalletUI();
            
            // Carregar saldo apá³s conectar (apenas uma vez)
            setTimeout(() => {
                updateWalletBalance();
            }, 800);
            
            // Wallet conectada: ${walletAddress}
        }
        
    } catch (error) {
        console.error('âŒ Erro ao conectar wallet:', error);
        alert('Erro ao conectar com a MetaMask: ' + error.message);
        // Restaura botá£o em caso de erro
        hideButtonLoading('connect-metamask-btn', '<i class="bi bi-wallet2 me-2"></i>CONECTAR');
    }
}

/**
 * Atualiza saldo da carteira (com controle de execuá§áµes máºltiplas)
 */
async function updateWalletBalance() {
    // Evitar execuá§áµes máºltiplas simultá¢neas
    if (balanceUpdateInProgress) {
        console.log('â³ Atualizaá§á£o de saldo já¡ em progresso, ignorando...');
        return;
    }
    
    const balanceElement = document.getElementById('wallet-balance-display');
    const balanceContainer = document.getElementById('wallet-balance-info');
    
    if (!walletConnected || !walletAddress) {
        // Esconder seá§á£o se ná£o conectado
        if (balanceContainer) {
            balanceContainer.style.display = 'none';
        }
        return;
    }
    
    if (!balanceElement) {
        console.error('âŒ Elemento wallet-balance-display ná£o encontrado');
        return;
    }
    
    try {
        balanceUpdateInProgress = true;
        // Mostra loading no saldo
        balanceElement.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Carregando...';
        if (balanceContainer) {
            balanceContainer.style.display = 'block';
        }
        
        // Usar provider atual ou inicializar um novo
        let provider = currentProvider;
        if (!provider) {
            // Provider ná£o encontrado, inicializando...
            provider = await initializeProviderWithFallback();
        }
        
        if (!provider) {
            throw new Error('Ná£o foi possá­vel inicializar provider');
        }
        
        // Buscar saldo
        const balance = await provider.getBalance(walletAddress);
        
        const balanceInBNB = ethers.utils.formatEther(balance);
        
        // Formatar para exibiá§á£o
        const formattedBalance = formatNumber(balanceInBNB);
        
        balanceElement.textContent = formattedBalance;
        
        // Mostrar seá§á£o do saldo
        if (balanceContainer) {
            balanceContainer.style.display = 'block';
        }
        
    } catch (error) {
        console.error('âŒ Erro ao buscar saldo da carteira:', error);
        balanceElement.textContent = 'Erro ao carregar';
        
        // Mostrar seá§á£o mesmo com erro
        if (balanceContainer) {
            balanceContainer.style.display = 'block';
        }
    } finally {
        // Libera controle de execuá§á£o máºltipla
        balanceUpdateInProgress = false;
    }
}

/**
 * Atualiza interface da wallet
 */
function updateWalletUI() {
    const statusInput = document.getElementById('wallet-status');
    const connectBtn = document.getElementById('connect-metamask-btn');
    const networkSection = document.getElementById('network-info-section');
    
    if (walletConnected && walletAddress) {
        // Status da wallet - mostrar endereá§o completo
        if (statusInput) {
            statusInput.value = walletAddress;
            statusInput.classList.add('text-success');
        }
        
        // Botá£o conectar
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="bi bi-check-circle"></i> CONECTADO';
            connectBtn.classList.remove('btn-warning');
            connectBtn.classList.add('btn-success');
            connectBtn.disabled = true;
        }
        
        // Mostra info da rede
        if (networkSection) {
            networkSection.style.display = 'block';
        }
        
        // Atualiza saldo da carteira (apenas uma vez)
        updateWalletBalance();
        
        // Habilita seá§á£o de contrato apenas apá³s conexá£o
        enableContractSection();
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
        
        networkData = getNetworkInfo(chainId);
        
        // Atualiza UI da rede
        const currentNetworkSpan = document.getElementById('current-network');
        const chainIdSpan = document.getElementById('chain-id-value');
        
        if (currentNetworkSpan) {
            currentNetworkSpan.textContent = networkData.name;
        }
        
        if (chainIdSpan) {
            chainIdSpan.textContent = networkData.chainId;
        }
        
        // Se carteira já¡ conectada, atualiza saldo ao detectar rede
        if (walletConnected && walletAddress) {
            setTimeout(() => {
                updateWalletBalance();
            }, 500);
        }
        
    } catch (error) {
        console.error('âŒ Erro ao detectar rede:', error);
    }
}

/**
 * Obtá©m informaá§áµes da rede baseado no chainId
 */
function getNetworkInfo(chainId) {
    const networks = {
        '0x38': { name: 'BSC Mainnet', chainId: '56' },
        '0x61': { name: 'BSC Testnet', chainId: '97' },
        '0x1': { name: 'Ethereum Mainnet', chainId: '1' },
        '0x89': { name: 'Polygon Mainnet', chainId: '137' },
        '0xaa36a7': { name: 'Sepolia Testnet', chainId: '11155111' }
    };
    
    return networks[chainId] || { 
        name: 'Rede Desconhecida', 
        chainId: parseInt(chainId, 16).toString() 
    };
}

// ==================== GERENCIAMENTO DE CONTRATO ====================

/**
 * Habilita seá§á£o de contrato apá³s conexá£o
 */
function enableContractSection() {
    // Mostra a seá§á£o de contrato
    const contractSection = document.getElementById('contract-section');
    if (contractSection) {
        contractSection.style.display = 'block';
        
        // Adiciona animaá§á£o de slide down
        contractSection.style.opacity = '0';
        contractSection.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            contractSection.style.transition = 'all 0.3s ease-in-out';
            contractSection.style.opacity = '1';
            contractSection.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Habilita campos
    const contractInput = document.getElementById('contract-address');
    const verifyBtn = document.getElementById('verify-contract-btn');
    
    if (contractInput) {
        contractInput.disabled = false;
        contractInput.placeholder = "0x1234567890123456789012345678901234567890";
        contractInput.classList.add('border-success');
    }
    
    if (verifyBtn) {
        verifyBtn.disabled = false;
    }
}

/**
 * Valida endereá§o do contrato
 */
function validateContractAddress() {
    const contractInput = document.getElementById('contract-address');
    const verifyBtn = document.getElementById('verify-contract-btn');
    
    if (contractInput && verifyBtn) {
        const address = contractInput.value.trim();
        
        // Verifica se á© um endereá§o vá¡lido (42 caracteres, comeá§ando com 0x)
        const isValid = address.length === 42 && address.startsWith('0x');
        
        if (isValid) {
            contractInput.classList.remove('is-invalid');
            contractInput.classList.add('is-valid');
            verifyBtn.disabled = false;
        } else {
            contractInput.classList.remove('is-valid');
            if (address.length > 0) {
                contractInput.classList.add('is-invalid');
            }
            verifyBtn.disabled = true;
        }
    }
}

// ==================== DETECá‡áƒO DE CONTRATOS DE VENDA ====================

// ==================== DETECá‡áƒO DE CONTRATOS DE VENDA ====================

/**
 * Verifica se o contrato tem máºltiplos tokens/sales para escolha
 */
async function checkForMultipleContracts(contractAddress) {
    console.log('” Verificando contratos máºltiplos...');
    
    try {
        // Funá§áµes comuns para arrays de contratos
        const arrayFunctions = [
            'tokens',          // Array de tokens
            'saleTokens',      // Array de tokens em venda
            'availableTokens', // Array de tokens disponá­veis
            'tokenList',       // Lista de tokens
            'contracts',       // Array de contratos
            'saleContracts',   // Array de contratos de venda
            'getTokens',       // Funá§á£o que retorna tokens
            'getAllTokens',    // Funá§á£o que retorna todos os tokens
            'tokenCount'       // Contador de tokens (para iterar)
        ];
        
        // ABI para contratos máºltiplos
        const multiContractABI = [
            "function tokens() view returns (address[])",
            "function saleTokens() view returns (address[])",
            "function availableTokens() view returns (address[])",
            "function tokenList() view returns (address[])",
            "function contracts() view returns (address[])",
            "function saleContracts() view returns (address[])",
            "function getTokens() view returns (address[])",
            "function getAllTokens() view returns (address[])",
            "function tokenCount() view returns (uint256)",
            "function getTokenAt(uint256) view returns (address)",
            "function tokenAt(uint256) view returns (address)",
            "function saleAt(uint256) view returns (address)",
            // Funá§áµes para obter informaá§áµes dos tokens
            "function getTokenInfo(address) view returns (string, string, uint8)",
            "function getTokenPrice(address) view returns (uint256)",
            "function isTokenActive(address) view returns (bool)"
        ];
        
        const multiContract = new ethers.Contract(contractAddress, multiContractABI, currentProvider);
        
        // Testa funá§áµes que retornam arrays
        for (const funcName of arrayFunctions) {
            try {
                if (funcName === 'tokenCount') {
                    // Funá§á£o especial que retorna count
                    const count = await multiContract[funcName]();
                    const tokenCount = parseInt(count.toString());
                    
                    if (tokenCount > 1) {
                        // Encontrados ${tokenCount} tokens via ${funcName}()
                        
                        // Busca os tokens via getTokenAt ou tokenAt
                        const tokens = [];
                        const indexFunctions = ['getTokenAt', 'tokenAt', 'saleAt'];
                        
                        for (const indexFunc of indexFunctions) {
                            try {
                                for (let i = 0; i < Math.min(tokenCount, 10); i++) { // Limite de 10 por seguraná§a
                                    const tokenAddress = await multiContract[indexFunc](i);
                                    if (tokenAddress && ethers.utils.isAddress(tokenAddress)) {
                                        tokens.push(tokenAddress);
                                    }
                                }
                                if (tokens.length > 0) break;
                            } catch (e) {
                                // Funá§á£o ná£o existe, tenta prá³xima
                            }
                        }
                        
                        if (tokens.length > 1) {
                            return await processMultipleTokens(contractAddress, tokens, funcName);
                        }
                    }
                } else {
                    // Funá§áµes que retornam arrays direto
                    const result = await multiContract[funcName]();
                    
                    if (Array.isArray(result) && result.length > 1) {
                        // Encontrados ${result.length} tokens via ${funcName}()
                        const validTokens = result.filter(addr => 
                            addr && ethers.utils.isAddress(addr) && addr !== '0x0000000000000000000000000000000000000000'
                        );
                        
                        if (validTokens.length > 1) {
                            return await processMultipleTokens(contractAddress, validTokens, funcName);
                        }
                    }
                }
            } catch (error) {
                // Funá§á£o ná£o existe ou falhou, continua
                console.log(`âŒ Funá§á£o ${funcName}() ná£o disponá­vel`);
            }
        }
        
        // â„¹ï¸ Ná£o á© um contrato de máºltiplos tokens
        return { isMultiContract: false };
        
    } catch (error) {
        console.error('âŒ Erro ao verificar contratos máºltiplos:', error);
        return { isMultiContract: false };
    }
}

/**
 * Processa máºltiplos tokens encontrados e busca suas informaá§áµes
 */
async function processMultipleTokens(saleContractAddress, tokenAddresses, detectionMethod) {
    console.log(`” Processando ${tokenAddresses.length} tokens encontrados...`);
    
    const tokenOptions = [];
    
    for (let i = 0; i < tokenAddresses.length && i < 5; i++) { // Limite de 5 opá§áµes
        const tokenAddress = tokenAddresses[i];
        
        try {
            // Verifica se á© um contrato vá¡lido
            const code = await currentProvider.getCode(tokenAddress);
            if (code === '0x') continue;
            
            // Tenta buscar informaá§áµes bá¡sicas do token
            const tokenContract = new ethers.Contract(tokenAddress, CONFIG.tokenABI, currentProvider);
            
            let tokenInfo = {
                address: tokenAddress,
                name: 'Token Desconhecido',
                symbol: 'N/A',
                decimals: 18,
                index: i
            };
            
            try {
                const [name, symbol, decimals] = await Promise.all([
                    tokenContract.name().catch(() => `Token ${i + 1}`),
                    tokenContract.symbol().catch(() => 'UNK'),
                    tokenContract.decimals().catch(() => 18)
                ]);
                
                tokenInfo.name = name;
                tokenInfo.symbol = symbol;
                tokenInfo.decimals = parseInt(decimals);
            } catch (e) {
                // âš ï¸ Ná£o foi possá­vel obter info completa do token ${i + 1}
            }
            
            // Tenta obter preá§o se o contrato principal tiver funá§á£o
            try {
                const multiContract = new ethers.Contract(saleContractAddress, [
                    "function getTokenPrice(address) view returns (uint256)"
                ], currentProvider);
                
                const price = await multiContract.getTokenPrice(tokenAddress);
                tokenInfo.price = ethers.utils.formatEther(price);
            } catch (e) {
                tokenInfo.price = 'N/A';
            }
            
            tokenOptions.push(tokenInfo);
            // Token ${i + 1}: ${tokenInfo.name} (${tokenInfo.symbol}) - ${tokenAddress.slice(0,6)}...${tokenAddress.slice(-4)}
            
        } catch (error) {
            console.log(`âŒ Erro ao processar token ${i + 1}: ${error.message}`);
        }
    }
    
    if (tokenOptions.length > 1) {
        return {
            isMultiContract: true,
            isSaleContract: false, // Será¡ definido apá³s seleá§á£o
            saleContractAddress: saleContractAddress,
            tokenOptions: tokenOptions,
            detectionMethod: detectionMethod
        };
    }
    
    return { isMultiContract: false };
}

/**
 * Mostra interface para seleá§á£o de token em contratos máºltiplos
 */
async function showTokenSelector(multiContractInfo) {
    const contractMessages = document.getElementById('contract-messages');
    if (!contractMessages) return;
    
    let selectorHTML = `
        <div class="alert alert-info border-0 mb-3">
            <h6 class="mb-3">
                <i class="bi bi-list-check me-2"></i>
                <strong>Selecione o Token para Compra</strong>
            </h6>
            <p class="small mb-3">
                Este contrato oferece máºltiplos tokens. Escolha qual vocáª deseja comprar:
            </p>
    `;
    
    multiContractInfo.tokenOptions.forEach((token, index) => {
        selectorHTML += `
            <div class="token-option mb-2 p-3 bg-dark border border-secondary rounded" 
                 style="cursor: pointer;" 
                 onclick="selectToken('${token.address}', ${index}, '${multiContractInfo.saleContractAddress}')">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="fw-bold text-white">${token.name} (${token.symbol})</div>
                        <div class="small text-muted">
                            <i class="bi bi-hash me-1"></i>${token.address.slice(0,8)}...${token.address.slice(-6)}
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="small text-info">
                            ${token.price !== 'N/A' ? `’° ${token.price} BNB` : '’° Preá§o: A definir'}
                        </div>
                        <button class="btn btn-sm btn-outline-primary mt-1">
                            <i class="bi bi-check-circle me-1"></i>Selecionar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    selectorHTML += `
        </div>
        <style>
            .token-option:hover {
                border-color: #0d6efd !important;
                transform: translateY(-1px);
                transition: all 0.2s ease;
            }
        </style>
    `;
    
    contractMessages.innerHTML = selectorHTML;
    
    // Oculta botá£o de verificar atá© seleá§á£o
    const verifyBtn = document.getElementById('verify-contract-btn');
    if (verifyBtn) {
        verifyBtn.style.display = 'none';
    }
}

/**
 * Funá§á£o global para seleá§á£o de token (chamada pelo onclick)
 */
window.selectToken = async function(tokenAddress, tokenIndex, saleContractAddress) {
    // Token selecionado: ${tokenAddress} (á­ndice ${tokenIndex})
    
    // Mostra loading
    showLoadingMessage('contract-messages', 'Carregando token selecionado');
    
    try {
        // Configura contratos
        CONFIG.contractAddress = tokenAddress;
        CONFIG.saleContractAddress = saleContractAddress;
        CONFIG.selectedTokenIndex = tokenIndex;
        
        // Criar instá¢ncia do token selecionado
        currentContract = new ethers.Contract(tokenAddress, CONFIG.tokenABI, currentProvider);
        // Criar instá¢ncia do contrato de venda
        currentSaleContract = new ethers.Contract(saleContractAddress, CONFIG.saleContractABI, currentProvider);
        
        addContractMessage(`… Token selecionado: ${tokenAddress.slice(0,8)}...${tokenAddress.slice(-6)}`, 'success');
        addContractMessage('”„ Verificando token selecionado...', 'info');
        
        // Continua verificaá§á£o normal
        await verifyERC20Functions();
        await verifyBuyFunctions();
        await loadTokenInfo();
        showTokenInfo();
        
        addContractMessage('Ž‰ Token verificado e pronto para compra!', 'success');
        
        // Restaura botá£o de verificar
        const verifyBtn = document.getElementById('verify-contract-btn');
        if (verifyBtn) {
            verifyBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('âŒ Erro ao processar token selecionado:', error);
        addContractMessage(`âŒ Erro ao carregar token: ${error.message}`, 'error');
    } finally {
        hideButtonLoading('verify-contract-btn', 'VERIFICAR CONTRATO');
    }
};

/**
 * Verifica se o contrato informado á© um contrato de venda que aponta para outro token
 */
async function checkIfSaleContract(contractAddress) {
    console.log('” Verificando se á© contrato de venda...');
    
    try {
        // Lista de funá§áµes comuns em contratos de venda para detectar o token
        const tokenFunctions = [
            'token',           // Mais comum
            'tokenAddress',    // Comum
            'getToken',        // Alternativa
            'tokenContract',   // Alternativa
            'saleToken',       // Especá­fico para sales
            'targetToken',     // Especá­fico
            'purchaseToken',   // Especá­fico
            'sellToken'        // Especá­fico
        ];
        
        // ABI bá¡sico para contratos de venda
        const saleContractABI = [
            "function token() view returns (address)",
            "function tokenAddress() view returns (address)",
            "function getToken() view returns (address)",
            "function tokenContract() view returns (address)",
            "function saleToken() view returns (address)",
            "function targetToken() view returns (address)",
            "function purchaseToken() view returns (address)",
            "function sellToken() view returns (address)",
            // Funá§áµes de compra comuns em contratos de venda
            "function buyTokens() payable",
            "function buyTokens(uint256) payable",
            "function buy() payable",
            "function buy(uint256) payable",
            "function purchase() payable",
            "function purchase(uint256) payable"
        ];
        
        const saleContract = new ethers.Contract(contractAddress, CONFIG.saleContractABI, currentProvider);
        
        // Tenta encontrar o endereá§o do token atravá©s das funá§áµes comuns
        for (const funcName of tokenFunctions) {
            try {
                const tokenAddress = await saleContract[funcName]();
                
                if (tokenAddress && ethers.utils.isAddress(tokenAddress) && tokenAddress !== '0x0000000000000000000000000000000000000000') {
                    // Token encontrado via ${funcName}(): ${tokenAddress}
                    
                    // Verifica se o endereá§o do token á© diferente do contrato de venda
                    if (tokenAddress.toLowerCase() !== contractAddress.toLowerCase()) {
                        // Verifica se o endereá§o do token realmente tem um contrato
                        const tokenCode = await currentProvider.getCode(tokenAddress);
                        if (tokenCode !== '0x') {
                            // Contrato de venda confirmado! Token real: ${tokenAddress}
                            return {
                                isSaleContract: true,
                                tokenAddress: tokenAddress,
                                saleContractAddress: contractAddress,
                                tokenFunction: funcName
                            };
                        }
                    }
                }
            } catch (error) {
                // Funá§á£o ná£o existe ou falhou, continua tentando
            }
        }
        
        // â„¹ï¸ Ná£o á© um contrato de venda - á© o prá³prio token
        return {
            isSaleContract: false,
            tokenAddress: contractAddress,
            saleContractAddress: null,
            tokenFunction: null
        };
        
    } catch (error) {
        console.error('âŒ Erro ao verificar contrato de venda:', error);
        return {
            isSaleContract: false,
            tokenAddress: contractAddress,
            saleContractAddress: null,
            tokenFunction: null
        };
    }
}

/**
 * Verifica o contrato na blockchain
 */
async function verifyContract() {
    const contractInput = document.getElementById('contract-address');
    const contractAddress = contractInput.value.trim();
    
    if (!contractAddress) {
        alert('Por favor, digite o endereá§o do contrato');
        return;
    }
    
    if (!ethers.utils.isAddress(contractAddress)) {
        alert('Endereá§o do contrato invá¡lido. Verifique o formato.');
        return;
    }
    
    try {
        // Mostra loading
        showButtonLoading('verify-contract-btn', 'Verificando...');
        updateVerifyButton(true);
        clearContractMessages();
        hideTokenInfo();
        
        showLoadingMessage('contract-messages', 'Verificando contrato inteligente');
        
        // Inicializa provider com fallback para resolver problemas de RPC
        addContractMessage('âš™ï¸ Inicializando conexá£o blockchain...', 'info');
        currentProvider = await initializeProviderWithFallback();
        currentSigner = currentProvider.getSigner();
        
        // **MELHORIA 1: Verificaá§á£o robusta se contrato existe**
        addContractMessage('” Verificando se á© um smart contract...', 'info');
        const code = await currentProvider.getCode(contractAddress);
        if (code === '0x') {
            // Log do erro para suporte
            window.contractLogger.logContractError(contractAddress, 'CONTRACT_NOT_FOUND', {
                message: 'Nenhum cá³digo encontrado no endereá§o',
                code: code,
                network: networkData.chainId || 'desconhecida'
            });
            window.contractLogger.showDownloadButton();
            
            throw new Error('Contrato ná£o existe neste endereá§o. Verifique se foi deployado corretamente.');
        }
        
        addContractMessage(`… Contrato detectado no endereá§o: ${contractAddress.slice(0,6)}...${contractAddress.slice(-4)}`, 'success');
        
        // **NOVA FUNCIONALIDADE: Verificar se á© um contrato de venda**
        const saleContractInfo = await checkIfSaleContract(contractAddress);
        
        if (saleContractInfo.isSaleContract) {
            addContractMessage('Ž¯ Contrato de venda detectado!', 'info');
            addContractMessage(`“ Token real: ${saleContractInfo.tokenAddress.slice(0,6)}...${saleContractInfo.tokenAddress.slice(-4)}`, 'info');
            
            // Usar o endereá§o do token real para as prá³ximas verificaá§áµes
            CONFIG.contractAddress = saleContractInfo.tokenAddress;
            CONFIG.saleContractAddress = contractAddress; // Guardar endereá§o do contrato de venda
            
            // Criar instá¢ncia do token real
            currentContract = new ethers.Contract(saleContractInfo.tokenAddress, CONFIG.tokenABI, currentProvider);
            // Criar instá¢ncia do contrato de venda para compras
            currentSaleContract = new ethers.Contract(contractAddress, CONFIG.saleContractABI, currentProvider);
            
            addContractMessage('”„ Verificando token real do contrato de venda...', 'info');
        } else {
            // Armazena endereá§o validado
            CONFIG.contractAddress = contractAddress;
            // **MELHORIA 2: Criar instá¢ncia do contrato**
            currentContract = new ethers.Contract(contractAddress, CONFIG.tokenABI, currentProvider);
        }
        
        // **MELHORIA 3: Verificar funá§áµes bá¡sicas ERC-20 com melhor tratamento de erro**
        await verifyERC20Functions();
        
        // Verifica funá§áµes de compra
        await verifyBuyFunctions();
        
        // Mostra informaá§áµes do token
        await loadTokenInfo();
        showTokenInfo();
        
        addContractMessage('Ž‰ Contrato verificado com sucesso!', 'success');
    }     
    
    catch (error) {
        console.error('âŒ Erro ao verificar contrato:', error);
        
        // Log geral de erro de verificaá§á£o para suporte
        window.contractLogger.logContractError(contractAddress, 'VERIFICATION_FAILED', {
            error: error.message,
            stack: error.stack,
            code: error.code,
            isRPCError: error.message?.includes('JSON-RPC') || error.code === -32603,
            contractAddress: contractAddress,
            providerType: currentProvider ? 'available' : 'unavailable'
        });
        window.contractLogger.showDownloadButton();
        
        // Se for erro de RPC, oferece alternativa
        if (error.message?.includes('JSON-RPC') || error.code === -32603) {
            addContractMessage('âš ï¸ Problema de conectividade detectado', 'warning');
            addContractMessage('”„ Tentando com provider alternativo...', 'info');
            
            try {
                await retryWithFallbackProvider(contractAddress);
            } catch (fallbackError) {
                addContractMessage(`âŒ Erro mesmo com provider alternativo: ${fallbackError.message}`, 'error');
            }
        } else {
            addContractMessage(`âŒ Erro: ${error.message}`, 'error');
        }
    } finally {
        hideButtonLoading('verify-contract-btn', 'VERIFICAR CONTRATO');
        updateVerifyButton(false);
    }
}

/**
 * Verifica funá§áµes bá¡sicas ERC-20 com melhor diagná³stico
 */
async function verifyERC20Functions() {
    addContractMessage('“ Verificando ERC-20...', 'info');
    
    try {
        // **MELHORIA: Verificar cada funá§á£o individualmente para melhor diagná³stico**
        const name = await currentContract.name();
        const symbol = await currentContract.symbol(); 
        const decimals = await currentContract.decimals();
        const totalSupply = await currentContract.totalSupply();
        
        // Armazenar informaá§áµes do token
        tokenInfo = {
            name,
            symbol,
            decimals: parseInt(decimals),
            totalSupply: totalSupply.toString()
        };
        
        updateCompatibilityStatus('erc20Status', '… Suportado', 'success');
        updateCompatibilityStatus('transferStatus', '… Disponá­vel', 'success');
        addContractMessage(`… Token: ${name} (${symbol})`, 'success');
        
        // Log de sucesso da validaá§á£o
        window.contractLogger.logContractValidation(currentContract.address, {
            isERC20: true,
            tokenInfo: { name, symbol, decimals: parseInt(decimals) },
            errors: []
        });
        
    } catch (error) {
        updateCompatibilityStatus('erc20Status', 'âŒ Ná£o suportado', 'error');
        updateCompatibilityStatus('transferStatus', 'âŒ Indisponá­vel', 'error');
        addContractMessage(`âŒ Token ná£o suportado`, 'error');
        
        // Log do erro ERC-20 para suporte
        window.contractLogger.logContractError(currentContract.address, 'ERC20_VALIDATION_FAILED', {
            error: error.message,
            stack: error.stack,
            attemptedFunctions: ['name', 'symbol', 'decimals', 'totalSupply']
        });
        window.contractLogger.showDownloadButton();
        
        throw new Error('Contrato ná£o á© ERC-20 compatá­vel');
    }
}

/**
 * ” DIAGNá“STICO PROFUNDO: Identifica exatamente por que o contrato rejeita transaá§áµes
 */
async function performDeepContractAnalysis(contractAddress, buyFunctionName) {
    console.log('”¬ INICIANDO DIAGNá“STICO PROFUNDO DO CONTRATO...');
    
    try {
        // 1. Verificaá§áµes bá¡sicas do estado do contrato
        const basicChecks = await performBasicContractChecks();
        
        // 2. Testa diferentes cená¡rios de chamada
        const callTests = await performCallTests(buyFunctionName);
        
        // 3. Analisa condiá§áµes especá­ficas
        const conditions = await analyzeContractConditions();
        
        // 4. Gera relatá³rio final
        const isReady = generateReadinessReport(basicChecks, callTests, conditions);
        
        return isReady;
        
    } catch (error) {
        console.log('âŒ Erro no diagná³stico profundo:', error.message);
        return false;
    }
}

/**
 * 1ï¸âƒ£ Verificaá§áµes bá¡sicas do estado do contrato
 */
async function performBasicContractChecks() {
    // 1ï¸âƒ£ Verificaá§áµes bá¡sicas do estado...
    
    const checks = {
        contractExists: false,
        hasTokens: false,
        hasBalance: false,
        isPaused: null,
        saleActive: null,
        owner: null
    };
    
    try {
        // Verifica se o contrato existe
        const code = await currentProvider.getCode(CONFIG.contractAddress);
        checks.contractExists = code !== '0x';
        console.log(`“‹ Contrato existe: ${checks.contractExists}`);
        
        // Verifica tokens no contrato
        try {
            const tokenBalance = await currentContract.balanceOf(CONFIG.contractAddress);
            const tokens = parseFloat(ethers.utils.formatUnits(tokenBalance, tokenInfo.decimals || 18));
            checks.hasTokens = tokens > 0;
            console.log(`“‹ Tokens no contrato: ${tokens} (${checks.hasTokens ? 'OK' : 'ZERO'})`);
        } catch (e) {
            // “‹ Ná£o foi possá­vel verificar tokens no contrato
        }
        
        // Verifica se está¡ pausado
        try {
            checks.isPaused = await currentContract.paused();
            console.log(`“‹ Contrato pausado: ${checks.isPaused}`);
        } catch (e) {
            console.log('“‹ Funá§á£o paused() ná£o disponá­vel');
        }
        
        // Verifica se venda está¡ ativa
        const saleChecks = ['saleActive', 'saleEnabled', 'isActive', 'enabled'];
        for (const funcName of saleChecks) {
            try {
                checks.saleActive = await currentContract[funcName]();
                console.log(`“‹ ${funcName}(): ${checks.saleActive}`);
                break;
            } catch (e) {
                // Funá§á£o ná£o existe
            }
        }
        
        // Verifica owner
        try {
            checks.owner = await currentContract.owner();
            console.log(`“‹ Owner: ${checks.owner}`);
        } catch (e) {
            console.log('“‹ Funá§á£o owner() ná£o disponá­vel');
        }
        
        return checks;
        
    } catch (error) {
        console.log('âŒ Erro nas verificaá§áµes bá¡sicas:', error.message);
        return checks;
    }
}

/**
 * 2ï¸âƒ£ Testa diferentes cená¡rios de chamada
 */
async function performCallTests(buyFunctionName) {
    // 2ï¸âƒ£ Testando cená¡rios de chamada...
    
    const tests = {
        withoutValue: false,
        withSmallValue: false,
        withCorrectPrice: false,
        withParameters: false,
        gasEstimation: null
    };
    
    try {
        // Teste 1: Sem valor (para verificar se funá§á£o á© realmente payable)
        try {
            await currentContract.callStatic[buyFunctionName]();
            tests.withoutValue = true;
            // Teste sem valor: PASSOU (funá§á£o pode ná£o ser payable)
        } catch (e) {
            console.log(`âŒ Sem valor: ${e.reason || e.message}`);
        }
        
        // Teste 2: Com valor pequeno
        try {
            await currentContract.callStatic[buyFunctionName]({ value: ethers.utils.parseEther('0.001') });
            tests.withSmallValue = true;
            // Teste valor pequeno: PASSOU
        } catch (e) {
            console.log(`âŒ Valor pequeno: ${e.reason || e.message}`);
        }
        
        // Teste 3: Tentativa de estimativa de gas
        try {
            tests.gasEstimation = await currentContract.estimateGas[buyFunctionName]({ value: ethers.utils.parseEther('0.001') });
            console.log(`“‹ Estimativa de gas: ${tests.gasEstimation.toString()}`);
        } catch (e) {
            console.log(`âŒ Estimativa de gas: ${e.reason || e.message}`);
        }
        
        return tests;
        
    } catch (error) {
        console.log('âŒ Erro nos testes de chamada:', error.message);
        return tests;
    }
}

/**
 * 3ï¸âƒ£ Analisa condiá§áµes especá­ficas do contrato
 */
async function analyzeContractConditions() {
    console.log('” 3ï¸âƒ£ Analisando condiá§áµes especá­ficas...');
    
    const conditions = {
        hasWhitelist: false,
        hasMinMax: false,
        hasCooldown: false,
        requiresApproval: false
    };
    
    try {
        // Verifica whitelist
        try {
            await currentContract.isWhitelisted(walletAddress);
            conditions.hasWhitelist = true;
            console.log('“‹ Contrato usa whitelist');
        } catch (e) {
            console.log('“‹ Contrato ná£o usa whitelist');
        }
        
        // Verifica limites
        const limitFunctions = ['minPurchase', 'maxPurchase', 'purchaseLimit'];
        for (const func of limitFunctions) {
            try {
                const limit = await currentContract[func](walletAddress || '0x0000000000000000000000000000000000000000');
                if (limit.gt(0)) {
                    conditions.hasMinMax = true;
                    console.log(`“‹ ${func}: ${ethers.utils.formatEther(limit)} BNB`);
                }
            } catch (e) {
                // Funá§á£o ná£o existe
            }
        }
        
        return conditions;
        
    } catch (error) {
        console.log('âŒ Erro na aná¡lise de condiá§áµes:', error.message);
        return conditions;
    }
}

/**
 * 4ï¸âƒ£ Gera relatá³rio final de prontidá£o
 */
function generateReadinessReport(basicChecks, callTests, conditions) {
    // 4ï¸âƒ£ Gerando relatá³rio de prontidá£o...
    
    let score = 0;
    let maxScore = 0;
    const issues = [];
    
    // Avaliaá§á£o bá¡sica
    maxScore += 10;
    if (basicChecks.contractExists) score += 10;
    else issues.push('âŒ CRáTICO: Contrato ná£o existe no endereá§o informado');
    
    // Avaliaá§á£o de estado
    if (basicChecks.isPaused === true) {
        issues.push('âš ï¸ BLOQUEADOR: Contrato está¡ PAUSADO');
    } else if (basicChecks.isPaused === false) {
        score += 5;
    }
    maxScore += 5;
    
    if (basicChecks.saleActive === true) {
        score += 5;
    } else if (basicChecks.saleActive === false) {
        issues.push('âš ï¸ BLOQUEADOR: Venda ná£o está¡ ATIVA');
    }
    maxScore += 5;
    
    // Avaliaá§á£o de tokens
    if (basicChecks.hasTokens) {
        score += 3;
    } else {
        issues.push('âš ï¸ AVISO: Contrato ná£o tem tokens (pode usar mint)');
    }
    maxScore += 3;
    
    // Avaliaá§á£o de testes
    if (callTests.withoutValue || callTests.withSmallValue) {
        score += 7;
    } else {
        issues.push('âŒ CRáTICO: Funá§á£o ná£o aceita chamadas de teste');
    }
    maxScore += 7;
    
    const readinessPercent = Math.round((score / maxScore) * 100);
    const isReady = score >= (maxScore * 0.7); // 70% de prontidá£o má­nima
    
    console.log(`“Š RELATá“RIO DE PRONTIDáƒO: ${readinessPercent}% (${score}/${maxScore})`);
    console.log(`Ž¯ Status: ${isReady ? '… PRONTO PARA NEGOCIAá‡áƒO' : 'âŒ NáƒO PRONTO'}`);
    
    if (issues.length > 0) {
        console.log('š¨ PROBLEMAS IDENTIFICADOS:');
        issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    // Atualiza UI com o resultado
    updateReadinessUI(readinessPercent, isReady, issues);
    
    return isReady;
}

/**
 * Ž¯ Atualiza UI com resultado da aná¡lise de prontidá£o
 */
function updateReadinessUI(readinessPercent, isReady, issues) {
    // Cria ou atualiza seá§á£o de status de prontidá£o
    let readinessSection = document.getElementById('readiness-status');
    if (!readinessSection) {
        // Cria seá§á£o se ná£o existe
        const contractSection = document.querySelector('#contract-section .card-body');
        if (contractSection) {
            readinessSection = document.createElement('div');
            readinessSection.id = 'readiness-status';
            readinessSection.className = 'mt-3 p-3 border rounded';
            contractSection.appendChild(readinessSection);
        }
    }
    
    if (readinessSection) {
        const statusColor = isReady ? 'success' : 'danger';
        const statusIcon = isReady ? '…' : 'âŒ';
        const statusText = isReady ? 'PRONTO PARA NEGOCIAá‡áƒO' : 'PROBLEMAS IDENTIFICADOS';
        
        readinessSection.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <div class="flex-grow-1">
                    <h6 class="text-${statusColor} mb-0">${statusIcon} Status de Prontidá£o: ${readinessPercent}%</h6>
                    <small class="text-${statusColor}">${statusText}</small>
                </div>
                <div class="progress" style="width: 120px; height: 8px;">
                    <div class="progress-bar bg-${statusColor}" style="width: ${readinessPercent}%"></div>
                </div>
            </div>
            ${issues.length > 0 ? `
                <div class="alert alert-warning alert-sm mb-0">
                    <small><strong>Problemas encontrados:</strong></small>
                    <ul class="mb-0 mt-1" style="font-size: 0.875em;">
                        ${issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        readinessSection.className = `mt-3 p-3 border border-${statusColor} rounded bg-${statusColor} bg-opacity-10`;
    }
}

async function testActualPayableFunctions() {
    // TESTE DIRETO: Validando funá§áµes PAYABLE do ABI...
    
    let contractReady = false;
    
    try {
        const contractInterface = currentContract.interface;
        const allFunctions = Object.keys(contractInterface.functions);
        
        // Filtra apenas funá§áµes PAYABLE que existem no ABI
        const payableFunctions = allFunctions.filter(funcName => {
            const fragment = contractInterface.functions[funcName];
            return fragment.payable;
        });
        
        console.log(`’° Encontradas ${payableFunctions.length} funá§áµes PAYABLE no ABI:`);
        // payableFunctions.forEach(func => console.log(`   ’¡ ${func}`));
        
        if (payableFunctions.length === 0) {
            console.log('âŒ Nenhuma funá§á£o PAYABLE encontrada no ABI!');
            return false;
        }
        
        // Testa cada funá§á£o PAYABLE com estimateGas
        for (const funcName of payableFunctions) {
            try {
                // Testando funá§á£o PAYABLE: ${funcName}()
                
                const fragment = contractInterface.functions[funcName];
                const testValue = ethers.utils.parseEther('0.001');
                
                // Monta pará¢metros baseado nos inputs da funá§á£o
                const testParams = fragment.inputs.map(input => {
                    switch(input.type) {
                        case 'uint256': return '1000'; // Quantidade de teste
                        case 'address': return walletAddress || '0x0000000000000000000000000000000000000000';
                        case 'bool': return true;
                        default: return '0';
                    }
                });
                
                // Se ná£o tem pará¢metros, usa sá³ o value
                if (testParams.length === 0) {
                    await currentContract.estimateGas[funcName]({ value: testValue });
                } else {
                    await currentContract.estimateGas[funcName](...testParams, { value: testValue });
                }
                
                // SUCESSO! Funá§á£o ${funcName}() á© vá¡lida e funcional!
                
                // **VALIDAá‡áƒO EXTRA: Testa callStatic tambá©m**
                try {
                    if (testParams.length === 0) {
                        await currentContract.callStatic[funcName]({ value: testValue });
                    } else {
                        await currentContract.callStatic[funcName](...testParams, { value: testValue });
                    }
                    // CONFIRMADO! ${funcName}() passou tambá©m no callStatic!
                } catch (staticError) {
                    if (staticError.message.includes('revert') || staticError.message.includes('execution reverted')) {
                        console.log(`âš ï¸ ${funcName}() Funá§á£o de reverte com pará¢metros existe!`);
                    } else {
                        console.log(`âŒ ${funcName}() falhou no callStatic: ${staticError.message}`);
                        continue; // Pula esta funá§á£o
                    }
                }
                
                buyFunctionName = funcName;
                contractReady = true;
                updateCompatibilityStatus('buyStatus', '… Disponá­vel', 'success');
                addContractMessage(`… Funá§á£o de compra totalmente validada`, 'success');
                
                // Habilita seá§á£o de compra diretamente
                enablePurchaseSection();
                
                return contractReady;
                
            } catch (error) {
                // **MUDANá‡A CRáTICA: Considerar REVERT como funá§á£o VáLIDA**
                if (error.code === 'UNPREDICTABLE_GAS_LIMIT' || 
                    error.message.includes('execution reverted') || 
                    error.message.includes('revert')) {
                    
                    console.log(`… FUNá‡áƒO VáLIDA! ${funcName}() existe e reverte (comportamento esperado)`);
                    console.log(`“ Motivo do revert: ${error.reason || error.message}`);
                    
                    // Funá§á£o existe, apenas reverte com pará¢metros de teste
                    buyFunctionName = funcName;
                    updateCompatibilityStatus('buyStatus', '… Disponá­vel', 'success');
                    addContractMessage(`… Funá§á£o de compra detectada`, 'success');
                    
                    // Habilita seá§á£o de compra diretamente
                    enablePurchaseSection();
                    return true;
                } else {
                    console.log(`âŒ Funá§á£o ${funcName}() falhou: ${error.message}`);
                }
            }
        }
        
        console.log('âŒ Nenhuma funá§á£o PAYABLE funcionou corretamente');
        return false;
        
    } catch (error) {
        console.log('âŒ Erro ao testar funá§áµes PAYABLE:', error.message);
        return false;
    }
}

/**
 * Investigaá§á£o adicional: consulta ABI via Etherscan para contrato ná£o-padrá£o
 */
async function investigateContractViaEtherscan(contractAddress) {
    try {
        console.log('” Investigando contrato via Etherscan API...');
        
        // Tenta pegar ABI completo do Etherscan
        const apiKey = 'YourApiKeyToken'; // Vamos tentar sem API key primeiro
        const etherscanUrl = `https://api.bscscan.com/api?module=contract&action=getabi&address=${contractAddress}`;
        
        console.log('Œ URL da consulta:', etherscanUrl);
        
        const response = await fetch(etherscanUrl);
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
            const abi = JSON.parse(data.result);
            console.log('“‹ ABI completo obtido do Etherscan:');
            
            // Filtra apenas funá§áµes
            const functions = abi.filter(item => item.type === 'function');
            const payableFunctions = functions.filter(func => func.stateMutability === 'payable');
            
            console.log(`“Š Estatá­sticas do contrato:`);
            console.log(`   “Œ Total de funá§áµes: ${functions.length}`);
            console.log(`   ’° Funá§áµes payable: ${payableFunctions.length}`);
            
            if (payableFunctions.length > 0) {
                console.log('’° Funá§áµes PAYABLE encontradas (possá­veis compras):');
                // payableFunctions.forEach(func => {
                //     const inputs = func.inputs.map(i => `${i.type} ${i.name}`).join(', ');
                //     console.log(`   Ž¯ ${func.name}(${inputs})`);
                // });
                
                // Testa a primeira funá§á£o payable
                const firstPayable = payableFunctions[0];
                // Testando primeira funá§á£o payable: ${firstPayable.name}()
                
                try {
                    // Monta pará¢metros bá¡sicos baseado nos inputs esperados
                    const testParams = firstPayable.inputs.map(input => {
                        switch(input.type) {
                            case 'uint256': return '1000';
                            case 'address': return walletAddress || '0x0000000000000000000000000000000000000000';
                            case 'bool': return true;
                            default: return '0';
                        }
                    });
                    
                    // Se a funá§á£o á© payable, adiciona value
                    const callOptions = { value: ethers.utils.parseEther('0.001') };
                    
                    await currentContract.estimateGas[firstPayable.name](...testParams, callOptions);
                    
                    console.log(`… SUCESSO! Funá§á£o ${firstPayable.name}() funciona!`);
                    buyFunctionName = firstPayable.name;
                    updateCompatibilityStatus('buyStatus', '… Disponá­vel', 'success');
                    addContractMessage(`… Funá§á£o de compra "${firstPayable.name}" encontrada via Etherscan`, 'success');
                    return true;
                    
                } catch (testError) {
                    console.log(`âŒ Funá§á£o ${firstPayable.name}() rejeitou teste:`, testError.message);
                }
            }
        }
        
    } catch (error) {
        console.log('âŒ Erro na investigaá§á£o via Etherscan:', error.message);
    }
    
    return false;
}

/**
 * Verifica funá§áµes de compra disponá­veis
 */
async function verifyBuyFunctions() {
    let priceFunctionName = null; // Adicionar declaraá§á£o da variá¡vel
    
    const buyFunctions = [
        'buy', 'buyTokens', 'purchase', 
        'buyWithBNB', 'mint', 'swap',
        'exchange', 'buyToken'
    ];
    
    addContractMessage('ï¿½ Funá§á£o de compra...', 'info');
    
    for (const funcName of buyFunctions) {
        try {
            // **MELHORIA: Usar valor baseado nos limites detectados, como no teste**
            let testValue = ethers.utils.parseEther('0.001'); // Valor padrá£o
            
            // Se temos limites detectados, usar o valor má­nimo + margem
            if (tokenInfo.limits && tokenInfo.limits.minPurchase && tokenInfo.limits.minPurchase.gt(0)) {
                testValue = tokenInfo.limits.minPurchase;
                console.log(`“ Usando valor má­nimo do contrato: ${ethers.utils.formatEther(testValue)} BNB`);
            }
            
            // Prepara pará¢metros baseado no tipo da funá§á£o
            let gasEstimateParams;
            switch(funcName) {
                case 'mint':
                    // Para mint, testa com address e amount
                    gasEstimateParams = [walletAddress, '1000'];
                    break;
                case 'swap':
                    // Para swap, testa troca bá¡sica
                    gasEstimateParams = ['0x0000000000000000000000000000000000000000', '1000'];
                    break;
                default:
                    // Para funá§áµes de compra normais, usa value
                    gasEstimateParams = [{ value: testValue }];
            }
            
            // **MELHORIA: Tenta estimar gas primeiro**
            const gasEstimate = await currentContract.estimateGas[funcName](...gasEstimateParams);
            
            // Se chegou aqui, a funá§á£o existe e á© vá¡lida
            console.log(`… Funá§á£o de compra: Detectada e funcional (Gas: ${gasEstimate})`);
            
            // **MELHORIA: Teste callStatic adicional como no teste**
            try {
                console.log('”¬ CallStatic...');
                await currentContract.callStatic[funcName](...gasEstimateParams);
                console.log('… CallStatic funcionou perfeitamente');
                addContractMessage('… CallStatic: Passou em todos os testes', 'success');
            } catch (callError) {
                if (callError.message.includes('revert') || callError.reason) {
                    console.log(`… CallStatic com revert (normal): ${callError.reason || callError.message}`);
                    addContractMessage('… CallStatic: Revert detectado (comportamento normal)', 'success');
                } else {
                    console.log(`âš ï¸ CallStatic falhou: ${callError.message}`);
                    addContractMessage(`âš ï¸ CallStatic: ${callError.message}`, 'warning');
                }
            }
            
            buyFunctionName = funcName;
            updateCompatibilityStatus('buyStatus', '… Disponá­vel', 'success');
            addContractMessage(`… Funá§á£o de compra totalmente validada`, 'success');
            return;
            
        } catch (error) {
            if (error.message.includes('is not a function')) {
                // Funá§á£o ná£o existe - continua testando outras
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT' || 
                       error.message.includes('revert') || 
                       error.message.includes('execution reverted')) {
                // **MELHORIA: Melhor tratamento de revert - incluir motivo**
                const reason = error.reason || error.message.split(':')[1] || 'Motivo ná£o especificado';
                console.log(`âš ï¸ Funá§á£o de compra: Detectada mas reverte (${reason})`);
                buyFunctionName = funcName;
                updateCompatibilityStatus('buyStatus', '… Disponá­vel', 'success');
                addContractMessage(`… Funá§á£o de compra detectada (reverte com pará¢metros normal)`, 'success');
                return;
            } else {
                console.log(`âŒ Funá§á£o ${funcName}() erro: ${error.message}`);
            }
        }
    }
    
    // Se ná£o encontrou nenhuma funá§á£o vá¡lida
    console.log('âŒ Nenhuma funá§á£o de compra vá¡lida encontrada no contrato');
    
    // **INVESTIGAá‡áƒO ADICIONAL: Listar todas as funá§áµes disponá­veis no contrato**
    console.log('” INVESTIGANDO - Funá§áµes disponá­veis no contrato:');
    let possibleBuyFunctions = [];
    
    try {
        const contractInterface = currentContract.interface;
        const allFunctions = Object.keys(contractInterface.functions);
        
        console.log(`“‹ Contrato possui ${allFunctions.length} funá§áµes disponá­veis`);
        // allFunctions.forEach(func => {
        //     const fragment = contractInterface.functions[func];
        //     const isPayable = fragment.payable;
        //     const inputs = fragment.inputs.map(i => `${i.type} ${i.name}`).join(', ');
        //     console.log(`   “Œ ${func}(${inputs}) ${isPayable ? '[PAYABLE]' : ''}`);
        // });
        
        // Procura por funá§áµes que possam ser de compra baseado no nome
        possibleBuyFunctions = allFunctions.filter(func => 
            func.toLowerCase().includes('buy') || 
            func.toLowerCase().includes('purchase') ||
            func.toLowerCase().includes('mint') ||
            func.toLowerCase().includes('swap') ||
            func.toLowerCase().includes('exchange')
        );
        
        if (possibleBuyFunctions.length > 0) {
            console.log('Ž¯ Funá§áµes suspeitas de compra encontradas:');
            // possibleBuyFunctions.forEach(func => console.log(`   ’¡ ${func}`));
            // Ná£o mostra mensagem para o usuá¡rio - apenas no console para debug
        }
        
    } catch (e) {
        console.log('âŒ Erro ao listar funá§áµes do contrato:', e.message);
    }
    
    // **TESTE FINAL: Validaá§á£o das funá§áµes PAYABLE reais do ABI**
    // Teste final: Validando funá§áµes PAYABLE do ABI...
    const found = await testActualPayableFunctions();
    
    if (!found) {
        buyFunctionName = null;
        updateCompatibilityStatus('buyStatus', 'âŒ Ná£o disponá­vel', 'error');
        addContractMessage('âŒ Este token ná£o permite compra automá¡tica', 'error');
        
        // Log detalhado do erro para suporte
        window.contractLogger.logContractError(currentContract.address, 'NO_BUY_FUNCTION', {
            message: 'Nenhuma funá§á£o de compra detectada',
            availableFunctions: Object.keys(currentContract.functions || {}),
            possibleBuyFunctions: possibleBuyFunctions || [],
            contractABI: CONFIG.tokenABI.map(f => typeof f === 'string' ? f : f.name).filter(Boolean),
            testedFunctions: {
                buyFunctionName: buyFunctionName || 'not_found',
                priceFunction: priceFunctionName || 'not_detected'
            }
        });
        window.contractLogger.showDownloadButton();
        
        // š¨ IMPORTANTE: Garantir que a seá§á£o de compra permaneá§a OCULTA
        hidePurchaseSection();
        console.log('”’ Seá§á£o de compra mantida OCULTA - Contrato incompatá­vel');
    }
}

/**
 * Carrega informaá§áµes do token
 */
async function loadTokenInfo() {
    try {
        tokenInfo = {
            name: await currentContract.name(),
            symbol: await currentContract.symbol(),
            decimals: await currentContract.decimals(),
            totalSupply: await currentContract.totalSupply(),
            contractBalance: await currentProvider.getBalance(currentContract.address)
        };
        
        // Verificar tokens disponá­veis para venda no contrato
        try {
            console.log('” Verificando tokens disponá­veis para venda...');
            const tokensBalance = await currentContract.balanceOf(currentContract.address);
            const tokensForSale = parseFloat(ethers.utils.formatUnits(tokensBalance, tokenInfo.decimals));
            tokenInfo.tokensForSale = tokensBalance;
            tokenInfo.tokensForSaleFormatted = tokensForSale;
            console.log(`’° Tokens disponá­veis para venda: ${tokensForSale.toLocaleString()} ${tokenInfo.symbol}`);
        } catch (error) {
            // âš ï¸ Ná£o foi possá­vel verificar tokens para venda: ${error.message}
            tokenInfo.tokensForSale = ethers.BigNumber.from(0);
            tokenInfo.tokensForSaleFormatted = 0;
        }
        
        // Tenta detectar preá§o do contrato
        try {
            let price = null;
            const priceFunctions = [
                'tokenPrice', 'price', 'getPrice', 'buyPrice', 
                'tokenCost', 'cost', 'salePrice', 'pricePerToken'
            ];
            
            console.log('’° Verificando preá§o...');
            
            for (const priceFunc of priceFunctions) {
                try {
                    console.log(`” Tentando funá§á£o: ${priceFunc}()`);
                    price = await currentContract[priceFunc]();
                    console.log(`… Preá§o encontrado via ${priceFunc}(): ${price.toString()}`);
                    break;
                } catch (e) {
                    console.log(`âŒ Funá§á£o ${priceFunc}() ná£o disponá­vel`);
                }
            }
            
            if (price) {
                tokenInfo.price = ethers.utils.formatEther(price);
                console.log(`… Preá§o: ${tokenInfo.price} BNB por token`);
            } else {
                // Tentar calcular preá§o usando funá§á£o calculateEthForTokens
                try {
                    console.log('§® Tentando calcular preá§o via calculateEthForTokens...');
                    const oneToken = ethers.utils.parseUnits('1', tokenInfo.decimals);
                    const ethCost = await currentContract.calculateEthForTokens(oneToken);
                    tokenInfo.price = ethers.utils.formatEther(ethCost);
                    console.log(`… Preá§o calculado: ${tokenInfo.price} BNB por token`);
                } catch (calcError) {
                    // Tentar funá§á£o inversa calculateTokensForEth com 1 ETH
                    try {
                        console.log('§® Tentando calcular preá§o via calculateTokensForEth...');
                        const oneEth = ethers.utils.parseEther('1');
                        const tokensForOneEth = await currentContract.calculateTokensForEth(oneEth);
                        const tokensFormatted = ethers.utils.formatUnits(tokensForOneEth, tokenInfo.decimals);
                        tokenInfo.price = (1 / parseFloat(tokensFormatted)).toString();
                        console.log(`… Preá§o calculado (inverso): ${tokenInfo.price} BNB por token`);
                    } catch (invError) {
                        tokenInfo.price = CONFIG.defaultTokenPrice;
                        console.log(`âš ï¸ Preá§o ná£o detectado, usando padrá£o: ${CONFIG.defaultTokenPrice} BNB`);
                    }
                }
            }
        } catch (error) {
            tokenInfo.price = CONFIG.defaultTokenPrice;
            console.log(`âŒ Erro no preá§o: ${error.message}`);
        }

        // **MELHORIA: Verificar limites de compra como no teste**
        await checkPurchaseLimits();
        
        updateTokenInfoUI();
        
        // âš ï¸ NáƒO habilita seá§á£o de compra automaticamente
        // A seá§á£o sá³ será¡ habilitada SE uma funá§á£o de compra vá¡lida for encontrada
        console.log('â„¹ï¸ Informaá§áµes do token carregadas - Aguardando validaá§á£o de funá§áµes de compra');
        
    } catch (error) {
        throw new Error(`Erro ao carregar informaá§áµes do token: ${error.message}`);
    }
}

/**
 * Atualiza UI com informaá§áµes do token
 */
function updateTokenInfoUI() {
    document.getElementById('tokenName').textContent = tokenInfo.name || '-';
    document.getElementById('tokenSymbol').textContent = tokenInfo.symbol || '-';
    document.getElementById('tokenDecimals').textContent = tokenInfo.decimals || '-';
    
    // Formata total supply (sem sá­mbolo do token)
    const totalSupply = ethers.utils.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals);
    document.getElementById('tokenTotalSupply').textContent = formatNumber(totalSupply);
    
    // Formata saldo do contrato (BNB)
    const contractBalance = ethers.utils.formatEther(tokenInfo.contractBalance);
    document.getElementById('contractBalance').textContent = `${formatNumber(contractBalance)} BNB`;
    
    // Formata tokens disponá­veis para venda (sem sá­mbolo do token)
    const tokensForSaleElement = document.getElementById('tokensForSale');
    if (tokensForSaleElement) {
        const tokensAvailable = tokenInfo.tokensForSaleFormatted || 0;
        if (tokensAvailable > 0) {
            tokensForSaleElement.textContent = formatNumber(tokensAvailable);
            tokensForSaleElement.className = 'fw-bold text-success mb-2'; // Verde se há¡ tokens
        } else {
            tokensForSaleElement.textContent = '0';
            tokensForSaleElement.className = 'fw-bold text-danger mb-2'; // Vermelho se ná£o há¡ tokens
        }
    }
    
    // Atualiza informaá§á£o de disponibilidade na á¡rea de compra (sem sá­mbolo do token)
    const availabilityInfo = document.getElementById('tokens-availability');
    const availableDisplay = document.getElementById('available-tokens-display');
    if (availabilityInfo && availableDisplay && tokenInfo.tokensForSaleFormatted !== undefined) {
        const tokensAvailable = tokenInfo.tokensForSaleFormatted || 0;
        availableDisplay.textContent = formatNumber(tokensAvailable);
        
        if (tokensAvailable > 0) {
            availabilityInfo.className = 'alert alert-success border-0 mb-3 py-2';
            availabilityInfo.style.display = 'block';
        } else {
            availabilityInfo.className = 'alert alert-warning border-0 mb-3 py-2';
            availabilityInfo.style.display = 'block';
            availableDisplay.innerHTML = `<span class="text-warning">Nenhum token disponá­vel</span>`;
        }
    }
    
    // Define preá§o como READ-ONLY (detectado do contrato)
    const priceInput = document.getElementById('token-price');
    if (priceInput) {
        priceInput.value = tokenInfo.price;
        priceInput.readOnly = true; // Campo somente leitura
        priceInput.disabled = false; // Habilita para mostrar o valor
        priceInput.style.backgroundColor = '#2d3748'; // Cor de fundo diferenciada
        priceInput.style.cursor = 'not-allowed'; // Cursor indicativo
        
        // Verifica se preá§o foi detectado automaticamente ou á© padrá£o
        if (tokenInfo.price === CONFIG.defaultTokenPrice) {
            priceInput.title = 'Preá§o padrá£o (ná£o detectado no contrato) - verifique manualmente';
            priceInput.style.borderColor = '#fbbf24'; // Cor amarela para atená§á£o
        } else {
            priceInput.title = '… Preá§o detectado automaticamente do contrato';
            priceInput.style.borderColor = '#10b981'; // Cor verde para sucesso
        }
        
        console.log(`’° Preá§o detectado: ${tokenInfo.price} BNB por token`);
    }
    
    // **MELHORIA: Mostrar limites de compra na interface**
    if (tokenInfo.minPurchase && tokenInfo.maxPurchase) {
        const limitsInfo = document.getElementById('purchase-limits-info');
        const minDisplay = document.getElementById('min-purchase-display');
        const maxDisplay = document.getElementById('max-purchase-display');
        
        if (limitsInfo && minDisplay && maxDisplay) {
            minDisplay.textContent = `${tokenInfo.minPurchase} BNB`;
            maxDisplay.textContent = `${tokenInfo.maxPurchase} BNB`;
            limitsInfo.style.display = 'block';
        }
    }
}

/**
 * “ Verificar limites de compra do contrato
 */
async function checkPurchaseLimits() {
    console.log('“ Verificando limites...');
    
    try {
        let minPurchase = null, maxPurchase = null;
        
        // Tenta detectar limites de forma mais robusta
        try {
            // Primeiro tenta as funá§áµes bá¡sicas
            try {
                minPurchase = await currentContract.minPurchase();
                console.log(`… Limite má­nimo: ${ethers.utils.formatEther(minPurchase)} BNB`);
            } catch (e) {
                console.log('âŒ Funá§á£o minPurchase() ná£o disponá­vel');
            }
            
            try {
                maxPurchase = await currentContract.maxPurchase();
                console.log(`… Limite má¡ximo: ${ethers.utils.formatEther(maxPurchase)} BNB`);
            } catch (e) {
                console.log('âŒ Funá§á£o maxPurchase() ná£o disponá­vel');
            }
            
            // Se ná£o encontrou limites, tenta verificar purchaseLimit para o usuá¡rio
            if (!minPurchase && !maxPurchase && walletAddress) {
                try {
                    const userLimit = await currentContract.purchaseLimit(walletAddress);
                    if (userLimit && !userLimit.isZero()) {
                        maxPurchase = userLimit;
                        console.log(`… Limite do usuá¡rio: ${ethers.utils.formatEther(userLimit)} BNB`);
                    }
                } catch (e) {
                    console.log('âŒ Funá§á£o purchaseLimit() ná£o disponá­vel para o usuá¡rio');
                }
            }
            
            const minFormatted = ethers.utils.formatEther(minPurchase);
            const maxFormatted = ethers.utils.formatEther(maxPurchase);
            
            tokenInfo.minPurchase = minFormatted;
            tokenInfo.maxPurchase = maxFormatted;
            
            console.log(`… Limites: ${minFormatted} - ${maxFormatted} BNB`);
            addContractMessage(`… Compra má­nima: ${minFormatted} BNB, má¡xima: ${maxFormatted} BNB`, 'success');
            
        } catch (e) {
            // âš ï¸ Limites: Ná£o foi possá­vel verificar - ${e.message}
            addContractMessage('âš ï¸ Limites de compra ná£o detectados (pode ná£o ter)', 'warning');
        }
        
        // Armazenar para uso posterior
        tokenInfo.limits = { minPurchase, maxPurchase };
        
    } catch (error) {
        console.log(`âŒ Erro na verificaá§á£o de limites: ${error.message}`);
    }
}

// ==================== GERENCIAMENTO DE COMPRA ====================

/**
 * Habilita seá§á£o de compra - APENAS quando funá§á£o vá¡lida á© confirmada E seá§á£o de informaá§áµes está¡ visá­vel
 */
function enablePurchaseSection() {
    // ›¡ï¸ PROTEá‡áƒO: Sá³ executa se realmente há¡ uma funá§á£o de compra vá¡lida
    if (!buyFunctionName) {
        console.log('âŒ enablePurchaseSection() chamada sem funá§á£o de compra vá¡lida - IGNORANDO');
        return;
    }
    
    // ›¡ï¸ PROTEá‡áƒO: Verifica se a seá§á£o de informaá§áµes está¡ visá­vel primeiro
    const infoSection = document.getElementById('token-info-section');
    if (!infoSection || infoSection.style.display === 'none') {
        // Sistema: Aguardando exibiá§á£o da seá§á£o de informaá§áµes antes de habilitar compra
        return;
    }
    
    const section = document.getElementById('purchase-section');
    const priceInput = document.getElementById('token-price');
    const quantityInput = document.getElementById('token-quantity');
    const purchaseBtn = document.getElementById('execute-purchase-btn');
    
    console.log('Ž‰ HABILITANDO SEá‡áƒO DE COMPRA - Funá§á£o validada:', buyFunctionName);
    console.log('“ Seá§á£o encontrada:', section ? 'SIM' : 'NáƒO');
    console.log('“ Campo quantidade encontrado:', quantityInput ? 'SIM' : 'NáƒO');
    console.log('“ Botá£o compra encontrado:', purchaseBtn ? 'SIM' : 'NáƒO');
    
    if (section) {
        section.style.display = 'block';
        // Adiciona uma animaá§á£o de slide para mostrar que a seá§á£o foi liberada
        section.classList.add('animate__animated', 'animate__slideInUp');
        console.log('… Seá§á£o de compra LIBERADA e exibida');
        
        // Adiciona uma mensagem visual de sucesso
        addContractMessage('Ž‰ Seá§á£o de compra liberada - Contrato suporta compras!', 'success');
    }
    
    // Campo de preá§o permanece READ-ONLY (já¡ configurado em updateTokenInfoUI)
    // Ná£o habilitamos ediá§á£o do preá§o pois á© detectado do contrato
    
    if (quantityInput) {
        quantityInput.disabled = false;
        console.log('… Campo quantidade habilitado');
    }
    
    // HABILITA o botá£o com funá§á£o validada
    if (purchaseBtn) {
        purchaseBtn.disabled = false;
        purchaseBtn.style.opacity = '1';
        purchaseBtn.style.cursor = 'pointer';
        purchaseBtn.style.backgroundColor = '#28a745'; // Verde para indicar liberado
        console.log(`… Botá£o LIBERADO - Funá§á£o confirmada: ${buyFunctionName}()`);
    } else {
        console.error('âŒ Botá£o de compra ná£o encontrado no DOM!');
    }
    
    console.log('›’ Seá§á£o de compra TOTALMENTE habilitada - Contrato validado para compras');
    console.log(`“Š STATUS FINAL: ${tokenInfo.name} (${tokenInfo.symbol}) - Preá§o: ${tokenInfo.price} BNB - Tokens disponá­veis: ${formatNumber(tokenInfo.tokensForSaleFormatted || 0)}`);
    console.log('Ž‰ SISTEMA PRONTO! Vocáª pode agora comprar tokens com seguraná§a.');
    
    // Adiciona mensagem de sucesso na interface
    const systemMessages = document.getElementById('system-messages');
    if (systemMessages) {
        systemMessages.innerHTML = `
            <div class="alert alert-success border-0 mb-3">
                <i class="bi bi-check-circle-fill me-2"></i>
                <strong>Sistema Validado!</strong> Contrato aprovado e pronto para negociaá§á£o.
                <br><small class="text-muted">Funá§á£o de compra: ${buyFunctionName}() | Tokens disponá­veis: ${formatNumber(tokenInfo.tokensForSaleFormatted || 0)}</small>
            </div>
        `;
    }
}

/**
 * Mantá©m seá§á£o de compra oculta quando contrato ná£o suporta compras
 */
function hidePurchaseSection() {
    const section = document.getElementById('purchase-section');
    const purchaseBtn = document.getElementById('execute-purchase-btn');
    
    if (section) {
        section.style.display = 'none';
        console.log('”’ Seá§á£o de compra mantida OCULTA');
    }
    
    if (purchaseBtn) {
        purchaseBtn.disabled = true;
        purchaseBtn.style.opacity = '0.3';
        purchaseBtn.style.cursor = 'not-allowed';
        purchaseBtn.style.backgroundColor = '#dc3545'; // Vermelho para indicar indisponá­vel
        console.log('”’ Botá£o de compra desabilitado');
    }
    
    // Adiciona uma mensagem explicativa para o usuá¡rio
    addContractMessage('”’ Compra ná£o disponá­vel - Este token ná£o permite compra automá¡tica', 'warning');
    console.log('”’ Seá§á£o de compra permanece oculta - Contrato incompatá­vel');
}

/**
 * Debug do estado do botá£o de compra - funá§á£o global para console
 */
function debugPurchaseButton() {
    const btn = document.getElementById('execute-purchase-btn');
    // DEBUG BOTáƒO DE COMPRA:
    console.log('“ Botá£o encontrado:', btn ? 'SIM' : 'NáƒO');
    if (btn) {
        console.log('“ Disabled:', btn.disabled);
        console.log('“ Style opacity:', btn.style.opacity);
        console.log('“ Style cursor:', btn.style.cursor);
        console.log('“ Classes:', btn.className);
        console.log('“ Texto:', btn.textContent.trim());
    }
    console.log('“ buyFunctionName:', buyFunctionName);
}

// Torna disponá­vel no console para debug
window.debugPurchaseButton = debugPurchaseButton;

/**
 * Calcula total da compra
 */
function calculateTotal() {
    const priceInput = document.getElementById('token-price');
    const quantityInput = document.getElementById('token-quantity');
    const totalTokensSpan = document.getElementById('totalTokens');
    const totalPriceSpan = document.getElementById('totalPrice');
    
    if (priceInput && quantityInput && totalTokensSpan && totalPriceSpan) {
        const price = parseFloat(priceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        const total = price * quantity;
        
        totalTokensSpan.textContent = formatNumber(quantity);
        totalPriceSpan.textContent = `${formatNumber(total)} BNB`;
    }
}

/**
 * Executa a compra de tokens
 */
async function executePurchase() {
    if (!buyFunctionName) {
        alert('Este token ná£o permite compra automá¡tica');
        return;
    }
    
    // Verifica se a funá§á£o existe no contrato antes de executar
    if (!buyFunctionName) {
        alert('âŒ Este token ná£o permite compra direta');
        return;
    }
    
    // **VALIDAá‡áƒO CRáTICA: Verifica se a funá§á£o realmente existe no contrato**
    if (!currentContract[buyFunctionName]) {
        console.error(`âŒ ERRO CRáTICO: Funá§á£o ${buyFunctionName}() ná£o existe no contrato!`);
        alert('âŒ Erro: Sistema de compra ná£o está¡ disponá­vel');
        
        // Reseta a detecá§á£o
        buyFunctionName = null;
        updateCompatibilityStatus('buyStatus', 'âŒ Erro interno', 'error');
        return;
    }
    
    console.log(`… Funá§á£o ${buyFunctionName}() confirmada no contrato`);
    
    // Verifica se MetaMask está¡ conectado
    if (!walletConnected || !walletAddress) {
        alert('Por favor, conecte sua carteira MetaMask primeiro');
        return;
    }
    
    const quantityInput = document.getElementById('token-quantity');
    const priceInput = document.getElementById('token-price');
    
    const quantity = parseFloat(quantityInput.value);
    const price = parseFloat(priceInput.value);
    
    if (!quantity || quantity <= 0) {
        alert('Por favor, digite uma quantidade vá¡lida');
        return;
    }

    if (!price || price <= 0) {
        alert('Por favor, digite um preá§o vá¡lido');
        return;
    }

    // **MELHORIA: Validar contra limites detectados do contrato**
    const totalValue = price * quantity;
    
    if (tokenInfo.limits) {
        const { minPurchase, maxPurchase } = tokenInfo.limits;
        
        if (minPurchase && totalValue < parseFloat(tokenInfo.minPurchase)) {
            alert(`Valor abaixo do má­nimo permitido pelo contrato (${tokenInfo.minPurchase} BNB)`);
            return;
        }
        
        if (maxPurchase && totalValue > parseFloat(tokenInfo.maxPurchase)) {
            alert(`Valor acima do má¡ximo permitido pelo contrato (${tokenInfo.maxPurchase} BNB)`);
            return;
        }
        
        console.log(`… Valor ${totalValue} BNB está¡ dentro dos limites do contrato`);
    }

    try {
        // Mostra loading
        showButtonLoading('execute-purchase-btn', 'Processando...');
        showLoadingMessage('system-messages', 'Preparando transaá§á£o');
        
        const totalValueStr = totalValue.toString();
        const valueInWei = ethers.utils.parseEther(totalValueStr);
        
        clearPurchaseMessages();
        addPurchaseMessage('š€ Processando compra...', 'info');
        
        // IMPORTANTE: Sempre usar MetaMask para transaá§áµes (ná£o RPC páºblico)
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = web3Provider.getSigner();
        
        // Cria contrato com signer do MetaMask
        const contractWithSigner = new ethers.Contract(
            currentContract.address, 
            CONFIG.tokenABI, 
            signer
        );
        
        console.log(`’° Executando compra: ${quantity} tokens por ${totalValueStr} BNB`);
        console.log(`“ Funá§á£o: ${buyFunctionName}()`);
        console.log(`’Ž Valor: ${valueInWei.toString()} wei`);
        console.log(`“ Contrato: ${currentContract.address}`);
        console.log(`‘¤ Comprador: ${walletAddress}`);
        
        // DIAGNá“STICO AVANá‡ADO DO CONTRATO
        addPurchaseMessage('” Verificando condiá§áµes da compra...', 'info');
        try {
            // Usa RPC páºblico para diagná³stico (ná£o MetaMask que está¡ falhando)
            const publicProvider = await initializeProviderWithFallback();
            
            const contractBalance = await publicProvider.getBalance(currentContract.address);
            const userBalance = await publicProvider.getBalance(walletAddress);
            
            console.log(`’° Saldo do contrato: ${ethers.utils.formatEther(contractBalance)} BNB`);
            console.log(`’° Saldo do usuá¡rio: ${ethers.utils.formatEther(userBalance)} BNB`);
            
            // Verifica se usuá¡rio tem saldo suficiente
            const totalCostWei = ethers.utils.parseEther(totalValue.toString());
            if (userBalance.lt(totalCostWei)) {
                throw new Error(`Saldo insuficiente. Vocáª tem ${ethers.utils.formatEther(userBalance)} BNB, mas precisa de ${totalValue} BNB`);
            }
            
            // Verifica se o contrato tem tokens suficientes
            // âš ï¸ NOTA: Nem todos os contratos armazenam tokens no endereá§o do contrato
            try {
                if (tokenInfo.totalSupply) {
                    const contractTokenBalance = await currentContract.balanceOf(currentContract.address);
                    const contractTokens = parseFloat(ethers.utils.formatUnits(contractTokenBalance, tokenInfo.decimals));
                    
                    console.log(`ª™ Tokens no endereá§o do contrato: ${contractTokens} ${tokenInfo.symbol}`);
                    
                    if (contractTokens === 0) {
                        console.log('âš ï¸ Contrato ná£o tem tokens em seu endereá§o - pode usar mint ou reserva externa');
                        // Ná£o mostra mensagem - apenas no log
                    } else if (contractTokens < quantity) {
                        console.log(`âš ï¸ Contrato tem poucos tokens (${contractTokens}), mas pode ter outras fontes`);
                        // Ná£o mostra mensagem - apenas no log
                    } else {
                        console.log(`… Contrato tem tokens suficientes: ${contractTokens} >= ${quantity}`);
                        // Ná£o mostra mensagem - apenas no log
                    }
                }
            } catch (tokenCheckError) {
                // âš ï¸ Ná£o foi possá­vel verificar tokens do contrato: ${tokenCheckError.message}
                // Ná£o mostra mensagem - apenas no log
            }
            
            // ” VERIFICAá‡áƒO ADICIONAL: Tenta detectar se contrato usa mint ou tem reservas
            try {
                console.log('” Verificando capacidade de fornecimento de tokens...');
                
                // Tenta verificar se há¡ funá§á£o de tokens disponá­veis
                const availabilityFunctions = ['tokensAvailable', 'tokensForSale', 'remainingTokens', 'maxSupply'];
                
                for (const funcName of availabilityFunctions) {
                    try {
                        const available = await currentContract[funcName]();
                        const availableTokens = parseFloat(ethers.utils.formatUnits(available, tokenInfo.decimals));
                        console.log(`’° ${funcName}(): ${availableTokens} tokens disponá­veis`);
                        
                        if (availableTokens >= quantity) {
                            console.log(`… Tokens disponá­veis confirmados via ${funcName}(): ${availableTokens}`);
                            // Ná£o mostra mensagem - apenas no log
                            break;
                        }
                    } catch (e) {
                        // Funá§á£o ná£o existe ou falhou, continua
                    }
                }
                
                // Verifica se contrato tem funá§á£o de mint (indicativo de criaá§á£o diná¢mica)
                const contractInterface = currentContract.interface;
                const hasMintFunction = Object.keys(contractInterface.functions).some(func => 
                    func.toLowerCase().includes('mint')
                );
                
                if (hasMintFunction) {
                    console.log('… Contrato tem funá§á£o de mint - pode criar tokens dinamicamente');
                    // Ná£o mostra mensagem - apenas no log
                }
                
            } catch (availabilityError) {
                console.log('â„¹ï¸ Verificaá§á£o de disponibilidade ignorada:', availabilityError.message);
            }
            
            // DIAGNá“STICO AVANá‡ADO - Verifica condiá§áµes especiais do contrato
            await performAdvancedContractDiagnostics(publicProvider);
            
            // Ná£o mostra mensagem de aprovaá§á£o - apenas processa
            
        } catch (diagError) {
            console.warn('âš ï¸ Erro no diagná³stico:', diagError.message);
            addPurchaseMessage(`âš ï¸ Aviso: ${diagError.message}`, 'warning');
            
            // Se o erro á© crá­tico, para por aqui
            if (diagError.message.includes('Saldo insuficiente') || diagError.message.includes('ná£o tem tokens suficientes')) {
                addPurchaseMessage('âŒ Compra cancelada devido a verificaá§á£o falhada', 'error');
                return;
            }
        }
        
        // SIMULAá‡áƒO COM DIFERENTES VALORES PARA ENCONTRAR O PROBLEMA
        try {
            // Cria provider MetaMask apenas para simulaá§á£o
            const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
            const metamaskSigner = metamaskProvider.getSigner();
            const contractForSim = new ethers.Contract(currentContract.address, CONFIG.tokenABI, metamaskSigner);
            
            // Teste 1: Simulaá§á£o com valor exato
            // Teste 1: Simulaá§á£o com valor exato
            try {
                // **VALIDAá‡áƒO: Verifica se a funá§á£o existe antes de usar**
                if (!contractForSim[buyFunctionName]) {
                    throw new Error(`Funá§á£o ${buyFunctionName}() ná£o existe no contrato`);
                }
                
                await contractForSim.callStatic[buyFunctionName]({
                    value: valueInWei,
                    from: walletAddress
                });
                console.log('… Simulaá§á£o com valor exato: SUCESSO');
            } catch (simError1) {
                console.log('âŒ Simulaá§á£o com valor exato: FALHOU');
                console.log('” Razá£o:', simError1.reason || simError1.message);
                
                // Log apenas no console - ná£o mostra erro para usuá¡rio na simulaá§á£o
                // A simulaá§á£o pode falhar mas a transaá§á£o real pode funcionar
            }
            
        } catch (simError) {
            console.warn('âš ï¸ Erro na simulaá§á£o geral:', simError.message);
            
            // Aná¡lise do erro de simulaá§á£o
            if (simError.message.includes('missing trie node')) {
                addPurchaseMessage('âš ï¸ Problema de sincronizaá§á£o da rede - tentando mesmo assim', 'warning');
            } else if (simError.message.includes('revert')) {
                // Ná£o mostra erro de revert na simulaá§á£o - pode funcionar na transaá§á£o real
                console.log('” Simulaá§á£o falhou com revert - mas transaá§á£o real pode funcionar');
            } else {
                addPurchaseMessage(`âš ï¸ Simulaá§á£o falhou: ${simError.message}`, 'warning');
            }
            
            addPurchaseMessage('š€ Prosseguindo com a transaá§á£o real...', 'info');
        }
        
        // **VALIDAá‡áƒO FINAL: Verifica se a funá§á£o existe no contrato assinado**
        if (!contractWithSigner[buyFunctionName]) {
            throw new Error(`Funá§á£o ${buyFunctionName}() ná£o existe no contrato`);
        }
        
        // Executa a transaá§á£o
        const tx = await contractWithSigner[buyFunctionName]({
            value: valueInWei,
            gasLimit: CONFIG.gasLimit
        });
        
        addPurchaseMessage(`… Compra confirmada!`, 'success');
        addPurchaseMessage('â³ Aguardando confirmaá§á£o...', 'info');
        
        // Aguarda confirmaá§á£o
        const receipt = await tx.wait();
        
        addPurchaseMessage('Ž‰ Transaá§á£o confirmada!', 'success');
        
        // Mostra detalhes da transaá§á£o
        showTransactionDetails(receipt, quantity, totalValue);
        
    } catch (error) {
        console.error('âŒ Erro na compra:', error);
        
        // Log detalhado do erro de transaá§á£o para suporte
        window.contractLogger.logTransactionError(error.receipt ? error.receipt.transactionHash : 'unknown', {
            code: error.code,
            message: error.message,
            reason: error.reason,
            receipt: error.receipt,
            contractAddress: currentContract.address,
            functionCalled: buyFunctionName,
            valueInBNB: totalValue,
            gasUsed: error.receipt ? error.receipt.gasUsed.toString() : 'unknown'
        });
        window.contractLogger.showDownloadButton();
        
        // Mensagens de erro mais detalhadas
        let errorMessage = 'Erro desconhecido';
        let technicalDetails = '';
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = 'Saldo insuficiente na carteira';
        } else if (error.code === 'USER_REJECTED') {
            errorMessage = 'Transaá§á£o cancelada pelo usuá¡rio';
        } else if (error.code === 4001) {
            errorMessage = 'Transaá§á£o rejeitada pelo usuá¡rio';
        } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            errorMessage = 'Ná£o foi possá­vel estimar o gá¡s necessá¡rio. O contrato pode ter rejeitado a transaá§á£o.';
        } else if (error.code === 'CALL_EXCEPTION') {
            errorMessage = 'Erro na execuá§á£o do contrato';
            
            // Aná¡lise especá­fica do CALL_EXCEPTION
            if (error.receipt) {
                technicalDetails = `Hash: ${error.receipt.transactionHash}\n`;
                technicalDetails += `Gas usado: ${error.receipt.gasUsed}\n`;
                technicalDetails += `Status: ${error.receipt.status === 0 ? 'FALHOU' : 'SUCESSO'}\n`;
                
                console.log('“‹ Detalhes da transaá§á£o falhada:');
                console.log('”— Hash:', error.receipt.transactionHash);
                console.log('â›½ Gas usado:', error.receipt.gasUsed.toString());
                console.log('“Š Status:', error.receipt.status === 0 ? 'FALHOU' : 'SUCESSO');
                
                // Aná¡lise especá­fica baseada no gas usado
                const gasUsed = error.receipt.gasUsed.toNumber();
                if (gasUsed === 21307 || gasUsed < 25000) {
                    console.log('” ANáLISE: Gas muito baixo - funá§á£o falha no iná­cio');
                    console.log('’¡ Isso indica que o contrato rejeitou a transaá§á£o imediatamente');
                    console.log('’¡ Possá­veis causas especá­ficas:');
                    console.log('   - require() falhando logo no iná­cio da funá§á£o');
                    console.log('   - Funá§á£o payable recebendo valor quando ná£o deveria');
                    console.log('   - Modificadores (onlyOwner, whenNotPaused, etc.) rejeitando');
                    console.log('   - Funá§á£o ná£o existe ou tem assinatura diferente');
                    
                    errorMessage += '\n\n” ANáLISE Tá‰CNICA:';
                    errorMessage += '\nGas muito baixo (21307) indica que o contrato rejeitou a transaá§á£o imediatamente.';
                    errorMessage += '\n\nCausas mais prová¡veis:';
                    errorMessage += '\nâ€¢ Contrato está¡ pausado ou com restriá§áµes';
                    errorMessage += '\nâ€¢ Funá§á£o de compra tem condiá§áµes especá­ficas ná£o atendidas';
                    errorMessage += '\nâ€¢ Valor enviado ná£o está¡ correto para este contrato';
                    errorMessage += '\nâ€¢ Contrato requer whitelist ou aprovaá§á£o prá©via';
                    
                } else {
                    console.log('” ANáLISE: Gas normal - erro durante execuá§á£o');
                }
                
                // Possá­veis causas do erro
                console.log('” Possá­veis causas:');
                console.log('1. Contrato sem tokens suficientes para vender');
                console.log('2. Valor enviado incorreto (muito alto/baixo)');
                console.log('3. Contrato pausado ou com restriá§áµes');
                console.log('4. Funá§á£o de compra com lá³gica especá­fica ná£o atendida');
                console.log('5. Problema de aprovaá§á£o ou allowance');
                
                errorMessage += '\n\nPossá­veis causas:\n';
                errorMessage += 'â€¢ Contrato sem tokens para vender\n';
                errorMessage += 'â€¢ Valor enviado incorreto\n';
                errorMessage += 'â€¢ Contrato pausado ou restrito\n';
                errorMessage += 'â€¢ Lá³gica especá­fica do contrato ná£o atendida';
            }
        } else if (error.message.includes('revert')) {
            errorMessage = 'Transaá§á£o rejeitada pelo contrato';
            
            // Tenta extrair razá£o do revert
            if (error.reason) {
                errorMessage += `\nRazá£o: ${error.reason}`;
                console.log(`” Razá£o especá­fica do revert: ${error.reason}`);
            } else {
                // Tenta extrair da mensagem
                const revertMatch = error.message.match(/revert (.+)/i);
                if (revertMatch) {
                    errorMessage += `\nRazá£o: ${revertMatch[1]}`;
                    console.log(`” Razá£o extraá­da: ${revertMatch[1]}`);
                }
            }
            
            // Aná¡lise de reverts comuns
            const errorMsg = error.message.toLowerCase();
            if (errorMsg.includes('execution reverted') || errorMsg.includes('execuá§á£o revertida')) {
                errorMessage += '\n\n’¡ O contrato executou mas rejeitou a transaá§á£o.';
                errorMessage += '\nIsso indica que alguma condiá§á£o interna ná£o foi atendida.';
                
                // Sugestáµes baseadas no gas baixo (21307)
                if (error.receipt && error.receipt.gasUsed.toNumber() < 25000) {
                    errorMessage += '\n\n” Sugestáµes especá­ficas (gas baixo):';
                    errorMessage += '\nâ€¢ Verifique se o contrato aceita pagamentos em BNB';
                    errorMessage += '\nâ€¢ Confirme se a quantidade está¡ dentro dos limites';
                    errorMessage += '\nâ€¢ Verifique se sua conta está¡ autorizada';
                    errorMessage += '\nâ€¢ Contrato pode estar pausado temporariamente';
                }
            }
        } else {
            errorMessage = error.message;
        }
        
        addPurchaseMessage(`âŒ Erro: ${errorMessage}`, 'error');
        
        if (technicalDetails) {
            addPurchaseMessage(`”§ Detalhes tá©cnicos:\n${technicalDetails}`, 'warning');
        }
        
        // Remove loading em caso de erro
        hideButtonLoading('execute-purchase-btn', '<i class="bi bi-lightning me-2"></i>COMPRAR TOKENS');
    }
}

/**
 * Diagná³stico avaná§ado do contrato para identificar problemas especá­ficos
 */
async function performAdvancedContractDiagnostics(provider) {
    const diagnosticFunctions = [
        { name: 'paused', desc: 'Contrato pausado' },
        { name: 'saleActive', desc: 'Venda ativa' },
        { name: 'saleEnabled', desc: 'Venda habilitada' },
        { name: 'owner', desc: 'Proprietá¡rio do contrato' },
        { name: 'maxPurchase', desc: 'Compra má¡xima permitida' },
        { name: 'minPurchase', desc: 'Compra má­nima permitida' },
        { name: 'tokensForSale', desc: 'Tokens para venda' },
        { name: 'tokensAvailable', desc: 'Tokens disponá­veis' }
    ];
    
    const contractWithProvider = new ethers.Contract(currentContract.address, CONFIG.tokenABI, provider);
    const quantity = parseFloat(document.getElementById('token-quantity').value);
    
    for (const func of diagnosticFunctions) {
        try {
            const result = await contractWithProvider[func.name]();
            console.log(`“‹ ${func.desc}: ${result.toString()}`);
            
            // Aná¡lise especá­fica de cada resultado
            if (func.name === 'paused' && result === true) {
                console.log('š¨ PROBLEMA: Contrato está¡ pausado!');
                throw new Error('Contrato está¡ pausado - compras temporariamente desabilitadas');
            }
            
            if ((func.name === 'saleActive' || func.name === 'saleEnabled') && result === false) {
                console.log('š¨ PROBLEMA: Venda ná£o está¡ ativa!');
                throw new Error('Venda ná£o está¡ ativa neste contrato');
            }
            
            if (func.name === 'maxPurchase' && result.gt(0)) {
                const maxInBNB = ethers.utils.formatEther(result);
                const totalValueNeeded = quantity * parseFloat(tokenInfo.price);
                if (totalValueNeeded > parseFloat(maxInBNB)) {
                    console.log(`š¨ PROBLEMA: Valor solicitado (${totalValueNeeded} BNB) excede má¡ximo permitido (${maxInBNB} BNB)`);
                    throw new Error(`Valor má¡ximo permitido: ${maxInBNB} BNB`);
                }
            }
            
            if (func.name === 'minPurchase' && result.gt(0)) {
                const minInBNB = ethers.utils.formatEther(result);
                const totalValueNeeded = quantity * parseFloat(tokenInfo.price);
                if (totalValueNeeded < parseFloat(minInBNB)) {
                    console.log(`š¨ PROBLEMA: Valor solicitado (${totalValueNeeded} BNB) á© menor que má­nimo (${minInBNB} BNB)`);
                    throw new Error(`Valor má­nimo necessá¡rio: ${minInBNB} BNB`);
                }
            }
            
        } catch (error) {
            // Se á© um erro especá­fico da aná¡lise, repassa
            if (error.message.includes('pausado') || error.message.includes('ativa') || 
                error.message.includes('má¡xima') || error.message.includes('má­nima')) {
                throw error;
            }
            // Sená£o, funá§á£o simplesmente ná£o existe no contrato (normal)
            console.log(`“‹ ${func.desc}: Ná£o disponá­vel`);
        }
    }
    
    // Verifica se usuá¡rio está¡ na whitelist (se aplicá¡vel)
    try {
        const isWhitelisted = await contractWithProvider.isWhitelisted(walletAddress);
        console.log(`“‹ Usuá¡rio na whitelist: ${isWhitelisted}`);
        if (isWhitelisted === false) {
            console.log('š¨ PROBLEMA: Usuá¡rio ná£o está¡ na whitelist!');
            throw new Error('Seu endereá§o ná£o está¡ autorizado para comprar tokens');
        }
    } catch (error) {
        if (error.message.includes('autorizado')) {
            throw error;
        }
        console.log('“‹ Whitelist: Ná£o aplicá¡vel');
    }
    
    // Verifica limites por usuá¡rio
    try {
        const userLimit = await contractWithProvider.purchaseLimit(walletAddress);
        const hasPurchased = await contractWithProvider.hasPurchased(walletAddress);
        
        console.log(`“‹ Limite por usuá¡rio: ${userLimit.toString()}`);
        console.log(`“‹ Já¡ comprou antes: ${hasPurchased}`);
        
        if (hasPurchased && userLimit.eq(0)) {
            console.log('š¨ PROBLEMA: Usuá¡rio já¡ atingiu limite de compras!');
            throw new Error('Vocáª já¡ atingiu o limite de compras para este token');
        }
    } catch (error) {
        if (error.message.includes('limite')) {
            throw error;
        }
        console.log('“‹ Limites por usuá¡rio: Ná£o aplicá¡vel');
    }
    
    console.log('… Diagná³stico avaná§ado concluá­do - nenhum problema detectado');
}

/**
 * Analisa a razá£o especá­fica do revert para dar feedback preciso
 */
async function analyzeRevertReason(error, contract, valueInWei) {
    console.log('” Analisando razá£o do revert...');
    
    // Tenta extrair mensagem de revert
    let revertReason = 'Desconhecida';
    if (error.reason) {
        revertReason = error.reason;
    } else if (error.message.includes('revert')) {
        const match = error.message.match(/revert (.+)/);
        if (match) {
            revertReason = match[1];
        }
    }
    
    console.log(`š¨ Razá£o do revert: ${revertReason}`);
    
    // Testes especá­ficos baseados em padráµes comuns
    const testScenarios = [
        {
            name: 'Valor muito baixo',
            test: async () => {
                const minValue = ethers.utils.parseEther('0.001'); // 0.001 BNB
                return await contract.callStatic[buyFunctionName]({ value: minValue, from: walletAddress });
            }
        },
        {
            name: 'Valor dobrado',
            test: async () => {
                const doubleValue = valueInWei.mul(2);
                return await contract.callStatic[buyFunctionName]({ value: doubleValue, from: walletAddress });
            }
        },
        {
            name: 'Valor exato do preá§o',
            test: async () => {
                const exactPrice = ethers.utils.parseEther(tokenInfo.price);
                return await contract.callStatic[buyFunctionName]({ value: exactPrice, from: walletAddress });
            }
        },
        {
            name: 'Sem valor (0 BNB)',
            test: async () => {
                return await contract.callStatic[buyFunctionName]({ value: 0, from: walletAddress });
            }
        }
    ];
    
    for (const scenario of testScenarios) {
        try {
            // Testando: ${scenario.name}
            await scenario.test();
            console.log(`… ${scenario.name}: FUNCIONOU!`);
            // Ná£o mostra mais descobertas para o usuá¡rio - apenas no console
            return;
        } catch (testError) {
            console.log(`âŒ ${scenario.name}: ${testError.reason || 'Falhou'}`);
        }
    }
    
    // Aná¡lise de padráµes comuns de revert
    const commonReverts = {
        'insufficient funds': 'Saldo insuficiente no contrato ou usuá¡rio',
        'saldo insuficiente': 'Saldo insuficiente no contrato ou usuá¡rio',
        'not enough tokens': 'Contrato sem tokens suficientes',
        'sem tokens': 'Contrato sem tokens suficientes',
        'paused': 'Contrato está¡ pausado',
        'pausado': 'Contrato está¡ pausado',
        'not whitelisted': 'Endereá§o ná£o está¡ na whitelist',
        'ná£o autorizado': 'Endereá§o ná£o está¡ na whitelist',
        'sale not active': 'Venda ná£o está¡ ativa',
        'venda inativa': 'Venda ná£o está¡ ativa',
        'minimum purchase': 'Valor abaixo do má­nimo',
        'valor má­nimo': 'Valor abaixo do má­nimo',
        'maximum purchase': 'Valor acima do má¡ximo',
        'valor má¡ximo': 'Valor acima do má¡ximo',
        'already purchased': 'Usuá¡rio já¡ comprou antes',
        'já¡ comprou': 'Usuá¡rio já¡ comprou antes',
        'wrong price': 'Preá§o incorreto',
        'preá§o incorreto': 'Preá§o incorreto',
        'invalid amount': 'Quantidade invá¡lida',
        'quantidade invá¡lida': 'Quantidade invá¡lida'
    };
    
    for (const [pattern, explanation] of Object.entries(commonReverts)) {
        if (revertReason.toLowerCase().includes(pattern)) {
            console.log(`’¡ Padrá£o identificado: ${explanation}`);
            // Ná£o mostra mais erros tá©cnicos para o usuá¡rio durante simulaá§á£o
            return;
        }
    }
    
    // Log apenas no console - ná£o mostra erro tá©cnico para o usuá¡rio
    console.log(`” Razá£o do revert: ${revertReason}`);
}

// ==================== FUNá‡á•ES AUXILIARES ====================

/**
 * Atualiza status de compatibilidade
 */
function updateCompatibilityStatus(elementId, text, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
        element.className = `fw-bold mb-1 text-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'warning'}`;
    }
}

/**
 * Atualiza botá£o de verificaá§á£o
 */
function updateVerifyButton(isLoading) {
    const btn = document.getElementById('verify-contract-btn');
    if (btn) {
        if (isLoading) {
            btn.innerHTML = '<i class="bi bi-arrow-clockwise spin me-2"></i>VERIFICANDO...';
            btn.disabled = true;
        } else {
            btn.innerHTML = '<i class="bi bi-search me-2"></i>VERIFICAR';
            btn.disabled = false;
        }
    }
}

/**
 * Mostra seá§á£o de informaá§áµes do token
 */
function showTokenInfo() {
    const section = document.getElementById('token-info-section');
    if (section) {
        section.style.display = 'block';
        
        // Apá³s mostrar as informaá§áµes, verifica se pode habilitar a compra
        console.log('“¢ Sistema: Seá§á£o de informaá§áµes exibida, verificando se pode habilitar compra...');
        if (buyFunctionName) {
            enablePurchaseSection();
        }
    }
}

/**
 * Esconde seá§á£o de informaá§áµes do token
 */
function hideTokenInfo() {
    const section = document.getElementById('token-info-section');
    if (section) {
        section.style.display = 'none';
    }
}

/**
 * Mostra detalhes da transaá§á£o
 */
function showTransactionDetails(receipt, tokensQuantity, totalValue) {
    const section = document.getElementById('transactionDetails');
    if (section) {
        section.style.display = 'block';
        
        // Preenche os dados
        document.getElementById('txHash').textContent = receipt.transactionHash;
        document.getElementById('txTokensReceived').textContent = `${formatNumber(tokensQuantity)} ${tokenInfo.symbol}`;
        document.getElementById('txValue').textContent = `${formatNumber(totalValue)} BNB`;
        
        // Calcula gas usado
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.effectiveGasPrice || ethers.utils.parseUnits('5', 'gwei');
        const gasCost = ethers.utils.formatEther(gasUsed.mul(gasPrice));
        document.getElementById('txGasPrice').textContent = `${formatNumber(gasCost)} BNB`;
        
        // Total pago
        const totalCost = parseFloat(totalValue) + parseFloat(gasCost);
        document.getElementById('txTotalCost').textContent = `${formatNumber(totalCost)} BNB`;
    }
}

/**
 * Formata náºmeros para exibiá§á£o de forma amigá¡vel
 */
function formatNumber(num) {
    const number = parseFloat(num);
    if (isNaN(number) || number === 0) return '0';
    
    // Para náºmeros muito grandes
    if (number >= 1000000000) {
        return (number / 1000000000).toFixed(2) + 'B';
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
    } 
    // Para náºmeros muito pequenos, mostrar com mais precisá£o sem notaá§á£o cientá­fica
    else if (number < 1 && number > 0) {
        // Encontrar quantas casas decimais sá£o necessá¡rias
        const str = number.toString();
        if (str.includes('e-')) {
            // Se ainda tem notaá§á£o cientá­fica, converter para decimal fixo
            const parts = str.split('e-');
            const decimals = parseInt(parts[1]) + 2; // Adiciona 2 casas extras
            return number.toFixed(Math.min(decimals, 18)); // Má¡ximo 18 casas
        } else {
            return number.toFixed(6).replace(/\.?0+$/, ''); // Remove zeros desnecessá¡rios
        }
    } 
    // Para náºmeros normais
    else {
        return number.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
    }
}

// ==================== SISTEMA DE FEEDBACK ====================

/**
 * Adiciona mensagem na seá§á£o de contrato
 */
function addContractMessage(msg, type = 'info') {
    const listId = "contractErrors";
    const containerId = "contractResult";
    
    const container = document.getElementById(containerId);
    const list = document.getElementById(listId);
    
    if (container && list) {
        const li = document.createElement('li');
        li.innerHTML = msg;
        li.className = getMessageClass(type);
        list.appendChild(li);
        container.style.display = 'block';
        
        // Auto-scroll
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Adiciona mensagem na seá§á£o de compra
 */
function addPurchaseMessage(msg, type = 'info') {
    const listId = "purchaseErrors";
    const containerId = "purchaseResult";
    
    const container = document.getElementById(containerId);
    const list = document.getElementById(listId);
    
    if (container && list) {
        const li = document.createElement('li');
        li.innerHTML = msg;
        li.className = getMessageClass(type);
        list.appendChild(li);
        container.style.display = 'block';
        
        // Auto-scroll
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Limpa mensagens da seá§á£o de contrato
 */
function clearContractMessages() {
    const list = document.getElementById("contractErrors");
    const container = document.getElementById("contractResult");
    
    if (list) list.innerHTML = '';
    if (container) container.style.display = 'none';
}

/**
 * Limpa mensagens da seá§á£o de compra
 */
function clearPurchaseMessages() {
    const list = document.getElementById("purchaseErrors");
    const container = document.getElementById("purchaseResult");
    
    if (list) list.innerHTML = '';
    if (container) container.style.display = 'none';
}

/**
 * Retorna classe CSS baseada no tipo de mensagem
 */
function getMessageClass(type) {
    const classes = {
        'info': 'text-info',
        'success': 'text-success', 
        'warning': 'text-warning',
        'error': 'text-danger'
    };
    return classes[type] || 'text-info';
}

// ==================== FUNá‡á•ES GLOBAIS PARA COMPATIBILIDADE ====================

/**
 * Inicializa conexá£o da wallet (compatibilidade)
 */
function initializeWalletConnection() {
    // Monitora mudaná§as de rede e conta
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                walletConnected = true;
                updateWalletUI();
                // Atualizar saldo quando trocar de conta
                setTimeout(() => {
                    updateWalletBalance();
                }, 500);
            } else {
                walletConnected = false;
                walletAddress = '';
                // Reset da interface
                location.reload();
            }
        });
        
        window.ethereum.on('chainChanged', () => {
            // Recarrega a pá¡gina quando muda de rede
            location.reload();
        });
    }
    
    // Verificaá§á£o periá³dica menos frequente (60 segundos se conectado)
    setInterval(() => {
        if (walletConnected && walletAddress && !balanceUpdateInProgress) {
            updateWalletBalance();
        }
    }, 60000); // 60 segundos
}

// ==================== SISTEMA DE FALLBACK RPC ====================

/**
 * Inicializa provider com fallback para resolver problemas de RPC
 * ESTRATá‰GIA: Usa APENAS RPC páºblico para leitura, MetaMask apenas para transaá§áµes
 */
async function initializeProviderWithFallback() {
    // Evitar inicializaá§áµes máºltiplas
    if (providerInitialized && currentProvider) {
        // Provider já¡ inicializado, reutilizando...
        return currentProvider;
    }
    
    // Inicializando provider com estratá©gia RPC-primeiro
    
    // NUNCA usa MetaMask para operaá§áµes de leitura
    // Detecta chain ID da MetaMask para usar RPC correspondente
    let chainId = 97; // BSC Testnet padrá£o
    
    try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        chainId = parseInt(currentChainId, 16);
        console.log(`Œ Chain ID detectado: ${chainId}`);
    } catch (error) {
        console.warn('âš ï¸ Ná£o foi possá­vel detectar chain ID, usando BSC Testnet');
    }
    
    // RPC endpoints por rede
    const rpcEndpoints = {
        97: [  // BSC Testnet
            'https://data-seed-prebsc-1-s1.binance.org:8545',
            'https://bsc-testnet.binance.org',
            'https://data-seed-prebsc-2-s1.binance.org:8545',
            'https://bsc-testnet-rpc.publicnode.com'
        ],
        56: [  // BSC Mainnet
            'https://bsc-dataseed.binance.org',
            'https://bsc-dataseed1.defibit.io',
            'https://bsc-dataseed1.ninicoin.io'
        ]
    };
    
    const endpoints = rpcEndpoints[chainId] || rpcEndpoints[97];
    
    for (let i = 0; i < endpoints.length; i++) {
        const rpcUrl = endpoints[i];
        try {
            console.log(`” Testando RPC ${i + 1}/${endpoints.length}: ${rpcUrl}`);
            
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            
            // Teste rá¡pido de conectividade (3s timeout)
            const network = await Promise.race([
                provider.getNetwork(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);
            
            console.log(`… RPC funcionando: ${rpcUrl} - Rede: ${network.name} (${network.chainId})`);
            return provider;
            
        } catch (error) {
            console.warn(`âŒ RPC ${i + 1} falhou: ${rpcUrl} - ${error.message}`);
        }
    }
    
    throw new Error('âŒ Todos os RPC endpoints falharam - verifique sua conexá£o com a internet');
}

/**
 * Obtá©m URL de RPC fallback baseado na rede
 */
function getFallbackRpcUrl(chainId) {
    const rpcUrls = {
        97: [
            'https://data-seed-prebsc-1-s1.binance.org:8545/',
            'https://data-seed-prebsc-2-s1.binance.org:8545/',
            'https://bsc-testnet.publicnode.com'
        ],  // BSC Testnet
        56: [
            'https://bsc-dataseed.binance.org/',
            'https://bsc-mainnet.public.blastapi.io',
            'https://bsc.publicnode.com'
        ],  // BSC Mainnet
        1: [
            'https://cloudflare-eth.com/',
            'https://ethereum.publicnode.com',
            'https://rpc.ankr.com/eth'
        ],  // Ethereum Mainnet
        137: [
            'https://polygon-rpc.com/',
            'https://polygon.publicnode.com',
            'https://rpc.ankr.com/polygon'
        ]   // Polygon Mainnet
    };
    
    const urls = rpcUrls[chainId];
    return urls ? urls[0] : null; // Retorna primeiro RPC disponá­vel
}

/**
 * Tenta obter cá³digo do contrato com retry
 */
async function getCodeWithRetry(contractAddress, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const code = await currentProvider.getCode(contractAddress);
            return code;
        } catch (error) {
            console.warn(`âš ï¸ Tentativa ${attempt}/${maxRetries} falhou:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Aguarda antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

/**
 * Retry com provider alternativo - tenta máºltiplos RPCs
 */
async function retryWithFallbackProvider(contractAddress) {
    // Detecta chain ID
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const chainIdDecimal = parseInt(chainId, 16);
    
    // Obtá©m lista de RPCs
    const rpcUrls = getFallbackRpcUrls(chainIdDecimal);
    if (!rpcUrls || rpcUrls.length === 0) {
        throw new Error('Nenhum RPC alternativo disponá­vel para esta rede');
    }
    
    // Tenta cada RPC atá© encontrar um que funcione
    for (let i = 0; i < rpcUrls.length; i++) {
        try {
            const rpcUrl = rpcUrls[i];
            addContractMessage(`”„ Tentando RPC ${i + 1}/${rpcUrls.length}: ${rpcUrl}`, 'info');
            
            // Cria novo provider
            const fallbackProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
            
            // Testa conectividade
            await fallbackProvider.getNetwork();
            
            // Testa com novo provider
            const code = await fallbackProvider.getCode(contractAddress);
            if (code === '0x') {
                throw new Error('Endereá§o ná£o á© um smart contract vá¡lido');
            }
            
            addContractMessage('… Smart contract detectado via RPC alternativo', 'success');
            
            // Atualiza provider global
            currentProvider = fallbackProvider;
            currentSigner = null; // Sem signer no RPC páºblico
            providerInitialized = true; // Marca como inicializado
            
            // Continua verificaá§á£o
            currentContract = new ethers.Contract(contractAddress, CONFIG.tokenABI, currentProvider);
            await verifyERC20Functions();
            await verifyBuyFunctions();
            await loadTokenInfo();
            showTokenInfo();
            
            addContractMessage('Ž‰ Contrato verificado com RPC alternativo!', 'success');
            addContractMessage('âš ï¸ Para transaá§áµes, reconecte com MetaMask', 'warning');
            return; // Sucesso, sai da funá§á£o
            
        } catch (error) {
            console.warn(`âŒ RPC ${rpcUrls[i]} falhou:`, error.message);
            if (i === rpcUrls.length - 1) {
                // ášltimo RPC tambá©m falhou
                throw new Error(`Todos os RPCs falharam. ášltimo erro: ${error.message}`);
            }
        }
    }
}

/**
 * Retorna lista completa de RPCs para fallback
 */
function getFallbackRpcUrls(chainId) {
    const rpcUrls = {
        97: [
            'https://data-seed-prebsc-1-s1.binance.org:8545/',
            'https://data-seed-prebsc-2-s1.binance.org:8545/',
            'https://bsc-testnet.publicnode.com',
            'https://endpoints.omniatech.io/v1/bsc/testnet/public'
        ],  // BSC Testnet
        56: [
            'https://bsc-dataseed.binance.org/',
            'https://bsc-mainnet.public.blastapi.io',
            'https://bsc.publicnode.com',
            'https://endpoints.omniatech.io/v1/bsc/mainnet/public'
        ],  // BSC Mainnet
        1: [
            'https://cloudflare-eth.com/',
            'https://ethereum.publicnode.com',
            'https://rpc.ankr.com/eth',
            'https://endpoints.omniatech.io/v1/eth/mainnet/public'
        ],  // Ethereum Mainnet
        137: [
            'https://polygon-rpc.com/',
            'https://polygon.publicnode.com',
            'https://rpc.ankr.com/polygon',
            'https://endpoints.omniatech.io/v1/matic/mainnet/public'
        ]   // Polygon Mainnet
    };
    
    return rpcUrls[chainId] || [];
}

// ==================== CONTROLES DO SISTEMA ====================

/**
 * Funá§á£o de limpeza simplificada - removida porque agora usa location.reload()
 * O botá£o "Limpar e Recomeá§ar" simplesmente recarrega a pá¡gina
 */

// ==================== EXPORTS ====================

// Tornar funá§áµes disponá­veis globalmente para compatibilidade
window.DynamicTokenPurchase = {
    connectWallet,
    verifyContract,
    executePurchase,
    calculateTotal,
    addContractMessage,
    addPurchaseMessage,
    clearContractMessages,
    clearPurchaseMessages,
    initializeProviderWithFallback,
    retryWithFallbackProvider
};

// CSS para animaá§á£o de loading
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);




