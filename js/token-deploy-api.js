/**
 * API Client para deploy de tokens em múltiplas redes
 * Integração com a API hospedada no Render v2.0
 */

class TokenDeployAPI {
    constructor(apiBaseUrl = 'https://xcafe-token-deploy-api.render.com') {
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
            await this.getNetworks(true);
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
            // Fallback para estimativas fixas
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
                estimatedCost: estimate.cost,
                costDisplay: estimate.display
            };
        }
    }
}

// Integração com o progressive flow
class TokenDeployManager {
    constructor() {
        this.api = new TokenDeployAPI();
        this.deployerWallet = null;
        this.deployInProgress = false;
    }

    async initializeDeploy(tokenData, userWallet) {
        if (this.deployInProgress) {
            throw new Error('Deploy já em andamento');
        }

        this.deployInProgress = true;

        try {
            // Gerar wallet temporária para deploy
            this.deployerWallet = this.api.generateDeployerWallet();
            console.log('🔑 Wallet temporária gerada:', this.deployerWallet.address);

            // Solicitar transferência de BNB para a wallet temporária
            const cost = await this.api.estimateDeployCost(tokenData.chainId);
            const totalCost = cost.gas + cost.apiTax;

            const transferAmount = ethers.utils.parseEther(totalCost.toString());

            // Criar transação de transferência
            const transferTx = await userWallet.sendTransaction({
                to: this.deployerWallet.address,
                value: transferAmount,
                gasLimit: 21000 // Gas padrão para transferência
            });

            console.log('💸 Transferindo BNB para wallet temporária...');
            await transferTx.wait();

            // Executar deploy via API
            const deployResult = await this.api.deployToken({
                tokenName: tokenData.name,
                tokenSymbol: tokenData.symbol,
                decimals: tokenData.decimals || 18,
                totalSupply: tokenData.totalSupply,
                ownerAddress: tokenData.ownerAddress,
                chainId: tokenData.chainId,
                deployerPrivateKey: this.deployerWallet.privateKey
            });

            return deployResult;

        } catch (error) {
            console.error('❌ Erro no deploy:', error);
            throw error;
        } finally {
            this.deployInProgress = false;
            // Limpar dados sensíveis
            if (this.deployerWallet) {
                this.deployerWallet.privateKey = null;
                this.deployerWallet = null;
            }
        }
    }

    async monitorTransaction(hash, chainId, onUpdate = null) {
        const maxAttempts = 30; // 5 minutos
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const status = await this.api.getTransactionStatus(hash, chainId);
                
                if (onUpdate) {
                    onUpdate(status);
                }

                if (status.status === 'confirmed' || status.status === 'failed') {
                    return status;
                }

                // Aguardar 10 segundos antes da próxima verificação
                await new Promise(resolve => setTimeout(resolve, 10000));
                attempts++;

            } catch (error) {
                console.error('Erro ao monitorar transação:', error);
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        throw new Error('Timeout: Não foi possível confirmar a transação');
    }
}

// Integrar com o sistema existente
window.TokenDeployAPI = TokenDeployAPI;
window.TokenDeployManager = TokenDeployManager;

console.log('📡 API de Deploy carregada');
