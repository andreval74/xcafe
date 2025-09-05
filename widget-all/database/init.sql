-- Widget SaaS Database Schema
-- SQLite initialization script

-- Users table - stores user information and MetaMask wallet addresses
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    credits_balance INTEGER DEFAULT 0,
    session_token TEXT,
    session_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- API Keys table - stores user API keys for widget access
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    key_value TEXT UNIQUE NOT NULL,
    permissions TEXT DEFAULT '[]', -- JSON array of permissions
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Credit Transactions table - tracks all credit purchases and usage
CREATE TABLE IF NOT EXISTS credit_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')), -- credit = add, debit = subtract
    amount INTEGER NOT NULL,
    description TEXT,
    tx_hash TEXT, -- blockchain transaction hash for purchases
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API Logs table - tracks all API requests for analytics and billing
CREATE TABLE IF NOT EXISTS api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    api_key_id INTEGER,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_data TEXT, -- JSON string of request data
    response_status INTEGER NOT NULL,
    response_time INTEGER, -- in milliseconds
    credits_used INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
);

-- Widget Configurations table - stores widget settings and customizations
CREATE TABLE IF NOT EXISTS widget_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    config_data TEXT NOT NULL, -- JSON string of widget configuration
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System Settings table - stores global system configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_value ON api_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_user ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_date ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_widget_configs_user ON widget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('credit_cost_per_request', '1', 'Number of credits consumed per API request'),
('max_requests_per_minute', '60', 'Maximum API requests per minute per user'),
('max_requests_per_hour', '1000', 'Maximum API requests per hour per user'),
('welcome_bonus_credits', '10', 'Free credits given to new users'),
('commission_rate', '0.02', 'Commission rate for credit purchases (2%)'),
('min_credit_purchase', '100', 'Minimum credits that can be purchased'),
('max_credit_purchase', '10000', 'Maximum credits that can be purchased in single transaction'),
('api_version', '1.0', 'Current API version'),
('maintenance_mode', '0', 'System maintenance mode (0=off, 1=on)'),
('admin_email', 'admin@widgetsaas.com', 'Administrator email address');

-- Insert sample credit packages
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('package_starter', '{"credits": 100, "price_eth": "0.01", "name": "Starter Package"}', 'Starter credit package'),
('package_professional', '{"credits": 500, "price_eth": "0.045", "name": "Professional Package"}', 'Professional credit package'),
('package_business', '{"credits": 1000, "price_eth": "0.08", "name": "Business Package"}', 'Business credit package'),
('package_enterprise', '{"credits": 5000, "price_eth": "0.35", "name": "Enterprise Package"}', 'Enterprise credit package');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_api_keys_timestamp
    AFTER UPDATE ON api_keys
    BEGIN
        UPDATE api_keys SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_widget_configs_timestamp 
    AFTER UPDATE ON widget_configs
    BEGIN
        UPDATE widget_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_system_settings_timestamp 
    AFTER UPDATE ON system_settings
    BEGIN
        UPDATE system_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Create views for common queries
CREATE VIEW IF NOT EXISTS user_stats AS
SELECT 
    u.id,
    u.wallet_address,
    u.credits_balance,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT ak.id) as api_keys_count,
    COUNT(DISTINCT ct.id) as total_transactions,
    SUM(CASE WHEN ct.type = 'credit' THEN ct.amount ELSE 0 END) as total_credits_purchased,
    SUM(CASE WHEN ct.type = 'debit' THEN ct.amount ELSE 0 END) as total_credits_used,
    COUNT(DISTINCT al.id) as total_api_requests,
    MAX(al.created_at) as last_api_request
FROM users u
LEFT JOIN api_keys ak ON u.id = ak.user_id
LEFT JOIN credit_transactions ct ON u.id = ct.user_id
LEFT JOIN api_logs al ON u.id = al.user_id
GROUP BY u.id, u.wallet_address, u.credits_balance, u.created_at, u.last_login;

CREATE VIEW IF NOT EXISTS daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT CASE WHEN table_name = 'users' THEN id END) as new_users,
    COUNT(DISTINCT CASE WHEN table_name = 'api_logs' THEN id END) as api_requests,
    COUNT(DISTINCT CASE WHEN table_name = 'credit_transactions' AND type = 'credit' THEN id END) as credit_purchases,
    SUM(CASE WHEN table_name = 'credit_transactions' AND type = 'credit' THEN amount ELSE 0 END) as credits_sold
FROM (
    SELECT 'users' as table_name, id, created_at, NULL as type, NULL as amount FROM users
    UNION ALL
    SELECT 'api_logs' as table_name, id, created_at, NULL as type, NULL as amount FROM api_logs
    UNION ALL
    SELECT 'credit_transactions' as table_name, id, created_at, type, amount FROM credit_transactions
) combined
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create sample admin user (for testing)
-- Note: In production, this should be created through proper admin setup
INSERT OR IGNORE INTO users (wallet_address, credits_balance, created_at, updated_at) 
VALUES ('0x0000000000000000000000000000000000000000', 999999, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create sample API key for testing
INSERT OR IGNORE INTO api_keys (user_id, name, key_value, permissions, created_at, updated_at)
SELECT 
    id, 
    'Test API Key', 
    'sk_test_' || hex(randomblob(16)), 
    '["read", "write"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users 
WHERE wallet_address = '0x0000000000000000000000000000000000000000'
LIMIT 1;

-- Vacuum and analyze for optimal performance
VACUUM;
ANALYZE;