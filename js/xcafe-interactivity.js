/**
 * XCAFE - SISTEMA DE INTERATIVIDADE AVANÇADA
 * Sistema completo de animações, efeitos e funcionalidades interativas
 */

class XcafeInteractivity {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupCounterAnimations();
        this.setupHoverEffects();
        this.setupLoadingStates();
        this.setupFormValidation();
        this.setupTooltips();
        this.setupModalEffects();
        this.setupTypewriterEffect();
        this.setupProgressBars();
        this.setupLazyLoading();
        // Removido: this.setupParallaxEffects(); - efeito estava atrapalhando a visualização
    }

    // Animações no Scroll
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Animação staggered para filhos
                    if (entry.target.classList.contains('stagger-parent')) {
                        const children = entry.target.children;
                        Array.from(children).forEach((child, index) => {
                            setTimeout(() => {
                                child.classList.add('animate-in');
                            }, index * 100);
                        });
                    }
                }
            });
        }, observerOptions);

        // Observar elementos com classe animate-on-scroll
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        // Auto-adicionar classe aos elementos principais
        document.querySelectorAll('.feature-card, .tool-card, .roadmap-card, .stat-card').forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }

    // Efeitos Parallax - DESABILITADO (estava atrapalhando a visualização)
    /*
    setupParallaxEffects() {
        let ticking = false;

        const updateParallax = () => {
            const scrollTop = window.pageYOffset;

            // Parallax para hero
            const heroElement = document.querySelector('.hero-gradient');
            if (heroElement) {
                heroElement.style.transform = `translateY(${scrollTop * 0.5}px)`;
            }

            // Parallax para elementos específicos
            document.querySelectorAll('.parallax-element').forEach((el, index) => {
                const speed = 0.1 + (index * 0.05);
                el.style.transform = `translateY(${scrollTop * speed}px)`;
            });

            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick);
    }
    */

    // Animações de Contadores
    setupCounterAnimations() {
        const counters = document.querySelectorAll('[data-counter]');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.dataset.counter);
            const duration = parseInt(counter.dataset.duration) || 2000;
            const suffix = counter.dataset.suffix || '';
            const prefix = counter.dataset.prefix || '';
            
            let start = 0;
            const increment = target / (duration / 16);
            
            const updateCounter = () => {
                start += increment;
                if (start < target) {
                    counter.textContent = prefix + Math.floor(start).toLocaleString() + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = prefix + target.toLocaleString() + suffix;
                }
            };
            
            updateCounter();
        };

        // Observer para contadores
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    // Efeitos de Hover Avançados
    setupHoverEffects() {
        // Magnetic buttons
        document.querySelectorAll('.magnetic-button').forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0)';
            });
        });

        // Glow effect on cards
        document.querySelectorAll('.feature-card, .tool-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('glowing');
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('glowing');
            });
        });
    }

    // Estados de Loading
    setupLoadingStates() {
        const loadingSpinner = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="loading-text">Carregando<span class="dots-loading"></span></span>
            </div>
        `;

        // Aplicar loading em botões de ação
        document.querySelectorAll('[data-loading]').forEach(button => {
            button.addEventListener('click', (e) => {
                if (!button.classList.contains('loading')) {
                    const originalContent = button.innerHTML;
                    button.classList.add('loading');
                    button.disabled = true;
                    button.innerHTML = loadingSpinner;

                    // Simular carregamento (remover em produção)
                    setTimeout(() => {
                        button.classList.remove('loading');
                        button.disabled = false;
                        button.innerHTML = originalContent;
                    }, 2000);
                }
            });
        });
    }

    // Validação de Formulários
    setupFormValidation() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
                let isValid = true;

                inputs.forEach(input => {
                    if (!input.value.trim()) {
                        isValid = false;
                        input.classList.add('is-invalid');
                        this.showFieldError(input, 'Este campo é obrigatório');
                    } else {
                        input.classList.remove('is-invalid');
                        input.classList.add('is-valid');
                        this.hideFieldError(input);
                    }

                    // Validação de email
                    if (input.type === 'email' && input.value) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(input.value)) {
                            isValid = false;
                            input.classList.add('is-invalid');
                            this.showFieldError(input, 'Email inválido');
                        }
                    }
                });

                if (isValid) {
                    this.submitForm(form);
                }
            });
        });
    }

    showFieldError(field, message) {
        let errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    hideFieldError(field) {
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    submitForm(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Aqui você implementaria a lógica real de envio
        console.log('Form data:', data);
        
        // Feedback visual
        this.showNotification('Formulário enviado com sucesso!', 'success');
    }

    // Tooltips
    setupTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });

            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'xcafe-tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        setTimeout(() => tooltip.classList.add('show'), 10);
    }

    hideTooltip() {
        const tooltip = document.querySelector('.xcafe-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // Efeitos em Modals
    setupModalEffects() {
        document.addEventListener('show.bs.modal', (e) => {
            e.target.classList.add('animate-modal');
        });

        document.addEventListener('hide.bs.modal', (e) => {
            e.target.classList.remove('animate-modal');
        });
    }

    // Efeito Typewriter
    setupTypewriterEffect() {
        document.querySelectorAll('.typewriter').forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            
            let i = 0;
            const type = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, 100);
                }
            };
            
            // Iniciar quando elemento estiver visível
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        type();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(element);
        });
    }

    // Barras de Progresso Animadas
    setupProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar[data-progress]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const progress = bar.dataset.progress;
                    
                    setTimeout(() => {
                        bar.style.width = progress + '%';
                    }, 500);
                    
                    observer.unobserve(bar);
                }
            });
        });

        progressBars.forEach(bar => {
            bar.style.width = '0%';
            observer.observe(bar);
        });
    }

    // Lazy Loading para Imagens
    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Notificações
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `xcafe-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="bi bi-${this.getNotificationIcon(type)} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    // Utilitários
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// CSS adicional para os efeitos
const additionalCSS = `
    .xcafe-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 9999;
        opacity: 0;
        transform: translateY(5px);
        transition: all 0.3s ease;
        pointer-events: none;
    }

    .xcafe-tooltip.show {
        opacity: 1;
        transform: translateY(0);
    }

    .xcafe-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bs-dark);
        border: 1px solid var(--bs-border-color);
        border-radius: 8px;
        padding: 16px;
        z-index: 9999;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 400px;
    }

    .xcafe-notification.show {
        transform: translateX(0);
    }

    .xcafe-notification.success {
        border-color: var(--bs-success);
        background: rgba(16, 185, 129, 0.1);
    }

    .xcafe-notification.error {
        border-color: var(--bs-danger);
        background: rgba(239, 68, 68, 0.1);
    }

    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .animate-modal {
        animation: modalSlideIn 0.3s ease;
    }

    @keyframes modalSlideIn {
        from {
            transform: scale(0.7);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }

    .loading-text .dots-loading::after {
        content: '';
        animation: dots 1.5s steps(4, end) infinite;
    }

    @keyframes dots {
        0%, 20% { content: ''; }
        40% { content: '.'; }
        60% { content: '..'; }
        80%, 100% { content: '...'; }
    }
`;

// Injetar CSS
const styleElement = document.createElement('style');
styleElement.textContent = additionalCSS;
document.head.appendChild(styleElement);

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new XcafeInteractivity();
});

// Exportar para uso global
window.XcafeInteractivity = XcafeInteractivity;
