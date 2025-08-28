/**
 * xcafe Token Creator - Versão Simplificada
 * 1. Conectar carteira
 * 2. Pedir dados do token
 * 3. Fazer deploy
 * 4. Verificar contrato
 */

// Estado global simples
let wallet = {
    connected: false,
    address: '',
    network: null,
    balance: '0'
};

let tokenData = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 xcafe Token Creator iniciado');
    setupEventListeners();
    checkExistingConnection();
});

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Botão conectar
    const connectBtn = document.getElementById('connect-metamask-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    // Botão próximo seção 1
    const walletNextBtn = document.getElementById('wallet-next-btn');
    if (walletNextBtn) {
        walletNextBtn.addEventListener('click', goToTokenInfo);
    }
    
    // Botão próximo seção 2  
    const basicNextBtn = document.getElementById('basic-info-next-btn');
    if (basicNextBtn) {
        basicNextBtn.addEventListener('click', goToDeploy);
    }
    
    // Botão de deploy
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
        deployBtn.addEventListener('click', deployToken);
    }
}

// ==================== CONEXÃO DA CARTEIRA ====================

async function checkExistingConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                wallet.address = accounts[0];
                wallet.connected = true;
                await updateWalletInfo();
                updateWalletUI();
            }
        } catch (error) {
            console.log('Carteira não conectada');
        }
    }
}

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask não detectado! Instale a extensão MetaMask primeiro.');
        return;
    }
    
    try {
        console.log('🔗 Conectando com MetaMask...');
        
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            wallet.address = accounts[0];
            wallet.connected = true;
            
            await updateWalletInfo();
            updateWalletUI();
            
            console.log('✅ Carteira conectada:', wallet.address);
        }
    } catch (error) {
        console.error('❌ Erro ao conectar:', error);
        alert('Erro ao conectar com MetaMask: ' + error.message);
    }
}

async function updateWalletInfo() {
    try {
        // Detectar rede
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        wallet.network = getNetworkInfo(chainId);
        
        // Buscar saldo
        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [wallet.address, 'latest']
        });
        wallet.balance = (parseInt(balance, 16) / 1e18).toFixed(4);
        
        console.log('🌐 Rede detectada:', wallet.network.name);
        console.log('💰 Saldo:', wallet.balance, wallet.network.currency);
        
    } catch (error) {
        console.error('❌ Erro ao buscar informações:', error);
    }
}

function getNetworkInfo(chainId) {
    const networks = {
        '0x1': { name: 'Ethereum Mainnet', currency: 'ETH' },
        '0x38': { name: 'BSC Mainnet', currency: 'BNB' },
        '0x61': { name: 'BSC Testnet', currency: 'BNB' },
        '0x89': { name: 'Polygon', currency: 'MATIC' }
    };
    
    return networks[chainId] || { 
        name: 'Rede Desconhecida', 
        currency: 'ETH',
        chainId: parseInt(chainId, 16) 
    };
}

function updateWalletUI() {
    // Campo status
    const statusInput = document.getElementById('wallet-status');
    if (statusInput && wallet.connected) {
        statusInput.value = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
    }
    
    // Endereço conectado
    const connectedAddress = document.getElementById('connected-address');
    if (connectedAddress && wallet.connected) {
        connectedAddress.textContent = wallet.address;
    }
    
    // Saldo
    const walletBalance = document.getElementById('wallet-balance');
    if (walletBalance && wallet.connected) {
        walletBalance.textContent = `${wallet.balance} ${wallet.network?.currency || 'ETH'}`;
    }
    
    // Rede atual
    const currentNetwork = document.getElementById('current-network');
    if (currentNetwork && wallet.network) {
        currentNetwork.textContent = wallet.network.name;
    }
    
    const chainIdValue = document.getElementById('chain-id-value');
    if (chainIdValue && wallet.network) {
        chainIdValue.textContent = wallet.network.chainId || 'N/A';
    }
    
    // Mostrar seções quando conectado
    if (wallet.connected) {
        // Mostrar info da carteira
        const walletInfo = document.getElementById('wallet-connection-info');
        if (walletInfo) {
            walletInfo.style.display = 'block';
        }
        
        // Mostrar botão próximo
        const nextBtn = document.getElementById('wallet-next-btn');
        if (nextBtn) {
            nextBtn.style.display = 'block';
        }
        
        // Esconder botão conectar
        const connectBtn = document.getElementById('connect-metamask-btn');
        if (connectBtn) {
            connectBtn.style.display = 'none';
        }
        
        // Auto-preencher owner
        const ownerInput = document.getElementById('ownerAddress');
        if (ownerInput && !ownerInput.value) {
            ownerInput.value = wallet.address;
        }
    }
}

