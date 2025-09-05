// Credits Management Routes - USDT Integration
const express = require('express');
const { ethers } = require('ethers');
const Database = require('better-sqlite3');
const path = require('path');

const router = express.Router();
const db = new Database(path.join(__dirname, '../../database/widget.db'));

// USDT Contract Configuration
const USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // Ethereum Mainnet USDT
const COMMISSION_RATE = 0.02; // 2% commission

// Credit packages configuration
const CREDIT_PACKAGES = {
    'package_500': { credits: 500, price: 45, usd_price: 45 },
    'package_1000': { credits: 1000, price: 85, usd_price: 85 },
    'package_2500': { credits: 2500, price: 200, usd_price: 200 },
    'package_5000': { credits: 5000, price: 375, usd_price: 375 },
    'package_10000': { credits: 10000, price: 700, usd_price: 700 }
};

// Authentication middleware (imported from main server)
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

// Get available credit packages
router.get('/packages', (req, res) => {
    try {
        res.json({
            success: true,
            packages: CREDIT_PACKAGES,
            commission_rate: COMMISSION_RATE,
            usdt_contract: USDT_CONTRACT_ADDRESS
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user credits
router.get('/balance', authenticateUser, (req, res) => {
    try {
        const user = db.prepare('SELECT credits, total_spent FROM users WHERE id = ?').get(req.user.id);
        
        res.json({
            success: true,
            credits: user?.credits || 0,
            total_spent: user?.total_spent || 0
        });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Purchase credits with USDT
router.post('/purchase', authenticateUser, async (req, res) => {
    try {
        const { txHash, packageId, operationTag, chainId } = req.body;
        
        if (!txHash || !packageId) {
            return res.status(400).json({ error: 'Transaction hash and package ID are required' });
        }
        
        // Validate package
        const packageInfo = CREDIT_PACKAGES[packageId];
        if (!packageInfo) {
            return res.status(400).json({ error: 'Invalid package ID' });
        }
        
        // Check if transaction already processed
        const existingTx = db.prepare(
            'SELECT * FROM transactions WHERE transaction_hash = ?'
        ).get(txHash);
        
        if (existingTx) {
            return res.status(400).json({ error: 'Transaction already processed' });
        }
        
        // Verify operation tag if provided
        if (operationTag) {
            const tagExists = db.prepare(
                'SELECT * FROM transactions WHERE operation_tag = ? AND status = "completed"'
            ).get(operationTag);
            
            if (tagExists) {
                return res.status(400).json({ error: 'Operation tag already used' });
            }
        }
        
        // Calculate credits after commission
        const grossCredits = packageInfo.credits;
        const commission = Math.floor(grossCredits * COMMISSION_RATE);
        const netCredits = grossCredits - commission;
        
        // Start transaction
        const transaction = db.transaction(() => {
            // Insert transaction record
            const insertTx = db.prepare(`
                INSERT INTO transactions (
                    user_id, type, credits, amount, transaction_hash, 
                    operation_tag, commission, status, chain_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            const txResult = insertTx.run(
                req.user.id,
                'purchase',
                netCredits,
                packageInfo.price,
                txHash,
                operationTag || null,
                commission,
                'pending',
                chainId || 1
            );
            
            // Update user credits
            const updateUser = db.prepare(`
                UPDATE users 
                SET credits = credits + ?, 
                    total_spent = total_spent + ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            
            updateUser.run(netCredits, packageInfo.price, req.user.id);
            
            return txResult.lastInsertRowid;
        });
        
        const transactionId = transaction();
        
        // In a real implementation, you would verify the transaction on-chain here
        // For now, we'll mark it as completed
        db.prepare('UPDATE transactions SET status = "completed" WHERE id = ?')
          .run(transactionId);
        
        res.json({
            success: true,
            message: 'Credits purchased successfully',
            transaction_id: transactionId,
            credits_added: netCredits,
            commission_deducted: commission,
            total_credits: req.user.credits + netCredits
        });
        
    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify transaction status
router.get('/transaction/:txHash', authenticateUser, (req, res) => {
    try {
        const { txHash } = req.params;
        
        const transaction = db.prepare(`
            SELECT t.*, u.wallet_address 
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.transaction_hash = ? AND t.user_id = ?
        `).get(txHash, req.user.id);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json({
            success: true,
            transaction
        });
        
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transaction history
router.get('/history', authenticateUser, (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        const transactions = db.prepare(`
            SELECT * FROM transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `).all(req.user.id, parseInt(limit), parseInt(offset));
        
        const total = db.prepare(
            'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?'
        ).get(req.user.id);
        
        res.json({
            success: true,
            transactions,
            total: total.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Deduct credits (for API usage)
router.post('/deduct', authenticateUser, (req, res) => {
    try {
        const { credits, description } = req.body;
        
        if (!credits || credits <= 0) {
            return res.status(400).json({ error: 'Invalid credits amount' });
        }
        
        const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);
        
        if (user.credits < credits) {
            return res.status(402).json({ error: 'Insufficient credits' });
        }
        
        // Start transaction
        const transaction = db.transaction(() => {
            // Insert usage transaction
            const insertTx = db.prepare(`
                INSERT INTO transactions (user_id, type, credits, status, description)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            insertTx.run(req.user.id, 'usage', -credits, 'completed', description || 'API usage');
            
            // Update user credits
            const updateUser = db.prepare(`
                UPDATE users 
                SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            
            updateUser.run(credits, req.user.id);
        });
        
        transaction();
        
        const updatedUser = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);
        
        res.json({
            success: true,
            credits_deducted: credits,
            remaining_credits: updatedUser.credits
        });
        
    } catch (error) {
        console.error('Error deducting credits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;