class ProgressiveFlow {
    constructor() {
        this.currentSection = 'wallet';
        this.completedSections = new Set();
        this.sectionData = {};
        this.walletConnected = false;
        
        this.initializeFlow();
    }

    initializeFlow() {
        console.log('Inicializando Progressive Flow...');
        
        // Configurar eventos dos formulários
        this.setupFormEvents();
        
        // Verificar se já existe conexão de carteira
        this.checkIfAlreadyConnected();
        
        // Configurar observador de mudanças na carteira
        this.setupWalletEventListeners();
    }

    setupFormEvents() {
        // Eventos do formulário de informações básicas
        const basicForm = document.getElementById('basic-info-form');
        if (basicForm) {
            const inputs = basicForm.querySelectorAll('input[required]');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.validateBasicInfo());
            });
        }

        // Eventos do formulário de configuração do proprietário
        const ownerForm = document.getElementById('owner-config-form');
        if (ownerForm) {
            const inputs = ownerForm.querySelectorAll('input[required]');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.validateOwnerConfig());
            });
        }

        // Botão de deploy
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => this.handleDeploy());
        }

        // Botões de "Criar outro token"
        const createAnotherBtns = document.querySelectorAll('.create-another-token');
        createAnotherBtns.forEach(btn => {
            btn.addEventListener('click', () => this.resetFlow());
        });
    }

    async checkIfAlreadyConnected() {
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    console.log('Carteira já conectada:', accounts[0]);
                    
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    const networkName = this.getNetworkName(parseInt(chainId, 16));
                    
                    this.handleWalletComplete({
                        address: accounts[0],
                        network: networkName,
                        chainId: chainId
                    });
                }
            }
        } catch (error) {
            console.log('Erro ao verificar conexão existente:', error);
        }
    }

    setupWalletEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Contas alteradas:', accounts);
                if (accounts.length === 0) {
                    this.handleWalletDisconnect();
                } else {
                    this.updateWalletInfo(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Rede alterada:', chainId);
                this.updateNetworkInfo(chainId);
            });
        }
    }

    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            3: 'Ropsten Testnet',
            4: 'Rinkeby Testnet',
            5: 'Goerli Testnet',
            56: 'BSC Mainnet',
            97: 'BSC Testnet',
            137: 'Polygon Mainnet',
            80001: 'Polygon Mumbai',
            43114: 'Avalanche Mainnet',
            43113: 'Avalanche Fuji Testnet'
        };
        
        return networks[chainId] || 'Rede Desconhecida';
    }

    async updateWalletInfo(address) {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const networkName = this.getNetworkName(parseInt(chainId, 16));
            
            this.handleWalletComplete({
                address: address,
                network: networkName,
                chainId: chainId
            });
        } catch (error) {
            console.error('Erro ao atualizar informações da carteira:', error);
        }
    }

    updateNetworkInfo(chainId) {
        const networkName = this.getNetworkName(parseInt(chainId, 16));
        const walletInfo = document.getElementById('wallet-connection-info');
        if (walletInfo) {
            const networkElement = walletInfo.querySelector('.network-name');
            if (networkElement) {
                networkElement.textContent = networkName;
            }
        }
        
        // Atualizar dados do formulário se já preenchidos
        if (this.sectionData.wallet) {
            this.sectionData.wallet.network = networkName;
            this.sectionData.wallet.chainId = chainId;
        }
    }

    handleWalletComplete(walletData) {
        console.log('Carteira conectada com sucesso:', walletData);
        
        this.walletConnected = true;
        this.sectionData.wallet = walletData;
        
        // Marcar seção wallet como completa
        this.markSectionComplete('wallet', walletData);
        
        // Mostrar informações da carteira conectada
        this.displayWalletInfo(walletData);
        
        // Avançar para próxima seção
        setTimeout(() => {
            this.enableSection('basicinfo');
        }, 1000);
    }

    handleWalletDisconnect() {
        console.log('Carteira desconectada');
        
        this.walletConnected = false;
        delete this.sectionData.wallet;
        this.completedSections.delete('wallet');
        
        // Resetar para seção inicial
        this.resetToSection('wallet');
    }

    displayWalletInfo(walletData) {
        const walletInfo = document.getElementById('wallet-connection-info');
        if (!walletInfo) return;
        
        // Truncar endereço para exibição mas manter completo nos dados
        const displayAddress = walletData.address.length > 10 
            ? `${walletData.address.substring(0, 6)}...${walletData.address.substring(38)}`
            : walletData.address;
        
        walletInfo.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-wallet2 text-success me-2"></i>
                <div>
                    <div class="fw-bold address-display" title="${walletData.address}">${displayAddress}</div>
                    <div class="text-muted small network-name">${walletData.network}</div>
                </div>
                <i class="bi bi-check-circle-fill text-success ms-auto"></i>
            </div>
        `;
        
        walletInfo.style.display = 'block';
    }

    validateBasicInfo() {
        const tokenName = document.getElementById('tokenName')?.value.trim();
        const tokenSymbol = document.getElementById('tokenSymbol')?.value.trim();
        const totalSupply = document.getElementById('totalSupply')?.value.trim();
        
        const isValid = tokenName && tokenSymbol && totalSupply;
        
        if (isValid) {
            const basicData = {
                name: tokenName,
                symbol: tokenSymbol,
                decimals: parseInt(document.getElementById('decimals')?.value) || 18,
                totalSupply: this.parseSupplyValue(totalSupply)
            };
            
            this.markSectionComplete('basicinfo', basicData);
            
            // Auto-avançar para próxima seção
            setTimeout(() => {
                this.enableSection('ownerconfig');
            }, 1000);
        } else {
            this.markSectionIncomplete('basicinfo');
        }
        
        return isValid;
    }

    validateOwnerConfig() {
        const ownerAddress = document.getElementById('ownerAddress')?.value.trim();
        
        if (ownerAddress && this.isValidEthereumAddress(ownerAddress)) {
            const ownerData = {
                owner: ownerAddress,
                image: document.getElementById('tokenImage')?.value.trim() || ''
            };
            
            this.markSectionComplete('ownerconfig', ownerData);
            
            // Auto-avançar para seção de deploy
            setTimeout(() => {
                this.enableSection('deploy');
                this.updateDeployInfo();
            }, 1000);
            
            return true;
        } else {
            this.markSectionIncomplete('ownerconfig');
            return false;
        }
    }

    isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    parseSupplyValue(value) {
        // Remove espaços e converte vírgulas para pontos
        const cleanValue = value.replace(/\s+/g, '').replace(/,/g, '.');
        
        // Remove sufixos como 'M', 'B', 'K'
        const match = cleanValue.match(/^([\d.]+)([KMB]?)$/i);
        if (!match) return cleanValue;
        
        const [, number, suffix] = match;
        const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
        const multiplier = multipliers[suffix.toUpperCase()] || 1;
        
        return (parseFloat(number) * multiplier).toString();
    }

    updateDeployInfo() {
        const deployInfo = document.getElementById('deploy-network-info');
        if (!deployInfo || !this.sectionData.wallet) return;
        
        const { network, address } = this.sectionData.wallet;
        const displayAddress = address.length > 10 
            ? `${address.substring(0, 6)}...${address.substring(38)}`
            : address;
        
        deployInfo.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <strong>Rede:</strong> ${network}
                </div>
                <div class="col-md-6">
                    <strong>Carteira:</strong> ${displayAddress}
                </div>
            </div>
        `;
    }

    markSectionComplete(sectionName, data) {
        this.completedSections.add(sectionName);
        this.sectionData[sectionName] = { ...this.sectionData[sectionName], ...data };
        
        // Atualizar indicador visual
        const indicator = document.querySelector(`[data-section="${sectionName}"] .section-indicator`);
        if (indicator) {
            indicator.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
        }
        
        console.log(`Seção ${sectionName} marcada como completa:`, data);
    }

    markSectionIncomplete(sectionName) {
        this.completedSections.delete(sectionName);
        
        // Atualizar indicador visual
        const indicator = document.querySelector(`[data-section="${sectionName}"] .section-indicator`);
        if (indicator) {
            indicator.innerHTML = '<i class="bi bi-circle text-muted"></i>';
        }
    }

    enableSection(sectionName) {
        // Desabilitar todas as seções primeiro
        const allSections = document.querySelectorAll('.progressive-section');
        allSections.forEach(section => {
            section.classList.remove('active');
            section.classList.add('disabled');
        });
        
        // Habilitar seção atual
        const targetSection = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetSection) {
            targetSection.classList.remove('disabled');
            targetSection.classList.add('active');
            
            // Scroll suave para a seção
            targetSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }
        
        this.currentSection = sectionName;
        console.log(`Seção habilitada: ${sectionName}`);
    }

    async handleDeploy() {
        try {
            // Desabilitar botão durante deploy
            const deployBtn = document.getElementById('deploy-token-btn');
            if (deployBtn) {
                deployBtn.disabled = true;
                deployBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Criando Token...';
            }

            // Coletar dados do formulário
            const tokenData = this.collectFormData();
            console.log('Dados do token para deploy:', tokenData);
            
            // Verificar conexão da carteira
            if (!window.ethereum) {
                throw new Error('MetaMask não detectada');
            }

            // Verificar se está conectado
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) {
                throw new Error('Carteira não conectada');
            }

            // Deploy do contrato
            const deployResult = await this.deployTokenContract(tokenData);
            this.handleDeploySuccess(deployResult);

        } catch (error) {
            console.error('Erro no deploy:', error);
            this.handleDeployError(error);
        }
    }

    collectFormData() {
        const totalSupplyField = document.getElementById('totalSupply');
        const totalSupplyValue = totalSupplyField ? this.parseSupplyValue(totalSupplyField.value) : '';
        
        return {
            name: document.getElementById('tokenName')?.value || '',
            symbol: document.getElementById('tokenSymbol')?.value || '',
            decimals: parseInt(document.getElementById('decimals')?.value) || 18,
            totalSupply: totalSupplyValue,
            owner: document.getElementById('ownerAddress')?.value || '',
            image: document.getElementById('tokenImage')?.value || ''
        };
    }

    async deployTokenContract(tokenData) {
        try {
            console.log('🚀 Iniciando deploy do token:', tokenData.name);
            
            // Deploy simulado para demonstração
            const deployResult = {
                success: true,
                contractAddress: '0x' + Math.random().toString(16).substr(2, 40),
                transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
                network: { name: 'BSC Testnet', chainId: 97 },
                gasUsed: '850000',
                blockNumber: Math.floor(Math.random() * 1000000) + 63000000,
                message: `Token "${tokenData.name}" (${tokenData.symbol}) criado com sucesso!\n\nEspecificações:\n• Supply: ${tokenData.totalSupply}\n• Decimals: ${tokenData.decimals}\n• Owner: ${tokenData.owner}\n\n⚠️ Este é um deploy simulado para demonstração.\nPara deploy real na blockchain, entre em contato conosco.`
            };
            
            // Simular delay de deploy
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            return deployResult;

        } catch (error) {
            console.error('Erro detalhado no deploy:', error);
            
            return {
                success: false,
                error: 'Deploy temporariamente indisponível',
                message: `Não foi possível fazer o deploy do token "${tokenData.name}".\n\nO sistema está sendo otimizado para melhor compatibilidade com a BSC Testnet.\n\nTente novamente em alguns minutos ou entre em contato para assistência.`,
                contractAddress: null,
                transactionHash: null
            };
        }
    }

    handleDeploySuccess(deployResult) {
        this.markSectionComplete('deploy', deployResult);
        
        // Mostrar seção de resultado
        this.enableSection('result');
        
        // Preencher resultado
        const resultDiv = document.getElementById('deploy-result');
        if (resultDiv && deployResult) {
            const networkName = deployResult.network?.name || 'Desconhecida';
            const explorerUrl = this.getExplorerUrl(deployResult.network?.chainId, deployResult.contractAddress);
            const txUrl = this.getExplorerUrl(deployResult.network?.chainId, deployResult.transactionHash, 'tx');
            
            resultDiv.innerHTML = `
                <div class="text-center mb-4">
                    <i class="bi bi-check-circle text-success" style="font-size: 4rem;"></i>
                    <h3 class="text-success mt-3">Token Criado com Sucesso!</h3>
                </div>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Detalhes do Token</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Nome:</strong> ${this.sectionData.basicinfo?.name}</p>
                                <p><strong>Símbolo:</strong> ${this.sectionData.basicinfo?.symbol}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Supply Total:</strong> ${this.sectionData.basicinfo?.totalSupply}</p>
                                <p><strong>Decimais:</strong> ${this.sectionData.basicinfo?.decimals}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Informações da Blockchain</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Rede:</strong> ${networkName}</p>
                                <p><strong>Gas Usado:</strong> ${deployResult.gasUsed}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Bloco:</strong> #${deployResult.blockNumber}</p>
                                <p><strong>Endereço do Contrato:</strong></p>
                                <code class="text-break">${deployResult.contractAddress}</code>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Links Úteis</h5>
                        <div class="d-grid gap-2 d-md-flex">
                            ${explorerUrl ? `<a href="${explorerUrl}" target="_blank" class="btn btn-outline-primary">Ver Contrato no Explorer</a>` : ''}
                            ${txUrl ? `<a href="${txUrl}" target="_blank" class="btn btn-outline-secondary">Ver Transação</a>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Importante:</strong> ${deployResult.message || 'Token criado com sucesso! Guarde o endereço do contrato para referência futura.'}
                </div>
            `;
        }
        
        // Reabilitar botão de deploy para próximos usos
        this.resetDeployButton();
    }

    handleDeployError(error) {
        console.error('Erro no deploy:', error);
        
        const resultDiv = document.getElementById('deploy-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="text-center mb-4">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 4rem;"></i>
                    <h3 class="text-warning mt-3">Erro no Deploy</h3>
                </div>
                
                <div class="alert alert-warning">
                    <h5>Não foi possível criar o token</h5>
                    <p>${error.message || 'Erro desconhecido durante o deploy.'}</p>
                    <p class="mb-0">Por favor, verifique sua conexão e tente novamente.</p>
                </div>
                
                <div class="d-grid">
                    <button class="btn btn-primary" onclick="progressiveFlow.resetToSection('deploy')">
                        <i class="bi bi-arrow-repeat me-2"></i>Tentar Novamente
                    </button>
                </div>
            `;
        }
        
        this.resetDeployButton();
    }

    resetDeployButton() {
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.disabled = false;
            deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Criar Token';
        }
    }

    getExplorerUrl(chainId, hash, type = 'address') {
        const explorers = {
            1: 'https://etherscan.io',
            56: 'https://bscscan.com',
            97: 'https://testnet.bscscan.com',
            137: 'https://polygonscan.com',
            80001: 'https://mumbai.polygonscan.com'
        };
        
        const baseUrl = explorers[chainId];
        if (!baseUrl || !hash) return null;
        
        return `${baseUrl}/${type}/${hash}`;
    }

    resetToSection(sectionName) {
        // Limpar seções posteriores
        const sections = ['wallet', 'basicinfo', 'ownerconfig', 'deploy', 'result'];
        const targetIndex = sections.indexOf(sectionName);
        
        if (targetIndex !== -1) {
            for (let i = targetIndex; i < sections.length; i++) {
                this.completedSections.delete(sections[i]);
                this.markSectionIncomplete(sections[i]);
            }
        }
        
        this.enableSection(sectionName);
    }

    resetFlow() {
        console.log('Resetando fluxo...');
        
        // Limpar todos os dados
        this.completedSections.clear();
        this.sectionData = {};
        this.walletConnected = false;
        
        // Limpar formulários
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        // Limpar displays
        const walletInfo = document.getElementById('wallet-connection-info');
        if (walletInfo) walletInfo.style.display = 'none';
        
        const deployInfo = document.getElementById('deploy-network-info');
        if (deployInfo) deployInfo.innerHTML = '';
        
        const resultDiv = document.getElementById('deploy-result');
        if (resultDiv) resultDiv.innerHTML = '';
        
        // Resetar indicadores visuais
        const indicators = document.querySelectorAll('.section-indicator');
        indicators.forEach(indicator => {
            indicator.innerHTML = '<i class="bi bi-circle text-muted"></i>';
        });
        
        // Voltar para primeira seção
        this.enableSection('wallet');
        
        // Recheck wallet connection
        this.checkIfAlreadyConnected();
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.progressiveFlow = new ProgressiveFlow();
});
