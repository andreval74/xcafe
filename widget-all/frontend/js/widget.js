// Widget Incorporável JavaScript
// Este arquivo será usado pelos clientes para incorporar o widget em seus sites

(function() {
    'use strict';
    
    // Widget configuration
    const WIDGET_CONFIG = {
        apiBaseUrl: window.WIDGET_API_URL || 'http://localhost:3001',
        version: '1.0.0',
        defaultStyles: true,
        autoInit: true
    };
    
    // Widget class
    class WidgetSaaS {
        constructor(options = {}) {
            this.options = {
                apiKey: options.apiKey || '',
                containerId: options.containerId || 'widget-saas-container',
                theme: options.theme || 'light',
                language: options.language || 'pt-BR',
                features: options.features || ['search', 'display', 'interaction'],
                customStyles: options.customStyles || {},
                onLoad: options.onLoad || null,
                onError: options.onError || null,
                onInteraction: options.onInteraction || null,
                ...options
            };
            
            this.container = null;
            this.isLoaded = false;
            this.credits = 0;
            this.apiCallCount = 0;
            
            if (this.options.autoInit !== false) {
                this.init();
            }
        }
        
        // Initialize widget
        async init() {
            try {
                // Validate API key
                if (!this.options.apiKey) {
                    throw new Error('API Key is required');
                }
                
                // Find or create container
                this.container = document.getElementById(this.options.containerId);
                if (!this.container) {
                    this.container = document.createElement('div');
                    this.container.id = this.options.containerId;
                    document.body.appendChild(this.container);
                }
                
                // Validate API key with backend
                const validation = await this.validateApiKey();
                if (!validation.valid) {
                    throw new Error('Invalid API Key: ' + validation.error);
                }
                
                this.credits = validation.credits;
                
                // Load widget styles
                if (WIDGET_CONFIG.defaultStyles) {
                    this.loadStyles();
                }
                
                // Render widget
                this.render();
                
                // Mark as loaded
                this.isLoaded = true;
                
                // Call onLoad callback
                if (typeof this.options.onLoad === 'function') {
                    this.options.onLoad(this);
                }
                
                console.log('SaaS Widget loaded successfully');
                
            } catch (error) {
                console.error('Error initializing widget:', error);
                this.handleError(error);
            }
        }
        
        // Validate API key with backend
        async validateApiKey() {
            try {
                const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/api/widget/validate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.options.apiKey
                    },
                    body: JSON.stringify({
                        domain: window.location.hostname,
                        url: window.location.href
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    return {
                        valid: false,
                        error: data.error || 'Validation error'
                    };
                }
                
                return {
                    valid: true,
                    credits: data.credits || 0,
                    user: data.user || {}
                };
                
            } catch (error) {
                return {
                    valid: false,
                    error: 'Server connection error'
                };
            }
        }
        
        // Load widget styles
        loadStyles() {
            const styleId = 'widget-saas-styles';
            
            // Check if styles already loaded
            if (document.getElementById(styleId)) {
                return;
            }
            
            const styles = `
                .widget-saas-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    border: 1px solid #e1e5e9;
                    border-radius: 8px;
                    padding: 20px;
                    background: ${this.options.theme === 'dark' ? '#2d3748' : '#ffffff'};
                    color: ${this.options.theme === 'dark' ? '#ffffff' : '#2d3748'};
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 400px;
                    margin: 10px;
                }
                
                .widget-saas-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid ${this.options.theme === 'dark' ? '#4a5568' : '#e1e5e9'};
                }
                
                .widget-saas-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }
                
                .widget-saas-credits {
                    font-size: 12px;
                    color: ${this.options.theme === 'dark' ? '#a0aec0' : '#718096'};
                    background: ${this.options.theme === 'dark' ? '#4a5568' : '#f7fafc'};
                    padding: 4px 8px;
                    border-radius: 12px;
                }
                
                .widget-saas-content {
                    min-height: 100px;
                }
                
                .widget-saas-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid ${this.options.theme === 'dark' ? '#4a5568' : '#e1e5e9'};
                    border-radius: 6px;
                    background: ${this.options.theme === 'dark' ? '#4a5568' : '#ffffff'};
                    color: ${this.options.theme === 'dark' ? '#ffffff' : '#2d3748'};
                    font-size: 14px;
                    margin-bottom: 10px;
                    box-sizing: border-box;
                }
                
                .widget-saas-button {
                    background: #3182ce;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                
                .widget-saas-button:hover {
                    background: #2c5aa0;
                }
                
                .widget-saas-button:disabled {
                    background: #a0aec0;
                    cursor: not-allowed;
                }
                
                .widget-saas-result {
                    margin-top: 15px;
                    padding: 10px;
                    background: ${this.options.theme === 'dark' ? '#4a5568' : '#f7fafc'};
                    border-radius: 6px;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .widget-saas-error {
                    color: #e53e3e;
                    background: #fed7d7;
                    border: 1px solid #feb2b2;
                }
                
                .widget-saas-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .widget-saas-spinner {
                    border: 2px solid #e1e5e9;
                    border-top: 2px solid #3182ce;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    animation: widget-spin 1s linear infinite;
                }
                
                @keyframes widget-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .widget-saas-footer {
                    margin-top: 15px;
                    padding-top: 10px;
                    border-top: 1px solid ${this.options.theme === 'dark' ? '#4a5568' : '#e1e5e9'};
                    font-size: 11px;
                    color: ${this.options.theme === 'dark' ? '#a0aec0' : '#718096'};
                    text-align: center;
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.id = styleId;
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
        
        // Render widget HTML
        render() {
            const html = `
                <div class="widget-saas-container">
                    <div class="widget-saas-header">
                        <h3 class="widget-saas-title">Widget SaaS</h3>
                        <span class="widget-saas-credits">${this.credits} credits</span>
                    </div>
                    
                    <div class="widget-saas-content">
                        <input 
                            type="text" 
                            class="widget-saas-input" 
                            placeholder="Enter your query..."
                            id="widget-input-${this.options.containerId}"
                        >
                        <button 
                            class="widget-saas-button" 
                            onclick="window.widgetInstance_${this.options.containerId}.processQuery()"
                            id="widget-button-${this.options.containerId}"
                        >
                            Process
                        </button>
                        
                        <div id="widget-result-${this.options.containerId}" class="widget-saas-result" style="display: none;"></div>
                    </div>
                    
                    <div class="widget-saas-footer">
                        Powered by Widget SaaS v${WIDGET_CONFIG.version}
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            
            // Store instance globally for button onclick
            window[`widgetInstance_${this.options.containerId}`] = this;
            
            // Add enter key listener
            const input = document.getElementById(`widget-input-${this.options.containerId}`);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.processQuery();
                    }
                });
            }
        }
        
        // Process user query
        async processQuery() {
            const input = document.getElementById(`widget-input-${this.options.containerId}`);
            const button = document.getElementById(`widget-button-${this.options.containerId}`);
            const result = document.getElementById(`widget-result-${this.options.containerId}`);
            
            if (!input || !input.value.trim()) {
                this.showError('Please enter a query');
                return;
            }
            
            const query = input.value.trim();
            
            try {
                // Show loading
                this.showLoading(true);
                button.disabled = true;
                
                // Make API call
                const response = await this.makeApiCall(query);
                
                if (response.success) {
                    // Update credits
                    this.credits = response.remainingCredits;
                    this.updateCreditsDisplay();
                    
                    // Show result
                    this.showResult(response.data);
                    
                    // Call interaction callback
                    if (typeof this.options.onInteraction === 'function') {
                        this.options.onInteraction({
                            type: 'query',
                            query: query,
                            result: response.data,
                            creditsUsed: 1,
                            remainingCredits: this.credits
                        });
                    }
                    
                } else {
                    this.showError(response.error || 'Error processing query');
                }
                
            } catch (error) {
                console.error('Query error:', error);
                this.showError('Connection error. Please try again.');
            } finally {
                this.showLoading(false);
                button.disabled = false;
            }
        }
        
        // Make API call to backend
        async makeApiCall(query) {
            try {
                const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/api/widget/query`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.options.apiKey
                    },
                    body: JSON.stringify({
                        query: query,
                        domain: window.location.hostname,
                        url: window.location.href,
                        features: this.options.features
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    return {
                        success: false,
                        error: data.error || 'API error'
                    };
                }
                
                this.apiCallCount++;
                
                return {
                    success: true,
                    data: data.result,
                    remainingCredits: data.remainingCredits
                };
                
            } catch (error) {
                return {
                    success: false,
                    error: 'Connection error'
                };
            }
        }
        
        // Show loading state
        showLoading(show) {
            const result = document.getElementById(`widget-result-${this.options.containerId}`);
            if (!result) return;
            
            if (show) {
                result.innerHTML = '<div class="widget-saas-loading"><div class="widget-saas-spinner"></div></div>';
                result.style.display = 'block';
            } else {
                if (result.innerHTML.includes('widget-saas-loading')) {
                    result.style.display = 'none';
                }
            }
        }
        
        // Show result
        showResult(data) {
            const result = document.getElementById(`widget-result-${this.options.containerId}`);
            if (!result) return;
            
            result.className = 'widget-saas-result';
            result.innerHTML = this.formatResult(data);
            result.style.display = 'block';
        }
        
        // Show error
        showError(message) {
            const result = document.getElementById(`widget-result-${this.options.containerId}`);
            if (!result) return;
            
            result.className = 'widget-saas-result widget-saas-error';
            result.innerHTML = message;
            result.style.display = 'block';
            
            // Call error callback
            if (typeof this.options.onError === 'function') {
                this.options.onError(message);
            }
        }
        
        // Format result for display
        formatResult(data) {
            if (typeof data === 'string') {
                return data;
            }
            
            if (typeof data === 'object') {
                if (data.text) {
                    return data.text;
                }
                
                if (data.html) {
                    return data.html;
                }
                
                return JSON.stringify(data, null, 2);
            }
            
            return String(data);
        }
        
        // Update credits display
        updateCreditsDisplay() {
            const creditsElement = this.container.querySelector('.widget-saas-credits');
            if (creditsElement) {
                creditsElement.textContent = `${this.credits} credits`;
            }
        }
        
        // Handle errors
        handleError(error) {
            console.error('Widget Error:', error);
            
            if (this.container) {
                this.container.innerHTML = `
                    <div class="widget-saas-container">
                        <div class="widget-saas-error">
                            <strong>Widget Error:</strong><br>
                            ${error.message}
                        </div>
                    </div>
                `;
            }
            
            if (typeof this.options.onError === 'function') {
                this.options.onError(error.message);
            }
        }
        
        // Public methods
        
        // Reload widget
        reload() {
            this.isLoaded = false;
            this.init();
        }
        
        // Update API key
        updateApiKey(newApiKey) {
            this.options.apiKey = newApiKey;
            this.reload();
        }
        
        // Get widget stats
        getStats() {
            return {
                isLoaded: this.isLoaded,
                credits: this.credits,
                apiCallCount: this.apiCallCount,
                version: WIDGET_CONFIG.version
            };
        }
        
        // Destroy widget
        destroy() {
            if (this.container) {
                this.container.innerHTML = '';
            }
            
            // Remove global instance
            delete window[`widgetInstance_${this.options.containerId}`];
            
            this.isLoaded = false;
        }
    }
    
    // Auto-initialize if script has data attributes
    document.addEventListener('DOMContentLoaded', function() {
        const scripts = document.querySelectorAll('script[data-widget-api-key]');
        
        scripts.forEach((script, index) => {
            const apiKey = script.getAttribute('data-widget-api-key');
            const containerId = script.getAttribute('data-widget-container') || `widget-saas-auto-${index}`;
            const theme = script.getAttribute('data-widget-theme') || 'light';
            
            if (apiKey) {
                // Create container if it doesn't exist
                let container = document.getElementById(containerId);
                if (!container) {
                    container = document.createElement('div');
                    container.id = containerId;
                    script.parentNode.insertBefore(container, script.nextSibling);
                }
                
                // Initialize widget
                new WidgetSaaS({
                    apiKey: apiKey,
                    containerId: containerId,
                    theme: theme
                });
            }
        });
    });
    
    // Export to global scope
    window.WidgetSaaS = WidgetSaaS;
    
    // AMD/CommonJS compatibility
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return WidgetSaaS;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = WidgetSaaS;
    }
    
})();

// Usage examples:
// 
// 1. Auto-initialization via script tag:
// <script src="widget.js" data-widget-api-key="your-api-key" data-widget-theme="light"></script>
// 
// 2. Manual initialization:
// const widget = new WidgetSaaS({
//     apiKey: 'your-api-key',
//     containerId: 'my-widget',
//     theme: 'dark',
//     onLoad: function(widget) {
//         console.log('Widget loaded:', widget.getStats());
//     },
//     onError: function(error) {
//         console.error('Widget error:', error);
//     }
// });
//
// 3. Multiple widgets:
// const widget1 = new WidgetSaaS({ apiKey: 'key1', containerId: 'widget1' });
// const widget2 = new WidgetSaaS({ apiKey: 'key2', containerId: 'widget2' });