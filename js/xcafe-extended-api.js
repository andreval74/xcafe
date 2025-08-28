/**
 * Cliente API Estendida para xcafe - Compilação e Deploy de Contratos
 * Versão com suporte completo a compilação, deploy e verificação
 */

class XcafeExtendedAPI {
    constructor(apiBaseUrl = 'https://xcafe-token-api.onrender.com') {
        this.baseUrl = apiBaseUrl;
        this.timeout = 120000; // 2 minutos para operações de compilação/deploy
    }

    /**
     * Faz requisição para API com tratamento de erros
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            console.log(`🌐 Chamando API: ${url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...finalOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Resposta da API:`, data);
            
            return data;

        } catch (error) {
            console.error(`❌ Erro na API:`, error);
            throw error;
        }
    }

    /**
     * Compila código Solidity
     */
    async compileContract(contractData) {
        console.log('🔨 Compilando contrato Solidity...');
        
        const compileData = {
            sourceCode: contractData.sourceCode,
            contractName: contractData.contractName || 'MyToken',
            solcVersion: contractData.solcVersion || '0.8.19',
            optimization: contractData.optimization !== false,
            optimizationRuns: contractData.optimizationRuns || 200
        };

        const result = await this.makeRequest('/compile', {
            method: 'POST',
            body: JSON.stringify(compileData)
        });

        if (!result.success) {
            throw new Error(`Compilação falhou: ${result.errors?.join(', ') || 'Erro desconhecido'}`);
        }

        console.log('✅ Compilação concluída com sucesso');
        return result;
    }

    /**
     * Faz deploy de contrato já compilado
     */
    async deployCompiledContract(deployData) {
        console.log('🚀 Fazendo deploy do contrato compilado...');
        
        const result = await this.makeRequest('/deploy-compiled', {
            method: 'POST',
            body: JSON.stringify(deployData)
        });

        if (!result.success) {
            throw new Error(`Deploy falhou: ${result.error || 'Erro desconhecido'}`);
        }

        console.log('✅ Deploy concluído com sucesso');
        return result;
    }

    /**
     * Compila e faz deploy em uma única operação
     */
    async compileAndDeploy(contractData) {
        console.log('⚡ Executando compilação e deploy em fluxo único...');
        
        const deployData = {
            sourceCode: contractData.sourceCode,
            contractName: contractData.contractName || 'MyToken',
            constructorParams: contractData.constructorParams || [],
            chainId: contractData.chainId,
            ownerAddress: contractData.ownerAddress,
            solcVersion: contractData.solcVersion || '0.8.19',
            optimization: contractData.optimization !== false,
            gasLimit: contractData.gasLimit || 'auto',
            gasPrice: contractData.gasPrice || 'auto'
        };

        const result = await this.makeRequest('/compile-and-deploy', {
            method: 'POST',
            body: JSON.stringify(deployData)
        });

        if (!result.success) {
            throw new Error(`Compilação/Deploy falhou: ${result.error || 'Erro desconhecido'}`);
        }

        console.log('✅ Compilação e deploy concluídos com sucesso');
        return result;
    }

    /**
     * Verifica contrato no explorador da blockchain
     */
    async verifyContract(verificationData) {
        console.log('🔍 Verificando contrato no explorador...');
        
        const result = await this.makeRequest('/verify-contract', {
            method: 'POST',
            body: JSON.stringify(verificationData)
        });

        if (!result.success) {
            console.warn('⚠️ Verificação falhou, mas contrato foi deployado');
            return { ...result, warning: 'Verificação não foi possível' };
        }

        console.log('✅ Contrato verificado com sucesso');
        return result;
    }

    /**
     * Analisa contrato para possíveis problemas
     */
    async analyzeContract(analysisData) {
        console.log('📊 Analisando contrato...');
        
        const result = await this.makeRequest('/analyze-contract', {
            method: 'POST',
            body: JSON.stringify(analysisData)
        });

        console.log(`📋 Análise concluída - ${result.issues?.length || 0} problemas encontrados`);
        return result;
    }

