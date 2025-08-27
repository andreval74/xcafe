/**
 * xcafe Token Creator - Main Script
 * Sistema de CriAção de tokens com steps
 */

// Estado global
let currentStep = 1;
let walletConnected = false;
let walletAddress = '';
let networkData = {};

// InicializAção
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 xcafe Token Creator iniciado');
    
    initializeSteps();
    setupEventListeners();
    checkWalletConnection();
});

/**
 * Inicializa o sistema de steps
 */
function initializeSteps() {
    showStep(1);
    updateStepIndicators();
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Conectar MetaMask
    const connectBtn = document.getElementById('connect-metamask-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    // Próximo step 1
    const nextStep1 = document.getElementById('next-step-1');
    if (nextStep1) {
        nextStep1.addEventListener('click', () => {
            if (validateStep1()) {
                nextStep();
            }
        });
    }
    
    // Próximo step 2
    const nextStep2 = document.getElementById('next-step-2');
    if (nextStep2) {
        nextStep2.addEventListener('click', () => {
            if (validateStep2()) {
                nextStep();
            }
        });
    }
    
    // Auto-fill de decimais
    const decimalsInput = document.getElementById('decimals');
    if (decimalsInput && !decimalsInput.value) {
        decimalsInput.value = '18';
    }
}

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
        
        // Solicita Conexão
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
            
            // Dispara evento para progressive flow
            const walletConnectedEvent = new CustomEvent('walletConnected', {
                detail: {
                    address: walletAddress,
                    network: networkData
                }
            });
            document.dispatchEvent(walletConnectedEvent);
            
            console.log('🎯 Evento walletConnected disparado:', {
                address: walletAddress,
                network: networkData
            });
            
            console.log('… Wallet conectada:', walletAddress);
        }
        
    } catch (error) {
        console.error('ÃŒ Erro ao conectar wallet:', error);
        alert('Erro ao conectar com a MetaMask: ' + error.message);
    }
}

/**
 * Atualiza interface da wallet
 */
function updateWalletUI() {
    const statusInput = document.getElementById('wallet-status');
    const connectBtn = document.getElementById('connect-metamask-btn');
    const ownerInput = document.getElementById('ownerAddress');
    const networkSection = document.getElementById('network-info-section');
    const connectionSection = document.querySelector('.connection-section');
    
    if (walletConnected && walletAddress) {
        // Status da wallet
        if (statusInput) {
            statusInput.value = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
            statusInput.classList.add('wallet-status-connected');
        }
        
        // Botão conectar
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="bi bi-check-circle"></i> CONECTADO';
            connectBtn.classList.add('btn-success');
            connectBtn.classList.remove('btn-outline-warning');
            connectBtn.disabled = true;
        }
        
        // Endereço do owner
        if (ownerInput) {
            ownerInput.value = walletAddress;
        }
        
        // Mostra info da rede
        if (networkSection) {
            networkSection.style.display = 'block';
        }
        
        // Atualiza seção de Conexão
        if (connectionSection) {
            connectionSection.classList.add('connected-state');
        }
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
        const networkDisplayInput = document.getElementById('network-display');
        const networkStatus = document.getElementById('network-status');
        
        if (currentNetworkSpan) {
            currentNetworkSpan.textContent = networkData.name;
        }
        
        if (chainIdSpan) {
            chainIdSpan.textContent = networkData.chainId;
        }
        
        if (networkDisplayInput) {
            networkDisplayInput.value = `${networkData.name} (Chain ID: ${networkData.chainId})`;
        }
        
        if (networkStatus) {
            networkStatus.innerHTML = '<i class="bi bi-check-circle text-success"></i> Detectada';
        }
        
        console.log('Œ Rede detectada:', networkData);
        
    } catch (error) {
        console.error('ÃŒ Erro ao detectar rede:', error);
    }
}

/**
 * Obtém informações da rede baseado no chainId
 */
function getNetworkInfo(chainId) {
    const networks = {
        '0x1': { name: 'Ethereum Mainnet', chainId: '1' },
        '0x89': { name: 'Polygon Mainnet', chainId: '137' },
        '0x38': { name: 'BSC Mainnet', chainId: '56' },
        '0x61': { name: 'BSC Testnet', chainId: '97' },
        '0x2105': { name: 'Base Mainnet', chainId: '8453' },
        '0xaa36a7': { name: 'Sepolia Testnet', chainId: '11155111' },
        '0x13881': { name: 'Polygon Mumbai', chainId: '80001' }
    };
    
    return networks[chainId] || { 
        name: 'Rede Desconhecida', 
        chainId: parseInt(chainId, 16).toString() 
    };
}

