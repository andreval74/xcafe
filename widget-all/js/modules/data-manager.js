/**
 * 🗄️ DATA MANAGER - Gerenciamento de Dados em Arquivo
 * 
 * 📋 RESPONSABILIDADES:
 * - Gerenciar usuários, créditos, transações em arquivo de texto
 * - CRUD completo sem banco de dados
 * - Backup automático e recuperação
 * - Validação e integridade dos dados
 * 
 * 📁 ESTRUTURA DE DADOS:
 * - users.txt: dados dos usuários
 * - credits.txt: saldo de créditos
 * - transactions.txt: histórico de transações
 * - api-keys.txt: chaves de ativação
 * 
 * 🔧 USO:
 * - const dm = new DataManager();
 * - await dm.createUser(wallet, userData);
 * - await dm.getCredits(wallet);
 */

class DataManager {
    constructor() {
        this.dataPath = './data/';
        this.files = {
            users: 'users.txt',
            credits: 'credits.txt', 
            transactions: 'transactions.txt',
            apiKeys: 'api-keys.txt',
            logs: 'system-logs.txt'
        };
        
        this.init();
    }

    // ==================== INICIALIZAÇÃO ====================
    
    /**
     * Inicializa estrutura de arquivos se não existir
     */
    async init() {
        try {
            // Criar arquivos se não existirem
            for (const [key, filename] of Object.entries(this.files)) {
                const filepath = this.dataPath + filename;
                
                if (!await this.fileExists(filepath)) {
                    await this.writeFile(filepath, this.getDefaultContent(key));
                    console.log(`✅ Arquivo criado: ${filename}`);
                }
            }
            
            await this.log('Sistema DataManager inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar DataManager:', error);
        }
    }

    /**
     * Retorna conteúdo padrão para cada tipo de arquivo
     */
    getDefaultContent(type) {
        const headers = {
            users: '# USUÁRIOS DO SISTEMA\n# Formato: WALLET|NOME|EMAIL|DATA_CADASTRO|STATUS\n',
            credits: '# CRÉDITOS DOS USUÁRIOS\n# Formato: WALLET|CREDITOS|TOTAL_GASTO|ULTIMA_ATUALIZACAO\n',
            transactions: '# TRANSAÇÕES DO SISTEMA\n# Formato: ID|WALLET|TIPO|VALOR|CREDITOS|HASH|DATA|STATUS\n',
            apiKeys: '# CHAVES DE API\n# Formato: WALLET|API_KEY|DOMINIO|USO_COUNT|DATA_CRIACAO|STATUS\n',
            logs: '# LOGS DO SISTEMA\n# Formato: DATA|NIVEL|MENSAGEM\n'
        };
        
        return headers[type] || '';
    }

    // ==================== UTILITÁRIOS DE ARQUIVO ====================
    
