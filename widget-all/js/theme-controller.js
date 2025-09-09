/*
================================================================================
THEME CONTROLLER - CONTROLE AVANÇADO DE TEMAS
================================================================================
Sistema JavaScript para controle completo de temas e UX
================================================================================
*/

class ThemeController {
    constructor() {
        this.currentTheme = localStorage.getItem('xcafe-theme') || 'light';
        this.observers = [];
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeSelector();
        this.setupEventListeners();
        this.detectSystemTheme();
        
        // Notificar observadores
        this.notifyObservers(this.currentTheme);
        
        console.log('🎨 Theme Controller initialized:', this.currentTheme);
    }

    createThemeSelector() {
        // Verificar se já existe
        if (document.getElementById('theme-selector')) return;

        const selector = document.createElement('div');
        selector.id = 'theme-selector';
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <button type="button" class="btn theme-btn" data-theme="light" title="Tema Claro">
                <i class="fas fa-sun"></i>
            </button>
            <button type="button" class="btn theme-btn" data-theme="dark" title="Tema Escuro">
                <i class="fas fa-moon"></i>
            </button>
            <button type="button" class="btn theme-btn" data-theme="auto" title="Automático">
                <i class="fas fa-magic"></i>
            </button>
        `;

        document.body.appendChild(selector);
        this.updateThemeSelector();
    }

    setupEventListeners() {
        // Theme selector buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-btn')) {
                const theme = e.target.closest('.theme-btn').dataset.theme;
                this.setTheme(theme);
            }
        });

        // System theme change detection
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (this.currentTheme === 'auto') {
                this.detectSystemTheme();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('xcafe-theme', theme);
        this.applyTheme(theme);
        this.updateThemeSelector();
        this.notifyObservers(theme);
        
        // Show notification
        this.showNotification(`Tema alterado para: ${this.getThemeName(theme)}`, 'info');
        
        console.log('🎨 Theme changed to:', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Aplicar ao body também
        document.body.setAttribute('data-theme', theme);
        
        // Aplicar a componentes específicos
        const widgets = document.querySelectorAll('.widget-container, .token-widget');
        widgets.forEach(widget => {
            widget.setAttribute('data-theme', theme);
        });

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));
    }

    updateThemeSelector() {
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === this.currentTheme) {
                btn.classList.add('active');
            }
        });
    }

    detectSystemTheme() {
        if (this.currentTheme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const systemTheme = prefersDark ? 'dark' : 'light';
            this.applyTheme(systemTheme);
            
            console.log('🔍 System theme detected:', systemTheme);
        }
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    getThemeName(theme) {
        const names = {
            'light': 'Claro',
            'dark': 'Escuro',
            'auto': 'Automático'
        };
        return names[theme] || theme;
    }

    // Observer Pattern
    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    notifyObservers(theme) {
        this.observers.forEach(callback => {
            try {
                callback(theme);
            } catch (error) {
                console.error('Theme observer error:', error);
            }
        });
    }

    // Utility methods
    getCurrentTheme() {
        return this.currentTheme;
    }

    isCurrentTheme(theme) {
        return this.currentTheme === theme;
    }

    isDarkMode() {
        if (this.currentTheme === 'dark') return true;
        if (this.currentTheme === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    }

    showNotification(message, type = 'info') {
        // Remover notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getNotificationIcon(type)} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" aria-label="Close"></button>
            </div>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto hide
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Close button
        notification.querySelector('.btn-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

/*
================================================================================
LOADING MANAGER - GERENCIADOR DE ESTADOS DE CARREGAMENTO
================================================================================
*/

class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.createGlobalLoader();
    }

    createGlobalLoader() {
        if (document.getElementById('global-loader')) return;

        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="spinner-lg mb-3"></div>
                <h5 class="mb-2">Carregando...</h5>
                <p class="text-muted mb-0" id="loading-message">Processando solicitação</p>
            </div>
        `;

        document.body.appendChild(loader);
    }

