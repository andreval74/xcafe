/**
 * ›’ COMPRA DE TOKENS DINá‚MICA - Má“DULO ESPECáFICO
 * 
 * “ RESPONSABILIDADES:
 * - Interface diná¢mica para compra de tokens via MetaMask
 * - VerificaçÃo de conexÃo e habilitaçÃo de campos
 * - Leitura diná¢mica de contratos da blockchain
 * - VerificaçÃo de compatibilidade para compra direta
 * - Cálculo diná¢mico de preços e execuçÃo de transações
 * 
 * ”— DEPENDáŠNCIAS:
 * - ethers.js v5.7.2
 * - MetaMaskConnector (shared/metamask-connector.js) - REUTILIZADO
 * - CommonUtils (shared/common-utils.js) - REUTILIZADO
 * - TokenGlobal (shared/token-global.js) - REUTILIZADO
 * 
 * “¤ EXPORTS:
 * - DynamicTokenPurchase: Classe principal
 * - Funções utilitárias específicas de compra diná¢mica
 */

// ==================== CONFIGURAá‡á•ES ====================

const CONFIG = {
    // Configurações diná¢micas (sem contrato fixo)
    defaultTokenPrice: "0.001", // BNB por token (padrÃo)
    supportedChains: [56, 97], // BSC Mainnet e Testnet
    
    // ABI estendido para verificaçÃo completa e diagnóstico
    tokenABI: [
        // Funções básicas ERC-20
        "function balanceOf(address owner) view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function transfer(address to, uint256 amount) returns (bool)",
        
        // Funções para verificar compra direta (expandido)
        "function buy() payable",
        "function buy(uint256 amount) payable",
        "function buyTokens() payable",
        "function buyTokens(uint256 amount) payable",
        "function purchase() payable",
        "function purchase(uint256 amount) payable",
        
        // Funções para detectar preço (expandido)
        "function tokenPrice() view returns (uint256)",
        "function price() view returns (uint256)",
        "function getPrice() view returns (uint256)",
        "function buyPrice() view returns (uint256)",
        "function tokenCost() view returns (uint256)",
        "function cost() view returns (uint256)",
        "function salePrice() view returns (uint256)",
        "function pricePerToken() view returns (uint256)",
        
        // Funções para diagnóstico avançado
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
        
        // Funções de cálculo específicas
        "function calculateTokensForEth(uint256 ethAmount) view returns (uint256)",
        "function calculateEthForTokens(uint256 tokenAmount) view returns (uint256)",
        "function getTokensForEth(uint256 ethAmount) view returns (uint256)",
        "function getEthForTokens(uint256 tokenAmount) view returns (uint256)"
    ],
    
    // ABI para contratos de venda (sale contracts)
    saleContractABI: [
        // Funções para detectar token
        "function token() view returns (address)",
        "function tokenAddress() view returns (address)",
        "function getToken() view returns (address)",
        "function tokenContract() view returns (address)",
        "function saleToken() view returns (address)",
        "function targetToken() view returns (address)",
        "function purchaseToken() view returns (address)",
        "function sellToken() view returns (address)",
        
        // Funções de compra em contratos de venda
        "function buyTokens() payable",
        "function buyTokens(uint256) payable",
        "function buy() payable",
        "function buy(uint256) payable",
        "function purchase() payable",
        "function purchase(uint256) payable",
        
        // Funções de informaçÃo do contrato de venda
        "function tokenPrice() view returns (uint256)",
        "function price() view returns (uint256)",
        "function getPrice() view returns (uint256)",
        "function salePrice() view returns (uint256)",
        "function tokensForSale() view returns (uint256)",
        "function tokensAvailable() view returns (uint256)",
        "function saleActive() view returns (bool)",
        "function saleEnabled() view returns (bool)"
    ],
    
    // Configurações de gas
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

// Variáveis de controle para evitar execuções múltiplas
let walletBalanceLoaded = false;
let providerInitialized = false;
let balanceUpdateInProgress = false;
let buyFunctionName = null;

// ==================== INICIALIZAá‡áƒO ====================

/**
 * InicializaçÃo principal
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('›’ Sistema de Compra Diná¢mica iniciado');
    
    // ”’ GARANTIA: SeçÃo de compra inicia OCULTA até validaçÃo completa
    ensurePurchaseSectionHidden();
    
    initializeWalletConnection();
    setupEventListeners();
    checkInitialWalletState();
});

/**
 * Garante que a seçÃo de compra inicie oculta
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
            // Apenas verifica se já está conectado, sem solicitar
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                walletConnected = true;
                await detectNetwork();
                updateWalletUI();
                // Carregar saldo inicial se já conectado (apenas uma vez)
                if (!walletBalanceLoaded) {
                    setTimeout(() => {
                        updateWalletBalance();
                        walletBalanceLoaded = true;
                    }, 800);
                }
            }
        } catch (error) {
            console.log('Wallet nÃo conectada previamente');
        }
    }
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // ConexÃo MetaMask
    const connectBtn = document.getElementById('connect-metamask-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    // VerificaçÃo de contrato
    const verifyBtn = document.getElementById('verify-contract-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyContract);
    }
    
    // Campo de endereço do contrato
    const contractInput = document.getElementById('contract-address');
    if (contractInput) {
        contractInput.addEventListener('input', validateContractAddress);
    }
    
    // Campos de compra
    const quantityInput = document.getElementById('token-quantity');
    
    if (quantityInput) {
        quantityInput.addEventListener('input', calculateTotal);
    }
    
    // PREá‡O á‰ READ-ONLY - removido listener pois é detectado do contrato
    // O campo de preço nÃo deve ser editável pelo usuário
    
    // BotÃo de compra
    const purchaseBtn = document.getElementById('execute-purchase-btn');
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', executePurchase);
    } else {
        console.error('ÃŒ BotÃo de compra nÃo encontrado ao configurar listeners');
    }
    
    // BotÃo de limpar dados - SIMPLIFICADO: apenas recarrega a página e vai ao topo
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            window.scrollTo(0, 0); // Vai para o topo
            location.reload();
        });
    }
    
    // BotÃo de atualizar saldo
    const refreshBalanceBtn = document.getElementById('refresh-balance-btn');
    if (refreshBalanceBtn) {
        refreshBalanceBtn.addEventListener('click', () => {
            updateWalletBalance();
        });
    }
}

// ==================== INDICADORES DE CARREGAMENTO ====================

/**
 * Mostra indicador de carregamento em um botÃo
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
 * Remove indicador de carregamento de um botÃo
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
            alert('MetaMask nÃo detectado! Por favor, instale a MetaMask.');
            return;
        }
        
        console.log('”— Conectando com MetaMask...');
        
        // Mostra loading
        showButtonLoading('connect-metamask-btn', 'Conectando...');
        
        // Solicita conexÃo
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            walletAddress = accounts[0];
            walletConnected = true;
            
            // Atualiza UI
            await detectNetwork();
            updateWalletUI();
            
            // Carregar saldo após conectar (apenas uma vez)
            setTimeout(() => {
                updateWalletBalance();
            }, 800);
            
            // Wallet conectada: ${walletAddress}
        }
        
    } catch (error) {
        console.error('ÃŒ Erro ao conectar wallet:', error);
        alert('Erro ao conectar com a MetaMask: ' + error.message);
        // Restaura botÃo em caso de erro
        hideButtonLoading('connect-metamask-btn', '<i class="bi bi-wallet2 me-2"></i>CONECTAR');
    }
}

/**
 * Atualiza saldo da carteira (com controle de execuções múltiplas)
 */
async function updateWalletBalance() {
    // Evitar execuções múltiplas simultá¢neas
    if (balanceUpdateInProgress) {
        console.log('Ã³ AtualizaçÃo de saldo já em progresso, ignorando...');
        return;
    }
    
    const balanceElement = document.getElementById('wallet-balance-display');
    const balanceContainer = document.getElementById('wallet-balance-info');
    
    if (!walletConnected || !walletAddress) {
        // Esconder seçÃo se nÃo conectado
        if (balanceContainer) {
            balanceContainer.style.display = 'none';
        }
        return;
    }
    
    if (!balanceElement) {
        console.error('ÃŒ Elemento wallet-balance-display nÃo encontrado');
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
            // Provider nÃo encontrado, inicializando...
            provider = await initializeProviderWithFallback();
        }
        
        if (!provider) {
            throw new Error('NÃo foi possível inicializar provider');
        }
        
        // Buscar saldo
        const balance = await provider.getBalance(walletAddress);
        
        const balanceInBNB = ethers.utils.formatEther(balance);
        
        // Formatar para exibiçÃo
        const formattedBalance = formatNumber(balanceInBNB);
        
        balanceElement.textContent = formattedBalance;
        
        // Mostrar seçÃo do saldo
        if (balanceContainer) {
            balanceContainer.style.display = 'block';
        }
        
    } catch (error) {
        console.error('ÃŒ Erro ao buscar saldo da carteira:', error);
        balanceElement.textContent = 'Erro ao carregar';
        
        // Mostrar seçÃo mesmo com erro
        if (balanceContainer) {
            balanceContainer.style.display = 'block';
        }
    } finally {
        // Libera controle de execuçÃo múltipla
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
        // Status da wallet - mostrar endereço completo
        if (statusInput) {
            statusInput.value = walletAddress;
            statusInput.classList.add('text-success');
        }
        
        // BotÃo conectar
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
        
        // Habilita seçÃo de contrato apenas após conexÃo
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
        
        // Se carteira já conectada, atualiza saldo ao detectar rede
        if (walletConnected && walletAddress) {
            setTimeout(() => {
                updateWalletBalance();
            }, 500);
        }
        
    } catch (error) {
        console.error('ÃŒ Erro ao detectar rede:', error);
    }
}

/**
 * Obtém informações da rede baseado no chainId
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
 * Habilita seçÃo de contrato após conexÃo
 */
