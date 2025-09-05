// Widget SaaS - Embeddable Widget
// Pure JavaScript widget that can be embedded in external websites

(function(window, document) {
    'use strict';
    
    // Widget configuration
    const WIDGET_CONFIG = {
        apiBaseUrl: 'https://api.yourdomain.com', // Change to your API URL
        version: '1.0.0',
        defaultTheme: 'light',
        defaultLanguage: 'pt-BR'
    };
    
    // Widget class
    class WidgetSaaS {
        constructor(options = {}) {
            this.options = {
                apiKey: options.apiKey || null,
                container: options.container || null,
                theme: options.theme || WIDGET_CONFIG.defaultTheme,
                language: options.language || WIDGET_CONFIG.defaultLanguage,
                responsive: options.responsive !== false,
                autoInit: options.autoInit !== false,
                debug: options.debug || false,
                ...options
            };
            
            this.container = null;
            this.isInitialized = false;
            this.isLoading = false;
            this.eventListeners = {};
            
            if (this.options.autoInit) {
                this.init();
            }
        }
        
        // Initialize widget
        init() {
            if (this.isInitialized) {
                this.log('Widget already initialized');
                return;
            }
            
            if (!this.options.apiKey) {
                this.error('API key is required');
                return;
            }
            
            this.setupContainer();
            this.loadStyles();
            this.render();
            this.bindEvents();
            
            this.isInitialized = true;
            this.emit('ready');
            
            this.log('Widget initialized successfully');
        }
        
        // Setup container
        setupContainer() {
            if (typeof this.options.container === 'string') {
                this.container = document.querySelector(this.options.container);
            } else if (this.options.container instanceof HTMLElement) {
                this.container = this.options.container;
            }
            
            if (!this.container) {
                throw new Error('Container not found');
            }
            
            this.container.classList.add('widget-saas-container');
            this.container.setAttribute('data-widget-version', WIDGET_CONFIG.version);
            this.container.setAttribute('data-widget-theme', this.options.theme);
        }
        
        // Load widget styles
        loadStyles() {
            if (document.getElementById('widget-saas-styles')) {
                return; // Styles already loaded
            }
            
            const styles = `
                .widget-saas-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 100%;
                    margin: 0 auto;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    background: #ffffff;
                    border: 1px solid #e1e5e9;
                }
                
                .widget-saas-container[data-widget-theme="dark"] {
                    background: #1a1a1a;
                    border-color: #333;
                    color: #ffffff;
                }
                
                .widget-header {
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .widget-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }
                
                .widget-content {
                    padding: 20px;
                }
                
                .widget-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .widget-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .widget-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .widget-saas-container[data-widget-theme="dark"] .widget-label {
                    color: #d1d5db;
                }
                
                .widget-input {
                    padding: 12px 16px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                
                .widget-input:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                }
                
                .widget-saas-container[data-widget-theme="dark"] .widget-input {
                    background: #374151;
                    border-color: #4b5563;
                    color: #ffffff;
                }
                
                .widget-button {
                    padding: 12px 24px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s, transform 0.1s;
                }
                
                .widget-button:hover {
                    background: #0056b3;
                    transform: translateY(-1px);
                }
                
                .widget-button:active {
                    transform: translateY(0);
                }
                
                .widget-button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .widget-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    color: #6c757d;
                }
                
                .widget-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e1e5e9;
                    border-top: 2px solid #007bff;
                    border-radius: 50%;
                    animation: widget-spin 1s linear infinite;
                    margin-right: 12px;
                }
                
                @keyframes widget-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .widget-result {
                    margin-top: 16px;
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border-left: 4px solid #28a745;
                }
                
                .widget-saas-container[data-widget-theme="dark"] .widget-result {
                    background: #374151;
                    border-left-color: #10b981;
                }
                
                .widget-error {
                    margin-top: 16px;
                    padding: 16px;
                    background: #f8d7da;
                    color: #721c24;
                    border-radius: 6px;
                    border-left: 4px solid #dc3545;
                }
                
                .widget-saas-container[data-widget-theme="dark"] .widget-error {
                    background: #7f1d1d;
                    color: #fecaca;
                    border-left-color: #ef4444;
                }
                
                .widget-footer {
                    padding: 12px 20px;
                    background: #f8f9fa;
                    border-top: 1px solid #e1e5e9;
                    font-size: 12px;
                    color: #6c757d;
                    text-align: center;
                }
                
                .widget-saas-container[data-widget-theme="dark"] .widget-footer {
                    background: #374151;
                    border-top-color: #4b5563;
                    color: #9ca3af;
                }
                
                @media (max-width: 768px) {
                    .widget-saas-container {
                        margin: 0;
                        border-radius: 0;
                        border-left: none;
                        border-right: none;
                    }
                    
                    .widget-content {
                        padding: 16px;
                    }
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.id = 'widget-saas-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
        
        // Render widget HTML
        render() {
            this.container.innerHTML = `
                <div class="widget-header">
                    <h3 class="widget-title">Widget SaaS</h3>
                    <div class="widget-version">v${WIDGET_CONFIG.version}</div>
                </div>
                <div class="widget-content">
                    <form class="widget-form" id="widget-form">
                        <div class="widget-input-group">
                            <label class="widget-label" for="widget-input">Digite sua mensagem:</label>
                            <textarea 
                                class="widget-input" 
                                id="widget-input" 
                                rows="4" 
                                placeholder="Digite aqui o texto que deseja processar..."
                                required
                            ></textarea>
                        </div>
                        <div class="widget-input-group">
                            <label class="widget-label" for="widget-action">Ação:</label>
                            <select class="widget-input" id="widget-action">
                                <option value="process">Processar</option>
                                <option value="analyze">Analisar</option>
                                <option value="generate">Gerar</option>
                            </select>
                        </div>
                        <button type="submit" class="widget-button" id="widget-submit">
                            Processar
                        </button>
                    </form>
                    <div id="widget-result-container"></div>
                </div>
                <div class="widget-footer">
                    Powered by Widget SaaS
                </div>
            `;
        }
        
        // Bind events
        bindEvents() {
            const form = this.container.querySelector('#widget-form');
            const submitButton = this.container.querySelector('#widget-submit');
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processRequest();
            });
            
            // Auto-resize textarea
            const textarea = this.container.querySelector('#widget-input');
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        }
        
        // Process widget request
        async processRequest() {
            if (this.isLoading) return;
            
            const input = this.container.querySelector('#widget-input').value.trim();
            const action = this.container.querySelector('#widget-action').value;
            const submitButton = this.container.querySelector('#widget-submit');
            const resultContainer = this.container.querySelector('#widget-result-container');
            
            if (!input) {
                this.showError('Por favor, digite uma mensagem.');
                return;
            }
            
            this.isLoading = true;
            submitButton.disabled = true;
            
            // Show loading state
            resultContainer.innerHTML = `
                <div class="widget-loading">
                    <div class="widget-spinner"></div>
                    Processando...
                </div>
            `;
            
            try {
                const response = await this.makeApiRequest('/api/widget/process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.options.apiKey
                    },
                    body: JSON.stringify({
                        action: action,
                        data: { input: input }
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Request failed');
                }
                
                const result = await response.json();
                this.showResult(result);
                this.emit('success', result);
                
            } catch (error) {
                this.showError(error.message);
                this.emit('error', error);
            } finally {
                this.isLoading = false;
                submitButton.disabled = false;
            }
        }
        
        // Make API request
        async makeApiRequest(endpoint, options = {}) {
            const url = WIDGET_CONFIG.apiBaseUrl + endpoint;
            
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            };
            
            return fetch(url, mergedOptions);
        }
        
        // Show result
        showResult(result) {
            const resultContainer = this.container.querySelector('#widget-result-container');
            
            let resultHtml = '';
            
            if (result.result) {
                if (typeof result.result === 'object') {
                    resultHtml = Object.entries(result.result)
                        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                        .join('<br>');
                } else {
                    resultHtml = result.result;
                }
            }
            
            resultContainer.innerHTML = `
                <div class="widget-result">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Resultado:</h4>
                    <div>${resultHtml}</div>
                    ${result.credits_used ? `<div style="margin-top: 12px; font-size: 12px; color: #6c757d;">Créditos utilizados: ${result.credits_used}</div>` : ''}
                    ${result.remaining_credits !== undefined ? `<div style="font-size: 12px; color: #6c757d;">Créditos restantes: ${result.remaining_credits}</div>` : ''}
                </div>
            `;
        }
        
        // Show error
        showError(message) {
            const resultContainer = this.container.querySelector('#widget-result-container');
            
            resultContainer.innerHTML = `
                <div class="widget-error">
                    <strong>Erro:</strong> ${message}
                </div>
            `;
        }
        
        // Event system
        on(event, callback) {
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            this.eventListeners[event].push(callback);
        }
        
        off(event, callback) {
            if (!this.eventListeners[event]) return;
            
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
        
        emit(event, data) {
            if (!this.eventListeners[event]) return;
            
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.error('Event callback error:', error);
                }
            });
        }
        
        // Update theme
        setTheme(theme) {
            this.options.theme = theme;
            if (this.container) {
                this.container.setAttribute('data-widget-theme', theme);
            }
        }
        
        // Update API key
        setApiKey(apiKey) {
            this.options.apiKey = apiKey;
        }
        
        // Destroy widget
        destroy() {
            if (this.container) {
                this.container.innerHTML = '';
                this.container.classList.remove('widget-saas-container');
                this.container.removeAttribute('data-widget-version');
                this.container.removeAttribute('data-widget-theme');
            }
            
            this.eventListeners = {};
            this.isInitialized = false;
            this.isLoading = false;
        }
        
        // Logging
        log(...args) {
            if (this.options.debug) {
                console.log('[Widget SaaS]', ...args);
            }
        }
        
        error(...args) {
            console.error('[Widget SaaS]', ...args);
        }
    }
    
    // Static initialization method
    WidgetSaaS.init = function(options) {
        return new WidgetSaaS(options);
    };
    
    // Auto-initialization from script tag attributes
    function autoInit() {
        const scripts = document.querySelectorAll('script[src*="widget.js"]');
        
        scripts.forEach(script => {
            const apiKey = script.getAttribute('data-api-key');
            const container = script.getAttribute('data-container');
            const theme = script.getAttribute('data-theme');
            
            if (apiKey && container) {
                new WidgetSaaS({
                    apiKey: apiKey,
                    container: container,
                    theme: theme || 'light'
                });
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
    
    // Export to global scope
    window.WidgetSaaS = WidgetSaaS;
    
})(window, document);

// Usage examples:
// 
// Method 1: Auto-initialization via script attributes
// <script src="widget.js" data-api-key="your-key" data-container="#widget" data-theme="light"></script>
//
// Method 2: Manual initialization
// const widget = new WidgetSaaS({
//     apiKey: 'your-api-key',
//     container: '#widget-container',
//     theme: 'light'
// });
//
// Method 3: Static initialization
// WidgetSaaS.init({
//     apiKey: 'your-api-key',
//     container: document.getElementById('widget')
// });