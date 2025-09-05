// XCAFE Widget MetaMask Integration - Enhanced Version
// Using shared MetaMask connector from ../../js/shared/metamask-connector.js

// This file now serves as a bridge between the widget and the shared connector
// All MetaMask functionality is handled by the shared connector

// Network configurations (for reference)
const SUPPORTED_NETWORKS = {
    '0x1': {
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        blockExplorer: 'https://etherscan.io'
    },
    '0x89': {
        name: 'Polygon Mainnet',
        rpcUrl: 'https://polygon-rpc.com/',
        blockExplorer: 'https://polygonscan.com'
    },
    '0x38': {
        name: 'BSC Mainnet',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        blockExplorer: 'https://bscscan.com'
    }
};

// Initialize MetaMask connector on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeMetaMaskConnector();
});

// Initialize MetaMask integration (using shared connector)
function initializeMetaMaskConnector() {
    if (window.metaMaskConnector) {
        console.log('Using shared MetaMask connector');
        
        // Setup event listeners for UI updates
        setupMetaMaskEventListeners();
        
        // Check existing connection
        checkExistingConnection();
        
        // Update UI (using shared connector state)
        updateConnectionUI();
        
        console.log('MetaMask integration initialized');
    } else {
        console.warn('Shared MetaMask connector not available');
        setTimeout(initializeMetaMaskConnector, 100); // Retry after 100ms
    }
}

// Setup MetaMask event listeners (using shared connector events)
function setupMetaMaskEventListeners() {
    if (!window.metaMaskConnector) return;
    
    // The shared connector already handles most events
    // We just need to listen for UI updates
    
    // Listen for account changes from shared connector
    document.addEventListener('metamask:accountChanged', (event) => {
        console.log('Account changed via shared connector:', event.detail);
        
        if (event.detail.account) {
            // Set current user for app.js
            if (typeof window.currentUser !== 'undefined') {
                window.currentUser = event.detail.account;
            }
            
            updateConnectionUI();
            updateConnectionStatus(`Connected: ${formatAddress(event.detail.account)}`, 'success');
            showNotification('Conta alterada com sucesso!', 'info');
            
            // Reload user data
            if (typeof onUserConnected === 'function') {
                onUserConnected();
            }
        } else {
            // User disconnected
            handleDisconnect();
        }
    });
    
    // Listen for network changes from shared connector
    document.addEventListener('metamask:networkChanged', (event) => {
        console.log('Network changed via shared connector:', event.detail);
        
        updateConnectionUI();
        showNotification('Rede alterada!', 'info');
        
        // Reload the page to ensure proper state
        window.location.reload();
    });
}

// Check existing connection (using shared connector)
async function checkExistingConnection() {
    if (!window.metaMaskConnector) return;
    
    try {
        const currentAccount = await window.metaMaskConnector.getCurrentAccount();
        
        if (currentAccount) {
            // Set current user for app.js
            if (typeof window.currentUser !== 'undefined') {
                window.currentUser = currentAccount;
            }
            
            updateConnectionUI();
            updateConnectionStatus(`Connected: ${formatAddress(currentAccount)}`, 'success');
            
            // Load user data
            if (typeof onUserConnected === 'function') {
                await onUserConnected();
            }
        }
    } catch (error) {
        console.error('Error checking existing connection:', error);
    }
}