    /**
     * Verifica se arquivo existe
     */
    async fileExists(filepath) {
        try {
            await fetch(filepath, { method: 'HEAD' });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Lê conteúdo de arquivo
     */
    async readFile(filepath) {
        try {
            const response = await fetch(filepath);
            if (!response.ok) return '';
            return await response.text();
        } catch {
            return '';
        }
    }

    /**
     * Escreve conteúdo em arquivo
     */
    async writeFile(filepath, content) {
        try {
            // Em ambiente web, vamos simular escrita em localStorage
            const key = filepath.replace(this.dataPath, '').replace('.txt', '');
            localStorage.setItem(`widget_data_${key}`, content);
            return true;
        } catch (error) {
            console.error('Erro ao escrever arquivo:', error);
            return false;
        }
    }

    /**
     * Lê arquivo simulado do localStorage
     */
    async readFileFromStorage(filename) {
        try {
            const key = filename.replace('.txt', '');
            const content = localStorage.getItem(`widget_data_${key}`);
            return content || this.getDefaultContent(key);
        } catch {
            return this.getDefaultContent(filename.replace('.txt', ''));
        }
    }

    /**
     * Escreve arquivo simulado no localStorage
     */
    async writeFileToStorage(filename, content) {
        try {
            const key = filename.replace('.txt', '');
            localStorage.setItem(`widget_data_${key}`, content);
            return true;
        } catch {
            return false;
        }
    }

    // ==================== OPERAÇÕES DE USUÁRIO ====================
    
    /**
     * Cria novo usuário
     */
    async createUser(wallet, userData = {}) {
        try {
            const users = await this.readFileFromStorage(this.files.users);
            
            // Verificar se usuário já existe
            if (this.findUserInText(users, wallet)) {
                return { success: false, message: 'Usuário já existe' };
            }

            const newUser = [
                wallet,
                userData.name || 'Usuário',
                userData.email || '',
                new Date().toISOString(),
                'active'
            ].join('|');

            const updatedUsers = users + newUser + '\n';
            await this.writeFileToStorage(this.files.users, updatedUsers);

            // Criar créditos iniciais (5 grátis)
            await this.addCredits(wallet, 5, 'Bônus de cadastro');

            await this.log(`Usuário criado: ${wallet}`);
            return { success: true, user: this.parseUserLine(newUser) };

        } catch (error) {
            await this.log(`Erro ao criar usuário: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }

    /**
     * Busca usuário no texto
     */
    findUserInText(text, wallet) {
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.startsWith('#') || !line.trim()) continue;
            const [userWallet] = line.split('|');
            if (userWallet === wallet) {
                return this.parseUserLine(line);
            }
        }
        return null;
    }

    /**
     * Converte linha de usuário em objeto
     */
    parseUserLine(line) {
        const [wallet, name, email, dateCreated, status] = line.split('|');
        return { wallet, name, email, dateCreated, status };
    }

    /**
     * Obtém dados do usuário
     */
    async getUser(wallet) {
        try {
            const users = await this.readFileFromStorage(this.files.users);
            return this.findUserInText(users, wallet);
        } catch (error) {
            await this.log(`Erro ao buscar usuário: ${error.message}`, 'error');
            return null;
        }
    }

    // ==================== OPERAÇÕES DE CRÉDITOS ====================
    
    /**
     * Obtém saldo de créditos do usuário
     */
    async getCredits(wallet) {
        try {
            const credits = await this.readFileFromStorage(this.files.credits);
            const creditData = this.findCreditInText(credits, wallet);
            return creditData ? parseInt(creditData.credits) : 0;
        } catch (error) {
            await this.log(`Erro ao buscar créditos: ${error.message}`, 'error');
            return 0;
        }
    }

    /**
     * Busca créditos no texto
     */
    findCreditInText(text, wallet) {
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.startsWith('#') || !line.trim()) continue;
            const [userWallet, credits, totalSpent, lastUpdate] = line.split('|');
            if (userWallet === wallet) {
                return { wallet: userWallet, credits, totalSpent, lastUpdate };
            }
        }
        return null;
    }

    /**
     * Adiciona créditos ao usuário
     */
    async addCredits(wallet, amount, description = '') {
        try {
            const credits = await this.readFileFromStorage(this.files.credits);
            const lines = credits.split('\n');
            let found = false;
            
            const updatedLines = lines.map(line => {
                if (line.startsWith('#') || !line.trim()) return line;
                
                const [userWallet, currentCredits, totalSpent, lastUpdate] = line.split('|');
                if (userWallet === wallet) {
                    found = true;
                    const newCredits = parseInt(currentCredits || 0) + amount;
                    return [userWallet, newCredits, totalSpent || 0, new Date().toISOString()].join('|');
                }
                return line;
            });

            // Se usuário não encontrado, adicionar nova linha
            if (!found) {
                updatedLines.push([wallet, amount, 0, new Date().toISOString()].join('|'));
            }

            await this.writeFileToStorage(this.files.credits, updatedLines.join('\n'));

            // Registrar transação
            await this.addTransaction(wallet, 'credit_purchase', amount, 0, '', description);

            await this.log(`Créditos adicionados: ${wallet} +${amount}`);
            return { success: true, newBalance: await this.getCredits(wallet) };

        } catch (error) {
            await this.log(`Erro ao adicionar créditos: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }

    /**
     * Consome créditos do usuário
     */
    async consumeCredits(wallet, amount, description = '') {
        try {
            const currentCredits = await this.getCredits(wallet);
            
            if (currentCredits < amount) {
                return { success: false, message: 'Créditos insuficientes' };
            }

            const credits = await this.readFileFromStorage(this.files.credits);
            const lines = credits.split('\n');
            
            const updatedLines = lines.map(line => {
                if (line.startsWith('#') || !line.trim()) return line;
                
                const [userWallet, currentCredits, totalSpent, lastUpdate] = line.split('|');
                if (userWallet === wallet) {
                    const newCredits = parseInt(currentCredits) - amount;
                    const newTotalSpent = parseFloat(totalSpent || 0) + amount;
                    return [userWallet, newCredits, newTotalSpent, new Date().toISOString()].join('|');
                }
                return line;
            });

            await this.writeFileToStorage(this.files.credits, updatedLines.join('\n'));

            // Registrar transação
            await this.addTransaction(wallet, 'credit_consumption', 0, amount, '', description);

            await this.log(`Créditos consumidos: ${wallet} -${amount}`);
            return { success: true, newBalance: await this.getCredits(wallet) };

        } catch (error) {
            await this.log(`Erro ao consumir créditos: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }

    // ==================== OPERAÇÕES DE TRANSAÇÕES ====================
    
    /**
     * Adiciona nova transação
     */
    async addTransaction(wallet, type, value, credits, hash, description = '') {
        try {
            const transactions = await this.readFileFromStorage(this.files.transactions);
            const id = Date.now().toString();
            
            const newTransaction = [
                id,
                wallet,
                type,
                value,
                credits,
                hash,
                new Date().toISOString(),
                description
            ].join('|');

            const updatedTransactions = transactions + newTransaction + '\n';
            await this.writeFileToStorage(this.files.transactions, updatedTransactions);

            return { success: true, id };

        } catch (error) {
            await this.log(`Erro ao adicionar transação: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtém histórico de transações do usuário
     */
    async getUserTransactions(wallet, limit = 50) {
        try {
            const transactions = await this.readFileFromStorage(this.files.transactions);
            const lines = transactions.split('\n');
            const userTransactions = [];

            for (const line of lines) {
                if (line.startsWith('#') || !line.trim()) continue;
                
                const [id, userWallet, type, value, credits, hash, date, description] = line.split('|');
                if (userWallet === wallet) {
                    userTransactions.push({
                        id, wallet: userWallet, type, value, credits, hash, date, description
                    });
                }
            }

            // Ordenar por data (mais recente primeiro) e limitar
            return userTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, limit);

        } catch (error) {
            await this.log(`Erro ao buscar transações: ${error.message}`, 'error');
            return [];
        }
    }

    // ==================== OPERAÇÕES DE API KEYS ====================
    
    /**
     * Gera nova chave de API
     */
    async generateApiKey(wallet, domain = '') {
        try {
            const apiKey = this.generateRandomKey(32);
            const apiKeys = await this.readFileFromStorage(this.files.apiKeys);
            
            const newApiKey = [
                wallet,
                apiKey,
                domain,
                0, // uso count
                new Date().toISOString(),
                'active'
            ].join('|');

            const updatedApiKeys = apiKeys + newApiKey + '\n';
            await this.writeFileToStorage(this.files.apiKeys, updatedApiKeys);

            await this.log(`API Key gerada: ${wallet}`);
            return { success: true, apiKey };

        } catch (error) {
            await this.log(`Erro ao gerar API Key: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }

    /**
     * Valida chave de API
     */
    async validateApiKey(apiKey) {
        try {
            const apiKeys = await this.readFileFromStorage(this.files.apiKeys);
            const lines = apiKeys.split('\n');

            for (const line of lines) {
                if (line.startsWith('#') || !line.trim()) continue;
                
                const [wallet, key, domain, useCount, dateCreated, status] = line.split('|');
                if (key === apiKey && status === 'active') {
                    return {
                        valid: true,
                        wallet,
                        domain,
                        useCount: parseInt(useCount)
                    };
                }
            }

            return { valid: false };

        } catch (error) {
            await this.log(`Erro ao validar API Key: ${error.message}`, 'error');
            return { valid: false };
        }
    }

    /**
     * Incrementa uso da API Key
     */
    async incrementApiKeyUsage(apiKey) {
        try {
            const apiKeys = await this.readFileFromStorage(this.files.apiKeys);
            const lines = apiKeys.split('\n');
            
            const updatedLines = lines.map(line => {
                if (line.startsWith('#') || !line.trim()) return line;
                
                const [wallet, key, domain, useCount, dateCreated, status] = line.split('|');
                if (key === apiKey) {
                    const newUseCount = parseInt(useCount) + 1;
                    return [wallet, key, domain, newUseCount, dateCreated, status].join('|');
                }
                return line;
            });

            await this.writeFileToStorage(this.files.apiKeys, updatedLines.join('\n'));
            return { success: true };

        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ==================== UTILITÁRIOS ====================
    
    /**
     * Gera chave aleatória
     */
    generateRandomKey(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Adiciona log ao sistema
     */
    async log(message, level = 'info') {
        try {
            const logs = await this.readFileFromStorage(this.files.logs);
            const logEntry = [
                new Date().toISOString(),
                level.toUpperCase(),
                message
            ].join('|');

            const updatedLogs = logs + logEntry + '\n';
            await this.writeFileToStorage(this.files.logs, updatedLogs);

            console.log(`[${level.toUpperCase()}] ${message}`);

        } catch (error) {
            console.error('Erro ao salvar log:', error);
        }
    }

    /**
     * Obtém estatísticas do sistema
     */
    async getSystemStats() {
        try {
            const users = await this.readFileFromStorage(this.files.users);
            const transactions = await this.readFileFromStorage(this.files.transactions);
            
            const userCount = users.split('\n').filter(line => 
                !line.startsWith('#') && line.trim()
            ).length;

            const transactionCount = transactions.split('\n').filter(line => 
                !line.startsWith('#') && line.trim()
            ).length;

            return {
                totalUsers: userCount,
                totalTransactions: transactionCount,
                systemVersion: '1.0.0',
                lastUpdate: new Date().toISOString()
            };

        } catch (error) {
            return {
                totalUsers: 0,
                totalTransactions: 0,
                systemVersion: '1.0.0',
                lastUpdate: new Date().toISOString()
            };
        }
    }

    /**
     * Backup dos dados do sistema
     */
    async createBackup() {
        try {
            const backup = {};
            
            for (const [key, filename] of Object.entries(this.files)) {
                backup[key] = await this.readFileFromStorage(filename);
            }

            const backupData = JSON.stringify(backup, null, 2);
            const backupKey = `widget_backup_${Date.now()}`;
            localStorage.setItem(backupKey, backupData);

            await this.log('Backup criado com sucesso');
            return { success: true, backupKey };

        } catch (error) {
            await this.log(`Erro ao criar backup: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
