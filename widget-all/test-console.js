/*
Teste JavaScript para Console do Navegador
Cole este código no console do navegador (F12) para testar o sistema de tema
*/

// Função de teste do sistema de tema
function testThemeSystem() {
    console.log('🧪 Testando Sistema de Tema');
    console.log('=' .repeat(40));
    
    // Teste 1: Verificar se o header foi carregado
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        console.log('✅ Header container encontrado');
        
        if (headerContainer.innerHTML.trim()) {
            console.log('✅ Header tem conteúdo');
        } else {
            console.log('❌ Header está vazio');
        }
    } else {
        console.log('❌ Header container não encontrado');
    }
    
    // Teste 2: Verificar se o botão de tema existe
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        console.log('✅ Botão de tema encontrado');
        
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            console.log('✅ Ícone de tema encontrado');
            console.log('   Classe atual:', themeIcon.className);
        } else {
            console.log('❌ Ícone de tema não encontrado');
        }
    } else {
        console.log('❌ Botão de tema não encontrado');
    }
    
    // Teste 3: Verificar theme controller
    if (window.themeController) {
        console.log('✅ Theme Controller inicializado');
        console.log('   Tema atual:', window.themeController.currentTheme);
    } else {
        console.log('❌ Theme Controller não encontrado');
    }
    
    // Teste 4: Verificar template loader
    if (window.templateLoader) {
        console.log('✅ Template Loader disponível');
    } else {
        console.log('❌ Template Loader não encontrado');
    }
    
    // Teste 5: Verificar botão voltar ao topo
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        console.log('✅ Botão "Voltar ao topo" encontrado');
    } else {
        console.log('❌ Botão "Voltar ao topo" não encontrado');
    }
    
    console.log('🎉 Teste concluído!');
    console.log('\n💡 Para testar o tema, tente: window.themeController.toggleTheme()');
}

// Função para testar mudança de tema
function testThemeToggle() {
    if (window.themeController) {
        console.log('🎨 Testando alternância de tema...');
        const oldTheme = window.themeController.currentTheme;
        window.themeController.toggleTheme();
        const newTheme = window.themeController.currentTheme;
        console.log(`Mudou de ${oldTheme} para ${newTheme}`);
    } else {
        console.log('❌ Theme Controller não disponível');
    }
}

// Aguardar um pouco e executar teste
setTimeout(() => {
    testThemeSystem();
    
    // Adicionar listener para testar quando clicar no botão
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            console.log('🎨 Botão de tema clicado!');
        });
    }
}, 2000);

console.log('🔧 Teste JavaScript carregado. Aguarde 2 segundos para execução automática.');
console.log('💡 Ou execute manualmente: testThemeSystem()');
console.log('🎨 Para testar tema: testThemeToggle()');
