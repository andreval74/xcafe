// Admin Routes - User management, reports, and system configuration
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authorization token required'
            });
        }
        
        const token = authHeader.substring(7);
        
        // Simple admin token validation (in production, use proper JWT or session)
        const adminToken = process.env.ADMIN_TOKEN || 'admin_secret_token_2024';
        
        if (token !== adminToken) {
            return res.status(401).json({
                error: 'Invalid admin token'
            });
        }
        
        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        res.status(500).json({
            error: 'Authentication failed'
        });
    }
};

// Get dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const db = req.app.get('db');
        
        // Get user statistics
        const userStats = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_users_week,
                    COUNT(CASE WHEN last_login >= date('now', '-1 day') THEN 1 END) as active_users_today,
                    SUM(credits_balance) as total_credits
                FROM users
            `;
            
            db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Get API usage statistics
        const apiStats = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_requests,
                    COUNT(CASE WHEN created_at >= date('now', '-1 day') THEN 1 END) as requests_today,
                    COUNT(CASE WHEN response_status = 200 THEN 1 END) as successful_requests,
                    COUNT(DISTINCT user_id) as active_api_users
                FROM api_logs
                WHERE created_at >= date('now', '-30 days')
            `;
            
            db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Get revenue statistics
        const revenueStats = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_credits_sold,
                    COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as transactions_week
                FROM credit_transactions
                WHERE type = 'credit' AND tx_hash IS NOT NULL
            `;
            
            db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Get API key statistics
        const keyStats = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_keys,
                    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_keys,
                    COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_keys_week
                FROM api_keys
            `;
            
            db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({
            success: true,
            dashboard: {
                users: userStats,
                api: apiStats,
                revenue: revenueStats,
                keys: keyStats
            }
        });
        
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            error: 'Failed to get dashboard statistics'
        });
    }
});