// Connect to MetaMask (using shared connector)
async function connectMetaMask() {
    if (!window.metaMaskConnector || !window.metaMaskConnector.isMetaMaskInstalled()) {
        showNotification('MetaMask não está instalado. Por favor, instale o MetaMask para continuar.', 'warning');
        if (window.showMetaMaskInstallModal) {
            window.showMetaMaskInstallModal();
        } else {
            window.open('https://metamask.io/download/', '_blank');
        }
        return false;
    }
    
    try {
        showLoading(true);
        updateConnectionStatus('Conectando...', 'info');
        
        // Use shared connector to connect
        const connectionResult = await window.metaMaskConnector.connect();
        
        if (connectionResult && connectionResult.account) {
            // Update UI
            updateConnectionUI();
            
            // Set current user for app.js
            if (typeof window.currentUser !== 'undefined') {
                window.currentUser = connectionResult.account;
            }
            
            await onUserConnected();
            updateConnectionStatus(`Connected: ${formatAddress(connectionResult.account)}`, 'success');
            showNotification('Conectado com sucesso!', 'success');
            
            // Close wallet modal if open
            const walletModal = document.getElementById('walletModal');
            if (walletModal) {
                const modal = bootstrap.Modal.getInstance(walletModal);
                if (modal) modal.hide();
            }
            
            return true;
        }
        
    } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        
        let errorMessage = 'Erro desconhecido';
        
        if (error.code === 4001) {
            errorMessage = 'Conexão rejeitada pelo usuário';
        } else if (error.code === -32002) {
            errorMessage = 'Connection request already pending. Check MetaMask.';
        } else if (error.message) {
            errorMessage = 'Erro ao conectar MetaMask: ' + error.message;
        }
        
        updateConnectionStatus(errorMessage, 'error');
        showNotification(errorMessage, 'error');
        
    } finally {
        showLoading(false);
    }
    
    return false;
}

// Handle disconnection (simplified for shared connector)
function handleDisconnect() {
    console.log('MetaMask disconnected');
    
    // Clear current user
    if (typeof window.currentUser !== 'undefined') {
        window.currentUser = null;
    }
    
    updateConnectionUI();
    updateConnectionStatus('Desconectado', 'warning');
    showNotification('MetaMask desconectado!', 'warning');
    
    // Clear user data
    if (typeof clearUserData === 'function') {
        clearUserData();
    }
}

// Alias for backward compatibility
function handleDisconnection() {
    return handleDisconnect();
}

// Update connection UI (using shared connector state)
function updateConnectionUI() {
    if (!window.metaMaskConnector) {
        updateConnectionStatus('MetaMask connector not available', 'error');
        return;
    }
    
    const connectBtn = document.getElementById('connectWallet');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');
    const disconnectBtn = document.getElementById('disconnectWallet');
    
    // Get current state from shared connector
    const isConnected = window.metaMaskConnector.isConnected;
    const currentAccount = window.metaMaskConnector.getCurrentAccount ? window.metaMaskConnector.getCurrentAccount() : null;
    
    if (isConnected && currentAccount) {
        // Connected state
        if (connectBtn) {
            connectBtn.style.display = 'none';
        }
        
        if (walletInfo) {
            walletInfo.style.display = 'block';
        }
        
        if (walletAddress) {
            walletAddress.textContent = formatAddress(currentAccount);
        }
        
        if (disconnectBtn) {
            disconnectBtn.style.display = 'inline-block';
        }
        
        // Update other UI elements
        const userSections = document.querySelectorAll('.user-section');
        userSections.forEach(section => {
            section.style.display = 'block';
        });
        
        const guestSections = document.querySelectorAll('.guest-section');
        guestSections.forEach(section => {
            section.style.display = 'none';
        });
        
    } else {
        // Disconnected state
        if (connectBtn) {
            connectBtn.style.display = 'inline-block';
        }
        
        if (walletInfo) {
            walletInfo.style.display = 'none';
        }
        
        if (disconnectBtn) {
            disconnectBtn.style.display = 'none';
        }
        
        // Update other UI elements
        const userSections = document.querySelectorAll('.user-section');
        userSections.forEach(section => {
            section.style.display = 'none';
        });
        
        const guestSections = document.querySelectorAll('.guest-section');
        guestSections.forEach(section => {
            section.style.display = 'block';
        });
    }
}

// Disconnect from MetaMask (using shared connector)
function disconnectMetaMask() {
    if (window.metaMaskConnector) {
        window.metaMaskConnector.disconnect();
    }
    handleDisconnection();
    showNotification('Desconectado com sucesso!', 'success');
}

// These functions are now handled by the shared connector
// Keeping minimal versions for backward compatibility

// Check if current network is valid
function isValidNetwork(chainId) {
    return Object.keys(SUPPORTED_NETWORKS).includes(chainId);
}

