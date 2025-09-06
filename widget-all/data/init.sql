-- init.sql - Inicialização do Banco de Dados Widget SaaS
-- Sistema de Widget SaaS com autenticação Web3

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    api_key TEXT UNIQUE,
    credits INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de widgets
CREATE TABLE IF NOT EXISTS widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    token_address TEXT NOT NULL,
    token_symbol TEXT,
    token_name TEXT,
    price_eth DECIMAL(18,8) NOT NULL,
    network_id INTEGER DEFAULT 1,
    theme TEXT DEFAULT 'light',
    is_active BOOLEAN DEFAULT 1,
    sales_count INTEGER DEFAULT 0,
    total_volume DECIMAL(18,8) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    widget_id INTEGER NOT NULL,
    buyer_address TEXT NOT NULL,
    seller_address TEXT NOT NULL,
    amount_eth DECIMAL(18,8) NOT NULL,
    token_quantity DECIMAL(18,8) NOT NULL,
    tx_hash TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    commission_fee DECIMAL(18,8),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (widget_id) REFERENCES widgets(id)
);

-- Tabela de créditos
CREATE TABLE IF NOT EXISTS credits_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'purchase', 'consumed', 'bonus'
    description TEXT,
    transaction_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT OR REPLACE INTO system_config (config_key, config_value, description) VALUES
('commission_rate', '0.02', 'Taxa de comissão da plataforma (2%)'),
('default_credits', '10', 'Créditos padrão para novos usuários'),
('max_widgets_per_user', '50', 'Máximo de widgets por usuário'),
('platform_wallet', '', 'Endereço da carteira da plataforma'),
('supported_networks', '[1,56,137]', 'Redes blockchain suportadas');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_widgets_user ON widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_active ON widgets(is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_widget ON transactions(widget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_credits_user ON credits_history(user_id);
