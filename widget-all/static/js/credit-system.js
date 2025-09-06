/**
 * Widget SaaS - Sistema de Créditos
 * Sistema completo de gerenciamento de créditos e planos
 */

class CreditSystem {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8001/api';
        this.plans = {
            free: {
                name: 'Gratuito',
                credits: 1000,
                price: 0,
                features: ['1 Widget', '1000 Transações/mês', 'Suporte básico'],
                limits: {
                    widgets: 1,
                    transactions: 1000,
                    tokens: 1
                }
            },
            basic: {
                name: 'Básico',
                credits: 10000,
                price: 0.1, // BNB
                features: ['5 Widgets', '10.000 Transações/mês', 'Suporte prioritário', 'Analytics básicas'],
                limits: {
                    widgets: 5,
                    transactions: 10000,
                    tokens: 3
                }
            },
            pro: {
                name: 'Profissional',
                credits: 50000,
                price: 0.5, // BNB
                features: ['20 Widgets', '50.000 Transações/mês', 'Suporte 24/7', 'Analytics avançadas', 'API personalizada'],
                limits: {
                    widgets: 20,
                    transactions: 50000,
                    tokens: 10
                }
            },
            enterprise: {
                name: 'Empresarial',
                credits: -1, // Ilimitado
                price: 2.0, // BNB
                features: ['Widgets ilimitados', 'Transações ilimitadas', 'Suporte dedicado', 'White-label', 'Customizações'],
                limits: {
                    widgets: -1,
                    transactions: -1,
                    tokens: -1
                }
            }
        };
        