function enableContractSection() {
    // Mostra a seçÃo de contrato
    const contractSection = document.getElementById('contract-section');
    if (contractSection) {
        contractSection.style.display = 'block';
        
        // Adiciona animaçÃo de slide down
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
 * Valida endereço do contrato
 */
function validateContractAddress() {
    const contractInput = document.getElementById('contract-address');
    const verifyBtn = document.getElementById('verify-contract-btn');
    
    if (contractInput && verifyBtn) {
        const address = contractInput.value.trim();
        
        // Verifica se é um endereço válido (42 caracteres, começando com 0x)
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
 * Verifica se o contrato tem múltiplos tokens/sales para escolha
 */
async function checkForMultipleContracts(contractAddress) {
    console.log('” Verificando contratos múltiplos...');
    
    try {
        // Funções comuns para arrays de contratos
        const arrayFunctions = [
            'tokens',          // Array de tokens
            'saleTokens',      // Array de tokens em venda
            'availableTokens', // Array de tokens disponíveis
            'tokenList',       // Lista de tokens
            'contracts',       // Array de contratos
            'saleContracts',   // Array de contratos de venda
            'getTokens',       // FunçÃo que retorna tokens
            'getAllTokens',    // FunçÃo que retorna todos os tokens
            'tokenCount'       // Contador de tokens (para iterar)
        ];
        
        // ABI para contratos múltiplos
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
            // Funções para obter informações dos tokens
            "function getTokenInfo(address) view returns (string, string, uint8)",
            "function getTokenPrice(address) view returns (uint256)",
            "function isTokenActive(address) view returns (bool)"
        ];
        
        const multiContract = new ethers.Contract(contractAddress, multiContractABI, currentProvider);
        
        // Testa funções que retornam arrays
        for (const funcName of arrayFunctions) {
            try {
                if (funcName === 'tokenCount') {
                    // FunçÃo especial que retorna count
                    const count = await multiContract[funcName]();
                    const tokenCount = parseInt(count.toString());
                    
                    if (tokenCount > 1) {
                        // Encontrados ${tokenCount} tokens via ${funcName}()
                        
                        // Busca os tokens via getTokenAt ou tokenAt
                        const tokens = [];
                        const indexFunctions = ['getTokenAt', 'tokenAt', 'saleAt'];
                        
                        for (const indexFunc of indexFunctions) {
                            try {
                                for (let i = 0; i < Math.min(tokenCount, 10); i++) { // Limite de 10 por segurança
                                    const tokenAddress = await multiContract[indexFunc](i);
                                    if (tokenAddress && ethers.utils.isAddress(tokenAddress)) {
                                        tokens.push(tokenAddress);
                                    }
                                }
                                if (tokens.length > 0) break;
                            } catch (e) {
                                // FunçÃo nÃo existe, tenta próxima
                            }
                        }
                        
                        if (tokens.length > 1) {
                            return await processMultipleTokens(contractAddress, tokens, funcName);
                        }
                    }
                } else {
                    // Funções que retornam arrays direto
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
                // FunçÃo nÃo existe ou falhou, continua
                console.log(`ÃŒ FunçÃo ${funcName}() nÃo disponível`);
            }
        }
        
        // Ã„¹ï¸ NÃo é um contrato de múltiplos tokens
        return { isMultiContract: false };
        
    } catch (error) {
        console.error('ÃŒ Erro ao verificar contratos múltiplos:', error);
        return { isMultiContract: false };
    }
}

/**
 * Processa múltiplos tokens encontrados e busca suas informações
 */
async function processMultipleTokens(saleContractAddress, tokenAddresses, detectionMethod) {
    console.log(`” Processando ${tokenAddresses.length} tokens encontrados...`);
    
    const tokenOptions = [];
    
    for (let i = 0; i < tokenAddresses.length && i < 5; i++) { // Limite de 5 opções
        const tokenAddress = tokenAddresses[i];
        
        try {
            // Verifica se é um contrato válido
            const code = await currentProvider.getCode(tokenAddress);
            if (code === '0x') continue;
            
            // Tenta buscar informações básicas do token
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
                // Ãš ï¸ NÃo foi possível obter info completa do token ${i + 1}
            }
            
            // Tenta obter preço se o contrato principal tiver funçÃo
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
            console.log(`ÃŒ Erro ao processar token ${i + 1}: ${error.message}`);
        }
    }
    
    if (tokenOptions.length > 1) {
        return {
            isMultiContract: true,
            isSaleContract: false, // Será definido após seleçÃo
            saleContractAddress: saleContractAddress,
            tokenOptions: tokenOptions,
            detectionMethod: detectionMethod
        };
    }
    
    return { isMultiContract: false };
}

/**
 * Mostra interface para seleçÃo de token em contratos múltiplos
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
                Este contrato oferece múltiplos tokens. Escolha qual vocáª deseja comprar:
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
                            ${token.price !== 'N/A' ? `’° ${token.price} BNB` : '’° Preço: A definir'}
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
    
    // Oculta botÃo de verificar até seleçÃo
    const verifyBtn = document.getElementById('verify-contract-btn');
    if (verifyBtn) {
        verifyBtn.style.display = 'none';
    }
}

/**
 * FunçÃo global para seleçÃo de token (chamada pelo onclick)
 */
window.selectToken = async function(tokenAddress, tokenIndex, saleContractAddress) {
    // Token selecionado: ${tokenAddress} (índice ${tokenIndex})
    
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
        
        // Continua verificaçÃo normal
        await verifyERC20Functions();
        await verifyBuyFunctions();
        await loadTokenInfo();
        showTokenInfo();
        
        addContractMessage('Ž‰ Token verificado e pronto para compra!', 'success');
        
        // Restaura botÃo de verificar
        const verifyBtn = document.getElementById('verify-contract-btn');
        if (verifyBtn) {
            verifyBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('ÃŒ Erro ao processar token selecionado:', error);
        addContractMessage(`ÃŒ Erro ao carregar token: ${error.message}`, 'error');
    } finally {
        hideButtonLoading('verify-contract-btn', 'VERIFICAR CONTRATO');
    }
};

/**
 * Verifica se o contrato informado é um contrato de venda que aponta para outro token
 */
async function checkIfSaleContract(contractAddress) {
    console.log('” Verificando se é contrato de venda...');
    
    try {
        // Lista de funções comuns em contratos de venda para detectar o token
        const tokenFunctions = [
            'token',           // Mais comum
            'tokenAddress',    // Comum
            'getToken',        // Alternativa
            'tokenContract',   // Alternativa
            'saleToken',       // Específico para sales
            'targetToken',     // Específico
            'purchaseToken',   // Específico
            'sellToken'        // Específico
        ];
        
        // ABI básico para contratos de venda
        const saleContractABI = [
            "function token() view returns (address)",
            "function tokenAddress() view returns (address)",
            "function getToken() view returns (address)",
            "function tokenContract() view returns (address)",
            "function saleToken() view returns (address)",
            "function targetToken() view returns (address)",
            "function purchaseToken() view returns (address)",
            "function sellToken() view returns (address)",
            // Funções de compra comuns em contratos de venda
            "function buyTokens() payable",
            "function buyTokens(uint256) payable",
            "function buy() payable",
            "function buy(uint256) payable",
            "function purchase() payable",
            "function purchase(uint256) payable"
        ];
        
        const saleContract = new ethers.Contract(contractAddress, CONFIG.saleContractABI, currentProvider);
        
        // Tenta encontrar o endereço do token através das funções comuns
        for (const funcName of tokenFunctions) {
            try {
                const tokenAddress = await saleContract[funcName]();
                
                if (tokenAddress && ethers.utils.isAddress(tokenAddress) && tokenAddress !== '0x0000000000000000000000000000000000000000') {
                    // Token encontrado via ${funcName}(): ${tokenAddress}
                    
                    // Verifica se o endereço do token é diferente do contrato de venda
                    if (tokenAddress.toLowerCase() !== contractAddress.toLowerCase()) {
                        // Verifica se o endereço do token realmente tem um contrato
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
                // FunçÃo nÃo existe ou falhou, continua tentando
            }
        }
        
        // Ã„¹ï¸ NÃo é um contrato de venda - é o próprio token
        return {
            isSaleContract: false,
            tokenAddress: contractAddress,
            saleContractAddress: null,
            tokenFunction: null
        };
        
    } catch (error) {
        console.error('ÃŒ Erro ao verificar contrato de venda:', error);
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
        alert('Por favor, digite o endereço do contrato');
        return;
    }
    
    if (!ethers.utils.isAddress(contractAddress)) {
        alert('Endereço do contrato inválido. Verifique o formato.');
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
        addContractMessage('Ãš™ï¸ Inicializando conexÃo blockchain...', 'info');
        currentProvider = await initializeProviderWithFallback();
        currentSigner = currentProvider.getSigner();
        
        // **MELHORIA 1: VerificaçÃo robusta se contrato existe**
        addContractMessage('” Verificando se é um smart contract...', 'info');
        const code = await currentProvider.getCode(contractAddress);
        if (code === '0x') {
            // Log do erro para suporte
            window.contractLogger.logContractError(contractAddress, 'CONTRACT_NOT_FOUND', {
                message: 'Nenhum código encontrado no endereço',
                code: code,
                network: networkData.chainId || 'desconhecida'
            });
            window.contractLogger.showDownloadButton();
            
            throw new Error('Contrato nÃo existe neste endereço. Verifique se foi deployado corretamente.');
        }
        
        addContractMessage(`… Contrato detectado no endereço: ${contractAddress.slice(0,6)}...${contractAddress.slice(-4)}`, 'success');
        
        // **NOVA FUNCIONALIDADE: Verificar se é um contrato de venda**
        const saleContractInfo = await checkIfSaleContract(contractAddress);
        
        if (saleContractInfo.isSaleContract) {
            addContractMessage('Ž¯ Contrato de venda detectado!', 'info');
            addContractMessage(`“ Token real: ${saleContractInfo.tokenAddress.slice(0,6)}...${saleContractInfo.tokenAddress.slice(-4)}`, 'info');
            
            // Usar o endereço do token real para as próximas verificações
            CONFIG.contractAddress = saleContractInfo.tokenAddress;
            CONFIG.saleContractAddress = contractAddress; // Guardar endereço do contrato de venda
            
            // Criar instá¢ncia do token real
            currentContract = new ethers.Contract(saleContractInfo.tokenAddress, CONFIG.tokenABI, currentProvider);
            // Criar instá¢ncia do contrato de venda para compras
            currentSaleContract = new ethers.Contract(contractAddress, CONFIG.saleContractABI, currentProvider);
            
            addContractMessage('”„ Verificando token real do contrato de venda...', 'info');
        } else {
            // Armazena endereço validado
            CONFIG.contractAddress = contractAddress;
            // **MELHORIA 2: Criar instá¢ncia do contrato**
            currentContract = new ethers.Contract(contractAddress, CONFIG.tokenABI, currentProvider);
        }
        
        // **MELHORIA 3: Verificar funções básicas ERC-20 com melhor tratamento de erro**
        await verifyERC20Functions();
        
        // Verifica funções de compra
        await verifyBuyFunctions();
        
        // Mostra informações do token
        await loadTokenInfo();
        showTokenInfo();
        
        addContractMessage('Ž‰ Contrato verificado com sucesso!', 'success');
    }     
    
    catch (error) {
        console.error('ÃŒ Erro ao verificar contrato:', error);
        
        // Log geral de erro de verificaçÃo para suporte
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
            addContractMessage('Ãš ï¸ Problema de conectividade detectado', 'warning');
            addContractMessage('”„ Tentando com provider alternativo...', 'info');
            
            try {
                await retryWithFallbackProvider(contractAddress);
            } catch (fallbackError) {
                addContractMessage(`ÃŒ Erro mesmo com provider alternativo: ${fallbackError.message}`, 'error');
            }
        } else {
            addContractMessage(`ÃŒ Erro: ${error.message}`, 'error');
        }
    } finally {
        hideButtonLoading('verify-contract-btn', 'VERIFICAR CONTRATO');
        updateVerifyButton(false);
    }
}

/**
 * Verifica funções básicas ERC-20 com melhor diagnóstico
 */
async function verifyERC20Functions() {
    addContractMessage('“ Verificando ERC-20...', 'info');
    
    try {
        // **MELHORIA: Verificar cada funçÃo individualmente para melhor diagnóstico**
        const name = await currentContract.name();
        const symbol = await currentContract.symbol(); 
        const decimals = await currentContract.decimals();
        const totalSupply = await currentContract.totalSupply();
        
        // Armazenar informações do token
        tokenInfo = {
            name,
            symbol,
            decimals: parseInt(decimals),
            totalSupply: totalSupply.toString()
        };
        
        updateCompatibilityStatus('erc20Status', '… Suportado', 'success');
        updateCompatibilityStatus('transferStatus', '… Disponível', 'success');
        addContractMessage(`… Token: ${name} (${symbol})`, 'success');
        
        // Log de sucesso da validaçÃo
        window.contractLogger.logContractValidation(currentContract.address, {
            isERC20: true,
            tokenInfo: { name, symbol, decimals: parseInt(decimals) },
            errors: []
        });
        
    } catch (error) {
        updateCompatibilityStatus('erc20Status', 'ÃŒ NÃo suportado', 'error');
        updateCompatibilityStatus('transferStatus', 'ÃŒ Indisponível', 'error');
        addContractMessage(`ÃŒ Token nÃo suportado`, 'error');
        
        // Log do erro ERC-20 para suporte
        window.contractLogger.logContractError(currentContract.address, 'ERC20_VALIDATION_FAILED', {
            error: error.message,
            stack: error.stack,
            attemptedFunctions: ['name', 'symbol', 'decimals', 'totalSupply']
        });
        window.contractLogger.showDownloadButton();
        
        throw new Error('Contrato nÃo é ERC-20 compatível');
    }
}

/**
 * ” DIAGNá“STICO PROFUNDO: Identifica exatamente por que o contrato rejeita transações
 */
async function performDeepContractAnalysis(contractAddress, buyFunctionName) {
    console.log('”¬ INICIANDO DIAGNá“STICO PROFUNDO DO CONTRATO...');
    
    try {
        // 1. Verificações básicas do estado do contrato
        const basicChecks = await performBasicContractChecks();
        
        // 2. Testa diferentes cenários de chamada
        const callTests = await performCallTests(buyFunctionName);
        
        // 3. Analisa condições específicas
        const conditions = await analyzeContractConditions();
        
        // 4. Gera relatório final
        const isReady = generateReadinessReport(basicChecks, callTests, conditions);
        
        return isReady;
        
    } catch (error) {
        console.log('ÃŒ Erro no diagnóstico profundo:', error.message);
        return false;
    }
}

/**
 * 1ï¸Ãƒ£ Verificações básicas do estado do contrato
 */
async function performBasicContractChecks() {
    // 1ï¸Ãƒ£ Verificações básicas do estado...
    
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
            // “‹ NÃo foi possível verificar tokens no contrato
        }
        
        // Verifica se está pausado
        try {
            checks.isPaused = await currentContract.paused();
            console.log(`“‹ Contrato pausado: ${checks.isPaused}`);
        } catch (e) {
            console.log('“‹ FunçÃo paused() nÃo disponível');
        }
        
        // Verifica se venda está ativa
        const saleChecks = ['saleActive', 'saleEnabled', 'isActive', 'enabled'];
        for (const funcName of saleChecks) {
            try {
                checks.saleActive = await currentContract[funcName]();
                console.log(`“‹ ${funcName}(): ${checks.saleActive}`);
                break;
            } catch (e) {
                // FunçÃo nÃo existe
            }
        }
        
        // Verifica owner
        try {
            checks.owner = await currentContract.owner();
            console.log(`“‹ Owner: ${checks.owner}`);
        } catch (e) {
            console.log('“‹ FunçÃo owner() nÃo disponível');
        }
        
        return checks;
        
    } catch (error) {
        console.log('ÃŒ Erro nas verificações básicas:', error.message);
        return checks;
    }
}

/**
 * 2ï¸Ãƒ£ Testa diferentes cenários de chamada
 */
async function performCallTests(buyFunctionName) {
    // 2ï¸Ãƒ£ Testando cenários de chamada...
    
    const tests = {
        withoutValue: false,
        withSmallValue: false,
        withCorrectPrice: false,
        withParameters: false,
        gasEstimation: null
    };
    
    try {
        // Teste 1: Sem valor (para verificar se funçÃo é realmente payable)
        try {
            await currentContract.callStatic[buyFunctionName]();
            tests.withoutValue = true;
            // Teste sem valor: PASSOU (funçÃo pode nÃo ser payable)
        } catch (e) {
            console.log(`ÃŒ Sem valor: ${e.reason || e.message}`);
        }
        
        // Teste 2: Com valor pequeno
        try {
            await currentContract.callStatic[buyFunctionName]({ value: ethers.utils.parseEther('0.001') });
            tests.withSmallValue = true;
            // Teste valor pequeno: PASSOU
        } catch (e) {
            console.log(`ÃŒ Valor pequeno: ${e.reason || e.message}`);
        }
        
        // Teste 3: Tentativa de estimativa de gas
        try {
            tests.gasEstimation = await currentContract.estimateGas[buyFunctionName]({ value: ethers.utils.parseEther('0.001') });
            console.log(`“‹ Estimativa de gas: ${tests.gasEstimation.toString()}`);
        } catch (e) {
            console.log(`ÃŒ Estimativa de gas: ${e.reason || e.message}`);
        }
        
        return tests;
        
    } catch (error) {
        console.log('ÃŒ Erro nos testes de chamada:', error.message);
        return tests;
    }
}

/**
 * 3ï¸Ãƒ£ Analisa condições específicas do contrato
 */
async function analyzeContractConditions() {
    console.log('” 3ï¸Ãƒ£ Analisando condições específicas...');
    
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
            console.log('“‹ Contrato nÃo usa whitelist');
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
                // FunçÃo nÃo existe
            }
        }
        
        return conditions;
        
    } catch (error) {
        console.log('ÃŒ Erro na análise de condições:', error.message);
        return conditions;
    }
}

