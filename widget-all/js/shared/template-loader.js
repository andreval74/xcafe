/*
================================================================================
TEMPLATE-LOADER.JS - Sistema de carregamento de templates
================================================================================
Carrega header e footer de forma modular em todas as páginas
================================================================================
*/

class TemplateLoader {
    constructor() {
        this.loadedTemplates = new Set();
    }

    /**
     * Carrega um template HTML e insere no container especificado
     * @param {string} templatePath - Caminho para o arquivo de template
     * @param {string} containerId - ID do container onde inserir o template
     * @param {Function} callback - Função opcional a ser executada após o carregamento
     */
    async loadTemplate(templatePath, containerId, callback = null) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container com ID "${containerId}" não encontrado`);
                return false;
            }

            // Verificar se já foi carregado
            const templateKey = `${templatePath}-${containerId}`;
            if (this.loadedTemplates.has(templateKey)) {
                console.log(`Template ${templatePath} já carregado em ${containerId}`);
                return true;
            }

            // Mostrar indicador de carregamento
            container.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';

            const response = await fetch(templatePath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            container.innerHTML = content;

            // Marcar como carregado
            this.loadedTemplates.add(templateKey);

            // Executar callback se fornecido
            if (callback && typeof callback === 'function') {
                callback(container);
            }

            console.log(`Template ${templatePath} carregado com sucesso em ${containerId}`);
            return true;

        } catch (error) {
            console.error(`Erro ao carregar template ${templatePath}:`, error);
            
            // Mostrar erro no container
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-warning m-3">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erro ao carregar conteúdo. Tente recarregar a página.
                    </div>
                `;
            }
            return false;
        }
    }

    /**
     * Carrega header e footer automaticamente
     */
    async loadDefaultTemplates() {
        const promises = [];

        // Carregar header
        if (document.getElementById('header-container')) {
            promises.push(
                this.loadTemplate('header.html', 'header-container', this.initHeaderFeatures)
            );
        }

        // Carregar footer
        if (document.getElementById('footer-container')) {
            promises.push(
                this.loadTemplate('footer.html', 'footer-container', this.initFooterFeatures)
            );
        }

        try {
            await Promise.all(promises);
            console.log('Todos os templates padrão foram carregados');
        } catch (error) {
            console.error('Erro ao carregar templates padrão:', error);
        }
    }

    /**
     * Inicializa funcionalidades específicas do header após carregamento
     * @param {HTMLElement} headerContainer 
     */
    initHeaderFeatures(headerContainer) {
        // Inicializar dropdown Bootstrap se houver
        const dropdowns = headerContainer.querySelectorAll('[data-bs-toggle="dropdown"]');
        dropdowns.forEach(dropdown => {
            new bootstrap.Dropdown(dropdown);
        });

        // Adicionar classe active ao link da página atual
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = headerContainer.querySelectorAll('.nav-link[href]');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });

        console.log('Funcionalidades do header inicializadas');
    }

    /**
     * Inicializa funcionalidades específicas do footer após carregamento
     * @param {HTMLElement} footerContainer 
     */
    initFooterFeatures(footerContainer) {
        // Atualizar ano atual no copyright
        const currentYear = new Date().getFullYear();
        const copyrightText = footerContainer.querySelector('.mb-0');
        if (copyrightText) {
            copyrightText.textContent = `© ${currentYear} Widget SaaS. Todos os direitos reservados.`;
        }

        // Inicializar tooltips se houver
        const tooltips = footerContainer.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });

        console.log('Funcionalidades do footer inicializadas');
    }

    /**
     * Recarregar um template específico
     * @param {string} templatePath 
     * @param {string} containerId 
     */
    async reloadTemplate(templatePath, containerId) {
        const templateKey = `${templatePath}-${containerId}`;
        this.loadedTemplates.delete(templateKey);
        return await this.loadTemplate(templatePath, containerId);
    }

    /**
     * Verificar se um template foi carregado
     * @param {string} templatePath 
     * @param {string} containerId 
     * @returns {boolean}
     */
    isTemplateLoaded(templatePath, containerId) {
        const templateKey = `${templatePath}-${containerId}`;
        return this.loadedTemplates.has(templateKey);
    }
}

// Instância global do carregador de templates
const templateLoader = new TemplateLoader();

// Auto-inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    templateLoader.loadDefaultTemplates();
});

// Exportar para uso global
window.TemplateLoader = TemplateLoader;
window.templateLoader = templateLoader;
