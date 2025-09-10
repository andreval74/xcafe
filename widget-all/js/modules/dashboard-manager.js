/**
 * 📊 DASHBOARD MANAGER - Gerenciamento do Dashboard
 * 
 * 📋 RESPONSABILIDADES:
 * - Inicializar dashboard após conexão wallet
 * - Gerenciar navegação entre seções
 * - Carregar dados do usuário
 * - Integrar com ContractManager e DataManager
 * - Atualizar UI em tempo real
 * 
 * 🔧 SEÇÕES:
 * - overview: Visão geral com estatísticas
 * - widgets: Lista de contratos/widgets
 * - credits: Gerenciamento de créditos
 * - transactions: Histórico de transações
 * - analytics: Gráficos e relatórios
 * - settings: Configurações da conta
 * 
 * 💡 USO:
 * - const dashboard = new DashboardManager();
 * - await dashboard.init(walletAddress);
 */

class DashboardManager {
    constructor() {
        this.currentWallet = null;
        this.currentSection = 'overview';
        this.contractManager = null;
        this.dataManager = null;
        this.updateInterval = null;
        
        this.sections = {
            overview: this.renderOverview.bind(this),
            widgets: this.renderWidgets.bind(this),
            credits: this.renderCredits.bind(this),
            transactions: this.renderTransactions.bind(this),
            analytics: this.renderAnalytics.bind(this),
            settings: this.renderSettings.bind(this)
        };
    }

    // ==================== INICIALIZAÇÃO ====================
    
    /**
     * Inicializa o dashboard
     */
    async init(walletAddress) {
        try {
            console.log('🚀 Inicializando Dashboard para:', walletAddress);
            
            this.currentWallet = walletAddress;
            
            // Inicializar managers
            this.contractManager = new ContractManager();
            this.dataManager = window.dataManager || null;
            
            // Configurar UI
            this.setupUI();
            this.setupNavigation();
            this.updateConnectionStatus(true);
            
            // Carregar seção inicial
            await this.loadSection('overview');
            
            // Configurar auto-update
            this.startAutoUpdate();
            
            console.log('✅ Dashboard inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar dashboard:', error);
            this.showError('Erro ao carregar dashboard');
        }
    }

    /**
     * Configurar interface do usuário
     */
    setupUI() {
        // Exibir endereço da wallet truncado
        const walletDisplay = this.truncateAddress(this.currentWallet);
        document.querySelector('.sidebar-header h4').innerHTML = `
            <i class="fas fa-cube text-primary me-2"></i>
            Widget SaaS
        `;
        document.querySelector('.sidebar-header small').textContent = `Wallet: ${walletDisplay}`;
    }

