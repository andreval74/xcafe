// Main Application JavaScript

// Global variables
let currentUser = null;
let userStats = {
    credits: 0,
    apiKeys: 0,
    requestsToday: 0,
    totalSpent: 0
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Widget SaaS Application Initialized');
    
    // Wait for MetaMask connector to be ready
    if (window.metaMaskConnector) {
        // Setup MetaMask event handlers
        window.metaMaskConnector.onAccountChange = async (account) => {
            if (account) {
                currentUser = account;
                updateConnectionStatus(true);
                await loadUserData();
            } else {
                logout();
            }
        };
        
        window.metaMaskConnector.onDisconnect = () => {
            logout();
        };
    }
    
    // Check if user is already connected
    checkExistingConnection();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Set up event listeners
    setupEventListeners();
});

// Check for existing MetaMask connection
async function checkExistingConnection() {
    if (window.metaMaskConnector) {
        try {
            // Check if MetaMask connector has an active connection
            const accountInfo = await window.metaMaskConnector.getCurrentAccount();
            
            if (accountInfo && accountInfo.address && accountInfo.isConnected) {
                currentUser = accountInfo.address;
                
                // Verify authentication with backend
                const authToken = localStorage.getItem('authToken');
                const authTimestamp = localStorage.getItem('authTimestamp');
                
                if (authToken && authTimestamp) {
                    const tokenAge = Date.now() - parseInt(authTimestamp);
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                    
                    if (tokenAge < maxAge) {
                        await onUserConnected();
                        return;
                    }
                }
                
                // Re-authenticate if token is expired or missing
                await authenticateWithBackend();
            }
        } catch (error) {
            console.error('Error checking existing connection:', error);
            // Clear invalid auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('authTimestamp');
        }
    }
}

// Handle user connection
async function onUserConnected() {
    if (!currentUser) return;
    
    try {
        // Update connection status
        updateConnectionStatus(true);
        
        // Update UI
        updateUserInterface();
        
        // Load user data
        await loadUserData();
        
        // Show dashboard
        showSection('dashboard');
        
        showNotification('Successfully connected!', 'success');
    } catch (error) {
        console.error('Error in onUserConnected:', error);
        showNotification('Connection error', 'error');
    }
}

// Update user interface after connection
function updateUserInterface() {
    const userAddressElement = document.getElementById('userAddress');
    if (userAddressElement && currentUser) {
        userAddressElement.textContent = formatAddress(currentUser);
    }
    
    // Hide login section and show main content
    document.getElementById('login-section').classList.add('d-none');
    document.getElementById('dashboard-section').classList.remove('d-none');
    
    // Update connection indicator if exists
    const connectionIndicator = document.querySelector('.connection-status');
    if (connectionIndicator) {
        connectionIndicator.classList.remove('disconnected');
        connectionIndicator.classList.add('connected');
        connectionIndicator.textContent = 'Conectado';
    }
}

// Load user data from backend
async function loadUserData() {
    try {
        showLoading(true);
        
        // Get user profile
        const profile = await apiRequest('/api/user/profile', 'GET');
        if (profile) {
            userStats.credits = profile.credits || 0;
            updateStatsDisplay();
        }
        
        // Get API keys count
        const apiKeys = await apiRequest('/api/user/api-keys', 'GET');
        if (apiKeys) {
            userStats.apiKeys = apiKeys.length || 0;
        }
        
        // Get usage statistics
        const stats = await apiRequest('/api/user/stats', 'GET');
        if (stats) {
            userStats.requestsToday = stats.requestsToday || 0;
            userStats.totalSpent = stats.totalSpent || 0;
        }
        
        // Update display
        updateStatsDisplay();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Erro ao carregar dados do usuário', 'error');
    } finally {
        showLoading(false);
    }
}

