// Sistema Back to Top
class BackToTop {
    constructor() {
        this.createButton();
        this.setupEventListeners();
    }

    createButton() {
        // Criar botão back to top
        const backToTopBtn = document.createElement('button');
        backToTopBtn.id = 'back-to-top';
        backToTopBtn.className = 'back-to-top';
        backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTopBtn.title = 'Voltar ao topo';
        
        // Estilos do botão
        backToTopBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 45px;
            height: 45px;
            background: var(--primary-color, #007bff);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Hover effect
        backToTopBtn.addEventListener('mouseenter', () => {
            backToTopBtn.style.transform = 'scale(1.1)';
            backToTopBtn.style.background = 'var(--primary-dark, #0056b3)';
        });

        backToTopBtn.addEventListener('mouseleave', () => {
            backToTopBtn.style.transform = 'scale(1)';
            backToTopBtn.style.background = 'var(--primary-color, #007bff)';
        });

        document.body.appendChild(backToTopBtn);
    }

    setupEventListeners() {
        const backToTopBtn = document.getElementById('back-to-top');
        
        // Mostrar/ocultar botão baseado no scroll
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.visibility = 'visible';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.visibility = 'hidden';
            }
        });

        // Smooth scroll para o topo
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new BackToTop();
});

// Suporte para temas
document.addEventListener('themeChanged', (e) => {
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn && e.detail) {
        if (e.detail.theme === 'dark') {
            backToTopBtn.style.setProperty('--primary-color', '#0d6efd');
            backToTopBtn.style.setProperty('--primary-dark', '#0b5ed7');
        } else {
            backToTopBtn.style.setProperty('--primary-color', '#007bff');
            backToTopBtn.style.setProperty('--primary-dark', '#0056b3');
        }
    }
});
