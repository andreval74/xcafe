// Main Backend Server for Widget SaaS Platform
// Node.js + Express + SQLite

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
const db = new Database(path.join(__dirname, '../database/widget.db'));

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
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:8080'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize database tables
function initializeDatabase() {
    try {
        // Users table
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT UNIQUE NOT NULL,
                credits INTEGER DEFAULT 0,
                total_spent REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        `);
        
        // API Keys table
        db.exec(`
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
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);
        
        // Transactions table
        db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL, -- 'purchase', 'usage', 'refund'
                credits INTEGER NOT NULL,
                amount REAL,
                transaction_hash TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);
        
        // Usage logs table
        db.exec(`
            CREATE TABLE IF NOT EXISTS usage_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                endpoint TEXT,
                credits_used INTEGER DEFAULT 1,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (api_key_id) REFERENCES api_keys (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);
        
        // Admin users table
        db.exec(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT UNIQUE NOT NULL,
                role TEXT DEFAULT 'admin',
                permissions TEXT, -- JSON string
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Database initialized successfully');
        
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

// Authentication middleware
function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const walletAddress = authHeader.substring(7);
    
    if (!ethers.utils.isAddress(walletAddress)) {
        return res.status(401).json({ error: 'Invalid wallet address' });
    }
    
    // Get or create user
    let user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(walletAddress);
    
    if (!user) {
        const insertUser = db.prepare(`
            INSERT INTO users (wallet_address) 
            VALUES (?)
        `);
        const result = insertUser.run(walletAddress);
        user = { id: result.lastInsertRowid, wallet_address: walletAddress, credits: 0 };
    }
    
    req.user = user;
    next();
}

// API key authentication middleware
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    
    const keyData = db.prepare(`
        SELECT ak.*, u.credits 
        FROM api_keys ak 
        JOIN users u ON ak.user_id = u.id 
        WHERE ak.api_key = ? AND ak.status = 'active'
    `).get(apiKey);
    
    if (!keyData) {
        return res.status(401).json({ error: 'Invalid or inactive API key' });
    }
    
    if (keyData.credits <= 0) {
        return res.status(402).json({ error: 'Insufficient credits' });
    }
    
    req.apiKey = keyData;
    next();
}

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const walletAddress = authHeader.substring(7);
    
    const admin = db.prepare('SELECT * FROM admin_users WHERE wallet_address = ?').get(walletAddress);
    
    if (!admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.admin = admin;
    next();
}

// Import route modules
const creditsRoutes = require('./routes/credits');

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Credits routes
app.use('/api/credits', creditsRoutes);

// User routes
app.get('/api/user/profile', authenticateUser, (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT 
                u.credits,
                COUNT(DISTINCT ak.id) as keys,
                COALESCE(SUM(ul.credits_used), 0) as usage,
                u.created_at as member_since
            FROM users u
            LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.status = 'active'
            LEFT JOIN usage_logs ul ON u.id = ul.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `).get(req.user.id);
        
        res.json({ stats });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/overview', authenticateUser, (req, res) => {
    try {
        // Usage chart data (last 30 days)
        const usageData = db.prepare(`
            SELECT 
                DATE(created_at) as date,
                SUM(credits_used) as credits
            FROM usage_logs 
            WHERE user_id = ? AND created_at >= date('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date
        `).all(req.user.id);
        
        // Distribution data
        const distributionData = db.prepare(`
            SELECT 
                ak.name,
                SUM(ul.credits_used) as usage
            FROM usage_logs ul
            JOIN api_keys ak ON ul.api_key_id = ak.id
            WHERE ul.user_id = ? AND ul.created_at >= date('now', '-30 days')
            GROUP BY ak.id
            ORDER BY usage DESC
            LIMIT 4
        `).all(req.user.id);
        
        res.json({
            usage: {
                labels: usageData.map(d => d.date),
                data: usageData.map(d => d.credits)
            },
            distribution: {
                labels: distributionData.map(d => d.name),
                data: distributionData.map(d => d.usage)
            }
        });
        
    } catch (error) {
        console.error('Overview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/transactions', authenticateUser, (req, res) => {
    try {
        const transactions = db.prepare(`
            SELECT * FROM transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `).all(req.user.id);
        
        res.json({ transactions });
        
    } catch (error) {
        console.error('Transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/keys', authenticateUser, (req, res) => {
    try {
        const keys = db.prepare(`
            SELECT * FROM api_keys 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `).all(req.user.id);
        
        res.json({ keys });
        
    } catch (error) {
        console.error('Keys error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/user/keys', authenticateUser, (req, res) => {
    try {
        const { name, domain } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Key name is required' });
        }
        
        // Generate unique API key
        const apiKey = 'wsk_' + crypto.randomBytes(32).toString('hex');
        
        const insertKey = db.prepare(`
            INSERT INTO api_keys (user_id, api_key, name, domain)
            VALUES (?, ?, ?, ?)
        `);
        
        const result = insertKey.run(req.user.id, apiKey, name.trim(), domain || null);
        
        res.json({ 
            success: true, 
            key: {
                id: result.lastInsertRowid,
                api_key: apiKey,
                name: name.trim(),
                domain: domain || null
            }
        });
        
    } catch (error) {
        console.error('Generate key error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/user/keys/:keyId', authenticateUser, (req, res) => {
    try {
        const { keyId } = req.params;
        
        const deleteKey = db.prepare(`
            DELETE FROM api_keys 
            WHERE id = ? AND user_id = ?
        `);
        
        const result = deleteKey.run(keyId, req.user.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Key not found' });
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Delete key error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/usage', authenticateUser, (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        let dateFilter = "date('now', '-30 days')";
        if (period === '7d') dateFilter = "date('now', '-7 days')";
        else if (period === '90d') dateFilter = "date('now', '-90 days')";
        
        // Chart data
        const chartData = db.prepare(`
            SELECT 
                DATE(created_at) as date,
                SUM(credits_used) as credits
            FROM usage_logs 
            WHERE user_id = ? AND created_at >= ${dateFilter}
            GROUP BY DATE(created_at)
            ORDER BY date
        `).all(req.user.id);
        
        // Key usage
        const keyUsage = db.prepare(`
            SELECT 
                ak.name,
                ak.api_key as key,
                SUM(ul.credits_used) as usage
            FROM usage_logs ul
            JOIN api_keys ak ON ul.api_key_id = ak.id
            WHERE ul.user_id = ? AND ul.created_at >= ${dateFilter}
            GROUP BY ak.id
            ORDER BY usage DESC
        `).all(req.user.id);
        
        res.json({
            chart: {
                labels: chartData.map(d => d.date),
                data: chartData.map(d => d.credits)
            },
            keyUsage
        });
        
    } catch (error) {
        console.error('Usage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/user/purchase-confirm', authenticateUser, (req, res) => {
    try {
        const { transaction_hash, credits, amount } = req.body;
        
        if (!transaction_hash || !credits || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check if transaction already exists
        const existingTx = db.prepare(`
            SELECT id FROM transactions 
            WHERE transaction_hash = ?
        `).get(transaction_hash);
        
        if (existingTx) {
            return res.status(400).json({ error: 'Transaction already processed' });
        }
        
        // Start transaction
        const transaction = db.transaction(() => {
            // Add transaction record
            const insertTx = db.prepare(`
                INSERT INTO transactions (user_id, type, credits, amount, transaction_hash, status)
                VALUES (?, 'purchase', ?, ?, ?, 'completed')
            `);
            insertTx.run(req.user.id, credits, amount, transaction_hash);
            
            // Update user credits
            const updateCredits = db.prepare(`
                UPDATE users 
                SET credits = credits + ?, total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            updateCredits.run(credits, amount, req.user.id);
        });
        
        transaction();
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Purchase confirm error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Widget API routes
app.post('/api/widget/process', authenticateApiKey, (req, res) => {
    try {
        const { action, data } = req.body;
        
        if (!action) {
            return res.status(400).json({ error: 'Action is required' });
        }
        
        // Process the widget action (this is where your main logic goes)
        let result;
        let creditsUsed = 1;
        
        switch (action) {
            case 'analyze':
                result = { analysis: 'Sample analysis result', confidence: 0.95 };
                creditsUsed = 2;
                break;
            case 'process':
                result = { processed: true, output: data?.input || 'No input provided' };
                creditsUsed = 1;
                break;
            case 'generate':
                result = { generated: 'Sample generated content', tokens: 150 };
                creditsUsed = 3;
                break;
            default:
                return res.status(400).json({ error: 'Unknown action' });
        }
        
        // Check if user has enough credits
        if (req.apiKey.credits < creditsUsed) {
            return res.status(402).json({ error: 'Insufficient credits' });
        }
        
        // Start transaction to deduct credits and log usage
        const transaction = db.transaction(() => {
            // Deduct credits
            const updateCredits = db.prepare(`
                UPDATE users 
                SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            updateCredits.run(creditsUsed, req.apiKey.user_id);
            
            // Update API key usage count
            const updateKeyUsage = db.prepare(`
                UPDATE api_keys 
                SET usage_count = usage_count + ?
                WHERE id = ?
            `);
            updateKeyUsage.run(creditsUsed, req.apiKey.id);
            
            // Log usage
            const logUsage = db.prepare(`
                INSERT INTO usage_logs (api_key_id, user_id, endpoint, credits_used, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            logUsage.run(
                req.apiKey.id,
                req.apiKey.user_id,
                '/api/widget/process',
                creditsUsed,
                req.ip,
                req.get('User-Agent')
            );
        });
        
        transaction();
        
        res.json({
            success: true,
            result,
            credits_used: creditsUsed,
            remaining_credits: req.apiKey.credits - creditsUsed
        });
        
    } catch (error) {
        console.error('Widget process error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin routes
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT ak.id) as total_keys,
                COALESCE(SUM(t.credits), 0) as total_credits_sold,
                COALESCE(SUM(t.amount), 0) as total_revenue,
                COALESCE(SUM(ul.credits_used), 0) as total_usage
            FROM users u
            LEFT JOIN api_keys ak ON u.id = ak.user_id
            LEFT JOIN transactions t ON u.id = t.user_id AND t.type = 'purchase' AND t.status = 'completed'
            LEFT JOIN usage_logs ul ON u.id = ul.user_id
        `).get();
        
        res.json({ stats });
        
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const users = db.prepare(`
            SELECT 
                u.*,
                COUNT(DISTINCT ak.id) as key_count,
                COALESCE(SUM(ul.credits_used), 0) as total_usage
            FROM users u
            LEFT JOIN api_keys ak ON u.id = ak.user_id
            LEFT JOIN usage_logs ul ON u.id = ul.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `).all(limit, offset);
        
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        
        res.json({ 
            users, 
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit)
            }
        });
        
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/transactions', authenticateAdmin, (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        const transactions = db.prepare(`
            SELECT 
                t.*,
                u.wallet_address
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `).all(limit, offset);
        
        const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
        
        res.json({ 
            transactions, 
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalTransactions,
                pages: Math.ceil(totalTransactions / limit)
            }
        });
        
    } catch (error) {
        console.error('Admin transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
initializeDatabase();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close();
    process.exit(0);
});

module.exports = app;