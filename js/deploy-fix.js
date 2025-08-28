/**
 * Correção para Progressive Flow - Deploy via API apenas
 * Corrige os erros de "invalid bytecode" e deploy
 */

console.log('🔧 Carregando correção de deploy...');

// Aguardar até o ProgressiveFlow estar disponível
const initDeployFix = () => {
    if (typeof ProgressiveFlow !== 'undefined' && ProgressiveFlow.prototype) {
        
        // Backup do método original se não foi feito ainda
        if (ProgressiveFlow.prototype.deployTokenContract && !ProgressiveFlow.prototype.deployTokenContractOriginal) {
            ProgressiveFlow.prototype.deployTokenContractOriginal = ProgressiveFlow.prototype.deployTokenContract;
        }

        // Substituir método problemático por versão que só usa API
        ProgressiveFlow.prototype.deployTokenContract = async function(tokenData) {
            try {
                console.log('🚀 Deploy Corrigido - Apenas API:', tokenData.name);
                
                // Validações básicas
                if (!tokenData.name || !tokenData.symbol || !tokenData.totalSupply || !tokenData.owner) {
                    throw new Error('Dados do token incompletos');
                }
                
                if (!this.currentNetwork) {
                    throw new Error('Rede não detectada. Conecte sua carteira primeiro.');
                }

                // **SOMENTE VIA API - Deploy direto desabilitado temporariamente**
                if (this.api && this.currentNetwork.supported) {
                    console.log('✅ Usando API exclusivamente...');
                    
                    const deployData = {
                        tokenName: tokenData.name,
                        tokenSymbol: tokenData.symbol,
                        decimals: parseInt(tokenData.decimals) || 18,
                        totalSupply: tokenData.totalSupply.toString(),
                        ownerAddress: tokenData.owner,
                        chainId: this.currentNetwork.chainId,
                        deployerPrivateKey: this.generateDeployerPrivateKey()
                    };
                    
                    console.log('📤 Dados para API:', {
                        ...deployData,
                        deployerPrivateKey: '[HIDDEN]'
                    });
                    
                    const apiResult = await this.api.deployToken(deployData);
                    
                    if (apiResult.success) {
                        console.log('🎉 Deploy via API bem-sucedido!');
                        
                        return {
                            success: true,
                            contractAddress: apiResult.contractAddress,
                            transactionHash: apiResult.transactionHash,
                            network: this.currentNetwork,
                            gasUsed: apiResult.gasUsed || '800000',
                            blockNumber: apiResult.blockNumber || 'N/A',
                            message: `Token "${tokenData.name}" (${tokenData.symbol}) criado com sucesso!`
                        };
                    }
                    
                    throw new Error(apiResult.error || 'API retornou falha sem detalhes');
                }
                
                // API não disponível ou rede não suportada
                const errorDetails = {
                    apiDisponivel: this.api ? 'Sim' : 'Não',
                    redeSuportada: this.currentNetwork.supported ? 'Sim' : 'Não',
                    redeAtual: `${this.currentNetwork.name} (${this.currentNetwork.chainId})`,
                    redesSuportadas: 'BSC Testnet (97), BSC Mainnet (56), Polygon (137)'
                };
                
                console.log('❌ Deploy não disponível:', errorDetails);
                
                throw new Error(
                    `Deploy não disponível no momento\n\n` +
                    `API disponível: ${errorDetails.apiDisponivel}\n` +
                    `Rede suportada: ${errorDetails.redeSuportada}\n` +
                    `Rede atual: ${errorDetails.redeAtual}\n\n` +
                    `Para resolver:\n` +
                    `• Troque para BSC Testnet (gratuito)\n` +
                    `• Verifique se a API está online\n` +
                    `• Aguarde correção do deploy direto`
                );

            } catch (error) {
                console.error('❌ Erro no deploy:', error);
                
                return {
                    success: false,
                    error: error.reason || error.message || 'Erro desconhecido',
                    message: error.message || `Erro ao fazer deploy: ${error.reason || 'Desconhecido'}`,
                    contractAddress: null,
                    transactionHash: null
                };
            }
        };

        // Método auxiliar para chave privada
        ProgressiveFlow.prototype.generateDeployerPrivateKey = function() {
            if (typeof ethers === 'undefined') {
                throw new Error('Ethers.js não carregado');
            }
            
            const wallet = ethers.Wallet.createRandom();
            return wallet.privateKey;
        };

        console.log('✅ Correção de deploy aplicada - API apenas');
        return true;
    }
    
    return false;
};

// Tentar aplicar correção imediatamente
if (!initDeployFix()) {
    // Se não conseguiu, aguardar um pouco e tentar novamente
    setTimeout(() => {
        if (!initDeployFix()) {
            console.warn('⚠️ Não foi possível aplicar correção - ProgressiveFlow não encontrado');
        }
    }, 1000);
}

// Garantir que a correção seja aplicada quando o DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initDeployFix, 500);
    });
} else {
    setTimeout(initDeployFix, 100);
}
