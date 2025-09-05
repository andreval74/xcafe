// MetaMask and Wallet Integration for Widget SaaS Platform

// Wallet state management
const WalletManager = {
    isConnected: false,
    currentAccount: null,
    chainId: null,
    balance: 0,
    provider: null,
    signer: null
};

// Contract addresses and ABIs (will be updated when contracts are deployed)
const CONTRACT_CONFIG = {
    USDT_ADDRESS: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet USDT
    SALE_CONTRACT_ADDRESS: null, // Will be set after deployment
    REQUIRED_CHAIN_ID: '0x1', // Ethereum Mainnet
    CHAIN_NAME: 'Ethereum Mainnet'
};

// Initialize wallet connection on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeWallet();
    setupWalletEventListeners();
});

// Initialize wallet functionality
async function initializeWallet() {
    if (typeof window.ethereum !== 'undefined') {
        WalletManager.provider = window.ethereum;
        
        // Check if already connected
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await handleAccountsChanged(accounts);
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
        
        // Setup event listeners for wallet events
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('disconnect', handleDisconnect);
        
    } else {
        console.log('MetaMask not detected');
    }
}

// Setup wallet-specific event listeners
function setupWalletEventListeners() {
    // Connect MetaMask button in modal
    const connectMetaMaskBtn = document.querySelector('[onclick="connectMetaMask()"]');
    if (connectMetaMaskBtn) {
        connectMetaMaskBtn.removeAttribute('onclick');
        connectMetaMaskBtn.addEventListener('click', connectMetaMask);
    }
}

// Connect to MetaMask
async function connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        showWalletError('MetaMask não está instalado. Por favor, instale a extensão MetaMask.');
        return;
    }
    
    try {
        // Show loading state
        updateWalletStatus('Conectando...', 'info');
        
        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length === 0) {
            throw new Error('Nenhuma conta selecionada');
        }
        
        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== CONTRACT_CONFIG.REQUIRED_CHAIN_ID) {
            await switchToRequiredNetwork();
        }
        
        await handleAccountsChanged(accounts);
        
        // Close modal on successful connection
        const walletModal = bootstrap.Modal.getInstance(document.getElementById('walletModal'));
        if (walletModal) {
            walletModal.hide();
        }
        
        showNotification('Success: Carteira conectada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        showWalletError('Error: ' + getErrorMessage(error));
    }
}

// Handle account changes
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected
        handleDisconnect();
        return;
    }
    
    WalletManager.currentAccount = accounts[0];
    WalletManager.isConnected = true;
    
    // Update UI
    updateWalletUI(true);
    updateWalletStatus(`Conectado: ${formatAddress(WalletManager.currentAccount)}`, 'success');
    
    // Get balance
    await updateBalance();
    
    // Authenticate with backend
    await authenticateWithBackend();
}

// Handle chain changes
async function handleChainChanged(chainId) {
    WalletManager.chainId = chainId;
    
    if (chainId !== CONTRACT_CONFIG.REQUIRED_CHAIN_ID) {
        showNotification('Rede incorreta. Por favor, mude para Ethereum Mainnet.', 'warning');
        await switchToRequiredNetwork();
    } else {
        showNotification('Conectado à rede correta.', 'success');
    }
}

// Handle disconnect
function handleDisconnect() {
    WalletManager.isConnected = false;
    WalletManager.currentAccount = null;
    WalletManager.balance = 0;
    
    updateWalletUI(false);
    updateWalletStatus('Carteira desconectada', 'warning');
    
    // Clear user session
    currentUser = null;
    userCredits = 0;
    updateCreditDisplay();
}

// Switch to required network
async function switchToRequiredNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONTRACT_CONFIG.REQUIRED_CHAIN_ID }]
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: CONTRACT_CONFIG.REQUIRED_CHAIN_ID,
                        chainName: CONTRACT_CONFIG.CHAIN_NAME,
                        rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
                        nativeCurrency: {
                            name: 'Ethereum',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        blockExplorerUrls: ['https://etherscan.io']
                    }]
                });
            } catch (addError) {
                console.error('Error adding network:', addError);
                showWalletError('Erro ao adicionar rede. Por favor, adicione manualmente.');
            }
        } else {
            console.error('Error switching network:', switchError);
            showWalletError('Erro ao trocar de rede.');
        }
    }
}

// Update wallet balance
async function updateBalance() {
    if (!WalletManager.currentAccount) return;
    
    try {
        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [WalletManager.currentAccount, 'latest']
        });
        
        // Convert from wei to ETH
        WalletManager.balance = parseInt(balance, 16) / Math.pow(10, 18);
        
        // Update UI
        const balanceElements = document.querySelectorAll('.wallet-balance');
        balanceElements.forEach(element => {
            element.textContent = formatCurrency(WalletManager.balance);
        });
        
    } catch (error) {
        console.error('Error getting balance:', error);
    }
}

