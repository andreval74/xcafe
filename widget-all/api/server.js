const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ==================== CONFIGURAÇÃO DO SERVIDOR ====================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 requests por IP
    message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ==================== SISTEMA DE DADOS ====================

class DataManager {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.ensureDataDirectory();
    }

    async ensureDataDirectory() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            console.log('📁 Diretório de dados criado/verificado');
        } catch (error) {
            console.error('❌ Erro ao criar diretório de dados:', error);
        }
    }

    async readFile(filename) {
        try {
            const filePath = path.join(this.dataDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Arquivo não existe, retornar estrutura vazia
            return this.getEmptyStructure(filename);
        }
    }

    async writeFile(filename, data) {
        try {
            const filePath = path.join(this.dataDir, filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`❌ Erro ao escrever arquivo ${filename}:`, error);
            return false;
        }
    }

    getEmptyStructure(filename) {
        const structures = {
            'users.json': {},
            'widgets.json': {},
            'transactions.json': [],
            'credits.json': {},
            'api_keys.json': {},
            'system_stats.json': {
                totalUsers: 0,
                totalWidgets: 0,
                totalTransactions: 0,
                totalVolume: 0,
                totalCredits: 0
            }
        };
        return structures[filename] || {};
    }

    // Gerar ID único
    generateId() {
        return crypto.randomBytes(16).toString('hex');
    }

    // Gerar API Key
    generateApiKey() {
        return 'wgt_' + crypto.randomBytes(24).toString('hex');
    }

    // Validar API Key
    async validateApiKey(apiKey) {
        const apiKeys = await this.readFile('api_keys.json');
        return apiKeys[apiKey] || null;
    }

    // Gerenciar usuários
    async createUser(walletAddress) {
        const users = await this.readFile('users.json');
        
        if (users[walletAddress]) {
            return { success: false, error: 'Usuário já existe' };
        }

        const apiKey = this.generateApiKey();
        const userData = {
            walletAddress,
            apiKey,
            credits: 0,
            widgets: [],
            transactions: [],
            profile: {
                displayName: '',
                email: ''
            },
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        users[walletAddress] = userData;
        
        // Salvar API Key
        const apiKeys = await this.readFile('api_keys.json');
        apiKeys[apiKey] = walletAddress;
        
        await this.writeFile('users.json', users);
        await this.writeFile('api_keys.json', apiKeys);

        // Atualizar estatísticas
        await this.updateSystemStats('totalUsers', 1);

        return { success: true, data: userData };
    }

    async getUser(walletAddress) {
        const users = await this.readFile('users.json');
        return users[walletAddress] || null;
    }

    async updateUser(walletAddress, updateData) {
        const users = await this.readFile('users.json');
        
        if (!users[walletAddress]) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        users[walletAddress] = { ...users[walletAddress], ...updateData };
        await this.writeFile('users.json', users);

        return { success: true, data: users[walletAddress] };
    }

    // Gerenciar créditos
    async addCredits(walletAddress, amount, transactionData = {}) {
        const users = await this.readFile('users.json');
        
        if (!users[walletAddress]) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        users[walletAddress].credits += amount;
        
        // Registrar transação de crédito
        const creditRecord = {
            id: this.generateId(),
            walletAddress,
            type: 'purchase',
            amount,
            cost: transactionData.cost || 0,
            status: 'completed',
            timestamp: new Date().toISOString(),
            transactionHash: transactionData.hash || null
        };

        const credits = await this.readFile('credits.json');
        if (!credits[walletAddress]) credits[walletAddress] = [];
        credits[walletAddress].push(creditRecord);

        await this.writeFile('users.json', users);
        await this.writeFile('credits.json', credits);

        // Atualizar estatísticas
        await this.updateSystemStats('totalCredits', amount);

        return { success: true, newBalance: users[walletAddress].credits };
    }

    async consumeCredits(walletAddress, amount, widgetId) {
        const users = await this.readFile('users.json');
        
        if (!users[walletAddress]) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        if (users[walletAddress].credits < amount) {
            return { success: false, error: 'Créditos insuficientes' };
        }

        users[walletAddress].credits -= amount;

        // Registrar uso de crédito
        const creditRecord = {
            id: this.generateId(),
            walletAddress,
            type: 'usage',
            amount: -amount,
            widgetId,
            status: 'completed',
            timestamp: new Date().toISOString()
        };

        const credits = await this.readFile('credits.json');
        if (!credits[walletAddress]) credits[walletAddress] = [];
        credits[walletAddress].push(creditRecord);

        await this.writeFile('users.json', users);
        await this.writeFile('credits.json', credits);

        return { success: true, newBalance: users[walletAddress].credits };
    }

    // Gerenciar widgets
    async createWidget(walletAddress, widgetData) {
        const users = await this.readFile('users.json');
        
        if (!users[walletAddress]) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const widget = {
            id: this.generateId(),
            ...widgetData,
            ownerAddress: walletAddress,
            active: true,
            sales: 0,
            revenue: 0,
            createdAt: new Date().toISOString()
        };

        // Adicionar widget ao usuário
        users[walletAddress].widgets.push(widget.id);

        // Salvar widget
        const widgets = await this.readFile('widgets.json');
        widgets[widget.id] = widget;

        await this.writeFile('users.json', users);
        await this.writeFile('widgets.json', widgets);

        // Atualizar estatísticas
        await this.updateSystemStats('totalWidgets', 1);

        return { success: true, data: widget };
    }

    async getWidget(widgetId) {
        const widgets = await this.readFile('widgets.json');
        return widgets[widgetId] || null;
    }

    async updateWidget(widgetId, updateData) {
        const widgets = await this.readFile('widgets.json');
        
        if (!widgets[widgetId]) {
            return { success: false, error: 'Widget não encontrado' };
        }

        widgets[widgetId] = { ...widgets[widgetId], ...updateData };
        await this.writeFile('widgets.json', widgets);

        return { success: true, data: widgets[widgetId] };
    }

    async getUserWidgets(walletAddress) {
        const users = await this.readFile('users.json');
        const widgets = await this.readFile('widgets.json');
        
        if (!users[walletAddress]) {
            return [];
        }

        return users[walletAddress].widgets.map(widgetId => widgets[widgetId]).filter(Boolean);
    }

    // Gerenciar transações
    async createTransaction(transactionData) {
        const transaction = {
            id: this.generateId(),
            ...transactionData,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        const transactions = await this.readFile('transactions.json');
        transactions.push(transaction);

        await this.writeFile('transactions.json', transactions);

        // Atualizar estatísticas
        await this.updateSystemStats('totalTransactions', 1);
        await this.updateSystemStats('totalVolume', transaction.amount || 0);

        return { success: true, data: transaction };
    }

    async updateTransaction(transactionId, updateData) {
        const transactions = await this.readFile('transactions.json');
        const index = transactions.findIndex(tx => tx.id === transactionId);
        
        if (index === -1) {
            return { success: false, error: 'Transação não encontrada' };
        }

        transactions[index] = { ...transactions[index], ...updateData };
        await this.writeFile('transactions.json', transactions);

        return { success: true, data: transactions[index] };
    }

    async getUserTransactions(walletAddress) {
        const transactions = await this.readFile('transactions.json');
        return transactions.filter(tx => 
            tx.buyerAddress === walletAddress || tx.sellerAddress === walletAddress
        );
    }

    // Estatísticas do sistema
    async updateSystemStats(key, increment) {
        const stats = await this.readFile('system_stats.json');
        stats[key] = (stats[key] || 0) + increment;
        await this.writeFile('system_stats.json', stats);
    }

    async getSystemStats() {
        return await this.readFile('system_stats.json');
    }
}

// ==================== MIDDLEWARES ====================

const dataManager = new DataManager();

// Middleware de autenticação
const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API Key obrigatória' });
    }

    const walletAddress = await dataManager.validateApiKey(apiKey);
    if (!walletAddress) {
        return res.status(401).json({ error: 'API Key inválida' });
    }

    req.walletAddress = walletAddress;
    req.apiKey = apiKey;
    next();
};