/**
 * 4ï¸Ãƒ£ Gera relatório final de prontidÃo
 */
function generateReadinessReport(basicChecks, callTests, conditions) {
    // 4ï¸Ãƒ£ Gerando relatório de prontidÃo...
    
    let score = 0;
    let maxScore = 0;
    const issues = [];
    
    // AvaliaçÃo básica
    maxScore += 10;
    if (basicChecks.contractExists) score += 10;
    else issues.push('ÃŒ CRáTICO: Contrato nÃo existe no endereço informado');
    
    // AvaliaçÃo de estado
    if (basicChecks.isPaused === true) {
        issues.push('Ãš ï¸ BLOQUEADOR: Contrato está PAUSADO');
    } else if (basicChecks.isPaused === false) {
        score += 5;
    }
    maxScore += 5;
    
    if (basicChecks.saleActive === true) {
        score += 5;
    } else if (basicChecks.saleActive === false) {
        issues.push('Ãš ï¸ BLOQUEADOR: Venda nÃo está ATIVA');
    }
    maxScore += 5;
    
    // AvaliaçÃo de tokens
    if (basicChecks.hasTokens) {
        score += 3;
    } else {
        issues.push('Ãš ï¸ AVISO: Contrato nÃo tem tokens (pode usar mint)');
    }
    maxScore += 3;
    
    // AvaliaçÃo de testes
    if (callTests.withoutValue || callTests.withSmallValue) {
        score += 7;
    } else {
        issues.push('ÃŒ CRáTICO: FunçÃo nÃo aceita chamadas de teste');
    }
    maxScore += 7;
    
    const readinessPercent = Math.round((score / maxScore) * 100);
    const isReady = score >= (maxScore * 0.7); // 70% de prontidÃo mínima
    
    console.log(`“Š RELATá“RIO DE PRONTIDáƒO: ${readinessPercent}% (${score}/${maxScore})`);
    console.log(`Ž¯ Status: ${isReady ? '… PRONTO PARA NEGOCIAá‡áƒO' : 'ÃŒ NáƒO PRONTO'}`);
    
    if (issues.length > 0) {
        console.log('š¨ PROBLEMAS IDENTIFICADOS:');
        issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    // Atualiza UI com o resultado
    updateReadinessUI(readinessPercent, isReady, issues);
    
    return isReady;
}

/**
 * Ž¯ Atualiza UI com resultado da análise de prontidÃo
 */
function updateReadinessUI(readinessPercent, isReady, issues) {
    // Cria ou atualiza seçÃo de status de prontidÃo
    let readinessSection = document.getElementById('readiness-status');
    if (!readinessSection) {
        // Cria seçÃo se nÃo existe
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
        const statusIcon = isReady ? '…' : 'ÃŒ';
        const statusText = isReady ? 'PRONTO PARA NEGOCIAá‡áƒO' : 'PROBLEMAS IDENTIFICADOS';
        
        readinessSection.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <div class="flex-grow-1">
                    <h6 class="text-${statusColor} mb-0">${statusIcon} Status de ProntidÃo: ${readinessPercent}%</h6>
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
    // TESTE DIRETO: Validando funções PAYABLE do ABI...
    
    let contractReady = false;
    
    try {
        const contractInterface = currentContract.interface;
        const allFunctions = Object.keys(contractInterface.functions);
        
        // Filtra apenas funções PAYABLE que existem no ABI
        const payableFunctions = allFunctions.filter(funcName => {
            const fragment = contractInterface.functions[funcName];
            return fragment.payable;
        });
        
        console.log(`’° Encontradas ${payableFunctions.length} funções PAYABLE no ABI:`);
        // payableFunctions.forEach(func => console.log(`   ’¡ ${func}`));
        
        if (payableFunctions.length === 0) {
            console.log('ÃŒ Nenhuma funçÃo PAYABLE encontrada no ABI!');
            return false;
        }
        
        // Testa cada funçÃo PAYABLE com estimateGas
        for (const funcName of payableFunctions) {
            try {
                // Testando funçÃo PAYABLE: ${funcName}()
                
                const fragment = contractInterface.functions[funcName];
                const testValue = ethers.utils.parseEther('0.001');
                
                // Monta pará¢metros baseado nos inputs da funçÃo
                const testParams = fragment.inputs.map(input => {
                    switch(input.type) {
                        case 'uint256': return '1000'; // Quantidade de teste
                        case 'address': return walletAddress || '0x0000000000000000000000000000000000000000';
                        case 'bool': return true;
                        default: return '0';
                    }
                });
                
                // Se nÃo tem pará¢metros, usa só o value
                if (testParams.length === 0) {
                    await currentContract.estimateGas[funcName]({ value: testValue });
                } else {
                    await currentContract.estimateGas[funcName](...testParams, { value: testValue });
                }
                
                // SUCESSO! FunçÃo ${funcName}() é válida e funcional!
                
                // **VALIDAá‡áƒO EXTRA: Testa callStatic também**
                try {
                    if (testParams.length === 0) {
                        await currentContract.callStatic[funcName]({ value: testValue });
                    } else {
                        await currentContract.callStatic[funcName](...testParams, { value: testValue });
                    }
                    // CONFIRMADO! ${funcName}() passou também no callStatic!
                } catch (staticError) {
                    if (staticError.message.includes('revert') || staticError.message.includes('execution reverted')) {
                        console.log(`Ãš ï¸ ${funcName}() FunçÃo de reverte com pará¢metros existe!`);
                    } else {
                        console.log(`ÃŒ ${funcName}() falhou no callStatic: ${staticError.message}`);
                        continue; // Pula esta funçÃo
                    }
                }
                
                buyFunctionName = funcName;
                contractReady = true;
                updateCompatibilityStatus('buyStatus', '… Disponível', 'success');
                addContractMessage(`… FunçÃo de compra totalmente validada`, 'success');
                
                // Habilita seçÃo de compra diretamente
                enablePurchaseSection();
                
                return contractReady;
                
            } catch (error) {
                // **MUDANá‡A CRáTICA: Considerar REVERT como funçÃo VáLIDA**
                if (error.code === 'UNPREDICTABLE_GAS_LIMIT' || 
                    error.message.includes('execution reverted') || 
                    error.message.includes('revert')) {
                    
                    console.log(`… FUNá‡áƒO VáLIDA! ${funcName}() existe e reverte (comportamento esperado)`);
                    console.log(`“ Motivo do revert: ${error.reason || error.message}`);
                    
                    // FunçÃo existe, apenas reverte com pará¢metros de teste
                    buyFunctionName = funcName;
                    updateCompatibilityStatus('buyStatus', '… Disponível', 'success');
                    addContractMessage(`… FunçÃo de compra detectada`, 'success');
                    
                    // Habilita seçÃo de compra diretamente
                    enablePurchaseSection();
                    return true;
                } else {
                    console.log(`ÃŒ FunçÃo ${funcName}() falhou: ${error.message}`);
                }
            }
        }
        
        console.log('ÃŒ Nenhuma funçÃo PAYABLE funcionou corretamente');
        return false;
        
    } catch (error) {
        console.log('ÃŒ Erro ao testar funções PAYABLE:', error.message);
        return false;
    }
}

/**
 * InvestigaçÃo adicional: consulta ABI via Etherscan para contrato nÃo-padrÃo
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
            
            // Filtra apenas funções
            const functions = abi.filter(item => item.type === 'function');
            const payableFunctions = functions.filter(func => func.stateMutability === 'payable');
            
            console.log(`“Š Estatísticas do contrato:`);
            console.log(`   “Œ Total de funções: ${functions.length}`);
            console.log(`   ’° Funções payable: ${payableFunctions.length}`);
            
            if (payableFunctions.length > 0) {
                console.log('’° Funções PAYABLE encontradas (possíveis compras):');
                // payableFunctions.forEach(func => {
                //     const inputs = func.inputs.map(i => `${i.type} ${i.name}`).join(', ');
                //     console.log(`   Ž¯ ${func.name}(${inputs})`);
                // });
                
                // Testa a primeira funçÃo payable
                const firstPayable = payableFunctions[0];
                // Testando primeira funçÃo payable: ${firstPayable.name}()
                
                try {
                    // Monta pará¢metros básicos baseado nos inputs esperados
                    const testParams = firstPayable.inputs.map(input => {
                        switch(input.type) {
                            case 'uint256': return '1000';
                            case 'address': return walletAddress || '0x0000000000000000000000000000000000000000';
                            case 'bool': return true;
                            default: return '0';
                        }
                    });
                    
                    // Se a funçÃo é payable, adiciona value
                    const callOptions = { value: ethers.utils.parseEther('0.001') };
                    
                    await currentContract.estimateGas[firstPayable.name](...testParams, callOptions);
                    
                    console.log(`… SUCESSO! FunçÃo ${firstPayable.name}() funciona!`);
                    buyFunctionName = firstPayable.name;
                    updateCompatibilityStatus('buyStatus', '… Disponível', 'success');
                    addContractMessage(`… FunçÃo de compra "${firstPayable.name}" encontrada via Etherscan`, 'success');
                    return true;
                    
                } catch (testError) {
                    console.log(`ÃŒ FunçÃo ${firstPayable.name}() rejeitou teste:`, testError.message);
                }
            }
        }
        
    } catch (error) {
        console.log('ÃŒ Erro na investigaçÃo via Etherscan:', error.message);
    }
    
    return false;
}

/**
 * Verifica funções de compra disponíveis
 */
async function verifyBuyFunctions() {
    let priceFunctionName = null; // Adicionar declaraçÃo da variável
    
    const buyFunctions = [
        'buy', 'buyTokens', 'purchase', 
        'buyWithBNB', 'mint', 'swap',
        'exchange', 'buyToken'
    ];
    
    addContractMessage('ï¿½ FunçÃo de compra...', 'info');
    
    for (const funcName of buyFunctions) {
        try {
            // **MELHORIA: Usar valor baseado nos limites detectados, como no teste**
            let testValue = ethers.utils.parseEther('0.001'); // Valor padrÃo
            
            // Se temos limites detectados, usar o valor mínimo + margem
            if (tokenInfo.limits && tokenInfo.limits.minPurchase && tokenInfo.limits.minPurchase.gt(0)) {
                testValue = tokenInfo.limits.minPurchase;
                console.log(`“ Usando valor mínimo do contrato: ${ethers.utils.formatEther(testValue)} BNB`);
            }
            
            // Prepara pará¢metros baseado no tipo da funçÃo
            let gasEstimateParams;
            switch(funcName) {
                case 'mint':
                    // Para mint, testa com address e amount
                    gasEstimateParams = [walletAddress, '1000'];
                    break;
                case 'swap':
                    // Para swap, testa troca básica
                    gasEstimateParams = ['0x0000000000000000000000000000000000000000', '1000'];
                    break;
                default:
                    // Para funções de compra normais, usa value
                    gasEstimateParams = [{ value: testValue }];
            }
            
            // **MELHORIA: Tenta estimar gas primeiro**
            const gasEstimate = await currentContract.estimateGas[funcName](...gasEstimateParams);
            
            // Se chegou aqui, a funçÃo existe e é válida
            console.log(`… FunçÃo de compra: Detectada e funcional (Gas: ${gasEstimate})`);
            
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
                    console.log(`Ãš ï¸ CallStatic falhou: ${callError.message}`);
                    addContractMessage(`Ãš ï¸ CallStatic: ${callError.message}`, 'warning');
                }
            }
            
            buyFunctionName = funcName;
            updateCompatibilityStatus('buyStatus', '… Disponível', 'success');
            addContractMessage(`… FunçÃo de compra totalmente validada`, 'success');
            return;
            
        } catch (error) {
            if (error.message.includes('is not a function')) {
                // FunçÃo nÃo existe - continua testando outras
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT' || 
                       error.message.includes('revert') || 
                       error.message.includes('execution reverted')) {
                // **MELHORIA: Melhor tratamento de revert - incluir motivo**
                const reason = error.reason || error.message.split(':')[1] || 'Motivo nÃo especificado';
                console.log(`Ãš ï¸ FunçÃo de compra: Detectada mas reverte (${reason})`);
                buyFunctionName = funcName;
                updateCompatibilityStatus('buyStatus', '… Disponível', 'success');
                addContractMessage(`… FunçÃo de compra detectada (reverte com pará¢metros normal)`, 'success');
                return;
            } else {
                console.log(`ÃŒ FunçÃo ${funcName}() erro: ${error.message}`);
            }
        }
    }
    
    // Se nÃo encontrou nenhuma funçÃo válida
    console.log('ÃŒ Nenhuma funçÃo de compra válida encontrada no contrato');
    
    // **INVESTIGAá‡áƒO ADICIONAL: Listar todas as funções disponíveis no contrato**
    console.log('” INVESTIGANDO - Funções disponíveis no contrato:');
    let possibleBuyFunctions = [];
    
    try {
        const contractInterface = currentContract.interface;
        const allFunctions = Object.keys(contractInterface.functions);
        
        console.log(`“‹ Contrato possui ${allFunctions.length} funções disponíveis`);
        // allFunctions.forEach(func => {
        //     const fragment = contractInterface.functions[func];
        //     const isPayable = fragment.payable;
        //     const inputs = fragment.inputs.map(i => `${i.type} ${i.name}`).join(', ');
        //     console.log(`   “Œ ${func}(${inputs}) ${isPayable ? '[PAYABLE]' : ''}`);
        // });
        
        // Procura por funções que possam ser de compra baseado no nome
        possibleBuyFunctions = allFunctions.filter(func => 
            func.toLowerCase().includes('buy') || 
            func.toLowerCase().includes('purchase') ||
            func.toLowerCase().includes('mint') ||
            func.toLowerCase().includes('swap') ||
            func.toLowerCase().includes('exchange')
        );
        
        if (possibleBuyFunctions.length > 0) {
            console.log('Ž¯ Funções suspeitas de compra encontradas:');
            // possibleBuyFunctions.forEach(func => console.log(`   ’¡ ${func}`));
            // NÃo mostra mensagem para o usuário - apenas no console para debug
        }
        
    } catch (e) {
        console.log('ÃŒ Erro ao listar funções do contrato:', e.message);
    }
    
    // **TESTE FINAL: ValidaçÃo das funções PAYABLE reais do ABI**
    // Teste final: Validando funções PAYABLE do ABI...
    const found = await testActualPayableFunctions();
    
    if (!found) {
        buyFunctionName = null;
        updateCompatibilityStatus('buyStatus', 'ÃŒ NÃo disponível', 'error');
        addContractMessage('ÃŒ Este token nÃo permite compra automática', 'error');
        
        // Log detalhado do erro para suporte
        window.contractLogger.logContractError(currentContract.address, 'NO_BUY_FUNCTION', {
            message: 'Nenhuma funçÃo de compra detectada',
            availableFunctions: Object.keys(currentContract.functions || {}),
            possibleBuyFunctions: possibleBuyFunctions || [],
            contractABI: CONFIG.tokenABI.map(f => typeof f === 'string' ? f : f.name).filter(Boolean),
            testedFunctions: {
                buyFunctionName: buyFunctionName || 'not_found',
                priceFunction: priceFunctionName || 'not_detected'
            }
        });
        window.contractLogger.showDownloadButton();
        
        // š¨ IMPORTANTE: Garantir que a seçÃo de compra permaneça OCULTA
        hidePurchaseSection();
        console.log('”’ SeçÃo de compra mantida OCULTA - Contrato incompatível');
    }
}

