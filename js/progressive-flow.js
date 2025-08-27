class ProgressiveFlow {
    constructor() {
        this.currentSection = 'wallet';
        this.completedSections = new Set();
        this.sectionData = {};
        this.walletConnected = false;
        this.checkingConnection = false; // Flag para evitar verificações múltiplas
        this.supportedNetworks = []; // Cache das redes suportadas
        this.api = null; // Instância da API
        
        this.initializeFlow();
    }

    initializeFlow() {
        console.log('Inicializando Progressive Flow...');
        
        // Inicializar API
        this.initializeAPI();
        
        // Aguardar add-index.js estar carregado
        this.waitForAddIndexReady().then(() => {
            // Inicializar seletores de rede
            this.initializeNetworkSelectors();
            
            // Configurar eventos dos formulários
            this.setupFormEvents();
            
            // Verificar se já existe conexão de carteira
            this.checkIfAlreadyConnected();
            
            // Configurar observador de mudanças na carteira
            this.setupWalletEventListeners();
        });
    }
    
    
    initializeAPI() {
        // Inicializar cliente da API
        if (typeof TokenDeployAPI !== 'undefined') {
            this.api = new TokenDeployAPI();
            console.log('API Client inicializada');
        } else {
            console.warn('TokenDeployAPI não encontrada. Deploy via API não estará disponível.');
        }
    }
    
    async initializeNetworkSelectors() {
        try {
            if (this.api) {
                console.log('Carregando redes suportadas da API...');
                const networks = await this.api.getSupportedNetworksForUI();
                this.supportedNetworks = networks;
                this.populateNetworkSelector();
            } else {
                // Fallback para redes fixas
                console.log('Usando redes fixas (fallback)');
                this.supportedNetworks = [
                    { name: 'BSC Mainnet', chainId: 56, symbol: 'BNB', displayName: 'BSC Mainnet (BNB)' },
                    { name: 'BSC Testnet', chainId: 97, symbol: 'tBNB', displayName: 'BSC Testnet (tBNB)' },
                    { name: 'Ethereum', chainId: 1, symbol: 'ETH', displayName: 'Ethereum (ETH)' },
                    { name: 'Polygon', chainId: 137, symbol: 'MATIC', displayName: 'Polygon (MATIC)' }
                ];
                this.populateNetworkSelector();
            }
        } catch (error) {
            console.error('Erro ao carregar redes:', error);
            // Usar fallback em caso de erro
            this.supportedNetworks = [
                { name: 'BSC Mainnet', chainId: 56, symbol: 'BNB', displayName: 'BSC Mainnet (BNB)' },
                { name: 'BSC Testnet', chainId: 97, symbol: 'tBNB', displayName: 'BSC Testnet (tBNB)' }
            ];
            this.populateNetworkSelector();
        }
    }
    
    populateNetworkSelector() {
        const networkSelect = document.getElementById('deploy-network');
        if (!networkSelect) return;
        
        // Limpar opções existentes
        networkSelect.innerHTML = '<option value="">Selecione a rede...</option>';
        
        // Adicionar redes suportadas
        this.supportedNetworks.forEach(network => {
            const option = document.createElement('option');
            option.value = network.chainId;
            option.textContent = network.displayName;
            option.dataset.symbol = network.symbol;
            networkSelect.appendChild(option);
        });
        
        // Listener para atualizar estimativa de custo
        networkSelect.addEventListener('change', () => {
            this.updateDeployCostEstimate();
            
            // Habilitar/desabilitar botão de deploy
            const deployBtn = document.getElementById('deploy-token-btn');
            if (deployBtn) {
                if (networkSelect.value) {
                    deployBtn.disabled = false;
                    const selectedNetwork = this.supportedNetworks.find(n => n.chainId == networkSelect.value);
                    if (selectedNetwork) {
                        deployBtn.innerHTML = `<i class="bi bi-rocket-takeoff me-2"></i>CRIAR TOKEN EM ${selectedNetwork.name.toUpperCase()}`;
                    }
                } else {
                    deployBtn.disabled = true;
                    deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>CRIAR TOKEN';
                }
            }
        });
        
        console.log(`✅ ${this.supportedNetworks.length} redes carregadas no seletor`);
    }
    
    async updateDeployCostEstimate() {
        const networkSelect = document.getElementById('deploy-network');
        const costElement = document.getElementById('deploy-cost-estimate');
        
        if (!networkSelect || !networkSelect.value) {
            if (costElement) costElement.textContent = 'Selecione uma rede para ver a estimativa';
            return;
        }
        
        const chainId = parseInt(networkSelect.value);
        
        try {
            if (this.api) {
                const estimate = await this.api.estimateDeployCost(chainId);
                if (costElement) {
                    costElement.innerHTML = `
                        <strong>Custo estimado:</strong> ${estimate.costDisplay}<br>
                        <small>Gas: ${estimate.gasPrice} (limite: ${estimate.gasLimit})</small>
                    `;
                }
            } else {
                // Fallback para estimativas fixas
                const estimates = {
                    1: '~0.02 ETH ($30-60)',
                    56: '~0.003 BNB ($1-2)',
                    97: '~0.003 tBNB (Testnet)',
                    137: '~0.01 MATIC ($0.01)',
                    43114: '~0.01 AVAX ($0.30)'
                };
                
                const estimate = estimates[chainId] || '~0.01 ETH';
                if (costElement) {
                    costElement.innerHTML = `<strong>Custo estimado:</strong> ${estimate}`;
                }
            }
        } catch (error) {
            console.error('Erro ao estimar custo:', error);
            if (costElement) {
                costElement.textContent = 'Erro ao calcular estimativa';
            }
        }
    }
    
    async waitForAddIndexReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                // Verificar se as funções do add-index.js estão disponíveis
                if (typeof window.connectWallet === 'function') {
                    console.log('add-index.js detectado e pronto');
                    resolve();
                } else {
                    console.log('Aguardando add-index.js...');
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }

    setupFormEvents() {
        // Botões de navegação
        const walletNextBtn = document.getElementById('wallet-next-btn');
        const basicPrevBtn = document.getElementById('basic-info-prev-btn');
        const basicNextBtn = document.getElementById('basic-info-next-btn');
        const deployPrevBtn = document.getElementById('deploy-prev-btn');

        if (walletNextBtn) {
            walletNextBtn.addEventListener('click', () => {
                this.enableSection('basicinfo');
            });
        }
        
        // Listener para o evento customizado disparado pelo add-index.js
        document.addEventListener('walletConnected', (event) => {
            console.log('Progressive Flow recebeu evento walletConnected:', event.detail);
            
            // Prevenir processamento duplo
            if (!this.walletConnected) {
                this.handleWalletComplete(event.detail);
            } else {
                console.log('Progressive Flow: Wallet já processada, ignorando evento duplicado');
            }
        });
        
        // Listener adicional para o botão conectar (para casos onde add-index.js não funciona)
        const connectBtn = document.getElementById('connect-metamask-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', async () => {
                // Se add-index.js não estiver funcionando, fazer conexão direta
                await this.connectWalletDirectly();
            });
        }
        
        if (basicPrevBtn) {
            basicPrevBtn.addEventListener('click', () => {
                this.enableSection('wallet');
            });
        }
        
        if (basicNextBtn) {
            basicNextBtn.addEventListener('click', () => {
                this.enableSection('deploy');
                this.updateDeployInfo();
            });
        }
        
        if (deployPrevBtn) {
            deployPrevBtn.addEventListener('click', () => {
                this.enableSection('basicinfo');
            });
        }
        
        // Botão limpar e recomeçar
        const clearAllBtn = document.getElementById('clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.resetFlow());
        }
        
        // Eventos do formulário de informações básicas + owner
        const tokenName = document.getElementById('tokenName');
        const tokenSymbol = document.getElementById('tokenSymbol');  
        const totalSupply = document.getElementById('totalSupply');
        const decimals = document.getElementById('decimals');
        const ownerAddress = document.getElementById('ownerAddress');
        const tokenImage = document.getElementById('tokenImage');
        
        if (tokenName) tokenName.addEventListener('input', () => this.validateBasicInfo());
        if (tokenSymbol) tokenSymbol.addEventListener('input', () => this.validateBasicInfo());
        if (totalSupply) {
            totalSupply.addEventListener('input', (e) => {
                this.formatSupplyInput(e);
                this.validateBasicInfo();
            });
        }
        if (decimals) decimals.addEventListener('input', () => this.validateBasicInfo());
        if (ownerAddress) ownerAddress.addEventListener('input', () => this.validateBasicInfo());
        if (tokenImage) tokenImage.addEventListener('input', () => this.validateBasicInfo());
        
        // Botão de deploy
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => this.handleDeploy());
        }
    }

    formatSupplyInput(event) {
        let value = event.target.value.replace(/[^\d]/g, '');
        
        if (value) {
            // Formatação com separadores de milhares
            const formattedValue = new Intl.NumberFormat('pt-BR').format(value);
            event.target.value = formattedValue;
        }
    }

    setupWalletEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.handleWalletDisconnect();
                } else {
                    this.checkIfAlreadyConnected();
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.updateNetworkInfo(chainId);
            });
        }
    }

    async checkIfAlreadyConnected() {
        if (this.checkingConnection) {
            console.log('Progressive Flow: Verificação já em andamento, ignorando...');
            return;
        }
        
        this.checkingConnection = true;
        
        try {
            if (window.ethereum && !this.walletConnected) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                if (accounts.length > 0) {
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    const networkName = this.getNetworkName(chainId);
                    
                    const walletData = {
                        address: accounts[0],
                        network: networkName,
                        chainId: chainId
                    };
                    
                    console.log('Progressive Flow: Carteira já conectada detectada:', walletData.address);
                    this.handleWalletComplete(walletData);
                } else {
                    console.log('Progressive Flow: Nenhuma carteira conectada detectada');
                }
            } else if (this.walletConnected) {
                console.log('Progressive Flow: Wallet já está conectada no estado interno');
            }
        } catch (error) {
            console.log('Erro ao verificar conexão:', error);
        } finally {
            this.checkingConnection = false;
        }
    }

    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum',
            '0x38': 'BSC Mainnet', 
            '0x61': 'BSC Testnet',
            '0x89': 'Polygon',
            '0x13881': 'Mumbai Testnet'
        };
        
        return networks[chainId] || `Rede (${parseInt(chainId, 16)})`;
    }

    updateNetworkInfo(chainId) {
        const networkName = this.getNetworkName(chainId);
        
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
        
        // Sincronizar com as variáveis globais do add-index.js
        if (typeof window.walletConnected !== 'undefined') {
            window.walletConnected = true;
        }
        if (typeof window.walletAddress !== 'undefined') {
            window.walletAddress = walletData.address;
        }
        if (typeof window.networkData !== 'undefined') {
            window.networkData = {
                name: walletData.network,
                chainId: walletData.chainId
            };
        }
        
        // Marcar seção wallet como completa
        this.markSectionComplete('wallet', walletData);
        
        // Mostrar informações da carteira conectada
        this.displayWalletInfo(walletData);
        
        // Auto-preencher endereço do proprietário
        const ownerAddress = document.getElementById('ownerAddress');
        if (ownerAddress && !ownerAddress.value) {
            ownerAddress.value = walletData.address;
        }
        
        // Auto-preencher rede de deploy
        const networkDisplay = document.getElementById('network-display');
        if (networkDisplay) {
            networkDisplay.value = walletData.network;
        }
        
        // Avançar automaticamente para básica
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
        // Atualizar campo de status da carteira
        const walletStatus = document.getElementById('wallet-status');
        if (walletStatus) {
            walletStatus.value = `${walletData.address.substring(0, 6)}...${walletData.address.substring(38)} (${walletData.network})`;
        }
        
        // Mostrar informações detalhadas da carteira
        const walletConnectionInfo = document.getElementById('wallet-connection-info');
        if (walletConnectionInfo) {
            walletConnectionInfo.style.display = 'block';
            
            // Preencher endereço
            const connectedAddress = document.getElementById('connected-address');
            if (connectedAddress) {
                connectedAddress.textContent = walletData.address;
            }
            
            // Buscar e exibir saldo
            this.updateWalletBalance(walletData.address);
        }
        
        // Mostrar seção de informações da rede (versão simples - ocultar para evitar duplicação)
        const networkInfoSection = document.getElementById('network-info-section');
        if (networkInfoSection) {
            networkInfoSection.style.display = 'none';
        }
        
        // Atualizar informações da rede (na versão detalhada)
        const currentNetwork = document.getElementById('current-network');
        if (currentNetwork) {
            currentNetwork.textContent = walletData.network;
        }
        
        const chainIdValue = document.getElementById('chain-id-value');
        if (chainIdValue) {
            chainIdValue.textContent = parseInt(walletData.chainId, 16);
        }
        
        // Atualizar botão conectar
        const connectBtn = document.getElementById('connect-metamask-btn');
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>CONECTADO';
            connectBtn.classList.remove('btn-warning');
            connectBtn.classList.add('btn-success');
            connectBtn.disabled = false;
        }
        
        // Mostrar botão "Próximo" da seção wallet
        const walletNextBtn = document.getElementById('wallet-next-btn');
        if (walletNextBtn) {
            walletNextBtn.style.display = 'block';
        }
    }

    async updateWalletBalance(address) {
        try {
            if (window.ethereum) {
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [address, 'latest']
                });
                
                // Converter de wei para BNB
                const balanceInBNB = parseInt(balance, 16) / Math.pow(10, 18);
                const balanceDisplay = document.getElementById('wallet-balance');
                
                if (balanceDisplay) {
                    balanceDisplay.innerHTML = `<strong>${balanceInBNB.toFixed(4)} BNB</strong>`;
                    
                    // Avisar se saldo muito baixo para deploy
                    if (balanceInBNB < 0.01) {
                        balanceDisplay.innerHTML += ' <i class="bi bi-exclamation-triangle text-warning ms-1" title="Saldo baixo para deploy"></i>';
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao buscar saldo:', error);
            const balanceDisplay = document.getElementById('wallet-balance');
            if (balanceDisplay) {
                balanceDisplay.textContent = 'Erro ao carregar';
            }
        }
    }

    async connectWalletDirectly() {
        try {
            if (typeof window.ethereum === 'undefined') {
                alert('MetaMask não detectado! Por favor, instale a MetaMask.');
                return;
            }
            
            console.log('Progressive Flow conectando diretamente com MetaMask...');
            
            // Solicita conexão
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                const chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                });
                
                const networkName = this.getNetworkName(chainId);
                
                const walletData = {
                    address: accounts[0],
                    network: networkName,
                    chainId: chainId
                };
                
                this.handleWalletComplete(walletData);
            }
            
        } catch (error) {
            console.error('Erro ao conectar wallet diretamente:', error);
            alert('Erro ao conectar com a MetaMask: ' + error.message);
        }
    }

    validateBasicInfo() {
        const tokenName = document.getElementById('tokenName')?.value.trim();
        const tokenSymbol = document.getElementById('tokenSymbol')?.value.trim();
        const totalSupply = document.getElementById('totalSupply')?.value.trim();
        const ownerAddress = document.getElementById('ownerAddress')?.value.trim();
        
        const isValid = tokenName && tokenSymbol && totalSupply && ownerAddress && this.isValidEthereumAddress(ownerAddress);
        
        // Mostrar/ocultar botão próximo
        const nextBtn = document.getElementById('basic-info-next-btn');
        if (nextBtn) {
            nextBtn.style.display = isValid ? 'inline-block' : 'none';
        }
        
        if (isValid) {
            const basicData = {
                name: tokenName,
                symbol: tokenSymbol,
                decimals: parseInt(document.getElementById('decimals')?.value) || 18,
                totalSupply: this.parseSupplyValue(totalSupply),
                owner: ownerAddress,
                image: document.getElementById('tokenImage')?.value.trim() || ''
            };
            
            this.markSectionComplete('basicinfo', basicData);
        } else {
            this.markSectionIncomplete('basicinfo');
        }
        
        return isValid;
    }

    isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    parseSupplyValue(value) {
        // Remove formatação de milhares e espaços
        const cleanValue = value.replace(/[^\d,]/g, '').replace(/,/g, '.');
        
        // Remove sufixos como 'M', 'B', 'K' se existirem
        const match = cleanValue.match(/^([\d.]+)([KMB]?)$/i);
        if (!match) return cleanValue.replace(/\./g, '');
        
        const [, number, suffix] = match;
        const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
        const multiplier = multipliers[suffix.toUpperCase()] || 1;
        
        return (parseFloat(number) * multiplier).toString();
    }

    updateDeployInfo() {
        const tokenSummary = document.getElementById('token-summary');
        if (!tokenSummary || !this.sectionData.wallet || !this.sectionData.basicinfo) return;
        
        const { network, address } = this.sectionData.wallet;
        const { name, symbol, decimals, totalSupply, owner, image } = this.sectionData.basicinfo;
        
        tokenSummary.innerHTML = `
            <div class="col-md-6">
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Símbolo:</strong> ${symbol}</p>
                <p><strong>Decimais:</strong> ${decimals}</p>
                <p><strong>Supply Total:</strong> ${new Intl.NumberFormat('pt-BR').format(totalSupply)}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Proprietário:</strong> ${owner.substring(0, 6)}...${owner.substring(38)}</p>
                <p><strong>Rede:</strong> ${network}</p>
                <p><strong>Carteira:</strong> ${address.substring(0, 6)}...${address.substring(38)}</p>
                ${image ? `<p><strong>Logo:</strong> <a href="${image}" target="_blank">Ver imagem</a></p>` : ''}
            </div>
        `;
        
        // Habilitar botão de deploy
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.disabled = false;
        }
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
        // Mapeamento dos nomes para IDs das seções
        const sectionIds = {
            'wallet': 'section-wallet',
            'basicinfo': 'section-basic-info', 
            'deploy': 'section-deploy',
            'result': 'section-result'
        };
        
        // Desabilitar todas as seções primeiro
        const allSections = document.querySelectorAll('.creation-section');
        allSections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });
        
        // Habilitar seção atual
        const sectionId = sectionIds[sectionName];
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            
            // Scroll suave para a seção
            targetSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }
        
        this.currentSection = sectionName;
        console.log(`Seção habilitada: ${sectionName} (${sectionId})`);
    }

    async handleDeploy() {
        try {
            console.log('🚀 Iniciando deploy via API...');
            
            // Desabilitar botão durante deploy
            const deployBtn = document.getElementById('deploy-token-btn');
            if (deployBtn) {
                deployBtn.disabled = true;
                deployBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Preparando Deploy...';
            }

            // Coletar dados do formulário
            const tokenData = this.collectFormData();
            console.log('📋 Dados do token para deploy:', tokenData);
            
            // Verificar conexão da carteira
            if (!window.ethereum) {
                throw new Error('MetaMask não detectada');
            }

            // Obter signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // Inicializar deploy manager
            if (!window.deployManager) {
                window.deployManager = new TokenDeployManager();
            }

            // Atualizar progresso
            this.updateDeployProgress('Conectando com API...', 20);

            // Executar deploy via API
            const deployResult = await window.deployManager.initializeDeploy(tokenData, signer);

            // Atualizar progresso
            this.updateDeployProgress('Token criado com sucesso!', 100);

            // Processar resultado
            this.handleDeploySuccess(deployResult);

        } catch (error) {
            console.error('❌ Erro no deploy:', error);
            this.handleDeployError(error);
        }
    }

    updateDeployProgress(message, percentage) {
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.innerHTML = `<i class="bi bi-hourglass-split me-2"></i>${message}`;
        }
        
        // Atualizar barra de progresso se existir
        const progressBar = document.getElementById('deploy-progress');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
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
            console.log('🚀 Iniciando deploy REAL do token:', tokenData.name);
            
            // Verificar se o ethers está disponível
            if (typeof window.ethers === 'undefined') {
                throw new Error('Ethers.js não carregado');
            }
            
            // Conectar com o provider
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // Contrato ERC-20 simples e funcional
            const contractABI = [
                "constructor(string memory name_, string memory symbol_, uint256 totalSupply_, uint8 decimals_)",
                "function name() view returns (string memory)",
                "function symbol() view returns (string memory)", 
                "function decimals() view returns (uint8)",
                "function totalSupply() view returns (uint256)",
                "function balanceOf(address account) view returns (uint256)",
                "function transfer(address to, uint256 amount) returns (bool)",
                "event Transfer(address indexed from, address indexed to, uint256 value)"
            ];
            
            // Bytecode simplificado do contrato ERC-20 
            const contractBytecode = "0x608060405234801561001057600080fd5b50604051610a19380380610a198339818101604052810190610032919061024a565b83600090805190602001906100489291906100fd565b5082600190805190602001906100609291906100fd565b5081600260006101000a81548160ff021916908360ff16021790555080600381905550600354600a61009291906103d0565b8161009d9190610421565b600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505050505061058b565b828054610109906104ea565b90600052602060002090601f01602090048101928261012b5760008555610172565b82601f1061014457805160ff1916838001178555610172565b82800160010185558215610172579182015b82811115610171578251825591602001919060010190610156565b5b50905061017f9190610183565b5090565b5b8082111561019c576000816000905550600101610184565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610207826101be565b810181811067ffffffffffffffff82111715610226576102256101cf565b5b80604052505050565b60006102396101a0565b905061024582826101fe565b919050565b60008060008060808587031215610264576102636101aa565b5b600085015167ffffffffffffffff811115610282576102816101af565b5b61028e878288016102de565b945050602085015167ffffffffffffffff8111156102af576102ae6101af565b5b6102bb878288016102de565b93505060406102cc87828801610320565b92505060606102dd87828801610320565b91505092959194509250565b600067ffffffffffffffff8211156102f9576102f86101cf565b5b610302826101be565b9050602081019050919050565b600081519050919050565b6000819050919050565b61032d81610317565b811461033857600080fd5b50565b60008151905061034a81610324565b92915050565b600060ff82169050919050565b61036681610350565b811461037157600080fd5b50565b6000815190506103838161035d565b92915050565b600082825260208201905092915050565b60005b838110156103b857808201518184015260208101905061039d565b838111156103c7576000848401525b50505050565b60006103d8826101b4565b6103e28185610389565b93506103f281856020860161039a565b6103fb816101be565b840191505092915050565b600061041182610317565b915061041c83610317565b9250817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff048311821515161561045557610454610482565b5b828202905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806104c857607f821691505b602082108114156104dc576104db610499565b5b50919050565b61047f8061050c6000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c806370a082311161005b57806370a08231146101065780638da5cb5b1461013657806395d89b4114610154578063a9059cbb1461017257610088565b806306fdde031461008d57806318160ddd146100ab57806323b872dd146100c9578063313ce567146100f9575b600080fd5b6100956101a2565b6040516100a29190610324565b60405180910390f35b6100b3610230565b6040516100c09190610346565b60405180910390f35b6100e360048036038101906100de9190610397565b61023a565b6040516100f091906103ea565b60405180910390f35b61010161024a565b60405161010d9190610421565b60405180910390f35b610120600480360381019061011b919061043c565b610261565b60405161012d9190610346565b60405180910390f35b61013e6102aa565b60405161014b9190610478565b60405180910390f35b61015c6102d0565b6040516101699190610324565b60405180910390f35b61018c60048036038101906101879190610493565b61035e565b60405161019991906103ea565b60405180910390f35b600080546101af906104d3565b80601f01602080910402602001604051908101604052809291908181526020018280546101db906104d3565b80156102285780601f106101fd57610100808354040283529160200191610228565b820191906000526020600020905b81548152906001019060200180831161020b57829003601f168201915b505050505081565b6000600354905090565b600061024683836103b7565b9050919050565b6000600260009054906101000a900460ff16905090565b6000600460008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600180546102dd906104d3565b80601f0160208091040260200160405190810160405280929190818152602001828054610309906104d3565b80156103565780601f1061032b57610100808354040283529160200191610356565b820191906000526020600020905b81548152906001019060200180831161033957829003601f168201915b505050505081565b60006103b283836000803073ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461035e919061050a565b9050919050565b600080600460008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050828110156103d7578091505061041b565b82816103e3919061053e565b600460008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555082600460008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600191505b92915050565b600081519050919050565b600082825260208201905092915050565b60005b838110156104535780820151818401526020810190506103fd565b83811115610462576000848401525b50505050565b6000601f19601f8301169050919050565b600061048b82610421565b610495818561042c565b93506104a581856020860161043d565b6104ae81610468565b840191505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b60006104ee826104b9565b9050919050565b610506816104d9565b8114610511575f80fd5b50565b600081359050610523816104fd565b92915050565b600060ff82169050919050565b61053f81610529565b8114610549575f80fd5b50565b60008135905061055b81610536565b92915050565b6000806000806080858703121561057b5761057a610572565b5b60006105898782880161050a565b945050602061059a8782880161050a565b93505060406105ab8782880161054c565b92505060606105bc8782880161054c565b91505092959194509250565b6000602082019050818103600083015261058282846104ca565b905092915050565b61059381610506565b82525050565b60006020820190506105ae600083018461058a565b92915050565b60008115159050919050565b6105c9816105b4565b82525050565b60006020820190506105e460008301846105c0565b92915050565b6105f381610529565b82525050565b600060208201905061060e60008301846105ea565b92915050565b60008060408385031215610627576106266105f8565b5b600061063585828601610514565b925050602061064685828601610514565b9150509250929050565b600080600060608486031215610669576106686105f8565b5b600061067786828701610514565b935050602061068886828701610514565b925050604061069986828701610514565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806106e957607f821691505b602082108114156106fd576106fc6106a3565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061073e82610506565b915061074983610506565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0382111561077e5761077d610703565b5b828201905092915050565b600061079482610506565b915061079f83610506565b9250828210156107b2576107b1610703565b5b82820390509291505056fea26469706673582212207f8a9b4c3d2e1f0a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f364736f6c63430008110033";
            
            // Preparar dados do constructor
            const totalSupplyWei = ethers.utils.parseUnits(tokenData.totalSupply.toString(), tokenData.decimals);
            
            console.log('Dados para deploy:', {
                name: tokenData.name,
                symbol: tokenData.symbol,
                totalSupply: totalSupplyWei.toString(),
                decimals: tokenData.decimals
            });

            // Criar factory do contrato
            const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, signer);
            
            // Fazer deploy com gas otimizado para BSC Testnet
            const contract = await contractFactory.deploy(
                tokenData.name,
                tokenData.symbol, 
                totalSupplyWei,
                tokenData.decimals,
                {
                    gasLimit: 800000,
                    gasPrice: ethers.utils.parseUnits('5', 'gwei')
                }
            );

            console.log('Contrato deployado, aguardando confirmação...');
            
            // Aguardar confirmação
            const deployReceipt = await contract.deployTransaction.wait(1);
            
            console.log('Deploy confirmado:', deployReceipt);
            
            return {
                success: true,
                contractAddress: contract.address,
                transactionHash: deployReceipt.transactionHash,
                network: await provider.getNetwork(),
                gasUsed: deployReceipt.gasUsed.toString(),
                blockNumber: deployReceipt.blockNumber,
                message: `Token "${tokenData.name}" (${tokenData.symbol}) criado com sucesso na blockchain!`
            };

        } catch (error) {
            console.error('Erro detalhado no deploy:', error);
            
            return {
                success: false,
                error: error.reason || error.message || 'Erro desconhecido',
                message: `Erro ao fazer deploy do token "${tokenData.name}":\n\n${error.reason || error.message}\n\nVerifique se você tem BNB suficiente para pagar o gas e tente novamente.`,
                contractAddress: null,
                transactionHash: null
            };
        }
    }

    handleDeploySuccess(deployResult) {
        this.markSectionComplete('deploy', deployResult);
        
        // Mostrar seção de resultado
        this.enableSection('result');
        
        // Preencher detalhes do token
        const tokenDetailsResult = document.getElementById('token-details-result');
        if (tokenDetailsResult && this.sectionData.basicinfo) {
            const { name, symbol, decimals, totalSupply, owner, image } = this.sectionData.basicinfo;
            
            tokenDetailsResult.innerHTML = `
                <div class="mb-3">
                    <i class="bi bi-tag text-success me-2"></i>
                    <strong>Nome:</strong> <span class="text-white">${name}</span>
                </div>
                <div class="mb-3">
                    <i class="bi bi-code-square text-success me-2"></i>
                    <strong>Símbolo:</strong> <span class="text-warning">${symbol}</span>
                </div>
                <div class="mb-3">
                    <i class="bi bi-layers text-success me-2"></i>
                    <strong>Supply Total:</strong> <span class="text-info">${new Intl.NumberFormat('pt-BR').format(totalSupply)}</span>
                </div>
                <div class="mb-3">
                    <i class="bi bi-decimal text-success me-2"></i>
                    <strong>Decimais:</strong> <span class="text-info">${decimals}</span>
                </div>
                <div class="mb-0">
                    <i class="bi bi-person-fill text-success me-2"></i>
                    <strong>Proprietário:</strong><br>
                    <code class="text-warning small">${owner}</code>
                </div>
            `;
        }
        
        // Preencher detalhes da blockchain
        const blockchainDetailsResult = document.getElementById('blockchain-details-result');
        if (blockchainDetailsResult && deployResult) {
            const networkName = deployResult.network?.name || 'Binance Smart Chain Testnet';
            const chainId = deployResult.network?.chainId || '97';
            
            blockchainDetailsResult.innerHTML = `
                <div class="mb-3">
                    <i class="bi bi-globe text-info me-2"></i>
                    <strong>Rede:</strong> <span class="text-white">${networkName}</span>
                </div>
                <div class="mb-3">
                    <i class="bi bi-link-45deg text-info me-2"></i>
                    <strong>Chain ID:</strong> <span class="text-warning">${chainId}</span>
                </div>
                <div class="mb-3">
                    <i class="bi bi-receipt text-info me-2"></i>
                    <strong>TX Hash:</strong><br>
                    <code class="text-warning small">${deployResult.transactionHash}</code>
                </div>
                <div class="mb-0">
                    <i class="bi bi-check-circle text-info me-2"></i>
                    <strong>Status:</strong> <span class="text-success">Confirmado ✅</span>
                </div>
            `;
        }
        
        // Preencher endereço do contrato
        const contractAddressDisplay = document.getElementById('contract-address-display');
        if (contractAddressDisplay && deployResult) {
            contractAddressDisplay.value = deployResult.contractAddress;
        }
        
        // Configurar botão de cópia
        const copyContractBtn = document.getElementById('copy-contract-btn');
        if (copyContractBtn && deployResult) {
            copyContractBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(deployResult.contractAddress).then(() => {
                    copyContractBtn.innerHTML = '<i class="bi bi-check"></i>';
                    setTimeout(() => {
                        copyContractBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
                    }, 2000);
                });
            });
        }
        
        // Preencher estatísticas
        if (deployResult) {
            const gasUsedDisplay = document.getElementById('gas-used-display');
            if (gasUsedDisplay) {
                gasUsedDisplay.textContent = Number(deployResult.gasUsed).toLocaleString();
            }
            
            const blockNumberDisplay = document.getElementById('block-number-display');
            if (blockNumberDisplay) {
                blockNumberDisplay.textContent = `#${deployResult.blockNumber}`;
            }
        }
        
        // Preencher links do explorer
        const explorerLinks = document.getElementById('explorer-links');
        if (explorerLinks && deployResult) {
            const networkName = deployResult.network?.name || 'BSC Testnet';
            const explorerUrl = this.getExplorerUrl(deployResult.network?.chainId, deployResult.contractAddress);
            const txUrl = this.getExplorerUrl(deployResult.network?.chainId, deployResult.transactionHash, 'tx');
            
            explorerLinks.innerHTML = `
                ${explorerUrl ? `<a href="${explorerUrl}" target="_blank" class="btn btn-outline-warning btn-sm mb-2 d-block">
                    <i class="bi bi-box-arrow-up-right me-1"></i>Ver Contrato
                </a>` : ''}
                ${txUrl ? `<a href="${txUrl}" target="_blank" class="btn btn-outline-info btn-sm d-block">
                    <i class="bi bi-receipt me-1"></i>Ver Transação
                </a>` : ''}
            `;
        }
        
        // Configurar botão adicionar à carteira
        const addToWalletBtn = document.getElementById('add-to-wallet-btn');
        if (addToWalletBtn && deployResult && this.sectionData.basicinfo) {
            addToWalletBtn.addEventListener('click', () => {
                this.addTokenToWallet(deployResult.contractAddress);
            });
        }
        
        // Configurar botão compartilhar
        const shareTokenBtn = document.getElementById('share-token-btn');
        if (shareTokenBtn && deployResult && this.sectionData.basicinfo) {
            shareTokenBtn.addEventListener('click', () => {
                this.shareToken(deployResult.contractAddress);
            });
        }
        
        // Reabilitar botão de deploy para próximos usos
        this.resetDeployButton();
    }

    handleDeployError(error) {
        console.error('Erro no deploy:', error);
        
        // Mostrar seção de resultado com erro
        this.enableSection('result');
        
        // Preencher com erro
        const tokenDetailsResult = document.getElementById('token-details-result');
        if (tokenDetailsResult) {
            tokenDetailsResult.innerHTML = `
                <div class="text-center mb-4">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    <h4 class="text-warning mt-3">Erro no Deploy</h4>
                </div>
                
                <div class="alert alert-warning">
                    <h5>Não foi possível criar o token</h5>
                    <p>${error.message || error.error || 'Erro desconhecido durante o deploy.'}</p>
                    <p class="mb-0">Por favor, verifique sua conexão e tente novamente.</p>
                </div>
                
                <div class="d-grid">
                    <button class="btn btn-primary" onclick="progressiveFlow.enableSection('deploy')">
                        <i class="bi bi-arrow-repeat me-2"></i>Tentar Novamente
                    </button>
                </div>
            `;
        }
        
        this.resetDeployButton();
    }

    async addTokenToWallet(contractAddress) {
        try {
            if (!window.ethereum) throw new Error('MetaMask não encontrada');
            
            const tokenData = this.sectionData.basicinfo;
            
            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: contractAddress,
                        symbol: tokenData.symbol,
                        decimals: tokenData.decimals,
                        image: tokenData.image || ''
                    }
                }
            });
            
            // Feedback visual
            const btn = document.getElementById('add-to-wallet-btn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Adicionado!';
                btn.classList.add('btn-outline-success');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('btn-outline-success');
                }, 3000);
            }
            
        } catch (error) {
            console.error('Erro ao adicionar token à carteira:', error);
            alert('Erro ao adicionar o token à carteira. Tente manualmente.');
        }
    }

    shareToken(contractAddress) {
        const tokenData = this.sectionData.basicinfo;
        const shareText = `🎉 Acabei de criar meu token "${tokenData.name}" (${tokenData.symbol}) na BSC!\n\nContrato: ${contractAddress}\n\nCriado com XCafe Token Creator! 🚀`;
        
        if (navigator.share) {
            navigator.share({
                title: `Token ${tokenData.name} (${tokenData.symbol})`,
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback para copiar para clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Informações do token copiadas para a área de transferência!');
            });
        }
    }

    resetDeployButton() {
        const deployBtn = document.getElementById('deploy-token-btn');
        const networkSelect = document.getElementById('deploy-network');
        
        if (deployBtn) {
            if (networkSelect && networkSelect.value) {
                deployBtn.disabled = false;
                const selectedNetwork = this.supportedNetworks.find(n => n.chainId == networkSelect.value);
                if (selectedNetwork) {
                    deployBtn.innerHTML = `<i class="bi bi-rocket-takeoff me-2"></i>CRIAR TOKEN EM ${selectedNetwork.name.toUpperCase()}`;
                } else {
                    deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>CRIAR TOKEN';
                }
            } else {
                deployBtn.disabled = true;
                deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>CRIAR TOKEN';
            }
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
        const sections = ['wallet', 'basicinfo', 'deploy', 'result'];
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
        console.log('🔄 Resetando fluxo completo...');
        
        // Limpar todos os dados do progressive flow
        this.completedSections.clear();
        this.sectionData = {};
        this.walletConnected = false;
        this.checkingConnection = false; // Reset do flag
        
        // Resetar variáveis globais do add-index.js se existirem
        if (typeof window.walletConnected !== 'undefined') {
            window.walletConnected = false;
        }
        if (typeof window.walletAddress !== 'undefined') {
            window.walletAddress = '';
        }
        if (typeof window.currentStep !== 'undefined') {
            window.currentStep = 1;
        }
        if (typeof window.networkData !== 'undefined') {
            window.networkData = {};
        }
        
        // Chamar função de reset do add-index.js se disponível
        if (typeof window.resetAddIndexState === 'function') {
            window.resetAddIndexState();
        }
        
        // Limpar formulários
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        // Limpar campos individuais
        const fieldsToReset = [
            'tokenName', 'tokenSymbol', 'totalSupply', 'decimals', 
            'ownerAddress', 'tokenImage', 'wallet-status'
        ];
        
        fieldsToReset.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                if (fieldId === 'wallet-status') {
                    field.placeholder = 'Clique em "Conectar" para iniciar';
                }
            }
        });
        
        // Resetar decimais para valor padrão
        const decimalsField = document.getElementById('decimals');
        if (decimalsField) {
            decimalsField.value = '18';
        }
        
        // Ocultar informações da carteira conectada
        const walletConnectionInfo = document.getElementById('wallet-connection-info');
        if (walletConnectionInfo) {
            walletConnectionInfo.style.display = 'none';
        }
        
        const networkInfoSection = document.getElementById('network-info-section');
        if (networkInfoSection) {
            networkInfoSection.style.display = 'none';
        }
        
        // Resetar botão conectar
        const connectBtn = document.getElementById('connect-metamask-btn');
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="bi bi-wallet2 me-2"></i>CONECTAR';
            connectBtn.classList.remove('btn-success');
            connectBtn.classList.add('btn-warning');
            connectBtn.disabled = false;
        }
        
        // Ocultar botões próximo
        const nextButtons = ['wallet-next-btn', 'basic-info-next-btn'];
        nextButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.style.display = 'none';
        });
        
        // Limpar displays de resultado
        const resultDisplays = [
            'token-summary', 'token-details-result', 
            'blockchain-details-result', 'contract-address-display',
            'gas-used-display', 'block-number-display'
        ];
        
        resultDisplays.forEach(displayId => {
            const display = document.getElementById(displayId);
            if (display) {
                display.innerHTML = '';
                if (display.tagName === 'INPUT') {
                    display.value = '';
                }
            }
        });
        
        // Resetar botão de deploy
        this.resetDeployButton();
        
        // Resetar indicadores visuais
        const indicators = document.querySelectorAll('.section-indicator');
        indicators.forEach(indicator => {
            indicator.innerHTML = '<i class="bi bi-circle text-muted"></i>';
        });
        
        // Voltar para primeira seção
        this.enableSection('wallet');
        
        console.log('✅ Fluxo resetado com sucesso');
        
        // Mostrar confirmação visual
        const clearBtn = document.getElementById('clear-all-btn');
        if (clearBtn) {
            const originalText = clearBtn.innerHTML;
            const originalClasses = clearBtn.className;
            
            clearBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Limpo!';
            clearBtn.className = 'btn btn-success';
            
            setTimeout(() => {
                clearBtn.innerHTML = originalText;
                clearBtn.className = originalClasses;
            }, 2000);
        }
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.progressiveFlow = new ProgressiveFlow();
});
