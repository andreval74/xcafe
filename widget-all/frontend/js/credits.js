// Credits Management System - USDT Integration
class CreditsManager {
    constructor() {
        console.log('CreditsManager: Inicializando sistema de créditos...');
        this.apiUrl = 'http://localhost:3000/api/credits';
        this.packages = {};
        this.userCredits = 0;
        this.init();
    }

    async init() {
        console.log('CreditsManager: Carregando dados iniciais...');
        try {
            await this.loadPackages();
            await this.loadUserBalance();
            this.setupEventListeners();
            this.renderPackages();
            console.log('CreditsManager: Inicialização concluída com sucesso');
        } catch (error) {
            console.error('CreditsManager: Erro na inicialização:', error);
        }
    }

    async loadPackages() {
        try {
            const response = await fetch(`${this.apiUrl}/packages`);
            const data = await response.json();
            
            if (data.success) {
                this.packages = data.packages;
                this.commissionRate = data.commission_rate;
                this.usdtContract = data.usdt_contract;
            }
        } catch (error) {
            console.error('Error loading packages:', error);
        }
    }

    async loadUserBalance() {
        try {
            const token = localStorage.getItem('wallet_address');
            if (!token) return;

            const response = await fetch(`${this.apiUrl}/balance`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userCredits = data.credits;
                this.updateCreditsDisplay();
            }
        } catch (error) {
            console.error('Error loading balance:', error);
        }
    }

    updateCreditsDisplay() {
        const creditsElements = document.querySelectorAll('.user-credits');
        creditsElements.forEach(el => {
            el.textContent = this.userCredits.toLocaleString();
        });
    }