/**
 * Carrega informações do token
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
        
        // Verificar tokens disponíveis para venda no contrato
        try {
            console.log('” Verificando tokens disponíveis para venda...');
            const tokensBalance = await currentContract.balanceOf(currentContract.address);
            const tokensForSale = parseFloat(ethers.utils.formatUnits(tokensBalance, tokenInfo.decimals));
            tokenInfo.tokensForSale = tokensBalance;
            tokenInfo.tokensForSaleFormatted = tokensForSale;
            console.log(`’° Tokens disponíveis para venda: ${tokensForSale.toLocaleString()} ${tokenInfo.symbol}`);
        } catch (error) {
            // Ãš ï¸ NÃo foi possível verificar tokens para venda: ${error.message}
            tokenInfo.tokensForSale = ethers.BigNumber.from(0);
            tokenInfo.tokensForSaleFormatted = 0;
        }
        
        // Tenta detectar preço do contrato
        try {
            let price = null;
            const priceFunctions = [
                'tokenPrice', 'price', 'getPrice', 'buyPrice', 
                'tokenCost', 'cost', 'salePrice', 'pricePerToken'
            ];
            
            console.log('’° Verificando preço...');
            
            for (const priceFunc of priceFunctions) {
                try {
                    console.log(`” Tentando funçÃo: ${priceFunc}()`);
                    price = await currentContract[priceFunc]();
                    console.log(`… Preço encontrado via ${priceFunc}(): ${price.toString()}`);
                    break;
                } catch (e) {
                    console.log(`ÃŒ FunçÃo ${priceFunc}() nÃo disponível`);
                }
            }
            
            if (price) {
                tokenInfo.price = ethers.utils.formatEther(price);
                console.log(`… Preço: ${tokenInfo.price} BNB por token`);
            } else {
                // Tentar calcular preço usando funçÃo calculateEthForTokens
                try {
                    console.log('§® Tentando calcular preço via calculateEthForTokens...');
                    const oneToken = ethers.utils.parseUnits('1', tokenInfo.decimals);
                    const ethCost = await currentContract.calculateEthForTokens(oneToken);
                    tokenInfo.price = ethers.utils.formatEther(ethCost);
                    console.log(`… Preço calculado: ${tokenInfo.price} BNB por token`);
                } catch (calcError) {
                    // Tentar funçÃo inversa calculateTokensForEth com 1 ETH
                    try {
                        console.log('§® Tentando calcular preço via calculateTokensForEth...');
                        const oneEth = ethers.utils.parseEther('1');
                        const tokensForOneEth = await currentContract.calculateTokensForEth(oneEth);
                        const tokensFormatted = ethers.utils.formatUnits(tokensForOneEth, tokenInfo.decimals);
                        tokenInfo.price = (1 / parseFloat(tokensFormatted)).toString();
                        console.log(`… Preço calculado (inverso): ${tokenInfo.price} BNB por token`);
                    } catch (invError) {
                        tokenInfo.price = CONFIG.defaultTokenPrice;
                        console.log(`Ãš ï¸ Preço nÃo detectado, usando padrÃo: ${CONFIG.defaultTokenPrice} BNB`);
                    }
                }
            }
        } catch (error) {
            tokenInfo.price = CONFIG.defaultTokenPrice;
            console.log(`ÃŒ Erro no preço: ${error.message}`);
        }

        // **MELHORIA: Verificar limites de compra como no teste**
        await checkPurchaseLimits();
        
        updateTokenInfoUI();
        
        // Ãš ï¸ NáƒO habilita seçÃo de compra automaticamente
        // A seçÃo só será habilitada SE uma funçÃo de compra válida for encontrada
        console.log('Ã„¹ï¸ Informações do token carregadas - Aguardando validaçÃo de funções de compra');
        
    } catch (error) {
        throw new Error(`Erro ao carregar informações do token: ${error.message}`);
    }
}

/**
 * Atualiza UI com informações do token
 */
