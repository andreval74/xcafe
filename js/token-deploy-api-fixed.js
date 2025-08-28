/**
 * API Client para deploy de tokens em múltiplas redes - Versão Corrigida
 * Integração com a API hospedada no Render v2.1
 */

class TokenDeployAPI {
    constructor(apiBaseUrl = 'https://xcafe-token-api.onrender.com') {
        this.baseUrl = apiBaseUrl;
        this.timeout = 60000; // 60 segundos
        this.supportedNetworks = null; // Cache das redes
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
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
            
            if (error.name === 'AbortError') {
                throw new Error('Timeout: A requisição demorou muito para ser processada');
            }
            
            throw error;
        }
    }

    async getStatus() {
        return await this.makeRequest('/');
    }

    async getNetworks(deployOnly = true) {
        const endpoint = deployOnly ? '/networks?deployOnly=true' : '/networks';
        const result = await this.makeRequest(endpoint);
        
        // Cache das redes suportadas
        if (deployOnly) {
            this.supportedNetworks = result.networks;
        }
        
        return result;
    }

    async getNetworkInfo(chainId) {
        if (!chainId || chainId === 'undefined') {
            throw new Error(`Chain ID inválido: ${chainId}`);
        }
        return await this.makeRequest(`/network/${chainId}`);
    }

    async deployToken(tokenData) {
        return await this.makeRequest('/deploy-token', {
            method: 'POST',
            body: JSON.stringify(tokenData)
        });
    }

    async getTransactionStatus(hash, chainId) {
        return await this.makeRequest(`/transaction/${hash}/${chainId}`);
    }

    // Verificar se uma rede suporta deploy
    async isNetworkSupported(chainId) {
        if (!this.supportedNetworks) {
            try {
                await this.getNetworks(true);
            } catch (error) {
                console.warn('Erro ao carregar redes:', error);
                return false;
            }
        }
        
        return this.supportedNetworks.some(network => network.chainId === chainId && network.deploySupported);
    }

    // Obter lista de redes suportadas para o frontend
    async getSupportedNetworksForUI() {
        const result = await this.getNetworks(true);
        
        return result.networks.map(network => ({
            name: network.name,
            chainId: network.chainId,
            symbol: network.symbol,
            displayName: `${network.name} (${network.symbol})`
        }));
    }

    // Gerar chave privada temporária para deploy
    generateDeployerWallet() {
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers.js não carregado');
        }
        
        const wallet = ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    }

    // Estimar custo do deploy baseado na rede
    async estimateDeployCost(chainId) {
        if (!chainId || chainId === 'undefined') {
            console.warn('Chain ID não definido, usando estimativa padrão');
            return this.getDefaultEstimate();
        }

        try {
            const networkInfo = await this.getNetworkInfo(chainId);
            
            // Estimativas baseadas no gas price da rede
            const gasPrice = parseFloat(networkInfo.network.gasPrice);
            const gasLimit = networkInfo.network.gasLimit;
            const symbol = networkInfo.network.symbol;
            
            // Calcular custo em tokens nativos
            const gasCostWei = gasPrice * gasLimit * 1e9; // Convert gwei to wei
            const gasCost = gasCostWei / 1e18; // Convert wei to ether
            
            return {
                network: networkInfo.network.name,
                symbol: symbol,
                gasPrice: gasPrice + ' gwei',
                gasLimit: gasLimit,
                estimatedCost: gasCost.toFixed(6),
                costDisplay: `~${gasCost.toFixed(4)} ${symbol}`
            };
            
        } catch (error) {
            console.warn('API não disponível, usando estimativas fixas:', error);
            return this.getDefaultEstimate(chainId);
        }
    }

    getDefaultEstimate(chainId = 97) {
        // Fallback para estimativas fixas com valores numéricos válidos
        const estimates = {
            1: { cost: 0.02, symbol: 'ETH', display: '~0.02 ETH ($30-60)' },
            56: { cost: 0.003, symbol: 'BNB', display: '~0.003 BNB ($1-2)' },
            97: { cost: 0.003, symbol: 'tBNB', display: '~0.003 tBNB (Testnet)' },
            137: { cost: 0.01, symbol: 'MATIC', display: '~0.01 MATIC ($0.01)' },
            43114: { cost: 0.01, symbol: 'AVAX', display: '~0.01 AVAX ($0.30)' },
            250: { cost: 0.1, symbol: 'FTM', display: '~0.1 FTM ($0.10)' }
        };

        const estimate = estimates[chainId] || { cost: 0.01, symbol: 'ETH', display: '~0.01 ETH' };
        
        return {
            network: 'Rede Desconhecida',
            symbol: estimate.symbol,
            gasPrice: '20 gwei',
            gasLimit: 800000,
            estimatedCost: estimate.cost.toFixed(6),
            costDisplay: estimate.display
        };
    }
}

// Manager simplificado para integração
class TokenDeployManager {
    constructor() {
        this.api = new TokenDeployAPI();
        this.deployInProgress = false;
    }

    async deployToken(tokenData) {
        if (this.deployInProgress) {
            throw new Error('Deploy já em andamento');
        }

        this.deployInProgress = true;

        try {
            console.log('🚀 Iniciando deploy via API...');
            
            if (!tokenData.chainId) {
                throw new Error('Chain ID não definido');
            }

            const deployData = {
                tokenName: tokenData.name,
                tokenSymbol: tokenData.symbol,
                decimals: parseInt(tokenData.decimals) || 18,
                totalSupply: tokenData.totalSupply.toString(),
                ownerAddress: tokenData.owner,
                chainId: tokenData.chainId,
                deployerPrivateKey: this.generateDeployerPrivateKey()
            };

            console.log('📤 Dados enviados para API:', deployData);
            const result = await this.api.deployToken(deployData);
            
            return result;
                
        } catch (error) {
            console.error('❌ Erro no deploy via API:', error);
            throw error;
        } finally {
            this.deployInProgress = false;
        }
    }
    
    generateDeployerPrivateKey() {
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers.js não carregado');
        }
        
        const wallet = ethers.Wallet.createRandom();
        return wallet.privateKey;
    }
}

// Log de inicialização
console.log('📡 API de Deploy carregada');
