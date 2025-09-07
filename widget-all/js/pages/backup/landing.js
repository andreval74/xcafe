/**
 * LANDING PAGE CONTROLLER
 * Controla toda a funcionalidade da página principal do Widget SaaS
 */

class LandingPage {
    constructor() {
        this.dataManager = new DataManager();
        this.authManager = new AuthManager(this.dataManager);
        this.web3Manager = new Web3Manager();
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Inicializando Landing Page...');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Verificar se MetaMask já está conectado
            await this.checkConnection();
            
            // Carregar estatísticas
            await this.loadStats();
            
            // Configurar demo do widget
            this.setupWidgetDemo();
            
            console.log('✅ Landing Page inicializada');
        } catch (error) {
            console.error('❌ Erro ao inicializar Landing Page:', error);
        }
    }

    setupEventListeners() {
        // Botão de conectar MetaMask
        const connectBtn = document.getElementById('connect-metamask');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnect());
        }

        // Botão Get Started
        const getStartedBtn = document.getElementById('get-started');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.handleGetStarted());
        }

        // Outros event listeners podem ser adicionados aqui
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        // Intersection Observer para animações de scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observar elementos que devem animar
        document.querySelectorAll('.feature-card, .step-card, .pricing-card').forEach(el => {
            observer.observe(el);
        });
    }

    async handleConnect() {
        try {
            const account = await this.web3Manager.connectWallet();
            if (account) {
                this.updateConnectionUI(true, account);
                this.showSuccess('Carteira conectada com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao conectar carteira:', error);
            this.showError('Erro ao conectar carteira: ' + error.message);
        }
    }

    async handleGetStarted() {
        try {
            // Verificar se está conectado
            const isConnected = await this.web3Manager.isConnected();
            
            if (!isConnected) {
                // Se não conectado, conectar primeiro
                await this.handleConnect();
            }
            
            // Redirecionar para dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Erro ao iniciar:', error);
            this.showError('Erro ao iniciar: ' + error.message);
        }
    }

    async checkConnection() {
        try {
            const account = await this.web3Manager.getCurrentAccount();
            if (account) {
                this.updateConnectionUI(true, account);
            } else {
                this.updateConnectionUI(false);
            }
        } catch (error) {
            console.warn('Erro ao verificar conexão:', error);
            this.updateConnectionUI(false);
        }
    }

    updateConnectionUI(connected, account = null) {
        const statusDiv = document.getElementById('connection-status');
        const connectBtn = document.getElementById('connect-metamask');
        
        if (!statusDiv || !connectBtn) return;

        if (connected && account) {
            // Conectado
            statusDiv.className = 'connection-indicator connected';
            statusDiv.innerHTML = `<i class="fas fa-check-circle me-1"></i>Conectado`;
            
            connectBtn.textContent = `${account.substring(0, 6)}...${account.substring(38)}`;
            connectBtn.onclick = () => this.handleDisconnect();
        } else {
            // Desconectado
            statusDiv.className = 'connection-indicator disconnected';
            statusDiv.innerHTML = '<i class="fas fa-times-circle me-1"></i>Desconectado';
            
            connectBtn.textContent = 'Conectar';
            connectBtn.onclick = () => this.handleConnect();
        }
    }

    async loadStats() {
        try {
            // Simular estatísticas (em produção viria de API)
            const stats = await this.dataManager.getSystemStats();
            
            this.animateCounter('total-users', stats.totalUsers || 127);
            this.animateCounter('total-widgets', stats.totalTransactions || 89);
            this.animateCounter('total-transactions', (stats.totalTransactions || 89) * 15);
            this.animateCounter('total-volume', 45230, '$', true);
            
        } catch (error) {
            console.warn('Erro ao carregar estatísticas:', error);
        }
    }

    animateCounter(elementId, endValue, prefix = '', currency = false) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let currentValue = 0;
        const increment = endValue / 50;
        const timer = setInterval(() => {
            currentValue += increment;
            
            if (currentValue >= endValue) {
                currentValue = endValue;
                clearInterval(timer);
            }
            
            let displayValue;
            if (currency) {
                displayValue = prefix + Math.floor(currentValue).toLocaleString();
            } else {
                displayValue = prefix + Math.floor(currentValue);
            }
            
            element.textContent = displayValue;
        }, 50);
    }

    setupWidgetDemo() {
        // Simular dados de demo para o widget
        const demoContainer = document.getElementById('widget-demo-container');
        if (demoContainer) {
            // Widget será carregado automaticamente pelo script
            console.log('Demo widget configurado');
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type) {
        // Criar toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Exportar para uso global
window.LandingPage = LandingPage;
