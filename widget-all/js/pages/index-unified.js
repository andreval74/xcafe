/*
================================================================================
INDEX.JS - JavaScript Unificado para Landing Page Widget SaaS
================================================================================
Funcionalidades principais da página inicial com suporte completo Web3
Autor: XCafe Team
Data: Setembro 2025
================================================================================
*/

class IndexPage {
    constructor() {
        // Inicializar managers se disponíveis
        this.dataManager = window.DataManager ? new window.DataManager() : null;
        this.authManager = window.AuthManager && this.dataManager ? new window.AuthManager(this.dataManager) : null;
        this.web3Manager = window.Web3Manager ? new window.Web3Manager() : null;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('🚀 Inicializando Landing Page...');
            
            try {
                // Funcionalidades básicas sempre disponíveis
                this.createParticles();
                this.initWidgetDemo();
                this.initSmoothScroll();
                this.initStatsCounter();
                this.initGetStartedButton();
                this.setupScrollAnimations();
                
                // Funcionalidades Web3 se disponíveis
                if (this.web3Manager) {
                    await this.checkConnection();
                    this.setupWeb3EventListeners();
                }
                
                // Carregar estatísticas
                await this.loadStats();
                
                console.log('✅ Landing Page inicializada com sucesso');
            } catch (error) {
                console.error('❌ Erro ao inicializar Landing Page:', error);
            }
        });
    }

    // ========================================================================
    // FUNCIONALIDADES BÁSICAS (sempre disponíveis)
    // ========================================================================

    // Sistema de partículas para efeito visual
    createParticles() {
        const hero = document.querySelector('.hero-section');
        if (!hero) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                pointer-events: none;
            `;
            hero.appendChild(particle);
        }
    }

    // Interatividade do Widget Demo
    initWidgetDemo() {
        const quantityBtns = document.querySelectorAll('.quantity-btn');
        const totalDisplay = document.querySelector('.fs-4');
        
        if (!quantityBtns.length || !totalDisplay) return;

        quantityBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active de todos os botões
                quantityBtns.forEach(b => b.classList.remove('active'));
                
                // Adiciona active ao botão clicado
                e.target.classList.add('active');
                
                // Atualizar valor baseado na seleção
                const text = e.target.textContent;
                let newTotal = 'Total: R$ Custom';
                
                if (text.includes('10')) {
                    newTotal = 'Total: R$ 5,00';
                } else if (text.includes('100')) {
                    newTotal = 'Total: R$ 50,00';
                } else if (text.includes('1000')) {
                    newTotal = 'Total: R$ 500,00';
                }
                
                totalDisplay.textContent = newTotal;
                
                // Efeito visual
                totalDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    totalDisplay.style.transform = 'scale(1)';
                }, 200);
            });
        });
    }

    // Smooth scroll para navegação
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Animações de scroll
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);

        // Observar elementos que devem animar
        document.querySelectorAll('.feature-card, .step-card, .pricing-card').forEach(el => {
            observer.observe(el);
        });
    }

    // ========================================================================
    // CONTADORES E ESTATÍSTICAS
    // ========================================================================

    // Animação de contadores nas estatísticas
    initStatsCounter() {
        const statsNumbers = document.querySelectorAll('.stats-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statsNumbers.forEach(num => observer.observe(num));
    }

    // Animar contador individual (versão melhorada)
    animateCounter(element) {
        const finalText = element.textContent;
        const number = parseInt(finalText.replace(/\D/g, ''));
        
        if (isNaN(number)) return;
        
        element.textContent = '0';
        
        let current = 0;
        const increment = number / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= number) {
                element.textContent = finalText;
                clearInterval(timer);
            } else {
                let displayValue = Math.floor(current);
                if (finalText.includes('k')) {
                    displayValue = Math.floor(current / 1000) + 'k+';
                } else if (finalText.includes('M')) {
                    displayValue = Math.floor(current / 1000000) + 'M+';
                } else if (finalText.includes('$')) {
                    displayValue = '$' + displayValue.toLocaleString() + '+';
                } else {
                    displayValue = displayValue + '+';
                }
                element.textContent = displayValue;
            }
        }, 50);
    }

    // Carregar estatísticas (suporte API + fallback)
    async loadStats() {
        try {
            let stats = {};
            
            // Tentar carregar de API se DataManager disponível
            if (this.dataManager) {
                stats = await this.dataManager.getSystemStats();
            }
            
            // Fallback para valores padrão
            const defaultStats = {
                totalUsers: 1000,
                totalWidgets: 5000,
                totalTransactions: 50000,
                totalVolume: 2000000
            };
            
            stats = { ...defaultStats, ...stats };
            
            // Animar contadores por ID se existirem
            this.animateCounterById('total-users', stats.totalUsers);
            this.animateCounterById('total-widgets', stats.totalWidgets);
            this.animateCounterById('total-transactions', stats.totalTransactions);
            this.animateCounterById('total-volume', stats.totalVolume, '$', true);
            
        } catch (error) {
            console.warn('Erro ao carregar estatísticas:', error);
        }
    }

    // Animar contador por ID
    animateCounterById(elementId, endValue, prefix = '', currency = false) {
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
            } else if (endValue >= 1000) {
                displayValue = prefix + this.formatNumber(Math.floor(currentValue));
            } else {
                displayValue = prefix + Math.floor(currentValue);
            }
            
            element.textContent = displayValue + '+';
        }, 50);
    }

    // Formatar números grandes
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'k';
        }
        return num.toString();
    }

    // ========================================================================
    // FUNCIONALIDADES WEB3 (opcionais)
    // ========================================================================

    // Event listeners para Web3
    setupWeb3EventListeners() {
        // Botão de conectar MetaMask
        const connectBtn = document.getElementById('connect-metamask');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnect());
        }
    }

    // Verificar conexão Web3
    async checkConnection() {
        try {
            if (!this.web3Manager) return;
            
            const account = await this.web3Manager.getCurrentAccount();
            if (account) {
                this.updateConnectionUI(true, account);
            } else {
                this.updateConnectionUI(false);
            }
        } catch (error) {
            console.warn('Erro ao verificar conexão Web3:', error);
            this.updateConnectionUI(false);
        }
    }

    // Conectar carteira
    async handleConnect() {
        try {
            if (!this.web3Manager) {
                this.showError('Web3 não disponível. Instale MetaMask para continuar.');
                return;
            }
            
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

    // Atualizar UI de conexão
    updateConnectionUI(connected, account = null) {
        const statusDiv = document.getElementById('connection-status');
        const connectBtn = document.getElementById('connect-metamask');
        
        if (!statusDiv) return;

        if (connected && account) {
            // Conectado
            statusDiv.className = 'connection-indicator connected';
            statusDiv.innerHTML = `<i class="fas fa-check-circle me-1"></i>Conectado`;
            
            if (connectBtn) {
                connectBtn.textContent = `${account.substring(0, 6)}...${account.substring(38)}`;
                connectBtn.onclick = () => this.handleDisconnect();
            }
        } else {
            // Desconectado
            statusDiv.className = 'connection-indicator disconnected';
            statusDiv.innerHTML = '<i class="fas fa-times-circle me-1"></i>Desconectado';
            
            if (connectBtn) {
                connectBtn.textContent = 'Conectar';
                connectBtn.onclick = () => this.handleConnect();
            }
        }
    }

    // Desconectar carteira
    async handleDisconnect() {
        try {
            if (this.web3Manager && this.web3Manager.disconnect) {
                await this.web3Manager.disconnect();
            }
            this.updateConnectionUI(false);
            this.showSuccess('Carteira desconectada');
        } catch (error) {
            console.error('Erro ao desconectar:', error);
        }
    }

    // ========================================================================
    // BOTÕES E AÇÕES
    // ========================================================================

    // Botão "Começar Agora"
    initGetStartedButton() {
        const getStartedBtn = document.getElementById('get-started');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.handleGetStarted());
        }
    }

    // Ação do botão começar agora
    async handleGetStarted() {
        try {
            // Se Web3 disponível, verificar conexão
            if (this.web3Manager) {
                const isConnected = await this.web3Manager.isConnected();
                
                if (!isConnected) {
                    // Se não conectado, conectar primeiro
                    await this.handleConnect();
                    return;
                }
                
                // Redirecionar para dashboard se conectado
                window.location.href = 'dashboard.html';
            } else {
                // Fallback: scroll para seção de preços
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                    pricingSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } else {
                    // Último fallback: página de auth
                    window.location.href = 'auth.html';
                }
            }
        } catch (error) {
            console.error('Erro ao iniciar:', error);
            this.showError('Erro ao iniciar. Tente novamente.');
        }
    }

    // ========================================================================
    // MÉTODOS UTILITÁRIOS
    // ========================================================================

    // Método para adicionar efeitos de loading nos botões
    static addLoadingEffect(button, duration = 2000) {
        if (!button) return;
        
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Carregando...';
        button.disabled = true;
        button.classList.add('btn-loading');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('btn-loading');
        }, duration);
    }

    // Sistema de notificações toast
    showToast(message, type = 'info') {
        // Criar container se não existir
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 300px;
            `;
            document.body.appendChild(toastContainer);
        }

        // Mapear tipos
        const typeMap = {
            'success': 'success',
            'error': 'danger',
            'warning': 'warning',
            'info': 'info'
        };

        const toast = document.createElement('div');
        toast.className = `alert alert-${typeMap[type] || 'info'} alert-dismissible fade show`;
        toast.style.cssText = `
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease-out;
        `;
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getIconForType(type)} me-2"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        toastContainer.appendChild(toast);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 150);
            }
        }, 5000);
    }

    // Ícones para tipos de notificação
    getIconForType(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Métodos de conveniência para notificações
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showWarning(message) {
        this.showToast(message, 'warning');
    }

    showInfo(message) {
        this.showToast(message, 'info');
    }

    // Método para configurar demo do widget
    setupWidgetDemo() {
        const demoContainer = document.getElementById('widget-demo-container');
        if (demoContainer) {
            console.log('🎮 Demo widget configurado');
            // Widget será carregado automaticamente pelo script widget-sale.js
        }
    }

    // Método para obter informações do sistema
    getSystemInfo() {
        return {
            web3Available: !!this.web3Manager,
            authAvailable: !!this.authManager,
            dataAvailable: !!this.dataManager,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }
}

// ========================================================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ========================================================================

// Inicializar a página automaticamente
let indexPageInstance;
document.addEventListener('DOMContentLoaded', () => {
    indexPageInstance = new IndexPage();
});

// Exportar para uso global
window.IndexPage = IndexPage;

// Exportar instância para debugging
window.getIndexPageInstance = () => indexPageInstance;

// CSS adicional para animações de toast
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
}
