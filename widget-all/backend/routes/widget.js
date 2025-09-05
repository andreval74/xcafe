// Widget Routes - API endpoints for widget functionality
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Middleware to validate API key and check credits
const validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({
                error: 'API key is required',
                code: 'MISSING_API_KEY'
            });
        }
        
        // Get database instance from app
        const db = req.app.get('db');
        
        // Find API key in database
        const keyQuery = `
            SELECT ak.*, u.wallet_address, u.credits_balance 
            FROM api_keys ak 
            JOIN users u ON ak.user_id = u.id 
            WHERE ak.key_value = ? AND ak.is_active = 1
        `;
        
        const keyResult = await new Promise((resolve, reject) => {
            db.get(keyQuery, [apiKey], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!keyResult) {
            return res.status(401).json({
                error: 'Invalid API key',
                code: 'INVALID_API_KEY'
            });
        }
        
        // Check if user has credits
        if (keyResult.credits_balance <= 0) {
            return res.status(402).json({
                error: 'Insufficient credits',
                code: 'INSUFFICIENT_CREDITS',
                remaining_credits: 0
            });
        }
        
        // Add user info to request
        req.user = {
            id: keyResult.user_id,
            wallet_address: keyResult.wallet_address,
            credits_balance: keyResult.credits_balance
        };
        
        req.apiKey = {
            id: keyResult.id,
            name: keyResult.name,
            permissions: keyResult.permissions ? JSON.parse(keyResult.permissions) : []
        };
        
        next();
    } catch (error) {
        console.error('API key validation error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'VALIDATION_ERROR'
        });
    }
};

// Middleware to log API usage
const logApiUsage = async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Log the API call
        const db = req.app.get('db');
        const logData = {
            user_id: req.user?.id,
            api_key_id: req.apiKey?.id,
            endpoint: req.path,
            method: req.method,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            request_data: JSON.stringify(req.body),
            response_status: res.statusCode,
            timestamp: new Date().toISOString()
        };
        
        const insertLog = `
            INSERT INTO api_logs (
                user_id, api_key_id, endpoint, method, ip_address, 
                user_agent, request_data, response_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(insertLog, [
            logData.user_id,
            logData.api_key_id,
            logData.endpoint,
            logData.method,
            logData.ip_address,
            logData.user_agent,
            logData.request_data,
            logData.response_status,
            logData.timestamp
        ], (err) => {
            if (err) {
                console.error('Error logging API usage:', err);
            }
        });
        
        originalSend.call(this, data);
    };
    
    next();
};

// Widget processing endpoint
router.post('/process', validateApiKey, logApiUsage, async (req, res) => {
    try {
        const { action, data } = req.body;
        
        if (!action || !data) {
            return res.status(400).json({
                error: 'Action and data are required',
                code: 'MISSING_PARAMETERS'
            });
        }
        
        // Calculate credits to consume based on action
        let creditsToConsume = 1; // Default
        
        switch (action) {
            case 'process':
                creditsToConsume = 1;
                break;
            case 'analyze':
                creditsToConsume = 2;
                break;
            case 'generate':
                creditsToConsume = 3;
                break;
            default:
                creditsToConsume = 1;
        }
        
        // Check if user has enough credits
        if (req.user.credits_balance < creditsToConsume) {
            return res.status(402).json({
                error: 'Insufficient credits for this action',
                code: 'INSUFFICIENT_CREDITS',
                required_credits: creditsToConsume,
                remaining_credits: req.user.credits_balance
            });
        }
        
        // Process the request based on action
        let result;
        
        switch (action) {
            case 'process':
                result = await processText(data.input);
                break;
            case 'analyze':
                result = await analyzeText(data.input);
                break;
            case 'generate':
                result = await generateContent(data.input);
                break;
            default:
                result = { message: 'Action not supported' };
        }
        
        // Deduct credits from user
        const db = req.app.get('db');
        
        const updateCredits = `
            UPDATE users 
            SET credits_balance = credits_balance - ?, 
                updated_at = datetime('now') 
            WHERE id = ?
        `;
        
        await new Promise((resolve, reject) => {
            db.run(updateCredits, [creditsToConsume, req.user.id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        // Log the transaction
        const logTransaction = `
            INSERT INTO credit_transactions (
                user_id, type, amount, description, created_at
            ) VALUES (?, ?, ?, ?, datetime('now'))
        `;
        
        await new Promise((resolve, reject) => {
            db.run(logTransaction, [
                req.user.id,
                'debit',
                creditsToConsume,
                `Widget ${action} - ${data.input.substring(0, 50)}...`
            ], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        // Return success response
        res.json({
            success: true,
            result: result,
            credits_used: creditsToConsume,
            remaining_credits: req.user.credits_balance - creditsToConsume,
            action: action
        });
        
    } catch (error) {
        console.error('Widget processing error:', error);
        res.status(500).json({
            error: 'Processing failed',
            code: 'PROCESSING_ERROR',
            message: error.message
        });
    }
});

// Get widget usage statistics
router.get('/stats', validateApiKey, async (req, res) => {
    try {
        const db = req.app.get('db');
        
        // Get usage stats for the user
        const statsQuery = `
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN response_status = 200 THEN 1 ELSE 0 END) as successful_requests,
                SUM(CASE WHEN response_status != 200 THEN 1 ELSE 0 END) as failed_requests,
                DATE(created_at) as date
            FROM api_logs 
            WHERE user_id = ? AND created_at >= date('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;
        
        const stats = await new Promise((resolve, reject) => {
            db.all(statsQuery, [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Get total usage
        const totalQuery = `
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN response_status = 200 THEN 1 ELSE 0 END) as successful_requests
            FROM api_logs 
            WHERE user_id = ?
        `;
        
        const totals = await new Promise((resolve, reject) => {
            db.get(totalQuery, [req.user.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({
            success: true,
            stats: {
                daily: stats,
                totals: totals,
                remaining_credits: req.user.credits_balance
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: 'Failed to get statistics',
            code: 'STATS_ERROR'
        });
    }
});

// Validate API key endpoint
router.get('/validate', validateApiKey, (req, res) => {
    res.json({
        success: true,
        valid: true,
        user_id: req.user.id,
        remaining_credits: req.user.credits_balance,
        api_key_name: req.apiKey.name,
        permissions: req.apiKey.permissions
    });
});

// Processing functions
async function processText(input) {
    // Simulate text processing
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
    
    return {
        processed_text: input.toUpperCase(),
        word_count: input.split(' ').length,
        character_count: input.length,
        processing_time: '0.5s'
    };
}

async function analyzeText(input) {
    // Simulate text analysis
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const words = input.split(' ');
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        confidence: (Math.random() * 0.4 + 0.6).toFixed(2),
        word_count: words.length,
        sentence_count: sentences.length,
        avg_word_length: (input.replace(/\s/g, '').length / words.length).toFixed(1),
        readability_score: (Math.random() * 40 + 60).toFixed(1)
    };
}

async function generateContent(input) {
    // Simulate content generation
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const templates = [
        `Baseado em "${input}", aqui está uma sugestão: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        `Considerando "${input}", recomendamos: Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
        `Para "${input}", uma abordagem seria: Ut enim ad minim veniam, quis nostrud exercitation ullamco.`
    ];
    
    return {
        generated_content: templates[Math.floor(Math.random() * templates.length)],
        content_length: 150,
        generation_method: 'template_based',
        creativity_score: (Math.random() * 0.3 + 0.7).toFixed(2)
    };
}

module.exports =