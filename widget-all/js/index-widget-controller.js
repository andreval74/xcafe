/**
 * CONTROLE DE TEMA DO WIDGET - PÁGINA INDEX
 * Responsável pelo controle específico do tema do widget na demonstração
 */

class IndexWidgetController {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupThemeControls();
            this.ensureFixedBackground();
        });
    }

    setupThemeControls() {
        // Elementos de controle
        const themeLight = document.getElementById('theme-light');
        const themeDark = document.getElementById('theme-dark');

        // Event listeners para os seletores de tema
        if (themeLight) {
            themeLight.addEventListener('change', () => {
                if (themeLight.checked) {
                    this.updateWidgetTheme('light');
                }
            });
        }

        if (themeDark) {
            themeDark.addEventListener('change', () => {
                if (themeDark.checked) {
                    this.updateWidgetTheme('dark');
                }
            });
        }
    }

    updateWidgetTheme(theme) {
        const widgetContainer = document.getElementById('widget-demo-container');
        const currentThemeExample = document.getElementById('current-theme-example');

        if (widgetContainer) {
            console.log('🎨 Alterando tema do widget para:', theme);

            // Atualizar data-theme
            widgetContainer.setAttribute('data-theme', theme);

            // Encontrar o widget existente
            const existingWidget = widgetContainer.querySelector('.token-sale-widget');
            if (existingWidget) {
                // Apenas alterar a classe do widget, SEM afetar o container externo
                if (theme === 'dark') {
                    existingWidget.classList.add('dark');
                } else {
                    existingWidget.classList.remove('dark');
                }

                console.log('✅ Classe do widget atualizada:', existingWidget.className);
            } else {
                // Se widget não existe, criar novo
                if (window.TokenSaleWidget) {
                    new window.TokenSaleWidget({
                        apiKey: 'demo-key',
                        containerId: 'widget-demo-container',
                        saleId: 'demo-sale',
                        theme: theme
                    });
                }
            }

            // Atualizar exemplo de código
            if (currentThemeExample) {
                currentThemeExample.textContent = theme;
            }

            // IMPORTANTE: Container externo permanece INALTERADO
            this.ensureFixedBackground();
        }
    }

    ensureFixedBackground() {
        const backgroundContainer = document.getElementById('widget-demo-background');
        if (backgroundContainer) {
            // Garantir que o fundo externo nunca mude
            backgroundContainer.style.background = '#f8f9fa';
            backgroundContainer.style.backgroundColor = '#f8f9fa';
        }
    }
}

// Inicializar o controlador
const indexWidgetController = new IndexWidgetController();

// Garantir fundo fixo ao carregar (backup)
setTimeout(() => {
    if (indexWidgetController) {
        indexWidgetController.ensureFixedBackground();
    }
}, 100);