// Update statistics display
function updateStatsDisplay() {
    document.getElementById('credits-balance').textContent = userStats.credits;
    document.getElementById('api-keys-count').textContent = userStats.apiKeys;
    document.getElementById('requests-today').textContent = userStats.requestsToday;
    document.getElementById('total-spent').textContent = `${userStats.totalSpent} ETH`;
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const activity = await apiRequest('/api/user/activity', 'GET');
        const container = document.getElementById('recent-activity');
        
        if (activity && activity.length > 0) {
            container.innerHTML = activity.map(item => `
                <div class="activity-item ${item.type}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${item.title}</strong>
                            <p class="mb-0 text-muted small">${item.description}</p>
                        </div>
                        <small class="text-muted">${formatDate(item.created_at)}</small>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma atividade recente</p>';
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    const sections = ['dashboard-section', 'credits-section', 'api-keys-section', 'widget-section'];
    sections.forEach(section => {
        document.getElementById(section).classList.add('d-none');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove('d-none');
    
    // Update navigation
    updateNavigation(sectionName);
    
    // Load section-specific data
    loadSectionData(sectionName);
}

// Update navigation active state
function updateNavigation(activeSection) {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${activeSection}`) {
            link.classList.add('active');
        }
    });
}

// Load section-specific data
async function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'credits':
            await loadCreditsData();
            break;
        case 'api-keys':
            await loadApiKeysData();
            break;
        case 'widget':
            await loadWidgetData();
            break;
    }
}