// ==================== NAVEGAÇÃO ====================

function goToTokenInfo() {
    if (!wallet.connected) {
        alert('Conecte sua carteira primeiro!');
        return;
    }
    
    // Esconder seção atual
    const walletSection = document.getElementById('section-wallet');
    walletSection.style.display = 'none';
    walletSection.classList.remove('active', 'section-enabled');
    
    // Mostrar próxima seção
    const basicSection = document.getElementById('section-basic-info');
    basicSection.style.display = 'block';
    basicSection.classList.add('active', 'section-enabled');
    
    // Debug: verificar se os campos estão funcionando
    setTimeout(() => {
        const tokenNameInput = document.getElementById('tokenName');
        const tokenSymbolInput = document.getElementById('tokenSymbol');
        
        console.log('🔍 Debug - tokenName input:', tokenNameInput);
        console.log('🔍 Debug - tokenName disabled:', tokenNameInput?.disabled);
        console.log('🔍 Debug - tokenName readonly:', tokenNameInput?.readOnly);
        console.log('🔍 Debug - tokenSymbol input:', tokenSymbolInput);
        console.log('🔍 Debug - tokenSymbol disabled:', tokenSymbolInput?.disabled);
        
        // Forçar habilitação dos campos
        if (tokenNameInput) {
            tokenNameInput.disabled = false;
            tokenNameInput.readOnly = false;
            tokenNameInput.focus();
        }
        if (tokenSymbolInput) {
            tokenSymbolInput.disabled = false;
            tokenSymbolInput.readOnly = false;
        }
        
        // Preencher campo da rede de deploy
        const networkDisplay = document.getElementById('network-display');
        if (networkDisplay && wallet.network) {
            networkDisplay.value = wallet.network.name;
        }
        
        // Testar diretamente
        if (tokenNameInput) {
            tokenNameInput.value = "Teste";
            console.log('✅ Valor definido para tokenName:', tokenNameInput.value);
        }
    }, 100);
    
    console.log('📝 Navegando para informações do token');
}

function goToDeploy() {
    // Validar dados do token
    if (!validateTokenData()) {
        return;
    }
    
    // Esconder seção atual
    const basicSection = document.getElementById('section-basic-info');
    basicSection.style.display = 'none';
    basicSection.classList.remove('active', 'section-enabled');
    
    // Mostrar seção de deploy
    const deploySection = document.getElementById('section-deploy');
    deploySection.style.display = 'block';
    deploySection.classList.add('active', 'section-enabled');
    
    // Atualizar resumo
    updateTokenSummary();
    
    console.log('🚀 Navegando para deploy');
}

function validateTokenData() {
    const name = document.getElementById('tokenName').value.trim();
    const symbol = document.getElementById('tokenSymbol').value.trim().toUpperCase();
    const totalSupply = document.getElementById('totalSupply').value.trim();
    const decimals = document.getElementById('decimals').value;
    const owner = document.getElementById('ownerAddress').value.trim();
    
    if (!name || name.length < 3) {
        alert('Nome do token deve ter pelo menos 3 caracteres');
        return false;
    }
    
    if (!symbol || symbol.length < 2) {
        alert('Símbolo do token deve ter pelo menos 2 caracteres');
        return false;
    }
    
    if (!totalSupply || isNaN(totalSupply) || totalSupply <= 0) {
        alert('Supply total deve ser um número válido maior que zero');
        return false;
    }
    
    if (!owner || !owner.startsWith('0x') || owner.length !== 42) {
        alert('Endereço do proprietário inválido');
        return false;
    }
    
    // Salvar dados
    tokenData = {
        name: name,
        symbol: symbol,
        totalSupply: totalSupply,
        decimals: parseInt(decimals),
        owner: owner,
        network: wallet.network
    };
    
    return true;
}

