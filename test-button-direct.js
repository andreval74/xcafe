console.log('🚀 Testando botões diretamente...');

// 1. Verificar se os botões existem
const viewBtn = document.getElementById('view-contract-btn');
const verifyBtn = document.getElementById('verify-contract-btn');

console.log('🔍 Botões encontrados:');
console.log('   view-contract-btn:', !!viewBtn);
console.log('   verify-contract-btn:', !!verifyBtn);

// 2. Se encontrar o botão visualizar, configurar diretamente
if (viewBtn) {
    console.log('✅ Configurando botão Visualizar...');
    
    // Simular dados básicos
    window.AppState = window.AppState || {};
    window.AppState.tokenData = {
        name: 'Test Token',
        symbol: 'TST',
        totalSupply: '1000000',
        decimals: '18'
    };
    
    // Função de teste simplificada
    viewBtn.onclick = function() {
        console.log('🖱️ Botão Visualizar clicado!');
        alert('Botão funcionando! Vou mostrar um modal de teste...');
        
        // Criar modal simples para teste
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; 
            transform: translate(-50%, -50%); 
            background: white; color: black; 
            padding: 20px; border-radius: 8px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
            z-index: 9999; max-width: 90%; max-height: 90%;
        `;
        
        modal.innerHTML = `
            <h3>🎉 Botão Funcionando!</h3>
            <p>Dados simulados do token:</p>
            <ul>
                <li>Nome: ${window.AppState.tokenData.name}</li>
                <li>Símbolo: ${window.AppState.tokenData.symbol}</li>
                <li>Supply: ${window.AppState.tokenData.totalSupply}</li>
            </ul>
            <button onclick="this.parentElement.remove()" style="padding: 5px 15px; background: #dc3545; color: white; border: none; border-radius: 4px;">Fechar</button>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (modal.parentElement) modal.remove();
        }, 10000);
    };
    
    // Habilitar o botão (pode estar desabilitado)
    viewBtn.disabled = false;
    viewBtn.style.opacity = '1';
    viewBtn.style.pointerEvents = 'all';
    
    console.log('✅ Botão configurado! Clique nele agora para testar.');
    
} else {
    console.error('❌ Botão view-contract-btn NÃO encontrado no DOM');
}

// 3. Mostrar a seção de verificação (pode estar oculta)
const section = document.getElementById('section-veri');
if (section) {
    section.style.display = 'block';
    section.style.opacity = '1';
    section.style.visibility = 'visible';
    console.log('✅ Seção de verificação exibida');
} else {
    console.warn('⚠️ Seção section-veri não encontrada');
}

// 4. Verificar se existem outros elementos que possam estar bloqueando
const allButtons = document.querySelectorAll('button');
console.log(`🔍 Total de botões na página: ${allButtons.length}`);

// 5. Verificar se há overlays ou modals abertos
const modals = document.querySelectorAll('.modal');
const overlays = document.querySelectorAll('[style*="z-index"]');
console.log(`🔍 Modals abertos: ${modals.length}`);
console.log(`🔍 Elementos com z-index: ${overlays.length}`);

console.log('🧪 Teste configurado! Se o botão existir, deve funcionar agora.');