// Load credits section data
async function loadCreditsData() {
    try {
        const transactions = await apiRequest('/api/user/credit-history', 'GET');
        const container = document.getElementById('transaction-history');
        
        if (transactions && transactions.length > 0) {
            container.innerHTML = transactions.map(tx => `
                <div class="transaction-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${tx.type === 'purchase' ? 'Compra' : 'Uso'} de Créditos</strong>
                            <p class="mb-0 text-muted small">
                                ${tx.amount} créditos - ${tx.eth_amount} ETH
                            </p>
                        </div>
                        <div class="text-end">
                            <span class="transaction-status ${tx.status}">${tx.status}</span>
                            <br>
                            <small class="text-muted">${formatDate(tx.created_at)}</small>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma transação encontrada</p>';
        }
    } catch (error) {
        console.error('Error loading credits data:', error);
    }
}

// Load API keys section data
async function loadApiKeysData() {
    try {
        const apiKeys = await apiRequest('/api/user/api-keys', 'GET');
        const container = document.getElementById('api-keys-list');
        
        if (apiKeys && apiKeys.length > 0) {
            container.innerHTML = apiKeys.map(key => `
                <div class="api-key-item">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <strong>${key.name || 'Chave API'}</strong>
                            <span class="status-badge ${key.is_active ? 'active' : 'inactive'} ms-2">
                                ${key.is_active ? 'Ativa' : 'Inativa'}
                            </span>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="copyApiKey('${key.key_hash}')">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteApiKey('${key.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="api-key-value">${key.key_hash}</div>
                    <small class="text-muted">
                        Criada em ${formatDate(key.created_at)} • 
                        ${key.usage_count || 0} requisições
                    </small>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma chave API encontrada</p>';
        }
    } catch (error) {
        console.error('Error loading API keys data:', error);
    }
}

// Load widget section data
async function loadWidgetData() {
    // Update widget code with user's first API key
    try {
        const apiKeys = await apiRequest('/api/user/api-keys', 'GET');
        const widgetCodeElement = document.getElementById('widget-code');
        
        if (apiKeys && apiKeys.length > 0) {
            const apiKey = apiKeys[0].key_hash;
            widgetCodeElement.innerHTML = `
&lt;script src="${window.location.origin}/widget.js"&gt;&lt;/script&gt;<br>
&lt;script&gt;<br>
&nbsp;&nbsp;WidgetSaaS.init({<br>
&nbsp;&nbsp;&nbsp;&nbsp;apiKey: '${apiKey}',<br>
&nbsp;&nbsp;&nbsp;&nbsp;containerId: 'widget-container'<br>
&nbsp;&nbsp;});<br>
&lt;/script&gt;<br>
&lt;div id="widget-container"&gt;&lt;/div&gt;
            `;
        }
    } catch (error) {
        console.error('Error loading widget data:', error);
    }
}

// Connect MetaMask function (using shared connector)
async function connectMetaMask() {
    if (!window.metaMaskConnector || !window.metaMaskConnector.isMetaMaskInstalled()) {
        showNotification('MetaMask não está instalado. Por favor, instale o MetaMask para continuar.', 'warning');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }
    
    try {
        showLoading(true);
        
        // Use shared connector to connect
        const connectionResult = await window.metaMaskConnector.connect();
        
        if (connectionResult && connectionResult.account) {
            currentUser = connectionResult.account;
            
            // Authenticate with backend
            await authenticateWithBackend();
        }
    } catch (error) {
        console.error('Error connecting MetaMask:', error);
        if (error.code === 4001) {
            showNotification('Conexão rejeitada pelo usuário', 'warning');
        } else {
            showNotification('Erro ao conectar MetaMask: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

// Authenticate with backend
async function authenticateWithBackend() {
    if (!currentUser) {
        throw new Error('Nenhuma conta conectada');
    }
    
    try {
        // Get nonce from backend
        const nonceResponse = await fetch('/api/auth/nonce', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address: currentUser })
        });
        
        if (!nonceResponse.ok) {
            throw new Error('Erro ao obter nonce do servidor');
        }
        
        const { nonce } = await nonceResponse.json();
        
        // Create authentication message
        const message = `XCAFE Widget Authentication\n\nAddress: ${currentUser}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
        
        // Sign message
        const signature = await signMessage(message);
        
        // Verify signature with backend
        const verifyResponse = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: currentUser,
                message: message,
                signature: signature,
                chainId: await window.ethereum.request({ method: 'eth_chainId' })
            })
        });
        
        if (!verifyResponse.ok) {
            throw new Error('Erro na verificação da assinatura');
        }
        
        const { token } = await verifyResponse.json();
        
        // Store authentication data
        localStorage.setItem('authToken', token);
        localStorage.setItem('authTimestamp', Date.now().toString());
        localStorage.setItem('userAddress', currentUser);
        
        // Update connection status
        updateConnectionStatus(true);
        
        // Proceed with user connection
        await onUserConnected();
        
    } catch (error) {
        console.error('Authentication error:', error);
        showNotification('Erro na autenticação: ' + error.message, 'error');
        throw error;
    }
}

// Buy credits function
async function buyCredits() {
    const packageSelect = document.getElementById('credit-package');
    const credits = parseInt(packageSelect.value);
    
    try {
        showLoading(true);
        
        // Calculate ETH amount based on credits
        const ethAmount = calculateEthAmount(credits);
        
        // Use the global buyCredits function from metamask.js
        const result = await window.buyCredits(credits);
        
        if (result && result.transactionHash) {
            showNotification('Credits purchased successfully!', 'success');
            await loadUserData(); // Refresh data
            await loadCreditsData(); // Refresh credits section
        } else {
            showNotification('Erro ao comprar créditos', 'error');
        }
    } catch (error) {
        console.error('Error buying credits:', error);
        showNotification('Purchase error: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Generate new API key
async function generateApiKey() {
    try {
        showLoading(true);
        
        const result = await apiRequest('/api/user/api-keys', 'POST', {
            name: `Chave API ${new Date().toLocaleDateString()}`
        });
        
        if (result.success) {
            showNotification('Nova chave API gerada com sucesso!', 'success');
            await loadApiKeysData(); // Refresh API keys list
            await loadUserData(); // Refresh stats
        } else {
            showNotification('Erro ao gerar chave API', 'error');
        }
    } catch (error) {
        console.error('Error generating API key:', error);
        showNotification('Erro ao gerar chave API', 'error');
    } finally {
        showLoading(false);
    }
}

// Copy API key to clipboard
async function copyApiKey(apiKey) {
    try {
        await navigator.clipboard.writeText(apiKey);
        showNotification('Chave API copiada para a área de transferência!', 'success');
    } catch (error) {
        console.error('Error copying API key:', error);
        showNotification('Erro ao copiar chave API', 'error');
    }
}

// Delete API key
async function deleteApiKey(keyId) {
    if (!confirm('Tem certeza que deseja excluir esta chave API?')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const result = await apiRequest(`/api/user/api-keys/${keyId}`, 'DELETE');
        
        if (result.success) {
            showNotification('Chave API excluída com sucesso!', 'success');
            await loadApiKeysData(); // Refresh API keys list
            await loadUserData(); // Refresh stats
        } else {
            showNotification('Erro ao excluir chave API', 'error');
        }
    } catch (error) {
        console.error('Error deleting API key:', error);
        showNotification('Erro ao excluir chave API', 'error');
    } finally {
        showLoading(false);
    }
}

// Copy widget code to clipboard
async function copyWidgetCode() {
    const widgetCode = document.getElementById('widget-code').textContent;
    try {
        await navigator.clipboard.writeText(widgetCode.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' '));
        showNotification('Código do widget copiado para a área de transferência!', 'success');
    } catch (error) {
        console.error('Error copying widget code:', error);
        showNotification('Erro ao copiar código do widget', 'error');
    }
}

// Update connection status
function updateConnectionStatus(connected) {
    const userAddressElement = document.getElementById('userAddress');
    
    if (connected && currentUser) {
        userAddressElement.textContent = formatAddress(currentUser);
        
        // Update any connection indicators
        const indicators = document.querySelectorAll('.connection-status');
        indicators.forEach(indicator => {
            indicator.classList.remove('disconnected');
            indicator.classList.add('connected');
            indicator.textContent = 'Conectado';
        });
    } else {
        userAddressElement.textContent = 'Conectar MetaMask';
        
        // Update any connection indicators
        const indicators = document.querySelectorAll('.connection-status');
        indicators.forEach(indicator => {
            indicator.classList.remove('connected');
            indicator.classList.add('disconnected');
            indicator.textContent = 'Desconectado';
        });
    }
}

// Check if MetaMask is installed (using shared connector)
function isMetaMaskInstalled() {
    return window.metaMaskConnector && window.metaMaskConnector.isMetaMaskInstalled();
}

// Sign message using MetaMask (using shared connector)
async function signMessage(message) {
    if (!currentUser) {
        throw new Error('Nenhuma conta conectada');
    }
    
    try {
        if (window.metaMaskConnector && window.metaMaskConnector.isConnected) {
            return await window.metaMaskConnector.signMessage(message);
        } else {
            throw new Error('MetaMask not connected');
        }
    } catch (error) {
        console.error('Error signing message:', error);
        if (error.code === 4001) {
            throw new Error('Assinatura rejeitada pelo usuário');
        }
        throw new Error('Erro ao assinar mensagem: ' + error.message);
    }
}

// Logout function
function logout() {
    // Disconnect from MetaMask connector
    if (window.metaMaskConnector && window.metaMaskConnector.isConnected) {
        window.metaMaskConnector.disconnect();
    }
    
    currentUser = null;
    userStats = { credits: 0, apiKeys: 0, requestsToday: 0, totalSpent: 0 };
    
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTimestamp');
    localStorage.removeItem('userAddress');
    
    // Reset UI
    document.getElementById('login-section').classList.remove('d-none');
    document.getElementById('dashboard-section').classList.add('d-none');
    
    // Update connection status
    updateConnectionStatus(false);
    
    showNotification('Desconectado com sucesso!', 'info');
}

// Utility functions
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function calculateEthAmount(credits) {
    const basePrice = 0.0001; // 0.0001 ETH per credit
    let discount = 0;
    
    if (credits >= 5000) discount = 0.3;
    else if (credits >= 1000) discount = 0.2;
    else if (credits >= 500) discount = 0.1;
    
    return (credits * basePrice * (1 - discount)).toFixed(6);
}

// Show loading state
function showLoading(show) {
    const existingSpinner = document.querySelector('.loading-overlay');
    
    if (show && !existingSpinner) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '9999';
        overlay.innerHTML = '<div class="spinner-border text-light" role="status"><span class="visually-hidden">Carregando...</span></div>';
        document.body.appendChild(overlay);
    } else if (!show && existingSpinner) {
        existingSpinner.remove();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alert.style.zIndex = '10000';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Initialize tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Handle MetaMask account changes
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', function (accounts) {
            if (accounts.length === 0) {
                logout();
            } else if (accounts[0] !== currentUser) {
                currentUser = accounts[0];
                onUserConnected();
            }
        });
        
        window.ethereum.on('chainChanged', function (chainId) {
            // Reload page on chain change
            window.location.reload();
        });
    }
}