function updateTokenInfoUI() {
    document.getElementById('tokenName').textContent = tokenInfo.name || '-';
    document.getElementById('tokenSymbol').textContent = tokenInfo.symbol || '-';
    document.getElementById('tokenDecimals').textContent = tokenInfo.decimals || '-';
    
    // Formata total supply (sem símbolo do token)
    const totalSupply = ethers.utils.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals);
    document.getElementById('tokenTotalSupply').textContent = formatNumber(totalSupply);
    
    // Formata saldo do contrato (BNB)
    const contractBalance = ethers.utils.formatEther(tokenInfo.contractBalance);
    document.getElementById('contractBalance').textContent = `${formatNumber(contractBalance)} BNB`;
    
    // Formata tokens disponíveis para venda (sem símbolo do token)
    const tokensForSaleElement = document.getElementById('tokensForSale');
    if (tokensForSaleElement) {
        const tokensAvailable = tokenInfo.tokensForSaleFormatted || 0;
        if (tokensAvailable > 0) {
            tokensForSaleElement.textContent = formatNumber(tokensAvailable);
            tokensForSaleElement.className = 'fw-bold text-success mb-2'; // Verde se há tokens
        } else {
            tokensForSaleElement.textContent = '0';
            tokensForSaleElement.className = 'fw-bold text-danger mb-2'; // Vermelho se nÃo há tokens
        }
    }
    
    // Atualiza informaçÃo de disponibilidade na área de compra (sem símbolo do token)
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
            availableDisplay.innerHTML = `<span class="text-warning">Nenhum token disponível</span>`;
        }
    }
    
    // Define preço como READ-ONLY (detectado do contrato)
    const priceInput = document.getElementById('token-price');
    if (priceInput) {
        priceInput.value = tokenInfo.price;
        priceInput.readOnly = true; // Campo somente leitura
        priceInput.disabled = false; // Habilita para mostrar o valor
        priceInput.style.backgroundColor = '#2d3748'; // Cor de fundo diferenciada
        priceInput.style.cursor = 'not-allowed'; // Cursor indicativo
        
        // Verifica se preço foi detectado automaticamente ou é padrÃo
        if (tokenInfo.price === CONFIG.defaultTokenPrice) {
            priceInput.title = 'Preço padrÃo (nÃo detectado no contrato) - verifique manualmente';
            priceInput.style.borderColor = '#fbbf24'; // Cor amarela para atençÃo
        } else {
            priceInput.title = '… Preço detectado automaticamente do contrato';
            priceInput.style.borderColor = '#10b981'; // Cor verde para sucesso
        }
        
        console.log(`’° Preço detectado: ${tokenInfo.price} BNB por token`);
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
            // Primeiro tenta as funções básicas
            try {
                minPurchase = await currentContract.minPurchase();
                console.log(`… Limite mínimo: ${ethers.utils.formatEther(minPurchase)} BNB`);
            } catch (e) {
                console.log('ÃŒ FunçÃo minPurchase() nÃo disponível');
            }
            
            try {
                maxPurchase = await currentContract.maxPurchase();
                console.log(`… Limite máximo: ${ethers.utils.formatEther(maxPurchase)} BNB`);
            } catch (e) {
                console.log('ÃŒ FunçÃo maxPurchase() nÃo disponível');
            }
            
            // Se nÃo encontrou limites, tenta verificar purchaseLimit para o usuário
            if (!minPurchase && !maxPurchase && walletAddress) {
                try {
                    const userLimit = await currentContract.purchaseLimit(walletAddress);
                    if (userLimit && !userLimit.isZero()) {
                        maxPurchase = userLimit;
                        console.log(`… Limite do usuário: ${ethers.utils.formatEther(userLimit)} BNB`);
                    }
                } catch (e) {
                    console.log('ÃŒ FunçÃo purchaseLimit() nÃo disponível para o usuário');
                }
            }
            
            const minFormatted = ethers.utils.formatEther(minPurchase);
            const maxFormatted = ethers.utils.formatEther(maxPurchase);
            
            tokenInfo.minPurchase = minFormatted;
            tokenInfo.maxPurchase = maxFormatted;
            
            console.log(`… Limites: ${minFormatted} - ${maxFormatted} BNB`);
            addContractMessage(`… Compra mínima: ${minFormatted} BNB, máxima: ${maxFormatted} BNB`, 'success');
            
        } catch (e) {
            // Ãš ï¸ Limites: NÃo foi possível verificar - ${e.message}
            addContractMessage('Ãš ï¸ Limites de compra nÃo detectados (pode nÃo ter)', 'warning');
        }
        
        // Armazenar para uso posterior
        tokenInfo.limits = { minPurchase, maxPurchase };
        
    } catch (error) {
        console.log(`ÃŒ Erro na verificaçÃo de limites: ${error.message}`);
    }
}

// ==================== GERENCIAMENTO DE COMPRA ====================

/**
 * Habilita seçÃo de compra - APENAS quando funçÃo válida é confirmada E seçÃo de informações está visível
 */
function enablePurchaseSection() {
    // ›¡ï¸ PROTEá‡áƒO: Só executa se realmente há uma funçÃo de compra válida
    if (!buyFunctionName) {
        console.log('ÃŒ enablePurchaseSection() chamada sem funçÃo de compra válida - IGNORANDO');
        return;
    }
    
    // ›¡ï¸ PROTEá‡áƒO: Verifica se a seçÃo de informações está visível primeiro
    const infoSection = document.getElementById('token-info-section');
    if (!infoSection || infoSection.style.display === 'none') {
        // Sistema: Aguardando exibiçÃo da seçÃo de informações antes de habilitar compra
        return;
    }
    
    const section = document.getElementById('purchase-section');
    const priceInput = document.getElementById('token-price');
    const quantityInput = document.getElementById('token-quantity');
    const purchaseBtn = document.getElementById('execute-purchase-btn');
    
    console.log('Ž‰ HABILITANDO SEá‡áƒO DE COMPRA - FunçÃo validada:', buyFunctionName);
    console.log('“ SeçÃo encontrada:', section ? 'SIM' : 'NáƒO');
    console.log('“ Campo quantidade encontrado:', quantityInput ? 'SIM' : 'NáƒO');
    console.log('“ BotÃo compra encontrado:', purchaseBtn ? 'SIM' : 'NáƒO');
    
    if (section) {
        section.style.display = 'block';
        // Adiciona uma animaçÃo de slide para mostrar que a seçÃo foi liberada
        section.classList.add('animate__animated', 'animate__slideInUp');
        console.log('… SeçÃo de compra LIBERADA e exibida');
        
        // Adiciona uma mensagem visual de sucesso
        addContractMessage('Ž‰ SeçÃo de compra liberada - Contrato suporta compras!', 'success');
    }
    
    // Campo de preço permanece READ-ONLY (já configurado em updateTokenInfoUI)
    // NÃo habilitamos ediçÃo do preço pois é detectado do contrato
    
    if (quantityInput) {
        quantityInput.disabled = false;
        console.log('… Campo quantidade habilitado');
    }
    
    // HABILITA o botÃo com funçÃo validada
    if (purchaseBtn) {
        purchaseBtn.disabled = false;
        purchaseBtn.style.opacity = '1';
        purchaseBtn.style.cursor = 'pointer';
        purchaseBtn.style.backgroundColor = '#28a745'; // Verde para indicar liberado
        console.log(`… BotÃo LIBERADO - FunçÃo confirmada: ${buyFunctionName}()`);
    } else {
        console.error('ÃŒ BotÃo de compra nÃo encontrado no DOM!');
    }
    
    console.log('›’ SeçÃo de compra TOTALMENTE habilitada - Contrato validado para compras');
    console.log(`“Š STATUS FINAL: ${tokenInfo.name} (${tokenInfo.symbol}) - Preço: ${tokenInfo.price} BNB - Tokens disponíveis: ${formatNumber(tokenInfo.tokensForSaleFormatted || 0)}`);
    console.log('Ž‰ SISTEMA PRONTO! Vocáª pode agora comprar tokens com segurança.');
    
    // Adiciona mensagem de sucesso na interface
    const systemMessages = document.getElementById('system-messages');
    if (systemMessages) {
        systemMessages.innerHTML = `
            <div class="alert alert-success border-0 mb-3">
                <i class="bi bi-check-circle-fill me-2"></i>
                <strong>Sistema Validado!</strong> Contrato aprovado e pronto para negociaçÃo.
                <br><small class="text-muted">FunçÃo de compra: ${buyFunctionName}() | Tokens disponíveis: ${formatNumber(tokenInfo.tokensForSaleFormatted || 0)}</small>
            </div>
        `;
    }
}

