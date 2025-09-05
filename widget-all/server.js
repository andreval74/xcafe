// Widget SaaS Platform - Servidor Unificado
// Combina backend API + servir arquivos estáticos + widget

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { ethers } = require('ethers');
const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new Database(path.join(__dirname, 'database/widget.db'));

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "*"],
            fontSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"]
        }
    }
}));
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting para APIs
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Servir widget.js com headers especiais
app.get('/widget.js', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'src/widget.js'));
});

// Initialize database
function initializeDatabase() {
    try {
        const initSQL = `
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT UNIQUE NOT NULL,
                credits INTEGER DEFAULT 0,
                total_spent REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            );
            
            -- API Keys table
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                api_key TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                domain TEXT,
                usage_count INTEGER DEFAULT 0,
                rate_limit INTEGER DEFAULT 1000,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            -- Credit packages table
            CREATE TABLE IF NOT EXISTS credit_packages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                credits INTEGER NOT NULL,
                price REAL NOT NULL,
                description TEXT,
                popular BOOLEAN DEFAULT 0
            );
            
            -- USDT transactions table
            CREATE TABLE IF NOT EXISTS usdt_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                package_id INTEGER NOT NULL,
                tx_hash TEXT UNIQUE NOT NULL,
                network TEXT NOT NULL,
                amount_usdt REAL NOT NULL,
                credits INTEGER NOT NULL,
                commission_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                validated_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (package_id) REFERENCES credit_packages (id)
            );
            
            -- Usage logs table
            CREATE TABLE IF NOT EXISTS usage_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                endpoint TEXT,
                credits_used INTEGER DEFAULT 1,
                ip_address TEXT,
                user_agent TEXT,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (api_key_id) REFERENCES api_keys (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            -- Commission history
            CREATE TABLE IF NOT EXISTS commission_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id INTEGER NOT NULL,
                commission_amount REAL NOT NULL,
                platform_wallet TEXT NOT NULL,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transaction_id) REFERENCES usdt_transactions (id)
            );
        `;
        
        db.exec(initSQL);
        
        // Insert default credit packages
        const packagesExist = db.prepare('SELECT COUNT(*) as count FROM credit_packages').get();
        if (packagesExist.count === 0) {
            const insertPackages = db.prepare(`
                INSERT INTO credit_packages (name, credits, price, description, popular)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            insertPackages.run('Basic', 100, 10, 'Ideal para testes e pequenos projetos', 0);
            insertPackages.run('Standard', 500, 40, 'Melhor custo-benefício para uso regular', 1);
            insertPackages.run('Premium', 1000, 70, 'Para projetos de alto volume', 0);
        }
        
        console.log('✅ Database initialized successfully');
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        process.exit(1);
    }
}

// Authentication middleware
function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de autorização necessário' 
        });
    }
    
    const walletAddress = authHeader.substring(7);
    
    if (!ethers.utils.isAddress(walletAddress)) {
        return res.status(401).json({ 
            success: false, 
            message: 'Endereço de carteira inválido' 
        });
    }
    
    try {
        let user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(walletAddress);
        
        if (!user) {
            // Create user if doesn't exist
            const result = db.prepare('INSERT INTO users (wallet_address) VALUES (?)').run(walletAddress);
            user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro de autenticação' 
        });
    }
}

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ===== USER ROUTES =====
app.get('/api/user/profile', authenticateUser, (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT 
                u.credits,
                u.total_spent,
                COUNT(DISTINCT ak.id) as keys,
                COALESCE(SUM(ul.credits_used), 0) as total_usage,
                u.created_at as member_since
            FROM users u
            LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.status = 'active'
            LEFT JOIN usage_logs ul ON u.id = ul.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `).get(req.user.id);
        
        // Usage today
        const usageToday = db.prepare(`
            SELECT COALESCE(SUM(credits_used), 0) as usage_today
            FROM usage_logs 
            WHERE user_id = ? AND DATE(created_at) = DATE('now')
        `).get(req.user.id);
        
        res.json({ 
            success: true,
            stats: {
                ...stats,
                usage_today: usageToday.usage_today
            }
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar perfil'
        });
    }
});

app.get('/api/user/keys', authenticateUser, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const keys = db.prepare(`
            SELECT id, name, api_key, domain, usage_count, rate_limit, status, created_at, last_used
            FROM api_keys 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `).all(req.user.id, limit);
        
        res.json({ success: true, keys });
        
    } catch (error) {
        console.error('Keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar chaves'
        });
    }
});

app.post('/api/user/keys', authenticateUser, (req, res) => {
    const { name, domain, rate_limit = 1000 } = req.body;
    
    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Nome da chave é obrigatório'
        });
    }
    
    try {
        const apiKey = 'wk_' + crypto.randomBytes(32).toString('hex');
        
        const result = db.prepare(`
            INSERT INTO api_keys (user_id, api_key, name, domain, rate_limit)
            VALUES (?, ?, ?, ?, ?)
        `).run(req.user.id, apiKey, name, domain || null, rate_limit);
        
        res.json({
            success: true,
            apiKey,
            message: 'Chave API criada com sucesso'
        });
        
    } catch (error) {
        console.error('Create key error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar chave API'
        });
    }
});

// ===== CREDITS ROUTES =====
app.get('/api/credits/balance', authenticateUser, (req, res) => {
    try {
        const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);
        res.json({
            success: true,
            balance: user ? user.credits : 0
        });
    } catch (error) {
        console.error('Balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar saldo'
        });
    }
});

