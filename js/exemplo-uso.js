/**
 * xcafe Widget - Exemplo de Uso JavaScript
 * Inicialização e configuração do widget para demonstração
 */

// Configuração do widget de exemplo
const widgetConfig = {
    containerId: 'xcafe-widget-test',
    contract: '0x7Ab950357Bb80172718a70FD04783e6949193006',
    network: 97,
    title: 'xcafe Token - Teste',
    theme: 'dark'
};

// Status do widget
let widgetStatus = {
    loaded: false,
    initialized: false,
    error: null
};

// Função para atualizar status visual
function updateStatus(status, message) {
    const statusElement = document.getElementById('widget-status');
    if (!statusElement) return;

    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('.status-text');

    // Remover classes de status anterior
    indicator.classList.remove('status-loading', 'status-success', 'status-error');
    
    // Adicionar nova classe de status
    indicator.classList.add(`status-${status}`);
    
    // Atualizar texto
    if (text) {
        text.textContent = message;
    }
}

// Função para inicializar o widget
function initializeWidget() {
    try {
        updateStatus('loading', 'Carregando widget...');
        
        // Verificar se a função createxcafeWidget está disponível
        if (typeof createxcafeWidget === 'function') {
            createxcafeWidget(widgetConfig);
            widgetStatus.loaded = true;
            widgetStatus.initialized = true;
            updateStatus('success', 'Widget carregado com sucesso');
        } else {
            throw new Error('Função createxcafeWidget não encontrada');
        }
    } catch (error) {
        console.error('Erro ao inicializar widget:', error);
        widgetStatus.error = error.message;
        updateStatus('error', `Erro: ${error.message}`);
    }
}

// Função para recarregar o widget
function reloadWidget() {
    const container = document.getElementById(widgetConfig.containerId);
    if (container) {
        container.innerHTML = '';
    }
    initializeWidget();
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que todos os scripts carregaram
    setTimeout(initializeWidget, 500);
});

// Adicionar função global para debugging
window.xcafeWidgetDebug = {
    status: widgetStatus,
    config: widgetConfig,
    reload: reloadWidget,
    init: initializeWidget
};