/**
 * Verifica Conexão da wallet
 */
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                walletConnected = true;
                updateWalletUI();
                await detectNetwork();
            }
        } catch (error) {
            console.log('Wallet nÃo conectada');
        }
    }
}

/**
 * Navega para o próximo step
 */
function nextStep() {
    if (currentStep < 3) {
        currentStep++;
        showStep(currentStep);
        updateStepIndicators();
    }
}

/**
 * Navega para o step anterior
 */
function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateStepIndicators();
    }
}

/**
 * Mostra o step específico
 */
function showStep(stepNumber) {
    // Esconde todos os steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    
    // Mostra o step atual
    const currentStepElement = document.getElementById(`step-${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
}

/**
 * Atualiza indicadores dos steps
 */
function updateStepIndicators() {
    for (let i = 1; i <= 3; i++) {
        // Tenta atualizar tanto os indicadores antigos quanto os novos
        const stepIndicatorOld = document.getElementById(`step-simple-${i}`);
        const stepIndicatorNew = document.getElementById(`step-indicator-${i}`);
        
        [stepIndicatorOld, stepIndicatorNew].forEach(stepIndicator => {
            if (stepIndicator) {
                stepIndicator.classList.remove('active', 'completed');
                
                if (i < currentStep) {
                    stepIndicator.classList.add('completed');
                } else if (i === currentStep) {
                    stepIndicator.classList.add('active');
                }
            }
        });
    }
}

/**
 * Valida step 1
 */
function validateStep1() {
    // Validação do Step 1 (agora Personalização)
    // Por enquanto sempre passa, pois é só seleção de tipo
    return true;
}

/**
 * Valida step 2 (agora Dados Básicos)
 */
function validateStep2() {
    const tokenName = document.getElementById('tokenName').value.trim();
    const tokenSymbol = document.getElementById('tokenSymbol').value.trim();
    const totalSupply = document.getElementById('totalSupply').value.trim();
    
    if (!walletConnected) {
        alert('Por favor, conecte sua carteira primeiro.');
        return false;
    }
    
    if (!tokenName) {
        alert('Por favor, preencha o nome do token.');
        return false;
    }
    
    if (!tokenSymbol) {
        alert('Por favor, preencha o símbolo do token.');
        return false;
    }
    
    if (!totalSupply || isNaN(totalSupply) || parseFloat(totalSupply) <= 0) {
        alert('Por favor, preencha um supply total válido.');
        return false;
    }
    
    return true;
}

/**
 * Funções globais para compatibilidade
 */
window.nextStep = nextStep;
window.prevStep = prevStep;
window.connectWallet = connectWallet;
window.toggleAddressCustomization = toggleAddressCustomization;

// Funções para o step 1 (agora Personalização)
function toggleAddressCustomization() {
    const customizationSection = document.getElementById('customization-section');
    const personalizadoRadio = document.getElementById('contrato-personalizado');
    
    if (customizationSection) {
        customizationSection.style.display = personalizadoRadio.checked ? 'block' : 'none';
    }
    
    // Opcional: mostrar preços diferentes baseados na seleção
    updatePriceDisplay();
}

// Função para atualizar exibição de preços
function updatePriceDisplay() {
    const simplesRadio = document.getElementById('contrato-simples');
    const personalizadoRadio = document.getElementById('contrato-personalizado');
    
    // Aqui você pode adicionar lógica para mostrar diferentes preços
    // baseado no tipo de contrato selecionado
    if (simplesRadio && simplesRadio.checked) {
        console.log('Contrato simples selecionado - Preço: 0.01 BNB');
    } else if (personalizadoRadio && personalizadoRadio.checked) {
        console.log('Contrato personalizado selecionado - Preço: 0.02 BNB');
    }
}

function buscarSalt() {
    console.log('” Iniciando busca de SALT...');
    // Implementar busca de SALT
    alert('Funcionalidade de busca de SALT será implementada.');
}

function pararBusca() {
    console.log('Ã¹ï¸ Parando busca de SALT...');
    // Implementar parada da busca
}

// Exporta funções globais
window.toggleAddressCustomization = toggleAddressCustomization;
window.buscarSalt = buscarSalt;
window.pararBusca = pararBusca;

console.log('… xcafe Token Creator carregado');






