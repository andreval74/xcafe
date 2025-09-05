// Dashboard JavaScript - XCAFE Widget System
// Sistema de compra de créditos e gerenciamento de chaves API

class XCAFEDashboard {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.usdtContract = null;
        this.saleContract = null;
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.selectedPackage = null;
        
        // USDT Contract Address (Ethereum Mainnet)
        this.usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        
        // Contract ABIs
        this.usdtABI = [
            'function transfer(address to, uint256 amount) returns (bool)',
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)',
            'function approve(address spender, uint256 amount) returns (bool)',
            'function allowance(address owner, address spender) view returns (uint256)'
        ];
        
        this.init();
    }
    
    async init() {
        console.log('Initializing XCAFE Dashboard...');
        
        // Check MetaMask
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            await this.connectWallet();
        } else {
            this.showError('MetaMask not found. Please install MetaMask.');
            return;
        }
        
        // Load initial data
        await this.loadUserData();
        await this.loadCreditPackages();
        await this.loadApiKeys();
        await this.loadTransactionHistory();
        
        // Load credits system after initialization
        setTimeout(() => {
            if (window.creditsManager) {
                window.creditsManager.loadTransactionHistory();
            }
        }, 1000);
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('Dashboard initialized successfully!');
    }
    
    async connectWallet() {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.userAddress = accounts[0];
            this.signer = this.provider.getSigner();
            
            // Initialize contracts
            this.usdtContract = new ethers.Contract(this.usdtAddress, this.usdtABI, this.signer);
            
            // Update UI
            document.getElementById('user-address').textContent = 
                this.userAddress.substring(0, 6) + '...' + this.userAddress.substring(38);
            
            this.updateConnectionStatus('success', 'Connected');
            
            console.log('Wallet connected:', this.userAddress);
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.updateConnectionStatus('error', 'Connection error');
        }
    }
    
    async loadUserData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.userAddress}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                document.getElementById('user-balance').textContent = userData.credits || 0;
                document.getElementById('last-update').textContent = new Date().toLocaleString();
            } else {
                // User not registered, create account
                await this.registerUser();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }
    
    async registerUser() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: this.userAddress
                })
            });
            
            if (response.ok) {
                console.log('Usuário registrado com sucesso');
                await this.loadUserData();
            }
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
        }
    }
    
    async loadCreditPackages() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/credits/packages`);
            const packages = await response.json();
            
            const container = document.getElementById('credit-packages');
            container.innerHTML = '';
            
            packages.forEach(pkg => {
                const packageCard = this.createPackageCard(pkg);
                container.appendChild(packageCard);
            });
        } catch (error) {
            console.error('Erro ao carregar pacotes:', error);
            // Fallback packages
            this.loadDefaultPackages();
        }
    }
    
    loadDefaultPackages() {
        const defaultPackages = [
            { id: 1, credits: 100, price: 10, popular: false },
            { id: 2, credits: 500, price: 45, popular: true },
            { id: 3, credits: 1000, price: 80, popular: false },
            { id: 4, credits: 5000, price: 350, popular: false }
        ];
        
        const container = document.getElementById('credit-packages');
        container.innerHTML = '';
        
        defaultPackages.forEach(pkg => {
            const packageCard = this.createPackageCard(pkg);
            container.appendChild(packageCard);
        });
    }
    
    createPackageCard(pkg) {
        const col = document.createElement('div');
        col.className = 'col-md-3 col-sm-6 mb-3';
        
        const savings = pkg.credits > 100 ? Math.round(((pkg.credits * 0.12) - pkg.price) / (pkg.credits * 0.12) * 100) : 0;
        
        col.innerHTML = `
            <div class="card credit-package h-100" data-package-id="${pkg.id}" onclick="selectPackage(${pkg.id}, ${pkg.credits}, ${pkg.price})">
                <div class="card-body text-center">
                    ${pkg.popular ? '<div class="badge bg-primary mb-2">Mais Popular</div>' : ''}
                    <h5 class="card-title text-primary">${pkg.credits}</h5>
                    <p class="card-text">créditos</p>
                    <h4 class="text-white">${pkg.price} USDT</h4>
                    ${savings > 0 ? `<small class="text-success">Economize ${savings}%</small>` : ''}
                    <p class="small text-muted mt-2">~ $${(pkg.price * 0.01).toFixed(4)} per credit</p>
                </div>
            </div>
        `;
        
        return col;
    }
    
    async loadApiKeys() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/api-keys`, {
                headers: {
                    'Authorization': `Bearer ${this.userAddress}`
                }
            });
            
            if (response.ok) {
                const apiKeys = await response.json();
                this.displayApiKeys(apiKeys);
            }
        } catch (error) {
            console.error('Erro ao carregar chaves API:', error);
        }
    }
    
    displayApiKeys(apiKeys) {
        const container = document.getElementById('api-keys-list');
        
        if (apiKeys.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma chave API criada ainda.</p>';
            return;
        }
        
        container.innerHTML = apiKeys.map(key => `
            <div class="row mb-3 p-3 border rounded">
                <div class="col-md-8">
                    <div class="api-key-display">
                        <strong>Key:</strong> ${key.key_hash.substring(0, 20)}...
                    </div>
                    <small class="text-muted">
                        Created: ${new Date(key.created_at).toLocaleString()}
                        | Uses: ${key.usage_count}
                        | Status: ${key.is_active ? 'Active' : 'Inactive'}
                    </small>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="copyApiKey('${key.key_hash}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="revokeApiKey('${key.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async loadTransactionHistory() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/transactions`, {
                headers: {
                    'Authorization': `Bearer ${this.userAddress}`
                }
            });
            
            if (response.ok) {
                const transactions = await response.json();
                this.displayTransactions(transactions);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    displayTransactions(transactions) {
        const tbody = document.getElementById('transaction-history');
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No transactions found</td></tr>';
            return;
        }
        
        tbody.innerHTML = transactions.map(tx => {
            const statusClass = tx.status === 'completed' ? 'success' : 
                              tx.status === 'pending' ? 'pending' : 'error';
            
            return `
                <tr>
                    <td>${new Date(tx.created_at).toLocaleDateString()}</td>
                    <td>${tx.type === 'credit_purchase' ? 'Purchase' : 'Usage'}</td>
                    <td>${tx.credits}</td>
                    <td>${tx.amount || '-'}</td>
                    <td>
                        <span class="status-indicator status-${statusClass}"></span>
                        ${tx.status}
                    </td>
                    <td>
                        ${tx.tx_hash ? 
                            `<a href="https://etherscan.io/tx/${tx.tx_hash}" target="_blank" class="text-primary">
                                ${tx.tx_hash.substring(0, 10)}...
                            </a>` : '-'
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    async buyCredits() {
        if (!this.selectedPackage) {
            this.showError('Select a credit package');
            return;
        }
        
        try {
            const button = document.getElementById('buy-credits-btn');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            
            // Convert USDT amount to wei (6 decimals for USDT)
            const amount = ethers.utils.parseUnits(this.selectedPackage.price.toString(), 6);
            
            // Get sale contract address from backend
            const contractResponse = await fetch(`${this.apiBaseUrl}/contracts/sale-address`);
            const { address: saleAddress } = await contractResponse.json();
            
            // Approve USDT spending
            console.log('Approving USDT spending...');
            const approveTx = await this.usdtContract.approve(saleAddress, amount);
            await approveTx.wait();
            
            // Create purchase record
            const purchaseResponse = await fetch(`${this.apiBaseUrl}/credits/purchase`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userAddress}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    package_id: this.selectedPackage.id,
                    credits: this.selectedPackage.credits,
                    amount: this.selectedPackage.price,
                    tx_hash: approveTx.hash
                })
            });
            
            if (purchaseResponse.ok) {
                this.showSuccess('Purchase completed successfully! Credits will be released after confirmation.');
                await this.loadUserData();
                await this.loadTransactionHistory();
            } else {
                throw new Error('Error processing purchase on backend');
            }
            
        } catch (error) {
            console.error('Purchase error:', error);
            this.showError('Error processing purchase: ' + error.message);
        } finally {
            const button = document.getElementById('buy-credits-btn');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-credit-card me-2"></i>Buy with MetaMask';
        }
    }
    
    async generateApiKey() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/api-keys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userAddress}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showSuccess('New API key created successfully!');
                await this.loadApiKeys();
            } else {
                throw new Error('Error creating API key');
            }
        } catch (error) {
            console.error('Error generating key:', error);
            this.showError('Error generating API key: ' + error.message);
        }
    }
    
    setupEventListeners() {
        // Buy credits button
        document.getElementById('buy-credits-btn').addEventListener('click', () => {
            this.buyCredits();
        });
        
        // Auto-refresh data every 30 seconds
        setInterval(() => {
            this.loadUserData();
        }, 30000);
    }
    
    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connection-status');
        statusElement.innerHTML = `
            <span class="status-indicator status-${status}"></span>
            <span>${text}</span>
        `;
    }
    
    showSuccess(message) {
        // Simple alert for now - can be enhanced with toast notifications
        alert('Success: ' + message);
    }
    
    showError(message) {
        // Simple alert for now - can be enhanced with toast notifications
        alert('Error: ' + message);
    }
}

// Global functions
function selectPackage(id, credits, price) {
    // Remove previous selection
    document.querySelectorAll('.credit-package').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked package
    document.querySelector(`[data-package-id="${id}"]`).classList.add('selected');
    
    // Update dashboard instance
    if (window.dashboard) {
        window.dashboard.selectedPackage = { id, credits, price };
        
        // Update summary
        document.getElementById('selected-credits').textContent = credits;
        document.getElementById('selected-price').textContent = price;
        document.getElementById('buy-credits-btn').disabled = false;
    }
}

function copyApiKey(keyHash) {
    navigator.clipboard.writeText(keyHash).then(() => {
        alert('Key copied to clipboard!');
    });
}

async function revokeApiKey(keyId) {
    if (confirm('Are you sure you want to revoke this API key?')) {
        try {
            const response = await fetch(`${window.dashboard.apiBaseUrl}/user/api-keys/${keyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${window.dashboard.userAddress}`
                }
            });
            
            if (response.ok) {
                alert('API key revoked successfully!');
                await window.dashboard.loadApiKeys();
            }
        } catch (error) {
            console.error('Error revoking key:', error);
            alert('Error revoking API key');
        }
    }
}

function generateApiKey() {
    if (window.dashboard) {
        window.dashboard.generateApiKey();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'index.html';
    }
}

// Initialize dashboard when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new XCAFEDashboard();
});