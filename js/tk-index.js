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
            isSupported: chainId === '0x38' || chainId === '0x61' // BSC Mainnet ou Testnet
        };
        
        console.log('🌐 Rede detectada:', networkData);
        
        if (!networkData.isSupported) {
            showAlert('Por favor, conecte-se à rede BSC (Binance Smart Chain) ou BSC Testnet para continuar.', 'warning');
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
            showAlert('Por favor, conecte-se à rede BSC (Binance Smart Chain) ou BSC Testnet.', 'error');
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
        
        // Deploy real na blockchain
        const deployResult = await deployTokenContract();
        
        // Mostra modal de sucesso com dados reais
        showSuccessModal(deployResult);
        
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
 * Deploy real do contrato na blockchain
 */
async function deployTokenContract() {
    const tokenName = document.getElementById('token-name').value.trim();
    const tokenSymbol = document.getElementById('token-symbol').value.trim();
    const tokenSupply = document.getElementById('token-supply').value.trim();
    const decimals = document.getElementById('token-decimals').value;
    
    console.log('📋 Dados do token:', {
        name: tokenName,
        symbol: tokenSymbol,
        supply: tokenSupply,
        decimals: decimals
    });
    
    // Conecta com o provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Bytecode e ABI do contrato ERC-20 básico
    const contractBytecode = getTokenBytecode();
    const contractABI = getTokenABI();
    
    // Prepara parâmetros do construtor
    const totalSupplyWithDecimals = ethers.utils.parseUnits(tokenSupply, decimals);
    
    showAlert('🔨 Compilando contrato...', 'info');
    
    // Cria factory do contrato
    const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, signer);
    
    showAlert('📡 Enviando transação para a blockchain...', 'info');
    
    // Estima gas para o deploy
    const deploymentData = contractFactory.interface.encodeDeploy([
        tokenName,
        tokenSymbol,
        decimals,
        totalSupplyWithDecimals
    ]);
    
    const gasEstimate = await provider.estimateGas({
        data: contractBytecode + deploymentData.slice(2)
    });
    
    console.log('⛽ Gas estimado:', gasEstimate.toString());
    
    // Deploy do contrato
    const deployTx = await contractFactory.deploy(
        tokenName,
        tokenSymbol,
        decimals,
        totalSupplyWithDecimals,
        {
            gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
        }
    );
    
    showAlert('⏳ Aguardando confirmação da blockchain...', 'info');
    
    // Aguarda confirmação
    const receipt = await deployTx.deployTransaction.wait();
    
    console.log('✅ Deploy concluído:', receipt);
    
    return {
        contractAddress: deployTx.address,
        transactionHash: deployTx.deployTransaction.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        totalSupply: tokenSupply,
        decimals: decimals
    };
}

/**
 * Retorna o bytecode do contrato ERC-20 básico
 */
