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
        
        // Usar rede da carteira conectada
        if (!this.currentNetwork) {
            throw new Error('Rede da carteira não detectada. Tente reconectar a carteira.');
        }
        
        const selectedChainId = this.currentNetwork.chainId;
        console.log('Usando rede da carteira:', this.currentNetwork);
        
        // Verificar se a API está disponível e rede é suportada
        if (this.api && this.currentNetwork.supported) {
            console.log('Tentando deploy via API...');
            
            // Preparar dados para API com todos os parâmetros obrigatórios
            const deployData = {
                tokenName: tokenData.name,
                tokenSymbol: tokenData.symbol,
                decimals: parseInt(tokenData.decimals) || 18,
                totalSupply: tokenData.totalSupply.toString(),
                ownerAddress: tokenData.owner,
                chainId: selectedChainId,
                deployerPrivateKey: this.generateDeployerPrivateKey()
            };
            
            console.log('Enviando para API:', deployData);
            
            try {
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
            } catch (apiError) {
                console.warn('API falhou, usando fallback:', apiError);
                // Continuar para deploy direto
            }
        }
        
        // Deploy direto (fallback ou rede não suportada)
        console.log('🔄 Usando deploy direto...');
        return await this.deployTokenContractOriginal(tokenData);

    } catch (error) {
        console.error('❌ Erro no deploy Multi-Chain:', error);
        
        return {
            success: false,
            error: error.message || 'Erro desconhecido',
            message: `Erro ao fazer deploy do token "${tokenData.name}":\n\n${error.message}\n\nVerifique sua conexão e rede selecionada.`,
            contractAddress: null,
            transactionHash: null
        };
    }
};

// Método auxiliar para gerar chave privada temporária
ProgressiveFlow.prototype.generateDeployerPrivateKey = function() {
    if (typeof ethers === 'undefined') {
        throw new Error('Ethers.js não carregado');
    }
    
    const wallet = ethers.Wallet.createRandom();
    return wallet.privateKey;
};

console.log('✅ Progressive Flow Multi-Chain carregado');
