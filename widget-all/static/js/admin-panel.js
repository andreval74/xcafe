/**
 * Widget SaaS - Admin Panel JavaScript
 * Sistema completo de administração
 */

class AdminPanel {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8001/api';
        this.web3 = null;
        this.userAccount = null;
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Painel Administrativo');
        
        // Verificar MetaMask
        await this.checkMetaMask();
        
        // Carregar dados iniciais
        await this.loadDashboardData();
        
        // Setup listeners
        this.setupEventListeners();
        
        console.log('✅ Painel Administrativo carregado');
    }

    async checkMetaMask() {
        if (typeof window.ethereum !== 'undefined') {
            this.web3 = window.ethereum;
            
            // Verificar se já está conectado
            try {
                const accounts = await this.web3.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.userAccount = accounts[0];
                    this.isConnected = true;
                    this.updateMetaMaskStatus();
                }
            } catch (error) {
                console.error('❌ Erro ao verificar MetaMask:', error);
            }
            
            // Setup listeners
            this.web3.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    this.userAccount = accounts[0];
                    this.isConnected = true;
                } else {
                    this.userAccount = null;
                    this.isConnected = false;
                }
                this.updateMetaMaskStatus();
            });
        }
    }

    async connectMetaMask() {
        if (!this.web3) {
            alert('MetaMask não encontrado! Instale a extensão MetaMask.');
            return;
        }

        try {
            const accounts = await this.web3.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                this.userAccount = accounts[0];
                this.isConnected = true;
                this.updateMetaMaskStatus();
                this.showAlert('MetaMask conectado com sucesso!', 'success');
            }
        } catch (error) {
            console.error('❌ Erro ao conectar MetaMask:', error);
            this.showAlert('Erro ao conectar MetaMask: ' + error.message, 'error');
        }
    }

    updateMetaMaskStatus() {
        const statusElement = document.getElementById('metamask-status');
        
        if (this.isConnected) {
            statusElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>🦊 ${this.formatAddress(this.userAccount)}</span>
                    <button class="btn btn-secondary" onclick="admin.disconnectMetaMask()">
                        Desconectar
                    </button>
                </div>
            `;
        } else {
            statusElement.innerHTML = `
                <button class="btn btn-primary" onclick="admin.connectMetaMask()">
                    🦊 Conectar MetaMask
                </button>
            `;
        }
    }

    disconnectMetaMask() {
        this.userAccount = null;
        this.isConnected = false;
        this.updateMetaMaskStatus();
        this.showAlert('MetaMask desconectado', 'success');
    }

    async loadDashboardData() {
        try {
            // Carregar estatísticas
            await Promise.all([
                this.loadStats(),
                this.loadWidgets(),
                this.loadTokens(),
                this.loadTransactions(),
                this.loadUsers()
            ]);
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/stats`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('total-widgets').textContent = data.stats.totalWidgets || 0;
                document.getElementById('total-transactions').textContent = data.stats.totalTransactions || 0;
                document.getElementById('total-revenue').textContent = `${data.stats.totalRevenue || 0} BNB`;
                document.getElementById('active-users').textContent = data.stats.activeUsers || 0;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error);
        }
    }

    async loadWidgets() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/widgets`);
            const data = await response.json();
            
            if (data.success) {
                this.renderWidgetsTable(data.widgets || []);
                this.populateTokenSelect(data.widgets || []);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar widgets:', error);
        }
    }

    async loadTokens() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/tokens`);
            const data = await response.json();
            
            if (data.success) {
                this.renderTokensTable(data.tokens || []);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar tokens:', error);
        }
    }

    async loadTransactions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/transactions`);
            const data = await response.json();
            
            if (data.success) {
                this.renderTransactionsTable(data.transactions || []);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar transações:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/users`);
            const data = await response.json();
            
            if (data.success) {
                this.renderUsersTable(data.users || []);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
        }
    }

    renderWidgetsTable(widgets) {
        const tbody = document.getElementById('widgets-table');
        tbody.innerHTML = '';
        
        if (widgets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum widget encontrado</td></tr>';
            return;
        }
        
        widgets.forEach(widget => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${widget.id}</td>
                <td>${widget.name}</td>
                <td>${widget.token_symbol}</td>
                <td><span class="status-badge status-${widget.active ? 'active' : 'inactive'}">${widget.active ? 'Ativo' : 'Inativo'}</span></td>
                <td>${new Date(widget.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button class="btn btn-primary" onclick="admin.editWidget(${widget.id})">Editar</button>
                    <button class="btn btn-danger" onclick="admin.deleteWidget(${widget.id})">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderTokensTable(tokens) {
        const tbody = document.getElementById('tokens-table');
        tbody.innerHTML = '';
        
        if (tokens.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum token encontrado</td></tr>';
            return;
        }
        
        tokens.forEach(token => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${token.symbol}</td>
                <td>${token.name}</td>
                <td>${this.formatAddress(token.contract_address)}</td>
                <td>${token.price} BNB</td>
                <td>${token.total_supply}</td>
                <td><span class="status-badge status-${token.active ? 'active' : 'inactive'}">${token.active ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="admin.editToken(${token.id})">Editar</button>
                    <button class="btn btn-secondary" onclick="admin.viewContract('${token.contract_address}')">Ver Contrato</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderTransactionsTable(transactions) {
        const tbody = document.getElementById('transactions-table');
        tbody.innerHTML = '';
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma transação encontrada</td></tr>';
            return;
        }
        
        transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatAddress(tx.hash)}</td>
                <td>${this.formatAddress(tx.user_address)}</td>
                <td>${tx.token_symbol}</td>
                <td>${tx.token_amount}</td>
                <td>${tx.bnb_amount} BNB</td>
                <td>${new Date(tx.created_at).toLocaleDateString('pt-BR')}</td>
                <td><span class="status-badge status-${tx.status === 'completed' ? 'active' : 'pending'}">${tx.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-table');
        tbody.innerHTML = '';
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum usuário encontrado</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${this.formatAddress(user.wallet_address)}</td>
                <td>${user.widget_count}</td>
                <td>${new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                <td><span class="status-badge status-${user.active ? 'active' : 'inactive'}">${user.active ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="admin.editUser(${user.id})">Editar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    populateTokenSelect(widgets) {
        const select = document.getElementById('widget-token');
        select.innerHTML = '<option value="">Selecione um token</option>';
        
        // Extrair tokens únicos
        const tokens = [...new Set(widgets.map(w => w.token_symbol))];
        
        tokens.forEach(token => {
            const option = document.createElement('option');
            option.value = token;
            option.textContent = token;
            select.appendChild(option);
        });
    }

    async createWidget(event) {
        event.preventDefault();
        
        const name = document.getElementById('widget-name').value;
        const token = document.getElementById('widget-token').value;
        const theme = document.getElementById('widget-theme').value;
        
        if (!name || !token) {
            this.showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/widgets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    token_symbol: token,
                    theme,
                    active: true
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Widget criado com sucesso!', 'success');
                this.closeModal('create-widget-modal');
                await this.loadWidgets();
                
                // Limpar formulário
                document.getElementById('widget-name').value = '';
                document.getElementById('widget-token').value = '';
                document.getElementById('widget-theme').value = 'light';
            } else {
                this.showAlert('Erro ao criar widget: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao criar widget:', error);
            this.showAlert('Erro ao criar widget: ' + error.message, 'error');
        }
    }

    async createToken(event) {
        event.preventDefault();
        
        if (!this.isConnected) {
            this.showAlert('Conecte sua carteira MetaMask primeiro!', 'error');
            return;
        }
        
        const name = document.getElementById('token-name').value;
        const symbol = document.getElementById('token-symbol').value;
        const initialSupply = document.getElementById('token-initial-supply').value;
        const maxSupply = document.getElementById('token-max-supply').value;
        const price = document.getElementById('token-price').value;
        
        if (!name || !symbol || !initialSupply || !maxSupply || !price) {
            this.showAlert('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        try {
            this.showAlert('Criando token na blockchain... Isso pode levar alguns minutos.', 'success');
            
            // Simular criação de token (implementar Web3 real aqui)
            await this.simulateTokenCreation(name, symbol, initialSupply, maxSupply, price);
            
        } catch (error) {
            console.error('❌ Erro ao criar token:', error);
            this.showAlert('Erro ao criar token: ' + error.message, 'error');
        }
    }

    async simulateTokenCreation(name, symbol, initialSupply, maxSupply, price) {
        // Simular delay de transação
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Simular endereço de contrato
        const contractAddress = '0x' + Math.random().toString(16).substr(2, 40);
        
        // Salvar no backend
        const response = await fetch(`${this.apiBaseUrl}/tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                symbol,
                initial_supply: initialSupply,
                max_supply: maxSupply,
                price,
                contract_address: contractAddress,
                creator_address: this.userAccount,
                active: true
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.showAlert('Token criado com sucesso na blockchain!', 'success');
            this.closeModal('create-token-modal');
            await this.loadTokens();
            
            // Limpar formulário
            document.getElementById('token-name').value = '';
            document.getElementById('token-symbol').value = '';
            document.getElementById('token-initial-supply').value = '';
            document.getElementById('token-max-supply').value = '';
            document.getElementById('token-price').value = '';
        } else {
            throw new Error(data.error || 'Falha ao salvar token');
        }
    }

    async saveSettings() {
        const tokenCreationFee = document.getElementById('token-creation-fee').value;
        const defaultBlockchain = document.getElementById('default-blockchain').value;
        const testMode = document.getElementById('test-mode').value;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token_creation_fee: tokenCreationFee,
                    default_blockchain: defaultBlockchain,
                    test_mode: testMode === 'true'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Configurações salvas com sucesso!', 'success');
            } else {
                this.showAlert('Erro ao salvar configurações: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
            this.showAlert('Erro ao salvar configurações: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        // Fechar modals clicando fora
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    }

    showSection(sectionName) {
        // Remover classe active de todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remover classe active de todos os nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Ativar seção e nav item correspondente
        document.getElementById(`${sectionName}-section`).classList.add('active');
        event.target.classList.add('active');
        
        // Atualizar título
        const titles = {
            dashboard: 'Dashboard',
            widgets: 'Gerenciar Widgets',
            tokens: 'Gerenciar Tokens',
            transactions: 'Histórico de Transações',
            users: 'Gerenciar Usuários',
            analytics: 'Analytics Avançadas',
            settings: 'Configurações do Sistema'
        };
        
        document.querySelector('.header-title').textContent = titles[sectionName] || 'Dashboard';
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showAlert(message, type) {
        // Remover alerts existentes
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Criar novo alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Inserir no início da área de conteúdo
        const contentArea = document.querySelector('.content-area');
        contentArea.insertBefore(alert, contentArea.firstChild);
        
        // Remover após 5 segundos
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    // Métodos para ações das tabelas
    async editWidget(id) {
        this.showAlert('Função de edição em desenvolvimento', 'success');
    }

    async deleteWidget(id) {
        if (confirm('Tem certeza que deseja excluir este widget?')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/widgets/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.showAlert('Widget excluído com sucesso!', 'success');
                    await this.loadWidgets();
                } else {
                    this.showAlert('Erro ao excluir widget: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('❌ Erro ao excluir widget:', error);
                this.showAlert('Erro ao excluir widget: ' + error.message, 'error');
            }
        }
    }

    async editToken(id) {
        this.showAlert('Função de edição em desenvolvimento', 'success');
    }

    viewContract(address) {
        const explorerUrl = `https://testnet.bscscan.com/address/${address}`;
        window.open(explorerUrl, '_blank');
    }

    async editUser(id) {
        this.showAlert('Função de edição em desenvolvimento', 'success');
    }
}

// Funções globais para HTML
function showSection(sectionName) {
    admin.showSection(sectionName);
}

function showModal(modalId) {
    admin.showModal(modalId);
}

function closeModal(modalId) {
    admin.closeModal(modalId);
}

function connectMetaMask() {
    admin.connectMetaMask();
}

function createWidget(event) {
    admin.createWidget(event);
}

function createToken(event) {
    admin.createToken(event);
}

function saveSettings() {
    admin.saveSettings();
}

// Inicializar painel quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.admin = new AdminPanel();
});