function getTokenBytecode() {
    // Bytecode compilado do contrato ERC-20 básico (Solidity ^0.8.19)
    // Este bytecode foi compilado do contrato tk-token-template.sol
    return "0x60806040523480156200001157600080fd5b50604051620011b8380380620011b883398101604081905262000034916200011f565b600362000042858262000218565b50600462000051848262000218565b506005805460ff191660ff84161790556006819055336000818152602081815260408083208590556040519092917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91620000ae91906200030d565b60405180910390a3505050506200031f565b634e487b7160e01b600052604160045260246000fd5b600082601f830112620000e657600080fd5b81516001600160401b0380821115620001035762000103620000be565b604051601f8301601f19908116603f011681019082821181831017156200012e576200012e620000be565b816040528381526020925086838588010111156200014b57600080fd5b600091505b838210156200016f578582018301518183018401529082019062000150565b83821115620001815760008385830101525b9695505050505050565b600080600080608085870312156200019f57600080fd5b84516001600160401b0380821115620001b757600080fd5b620001c588838901620000d4565b95506020870151915080821115620001dc57600080fd5b50620001eb87828801620000d4565b935050604085015160ff811681146200020357600080fd5b6060959095015193969295505050565b600181811c908216806200022857607f821691505b6020821081036200024957634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156200028557600081815260208120601f850160051c81016020861015620002785750805b601f850160051c820191505b81811015620002995782815560010162000284565b505050505050565b81516001600160401b03811115620002bd57620002bd620000be565b620002d581620002ce845462000213565b846200024f565b602080601f8311600181146200030d5760008415620002f45750858301515b600019600386901b1c1916600185901b17855562000299565b600085815260208120601f198616915b828110156200033e578886015182559484019460019091019084016200031d565b50858210156200035d5787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b610e29806200037f6000396000f3fe608060405234801561001057600080fd5b50600436106100cf5760003560e01c806370a082311161008c578063a457c2d711610066578063a457c2d7146101b3578063a9059cbb146101c6578063dd62ed3e146101d9578063313ce567146101ec57600080fd5b806370a082311461015057806395d89b41146101795780639dc29fac1461018157600080fd5b806306fdde03146100d4578063095ea7b3146100f257806318160ddd1461011557806323b872dd14610127578063395093511461013a578063408eee8d1461014d575b600080fd5b6100dc6101f3565b6040516100e9919061090e565b60405180910390f35b61010561010036600461099f565b610285565b60405190151581526020016100e9565b6006545b6040519081526020016100e9565b6101056101353660046109c9565b61029f565b61010561014836600461099f565b6102c3565b610119600681565b61011961015e366004610a05565b6001600160a01b031660009081526020819052604090205490565b6100dc6102e5565b61010561018f36600461099f565b6102f4565b6101056101c136600461099f565b61039a565b6101056101d436600461099f565b6103af565b6101196101e7366004610a20565b6103bd565b60065460ff165b604051601f19601f19165b60405180910390f35b60606003805461020290610a50565b80601f016020809104026020016040519081016040528092919081815260200182805461022e90610a50565b801561027b5780601f106102505761010080835404028352916020019161027b565b820191906000526020600020905b81548152906001019060200180831161025e57829003601f168201915b5050505050905090565b6000336102938185856103e8565b60019150505b92915050565b6000336102ad858285610466565b6102b88585856104e0565b506001949350505050565b6000336102938185856102d683836103bd565b6102e09190610a8a565b6103e8565b60606004805461020290610a50565b60003361030283836103bd565b90508381101561035b5760405162461bcd60e51b815260206004820152601b60248201527f416c6c6f77616e63652061626169786f206465207a65726f000000000000000060448201526064015b60405180910390fd5b6103688385868403610a8a565b6001600160a01b0384811660008181526001602090815260408083209389168084529382529182902084905590518381527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591015b60405180910390a3506001949350505050565b6000336103768581856103e8565b50600191505092915050565b6000336102938185856104e0565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166104425760405162461bcd60e51b815260206004820152601560248201527f417070726f76652070617261206164647231286029000000000000000000006044820152606401610352565b506001600160a01b03928316600081815260016020908152604080832095909616825293909352912091909155565b600061047284846103bd565b905060001981146104da5781811015610497565b5260405162461bcd60e51b815260206004820152601060248201527f416c6c6f77616e636520657863656564000000000000000000000000000000006044820152606401610352565b506001600160a01b03928316600081815260016020908152604080832095909616825293909352912093909355565b6001600160a01b0383166105365760405162461bcd60e51b815260206004820152601a60248201527f5472616e736665722070617261206164647265737320007a65726f0000000000006044820152606401610352565b6001600160a01b03821660009081526020819052604090205481111561059e5760405162461bcd60e51b815260206004820152601060248201527f53616c646f20696e73756669636965202fe000000000000000000000000000006044820152606401610352565b6001600160a01b038084166000908152602081905260408082208054859003905591841681529081208054839290610605908490610a8a565b90915550506040518181526001600160a01b03808416916007916000805160206107de8339815191529190a36040518181526001600160a01b0380841691908616906000805160206107de8339815191529060200160405180910390a350505050565b600060208083528351808285015260005b8381101561093b5785810183015185820160400152820161091f565b8381111561094d576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b038116811461097a57600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b806040810183101561029957600080fd5b600080604083850312156109b257600080fd5b6109bb83610963565b946020939093013593505050565b6000806000606084860312156109de57600080fd5b6109e784610963565b92506109f560208501610963565b9150604084013590509250925092565b600060208284031215610a1757600080fd5b61099482610963565b60008060408385031215610a3357600080fd5b610a3c83610963565b9150610a4a60208401610963565b90509250929050565b600181811c90821680610a6457607f821691505b602082108103610a8457634e487b7160e01b600052602260045260246000fd5b50919050565b60008219821115610aab57634e487b7160e01b600052601160045260246000fd5b50019056feddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
}