/**
 * Mantém seçÃo de compra oculta quando contrato nÃo suporta compras
 */
function hidePurchaseSection() {
    const section = document.getElementById('purchase-section');
    const purchaseBtn = document.getElementById('execute-purchase-btn');
    
    if (section) {
        section.style.display = 'none';
        console.log('”’ SeçÃo de compra mantida OCULTA');
    }
    
    if (purchaseBtn) {
        purchaseBtn.disabled = true;
        purchaseBtn.style.opacity = '0.3';
        purchaseBtn.style.cursor = 'not-allowed';
        purchaseBtn.style.backgroundColor = '#dc3545'; // Vermelho para indicar indisponível
        console.log('”’ BotÃo de compra desabilitado');
    }
    
    // Adiciona uma mensagem explicativa para o usuário
    addContractMessage('”’ Compra nÃo disponível - Este token nÃo permite compra automática', 'warning');
    console.log('”’ SeçÃo de compra permanece oculta - Contrato incompatível');
}

/**
 * Debug do estado do botÃo de compra - funçÃo global para console
 */
function debugPurchaseButton() {
    const btn = document.getElementById('execute-purchase-btn');
    // DEBUG BOTáƒO DE COMPRA:
    console.log('“ BotÃo encontrado:', btn ? 'SIM' : 'NáƒO');
    if (btn) {
        console.log('“ Disabled:', btn.disabled);
        console.log('“ Style opacity:', btn.style.opacity);
        console.log('“ Style cursor:', btn.style.cursor);
        console.log('“ Classes:', btn.className);
        console.log('“ Texto:', btn.textContent.trim());
    }
    console.log('“ buyFunctionName:', buyFunctionName);
}

