/**
 * 📝 CONTRACT MANAGER - Gerenciamento de Contratos e API Keys
 * 
 * 📋 RESPONSABILIDADES:
 * - Cadastrar novos contratos de venda
 * - Gerar API Keys únicas para cada contrato
 * - Validar propriedade do contrato
 * - Gerenciar configurações de porcentagem
 * - Rastrear uso das APIs
 * 
 * 🔧 ESTRUTURA:
 * - Cada contrato gera uma API Key única
 * - Validação de propriedade via wallet
 * - Sistema de porcentagem descentralizado
 * 
 * 💡 USO:
 * - const cm = new ContractManager();
 * - await cm.registerContract(contractAddress, ownerWallet);
 * - await cm.generateApiKey(contractAddress);
 */

class ContractManager {
    constructor() {
        this.storageKey = 'xcafe_contracts';
        this.contracts = this.loadContracts();
        this.defaultConfig = {
            platformFee: 2.5, // 2.5% fee padrão
            minTransactionValue: 0.001, // ETH
            enabled: true
        };
    }

    // ==================== INICIALIZAÇÃO ====================
    
    /**
     * Carrega contratos do localStorage
     */
    loadContracts() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('❌ Erro ao carregar contratos:', error);
            return {};
        }
    }

    /**
     * Salva contratos no localStorage
     */
    saveContracts() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.contracts));
            console.log('✅ Contratos salvos');
        } catch (error) {
            console.error('❌ Erro ao salvar contratos:', error);
        }
    }

    // ==================== REGISTRO DE CONTRATOS ====================
    
    /**
     * Registra um novo contrato de venda
     */
    async registerContract(contractData) {
        try {
            const { 
                contractAddress, 
                ownerWallet, 
                contractName,
                tokenSymbol,
                description,
                website,
                category = 'token'
            } = contractData;

            // Validar dados obrigatórios
            if (!contractAddress || !ownerWallet) {
                throw new Error('Endereço do contrato e wallet são obrigatórios');
            }

            // Verificar se contrato já existe
            if (this.contracts[contractAddress]) {
                throw new Error('Contrato já registrado');
            }

            // Validar propriedade do contrato (simulado - em produção usar Web3)
            const isOwner = await this.validateContractOwnership(contractAddress, ownerWallet);
            if (!isOwner) {
                throw new Error('Wallet não é proprietária do contrato');
            }

            // Gerar API Key única
            const apiKey = this.generateApiKey();

            // Criar registro do contrato
            const contractRecord = {
                address: contractAddress,
                owner: ownerWallet,
                name: contractName || 'Contrato sem nome',
                symbol: tokenSymbol || '',
                description: description || '',
                website: website || '',
                category: category,
                apiKey: apiKey,
                config: { ...this.defaultConfig },
                stats: {
                    totalSales: 0,
                    totalVolume: 0,
                    totalFees: 0,
                    apiCalls: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active'
            };

            // Salvar contrato
            this.contracts[contractAddress] = contractRecord;
            this.saveContracts();

            console.log('✅ Contrato registrado:', contractAddress);
            return {
                success: true,
                contract: contractRecord,
                message: 'Contrato registrado com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao registrar contrato:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gera uma API Key única
     */
    generateApiKey() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        const prefix = 'xcafe';
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Valida propriedade do contrato
     * TODO: Implementar validação real via Web3
     */
    async validateContractOwnership(contractAddress, wallet) {
        try {
            // Simulação - em produção usar Web3 para verificar owner()
            if (window.web3Manager && window.web3Manager.isConnected()) {
                // Implementar verificação real aqui
                console.log('🔍 Validando propriedade do contrato...');
                return true; // Temporário
            }
            return true; // Dev mode
        } catch (error) {
            console.error('❌ Erro na validação:', error);
            return false;
        }
    }

    // ==================== BUSCA E LISTAGEM ====================
    
    /**
     * Lista contratos do usuário
     */
    getUserContracts(walletAddress) {
        try {
            const userContracts = Object.values(this.contracts)
                .filter(contract => contract.owner.toLowerCase() === walletAddress.toLowerCase())
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return {
                success: true,
                contracts: userContracts,
                total: userContracts.length
            };
        } catch (error) {
            console.error('❌ Erro ao buscar contratos:', error);
            return {
                success: false,
                error: error.message,
                contracts: []
            };
        }
    }

    /**
     * Busca contrato por endereço
     */
    getContract(contractAddress) {
        return this.contracts[contractAddress] || null;
    }

    /**
     * Busca contrato por API Key
     */
    getContractByApiKey(apiKey) {
        return Object.values(this.contracts)
            .find(contract => contract.apiKey === apiKey) || null;
    }

    // ==================== CONFIGURAÇÕES ====================
    
    /**
     * Atualiza configurações do contrato
     */
    updateContractConfig(contractAddress, newConfig) {
        try {
            const contract = this.contracts[contractAddress];
            if (!contract) {
                throw new Error('Contrato não encontrado');
            }

            contract.config = { ...contract.config, ...newConfig };
            contract.updatedAt = new Date().toISOString();
            
            this.saveContracts();

            return {
                success: true,
                config: contract.config,
                message: 'Configurações atualizadas'
            };
        } catch (error) {
            console.error('❌ Erro ao atualizar config:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Regenera API Key
     */
    regenerateApiKey(contractAddress, ownerWallet) {
        try {
            const contract = this.contracts[contractAddress];
            if (!contract) {
                throw new Error('Contrato não encontrado');
            }

            if (contract.owner.toLowerCase() !== ownerWallet.toLowerCase()) {
                throw new Error('Apenas o proprietário pode regenerar a API Key');
            }

            const newApiKey = this.generateApiKey();
            contract.apiKey = newApiKey;
            contract.updatedAt = new Date().toISOString();
            
            this.saveContracts();

            return {
                success: true,
                apiKey: newApiKey,
                message: 'API Key regenerada com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro ao regenerar API Key:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== ESTATÍSTICAS ====================
    
    /**
     * Atualiza estatísticas do contrato
     */
    updateStats(contractAddress, statsUpdate) {
        try {
            const contract = this.contracts[contractAddress];
            if (!contract) return false;

            // Atualizar estatísticas
            if (statsUpdate.sale) {
                contract.stats.totalSales += 1;
                contract.stats.totalVolume += statsUpdate.sale.volume || 0;
                contract.stats.totalFees += statsUpdate.sale.fee || 0;
            }

            if (statsUpdate.apiCall) {
                contract.stats.apiCalls += 1;
            }

            contract.updatedAt = new Date().toISOString();
            this.saveContracts();

            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar stats:', error);
            return false;
        }
    }

    /**
     * Gera relatório de estatísticas
     */
    getContractStats(contractAddress) {
        const contract = this.contracts[contractAddress];
        if (!contract) return null;

        return {
            contract: {
                address: contract.address,
                name: contract.name,
                symbol: contract.symbol
            },
            stats: contract.stats,
            config: contract.config,
            period: {
                createdAt: contract.createdAt,
                updatedAt: contract.updatedAt
            }
        };
    }

    // ==================== VALIDAÇÃO DE API ====================
    
    /**
     * Valida API Key para uso
     */
    validateApiKey(apiKey, requestData = {}) {
        try {
            const contract = this.getContractByApiKey(apiKey);
            if (!contract) {
                return {
                    valid: false,
                    error: 'API Key inválida'
                };
            }

            if (contract.status !== 'active') {
                return {
                    valid: false,
                    error: 'Contrato inativo'
                };
            }

            // Registrar uso da API
            this.updateStats(contract.address, { apiCall: true });

            return {
                valid: true,
                contract: {
                    address: contract.address,
                    name: contract.name,
                    config: contract.config
                }
            };
        } catch (error) {
            console.error('❌ Erro na validação da API Key:', error);
            return {
                valid: false,
                error: 'Erro interno'
            };
        }
    }

    // ==================== UTILITÁRIOS ====================
    
    /**
     * Remove contrato (soft delete)
     */
    removeContract(contractAddress, ownerWallet) {
        try {
            const contract = this.contracts[contractAddress];
            if (!contract) {
                throw new Error('Contrato não encontrado');
            }

            if (contract.owner.toLowerCase() !== ownerWallet.toLowerCase()) {
                throw new Error('Apenas o proprietário pode remover o contrato');
            }

            contract.status = 'removed';
            contract.updatedAt = new Date().toISOString();
            
            this.saveContracts();

            return {
                success: true,
                message: 'Contrato removido com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro ao remover contrato:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Exporta dados dos contratos
     */
    exportData(walletAddress) {
        const userContracts = this.getUserContracts(walletAddress);
        return {
            timestamp: new Date().toISOString(),
            wallet: walletAddress,
            contracts: userContracts.contracts,
            summary: {
                total: userContracts.total,
                active: userContracts.contracts.filter(c => c.status === 'active').length,
                totalVolume: userContracts.contracts.reduce((sum, c) => sum + c.stats.totalVolume, 0),
                totalFees: userContracts.contracts.reduce((sum, c) => sum + c.stats.totalFees, 0)
            }
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ContractManager = ContractManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContractManager;
}

console.log('✅ ContractManager carregado');