    renderPackages() {
        const container = document.getElementById('credit-packages');
        if (!container) return;

        container.innerHTML = '';

        Object.entries(this.packages).forEach(([packageId, packageInfo]) => {
            const netCredits = packageInfo.credits - Math.floor(packageInfo.credits * this.commissionRate);
            const commission = Math.floor(packageInfo.credits * this.commissionRate);

            const packageCard = document.createElement('div');
            packageCard.className = 'col-md-4 mb-4';
            packageCard.innerHTML = `
                <div class="card credit-package-card" data-package="${packageId}">
                    <div class="card-body text-center">
                        <h5 class="card-title">${packageInfo.credits.toLocaleString()} Créditos</h5>
                        <div class="price-info mb-3">
                            <div class="original-price">$${packageInfo.usd_price}</div>
                            <div class="net-credits">Você recebe: ${netCredits.toLocaleString()} créditos</div>
                            <div class="commission-info">Comissão: ${commission} créditos (${(this.commissionRate * 100)}%)</div>
                        </div>
                        <button class="btn btn-primary btn-purchase" data-package="${packageId}">
                            Comprar com USDT
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(packageCard);
        });
    }

    setupEventListeners() {
        // Purchase button clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-purchase')) {
                const packageId = e.target.dataset.package;
                this.initiatePurchase(packageId);
            }
        });

        // Transaction verification
        const verifyBtn = document.getElementById('verify-transaction');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verifyTransaction());
        }
    }

    async initiatePurchase(packageId) {
        try {
            const packageInfo = this.packages[packageId];
            if (!packageInfo) {
                throw new Error('Pacote inválido');
            }

            // Check if MetaMask is connected
            if (!window.ethereum || !localStorage.getItem('wallet_address')) {
                alert('Por favor, conecte sua carteira MetaMask primeiro.');
                return;
            }

            // Show purchase modal
            this.showPurchaseModal(packageId, packageInfo);

        } catch (error) {
            console.error('Purchase initiation error:', error);
            alert('Erro ao iniciar compra: ' + error.message);
        }
    }

    showPurchaseModal(packageId, packageInfo) {
        const netCredits = packageInfo.credits - Math.floor(packageInfo.credits * this.commissionRate);
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'purchaseModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Comprar Créditos com USDT</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="purchase-info">
                            <h6>Detalhes da Compra:</h6>
                            <ul>
                                <li>Créditos: ${packageInfo.credits.toLocaleString()}</li>
                                <li>Preço: $${packageInfo.usd_price} USDT</li>
                                <li>Comissão (${(this.commissionRate * 100)}%): ${Math.floor(packageInfo.credits * this.commissionRate)} créditos</li>
                                <li><strong>Você receberá: ${netCredits.toLocaleString()} créditos</strong></li>
                            </ul>
                        </div>
                        
                        <div class="payment-instructions mt-4">
                            <h6>Instruções de Pagamento:</h6>
                            <ol>
                                <li>Envie <strong>$${packageInfo.usd_price} USDT</strong> para o endereço do contrato</li>
                                <li>Copie o hash da transação</li>
                                <li>Cole o hash abaixo e clique em "Verificar Pagamento"</li>
                            </ol>
                        </div>
                        
                        <div class="contract-info mt-3">
                            <label class="form-label">Endereço do Contrato USDT:</label>
                            <div class="input-group">
                                <input type="text" class="form-control" value="${this.usdtContract}" readonly>
                                <button class="btn btn-outline-secondary" type="button" onclick="navigator.clipboard.writeText('${this.usdtContract}')">
                                    Copiar
                                </button>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <label class="form-label">Hash da Transação:</label>
                            <input type="text" class="form-control" id="transaction-hash" placeholder="0x...">
                        </div>
                        
                        <div class="mt-3">
                            <label class="form-label">Tag de Operação (Opcional):</label>
                            <input type="text" class="form-control" id="operation-tag" placeholder="Identificador único da operação">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="creditsManager.processPurchase('${packageId}')">
                            Verificar Pagamento
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    async processPurchase(packageId) {
        try {
            const txHash = document.getElementById('transaction-hash').value.trim();
            const operationTag = document.getElementById('operation-tag').value.trim();
            
            if (!txHash) {
                alert('Por favor, insira o hash da transação.');
                return;
            }
            
            if (!txHash.startsWith('0x') || txHash.length !== 66) {
                alert('Hash da transação inválido. Deve começar com 0x e ter 66 caracteres.');
                return;
            }
            
            const token = localStorage.getItem('wallet_address');
            if (!token) {
                alert('Sessão expirada. Por favor, conecte sua carteira novamente.');
                return;
            }
            
            // Show loading
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Verificando...';
            btn.disabled = true;
            
            const response = await fetch(`${this.apiUrl}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    txHash,
                    packageId,
                    operationTag: operationTag || null,
                    chainId: 1 // Ethereum Mainnet
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(`Compra realizada com sucesso!\n\nCréditos adicionados: ${data.credits_added}\nComissão descontada: ${data.commission_deducted}\nTotal de créditos: ${data.total_credits}`);
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('purchaseModal'));
                modal.hide();
                
                // Reload balance
                await this.loadUserBalance();
                
            } else {
                alert('Erro na compra: ' + data.error);
            }
            
        } catch (error) {
            console.error('Purchase processing error:', error);
            alert('Erro ao processar compra: ' + error.message);
        } finally {
            // Restore button
            const btn = event.target;
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    async verifyTransaction() {
        try {
            const txHash = document.getElementById('verify-tx-hash').value.trim();
            
            if (!txHash) {
                alert('Por favor, insira o hash da transação.');
                return;
            }
            
            const token = localStorage.getItem('wallet_address');
            if (!token) {
                alert('Por favor, conecte sua carteira primeiro.');
                return;
            }
            
            const response = await fetch(`${this.apiUrl}/transaction/${txHash}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const tx = data.transaction;
                const statusText = tx.status === 'completed' ? 'Concluída' : 
                                 tx.status === 'pending' ? 'Pendente' : 'Falhou';
                
                alert(`Status da Transação:\n\nHash: ${tx.transaction_hash}\nStatus: ${statusText}\nCréditos: ${tx.credits}\nValor: $${tx.amount}\nData: ${new Date(tx.created_at).toLocaleString()}`);
            } else {
                alert('Transação não encontrada: ' + data.error);
            }
            
        } catch (error) {
            console.error('Transaction verification error:', error);
            alert('Erro ao verificar transação: ' + error.message);
        }
    }

    async loadTransactionHistory() {
        try {
            const token = localStorage.getItem('wallet_address');
            if (!token) return;

            const response = await fetch(`${this.apiUrl}/history?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderTransactionHistory(data.transactions);
            }
        } catch (error) {
            console.error('Error loading transaction history:', error);
        }
    }

    renderTransactionHistory(transactions) {
        const container = document.getElementById('transaction-history');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma transação encontrada.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-striped';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Créditos</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Hash</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(tx => `
                    <tr>
                        <td>${new Date(tx.created_at).toLocaleDateString()}</td>
                        <td>${tx.type === 'purchase' ? 'Compra' : 'Uso'}</td>
                        <td>${tx.credits > 0 ? '+' : ''}${tx.credits}</td>
                        <td>${tx.amount ? '$' + tx.amount : '-'}</td>
                        <td>
                            <span class="badge bg-${tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}">
                                ${tx.status === 'completed' ? 'Concluída' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}
                            </span>
                        </td>
                        <td>
                            ${tx.transaction_hash ? 
                                `<small><code>${tx.transaction_hash.substring(0, 10)}...</code></small>` : 
                                '-'
                            }
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = '';
        container.appendChild(table);
    }
}

// Initialize credits manager when DOM is loaded
console.log('Credits.js: Script carregado, inicializando CreditsManager...');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Credits.js: DOM carregado, criando CreditsManager...');
        window.creditsManager = new CreditsManager();
    });
} else {
    console.log('Credits.js: DOM já carregado, criando CreditsManager imediatamente...');
    window.creditsManager = new CreditsManager();
}

// Export for global access
if (typeof window !== 'undefined') {
    window.CreditsManager = CreditsManager;
}