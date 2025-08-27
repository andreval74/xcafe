/**
 * Extensão do Progressive Flow para suporte multi-chain
 * Substitui o método deployTokenContract original
 */

// Backup do método original
ProgressiveFlow.prototype.deployTokenContractOriginal = ProgressiveFlow.prototype.deployTokenContract;

// Novo método com suporte multi-chain
ProgressiveFlow.prototype.deployTokenContract = async function(tokenData) {
    try {
        console.log('🚀 Iniciando deploy Multi-Chain:', tokenData.name);
        
        // Obter rede selecionada
        const networkSelect = document.getElementById('deploy-network');
        if (!networkSelect || !networkSelect.value) {
            throw new Error('Por favor, selecione uma rede para o deploy');
        }
        
        const selectedChainId = parseInt(networkSelect.value);
        
        // Verificar se a API está disponível
        if (!this.api) {
            console.warn('API não disponível, tentando deploy direto...');
            return await this.deployTokenContractOriginal(tokenData);
        }
        
        // Verificar se a rede suporta deploy via API
        const isSupported = await this.api.isNetworkSupported(selectedChainId);
        if (!isSupported) {
            console.warn('Rede não suportada pela API, tentando deploy direto...');
            return await this.deployTokenContractOriginal(tokenData);
        }
        
        // Preparar dados para API
        const deployData = {
            name: tokenData.name,
            symbol: tokenData.symbol,
            decimals: parseInt(tokenData.decimals),
            totalSupply: tokenData.totalSupply.toString(),
            owner: tokenData.owner,
            chainId: selectedChainId
        };
        
        console.log('Enviando para API:', deployData);
        
        // Fazer deploy via API
        const deployResult = await this.api.deployToken(deployData);
        
        if (deployResult.success) {
            console.log('✅ Deploy via API bem-sucedido:', deployResult);
            
            return {
                success: true,
                contractAddress: deployResult.contractAddress,
                transactionHash: deployResult.transactionHash,
                network: deployResult.network,
                gasUsed: deployResult.gasUsed,
                blockNumber: deployResult.blockNumber,
                message: `Token "${tokenData.name}" (${tokenData.symbol}) criado com sucesso via API na ${deployResult.network.name}!`
            };
        } else {
            throw new Error(deployResult.error || 'Deploy falhou via API');
        }

    } catch (error) {
        console.error('❌ Erro no deploy Multi-Chain:', error);
        
        // Em caso de erro da API, tentar deploy direto (fallback)
        console.log('🔄 Tentando deploy direto como fallback...');
        
        try {
            return await this.deployTokenContractOriginal(tokenData);
        } catch (directError) {
            console.error('❌ Fallback também falhou:', directError);
            
            return {
                success: false,
                error: error.message || 'Erro desconhecido',
                message: `Erro ao fazer deploy do token "${tokenData.name}":\n\n${error.message}\n\nVerifique sua conexão e rede selecionada.`,
                contractAddress: null,
                transactionHash: null
            };
        }
    }
};

console.log('✅ Progressive Flow Multi-Chain carregado');
