/**
 * 🔝 BACK TO TOP BUTTON
 * 
 * Controla o botão discreto de voltar ao topo da página
 * - Aparece quando o usuário rola para baixo
 * - Scroll suave ao clicar
 * - Animações discretas e profissionais
 */

class BackToTop {
    constructor() {
        this.button = null;
        this.scrollThreshold = 300; // Pixels para mostrar o botão
        this.init();
    }

    /**
     * Inicializa o sistema back-to-top
     */
    init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Configura o botão e eventos
     */
    setup() {
        this.button = document.getElementById('back-to-top');
        
        if (!this.button) {
            console.warn('⚠️ Botão back-to-top não encontrado');
            return;
        }

        this.setupEventListeners();
        this.checkScroll(); // Verificar posição inicial
        
        console.log('🔝 Sistema back-to-top inicializado');
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Clique no botão
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.scrollToTop();
        });

        // Scroll da página
        window.addEventListener('scroll', () => {
            this.checkScroll();
        });

        // Resize da janela
        window.addEventListener('resize', () => {
            this.checkScroll();
        });
    }

    /**
     * Verifica posição do scroll e mostra/esconde botão
     */
    checkScroll() {
        if (!this.button) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > this.scrollThreshold) {
            this.showButton();
        } else {
            this.hideButton();
        }
    }

    /**
     * Mostra o botão com animação
     */
    showButton() {
        if (!this.button.classList.contains('show')) {
            this.button.classList.add('show');
        }
    }

    /**
     * Esconde o botão com animação
     */
    hideButton() {
        if (this.button.classList.contains('show')) {
            this.button.classList.remove('show');
        }
    }

    /**
     * Scroll suave para o topo
     */
    scrollToTop() {
        // Usar smooth scroll nativo se suportado
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // Fallback para navegadores antigos
            this.smoothScrollPolyfill();
        }
    }

    /**
     * Polyfill para smooth scroll
     */
    smoothScrollPolyfill() {
        const scrollStep = -window.scrollY / (500 / 15); // 500ms duration
        const scrollInterval = setInterval(() => {
            if (window.scrollY !== 0) {
                window.scrollBy(0, scrollStep);
            } else {
                clearInterval(scrollInterval);
            }
        }, 15);
    }

    /**
     * Atualiza threshold de scroll
     */
    setScrollThreshold(threshold) {
        this.scrollThreshold = threshold;
        this.checkScroll();
    }

    /**
     * Destroi o sistema (cleanup)
     */
    destroy() {
        if (this.button) {
            window.removeEventListener('scroll', this.checkScroll);
            window.removeEventListener('resize', this.checkScroll);
            this.button.removeEventListener('click', this.scrollToTop);
        }
    }
}

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', () => {
    window.backToTopInstance = new BackToTop();
});

// Exportar para uso global
window.BackToTop = BackToTop;