        this.creditCosts = {
            widget_creation: 100,
            token_creation: 500,
            transaction: 1,
            api_call: 0.1,
            analytics_view: 5
        };
    }

    /**
     * Verificar saldo de créditos do usuário
     */
    async getUserCredits(userId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/credits/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return {
                    balance: data.credits.balance,
                    plan: data.credits.plan,
                    expires_at: data.credits.expires_at,
                    limits: this.plans[data.credits.plan]?.limits || this.plans.free.limits
                };
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erro ao verificar créditos:', error);
            return null;
        }
    }

    /**
     * Debitar créditos por ação
     */
    async debitCredits(userId, action, amount = null) {
        const cost = amount || this.creditCosts[action] || 1;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/credits/debit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    action: action,
                    cost: cost,
                    timestamp: new Date().toISOString()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    new_balance: data.new_balance,
                    transaction_id: data.transaction_id
                };
            } else {
                return {
                    success: false,
                    error: data.error,
                    balance: data.balance || 0
                };
            }
        } catch (error) {
            console.error('❌ Erro ao debitar créditos:', error);
            return {
                success: false,
                error: 'Erro interno do sistema'
            };
        }
    }

    /**
     * Creditar créditos (recarga/upgrade)
     */
    async creditCredits(userId, amount, reason = 'manual_credit') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/credits/credit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    amount: amount,
                    reason: reason,
                    timestamp: new Date().toISOString()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    new_balance: data.new_balance,
                    transaction_id: data.transaction_id
                };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            console.error('❌ Erro ao creditar créditos:', error);
            return { success: false, error: 'Erro interno do sistema' };
        }
    }

    /**
     * Comprar plano de créditos
     */
    async purchasePlan(userId, planType, paymentMethod = 'metamask') {
        const plan = this.plans[planType];
        
        if (!plan) {
            return { success: false, error: 'Plano não encontrado' };
        }
        
        try {
            // Se é plano gratuito, apenas ativar
            if (planType === 'free') {
                return await this.activateFreePlan(userId);
            }
            
            // Para outros planos, processar pagamento
            if (paymentMethod === 'metamask') {
                return await this.processMetaMaskPayment(userId, planType, plan);
            }
            
            return { success: false, error: 'Método de pagamento não suportado' };
            
        } catch (error) {
            console.error('❌ Erro ao comprar plano:', error);
            return { success: false, error: 'Erro interno do sistema' };
        }
    }

    /**
     * Ativar plano gratuito
     */
    async activateFreePlan(userId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/credits/activate-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    plan_type: 'free',
                    credits: this.plans.free.credits,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
                    payment_hash: null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    plan: 'free',
                    credits: this.plans.free.credits,
                    expires_at: data.expires_at
                };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            console.error('❌ Erro ao ativar plano gratuito:', error);
            return { success: false, error: 'Erro interno do sistema' };
        }
    }

    /**
     * Processar pagamento via MetaMask
     */
    async processMetaMaskPayment(userId, planType, plan) {
        // Verificar se MetaMask está conectado
        if (typeof window.ethereum === 'undefined') {
            return { success: false, error: 'MetaMask não encontrado' };
        }
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length === 0) {
                return { success: false, error: 'MetaMask não conectado' };
            }
            
            const userAccount = accounts[0];
            const valueInWei = window.ethereum.utils?.toWei(plan.price.toString(), 'ether') || 
                              Math.floor(plan.price * 1e18).toString();
            
            // Simular transação (implementar Web3 real aqui)
            const fakeHash = '0x' + Math.random().toString(16).substr(2, 64);
            
            // Registrar pagamento no backend
            const response = await fetch(`${this.apiBaseUrl}/credits/process-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    plan_type: planType,
                    credits: plan.credits,
                    payment_amount: plan.price,
                    payment_currency: 'BNB',
                    payment_hash: fakeHash,
                    payer_address: userAccount,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    plan: planType,
                    credits: plan.credits,
                    payment_hash: fakeHash,
                    expires_at: data.expires_at
                };
            }
            
            return { success: false, error: data.error };
            
        } catch (error) {
            console.error('❌ Erro no pagamento MetaMask:', error);
            return { success: false, error: 'Erro no pagamento: ' + error.message };
        }
    }

    /**
     * Verificar se usuário pode executar ação
     */
    async canPerformAction(userId, action) {
        const userCredits = await this.getUserCredits(userId);
        
        if (!userCredits) {
            return { can: false, reason: 'Usuário não encontrado' };
        }
        
        const cost = this.creditCosts[action] || 1;
        
        // Verificar saldo
        if (userCredits.balance !== -1 && userCredits.balance < cost) {
            return { 
                can: false, 
                reason: 'Créditos insuficientes',
                required: cost,
                available: userCredits.balance
            };
        }
        
        // Verificar limites do plano
        const limits = userCredits.limits;
        
        if (action === 'widget_creation' && limits.widgets !== -1) {
            const widgetCount = await this.getUserWidgetCount(userId);
            if (widgetCount >= limits.widgets) {
                return { 
                    can: false, 
                    reason: 'Limite de widgets atingido',
                    limit: limits.widgets,
                    current: widgetCount
                };
            }
        }
        
        if (action === 'token_creation' && limits.tokens !== -1) {
            const tokenCount = await this.getUserTokenCount(userId);
            if (tokenCount >= limits.tokens) {
                return { 
                    can: false, 
                    reason: 'Limite de tokens atingido',
                    limit: limits.tokens,
                    current: tokenCount
                };
            }
        }
        
        return { can: true };
    }

    /**
     * Obter histórico de transações de créditos
     */
    async getCreditHistory(userId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/credits/history/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.history;
            }
            
            return [];
        } catch (error) {
            console.error('❌ Erro ao obter histórico:', error);
            return [];
        }
    }

    /**
     * Obter estatísticas de uso
     */
    async getUsageStats(userId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/credits/usage/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.usage;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return null;
        }
    }

    /**
     * Funções auxiliares
     */
    async getUserWidgetCount(userId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/widgets/count/${userId}`);
            const data = await response.json();
            return data.count || 0;
        } catch (error) {
            return 0;
        }
    }

    async getUserTokenCount(userId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/tokens/count/${userId}`);
            const data = await response.json();
            return data.count || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Renderizar painel de créditos
     */
    renderCreditPanel(containerId, userId) {
        const container = document.getElementById(containerId);
        
        container.innerHTML = `
            <div class="credit-panel">
                <div class="credit-header">
                    <h3>💳 Seus Créditos</h3>
                    <button class="btn btn-primary" onclick="creditSystem.showPlansModal()">
                        ⬆️ Upgrade
                    </button>
                </div>
                
                <div class="credit-info" id="credit-info-${userId}">
                    <div class="loading">Carregando...</div>
                </div>
                
                <div class="usage-stats" id="usage-stats-${userId}">
                    <!-- Estatísticas serão carregadas aqui -->
                </div>
                
                <div class="credit-history" id="credit-history-${userId}">
                    <!-- Histórico será carregado aqui -->
                </div>
            </div>
        `;
        
        // Carregar dados
        this.loadCreditPanelData(userId);
    }

    async loadCreditPanelData(userId) {
        const credits = await this.getUserCredits(userId);
        const usage = await this.getUsageStats(userId);
        const history = await this.getCreditHistory(userId);
        
        // Renderizar informações de créditos
        const creditInfoContainer = document.getElementById(`credit-info-${userId}`);
        if (credits) {
            creditInfoContainer.innerHTML = `
                <div class="credit-balance">
                    <div class="balance-amount">${credits.balance === -1 ? '∞' : credits.balance}</div>
                    <div class="balance-label">Créditos Disponíveis</div>
                </div>
                
                <div class="plan-info">
                    <div class="plan-name">Plano ${this.plans[credits.plan]?.name || 'Desconhecido'}</div>
                    <div class="plan-expires">Expira em: ${new Date(credits.expires_at).toLocaleDateString('pt-BR')}</div>
                </div>
            `;
        }
        
        // Renderizar estatísticas de uso
        const usageContainer = document.getElementById(`usage-stats-${userId}`);
        if (usage) {
            usageContainer.innerHTML = `
                <h4>📊 Uso Este Mês</h4>
                <div class="usage-grid">
                    <div class="usage-item">
                        <span>Widgets: ${usage.widgets_used}/${credits.limits.widgets === -1 ? '∞' : credits.limits.widgets}</span>
                    </div>
                    <div class="usage-item">
                        <span>Transações: ${usage.transactions_used}/${credits.limits.transactions === -1 ? '∞' : credits.limits.transactions}</span>
                    </div>
                    <div class="usage-item">
                        <span>Tokens: ${usage.tokens_used}/${credits.limits.tokens === -1 ? '∞' : credits.limits.tokens}</span>
                    </div>
                </div>
            `;
        }
        
        // Renderizar histórico (últimas 10 transações)
        const historyContainer = document.getElementById(`credit-history-${userId}`);
        if (history && history.length > 0) {
            historyContainer.innerHTML = `
                <h4>📋 Histórico Recente</h4>
                <div class="history-list">
                    ${history.slice(0, 10).map(item => `
                        <div class="history-item">
                            <span class="action">${item.action}</span>
                            <span class="amount ${item.type === 'credit' ? 'positive' : 'negative'}">
                                ${item.type === 'credit' ? '+' : '-'}${item.amount}
                            </span>
                            <span class="date">${new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    showPlansModal() {
        // Criar modal de planos
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'plans-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💎 Escolha Seu Plano</h3>
                    <span class="close" onclick="creditSystem.closePlansModal()">&times;</span>
                </div>
                
                <div class="plans-grid">
                    ${Object.entries(this.plans).map(([type, plan]) => `
                        <div class="plan-card ${type === 'pro' ? 'featured' : ''}">
                            <div class="plan-header">
                                <h4>${plan.name}</h4>
                                <div class="plan-price">
                                    ${plan.price === 0 ? 'Gratuito' : `${plan.price} BNB`}
                                </div>
                            </div>
                            
                            <div class="plan-features">
                                ${plan.features.map(feature => `<div class="feature">✅ ${feature}</div>`).join('')}
                            </div>
                            
                            <button class="btn btn-primary" onclick="creditSystem.selectPlan('${type}')">
                                ${type === 'free' ? 'Ativar' : 'Comprar'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    closePlansModal() {
        const modal = document.getElementById('plans-modal');
        if (modal) {
            modal.remove();
        }
    }

    async selectPlan(planType) {
        // Aqui você precisaria do userId do usuário logado
        const userId = this.getCurrentUserId(); // Implementar esta função
        
        const result = await this.purchasePlan(userId, planType);
        
        if (result.success) {
            alert(`Plano ${this.plans[planType].name} ativado com sucesso!`);
            this.closePlansModal();
            // Recarregar dados do painel
            this.loadCreditPanelData(userId);
        } else {
            alert(`Erro ao ativar plano: ${result.error}`);
        }
    }

    getCurrentUserId() {
        // Implementar: obter ID do usuário logado
        return 1; // Placeholder
    }
}

// Instância global
window.creditSystem = new CreditSystem();
