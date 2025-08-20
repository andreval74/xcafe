// Explorer API Manager

/**
 * Busca informaá§áµes do contrato no explorer
 */
async function fetchContractFromExplorer(address, chainId) {
    try {
        const explorerApi = getExplorerApiUrl(chainId);
        if (!explorerApi) throw new Error('Explorer API ná£o suportada para esta rede');
        
        // Busca informaá§áµes do contrato
        const response = await fetch(`${explorerApi}/contract/${address}`);
        if (!response.ok) throw new Error('Falha ao buscar dados do contrato');
        
        const data = await response.json();
        
        return {
            sourceCode: data.sourceCode,
            contractName: data.contractName,
            compilerVersion: data.compilerVersion,
            optimizationUsed: data.optimizationUsed,
            runs: data.runs,
            constructorArguments: data.constructorArguments,
            abi: data.abi,
            library: data.library,
            licenseType: data.licenseType,
            proxy: data.proxy,
            implementation: data.implementation,
            swarmSource: data.swarmSource
        };
    } catch (error) {
        console.error('âŒ Erro ao buscar dados do explorer:', error);
        throw error;
    }
}

/**
 * Retorna a URL da API do explorer baseado no chainId
 */
function getExplorerApiUrl(chainId) {
    const explorers = {
        '0x1': 'https://api.etherscan.io/api',
        '0x38': 'https://api.bscscan.com/api',
        '0x61': 'https://api-testnet.bscscan.com/api',
        '0x89': 'https://api.polygonscan.com/api',
        '0x13881': 'https://api-testnet.polygonscan.com/api'
    };
    
    return explorers[chainId];
}

/**
 * Verifica se um contrato está¡ verificado
 */
async function isContractVerified(address, chainId) {
    try {
        const explorerApi = getExplorerApiUrl(chainId);
        if (!explorerApi) return false;
        
        const response = await fetch(`${explorerApi}/contract/${address}/verify-status`);
        if (!response.ok) return false;
        
        const data = await response.json();
        return data.status === 'Verified';
    } catch (error) {
        console.error('âŒ Erro ao verificar status do contrato:', error);
        return false;
    }
}

/**
 * Busca o cá³digo fonte do contrato
 */
async function fetchContractSource(address, chainId) {
    try {
        const explorerApi = getExplorerApiUrl(chainId);
        if (!explorerApi) throw new Error('Explorer API ná£o suportada para esta rede');
        
        const response = await fetch(`${explorerApi}/contract/${address}/source`);
        if (!response.ok) throw new Error('Falha ao buscar cá³digo fonte');
        
        const data = await response.json();
        return data.sourceCode;
    } catch (error) {
        console.error('âŒ Erro ao buscar cá³digo fonte:', error);
        throw error;
    }
}

// ==================== EXPORTS GLOBAIS ====================

// Torna as funá§áµes disponá­veis globalmente
window.ExplorerAPI = {
    fetchContractFromExplorer,
    isContractVerified,
    fetchContractSource
};

console.log('” [EXPLORER-API] Má³dulo carregado - Funá§áµes disponá­veis globalmente');