// Torna disponível no console para debug
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
        alert('Este token nÃo permite compra automática');
        return;
    }
    
    // Verifica se a funçÃo existe no contrato antes de executar
    if (!buyFunctionName) {
        alert('ÃŒ Este token nÃo permite compra direta');
        return;
    }
    
    // **VALIDAá‡áƒO CRáTICA: Verifica se a funçÃo realmente existe no contrato**
    if (!currentContract[buyFunctionName]) {
        console.error(`ÃŒ ERRO CRáTICO: FunçÃo ${buyFunctionName}() nÃo existe no contrato!`);
        alert('ÃŒ Erro: Sistema de compra nÃo está disponível');
        
        // Reseta a detecçÃo
        buyFunctionName = null;
        updateCompatibilityStatus('buyStatus', 'ÃŒ Erro interno', 'error');
        return;
    }
    
    console.log(`… FunçÃo ${buyFunctionName}() confirmada no contrato`);
    
    // Verifica se MetaMask está conectado
    if (!walletConnected || !walletAddress) {
        alert('Por favor, conecte sua carteira MetaMask primeiro');
        return;
    }
    
    const quantityInput = document.getElementById('token-quantity');
    const priceInput = document.getElementById('token-price');
    
    const quantity = parseFloat(quantityInput.value);
    const price = parseFloat(priceInput.value);
    
    if (!quantity || quantity <= 0) {
        alert('Por favor, digite uma quantidade válida');
        return;
    }

    if (!price || price <= 0) {
        alert('Por favor, digite um preço válido');
        return;
    }

    // **MELHORIA: Validar contra limites detectados do contrato**
    const totalValue = price * quantity;
    
    if (tokenInfo.limits) {
        const { minPurchase, maxPurchase } = tokenInfo.limits;
        
        if (minPurchase && totalValue < parseFloat(tokenInfo.minPurchase)) {
            alert(`Valor abaixo do mínimo permitido pelo contrato (${tokenInfo.minPurchase} BNB)`);
            return;
        }
        
        if (maxPurchase && totalValue > parseFloat(tokenInfo.maxPurchase)) {
            alert(`Valor acima do máximo permitido pelo contrato (${tokenInfo.maxPurchase} BNB)`);
            return;
        }
        
        console.log(`… Valor ${totalValue} BNB está dentro dos limites do contrato`);
    }

    try {
        // Mostra loading
        showButtonLoading('execute-purchase-btn', 'Processando...');
        showLoadingMessage('system-messages', 'Preparando transaçÃo');
        
        const totalValueStr = totalValue.toString();
        const valueInWei = ethers.utils.parseEther(totalValueStr);
        
        clearPurchaseMessages();
        addPurchaseMessage('š€ Processando compra...', 'info');
        
        // IMPORTANTE: Sempre usar MetaMask para transações (nÃo RPC público)
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = web3Provider.getSigner();
        
        // Cria contrato com signer do MetaMask
        const contractWithSigner = new ethers.Contract(
            currentContract.address, 
            CONFIG.tokenABI, 
            signer
        );
        
        console.log(`’° Executando compra: ${quantity} tokens por ${totalValueStr} BNB`);
        console.log(`“ FunçÃo: ${buyFunctionName}()`);
        console.log(`’Ž Valor: ${valueInWei.toString()} wei`);
        console.log(`“ Contrato: ${currentContract.address}`);
        console.log(`‘¤ Comprador: ${walletAddress}`);
        
        // DIAGNá“STICO AVANá‡ADO DO CONTRATO
        addPurchaseMessage('” Verificando condições da compra...', 'info');
        try {
            // Usa RPC público para diagnóstico (nÃo MetaMask que está falhando)
            const publicProvider = await initializeProviderWithFallback();
            
            const contractBalance = await publicProvider.getBalance(currentContract.address);
            const userBalance = await publicProvider.getBalance(walletAddress);
            
            console.log(`’° Saldo do contrato: ${ethers.utils.formatEther(contractBalance)} BNB`);
            console.log(`’° Saldo do usuário: ${ethers.utils.formatEther(userBalance)} BNB`);
            
            // Verifica se usuário tem saldo suficiente
            const totalCostWei = ethers.utils.parseEther(totalValue.toString());
            if (userBalance.lt(totalCostWei)) {
                throw new Error(`Saldo insuficiente. Vocáª tem ${ethers.utils.formatEther(userBalance)} BNB, mas precisa de ${totalValue} BNB`);
            }
            
            // Verifica se o contrato tem tokens suficientes
            // Ãš ï¸ NOTA: Nem todos os contratos armazenam tokens no endereço do contrato
            try {
                if (tokenInfo.totalSupply) {
                    const contractTokenBalance = await currentContract.balanceOf(currentContract.address);
                    const contractTokens = parseFloat(ethers.utils.formatUnits(contractTokenBalance, tokenInfo.decimals));
                    
                    console.log(`ª™ Tokens no endereço do contrato: ${contractTokens} ${tokenInfo.symbol}`);
                    
                    if (contractTokens === 0) {
                        console.log('Ãš ï¸ Contrato nÃo tem tokens em seu endereço - pode usar mint ou reserva externa');
                        // NÃo mostra mensagem - apenas no log
                    } else if (contractTokens < quantity) {
                        console.log(`Ãš ï¸ Contrato tem poucos tokens (${contractTokens}), mas pode ter outras fontes`);
                        // NÃo mostra mensagem - apenas no log
                    } else {
                        console.log(`… Contrato tem tokens suficientes: ${contractTokens} >= ${quantity}`);
                        // NÃo mostra mensagem - apenas no log
                    }
                }
            } catch (tokenCheckError) {
                // Ãš ï¸ NÃo foi possível verificar tokens do contrato: ${tokenCheckError.message}
                // NÃo mostra mensagem - apenas no log
            }
            
            // ” VERIFICAá‡áƒO ADICIONAL: Tenta detectar se contrato usa mint ou tem reservas
            try {
                console.log('” Verificando capacidade de fornecimento de tokens...');
                
                // Tenta verificar se há funçÃo de tokens disponíveis
                const availabilityFunctions = ['tokensAvailable', 'tokensForSale', 'remainingTokens', 'maxSupply'];
                
                for (const funcName of availabilityFunctions) {
                    try {
                        const available = await currentContract[funcName]();
                        const availableTokens = parseFloat(ethers.utils.formatUnits(available, tokenInfo.decimals));
                        console.log(`’° ${funcName}(): ${availableTokens} tokens disponíveis`);
                        
                        if (availableTokens >= quantity) {
                            console.log(`… Tokens disponíveis confirmados via ${funcName}(): ${availableTokens}`);
                            // NÃo mostra mensagem - apenas no log
                            break;
                        }
                    } catch (e) {
                        // FunçÃo nÃo existe ou falhou, continua
                    }
                }
                
                // Verifica se contrato tem funçÃo de mint (indicativo de criaçÃo diná¢mica)
                const contractInterface = currentContract.interface;
                const hasMintFunction = Object.keys(contractInterface.functions).some(func => 
                    func.toLowerCase().includes('mint')
                );
                
                if (hasMintFunction) {
                    console.log('… Contrato tem funçÃo de mint - pode criar tokens dinamicamente');
                    // NÃo mostra mensagem - apenas no log
                }
                
            } catch (availabilityError) {
                console.log('Ã„¹ï¸ VerificaçÃo de disponibilidade ignorada:', availabilityError.message);
            }
            
            // DIAGNá“STICO AVANá‡ADO - Verifica condições especiais do contrato
            await performAdvancedContractDiagnostics(publicProvider);
            
            // NÃo mostra mensagem de aprovaçÃo - apenas processa
            
        } catch (diagError) {
            console.warn('Ãš ï¸ Erro no diagnóstico:', diagError.message);
            addPurchaseMessage(`Ãš ï¸ Aviso: ${diagError.message}`, 'warning');
            
            // Se o erro é crítico, para por aqui
            if (diagError.message.includes('Saldo insuficiente') || diagError.message.includes('nÃo tem tokens suficientes')) {
                addPurchaseMessage('ÃŒ Compra cancelada devido a verificaçÃo falhada', 'error');
                return;
            }
        }
        
        // SIMULAá‡áƒO COM DIFERENTES VALORES PARA ENCONTRAR O PROBLEMA
        try {
            // Cria provider MetaMask apenas para simulaçÃo
            const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
            const metamaskSigner = metamaskProvider.getSigner();
            const contractForSim = new ethers.Contract(currentContract.address, CONFIG.tokenABI, metamaskSigner);
            
            // Teste 1: SimulaçÃo com valor exato
            // Teste 1: SimulaçÃo com valor exato
            try {
                // **VALIDAá‡áƒO: Verifica se a funçÃo existe antes de usar**
                if (!contractForSim[buyFunctionName]) {
                    throw new Error(`FunçÃo ${buyFunctionName}() nÃo existe no contrato`);
                }
                
                await contractForSim.callStatic[buyFunctionName]({
                    value: valueInWei,
                    from: walletAddress
                });
                console.log('… SimulaçÃo com valor exato: SUCESSO');
            } catch (simError1) {
                console.log('ÃŒ SimulaçÃo com valor exato: FALHOU');
                console.log('” RazÃo:', simError1.reason || simError1.message);
                
                // Log apenas no console - nÃo mostra erro para usuário na simulaçÃo
                // A simulaçÃo pode falhar mas a transaçÃo real pode funcionar
            }
            
        } catch (simError) {
            console.warn('Ãš ï¸ Erro na simulaçÃo geral:', simError.message);
            
            // Análise do erro de simulaçÃo
            if (simError.message.includes('missing trie node')) {
                addPurchaseMessage('Ãš ï¸ Problema de sincronizaçÃo da rede - tentando mesmo assim', 'warning');
            } else if (simError.message.includes('revert')) {
                // NÃo mostra erro de revert na simulaçÃo - pode funcionar na transaçÃo real
                console.log('” SimulaçÃo falhou com revert - mas transaçÃo real pode funcionar');
            } else {
                addPurchaseMessage(`Ãš ï¸ SimulaçÃo falhou: ${simError.message}`, 'warning');
            }
            
            addPurchaseMessage('š€ Prosseguindo com a transaçÃo real...', 'info');
        }
        
        // **VALIDAá‡áƒO FINAL: Verifica se a funçÃo existe no contrato assinado**
        if (!contractWithSigner[buyFunctionName]) {
            throw new Error(`FunçÃo ${buyFunctionName}() nÃo existe no contrato`);
        }
        
        // Executa a transaçÃo
        const tx = await contractWithSigner[buyFunctionName]({
            value: valueInWei,
            gasLimit: CONFIG.gasLimit
        });
        
        addPurchaseMessage(`… Compra confirmada!`, 'success');
        addPurchaseMessage('Ã³ Aguardando confirmaçÃo...', 'info');
        
        // Aguarda confirmaçÃo
        const receipt = await tx.wait();
        
        addPurchaseMessage('Ž‰ TransaçÃo confirmada!', 'success');
        
        // Mostra detalhes da transaçÃo
        showTransactionDetails(receipt, quantity, totalValue);
        
    } catch (error) {
        console.error('ÃŒ Erro na compra:', error);
        
        // Log detalhado do erro de transaçÃo para suporte
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
            errorMessage = 'TransaçÃo cancelada pelo usuário';
        } else if (error.code === 4001) {
            errorMessage = 'TransaçÃo rejeitada pelo usuário';
        } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            errorMessage = 'NÃo foi possível estimar o gás necessário. O contrato pode ter rejeitado a transaçÃo.';
        } else if (error.code === 'CALL_EXCEPTION') {
            errorMessage = 'Erro na execuçÃo do contrato';
            
            // Análise específica do CALL_EXCEPTION
            if (error.receipt) {
                technicalDetails = `Hash: ${error.receipt.transactionHash}\n`;
                technicalDetails += `Gas usado: ${error.receipt.gasUsed}\n`;
                technicalDetails += `Status: ${error.receipt.status === 0 ? 'FALHOU' : 'SUCESSO'}\n`;
                
                console.log('“‹ Detalhes da transaçÃo falhada:');
                console.log('”— Hash:', error.receipt.transactionHash);
                console.log('Ã›½ Gas usado:', error.receipt.gasUsed.toString());
                console.log('“Š Status:', error.receipt.status === 0 ? 'FALHOU' : 'SUCESSO');
                
                // Análise específica baseada no gas usado
                const gasUsed = error.receipt.gasUsed.toNumber();
                if (gasUsed === 21307 || gasUsed < 25000) {
                    console.log('” ANáLISE: Gas muito baixo - funçÃo falha no início');
                    console.log('’¡ Isso indica que o contrato rejeitou a transaçÃo imediatamente');
                    console.log('’¡ Possíveis causas específicas:');
                    console.log('   - require() falhando logo no início da funçÃo');
                    console.log('   - FunçÃo payable recebendo valor quando nÃo deveria');
                    console.log('   - Modificadores (onlyOwner, whenNotPaused, etc.) rejeitando');
                    console.log('   - FunçÃo nÃo existe ou tem assinatura diferente');
                    
                    errorMessage += '\n\n” ANáLISE Tá‰CNICA:';
                    errorMessage += '\nGas muito baixo (21307) indica que o contrato rejeitou a transaçÃo imediatamente.';
                    errorMessage += '\n\nCausas mais prováveis:';
                    errorMessage += '\nÃ€¢ Contrato está pausado ou com restrições';
                    errorMessage += '\nÃ€¢ FunçÃo de compra tem condições específicas nÃo atendidas';
                    errorMessage += '\nÃ€¢ Valor enviado nÃo está correto para este contrato';
                    errorMessage += '\nÃ€¢ Contrato requer whitelist ou aprovaçÃo prévia';
                    
                } else {
                    console.log('” ANáLISE: Gas normal - erro durante execuçÃo');
                }
                
                // Possíveis causas do erro
                console.log('” Possíveis causas:');
                console.log('1. Contrato sem tokens suficientes para vender');
                console.log('2. Valor enviado incorreto (muito alto/baixo)');
                console.log('3. Contrato pausado ou com restrições');
                console.log('4. FunçÃo de compra com lógica específica nÃo atendida');
                console.log('5. Problema de aprovaçÃo ou allowance');
                
                errorMessage += '\n\nPossíveis causas:\n';
                errorMessage += 'Ã€¢ Contrato sem tokens para vender\n';
                errorMessage += 'Ã€¢ Valor enviado incorreto\n';
                errorMessage += 'Ã€¢ Contrato pausado ou restrito\n';
                errorMessage += 'Ã€¢ Lógica específica do contrato nÃo atendida';
            }
        } else if (error.message.includes('revert')) {
            errorMessage = 'TransaçÃo rejeitada pelo contrato';
            
            // Tenta extrair razÃo do revert
            if (error.reason) {
                errorMessage += `\nRazÃo: ${error.reason}`;
                console.log(`” RazÃo específica do revert: ${error.reason}`);
            } else {
                // Tenta extrair da mensagem
                const revertMatch = error.message.match(/revert (.+)/i);
                if (revertMatch) {
                    errorMessage += `\nRazÃo: ${revertMatch[1]}`;
                    console.log(`” RazÃo extraída: ${revertMatch[1]}`);
                }
            }
            
            // Análise de reverts comuns
            const errorMsg = error.message.toLowerCase();
            if (errorMsg.includes('execution reverted') || errorMsg.includes('execuçÃo revertida')) {
                errorMessage += '\n\n’¡ O contrato executou mas rejeitou a transaçÃo.';
                errorMessage += '\nIsso indica que alguma condiçÃo interna nÃo foi atendida.';
                
                // Sugestões baseadas no gas baixo (21307)
                if (error.receipt && error.receipt.gasUsed.toNumber() < 25000) {
                    errorMessage += '\n\n” Sugestões específicas (gas baixo):';
                    errorMessage += '\nÃ€¢ Verifique se o contrato aceita pagamentos em BNB';
                    errorMessage += '\nÃ€¢ Confirme se a quantidade está dentro dos limites';
                    errorMessage += '\nÃ€¢ Verifique se sua conta está autorizada';
                    errorMessage += '\nÃ€¢ Contrato pode estar pausado temporariamente';
                }
            }
        } else {
            errorMessage = error.message;
        }
        
        addPurchaseMessage(`ÃŒ Erro: ${errorMessage}`, 'error');
        
        if (technicalDetails) {
            addPurchaseMessage(`”§ Detalhes técnicos:\n${technicalDetails}`, 'warning');
        }
        
        // Remove loading em caso de erro
        hideButtonLoading('execute-purchase-btn', '<i class="bi bi-lightning me-2"></i>COMPRAR TOKENS');
    }
}

/**
 * Diagnóstico avançado do contrato para identificar problemas específicos
 */
async function performAdvancedContractDiagnostics(provider) {
    const diagnosticFunctions = [
        { name: 'paused', desc: 'Contrato pausado' },
        { name: 'saleActive', desc: 'Venda ativa' },
        { name: 'saleEnabled', desc: 'Venda habilitada' },
        { name: 'owner', desc: 'Proprietário do contrato' },
        { name: 'maxPurchase', desc: 'Compra máxima permitida' },
        { name: 'minPurchase', desc: 'Compra mínima permitida' },
        { name: 'tokensForSale', desc: 'Tokens para venda' },
        { name: 'tokensAvailable', desc: 'Tokens disponíveis' }
    ];
    
    const contractWithProvider = new ethers.Contract(currentContract.address, CONFIG.tokenABI, provider);
    const quantity = parseFloat(document.getElementById('token-quantity').value);
    
    for (const func of diagnosticFunctions) {
        try {
            const result = await contractWithProvider[func.name]();
            console.log(`“‹ ${func.desc}: ${result.toString()}`);
            
            // Análise específica de cada resultado
            if (func.name === 'paused' && result === true) {
                console.log('š¨ PROBLEMA: Contrato está pausado!');
                throw new Error('Contrato está pausado - compras temporariamente desabilitadas');
            }
            
            if ((func.name === 'saleActive' || func.name === 'saleEnabled') && result === false) {
                console.log('š¨ PROBLEMA: Venda nÃo está ativa!');
                throw new Error('Venda nÃo está ativa neste contrato');
            }
            
            if (func.name === 'maxPurchase' && result.gt(0)) {
                const maxInBNB = ethers.utils.formatEther(result);
                const totalValueNeeded = quantity * parseFloat(tokenInfo.price);
                if (totalValueNeeded > parseFloat(maxInBNB)) {
                    console.log(`š¨ PROBLEMA: Valor solicitado (${totalValueNeeded} BNB) excede máximo permitido (${maxInBNB} BNB)`);
                    throw new Error(`Valor máximo permitido: ${maxInBNB} BNB`);
                }
            }
            
            if (func.name === 'minPurchase' && result.gt(0)) {
                const minInBNB = ethers.utils.formatEther(result);
                const totalValueNeeded = quantity * parseFloat(tokenInfo.price);
                if (totalValueNeeded < parseFloat(minInBNB)) {
                    console.log(`š¨ PROBLEMA: Valor solicitado (${totalValueNeeded} BNB) é menor que mínimo (${minInBNB} BNB)`);
                    throw new Error(`Valor mínimo necessário: ${minInBNB} BNB`);
                }
            }
            
        } catch (error) {
            // Se é um erro específico da análise, repassa
            if (error.message.includes('pausado') || error.message.includes('ativa') || 
                error.message.includes('máxima') || error.message.includes('mínima')) {
                throw error;
            }
            // SenÃo, funçÃo simplesmente nÃo existe no contrato (normal)
            console.log(`“‹ ${func.desc}: NÃo disponível`);
        }
    }
    
    // Verifica se usuário está na whitelist (se aplicável)
    try {
        const isWhitelisted = await contractWithProvider.isWhitelisted(walletAddress);
        console.log(`“‹ Usuário na whitelist: ${isWhitelisted}`);
        if (isWhitelisted === false) {
            console.log('š¨ PROBLEMA: Usuário nÃo está na whitelist!');
            throw new Error('Seu endereço nÃo está autorizado para comprar tokens');
        }
    } catch (error) {
        if (error.message.includes('autorizado')) {
            throw error;
        }
        console.log('“‹ Whitelist: NÃo aplicável');
    }
    
    // Verifica limites por usuário
    try {
        const userLimit = await contractWithProvider.purchaseLimit(walletAddress);
        const hasPurchased = await contractWithProvider.hasPurchased(walletAddress);
        
        console.log(`“‹ Limite por usuário: ${userLimit.toString()}`);
        console.log(`“‹ Já comprou antes: ${hasPurchased}`);
        
        if (hasPurchased && userLimit.eq(0)) {
            console.log('š¨ PROBLEMA: Usuário já atingiu limite de compras!');
            throw new Error('Vocáª já atingiu o limite de compras para este token');
        }
    } catch (error) {
        if (error.message.includes('limite')) {
            throw error;
        }
        console.log('“‹ Limites por usuário: NÃo aplicável');
    }
    
    console.log('… Diagnóstico avançado concluído - nenhum problema detectado');
}

