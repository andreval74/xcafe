const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database configuration
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite');
const INIT_SQL_PATH = path.join(__dirname, '..', '..', 'database', 'init.sql');

class Database {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  // Initialize database connection
  async init() {
    return new Promise((resolve, reject) => {
      // Ensure database directory exists
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Create database connection
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
          return;
        }

        console.log('Connected to SQLite database at:', DB_PATH);
        
        // Enable foreign keys
        this.db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('Error enabling foreign keys:', err.message);
            reject(err);
            return;
          }

          // Initialize database schema if needed
          this.initializeSchema()
            .then(() => {
              this.isInitialized = true;
              resolve();
            })
            .catch(reject);
        });
      });
    });
  }

  // Initialize database schema from SQL file
  async initializeSchema() {
    return new Promise((resolve, reject) => {
      // Check if tables already exist
      this.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          // If tables don't exist, create them
          if (!row) {
            console.log('Initializing database schema...');
            
            // Read and execute init SQL file
            if (fs.existsSync(INIT_SQL_PATH)) {
              const initSQL = fs.readFileSync(INIT_SQL_PATH, 'utf8');
              
              // Split SQL statements and execute them
              // Handle multi-line statements like triggers properly
              const statements = this.splitSQLStatements(initSQL);

              this.executeStatements(statements)
                .then(() => {
                  console.log('Database schema initialized successfully');
                  resolve();
                })
                .catch(reject);
            } else {
              console.log('No init.sql file found, creating basic schema...');
              this.createBasicSchema()
                .then(resolve)
                .catch(reject);
            }
          } else {
            console.log('Database schema already exists');
            resolve();
          }
        }
      );
    });
  }

  // Split SQL statements properly handling triggers and multi-line statements
  splitSQLStatements(sql) {
    const statements = [];
    let current = '';
    let inTrigger = false;
    let depth = 0;
    
    const lines = sql.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('--') || trimmed === '') {
        continue;
      }
      
      current += line + '\n';
      
      // Check for trigger start
      if (trimmed.toUpperCase().includes('CREATE TRIGGER')) {
        inTrigger = true;
      }
      
      // Count BEGIN/END depth for triggers
      if (trimmed.toUpperCase().includes('BEGIN')) {
        depth++;
      }
      if (trimmed.toUpperCase().includes('END')) {
        depth--;
      }
      
      // End of statement
      if (trimmed.endsWith(';')) {
        if (!inTrigger || (inTrigger && depth === 0)) {
          statements.push(current.trim());
          current = '';
          inTrigger = false;
          depth = 0;
        }
      }
    }
    
    // Add any remaining statement
    if (current.trim()) {
      statements.push(current.trim());
    }
    
    return statements.filter(stmt => stmt.length > 0);
  }

  // Execute multiple SQL statements
  async executeStatements(statements) {
    for (const statement of statements) {
      if (statement.trim()) {
        await new Promise((resolve, reject) => {
          this.db.run(statement, (err) => {
            if (err) {
              console.error('Error executing statement:', statement);
              console.error('Error:', err.message);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    }
  }

  // Create basic schema if init.sql is not available
  async createBasicSchema() {
    const basicSchema = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT UNIQUE NOT NULL,
        email TEXT,
        username TEXT,
        credit_balance INTEGER DEFAULT 0,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        key_hash TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        permissions TEXT DEFAULT 'read',
        rate_limit INTEGER DEFAULT 60,
        is_active BOOLEAN DEFAULT TRUE,
        last_used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        transaction_hash TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS widget_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_key_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        request_data TEXT,
        response_data TEXT,
        credits_used INTEGER DEFAULT 1,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (api_key_id) REFERENCES api_keys (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_users_wallet ON users (wallet_address);
      CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys (user_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions (user_id);
      CREATE INDEX IF NOT EXISTS idx_widget_requests_api_key ON widget_requests (api_key_id);
      CREATE INDEX IF NOT EXISTS idx_widget_requests_user ON widget_requests (user_id);
    `;

    const statements = basicSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    await this.executeStatements(statements);
  }

  // Get database instance
  getDB() {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Close database connection
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed');
            this.isInitialized = false;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Helper method to run queries with promises
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Helper method to get single row
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Helper method to get all rows
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

// Create singleton instance
const database = new Database();

// Initialize database when module is loaded
database.init().catch(console.error);

module.exports = database;