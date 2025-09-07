/*
================================================================================
INDEX.JS - JavaScript para Landing Page Widget SaaS
================================================================================
Funcionalidades principais da página inicial
================================================================================
*/

class IndexPage {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.createParticles();
            this.initWidgetDemo();
            this.initSmoothScroll();
            this.initStatsCounter();
            this.initGetStartedButton();
        });
    }

    // Sistema de partículas para efeito visual
    createParticles() {
        // Implementação simples de partículas - pode ser expandida
        const hero = document.querySelector('.hero-section');
        if (!hero) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
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

    // Animar contador individual
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
                } else {
                    displayValue = displayValue + '+';
                }
                element.textContent = displayValue;
            }
        }, 50);
    }

    // Botão "Começar Agora"
    initGetStartedButton() {
        const getStartedBtn = document.getElementById('get-started');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                // Scroll para a seção de preços ou abrir modal de registro
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                    pricingSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } else {
                    // Fallback: redirecionar para página de registro
                    window.location.href = 'auth.html';
                }
            });
        }
    }

    // Método para adicionar efeitos de loading nos botões
    static addLoadingEffect(button, duration = 2000) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Carregando...';
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, duration);
    }

    // Método para mostrar notificações toast
    static showToast(message, type = 'info') {
        // Criar elemento toast se não existir
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show`;
        toast.style.cssText = `
            margin-bottom: 10px;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        toastContainer.appendChild(toast);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
}

// Inicializar a página
new IndexPage();

// Exportar para uso global se necessário
window.IndexPage = IndexPage;