function updateTokenSummary() {
    const summaryDiv = document.getElementById('token-summary');
    if (!summaryDiv) return;
    
    summaryDiv.innerHTML = `
        <div class="col-md-6">
            <strong class="text-warning">Nome:</strong>
            <span class="text-white ms-2">${tokenData.name}</span>
        </div>
        <div class="col-md-6">
            <strong class="text-warning">Símbolo:</strong>
            <span class="text-white ms-2">${tokenData.symbol}</span>
        </div>
        <div class="col-md-6">
            <strong class="text-warning">Supply Total:</strong>
            <span class="text-white ms-2">${tokenData.totalSupply}</span>
        </div>
        <div class="col-md-6">
            <strong class="text-warning">Decimais:</strong>
            <span class="text-white ms-2">${tokenData.decimals}</span>
        </div>
        <div class="col-md-6">
            <strong class="text-warning">Proprietário:</strong>
            <span class="text-white ms-2">${tokenData.owner.slice(0, 10)}...${tokenData.owner.slice(-8)}</span>
        </div>
        <div class="col-md-6">
            <strong class="text-warning">Rede:</strong>
            <span class="text-white ms-2">${tokenData.network.name}</span>
        </div>
    `;
    
    // Habilitar botão de deploy
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
        deployBtn.disabled = false;
    }
}

// ==================== DEPLOY DO TOKEN ====================

async function deployToken() {
    if (!wallet.connected) {
        alert('Conecte sua carteira primeiro!');
        return;
    }
    
    if (!tokenData || !tokenData.name) {
        alert('Dados do token não encontrados!');
        return;
    }
    
    try {
        console.log('🚀 Iniciando deploy do token:', tokenData.name);
        
        // Usar a API de deploy se disponível
        if (typeof TokenDeployAPI !== 'undefined') {
            await deployViaAPI();
        } else {
            await deployDirectly();
        }
        
    } catch (error) {
        console.error('❌ Erro no deploy:', error);
        alert('Erro no deploy: ' + error.message);
    }
}

async function deployViaAPI() {
    const api = new TokenDeployAPI();
    
    const result = await api.deployToken({
        name: tokenData.name,
        symbol: tokenData.symbol,
        totalSupply: tokenData.totalSupply,
        decimals: tokenData.decimals,
        owner: tokenData.owner,
        network: wallet.network.name.toLowerCase().includes('testnet') ? 'bsc_testnet' : 'bsc_mainnet'
    });
    
    console.log('✅ Deploy concluído via API:', result);
    showDeployResult(result);
}

async function deployDirectly() {
    // Deploy direto usando ethers.js com contrato simples
    console.log('🔧 Deploy direto ainda não implementado');
    alert('Deploy direto não implementado. Use a API de deploy.');
}

function showDeployResult(result) {
    // Esconder seção de deploy
    document.getElementById('section-deploy').style.display = 'none';
    
    // Mostrar seção de resultado
    const resultSection = document.getElementById('section-result');
    if (resultSection) {
        resultSection.style.display = 'block';
        
        // Atualizar com dados do resultado
        updateResultDisplay(result);
    }
}

function updateResultDisplay(result) {
    // Atualizar endereço do contrato
    const contractAddress = document.getElementById('contract-address-display');
    if (contractAddress && result.contractAddress) {
        contractAddress.value = result.contractAddress;
    }
    
    // Atualizar detalhes do token
    const tokenDetails = document.getElementById('token-details-result');
    if (tokenDetails) {
        tokenDetails.innerHTML = `
            <p class="mb-2"><strong class="text-warning">Nome:</strong> <span class="text-white">${tokenData.name}</span></p>
            <p class="mb-2"><strong class="text-warning">Símbolo:</strong> <span class="text-white">${tokenData.symbol}</span></p>
            <p class="mb-2"><strong class="text-warning">Supply:</strong> <span class="text-white">${tokenData.totalSupply}</span></p>
            <p class="mb-0"><strong class="text-warning">Decimais:</strong> <span class="text-white">${tokenData.decimals}</span></p>
        `;
    }
    
    // Atualizar info blockchain
    const blockchainDetails = document.getElementById('blockchain-details-result');
    if (blockchainDetails) {
        blockchainDetails.innerHTML = `
            <p class="mb-2"><strong class="text-info">Rede:</strong> <span class="text-white">${tokenData.network.name}</span></p>
            <p class="mb-2"><strong class="text-info">TxHash:</strong> <span class="text-white small">${result.transactionHash || 'N/A'}</span></p>
            <p class="mb-0"><strong class="text-info">Status:</strong> <span class="text-success">✅ Confirmado</span></p>
        `;
    }
}

// ==================== UTILITÁRIOS ====================

// Expor funções globais se necessário
window.xcafeTokenCreator = {
    wallet,
    tokenData,
    connectWallet,
    deployToken
};

console.log('✅ xcafe Token Creator carregado - Versão Simplificada');