// Authenticate with backend
async function authenticateWithBackend() {
    if (!WalletManager.currentAccount) return;
    
    try {
        // Create signature for authentication
        const message = `Autenticar na Widget SaaS Platform\nEndereço: ${WalletManager.currentAccount}\nTimestamp: ${Date.now()}`;
        
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, WalletManager.currentAccount]
        });
        
        // Send to backend for verification
        const response = await fetch('/api/auth/wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: WalletManager.currentAccount,
                message: message,
                signature: signature
            })
        });
        
        if (response.ok) {
            const userData = await response.json();
            currentUser = userData.user;
            userCredits = userData.credits || 0;
            updateCreditDisplay();
            
            // Redirect to dashboard if on landing page
            if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
                // Don't redirect automatically, let user choose
            }
        } else {
            console.error('Authentication failed:', await response.text());
        }
        
    } catch (error) {
        console.error('Error authenticating:', error);
    }
}

// Purchase credits with MetaMask
async function purchaseCreditsWithMetaMask(creditAmount) {
    if (!WalletManager.isConnected) {
        showNotification('Por favor, conecte sua carteira primeiro.', 'warning');
        return;
    }
    
    try {
        // Calculate price (example: 1 credit = 0.001 ETH)
        const pricePerCredit = 0.001;
        const totalPrice = creditAmount * pricePerCredit;
        const priceInWei = Math.floor(totalPrice * Math.pow(10, 18));
        
        if (WalletManager.balance < totalPrice) {
            showNotification('Saldo insuficiente para esta compra.', 'error');
            return;
        }
        
        showNotification('Iniciando transação...', 'info');
        
        // Send transaction
        const transactionHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: WalletManager.currentAccount,
                to: CONTRACT_CONFIG.SALE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
                value: '0x' + priceInWei.toString(16),
                gas: '0x5208', // 21000 gas limit
            }]
        });
        
        showNotification('Transação enviada! Aguardando confirmação...', 'info');
        
        // Wait for transaction confirmation
        await waitForTransaction(transactionHash);
        
        // Update credits on backend
        await updateCreditsOnBackend(creditAmount, transactionHash);
        
        showNotification(`Compra realizada com sucesso! ${creditAmount} créditos adicionados.`, 'success');
        
        // Update local state
        userCredits += creditAmount;
        updateCreditDisplay();
        
    } catch (error) {
        console.error('Error purchasing credits:', error);
        showNotification(getErrorMessage(error), 'error');
    }
}

// Wait for transaction confirmation
async function waitForTransaction(transactionHash) {
    return new Promise((resolve, reject) => {
        const checkTransaction = async () => {
            try {
                const receipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [transactionHash]
                });
                
                if (receipt) {
                    if (receipt.status === '0x1') {
                        resolve(receipt);
                    } else {
                        reject(new Error('Transação falhou'));
                    }
                } else {
                    // Transaction still pending, check again in 2 seconds
                    setTimeout(checkTransaction, 2000);
                }
            } catch (error) {
                reject(error);
            }
        };
        
        checkTransaction();
    });
}

// Update credits on backend
async function updateCreditsOnBackend(creditAmount, transactionHash) {
    try {
        const response = await fetch('/api/credits/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: WalletManager.currentAccount,
                credits: creditAmount,
                transactionHash: transactionHash
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar créditos no servidor');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating credits:', error);
        throw error;
    }
}

// Update wallet status in modal
function updateWalletStatus(message, type = 'info') {
    const statusElement = document.getElementById('walletStatus');
    if (statusElement) {
        const iconClass = {
            success: 'fa-check-circle text-success',
            error: 'fa-exclamation-circle text-danger',
            warning: 'fa-exclamation-triangle text-warning',
            info: 'fa-info-circle text-info'
        }[type] || 'fa-info-circle text-info';
        
        statusElement.innerHTML = `
            <p><i class="fas ${iconClass} me-2"></i>${message}</p>
        `;
    }
}

// Show wallet-specific errors
function showWalletError(message) {
    updateWalletStatus(message, 'error');
    showNotification(message, 'error');
}

// Get user-friendly error messages
function getErrorMessage(error) {
    if (error.code === 4001) {
        return 'Transação rejeitada pelo usuário.';
    } else if (error.code === -32602) {
        return 'Parâmetros inválidos.';
    } else if (error.code === -32603) {
        return 'Erro interno do MetaMask.';
    } else if (error.message.includes('insufficient funds')) {
        return 'Saldo insuficiente para completar a transação.';
    } else if (error.message.includes('User rejected')) {
        return 'Transação rejeitada pelo usuário.';
    } else {
        return error.message || 'Erro desconhecido.';
    }
}

// Disconnect wallet
function disconnectWallet() {
    handleDisconnect();
    showNotification('Carteira desconectada.', 'info');
}

// Export functions for global access
window.connectMetaMask = connectMetaMask;
window.purchaseCreditsWithMetaMask = purchaseCreditsWithMetaMask;
window.disconnectWallet = disconnectWallet;
window.WalletManager = WalletManager;

// Override the buyCredits function to use MetaMask
if (typeof window.buyCredits === 'function') {
    const originalBuyCredits = window.buyCredits;
    window.buyCredits = function(amount) {
        if (WalletManager.isConnected) {
            purchaseCreditsWithMetaMask(amount);
        } else {
            originalBuyCredits(amount);
        }
    };
}