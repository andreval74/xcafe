/**
 * xcafe Widget - Exemplo de Uso JavaScript
 * Inicialização e configuração do widget para demonstração
 * Integrado com o design system xcafe
 */

// Configuração do widget de exemplo
const widgetConfig = {
    containerId: 'xcafe-widget-test',
    contract: '0x7Ab950357Bb80172718a70FD04783e6949193006',
    network: 97,
    title: 'xcafe Token - Demonstração',
    theme: 'dark'
};

// Status do widget
let widgetStatus = {
    loaded: false,
    initialized: false,
    error: null,
    startTime: null
};

// Função para atualizar status visual com design xcafe
function updateStatus(status, message) {
    const statusElement = document.getElementById('widget-status');
    if (!statusElement) return;

    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('.status-text');

    // Remover classes de status anterior
    indicator.classList.remove('status-loading', 'status-success', 'status-error');
    statusElement.classList.remove('alert-info', 'alert-success', 'alert-danger');
    
    // Adicionar nova classe de status
    indicator.classList.add(`status-${status}`);
    
    // Atualizar classes do alert conforme status
    switch(status) {
        case 'loading':
            statusElement.classList.add('alert-info');
            break;
        case 'success':
            statusElement.classList.add('alert-success');
            break;
        case 'error':
            statusElement.classList.add('alert-danger');
            break;
    }
    
    // Atualizar texto com timestamp
    if (text) {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        text.innerHTML = `<strong>${message}</strong> <small class="text-muted">(${timestamp})</small>`;
    }
}

// Função para mostrar loading no container do widget
function showWidgetLoading() {
    const container = document.getElementById(widgetConfig.containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="text-secondary mb-0">Inicializando widget xcafe...</p>
            <small class="text-muted">Conectando com a blockchain...</small>
        </div>
    `;
    container.classList.add('loading-shimmer');
}

// Função para remover loading do container
function hideWidgetLoading() {
    const container = document.getElementById(widgetConfig.containerId);
    if (container) {
        container.classList.remove('loading-shimmer');
    }
}

// Função para inicializar o widget
function initializeWidget() {
    try {
        widgetStatus.startTime = Date.now();
        updateStatus('loading', 'Carregando widget xcafe...');
        showWidgetLoading();
        
        // Verificar se a função createxcafeWidget está disponível
        if (typeof createxcafeWidget === 'function') {
            // Simular um pequeno delay para mostrar o loading
            setTimeout(() => {
                try {
                    createxcafeWidget(widgetConfig);
                    hideWidgetLoading();
                    
                    widgetStatus.loaded = true;
                    widgetStatus.initialized = true;
                    
                    const loadTime = ((Date.now() - widgetStatus.startTime) / 1000).toFixed(2);
                    updateStatus('success', `Widget carregado com sucesso em ${loadTime}s`);
                    
                    // Log de sucesso para debug
                    console.log('🚀 xcafe Widget inicializado:', {
                        config: widgetConfig,
                        loadTime: loadTime + 's',
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    hideWidgetLoading();
                    throw error;
                }
            }, 800);
        } else {
            hideWidgetLoading();
            throw new Error('Função createxcafeWidget não encontrada. Verifique se wg-widget.js foi carregado.');
        }
    } catch (error) {
        hideWidgetLoading();
        console.error('❌ Erro ao inicializar widget xcafe:', error);
        widgetStatus.error = error.message;
        updateStatus('error', `Erro: ${error.message}`);
        
        // Mostrar fallback no container
        const container = document.getElementById(widgetConfig.containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 3rem;"></i>
                    <h5 class="text-white mt-3">Erro ao Carregar Widget</h5>
                    <p class="text-secondary mb-3">${error.message}</p>
                    <button class="btn btn-outline-primary" onclick="xcafeWidgetDebug.reload()">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
}

// Função para recarregar o widget
function reloadWidget() {
    console.log('🔄 Recarregando widget xcafe...');
    
    const container = document.getElementById(widgetConfig.containerId);
    if (container) {
        container.innerHTML = '';
    }
    
    // Reset status
    widgetStatus = {
        loaded: false,
        initialized: false,
        error: null,
        startTime: null
    };
    
    // Reinicializar
    initializeWidget();
}

// Função para mostrar informações detalhadas de debug
function showDebugInfo() {
    const debugInfo = {
        status: widgetStatus,
        config: widgetConfig,
        userAgent: navigator.userAgent,
        ethersLoaded: typeof ethers !== 'undefined',
        widgetFunctionLoaded: typeof createxcafeWidget === 'function',
        timestamp: new Date().toISOString(),
        performance: {
            loadTime: widgetStatus.startTime ? 
                ((Date.now() - widgetStatus.startTime) / 1000).toFixed(2) + 's' : 'N/A'
        }
    };
    
    console.group('🐛 xcafe Widget Debug Info');
    console.table(debugInfo.status);
    console.table(debugInfo.config);
    console.log('Environment:', debugInfo);
    console.groupEnd();
    
    return debugInfo;
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página xcafe Widget Demo carregada');
    
    // Aguardar um pouco para garantir que todos os scripts carregaram
    setTimeout(() => {
        initializeWidget();
    }, 500);
});

// Adicionar função global para debugging com mais funcionalidades
window.xcafeWidgetDebug = {
    status: widgetStatus,
    config: widgetConfig,
    reload: reloadWidget,
    init: initializeWidget,
    info: showDebugInfo,
    version: '1.0.0'
};