// Switch to a valid network (using shared connector)
async function switchToValidNetwork() {
    if (!window.metaMaskConnector) {
        showNotification('MetaMask connector not available', 'error');
        return;
    }
    
    try {
        // Try to switch to Ethereum Mainnet first
        await window.metaMaskConnector.switchToNetwork('0x1');
        showNotification('Network changed successfully!', 'success');
    } catch (error) {
        console.error('Error switching network:', error);
        
        if (error.code === 4902) {
            showNotification('Network not found. Please add the network manually.', 'warning');
        } else {
            showNotification('Error switching network. Please manually switch to a supported network.', 'warning');
        }
    }
}

// Authenticate with backend (using shared connector)
async function authenticateWithBackend() {
    if (!window.metaMaskConnector || !window.metaMaskConnector.isConnected) {
        throw new Error('MetaMask not connected');
    }
    
    try {
        updateConnectionStatus('Authenticating...', 'info');
        
        const currentAccount = window.metaMaskConnector.getCurrentAccount();
        
        // Get nonce from backend
        const nonceResponse = await fetch('/api/auth/nonce', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address: currentAccount })
        });
        
        if (!nonceResponse.ok) {
            const errorData = await nonceResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to get nonce from server');
        }
        
        const { nonce } = await nonceResponse.json();
        
        if (!nonce) {
            throw new Error('Invalid nonce received from server');
        }
        
        // Create authentication message
        const message = `XCAFE Widget Authentication\n\nAddress: ${currentAccount}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
        
        // Sign message with MetaMask
        const signature = await signMessage(message);
        
        if (!signature) {
            throw new Error('Message signing was cancelled or failed');
        }
        
        // Verify signature with backend
        const verifyResponse = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: currentAccount,
                signature: signature,
                message: message,
                chainId: window.metaMaskConnector.getCurrentChainId()
            })
        });
        
        if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'Authentication verification failed');
        }
        
        const authData = await verifyResponse.json();
        
        // Store authentication data
        if (authData.token) {
            localStorage.setItem('authToken', authData.token);
            localStorage.setItem('userAddress', currentAccount);
            localStorage.setItem('chainId', window.metaMaskConnector.getCurrentChainId());
            localStorage.setItem('authTimestamp', Date.now().toString());
        }
        
        updateConnectionStatus(`Authenticated: ${formatAddress(currentAccount)}`, 'success');
        showNotification('Authentication completed successfully!', 'success');
        
        return { success: true, data: authData };
        
    } catch (error) {
        console.error('Authentication error:', error);
        updateConnectionStatus('Authentication error', 'error');
        showNotification('Authentication error: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Buy credits using smart contract (enhanced version)
async function buyCredits(packageId, ethAmount) {
    try {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed');
        }
        
        if (!currentAccount) {
            throw new Error('Wallet not connected');
        }
        
        updateConnectionStatus('Processing purchase...', 'info');
        showNotification('Starting transaction...', 'info');
        
        // Initialize Web3
        const web3 = new Web3(window.ethereum);
        
        // Get contract instance
        const contractAddress = getContractAddress();
        if (!contractAddress) {
            throw new Error('Contract address not found');
        }
        
        const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);
        
        // Determine package ID
        const pkgId = getPackageId(packageId);
        if (pkgId === null) {
            throw new Error('Invalid package ID');
        }
        
        // Convert ETH to Wei
        const weiAmount = web3.utils.toWei(ethAmount.toString(), 'ether');
        
        // Check balance
        const balance = await web3.eth.getBalance(currentAccount);
        if (web3.utils.toBN(balance).lt(web3.utils.toBN(weiAmount))) {
            throw new Error('Insufficient balance for transaction');
        }
        
        // Estimate gas
        let gasEstimate;
        try {
            gasEstimate = await contract.methods.buyCredits(pkgId).estimateGas({
                from: currentAccount,
                value: weiAmount
            });
        } catch (gasError) {
            console.error('Gas estimation failed:', gasError);
            throw new Error('Gas estimation failed. Check transaction parameters.');
        }
        
        // Get current gas price
        const gasPrice = await web3.eth.getGasPrice();
        const gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');
        
        console.log(`Gas estimate: ${gasEstimate}, Gas price: ${gasPriceGwei} Gwei`);
        
        // Send transaction
        showNotification('Confirm transaction in MetaMask...', 'info');
        
        const transaction = await contract.methods.buyCredits(pkgId).send({
            from: currentAccount,
            value: weiAmount,
            gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
            gasPrice: gasPrice
        });
        
        showNotification('Transaction sent! Waiting for confirmation...', 'success');
        
        // Notify backend about the purchase
        try {
            await notifyBackendPurchase({
                transactionHash: transaction.transactionHash,
                packageId: packageId,
                amount: ethAmount,
                userAddress: currentAccount,
                blockNumber: transaction.blockNumber
            });
        } catch (notifyError) {
            console.warn('Failed to notify backend:', notifyError);
        }
        
        updateConnectionStatus(`Transaction confirmed: ${transaction.transactionHash.substring(0, 10)}...`, 'success');
        showNotification('Purchase completed successfully!', 'success');
        
        return {
            success: true,
            transactionHash: transaction.transactionHash,
            blockNumber: transaction.blockNumber,
            gasUsed: transaction.gasUsed
        };
        
    } catch (error) {
        console.error('Error buying credits:', error);
        
        let errorMessage = error.message;
        
        // Handle common MetaMask errors
        if (error.code === 4001) {
            errorMessage = 'Transaction cancelled by user';
        } else if (error.code === -32603) {
            errorMessage = 'Internal MetaMask error';
        } else if (error.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient balance for transaction';
        }
        
        updateConnectionStatus('Transaction error', 'error');
        showNotification('Purchase error: ' + errorMessage, 'error');
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

// Get contract address based on current network
function getContractAddress() {
    // Contract addresses for different networks
    const addresses = {
        '0x1': '0x1234567890123456789012345678901234567890', // Mainnet
        '0x5': '0x1234567890123456789012345678901234567890', // Goerli
        '0xaa36a7': '0x1234567890123456789012345678901234567890', // Sepolia
        '0x89': '0x1234567890123456789012345678901234567890', // Polygon
        '0x13881': '0x1234567890123456789012345678901234567890' // Mumbai
    };
    
    return addresses[currentChainId] || addresses['0xaa36a7']; // Default to Sepolia testnet
}

// Determine package ID based on credits or package name
function getPackageId(packageIdentifier) {
    // Support both credit amounts and package names
    const packages = {
        // By credits
        100: 1,
        500: 2,
        1000: 3,
        5000: 4,
        10000: 5,
        // By package name
        'basic': 1,
        'standard': 2,
        'premium': 3,
        'enterprise': 4,
        'unlimited': 5
    };
    
    return packages[packageIdentifier] || packages[packageIdentifier.toString()] || 1;
}

// Notify backend about purchase
async function notifyBackendPurchase(purchaseData) {
    try {
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch('/api/purchase/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken ? `Bearer ${authToken}` : '',
                'X-User-Address': currentAccount || ''
            },
            body: JSON.stringify({
                ...purchaseData,
                timestamp: Date.now(),
                chainId: currentChainId,
                networkName: getNetworkName(currentChainId)
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to notify backend about purchase');
        }
        
        const result = await response.json();
        console.log('Backend notified successfully:', result);
        
        return result;
    } catch (error) {
        console.error('Error notifying backend:', error);
        // Don't throw error here as the transaction was successful
        // Just log the notification failure
        return { success: false, error: error.message };
    }
}

// Utility functions

// Get ETH balance
async function getETHBalance(address = currentAccount) {
    try {
        if (!address) {
            throw new Error('No address provided');
        }
        
        const web3 = new Web3(window.ethereum);
        const balance = await web3.eth.getBalance(address);
        return web3.utils.fromWei(balance, 'ether');
    } catch (error) {
        console.error('Error getting ETH balance:', error);
        return '0';
    }
}

// Get current gas price
async function getGasPrice() {
    try {
        const web3 = new Web3(window.ethereum);
        const gasPrice = await web3.eth.getGasPrice();
        return {
            wei: gasPrice,
            gwei: web3.utils.fromWei(gasPrice, 'gwei'),
            formatted: parseFloat(web3.utils.fromWei(gasPrice, 'gwei')).toFixed(2) + ' Gwei'
        };
    } catch (error) {
        console.error('Error getting gas price:', error);
        return { wei: '0', gwei: '0', formatted: '0 Gwei' };
    }
}

// Sign message with MetaMask (using shared connector)
async function signMessage(message) {
    if (!window.metaMaskConnector || !window.metaMaskConnector.isConnected) {
        throw new Error('MetaMask not connected');
    }
    
    try {
        const signature = await window.metaMaskConnector.signMessage(message);
        return signature;
    } catch (error) {
        console.error('Error signing message:', error);
        
        if (error.code === 4001) {
            showNotification('Signature cancelled by user', 'warning');
        } else {
            showNotification('Error signing message', 'error');
        }
        
        return null;
    }
}

// Check if MetaMask is installed (using shared connector)
function isMetaMaskInstalled() {
    return window.metaMaskConnector ? window.metaMaskConnector.isMetaMaskInstalled() : false;
}

// Get network name from chain ID
function getNetworkName(chainId) {
    return SUPPORTED_NETWORKS[chainId]?.name || `Unknown Network (${chainId})`;
}

// Format address for display
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Format ETH amount (alias)
function formatETHAmount(amount, decimals = 4) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
}

// Convert Wei to ETH
function weiToEth(wei) {
    try {
        const web3 = new Web3();
        return web3.utils.fromWei(wei.toString(), 'ether');
    } catch (error) {
        console.error('Error converting Wei to ETH:', error);
        return '0';
    }
}

// Convert ETH to Wei
function ethToWei(eth) {
    try {
        const web3 = new Web3();
        return web3.utils.toWei(eth.toString(), 'ether');
    } catch (error) {
        console.error('Error converting ETH to Wei:', error);
        return '0';
    }
}

// Check transaction status
async function checkTransactionStatus(txHash) {
    try {
        if (!txHash) {
            throw new Error('No transaction hash provided');
        }
        
        const web3 = new Web3(window.ethereum);
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        
        if (receipt) {
            return {
                status: receipt.status ? 'success' : 'failed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed,
                transactionHash: receipt.transactionHash
            };
        }
        
        return { status: 'pending' };
    } catch (error) {
        console.error('Error checking transaction status:', error);
        return { status: 'error', error: error.message };
    }
}

// Update connection status in UI
function updateConnectionStatus(message, type = 'info') {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `connection-status ${type}`;
    }
    
    console.log(`[MetaMask] ${type.toUpperCase()}: ${message}`);
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Try to use existing notification system
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback to console and alert for important messages
    console.log(`[Notification] ${type.toUpperCase()}: ${message}`);
    
    if (type === 'error') {
        alert(`Error: ${message}`);
    } else if (type === 'success') {
        console.log(`Success: ${message}`);
    }
}

// Show loading state
function showLoading(show) {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

// Callback for when user is successfully connected (using shared connector)
async function onUserConnected() {
    if (!window.metaMaskConnector || !window.metaMaskConnector.isConnected) {
        return;
    }
    
    try {
        const account = window.metaMaskConnector.getCurrentAccount();
        const chainId = window.metaMaskConnector.getCurrentChainId();
        const balance = await getETHBalance(account);
        
        // Trigger custom event for other parts of the app
        window.dispatchEvent(new CustomEvent('metamaskConnected', {
            detail: {
                account: account,
                chainId: chainId,
                balance: balance,
                networkName: window.metaMaskConnector.getNetworkName(chainId)
            }
        }));
        
        // Call any registered callback
        if (typeof window.onMetaMaskConnected === 'function') {
            window.onMetaMaskConnected({
                account: account,
                chainId: chainId,
                balance: balance
            });
        }
        
        console.log('User connected successfully:', {
            account: account,
            network: window.metaMaskConnector.getNetworkName(chainId),
            balance: formatETHAmount(balance) + ' ETH'
        });
        
    } catch (error) {
        console.error('Error in onUserConnected:', error);
    }
}

// Contract ABI (simplified for credit purchases)
const CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "packageId", "type": "uint256"}
        ],
        "name": "buyCredits",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "user", "type": "address"}
        ],
        "name": "getUserCredits",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Make essential functions globally available for backward compatibility
window.connectMetaMask = connectMetaMask;
window.buyCredits = buyCredits;
window.getETHBalance = getETHBalance;
window.formatAddress = formatAddress;
window.isMetaMaskInstalled = isMetaMaskInstalled;
window.authenticateWithBackend = authenticateWithBackend;

console.log('MetaMask integration initialized successfully (using shared connector)');