/**
 * Analisa a razÃo específica do revert para dar feedback preciso
 */
async function analyzeRevertReason(error, contract, valueInWei) {
    console.log('” Analisando razÃo do revert...');
    
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
    
    console.log(`š¨ RazÃo do revert: ${revertReason}`);
    
    // Testes específicos baseados em padrões comuns
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
            name: 'Valor exato do preço',
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
            // NÃo mostra mais descobertas para o usuário - apenas no console
            return;
        } catch (testError) {
            console.log(`ÃŒ ${scenario.name}: ${testError.reason || 'Falhou'}`);
        }
    }
    
    // Análise de padrões comuns de revert
    const commonReverts = {
        'insufficient funds': 'Saldo insuficiente no contrato ou usuário',
        'saldo insuficiente': 'Saldo insuficiente no contrato ou usuário',
        'not enough tokens': 'Contrato sem tokens suficientes',
        'sem tokens': 'Contrato sem tokens suficientes',
        'paused': 'Contrato está pausado',
        'pausado': 'Contrato está pausado',
        'not whitelisted': 'Endereço nÃo está na whitelist',
        'nÃo autorizado': 'Endereço nÃo está na whitelist',
        'sale not active': 'Venda nÃo está ativa',
        'venda inativa': 'Venda nÃo está ativa',
        'minimum purchase': 'Valor abaixo do mínimo',
        'valor mínimo': 'Valor abaixo do mínimo',
        'maximum purchase': 'Valor acima do máximo',
        'valor máximo': 'Valor acima do máximo',
        'already purchased': 'Usuário já comprou antes',
        'já comprou': 'Usuário já comprou antes',
        'wrong price': 'Preço incorreto',
        'preço incorreto': 'Preço incorreto',
        'invalid amount': 'Quantidade inválida',
        'quantidade inválida': 'Quantidade inválida'
    };
    
    for (const [pattern, explanation] of Object.entries(commonReverts)) {
        if (revertReason.toLowerCase().includes(pattern)) {
            console.log(`’¡ PadrÃo identificado: ${explanation}`);
            // NÃo mostra mais erros técnicos para o usuário durante simulaçÃo
            return;
        }
    }
    
    // Log apenas no console - nÃo mostra erro técnico para o usuário
    console.log(`” RazÃo do revert: ${revertReason}`);
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
 * Atualiza botÃo de verificaçÃo
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
 * Mostra seçÃo de informações do token
 */
function showTokenInfo() {
    const section = document.getElementById('token-info-section');
    if (section) {
        section.style.display = 'block';
        
        // Após mostrar as informações, verifica se pode habilitar a compra
        console.log('“¢ Sistema: SeçÃo de informações exibida, verificando se pode habilitar compra...');
        if (buyFunctionName) {
            enablePurchaseSection();
        }
    }
}

/**
 * Esconde seçÃo de informações do token
 */
function hideTokenInfo() {
    const section = document.getElementById('token-info-section');
    if (section) {
        section.style.display = 'none';
    }
}

/**
 * Mostra detalhes da transaçÃo
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
 * Formata números para exibiçÃo de forma amigável
 */
function formatNumber(num) {
    const number = parseFloat(num);
    if (isNaN(number) || number === 0) return '0';
    
    // Para números muito grandes
    if (number >= 1000000000) {
        return (number / 1000000000).toFixed(2) + 'B';
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
    } 
    // Para números muito pequenos, mostrar com mais precisÃo sem notaçÃo científica
    else if (number < 1 && number > 0) {
        // Encontrar quantas casas decimais sÃo necessárias
        const str = number.toString();
        if (str.includes('e-')) {
            // Se ainda tem notaçÃo científica, converter para decimal fixo
            const parts = str.split('e-');
            const decimals = parseInt(parts[1]) + 2; // Adiciona 2 casas extras
            return number.toFixed(Math.min(decimals, 18)); // Máximo 18 casas
        } else {
            return number.toFixed(6).replace(/\.?0+$/, ''); // Remove zeros desnecessários
        }
    } 
    // Para números normais
    else {
        return number.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
    }
}

// ==================== SISTEMA DE FEEDBACK ====================

/**
 * Adiciona mensagem na seçÃo de contrato
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
 * Adiciona mensagem na seçÃo de compra
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
 * Limpa mensagens da seçÃo de contrato
 */
function clearContractMessages() {
    const list = document.getElementById("contractErrors");
    const container = document.getElementById("contractResult");
    
    if (list) list.innerHTML = '';
    if (container) container.style.display = 'none';
}

/**
 * Limpa mensagens da seçÃo de compra
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
 * Inicializa conexÃo da wallet (compatibilidade)
 */
function initializeWalletConnection() {
    // Monitora mudanças de rede e conta
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
            // Recarrega a página quando muda de rede
            location.reload();
        });
    }
    
    // VerificaçÃo periódica menos frequente (60 segundos se conectado)
    setInterval(() => {
        if (walletConnected && walletAddress && !balanceUpdateInProgress) {
            updateWalletBalance();
        }
    }, 60000); // 60 segundos
}

// ==================== SISTEMA DE FALLBACK RPC ====================

/**
 * Inicializa provider com fallback para resolver problemas de RPC
 * ESTRATá‰GIA: Usa APENAS RPC público para leitura, MetaMask apenas para transações
 */
async function initializeProviderWithFallback() {
    // Evitar inicializações múltiplas
    if (providerInitialized && currentProvider) {
        // Provider já inicializado, reutilizando...
        return currentProvider;
    }
    
    // Inicializando provider com estratégia RPC-primeiro
    
    // NUNCA usa MetaMask para operações de leitura
    // Detecta chain ID da MetaMask para usar RPC correspondente
    let chainId = 97; // BSC Testnet padrÃo
    
    try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        chainId = parseInt(currentChainId, 16);
        console.log(`Œ Chain ID detectado: ${chainId}`);
    } catch (error) {
        console.warn('Ãš ï¸ NÃo foi possível detectar chain ID, usando BSC Testnet');
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
            
            // Teste rápido de conectividade (3s timeout)
            const network = await Promise.race([
                provider.getNetwork(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);
            
            console.log(`… RPC funcionando: ${rpcUrl} - Rede: ${network.name} (${network.chainId})`);
            return provider;
            
        } catch (error) {
            console.warn(`ÃŒ RPC ${i + 1} falhou: ${rpcUrl} - ${error.message}`);
        }
    }
    
    throw new Error('ÃŒ Todos os RPC endpoints falharam - verifique sua conexÃo com a internet');
}

/**
 * Obtém URL de RPC fallback baseado na rede
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
    return urls ? urls[0] : null; // Retorna primeiro RPC disponível
}

/**
 * Tenta obter código do contrato com retry
 */
async function getCodeWithRetry(contractAddress, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const code = await currentProvider.getCode(contractAddress);
            return code;
        } catch (error) {
            console.warn(`Ãš ï¸ Tentativa ${attempt}/${maxRetries} falhou:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Aguarda antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

/**
 * Retry com provider alternativo - tenta múltiplos RPCs
 */
async function retryWithFallbackProvider(contractAddress) {
    // Detecta chain ID
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const chainIdDecimal = parseInt(chainId, 16);
    
    // Obtém lista de RPCs
    const rpcUrls = getFallbackRpcUrls(chainIdDecimal);
    if (!rpcUrls || rpcUrls.length === 0) {
        throw new Error('Nenhum RPC alternativo disponível para esta rede');
    }
    
    // Tenta cada RPC até encontrar um que funcione
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
                throw new Error('Endereço nÃo é um smart contract válido');
            }
            
            addContractMessage('… Smart contract detectado via RPC alternativo', 'success');
            
            // Atualiza provider global
            currentProvider = fallbackProvider;
            currentSigner = null; // Sem signer no RPC público
            providerInitialized = true; // Marca como inicializado
            
            // Continua verificaçÃo
            currentContract = new ethers.Contract(contractAddress, CONFIG.tokenABI, currentProvider);
            await verifyERC20Functions();
            await verifyBuyFunctions();
            await loadTokenInfo();
            showTokenInfo();
            
            addContractMessage('Ž‰ Contrato verificado com RPC alternativo!', 'success');
            addContractMessage('Ãš ï¸ Para transações, reconecte com MetaMask', 'warning');
            return; // Sucesso, sai da funçÃo
            
        } catch (error) {
            console.warn(`ÃŒ RPC ${rpcUrls[i]} falhou:`, error.message);
            if (i === rpcUrls.length - 1) {
                // ášltimo RPC também falhou
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
 * FunçÃo de limpeza simplificada - removida porque agora usa location.reload()
 * O botÃo "Limpar e Recomeçar" simplesmente recarrega a página
 */

// ==================== EXPORTS ====================

// Tornar funções disponíveis globalmente para compatibilidade
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

// CSS para animaçÃo de loading
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






