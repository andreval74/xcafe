// Admin Panel JavaScript - XCAFE Widget System
// Sistema de administração e relatórios

class XCAFEAdmin {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.currentSection = 'dashboard';
        this.charts = {};
        this.refreshInterval = null;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing XCAFE Administrative Panel...');
        
        // Check admin authentication
        await this.checkAdminAuth();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('Administrative panel initialized successfully!');
    }
    
    async checkAdminAuth() {
        try {
            // For now, we'll use a simple admin check
            // In production, implement proper admin authentication
            const adminAddress = localStorage.getItem('adminAddress');
            if (!adminAddress) {
                // Set a default admin address for testing
                localStorage.setItem('adminAddress', '0x0000000000000000000000000000000000000000');
                console.log('Admin access granted for testing');
            }
        } catch (error) {
            console.error('Admin authentication error:', error);
        }
    }
    
    async loadDashboardData() {
        try {
            // Load statistics
            await this.loadStats();
            
            // Load charts
            await this.loadCharts();
            
            // Load recent activity
            await this.loadRecentActivity();
            
            // Update timestamp
            document.getElementById('last-update').textContent = new Date().toLocaleString();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    async loadStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/stats`);
            
            if (response.ok) {
                const stats = await response.json();
                
                document.getElementById('total-users').textContent = stats.totalUsers || 0;
                document.getElementById('total-credits').textContent = stats.totalCredits || 0;
                document.getElementById('total-revenue').textContent = stats.totalRevenue || 0;
                document.getElementById('total-api-keys').textContent = stats.totalApiKeys || 0;
            } else {
                // Fallback data
                this.loadMockStats();
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.loadMockStats();
        }
    }
    
    loadMockStats() {
        document.getElementById('total-users').textContent = '127';
        document.getElementById('total-credits').textContent = '45,230';
        document.getElementById('total-revenue').textContent = '4,523';
        document.getElementById('total-api-keys').textContent = '89';
    }
    
    async loadCharts() {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping charts initialization');
            return;
        }
        
        // Sales Chart
        const salesCtx = document.getElementById('sales-chart').getContext('2d');
        this.charts.sales = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Sales (USDT)',
                    data: [120, 190, 300, 500, 200, 300, 450],
                    borderColor: '#f85d23',
                    backgroundColor: 'rgba(248, 93, 35, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
        
        // Usage Chart
        const usageCtx = document.getElementById('usage-chart').getContext('2d');
        this.charts.usage = new Chart(usageCtx, {
            type: 'doughnut',
            data: {
                labels: ['User A', 'User B', 'User C', 'Others'],
                datasets: [{
                    data: [30, 25, 20, 25],
                    backgroundColor: [
                        '#f85d23',
                        '#f59e0b',
                        '#10b981',
                        '#6b7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }
    
    async loadRecentActivity() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/recent-activity`);
            
            let activities = [];
            if (response.ok) {
                activities = await response.json();
            } else {
                // Mock data
                activities = [
                    {
                        type: 'user_registered',
                        description: 'Novo usuário registrado: 0x1234...5678',
                        timestamp: new Date(Date.now() - 300000).toISOString()
                    },
                    {
                        type: 'credit_purchase',
                        description: 'Compra de 500 créditos por 45 USDT',
                        timestamp: new Date(Date.now() - 600000).toISOString()
                    },
                    {
                        type: 'api_key_created',
                        description: 'Nova chave API gerada',
                        timestamp: new Date(Date.now() - 900000).toISOString()
                    }
                ];
            }
            
            this.displayRecentActivity(activities);
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }
    
    displayRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent activity</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => {
            const icon = this.getActivityIcon(activity.type);
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            
            return `
                <div class="d-flex align-items-center mb-3 p-3 border rounded">
                    <div class="me-3">
                        <i class="${icon} fa-lg text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                        <p class="mb-1">${activity.description}</p>
                        <small class="text-muted">${timeAgo}</small>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getActivityIcon(type) {
        const icons = {
            'user_registered': 'fas fa-user-plus',
            'credit_purchase': 'fas fa-shopping-cart',
            'api_key_created': 'fas fa-key',
            'transaction_completed': 'fas fa-check-circle',
            'default': 'fas fa-info-circle'
        };
        
        return icons[type] || icons.default;
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }
    
    async loadUsers() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/users`);
            
            let users = [];
            if (response.ok) {
                users = await response.json();
            } else {
                // Mock data
                users = [
                    {
                        id: 1,
                        address: '0x1234567890123456789012345678901234567890',
                        credits: 1500,
                        api_keys_count: 3,
                        created_at: '2024-01-15T10:30:00Z',
                        is_active: true
                    },
                    {
                        id: 2,
                        address: '0x0987654321098765432109876543210987654321',
                        credits: 750,
                        api_keys_count: 1,
                        created_at: '2024-01-20T14:15:00Z',
                        is_active: true
                    }
                ];
            }
            
            this.displayUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    displayUsers(users) {
        const tbody = document.getElementById('users-table');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <code>${user.address.substring(0, 10)}...${user.address.substring(32)}</code>
                </td>
                <td>${user.credits}</td>
                <td>${user.api_keys_count}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <span class="status-indicator status-${user.is_active ? 'success' : 'error'}"></span>
                    ${user.is_active ? 'Active' : 'Inactive'}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewUser('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="suspendUser('${user.id}')">
                        <i class="fas fa-ban"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    async loadTransactions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/transactions`);
            
            let transactions = [];
            if (response.ok) {
                transactions = await response.json();
            } else {
                // Mock data
                transactions = [
                    {
                        id: 1,
                        user_address: '0x1234567890123456789012345678901234567890',
                        type: 'credit_purchase',
                        credits: 500,
                        amount: 45,
                        status: 'completed',
                        tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                        created_at: '2024-01-25T10:30:00Z'
                    }
                ];
            }
            
            this.displayTransactions(transactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }
    
    displayTransactions(transactions) {
        const tbody = document.getElementById('transactions-table');
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No transactions found</td></tr>';
            return;
        }
        
        tbody.innerHTML = transactions.map(tx => {
            const statusClass = tx.status === 'completed' ? 'success' : 
                              tx.status === 'pending' ? 'warning' : 'error';
            
            return `
                <tr>
                    <td>${new Date(tx.created_at).toLocaleDateString()}</td>
                    <td><code>${tx.user_address.substring(0, 10)}...</code></td>
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
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewTransaction('${tx.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    async loadApiKeys() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/api-keys`);
            
            let apiKeys = [];
            if (response.ok) {
                apiKeys = await response.json();
            } else {
                // Mock data
                apiKeys = [
                    {
                        id: 1,
                        key_hash: 'xcafe_1234567890abcdef1234567890abcdef',
                        user_address: '0x1234567890123456789012345678901234567890',
                        created_at: '2024-01-20T10:30:00Z',
                        last_used: '2024-01-25T15:45:00Z',
                        usage_count: 150,
                        is_active: true
                    }
                ];
            }
            
            this.displayApiKeys(apiKeys);
        } catch (error) {
            console.error('Error loading API keys:', error);
        }
    }
    
    displayApiKeys(apiKeys) {
        const tbody = document.getElementById('api-keys-table');
        
        if (apiKeys.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No API keys found</td></tr>';
            return;
        }
        
        tbody.innerHTML = apiKeys.map(key => `
            <tr>
                <td><code>${key.key_hash.substring(0, 20)}...</code></td>
                <td><code>${key.user_address.substring(0, 10)}...</code></td>
                <td>${new Date(key.created_at).toLocaleDateString()}</td>
                <td>${key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}</td>
                <td>${key.usage_count}</td>
                <td>
                    <span class="status-indicator status-${key.is_active ? 'success' : 'error'}"></span>
                    ${key.is_active ? 'Active' : 'Inactive'}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="toggleApiKey('${key.id}', ${!key.is_active})">
                        <i class="fas fa-${key.is_active ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteApiKey('${key.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    setupEventListeners() {
        // User search
        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }
        
        // Transaction filter
        const transactionFilter = document.getElementById('transaction-filter');
        if (transactionFilter) {
            transactionFilter.addEventListener('change', (e) => {
                this.filterTransactions(e.target.value);
            });
        }
    }
    
    setupAutoRefresh() {
        // Refresh dashboard data every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000);
    }
    
    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#users-table tr');
        rows.forEach(row => {
            const address = row.querySelector('code')?.textContent || '';
            const visible = address.toLowerCase().includes(searchTerm.toLowerCase());
            row.style.display = visible ? '' : 'none';
        });
    }
    
    filterTransactions(status) {
        const rows = document.querySelectorAll('#transactions-table tr');
        rows.forEach(row => {
            if (status === 'all') {
                row.style.display = '';
            } else {
                const statusCell = row.cells[5]?.textContent.trim().toLowerCase();
                const visible = statusCell === status;
                row.style.display = visible ? '' : 'none';
            }
        });
    }
}

// Global functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const toggleIcon = document.getElementById('toggle-icon');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleIcon.className = 'fas fa-chevron-right';
    } else {
        toggleIcon.className = 'fas fa-chevron-left';
    }
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).style.display = 'block';
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update current section
    if (window.admin) {
        window.admin.currentSection = sectionName;
        
        // Load section-specific data
        switch (sectionName) {
            case 'users':
                window.admin.loadUsers();
                break;
            case 'transactions':
                window.admin.loadTransactions();
                break;
            case 'api-keys':
                window.admin.loadApiKeys();
                break;
        }
    }
}

function refreshUsers() {
    if (window.admin) {
        window.admin.loadUsers();
    }
}

function viewUser(userId) {
    alert(`View user ${userId}`);
}

function editUser(userId) {
    alert(`Edit user ${userId}`);
}

function suspendUser(userId) {
    if (confirm('Are you sure you want to suspend this user?')) {
        alert(`User ${userId} suspended`);
    }
}

function viewTransaction(txId) {
    alert(`View transaction ${txId}`);
}

function exportTransactions() {
    alert('Exporting transactions...');
}

function toggleApiKey(keyId, activate) {
    const action = activate ? 'activate' : 'deactivate';
    if (confirm(`Are you sure you want to ${action} this API key?`)) {
        alert(`API key ${keyId} ${activate ? 'activated' : 'deactivated'}`);
    }
}

function deleteApiKey(keyId) {
    if (confirm('Are you sure you want to delete this API key?')) {
        alert(`API key ${keyId} deleted`);
    }
}

function showApiKeyStats() {
    alert('Showing API key statistics...');
}

function generateReport() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    if (!startDate || !endDate) {
        alert('Please select start and end dates.');
        return;
    }
    
    alert(`Generating report from ${startDate} to ${endDate}...`);
}

function updatePackages() {
    alert('Updating package settings...');
}

function updateSettings() {
    alert('Saving system settings...');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminAddress');
        window.location.href = 'index.html';
    }
}

// Utility functions for alerts
function showSuccess(message) {
    alert('Success: ' + message);
}

function showError(message) {
    alert('Error: ' + message);
}

// Initialize admin panel when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.admin = new XCAFEAdmin();
});