app.get('/api/credits/usage', authenticateUser, (req, res) => {
    try {
        const dailyUsage = db.prepare(`
            SELECT 
                DATE(created_at) as date,
                SUM(credits_used) as total_used,
                COUNT(*) as transactions
            FROM usage_logs 
            WHERE user_id = ? 
            AND created_at >= datetime('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `).all(req.user.id);
        
        res.json({
            success: true,
            dailyUsage
        });
    } catch (error) {
        console.error('Usage stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter estatísticas'
        });
    }
});

app.get('/api/credits/history', authenticateUser, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        
        const transactions = db.prepare(`
            SELECT 
                ut.tx_hash,
                cp.name as package_name,
                ut.amount_usdt,
                ut.credits,
                ut.status,
                ut.created_at
            FROM usdt_transactions ut
            JOIN credit_packages cp ON ut.package_id = cp.id
            WHERE ut.user_id = ?
            ORDER BY ut.created_at DESC
            LIMIT ?
        `).all(req.user.id, limit);
        
        res.json({ success: true, transactions });
        
    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter histórico'
        });
    }
});

// ===== PAYMENT ROUTES =====
app.get('/api/payment/packages', (req, res) => {
    try {
        const packages = db.prepare('SELECT * FROM credit_packages ORDER BY price').all();
        res.json({ success: true, packages });
    } catch (error) {
        console.error('Packages error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar pacotes'
        });
    }
});

app.post('/api/payment/validate', authenticateUser, async (req, res) => {
    const { txHash, network, packageId, expectedAmount } = req.body;
    
    if (!txHash || !network || !packageId) {
        return res.status(400).json({
            success: false,
            message: 'Dados incompletos'
        });
    }
    
    try {
        // Check if transaction already exists
        const existingTx = db.prepare('SELECT id FROM usdt_transactions WHERE tx_hash = ?').get(txHash);
        if (existingTx) {
            return res.status(400).json({
                success: false,
                message: 'Transação já processada'
            });
        }
        
        // Get package info
        const package = db.prepare('SELECT * FROM credit_packages WHERE id = ?').get(packageId);
        if (!package) {
            return res.status(400).json({
                success: false,
                message: 'Pacote não encontrado'
            });
        }
        
        // Simulate validation (in production, use real blockchain validation)
        const isValid = true; // Replace with actual USDT validation
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Transação inválida'
            });
        }
        
        // Process payment
        const commission = package.price * 0.02; // 2% commission
        
        const result = db.transaction(() => {
            // Add transaction record
            const txResult = db.prepare(`
                INSERT INTO usdt_transactions 
                (user_id, package_id, tx_hash, network, amount_usdt, credits, commission_amount, status, validated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', datetime('now'))
            `).run(req.user.id, packageId, txHash, network, package.price, package.credits, commission);
            
            // Add credits to user
            db.prepare('UPDATE users SET credits = credits + ?, total_spent = total_spent + ? WHERE id = ?')
                .run(package.credits, package.price, req.user.id);
            
            // Record commission
            db.prepare(`
                INSERT INTO commission_history (transaction_id, commission_amount, platform_wallet)
                VALUES (?, ?, ?)
            `).run(txResult.lastInsertRowid, commission, 'platform_wallet_address');
            
            return package.credits;
        })();
        
        res.json({
            success: true,
            creditsAdded: result,
            txHash,
            message: 'Pagamento confirmado!'
        });
        
    } catch (error) {
        console.error('Payment validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao validar pagamento'
        });
    }
});

// ===== WIDGET API ROUTES =====
app.post('/api/widget/create-token', async (req, res) => {
    const { api_key, ...tokenData } = req.body;
    
    if (!api_key) {
        return res.status(401).json({
            success: false,
            error: 'API key required'
        });
    }
    
    try {
        // Validate API key and check credits
        const apiKeyData = db.prepare(`
            SELECT ak.*, u.credits 
            FROM api_keys ak 
            JOIN users u ON ak.user_id = u.id 
            WHERE ak.api_key = ? AND ak.status = 'active'
        `).get(api_key);
        
        if (!apiKeyData) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }
        
        if (apiKeyData.credits < 1) {
            return res.status(402).json({
                success: false,
                error: 'Insufficient credits'
            });
        }
        
        // Consume 1 credit
        db.prepare('UPDATE users SET credits = credits - 1 WHERE id = ?')
            .run(apiKeyData.user_id);
        
        // Log usage
        db.prepare(`
            INSERT INTO usage_logs (api_key_id, user_id, endpoint, credits_used, ip_address, user_agent, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            apiKeyData.id, 
            apiKeyData.user_id, 
            'create-token', 
            1, 
            req.ip, 
            req.get('User-Agent'), 
            JSON.stringify(tokenData)
        );
        
        // Update API key usage
        db.prepare('UPDATE api_keys SET usage_count = usage_count + 1, last_used = datetime("now") WHERE id = ?')
            .run(apiKeyData.id);
        
        // Generate token address (simulation)
        const tokenAddress = '0x' + crypto.randomBytes(20).toString('hex');
        
        res.json({
            success: true,
            tokenAddress,
            transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
            message: 'Token created successfully'
        });
        
    } catch (error) {
        console.error('Widget API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ========== STATIC ROUTES ==========

// Páginas principais
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/recharge', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/recharge.html'));
});

app.get('/api-keys', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/api-keys.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
    });
});

// Initialize and start server
initializeDatabase();

app.listen(PORT, () => {
    console.log(`
🚀 Widget SaaS Platform started!
📦 Server: http://localhost:${PORT}
🌐 Dashboard: http://localhost:${PORT}/dashboard
🔑 API: http://localhost:${PORT}/api/health
📜 Widget: http://localhost:${PORT}/widget.js
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close();
    process.exit(0);
});

module.exports = app;
