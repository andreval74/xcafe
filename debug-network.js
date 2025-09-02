// ===== TESTE DE DETECÇÃO DE REDE =====
console.log('🌐 Testando detecção de rede...');

// Simular AppState para teste
window.AppState = window.AppState || {};
window.AppState.wallet = window.AppState.wallet || {};
window.AppState.deployResult = window.AppState.deployResult || {};

// Simular endereço de contrato para teste
window.AppState.deployResult.contractAddress = '0x1234567890123456789012345678901234567890';

// Função para testar a detecção de rede
function testarDeteccaoRede() {
    console.log('🧪 === TESTE DE DETECÇÃO DE REDE ===');
    
    // Verificar se MetaMask está disponível
    if (typeof window.ethereum === 'undefined') {
        console.warn('⚠️ MetaMask não detectado');
        return;
    }
    
    // Obter chainId atual
    window.ethereum.request({ method: 'eth_chainId' })
        .then(chainId => {
            console.log('1. Chain ID retornado pelo MetaMask:', chainId);
            
            // Converter para decimal
            const decimal = parseInt(chainId, 16);
            console.log('2. Chain ID em decimal:', decimal);
            
            // Simular configuração do AppState
            window.AppState.wallet.network = {
                chainId: chainId, // hexadecimal como vem do MetaMask
                chainIdDecimal: decimal
            };
            
            console.log('3. AppState configurado:', window.AppState.wallet.network);
            
            // Testar função openVerificationUrl
            console.log('4. Testando openVerificationUrl...');
            
            if (typeof openVerificationUrl === 'function') {
                openVerificationUrl();
                console.log('✅ Função executada sem erro');
            } else {
                console.error('❌ Função openVerificationUrl não encontrada');
            }
            
        })
        .catch(error => {
            console.error('❌ Erro ao obter chainId:', error);
        });
}

// Função para mostrar informações da rede atual
function mostrarInfoRede() {
    console.log('📊 === INFORMAÇÕES DA REDE ===');
    
    if (window.AppState?.wallet?.network) {
        const network = window.AppState.wallet.network;
        console.log('🌐 Rede atual:', network);
        
        // Converter chainId se necessário
        let chainId = network.chainId;
        if (typeof chainId === 'string' && chainId.startsWith('0x')) {
            chainId = parseInt(chainId, 16);
        }
        
        console.log('🔢 Chain ID (decimal):', chainId);
        
        // Mostrar que rede é
        const redes = {
            1: 'Ethereum Mainnet',
            56: 'BSC Mainnet', 
            97: 'BSC Testnet',
            137: 'Polygon Mainnet',
            8453: 'Base Mainnet',
            11155111: 'Sepolia Testnet'
        };
        
        console.log('🏷️ Nome da rede:', redes[chainId] || 'Rede desconhecida');
        
    } else {
        console.warn('⚠️ Informações da rede não disponíveis');
    }
}

// Função para forçar teste com rede específica
function testarComRede(chainIdHex) {
    console.log(`🎯 Testando com Chain ID: ${chainIdHex}`);
    
    window.AppState.wallet.network = {
        chainId: chainIdHex
    };
    
    console.log('✅ Rede configurada para teste');
    console.log('🔗 Execute: openVerificationUrl() para testar');
}

// Disponibilizar funções globalmente
window.testarDeteccaoRede = testarDeteccaoRede;
window.mostrarInfoRede = mostrarInfoRede;
window.testarComRede = testarComRede;

console.log('✅ Script de teste carregado!');
console.log('📋 Comandos disponíveis:');
console.log('   - testarDeteccaoRede() - Testa detecção automática');
console.log('   - mostrarInfoRede() - Mostra informações atuais');
console.log('   - testarComRede("0x61") - Testa com BSC Testnet');
console.log('   - testarComRede("0x38") - Testa com BSC Mainnet');
console.log('   - testarComRede("0x1") - Testa com Ethereum Mainnet');