    show(message = 'Carregando...', id = 'default') {
        this.activeLoaders.add(id);
        
        const loader = document.getElementById('global-loader');
        const messageEl = document.getElementById('loading-message');
        
        if (messageEl) messageEl.textContent = message;
        if (loader) loader.classList.add('active');

        console.log('⏳ Loading started:', id, message);
    }

    hide(id = 'default') {
        this.activeLoaders.delete(id);
        
        // Só esconder se não há outros loaders ativos
        if (this.activeLoaders.size === 0) {
            const loader = document.getElementById('global-loader');
            if (loader) loader.classList.remove('active');
            
            console.log('✅ Loading finished:', id);
        }
    }

    setButtonLoading(button, loading = true) {
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    showProgress(percentage, message = '') {
        let progressContainer = document.getElementById('progress-container');
        
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'progress-container';
            progressContainer.className = 'position-fixed top-0 start-0 w-100';
            progressContainer.style.zIndex = '9998';
            progressContainer.innerHTML = `
                <div class="progress-enhanced">
                    <div class="progress-bar-enhanced" style="width: 0%"></div>
                </div>
                <div class="text-center mt-2">
                    <small class="text-muted" id="progress-message"></small>
                </div>
            `;
            document.body.appendChild(progressContainer);
        }

        const progressBar = progressContainer.querySelector('.progress-bar-enhanced');
        const messageEl = progressContainer.querySelector('#progress-message');

        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (messageEl) messageEl.textContent = message;

        if (percentage >= 100) {
            setTimeout(() => {
                progressContainer.remove();
            }, 1000);
        }
    }
}

/*
================================================================================
UX ENHANCEMENTS - MELHORIAS DE EXPERIÊNCIA DO USUÁRIO
================================================================================
*/

class UXEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.addRippleEffects();
        this.setupSmoothScrolling();
        this.addKeyboardNavigation();
        this.setupFormValidation();
        this.addTooltips();
        
        console.log('✨ UX Enhancements initialized');
    }

    addRippleEffects() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn, .ripple');
            if (!button || button.classList.contains('disabled')) return;

            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    }

    setupSmoothScrolling() {
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

    addKeyboardNavigation() {
        // Tab navigation for custom elements
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusableElements = document.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }

            // ESC key for modals
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.show');
                if (activeModal) {
                    const closeBtn = activeModal.querySelector('[data-bs-dismiss="modal"]');
                    if (closeBtn) closeBtn.click();
                }
            }
        });
    }

    setupFormValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.validateField(e.target);
            }
        });
    }

    validateField(field) {
        const isValid = field.checkValidity();
        const feedbackEl = field.parentNode.querySelector('.invalid-feedback');

        field.classList.remove('is-valid', 'is-invalid');
        
        if (field.value.trim() !== '') {
            field.classList.add(isValid ? 'is-valid' : 'is-invalid');
        }

        if (feedbackEl && !isValid) {
            feedbackEl.textContent = field.validationMessage;
        }
    }

    addTooltips() {
        // Initialize Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1055';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        // Show toast
        if (typeof bootstrap !== 'undefined') {
            const bsToast = new bootstrap.Toast(toast, { delay: duration });
            bsToast.show();
        } else {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }
}

// CSS adicional para os efeitos
const additionalCSS = `
.ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

// Adicionar CSS ao documento
if (!document.getElementById('ux-enhancements-css')) {
    const style = document.createElement('style');
    style.id = 'ux-enhancements-css';
    style.textContent = additionalCSS;
    document.head.appendChild(style);
}

// Initialize on DOM content loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeController = new ThemeController();
        window.loadingManager = new LoadingManager();
        window.uxEnhancements = new UXEnhancements();
    });
} else {
    window.themeController = new ThemeController();
    window.loadingManager = new LoadingManager();
    window.uxEnhancements = new UXEnhancements();
}
