// ===== TESTE E CORREÇÃO BOTÃO VISUALIZAR =====
console.log('🔧 Iniciando correção do botão Visualizar Contrato...');

// 1. Simular AppState completo
window.AppState = window.AppState || {};
window.AppState.tokenData = {
    name: 'Test Token',
    symbol: 'TST',
    totalSupply: '1000000',
    decimals: '18'
};
window.AppState.deployResult = {
    contractAddress: '0x1234567890123456789012345678901234567890',
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract TestToken {
    string public name = "Test Token";
    string public symbol = "TST";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18;
    
    mapping(address => uint256) public balanceOf;
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        return true;
    }
}`
};
window.AppState.wallet = { network: { chainId: 97 } };

// 2. Função showContractModal corrigida
window.showContractModal = function(providedCode = null, providedTitle = null) {
    console.log('🚀 showContractModal executada!', { providedCode: !!providedCode, providedTitle });
    
    const tokenData = window.AppState?.tokenData;
    let contractCode = '';
    let modalTitle = 'Contrato Solidity';
    
    // Se forneceu código, usar diretamente
    if (providedCode) {
        contractCode = providedCode;
        modalTitle = providedTitle || 'Contrato Solidity';
    } else {
        // Verificar dados do token
        if (!tokenData?.name || !tokenData?.symbol) {
            alert('Dados do token não encontrados. Certifique-se de preencher o formulário primeiro.');
            return;
        }
        
        modalTitle = `Contrato: ${tokenData.symbol}`;
        
        // Usar código do deploy se disponível
        if (window.AppState.deployResult?.sourceCode) {
            contractCode = window.AppState.deployResult.sourceCode;
            modalTitle = `Contrato Deployado: ${tokenData.symbol}`;
        } else {
            // Fallback para contrato básico
            contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract ${tokenData.symbol} {
    string public name = "${tokenData.name}";
    string public symbol = "${tokenData.symbol}";
    uint8 public decimals = ${tokenData.decimals || 18};
    uint256 public totalSupply = ${tokenData.totalSupply} * 10**${tokenData.decimals || 18};
    
    mapping(address => uint256) public balanceOf;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}`;
        }
    }
    
    // Criar modal
    const modalId = 'contractModal-' + Date.now();
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: #1a1a1a; color: white; border: 2px solid #0d6efd; border-radius: 8px; width: 90%; max-width: 800px; max-height: 90%; display: flex; flex-direction: column;">
                <div style="padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: between; align-items: center;">
                    <h3 style="margin: 0; color: #0d6efd;">📄 ${modalTitle}</h3>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-left: auto;">✕ Fechar</button>
                </div>
                <div style="padding: 20px; flex: 1; overflow-y: auto;">
                    <div style="margin-bottom: 15px;">
                        <button onclick="copyContractCode('${modalId}')" style="background: #198754; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">📋 Copiar</button>
                        <button onclick="downloadContract('${modalId}')" style="background: #0d6efd; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">💾 Baixar</button>
                    </div>
                    <pre id="contract-code-${modalId}" style="background: #000; color: #00ff00; padding: 15px; border-radius: 4px; font-size: 12px; line-height: 1.4; overflow-x: auto; margin: 0;">${contractCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior se existir
    document.querySelectorAll('[id^="contractModal-"]').forEach(m => m.remove());
    
    document.body.appendChild(modal);
    console.log('✅ Modal criada e exibida!');
};

// 3. Funções auxiliares
window.copyContractCode = function(modalId) {
    const codeElement = document.getElementById('contract-code-' + modalId);
    if (codeElement) {
        navigator.clipboard.writeText(codeElement.textContent).then(() => {
            alert('Código copiado para a área de transferência!');
        }).catch(() => {
            alert('Erro ao copiar código');
        });
    }
};

window.downloadContract = function(modalId) {
    const codeElement = document.getElementById('contract-code-' + modalId);
    if (codeElement) {
        const code = codeElement.textContent;
        const symbol = window.AppState?.tokenData?.symbol || 'Token';
        const filename = `${symbol}.sol`;
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Arquivo baixado: ' + filename);
    }
};

// 4. Função para corrigir o botão na página
window.corrigirBotaoVisualizar = function() {
    console.log('🔧 Corrigindo configuração do botão...');
    
    const btn = document.getElementById('view-contract-btn');
    if (!btn) {
        console.error('❌ Botão view-contract-btn não encontrado!');
        return false;
    }
    
    console.log('✅ Botão encontrado:', {
        id: btn.id,
        disabled: btn.disabled,
        onclick: !!btn.onclick,
        display: btn.style.display,
        opacity: btn.style.opacity
    });
    
    // Limpar handlers existentes
    btn.onclick = null;
    btn.removeAttribute('onclick');
    
    // Configurar novo handler
    btn.onclick = function(e) {
        console.log('🖱️ CLIQUE DETECTADO NO BOTÃO VISUALIZAR!');
        e.preventDefault();
        e.stopPropagation();
        
        try {
            window.showContractModal();
        } catch (error) {
            console.error('Erro ao executar showContractModal:', error);
            alert('Erro ao abrir modal: ' + error.message);
        }
    };
    
    // Garantir que está habilitado e visível
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'all';
    btn.style.display = '';
    
    console.log('✅ Botão corrigido com sucesso!');
    return true;
};

// 5. Teste completo
window.testarBotaoCompleto = function() {
    console.log('🧪 === TESTE COMPLETO DO BOTÃO ===');
    
    // Passo 1: Verificar botão
    const btn = document.getElementById('view-contract-btn');
    console.log('1. Botão existe:', !!btn);
    
    if (!btn) {
        console.error('❌ Botão não encontrado!');
        return;
    }
    
    // Passo 2: Corrigir configuração
    console.log('2. Corrigindo configuração...');
    const corrigido = window.corrigirBotaoVisualizar();
    
    if (!corrigido) {
        console.error('❌ Falha na correção!');
        return;
    }
    
    // Passo 3: Testar função diretamente
    console.log('3. Testando função diretamente...');
    try {
        window.showContractModal();
        console.log('✅ Função executou sem erro!');
    } catch (error) {
        console.error('❌ Erro na função:', error);
        return;
    }
    
    // Passo 4: Simular clique no botão
    console.log('4. Simulando clique no botão...');
    setTimeout(() => {
        try {
            btn.click();
            console.log('✅ Clique executado!');
        } catch (error) {
            console.error('❌ Erro no clique:', error);
        }
    }, 1000);
    
    console.log('🧪 === TESTE CONCLUÍDO ===');
};

// Auto-executar se o botão for encontrado
setTimeout(() => {
    if (document.getElementById('view-contract-btn')) {
        console.log('🎯 Botão encontrado! Execute testarBotaoCompleto() para testar.');
        window.corrigirBotaoVisualizar();
    }
}, 500);

console.log('✅ Script de correção carregado!');
console.log('📋 Comandos disponíveis:');
console.log('   - corrigirBotaoVisualizar() - Corrige o botão');
console.log('   - testarBotaoCompleto() - Teste completo');
console.log('   - showContractModal() - Abre o modal diretamente');
