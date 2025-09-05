// User Routes - Authentication, credits, and API key management
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { ethers } = require('ethers');

// Middleware to verify MetaMask signature
const verifySignature = (req, res, next) => {
    try {
        const { wallet_address, signature, message } = req.body;
        
        if (!wallet_address || !signature || !message) {
            return res.status(400).json({
                error: 'Wallet address, signature, and message are required'
            });
        }
        
        // Verify the signature
        const recoveredAddress = ethers.utils.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
            return res.status(401).json({
                error: 'Invalid signature'
            });
        }
        
        req.wallet_address = wallet_address.toLowerCase();
        next();
    } catch (error) {
        console.error('Signature verification error:', error);
        res.status(400).json({
            error: 'Invalid signature format'
        });
    }
};

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authorization token required'
            });
        }
        
        const token = authHeader.substring(7);
        const db = req.app.get('db');
        
        // Find user by session token
        const userQuery = `
            SELECT * FROM users 
            WHERE session_token = ? AND session_expires > datetime('now')
        `;
        
        const user = await new Promise((resolve, reject) => {
            db.get(userQuery, [token], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!user) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Authentication failed'
        });
    }
};

// User registration/login with MetaMask
router.post('/auth', verifySignature, async (req, res) => {
    try {
        const { wallet_address } = req;
        const db = req.app.get('db');
        
        // Check if user exists
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE wallet_address = ?', [wallet_address], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        let user;
        
        if (existingUser) {
            // Update existing user
            const sessionToken = crypto.randomBytes(32).toString('hex');
            const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
            
            const updateQuery = `
                UPDATE users 
                SET session_token = ?, session_expires = ?, last_login = datetime('now'), updated_at = datetime('now')
                WHERE wallet_address = ?
            `;
            
            await new Promise((resolve, reject) => {
                db.run(updateQuery, [sessionToken, sessionExpires, wallet_address], function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
            
            user = {
                ...existingUser,
                session_token: sessionToken,
                session_expires: sessionExpires
            };
        } else {
            // Create new user
            const sessionToken = crypto.randomBytes(32).toString('hex');
            const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            
            const insertQuery = `
                INSERT INTO users (
                    wallet_address, credits_balance, session_token, session_expires, 
                    created_at, updated_at, last_login
                ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
            `;
            
            const result = await new Promise((resolve, reject) => {
                db.run(insertQuery, [wallet_address, 10, sessionToken, sessionExpires], function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
            
            user = {
                id: result.lastID,
                wallet_address: wallet_address,
                credits_balance: 10,
                session_token: sessionToken,
                session_expires: sessionExpires
            };
            
            // Log initial credit transaction
            const logTransaction = `
                INSERT INTO credit_transactions (
                    user_id, type, amount, description, created_at
                ) VALUES (?, ?, ?, ?, datetime('now'))
            `;
            
            await new Promise((resolve, reject) => {
                db.run(logTransaction, [
                    user.id,
                    'credit',
                    10,
                    'Welcome bonus - Initial credits'
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                wallet_address: user.wallet_address,
                credits_balance: user.credits_balance
            },
            token: user.session_token,
            expires_at: user.session_expires
        });
        
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            error: 'Authentication failed'
        });
    }
});

// Get user profile
router.get('/profile', authenticateUser, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            wallet_address: req.user.wallet_address,
            credits_balance: req.user.credits_balance,
            created_at: req.user.created_at,
            last_login: req.user.last_login
        }
    });
});

// Purchase credits
router.post('/credits/purchase', authenticateUser, async (req, res) => {
    try {
        const { amount, tx_hash, package_type } = req.body;
        
        if (!amount || !tx_hash || !package_type) {
            return res.status(400).json({
                error: 'Amount, transaction hash, and package type are required'
            });
        }
        
        const db = req.app.get('db');
        
        // Check if transaction already processed
        const existingTx = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM credit_transactions WHERE tx_hash = ?', [tx_hash], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (existingTx) {
            return res.status(400).json({
                error: 'Transaction already processed'
            });
        }
        
        // Add credits to user
        const updateCredits = `
            UPDATE users 
            SET credits_balance = credits_balance + ?, updated_at = datetime('now')
            WHERE id = ?
        `;
        
        await new Promise((resolve, reject) => {
            db.run(updateCredits, [amount, req.user.id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        // Log transaction
        const logTransaction = `
            INSERT INTO credit_transactions (
                user_id, type, amount, description, tx_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `;
        
        await new Promise((resolve, reject) => {
            db.run(logTransaction, [
                req.user.id,
                'credit',
                amount,
                `Credit purchase - ${package_type}`,
                tx_hash
            ], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        // Get updated balance
        const updatedUser = await new Promise((resolve, reject) => {
            db.get('SELECT credits_balance FROM users WHERE id = ?', [req.user.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({
            success: true,
            message: 'Credits purchased successfully',
            credits_added: amount,
            new_balance: updatedUser.credits_balance,
            transaction_hash: tx_hash
        });
        
    } catch (error) {
        console.error('Credit purchase error:', error);
        res.status(500).json({
            error: 'Credit purchase failed'
        });
    }
});

// Get credit history
router.get('/credits/history', authenticateUser, async (req, res) => {
    try {
        const db = req.app.get('db');
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const historyQuery = `
            SELECT * FROM credit_transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        const transactions = await new Promise((resolve, reject) => {
            db.all(historyQuery, [req.user.id, limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Get total count
        const countQuery = 'SELECT COUNT(*) as total FROM credit_transactions WHERE user_id = ?';
        const totalResult = await new Promise((resolve, reject) => {
            db.get(countQuery, [req.user.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({
            success: true,
            transactions: transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });
        
    } catch (error) {
        console.error('Credit history error:', error);
        res.status(500).json({
            error: 'Failed to get credit history'
        });
    }
});

// Generate API key
router.post('/api-keys', authenticateUser, async (req, res) => {
    try {
        const { name, permissions = [] } = req.body;
        
        if (!name) {
            return res.status(400).json({
                error: 'API key name is required'
            });
        }
        
        const db = req.app.get('db');
        
        // Generate API key
        const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');
        
        const insertQuery = `
            INSERT INTO api_keys (
                user_id, name, key_value, permissions, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `;
        
        const result = await new Promise((resolve, reject) => {
            db.run(insertQuery, [
                req.user.id,
                name,
                apiKey,
                JSON.stringify(permissions)
            ], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        res.json({
            success: true,
            api_key: {
                id: result.lastID,
                name: name,
                key: apiKey,
                permissions: permissions,
                created_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('API key generation error:', error);
        res.status(500).json({
            error: 'Failed to generate API key'
        });
    }
});

// Get user API keys
router.get('/api-keys', authenticateUser, async (req, res) => {
    try {
        const db = req.app.get('db');
        
        const keysQuery = `
            SELECT id, name, key_value, permissions, is_active, created_at, last_used
            FROM api_keys 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;
        
        const apiKeys = await new Promise((resolve, reject) => {
            db.all(keysQuery, [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Mask the API keys for security
        const maskedKeys = apiKeys.map(key => ({
            ...key,
            key_value: key.key_value.substring(0, 8) + '...' + key.key_value.substring(key.key_value.length - 4),
            permissions: key.permissions ? JSON.parse(key.permissions) : []
        }));
        
        res.json({
            success: true,
            api_keys: maskedKeys
        });
        
    } catch (error) {
        console.error('API keys fetch error:', error);
        res.status(500).json({
            error: 'Failed to get API keys'
        });
    }
});

// Delete API key
router.delete('/api-keys/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.get('db');
        
        const deleteQuery = 'DELETE FROM api_keys WHERE id = ? AND user_id = ?';
        
        const result = await new Promise((resolve, reject) => {
            db.run(deleteQuery, [id, req.user.id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        if (result.changes === 0) {
            return res.status(404).json({
                error: 'API key not found'
            });
        }
        
        res.json({
            success: true,
            message: 'API key deleted successfully'
        });
        
    } catch (error) {
        console.error('API key deletion error:', error);
        res.status(500).json({
            error: 'Failed to delete API key'
        });
    }
});

// Toggle API key status
router.patch('/api-keys/:id/toggle', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.get('db');
        
        const toggleQuery = `
            UPDATE api_keys 
            SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
                updated_at = datetime('now')
            WHERE id = ? AND user_id = ?
        `;
        
        const result = await new Promise((resolve, reject) => {
            db.run(toggleQuery, [id, req.user.id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        if (result.changes === 0) {
            return res.status(404).json({
                error: 'API key not found'
            });
        }
        
        res.json({
            success: true,
            message: 'API key status updated successfully'
        });
        
    } catch (error) {
        console.error('API key toggle error:', error);
        res.status(500).json({
            error: 'Failed to update API key status'
        });
    }
});

// Get user usage statistics
router.get('/usage', authenticateUser, async (req, res) => {
    try {
        const db = req.app.get('db');
        const { period = '30' } = req.query; // days
        
        // Get API usage stats
        const usageQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as requests,
                SUM(CASE WHEN response_status = 200 THEN 1 ELSE 0 END) as successful_requests
            FROM api_logs 
            WHERE user_id = ? AND created_at >= date('now', '-${period} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;
        
        const usage = await new Promise((resolve, reject) => {
            db.all(usageQuery, [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Get credit usage stats
        const creditQuery = `
            SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as credits_added,
                SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as credits_used
            FROM credit_transactions 
            WHERE user_id = ? AND created_at >= date('now', '-${period} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;
        
        const creditUsage = await new Promise((resolve, reject) => {
            db.all(creditQuery, [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({
            success: true,
            usage: {
                api_usage: usage,
                credit_usage: creditUsage,
                current_balance: req.user.credits_balance
            }
        });
        
    } catch (error) {
        console.error('Usage stats error:', error);
        res.status(500).json({
            error: 'Failed to get usage statistics'
        });
    }
});

module.exports = router;