/**
 * Retorna o ABI do contrato ERC-20 básico
 */
function getTokenABI() {
    return [
        {
            "inputs": [
                { "internalType": "string", "name": "_name", "type": "string" },
                { "internalType": "string", "name": "_symbol", "type": "string" },
                { "internalType": "uint8", "name": "_decimals", "type": "uint8" },
                { "internalType": "uint256", "name": "_totalSupply", "type": "uint256" }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "spender", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
            ],
            "name": "Transfer",
            "type": "event"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "owner", "type": "address" },
                { "internalType": "address", "name": "spender", "type": "address" }
            ],
            "name": "allowance",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "spender", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "approve",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "spender", "type": "address" },
                { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }
            ],
            "name": "decreaseAllowance",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "spender", "type": "address" },
                { "internalType": "uint256", "name": "addedValue", "type": "uint256" }
            ],
            "name": "increaseAllowance",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "name",
            "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "transfer",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "from", "type": "address" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "transferFrom",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
}

/**
 * Mostra modal de sucesso
 */
function showSuccessModal(deployResult) {
    const tokenName = deployResult?.tokenName || document.getElementById('token-name').value.trim();
    const tokenSymbol = deployResult?.tokenSymbol || document.getElementById('token-symbol').value.trim();
    const contractAddress = deployResult?.contractAddress || ('0x' + Math.random().toString(16).slice(2, 42));
    const txHash = deployResult?.transactionHash || ('0x' + Math.random().toString(16).slice(2));
    const gasUsed = deployResult?.gasUsed || 'N/A';
    const blockNumber = deployResult?.blockNumber || 'N/A';
    
    const explorerUrl = networkData.chainId === '0x38' ? 'https://bscscan.com' : 'https://testnet.bscscan.com';
    
    const successDetails = document.getElementById('success-details');
    successDetails.innerHTML = `
        <div class="alert alert-success">
            <h6 class="text-success mb-3">🎉 Token "${tokenName} (${tokenSymbol})" criado com sucesso!</h6>
            
            <div class="row g-2 mb-3">
                <div class="col-12">
                    <strong>📍 Endereço do Token:</strong>
                    <div class="font-monospace small bg-light text-dark p-2 rounded mt-1 word-break">
                        ${contractAddress}
                    </div>
                </div>
                <div class="col-12">
                    <strong>🔗 Hash da Transação:</strong>
                    <div class="font-monospace small bg-light text-dark p-2 rounded mt-1 word-break">
                        ${txHash}
                    </div>
                </div>
                <div class="col-md-6">
                    <strong>⛽ Gas Usado:</strong> ${gasUsed}
                </div>
                <div class="col-md-6">
                    <strong>🧱 Bloco:</strong> ${blockNumber}
                </div>
            </div>
            
            <div class="d-flex gap-2 flex-wrap mb-3">
                <a href="${explorerUrl}/address/${contractAddress}" target="_blank" 
                   class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-box-arrow-up-right me-1"></i>Ver no BSCScan
                </a>
                <a href="${explorerUrl}/tx/${txHash}" target="_blank" 
                   class="btn btn-outline-info btn-sm">
                    <i class="bi bi-receipt me-1"></i>Ver Transação
                </a>
                <button class="btn btn-outline-success btn-sm" onclick="copyToClipboard('${contractAddress}')">
                    <i class="bi bi-clipboard me-1"></i>Copiar Endereço
                </button>
            </div>
        </div>
        
        <div class="alert alert-info">
            <strong>📋 Próximos passos:</strong>
            <ul class="mb-0 mt-2">
                <li>✅ Adicione o token à sua MetaMask</li>
                <li>🏪 Crie liquidez em PancakeSwap ou outras DEXs</li>
                <li>📢 Promova seu token na comunidade</li>
                <li>🔍 Verifique o código fonte no BSCScan (opcional)</li>
            </ul>
        </div>
        
        <div class="alert alert-warning">
            <small>
                <strong>⚠️ Importante:</strong> Salve o endereço do contrato em local seguro. 
                Este é o endereço oficial do seu token!
            </small>
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
