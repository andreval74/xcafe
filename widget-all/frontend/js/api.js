// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// API Helper Functions
class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Authentication APIs
    static async getNonce(address) {
        return this.request('/api/auth/nonce', {
            method: 'POST',
            body: JSON.stringify({ address })
        });
    }

    static async verifySignature(address, signature, nonce, chainId) {
        return this.request('/api/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ address, signature, nonce, chainId })
        });
    }

    static async getUserProfile() {
        return this.request('/api/user/profile');
    }

    // Credits APIs
    static async getUserCredits() {
        return this.request('/api/user/credits');
    }

    static async purchaseCredits(txHash, amount, packageId, chainId) {
        return this.request('/api/credits/purchase', {
            method: 'POST',
            body: JSON.stringify({ txHash, amount, packageId, chainId })
        });
    }

    static async getCreditPackages() {
        return this.request('/api/credits/packages');
    }

    // Transaction APIs
    static async getTransactions(limit = 10, offset = 0) {
        return this.request(`/api/transactions?limit=${limit}&offset=${offset}`);
    }

    static async getTransactionStatus(txHash) {
        return this.request(`/api/transactions/${txHash}`);
    }

    // API Keys APIs
    static async getApiKeys() {
        return this.request('/api/user/api-keys');
    }

    static async generateApiKey(name) {
        return this.request('/api/user/api-keys', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }

    static async deleteApiKey(keyId) {
        return this.request(`/api/user/api-keys/${keyId}`, {
            method: 'DELETE'
        });
    }

    // Statistics APIs
    static async getUserStats() {
        return this.request('/api/user/stats');
    }

    static async getRecentActivity() {
        return this.request('/api/user/activity');
    }

    // Widget APIs
    static async getWidgetConfig() {
        return this.request('/api/widget/config');
    }

    static async updateWidgetConfig(config) {
        return this.request('/api/widget/config', {
            method: 'PUT',
            body: JSON.stringify(config)
        });
    }

    // Admin APIs (if user has admin privileges)
    static async getAdminStats() {
        return this.request('/api/admin/stats');
    }

    static async getAllUsers(limit = 50, offset = 0) {
        return this.request(`/api/admin/users?limit=${limit}&offset=${offset}`);
    }

    static async getAllTransactions(limit = 50, offset = 0) {
        return this.request(`/api/admin/transactions?limit=${limit}&offset=${offset}`);
    }

    static async updateUserCredits(userId, credits) {
        return this.request(`/api/admin/users/${userId}/credits`, {
            method: 'PUT',
            body: JSON.stringify({ credits })
        });
    }

    // Utility function to check if user is authenticated
    static isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const timestamp = localStorage.getItem('authTimestamp');
        
        if (!token || !timestamp) {
            return false;
        }

        // Check if token is expired (24 hours)
        const now = Date.now();
        const authTime = parseInt(timestamp);
        const twentyFourHours = 24 * 60 * 60 * 1000;

        return (now - authTime) < twentyFourHours;
    }

    // Clear authentication data
    static clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authTimestamp');
        localStorage.removeItem('userAddress');
        localStorage.removeItem('chainId');
    }
}

// Export API class for global use
window.API = API;

// Backward compatibility - individual functions
window.apiRequest = API.request.bind(API);
window.getNonce = API.getNonce.bind(API);
window.verifySignature = API.verifySignature.bind(API);
window.getUserProfile = API.getUserProfile.bind(API);
window.getUserCredits = API.getUserCredits.bind(API);
window.purchaseCredits = API.purchaseCredits.bind(API);
window.getTransactions = API.getTransactions.bind(API);
window.getApiKeys = API.getApiKeys.bind(API);
window.generateApiKey = API.generateApiKey.bind(API);
window.deleteApiKey = API.deleteApiKey.bind(API);
window.getUserStats = API.getUserStats.bind(API);
window.getRecentActivity = API.getRecentActivity.bind(API);

console.log('API module loaded successfully');