    /**
     * Configurar navegação
     */
    setupNavigation() {
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                await this.loadSection(section);
            });
        });
    }

    /**
     * Atualizar status de conexão
     */
    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
            statusEl.innerHTML = connected 
                ? '<i class="fas fa-check-circle me-1"></i>Conectado'
                : '<i class="fas fa-times-circle me-1"></i>Desconectado';
        }
    }

    // ==================== NAVEGAÇÃO ====================
    
    /**
     * Carrega uma seção específica
     */
    async loadSection(sectionName) {
        try {
            // Atualizar navegação ativa
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
            
            this.currentSection = sectionName;
            
            // Renderizar seção
            const renderFunction = this.sections[sectionName];
            if (renderFunction) {
                await renderFunction();
            } else {
                this.showError(`Seção "${sectionName}" não encontrada`);
            }
            
        } catch (error) {
            console.error(`❌ Erro ao carregar seção ${sectionName}:`, error);
            this.showError('Erro ao carregar seção');
        }
    }

    // ==================== SEÇÕES DO DASHBOARD ====================
    
    /**
     * Renderiza seção Overview
     */
    async renderOverview() {
        // Carregar dados do servidor
        const overviewData = await this.loadOverviewData();
        const userContracts = await this.loadUserContracts();
        
        const stats = overviewData.success ? overviewData.overview.summary : {
            totalContracts: 0,
            totalSales: 0,
            totalVolume: 0,
            totalFees: 0
        };
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Visão Geral</h2>
                <button class="btn btn-primary" onclick="dashboard.showNewContractModal()">
                    <i class="fas fa-plus me-2"></i>Novo Contrato
                </button>
            </div>
            
            <!-- Cards de Estatísticas -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card stats-card text-primary">
                        <div class="stats-number">${stats.totalContracts}</div>
                        <div class="stats-label">Contratos</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card text-success">
                        <div class="stats-number">${stats.totalSales}</div>
                        <div class="stats-label">Vendas</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card text-info">
                        <div class="stats-number">${stats.totalVolume.toFixed(2)} ETH</div>
                        <div class="stats-label">Volume</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card text-warning">
                        <div class="stats-number">${stats.totalFees.toFixed(4)} ETH</div>
                        <div class="stats-label">Taxas Geradas</div>
                    </div>
                </div>
            </div>
            
            <!-- Contratos Recentes -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Contratos Recentes</h5>
                </div>
                <div class="card-body">
                    ${this.renderRecentContracts(userContracts.contracts || [])}
                </div>
            </div>
        `;
        
        this.updateMainContent(content);
    }

    /**
     * Renderiza seção Widgets/Contratos
     */
    async renderWidgets() {
        const userContracts = await this.loadUserContracts();
        const contracts = userContracts.contracts || [];
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Meus Contratos</h2>
                <button class="btn btn-primary" onclick="dashboard.showNewContractModal()">
                    <i class="fas fa-plus me-2"></i>Novo Contrato
                </button>
            </div>
            
            <div class="row">
                ${contracts.map(contract => this.renderContractCard(contract)).join('')}
                
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 border-dashed">
                        <div class="card-body d-flex flex-column justify-content-center align-items-center text-center">
                            <i class="fas fa-plus fa-3x text-muted mb-3"></i>
                            <h5>Cadastrar Novo Contrato</h5>
                            <p class="text-muted">Configure um novo contrato para seu projeto</p>
                            <button class="btn btn-primary" onclick="dashboard.showNewContractModal()">
                                <i class="fas fa-plus me-2"></i>Começar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            ${contracts.length === 0 ? `
                <div class="text-center py-5">
                    <i class="fas fa-puzzle-piece fa-3x text-muted mb-3"></i>
                    <h4>Nenhum contrato cadastrado</h4>
                    <p class="text-muted">Cadastre seu primeiro contrato para começar a usar a plataforma</p>
                    <button class="btn btn-primary" onclick="dashboard.showNewContractModal()">
                        <i class="fas fa-plus me-2"></i>Cadastrar Contrato
                    </button>
                </div>
            ` : ''}
            
            <style>
                .border-dashed {
                    border: 2px dashed #dee2e6 !important;
                    background: #f8f9fa !important;
                }
            </style>
        `;
        
        this.updateMainContent(content);
    }

    /**
     * Renderiza seção Créditos
     */
    async renderCredits() {
        const credits = await this.getCredits();
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Créditos</h2>
                <button class="btn btn-success" onclick="dashboard.showBuyCreditModal()">
                    <i class="fas fa-plus me-2"></i>Comprar Créditos
                </button>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card stats-card text-success">
                        <div class="stats-number">${credits.balance}</div>
                        <div class="stats-label">Saldo Atual</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card stats-card text-info">
                        <div class="stats-number">${credits.totalPurchased}</div>
                        <div class="stats-label">Total Comprado</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card stats-card text-warning">
                        <div class="stats-number">${credits.totalUsed}</div>
                        <div class="stats-label">Total Usado</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Histórico de Créditos</h5>
                </div>
                <div class="card-body">
                    ${this.renderCreditHistory(credits.history)}
                </div>
            </div>
        `;
        
        this.updateMainContent(content);
    }

    /**
     * Renderiza seção Transações
     */
    async renderTransactions() {
        const transactions = await this.getTransactions();
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Transações</h2>
                <div>
                    <select class="form-select d-inline-block w-auto me-2" id="filterType">
                        <option value="">Todos os tipos</option>
                        <option value="sale">Vendas</option>
                        <option value="fee">Taxas</option>
                        <option value="credit">Créditos</option>
                    </select>
                    <button class="btn btn-outline-primary" onclick="dashboard.exportTransactions()">
                        <i class="fas fa-download me-2"></i>Exportar
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Contrato</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${transactions.map(tx => this.renderTransactionRow(tx)).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    ${transactions.length === 0 ? `
                        <div class="text-center py-4">
                            <i class="fas fa-exchange-alt fa-2x text-muted mb-3"></i>
                            <p class="text-muted">Nenhuma transação encontrada</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        this.updateMainContent(content);
    }

    /**
     * Renderiza seção Analytics
     */
    async renderAnalytics() {
        const content = `
            <h2 class="mb-4">Analytics</h2>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Volume de Vendas</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="salesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Performance por Contrato</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="contractsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Métricas Detalhadas</h5>
                </div>
                <div class="card-body">
                    <div id="analyticsDetails">
                        Carregando dados...
                    </div>
                </div>
            </div>
        `;
        
        this.updateMainContent(content);
        
        // Carregar gráficos após renderizar
        setTimeout(() => this.loadCharts(), 100);
    }

    /**
     * Renderiza seção Configurações
     */
    async renderSettings() {
        const userSettings = await this.getUserSettings();
        
        const content = `
            <h2 class="mb-4">Configurações</h2>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Configurações da Conta</h5>
                        </div>
                        <div class="card-body">
                            <form id="settingsForm">
                                <div class="mb-3">
                                    <label class="form-label">Nome de Exibição</label>
                                    <input type="text" class="form-control" name="displayName" 
                                           value="${userSettings.displayName || ''}" 
                                           placeholder="Seu nome ou empresa">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Email (opcional)</label>
                                    <input type="email" class="form-control" name="email" 
                                           value="${userSettings.email || ''}" 
                                           placeholder="seu@email.com">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Website</label>
                                    <input type="url" class="form-control" name="website" 
                                           value="${userSettings.website || ''}" 
                                           placeholder="https://seusite.com">
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="notifications" 
                                               ${userSettings.notifications ? 'checked' : ''}>
                                        <label class="form-check-label">
                                            Receber notificações por email
                                        </label>
                                    </div>
                                </div>
                                
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-2"></i>Salvar Configurações
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Informações da Wallet</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Endereço:</strong></p>
                            <p class="text-muted small">${this.currentWallet}</p>
                            
                            <hr>
                            
                            <p><strong>Primeira conexão:</strong></p>
                            <p class="text-muted">${userSettings.firstLogin || 'Hoje'}</p>
                            
                            <hr>
                            
                            <button class="btn btn-outline-danger btn-sm w-100" onclick="dashboard.disconnectWallet()">
                                <i class="fas fa-sign-out-alt me-2"></i>Desconectar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.updateMainContent(content);
        
        // Configurar formulário
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings(new FormData(e.target));
        });
    }

    // ==================== RENDERIZAÇÃO DE COMPONENTES ====================
    
    /**
     * Renderiza card de contrato
     */
    renderContractCard(contract) {
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title">${contract.name}</h5>
                            <span class="badge badge-status bg-success">Ativo</span>
                        </div>
                        
                        <p class="text-muted small mb-2">${contract.symbol}</p>
                        <p class="card-text">${contract.description || 'Sem descrição'}</p>
                        
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <small class="text-muted">Vendas</small>
                                <div class="fw-bold">${contract.stats.totalSales}</div>
                            </div>
                            <div class="col-4">
                                <small class="text-muted">Volume</small>
                                <div class="fw-bold">${contract.stats.totalVolume.toFixed(2)}</div>
                            </div>
                            <div class="col-4">
                                <small class="text-muted">API Calls</small>
                                <div class="fw-bold">${contract.stats.apiCalls}</div>
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" 
                                    onclick="dashboard.showContractDetails('${contract.address}')">
                                <i class="fas fa-eye me-1"></i>Ver Detalhes
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="dashboard.copyApiKey('${contract.apiKey}')">
                                <i class="fas fa-key me-1"></i>Copiar API Key
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Atualiza o conteúdo principal
     */
    updateMainContent(content) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    }

    // ==================== MODAIS E INTERAÇÕES ====================
    
    /**
     * Mostra modal para novo contrato
     */
    showNewContractModal() {
        const modalHtml = `
            <div class="modal fade" id="newContractModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Cadastrar Novo Contrato</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="newContractForm">
                                <div class="mb-3">
                                    <label class="form-label">Endereço do Contrato</label>
                                    <input type="text" class="form-control" name="contractAddress" required
                                           placeholder="0x..." pattern="^0x[a-fA-F0-9]{40}$">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Nome do Token/Projeto</label>
                                    <input type="text" class="form-control" name="contractName" required
                                           placeholder="Meu Token">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Símbolo</label>
                                    <input type="text" class="form-control" name="tokenSymbol" 
                                           placeholder="MTK" maxlength="10">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Descrição</label>
                                    <textarea class="form-control" name="description" rows="3"
                                              placeholder="Descreva seu projeto..."></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Website (opcional)</label>
                                    <input type="url" class="form-control" name="website"
                                           placeholder="https://seusite.com">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Categoria</label>
                                    <select class="form-select" name="category">
                                        <option value="token">Token</option>
                                        <option value="nft">NFT</option>
                                        <option value="defi">DeFi</option>
                                        <option value="game">Game</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="dashboard.submitNewContract()">
                                <i class="fas fa-save me-2"></i>Cadastrar Contrato
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('newContractModal'));
        modal.show();
        
        // Limpar modal após fechar
        document.getElementById('newContractModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    /**
     * Submete novo contrato
     */
    async submitNewContract() {
        try {
            const form = document.getElementById('newContractForm');
            const formData = new FormData(form);
            
            const contractData = {
                contractAddress: formData.get('contractAddress'),
                ownerWallet: this.currentWallet,
                contractName: formData.get('contractName'),
                tokenSymbol: formData.get('tokenSymbol'),
                description: formData.get('description'),
                website: formData.get('website'),
                category: formData.get('category')
            };
            
            // Usar API em vez do ContractManager local
            const result = await this.registerContractAPI(contractData);
            
            if (result.success) {
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('newContractModal'));
                if (modal) modal.hide();
                
                // Mostrar sucesso
                this.showSuccess('Contrato cadastrado com sucesso!');
                
                // Recarregar seção atual
                await this.loadSection(this.currentSection);
            } else {
                this.showError(result.error || 'Erro ao cadastrar contrato');
            }
            
        } catch (error) {
            console.error('❌ Erro ao cadastrar contrato:', error);
            this.showError('Erro ao cadastrar contrato');
        }
    }

    // ==================== UTILITÁRIOS ====================
    
    /**
     * Calcula estatísticas para overview
     */
    calculateOverviewStats(contracts) {
        return contracts.reduce((stats, contract) => {
            stats.totalContracts = contracts.length;
            stats.totalSales += contract.stats.totalSales;
            stats.totalVolume += contract.stats.totalVolume;
            stats.totalFees += contract.stats.totalFees;
            return stats;
        }, { totalContracts: 0, totalSales: 0, totalVolume: 0, totalFees: 0 });
    }

    /**
     * Trunca endereço da wallet
     */
    truncateAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Mostra mensagem de sucesso
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Mostra toast genérico
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon} me-2"></i>${message}
            <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Inicia auto-update
     */
    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.loadSection(this.currentSection);
        }, 30000); // Atualizar a cada 30 segundos
    }

    /**
     * Para auto-update
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // ==================== MÉTODOS DE API ====================
    
    /**
     * Carrega dados de overview da API
     */
    async loadOverviewData() {
        try {
            const response = await fetch('/api/dashboard/overview');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Erro ao carregar overview:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Carrega lista de contratos do usuário
     */
    async loadUserContracts() {
        try {
            const response = await fetch('/api/contracts/list');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Erro ao carregar contratos:', error);
            return { success: false, contracts: [] };
        }
    }

    /**
     * Registra novo contrato via API
     */
    async registerContractAPI(contractData) {
        try {
            const response = await fetch('/api/contracts/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contractData)
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Erro ao registrar contrato:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== DADOS MOCKADOS (TEMPORÁRIO) ====================
    
    async getCredits() {
        return {
            balance: 1250,
            totalPurchased: 2000,
            totalUsed: 750,
            history: []
        };
    }

    async getTransactions() {
        return [];
    }

    async getUserSettings() {
        return {
            displayName: '',
            email: '',
            website: '',
            notifications: true,
            firstLogin: new Date().toLocaleDateString()
        };
    }

    renderRecentContracts(contracts) {
        if (contracts.length === 0) {
            return '<p class="text-muted">Nenhum contrato cadastrado ainda.</p>';
        }
        
        return contracts.slice(0, 5).map(contract => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <strong>${contract.name}</strong>
                    <span class="badge bg-primary ms-2">${contract.symbol}</span>
                    <br>
                    <small class="text-muted">${this.truncateAddress(contract.address)}</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold">${contract.stats.totalSales} vendas</div>
                    <small class="text-muted">${contract.stats.totalVolume.toFixed(2)} ETH</small>
                </div>
            </div>
        `).join('');
    }

    renderCreditHistory(history) {
        return '<p class="text-muted">Histórico em desenvolvimento...</p>';
    }

    renderTransactionRow(tx) {
        return '<tr><td colspan="6" class="text-muted">Dados em desenvolvimento...</td></tr>';
    }

    loadCharts() {
        console.log('📊 Carregando gráficos...');
    }

    copyApiKey(apiKey) {
        navigator.clipboard.writeText(apiKey);
        this.showSuccess('API Key copiada para área de transferência!');
    }

    disconnectWallet() {
        if (confirm('Deseja realmente desconectar a wallet?')) {
            window.location.href = 'index.html';
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DashboardManager = DashboardManager;
    window.dashboard = null; // Será inicializado após conexão
}

console.log('✅ DashboardManager carregado');