// Middleware de validação
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== ROTAS DA API ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Estatísticas públicas
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await dataManager.getSystemStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// ==================== ROTAS DE USUÁRIO ====================

// Criar usuário
app.post('/api/users/register', [
    body('walletAddress').isLength({ min: 42, max: 42 }).withMessage('Endereço de carteira inválido')
], validate, async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const result = await dataManager.createUser(walletAddress.toLowerCase());
        
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter dados do usuário
app.get('/api/users/me', authenticateApiKey, async (req, res) => {
    try {
        const userData = await dataManager.getUser(req.walletAddress);
        if (!userData) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Remover dados sensíveis
        const { apiKey, ...safeUserData } = userData;
        res.json(safeUserData);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
});

// Atualizar perfil
app.put('/api/users/profile', authenticateApiKey, [
    body('displayName').optional().isLength({ max: 100 }),
    body('email').optional().isEmail()
], validate, async (req, res) => {
    try {
        const { displayName, email } = req.body;
        const updateData = {
            profile: { displayName, email }
        };

        const result = await dataManager.updateUser(req.walletAddress, updateData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});

// ==================== ROTAS DE CRÉDITOS ====================

// Comprar créditos
app.post('/api/credits/purchase', authenticateApiKey, [
    body('amount').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que 0'),
    body('cost').isFloat({ min: 0 }).withMessage('Custo deve ser maior ou igual a 0'),
    body('transactionHash').optional().isString()
], validate, async (req, res) => {
    try {
        const { amount, cost, transactionHash } = req.body;
        
        const result = await dataManager.addCredits(req.walletAddress, amount, {
            cost,
            hash: transactionHash
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar compra de créditos' });
    }
});

// Histórico de créditos
app.get('/api/credits/history', authenticateApiKey, async (req, res) => {
    try {
        const credits = await dataManager.readFile('credits.json');
        const userCredits = credits[req.walletAddress] || [];
        res.json(userCredits);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico de créditos' });
    }
});

// ==================== ROTAS DE WIDGETS ====================

// Criar widget
app.post('/api/widgets', authenticateApiKey, [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Nome é obrigatório'),
    body('tokenAddress').isLength({ min: 42, max: 42 }).withMessage('Endereço do token inválido'),
    body('price').isFloat({ min: 0 }).withMessage('Preço deve ser maior que 0'),
    body('network').isInt().withMessage('Rede blockchain obrigatória'),
    body('minPurchase').optional().isFloat({ min: 0 }),
    body('maxPurchase').optional().isFloat({ min: 0 }),
    body('theme').optional().isIn(['light', 'dark', 'blue', 'green']),
    body('description').optional().isLength({ max: 500 })
], validate, async (req, res) => {
    try {
        const widgetData = req.body;
        const result = await dataManager.createWidget(req.walletAddress, widgetData);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar widget' });
    }
});

// Listar widgets do usuário
app.get('/api/widgets', authenticateApiKey, async (req, res) => {
    try {
        const widgets = await dataManager.getUserWidgets(req.walletAddress);
        res.json(widgets);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar widgets' });
    }
});

// Obter widget específico
app.get('/api/widgets/:id', async (req, res) => {
    try {
        const widget = await dataManager.getWidget(req.params.id);
        if (!widget) {
            return res.status(404).json({ error: 'Widget não encontrado' });
        }

        // Verificar se é público ou se o usuário é o dono
        const isOwner = req.walletAddress && req.walletAddress === widget.ownerAddress;
        
        if (!widget.active && !isOwner) {
            return res.status(404).json({ error: 'Widget não encontrado' });
        }

        res.json(widget);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar widget' });
    }
});

// Atualizar widget
app.put('/api/widgets/:id', authenticateApiKey, async (req, res) => {
    try {
        const widget = await dataManager.getWidget(req.params.id);
        
        if (!widget || widget.ownerAddress !== req.walletAddress) {
            return res.status(404).json({ error: 'Widget não encontrado' });
        }

        const result = await dataManager.updateWidget(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar widget' });
    }
});

// ==================== ROTAS DE TRANSAÇÕES ====================

// Iniciar transação (para o widget)
app.post('/api/transactions', [
    body('widgetId').isString().withMessage('Widget ID obrigatório'),
    body('buyerAddress').isLength({ min: 42, max: 42 }).withMessage('Endereço do comprador inválido'),
    body('quantity').isFloat({ min: 0 }).withMessage('Quantidade deve ser maior que 0'),
    body('amount').isFloat({ min: 0 }).withMessage('Valor deve ser maior que 0')
], validate, async (req, res) => {
    try {
        const { widgetId, buyerAddress, quantity, amount } = req.body;
        
        // Verificar widget
        const widget = await dataManager.getWidget(widgetId);
        if (!widget || !widget.active) {
            return res.status(404).json({ error: 'Widget não encontrado ou inativo' });
        }

        // Verificar se o dono do widget tem créditos
        const owner = await dataManager.getUser(widget.ownerAddress);
        if (!owner || owner.credits < 1) {
            return res.status(400).json({ error: 'Créditos insuficientes para processar transação' });
        }

        // Consumir 1 crédito
        await dataManager.consumeCredits(widget.ownerAddress, 1, widgetId);

        // Criar transação
        const transactionData = {
            widgetId,
            widgetName: widget.name,
            sellerAddress: widget.ownerAddress,
            buyerAddress: buyerAddress.toLowerCase(),
            tokenAddress: widget.tokenAddress,
            quantity,
            amount,
            price: widget.price,
            network: widget.network
        };

        const result = await dataManager.createTransaction(transactionData);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar transação' });
    }
});

// Atualizar status da transação
app.put('/api/transactions/:id', authenticateApiKey, [
    body('status').isIn(['pending', 'completed', 'failed']).withMessage('Status inválido'),
    body('transactionHash').optional().isString()
], validate, async (req, res) => {
    try {
        const { status, transactionHash } = req.body;
        
        const result = await dataManager.updateTransaction(req.params.id, {
            status,
            transactionHash,
            updatedAt: new Date().toISOString()
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar transação' });
    }
});

// Listar transações do usuário
app.get('/api/transactions', authenticateApiKey, async (req, res) => {
    try {
        const transactions = await dataManager.getUserTransactions(req.walletAddress);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
});

// ==================== ROTAS ESPECIAIS PARA WIDGET ====================

// Validar widget para exibição (rota pública)
app.get('/api/widget/validate/:id', async (req, res) => {
    try {
        const widget = await dataManager.getWidget(req.params.id);
        
        if (!widget || !widget.active) {
            return res.status(404).json({ error: 'Widget não encontrado' });
        }

        // Verificar se o dono tem créditos
        const owner = await dataManager.getUser(widget.ownerAddress);
        const hasCredits = owner && owner.credits > 0;

        res.json({
            valid: true,
            hasCredits,
            widget: {
                id: widget.id,
                name: widget.name,
                tokenAddress: widget.tokenAddress,
                price: widget.price,
                network: widget.network,
                minPurchase: widget.minPurchase,
                maxPurchase: widget.maxPurchase,
                theme: widget.theme,
                description: widget.description
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao validar widget' });
    }
});

// ==================== ROTAS DE ARQUIVO ESTÁTICO ====================

// Servir widget JavaScript
app.get('/widget.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'src', 'widget-sale.js'));
});

// ==================== TRATAMENTO DE ERROS ====================

app.use((err, req, res, next) => {
    console.error('❌ Erro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// ==================== INICIALIZAÇÃO DO SERVIDOR ====================

app.listen(PORT, () => {
    console.log(`🚀 Servidor Widget SaaS rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}/api`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Estatísticas: http://localhost:${PORT}/api/stats`);
});

module.exports = app;