// Get all users with pagination
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const db = req.app.get('db');
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        let params = [];
        
        if (search) {
            whereClause = 'WHERE wallet_address LIKE ?';
            params.push(`%${search}%`);
        }
        
        const usersQuery = `
            SELECT 
                id, wallet_address, credits_balance, created_at, 
                last_login, updated_at,
                (SELECT COUNT(*) FROM api_keys WHERE user_id = users.id) as api_keys_count,
                (SELECT COUNT(*) FROM api_logs WHERE user_id = users.id AND created_at >= date('now', '-30 days')) as requests_30d
            FROM users 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        const users = await new Promise((resolve, reject) => {
            db.all(usersQuery, [...params, limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        const totalResult = await new Promise((resolve, reject) => {
            db.get(countQuery, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({
            success: true,
            users: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });
        
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            error: 'Failed to get users'
        });
    }
});

// Get user details
router.get('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.app.get('db');
        
        // Get user info
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        // Get user's API keys
        const apiKeys = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC', [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Get recent transactions
        const transactions = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
                [id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        // Get recent API usage
        const apiUsage = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM api_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
                [id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        res.json({
            success: true,
            user: {
                ...user,
                api_keys: apiKeys.map(key => ({
                    ...key,
                    key_value: key.key_value.substring(0, 8) + '...' + key.key_value.substring(key.key_value.length - 4)
                })),
                recent_transactions: transactions,
                recent_api_usage: apiUsage
            }
        });
        
    } catch (error) {
        console.error('User details error:', error);
        res.status(500).json({
            error: 'Failed to get user details'
        });
    }
});

// Update user credits (admin action)
router.patch('/users/:id/credits', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;
        
        if (!amount || !reason) {
            return res.status(400).json({
                error: 'Amount and reason are required'
            });
        }
        
        const db = req.app.get('db');
        
        // Update user credits
        const updateQuery = `
            UPDATE users 
            SET credits_balance = credits_balance + ?, updated_at = datetime('now')
            WHERE id = ?
        `;
        
        const result = await new Promise((resolve, reject) => {
            db.run(updateQuery, [amount, id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        if (result.changes === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        // Log the transaction
        const logTransaction = `
            INSERT INTO credit_transactions (
                user_id, type, amount, description, created_at
            ) VALUES (?, ?, ?, ?, datetime('now'))
        `;
        
        await new Promise((resolve, reject) => {
            db.run(logTransaction, [
                id,
                amount > 0 ? 'credit' : 'debit',
                Math.abs(amount),
                `Admin adjustment: ${reason}`
            ], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        // Get updated balance
        const updatedUser = await new Promise((resolve, reject) => {
            db.get('SELECT credits_balance FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({
            success: true,
            message: 'User credits updated successfully',
            credits_adjusted: amount,
            new_balance: updatedUser.credits_balance
        });
        
    } catch (error) {
        console.error('Credit adjustment error:', error);
        res.status(500).json({
            error: 'Failed to adjust user credits'
        });
    }
});

// Get API usage analytics
router.get('/analytics/api-usage', authenticateAdmin, async (req, res) => {
    try {
        const db = req.app.get('db');
        const { period = '30' } = req.query; // days
        
        // Daily usage stats
        const dailyUsage = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_requests,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(CASE WHEN response_status = 200 THEN 1 END) as successful_requests,
                    AVG(response_time) as avg_response_time
                FROM api_logs 
                WHERE created_at >= date('now', '-${period} days')
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Top users by API usage
        const topUsers = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    u.wallet_address,
                    COUNT(al.id) as request_count,
                    COUNT(CASE WHEN al.response_status = 200 THEN 1 END) as successful_requests
                FROM api_logs al
                JOIN users u ON al.user_id = u.id
                WHERE al.created_at >= date('now', '-${period} days')
                GROUP BY u.id, u.wallet_address
                ORDER BY request_count DESC
                LIMIT 10
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Error analysis
        const errorStats = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    response_status,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM api_logs WHERE created_at >= date('now', '-${period} days')), 2) as percentage
                FROM api_logs 
                WHERE created_at >= date('now', '-${period} days')
                GROUP BY response_status
                ORDER BY count DESC
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({
            success: true,
            analytics: {
                daily_usage: dailyUsage,
                top_users: topUsers,
                error_stats: errorStats
            }
        });
        
    } catch (error) {
        console.error('API analytics error:', error);
        res.status(500).json({
            error: 'Failed to get API analytics'
        });
    }
});

// Get revenue analytics
router.get('/analytics/revenue', authenticateAdmin, async (req, res) => {
    try {
        const db = req.app.get('db');
        const { period = '30' } = req.query; // days
        
        // Daily revenue stats
        const dailyRevenue = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as transactions,
                    SUM(amount) as credits_sold,
                    COUNT(DISTINCT user_id) as unique_buyers
                FROM credit_transactions 
                WHERE type = 'credit' 
                    AND tx_hash IS NOT NULL 
                    AND created_at >= date('now', '-${period} days')
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Package popularity
        const packageStats = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    CASE 
                        WHEN amount = 100 THEN 'Starter (100 credits)'
                        WHEN amount = 500 THEN 'Professional (500 credits)'
                        WHEN amount = 1000 THEN 'Business (1000 credits)'
                        WHEN amount = 5000 THEN 'Enterprise (5000 credits)'
                        ELSE 'Custom (' || amount || ' credits)'
                    END as package_name,
                    COUNT(*) as purchases,
                    SUM(amount) as total_credits
                FROM credit_transactions 
                WHERE type = 'credit' 
                    AND tx_hash IS NOT NULL 
                    AND created_at >= date('now', '-${period} days')
                GROUP BY amount
                ORDER BY purchases DESC
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Top buyers
        const topBuyers = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    u.wallet_address,
                    COUNT(ct.id) as purchase_count,
                    SUM(ct.amount) as total_credits_purchased
                FROM credit_transactions ct
                JOIN users u ON ct.user_id = u.id
                WHERE ct.type = 'credit' 
                    AND ct.tx_hash IS NOT NULL 
                    AND ct.created_at >= date('now', '-${period} days')
                GROUP BY u.id, u.wallet_address
                ORDER BY total_credits_purchased DESC
                LIMIT 10
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({
            success: true,
            analytics: {
                daily_revenue: dailyRevenue,
                package_stats: packageStats,
                top_buyers: topBuyers
            }
        });
        
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({
            error: 'Failed to get revenue analytics'
        });
    }
});

// Get system logs
router.get('/logs', authenticateAdmin, async (req, res) => {
    try {
        const db = req.app.get('db');
        const { page = 1, limit = 50, level = 'all' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        let params = [];
        
        if (level !== 'all') {
            whereClause = 'WHERE response_status = ?';
            params.push(level === 'error' ? 500 : 200);
        }
        
        const logsQuery = `
            SELECT 
                al.*,
                u.wallet_address
            FROM api_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ${whereClause}
            ORDER BY al.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        const logs = await new Promise((resolve, reject) => {
            db.all(logsQuery, [...params, limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM api_logs ${whereClause}`;
        const totalResult = await new Promise((resolve, reject) => {
            db.get(countQuery, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({
            success: true,
            logs: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });
        
    } catch (error) {
        console.error('Logs fetch error:', error);
        res.status(500).json({
            error: 'Failed to get system logs'
        });
    }
});

// Export data
router.get('/export/:type', authenticateAdmin, async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json' } = req.query;
        const db = req.app.get('db');
        
        let query = '';
        let filename = '';
        
        switch (type) {
            case 'users':
                query = 'SELECT * FROM users ORDER BY created_at DESC';
                filename = 'users_export';
                break;
            case 'transactions':
                query = 'SELECT * FROM credit_transactions ORDER BY created_at DESC';
                filename = 'transactions_export';
                break;
            case 'api_logs':
                query = 'SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 10000';
                filename = 'api_logs_export';
                break;
            case 'api_keys':
                query = 'SELECT id, user_id, name, permissions, is_active, created_at, last_used FROM api_keys ORDER BY created_at DESC';
                filename = 'api_keys_export';
                break;
            default:
                return res.status(400).json({
                    error: 'Invalid export type'
                });
        }
        
        const data = await new Promise((resolve, reject) => {
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (format === 'csv') {
            // Convert to CSV
            if (data.length === 0) {
                return res.status(404).json({
                    error: 'No data to export'
                });
            }
            
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => 
                    headers.map(header => 
                        JSON.stringify(row[header] || '')
                    ).join(',')
                )
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csvContent);
        } else {
            // Return JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.json({
                success: true,
                data: data,
                exported_at: new Date().toISOString(),
                total_records: data.length
            });
        }
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            error: 'Failed to export data'
        });
    }
});

module.exports = router;