    /**
     * Obtém template de contrato otimizado
     */
    generateTokenContract(tokenData) {
        const {
            name,
            symbol,
            totalSupply,
            decimals = 18,
            mintable = false,
            burnable = false,
            pausable = false,
            ownable = true
        } = tokenData;

        let imports = ['@openzeppelin/contracts/token/ERC20/ERC20.sol'];
        let inheritance = ['ERC20'];
        let constructorCode = `_mint(msg.sender, ${totalSupply} * 10**decimals());`;
        let additionalFunctions = '';

        if (ownable) {
            imports.push('@openzeppelin/contracts/access/Ownable.sol');
            inheritance.push('Ownable');
        }

        if (mintable) {
            imports.push('@openzeppelin/contracts/token/ERC20/extensions/ERC20Mintable.sol');
            additionalFunctions += `
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }`;
        }

        if (burnable) {
            imports.push('@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol');
            inheritance.push('ERC20Burnable');
        }

        if (pausable) {
            imports.push('@openzeppelin/contracts/security/Pausable.sol');
            inheritance.push('Pausable');
        }

        const sourceCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

${imports.map(imp => `import "${imp}";`).join('\n')}

contract ${symbol}Token is ${inheritance.join(', ')} {
    constructor() ERC20("${name}", "${symbol}") ${ownable ? 'Ownable(msg.sender)' : ''} {
        ${constructorCode}
    }
    
    function decimals() public pure override returns (uint8) {
        return ${decimals};
    }${additionalFunctions}
}`;

        return {
            sourceCode,
            contractName: `${symbol}Token`,
            constructorParams: [] // Sem parâmetros no construtor para este template
        };
    }

    /**
     * Método principal para criar e deployar token (compatível com sistema atual)
     */
    async deployToken(tokenData) {
        try {
            // Gerar código do contrato
            const contractInfo = this.generateTokenContract(tokenData);
            
            // Preparar dados para deploy
            const deployData = {
                ...contractInfo,
                chainId: tokenData.chainId,
                ownerAddress: tokenData.owner,
                solcVersion: '0.8.19',
                optimization: true
            };

            // Executar compilação e deploy
            const result = await this.compileAndDeploy(deployData);
            
            // Tentar verificar (não crítico se falhar)
            try {
                await this.verifyContract({
                    contractAddress: result.contractAddress,
                    sourceCode: contractInfo.sourceCode,
                    chainId: tokenData.chainId,
                    constructorParams: []
                });
            } catch (verifyError) {
                console.warn('⚠️ Verificação falhou:', verifyError.message);
            }

            return {
                success: true,
                contractAddress: result.contractAddress,
                transactionHash: result.transactionHash,
                gasUsed: result.gasUsed,
                blockNumber: result.blockNumber,
                verified: result.verified || false,
                explorerUrl: this.getExplorerUrl(result.contractAddress, tokenData.chainId)
            };

        } catch (error) {
            console.error('❌ Erro no deploy do token:', error);
            throw error;
        }
    }

    /**
     * Obtém URL do explorador para visualizar contrato
     */
    getExplorerUrl(contractAddress, chainId) {
        const explorers = {
            1: `https://etherscan.io/address/${contractAddress}`,
            56: `https://bscscan.com/address/${contractAddress}`,
            97: `https://testnet.bscscan.com/address/${contractAddress}`,
            137: `https://polygonscan.com/address/${contractAddress}`,
            8453: `https://basescan.org/address/${contractAddress}`
        };
        
        return explorers[chainId] || `https://etherscan.io/address/${contractAddress}`;
    }
}

// Função para testar as novas funcionalidades
async function testExtendedAPI() {
    const api = new XcafeExtendedAPI();
    
    try {
        // Teste 1: Compilação simples
        console.log('🧪 Testando compilação...');
        const contractInfo = api.generateTokenContract({
            name: 'Test Token',
            symbol: 'TEST',
            totalSupply: 1000000,
            decimals: 18
        });
        
        const compileResult = await api.compileContract(contractInfo);
        console.log('✅ Compilação testada:', compileResult.success);
        
        // Teste 2: Deploy completo
        console.log('🧪 Testando deploy completo...');
        const deployResult = await api.deployToken({
            name: 'xcafe Test Token',
            symbol: 'XCT',
            totalSupply: '1000000',
            decimals: 18,
            owner: '0x742d35Cc622C7CF4C81Ca2e8DE4b5cA0bC2A9eE0',
            chainId: 97
        });
        
        console.log('✅ Deploy testado:', deployResult.success);
        
    } catch (error) {
        console.error('❌ Teste falhou:', error.message);
    }
}

// Exportar para uso no sistema
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XcafeExtendedAPI;
} else {
    window.XcafeExtendedAPI = XcafeExtendedAPI;
}
