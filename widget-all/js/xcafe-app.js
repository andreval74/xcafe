/*
================================================================================
XCAFE WIDGET SAAS - MAIN APPLICATION MODULE
================================================================================
Módulo principal que coordena todos os outros módulos do sistema
================================================================================
*/

class XCafeApp {
    constructor() {
        this.version = '2.0.0';
        this.modules = {};
        this.isInitialized = false;
        this.config = {
            apiBaseUrl: window.location.origin,
            debug: true,
            autoInit: true
        };
        
        this.init();
    }

    async init() {
        try {
            console.log(`🚀 XCafe Widget SaaS v${this.version} - Inicializando...`);
            
            // Carregar configuração
            await this.loadConfig();
            
            // Inicializar módulos core
            await this.initCoreModules();
            
            // Configurar event listeners globais
            this.setupGlobalEventListeners();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            console.log('✅ XCafe App inicializado com sucesso');
            
            // Emitir evento de inicialização
            this.emit('app:initialized', { version: this.version });
            
        } catch (error) {
            console.error('❌ Erro ao inicializar XCafe App:', error);
            this.emit('app:error', { error });
        }
    }

    async loadConfig() {
        // Carregar configuração do localStorage ou servidor
        const storedConfig = localStorage.getItem('xcafe_config');
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                this.config = { ...this.config, ...config };
            } catch (error) {
                console.warn('Configuração inválida no localStorage:', error);
            }
        }
    }

    async initCoreModules() {
        // Verificar se os módulos estão disponíveis
        const requiredModules = ['web3Manager', 'apiManager', 'authManager'];
        
        for (const moduleName of requiredModules) {
            if (window[moduleName]) {
                this.modules[moduleName] = window[moduleName];
                console.log(`✅ Módulo ${moduleName} carregado`);
            } else {
                console.warn(`⚠️ Módulo ${moduleName} não encontrado`);
            }
        }
    }

    setupGlobalEventListeners() {
        // Listener para mudanças de página
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Listener para mudanças de visibilidade
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.emit('app:hidden');
            } else {
                this.emit('app:visible');
            }
        });

        // Listener para mudanças de conexão
        window.addEventListener('online', () => {
            this.emit('app:online');
        });

        window.addEventListener('offline', () => {
            this.emit('app:offline');
        });

        // Listener para erros globais
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason);
        });
    }

    handleGlobalError(error) {
        console.error('❌ Erro global capturado:', error);
        
        // Log do erro
        this.logError(error);
        
        // Emitir evento
        this.emit('app:error', { error });
        
        // Mostrar notificação se possível
        if (this.modules.web3Manager) {
            this.modules.web3Manager.showError('Erro inesperado no sistema');
        }
    }

    logError(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: error.message || error.toString(),
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            version: this.version
        };

        // Salvar no localStorage para debug
        const logs = JSON.parse(localStorage.getItem('xcafe_error_logs') || '[]');
        logs.push(errorLog);
        
        // Manter apenas os últimos 50 logs
        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }
        
        localStorage.setItem('xcafe_error_logs', JSON.stringify(logs));
    }

    // ============================================================================
    // EVENT SYSTEM
    // ============================================================================

    emit(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                ...data,
                timestamp: Date.now(),
                source: 'XCafeApp'
            }
        });
        
        window.dispatchEvent(event);
        
        if (this.config.debug) {
            console.log(`📡 Event: ${eventName}`, data);
        }
    }

    on(eventName, callback) {
        window.addEventListener(eventName, callback);
    }

    off(eventName, callback) {
        window.removeEventListener(eventName, callback);
    }

    // ============================================================================
    // MODULE MANAGEMENT
    // ============================================================================

    getModule(name) {
        return this.modules[name];
    }

    hasModule(name) {
        return !!this.modules[name];
    }

    registerModule(name, module) {
        this.modules[name] = module;
        console.log(`✅ Módulo ${name} registrado`);
        this.emit('module:registered', { name, module });
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    showNotification(message, type = 'info', duration = 3000) {
        if (this.modules.web3Manager) {
            this.modules.web3Manager.showNotification(message, type);
        } else {
            // Fallback simples
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // ============================================================================
    // PAGE MANAGEMENT
    // ============================================================================

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page;
    }

    isPage(pageName) {
        return this.getCurrentPage() === pageName;
    }

    redirect(url, replace = false) {
        if (replace) {
            window.location.replace(url);
        } else {
            window.location.href = url;
        }
    }

    // ============================================================================
    // AUTH HELPERS
    // ============================================================================

    requireAuth() {
        if (this.modules.authManager) {
            return this.modules.authManager.requireAuth();
        }
        console.warn('AuthManager não disponível');
        return false;
    }

    requireAdmin() {
        if (this.modules.authManager) {
            return this.modules.authManager.requireAdmin();
        }
        console.warn('AuthManager não disponível');
        return false;
    }

    isAuthenticated() {
        if (this.modules.authManager) {
            return this.modules.authManager.isAuthenticated;
        }
        return false;
    }

    getCurrentUser() {
        if (this.modules.authManager) {
            return this.modules.authManager.getUser();
        }
        return null;
    }

    // ============================================================================
    // API HELPERS
    // ============================================================================

    async api(endpoint, options = {}) {
        if (this.modules.apiManager) {
            const method = options.method || 'GET';
            const data = options.data;
            
            switch (method.toLowerCase()) {
                case 'get':
                    return this.modules.apiManager.get(endpoint);
                case 'post':
                    return this.modules.apiManager.post(endpoint, data);
                case 'put':
                    return this.modules.apiManager.put(endpoint, data);
                case 'delete':
                    return this.modules.apiManager.delete(endpoint);
                default:
                    throw new Error(`Método ${method} não suportado`);
            }
        }
        throw new Error('APIManager não disponível');
    }

    // ============================================================================
    // WEB3 HELPERS
    // ============================================================================

    async connectWallet() {
        if (this.modules.web3Manager) {
            return this.modules.web3Manager.connectWallet();
        }
        throw new Error('Web3Manager não disponível');
    }

    isWalletConnected() {
        if (this.modules.web3Manager) {
            return this.modules.web3Manager.isConnected;
        }
        return false;
    }

    getWalletAddress() {
        if (this.modules.web3Manager) {
            return this.modules.web3Manager.account;
        }
        return null;
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    cleanup() {
        console.log('🧹 Limpando XCafe App...');
        
        // Limpar timers, listeners, etc.
        this.emit('app:cleanup');
        
        // Salvar estado se necessário
        this.saveState();
    }

    saveState() {
        const state = {
            version: this.version,
            timestamp: Date.now(),
            config: this.config
        };
        
        localStorage.setItem('xcafe_app_state', JSON.stringify(state));
    }

    // ============================================================================
    // DEBUG HELPERS
    // ============================================================================

    getDebugInfo() {
        return {
            version: this.version,
            isInitialized: this.isInitialized,
            modules: Object.keys(this.modules),
            config: this.config,
            page: this.getCurrentPage(),
            timestamp: new Date().toISOString()
        };
    }

    exportLogs() {
        const logs = localStorage.getItem('xcafe_error_logs');
        if (logs) {
            const blob = new Blob([logs], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `xcafe-logs-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
}

// ============================================================================
// GLOBAL INITIALIZATION
// ============================================================================

// Criar instância global
window.XCafe = new XCafeApp();

// Funções globais de conveniência
window.xcafe = {
    // Core
    app: window.XCafe,
    version: window.XCafe.version,
    
    // Auth
    login: () => window.XCafe.modules.authManager?.authenticateWithWallet(),
    logout: () => window.XCafe.modules.authManager?.logout(),
    isLoggedIn: () => window.XCafe.isAuthenticated(),
    user: () => window.XCafe.getCurrentUser(),
    
    // Web3
    connect: () => window.XCafe.connectWallet(),
    isConnected: () => window.XCafe.isWalletConnected(),
    address: () => window.XCafe.getWalletAddress(),
    
    // API
    api: (endpoint, options) => window.XCafe.api(endpoint, options),
    
    // Utils
    notify: (message, type) => window.XCafe.showNotification(message, type),
    redirect: (url, replace) => window.XCafe.redirect(url, replace),
    debug: () => window.XCafe.getDebugInfo(),
    
    // Pages
    requireAuth: () => window.XCafe.requireAuth(),
    requireAdmin: () => window.XCafe.requireAdmin()
};

// Disponibilizar no console para debug
if (window.XCafe.config.debug) {
    window.XCafeDebug = {
        app: window.XCafe,
        logs: () => JSON.parse(localStorage.getItem('xcafe_error_logs') || '[]'),
        exportLogs: () => window.XCafe.exportLogs(),
        clearLogs: () => localStorage.removeItem('xcafe_error_logs'),
        config: window.XCafe.config
    };
    
    console.log('🔧 Debug mode ativo. Use XCafeDebug no console.');
}

console.log('📦 XCafe Main Module carregado');
