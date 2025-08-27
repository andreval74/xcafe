/**
 * Progressive Flow Manager - Gerencia o fluxo progressivo de criação de tokens
 * Remove os steps e implementa seções que se desbloqueiam progressivamente
 */

class ProgressiveFlowManager {
    constructor() {
        this.currentSection = 'wallet';
        this.sections = ['wallet', 'basic-info', 'owner-config', 'deploy', 'result'];
        this.sectionValidations = {};
        this.init();
    }

    init() {
        console.log('🚀 Progressive Flow Manager iniciando');
        console.log('📋 Seções disponíveis:', this.sections);
        
        // Verificar se as seções existem no DOM
        this.sections.forEach(section => {
            const element = document.getElementById(`section-${section}`);
            console.log(`🔍 Seção ${section}:`, element ? '✅ Encontrada' : '❌ Não encontrada');
        });
        
        this.setupEventListeners();
        this.updateProgressBar();
        
        // Verificação simples de conexão após inicializar
        setTimeout(() => {
            this.checkIfAlreadyConnected();
        }, 1000);
        
        console.log('✅ Progressive Flow Manager inicializado');
    }

    // Verificação simples se já está conectado
    checkIfAlreadyConnected() {
        // Verificar se wallet já está conectada
        const walletStatus = document.getElementById('wallet-status');
        const ownerAddress = document.getElementById('ownerAddress');
        
        console.log('🔍 Verificando se já está conectado...');
        console.log('Wallet status:', walletStatus?.value);
        console.log('Owner address:', ownerAddress?.value);
        console.log('Window walletConnected:', window.walletConnected);
        console.log('Window walletAddress:', window.walletAddress);
        
        // Condições para considerar conectado
        const isConnected = 
            (window.walletConnected && window.walletAddress) ||
            (walletStatus && walletStatus.value && walletStatus.value !== 'Clique em \'Conectar\' para iniciar') ||
            (ownerAddress && ownerAddress.value && ownerAddress.value.startsWith('0x'));
        
        if (isConnected) {
            console.log('✅ Carteira já conectada detectada, pulando para próxima seção');
            
            // Capturar dados da rede atual
            const networkDisplay = document.getElementById('network-display');
            const chainIdElement = document.getElementById('chain-id');
            
            let networkData = window.networkData;
            if (!networkData && networkDisplay && chainIdElement) {
                networkData = {
                    name: networkDisplay.value || 'Rede Conectada',
                    chainId: chainIdElement.textContent || 'auto'
                };
            }
            
            const walletData = {
                address: window.walletAddress || ownerAddress?.value || walletStatus?.value,
                network: networkData || { name: 'Rede Atual', chainId: 'detectado' }
            };
            this.markSectionComplete('wallet', walletData);
        } else {
            console.log('❌ Carteira não conectada, aguardando conexão');
        }
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners do Progressive Flow');
        
        // Wallet connection events - evento direto
        document.addEventListener('walletConnected', (e) => {
            console.log('📡 Evento walletConnected recebido:', e.detail);
            this.markSectionComplete('wallet', e.detail);
        });

        // Monitorar clique do botão conectar para verificar depois
        const connectBtn = document.getElementById('connect-metamask-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                console.log('👆 Botão conectar clicado, verificando em 3 segundos...');
                setTimeout(() => {
                    this.checkIfAlreadyConnected();
                }, 3000);
            });
        }

        // Monitorar mudanças no MetaMask
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('🔄 Contas do MetaMask mudaram:', accounts);
                if (accounts && accounts.length > 0) {
                    setTimeout(() => {
                        this.checkIfAlreadyConnected();
                    }, 500);
                }
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('🔗 Rede mudou:', chainId);
                setTimeout(() => {
                    this.checkIfAlreadyConnected();
                }, 500);
            });
        }

        // Form validation events - sem validação automática
        this.setupFormValidation('section-basic-info', ['tokenName', 'tokenSymbol', 'totalSupply']);
        this.setupFormValidation('section-owner-config', []);

        // Deploy button
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => this.handleDeploy());
        }
        
        console.log('✅ Event listeners configurados');
    }

    setupFormValidation(sectionId, requiredFields) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        // Apenas formatação do supply, sem validação automática
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    // Formatação especial para o campo de supply
                    if (fieldId === 'totalSupply') {
                        this.formatSupplyInput(field);
                    }
                    // Sem validação automática aqui
                });
            }
        });

        // Adicionar botão "Próximo" se não existir
        this.addNextButton(sectionId, requiredFields);
    }

    addNextButton(sectionId, requiredFields) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const sectionKey = sectionId.replace('section-', '');
        const buttonId = `next-btn-${sectionKey}`;
        
        // Não adicionar se já existe
        if (document.getElementById(buttonId)) return;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'text-end mt-3';
        buttonContainer.innerHTML = `
            <button id="${buttonId}" class="btn btn-primary">
                <i class="bi bi-arrow-right me-1"></i>Próximo
            </button>
        `;

        section.appendChild(buttonContainer);

        // Event listener para o botão
        document.getElementById(buttonId).addEventListener('click', () => {
            this.validateAndProceed(sectionId, requiredFields);
        });
    }

    validateAndProceed(sectionId, requiredFields) {
        let isValid = true;
        let errorMessage = '';

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.hasAttribute('required')) {
                field.classList.remove('is-invalid', 'is-valid');
                
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('is-invalid');
                    errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
                } else {
                    // Validações específicas apenas se o campo estiver preenchido
                    if (fieldId === 'tokenName' && field.value.trim().length < 2) {
                        isValid = false;
                        field.classList.add('is-invalid');
                        errorMessage = 'Nome do token deve ter pelo menos 2 caracteres.';
                    } else if (fieldId === 'tokenSymbol' && (field.value.trim().length < 2 || field.value.trim().length > 10)) {
                        isValid = false;
                        field.classList.add('is-invalid');
                        errorMessage = 'Símbolo deve ter entre 2 e 10 caracteres.';
                    } else if (fieldId === 'totalSupply') {
                        const cleanValue = this.parseSupplyValue(field.value);
                        if (!cleanValue || isNaN(cleanValue) || parseFloat(cleanValue) <= 0) {
                            isValid = false;
                            field.classList.add('is-invalid');
                            errorMessage = 'Supply deve ser um número maior que zero.';
                        } else {
                            field.classList.add('is-valid');
                        }
                    } else {
                        field.classList.add('is-valid');
                    }
                }
            }
        });

        if (isValid) {
            const sectionKey = sectionId.replace('section-', '');
            this.markSectionComplete(sectionKey);
        } else {
            alert(errorMessage);
        }
    }

    formatSupplyInput(field) {
        // Remove tudo exceto números
        let value = field.value.replace(/[^\d]/g, '');
        
        // Limita a um número razoável (evita valores muito grandes)
        if (value.length > 15) {
            value = value.substring(0, 15);
        }
        
        // Aplica formatação com separadores de milhares
        if (value) {
            const formattedValue = new Intl.NumberFormat('pt-BR').format(value);
            field.value = formattedValue;
        }
    }

    markSectionComplete(sectionKey, data = null) {
        console.log(`🟢 Seção ${sectionKey} marcada como completa`, data);
        
        this.sectionValidations[sectionKey] = { complete: true, data };
        
        // Atualizar barra de progresso
        this.updateProgressBar();
        
        // Desbloquear próxima seção se necessário
        const currentIndex = this.sections.indexOf(sectionKey);
        if (currentIndex < this.sections.length - 1) {
            const nextSection = this.sections[currentIndex + 1];
            console.log(`🔓 Habilitando próxima seção: ${nextSection}`);
            this.enableSection(nextSection);
        }

        // Ações específicas por seção
        switch (sectionKey) {
            case 'wallet':
                this.handleWalletComplete(data);
                break;
            case 'basic-info':
                this.handleBasicInfoComplete();
                break;
            case 'owner-config':
                this.handleOwnerConfigComplete();
                break;
        }
    }

    enableSection(sectionKey) {
        const section = document.getElementById(`section-${sectionKey}`);
        if (section) {
            console.log(`✅ Habilitando seção: section-${sectionKey}`);
            section.style.display = 'block';
            section.classList.add('section-enabled');
            section.classList.remove('disabled');
            
            // Scroll suave para a nova seção
            setTimeout(() => {
                section.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                });
            }, 200);
        } else {
            console.error(`❌ Seção não encontrada: section-${sectionKey}`);
        }
    }

    updateProgressBar() {
        const completedSections = Object.keys(this.sectionValidations).length;
        const progressPercentage = Math.min((completedSections / (this.sections.length - 1)) * 100, 100);
        
        const progressBar = document.getElementById('main-progress');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${Math.max(progressPercentage, 5)}%`;
        }

        if (progressText) {
            const messages = [
                'Conecte sua carteira para começar',
                'Carteira conectada! Preencha os dados básicos',
                'Ótimo! Configure as opções do proprietário',
                'Quase lá! Revise e faça o deploy',
                'Token criado com sucesso!'
            ];
            progressText.textContent = messages[completedSections] || messages[0];
        }
    }

    handleWalletComplete(walletData) {
        if (walletData && walletData.address) {
            // Preencher endereço do proprietário automaticamente
            const ownerAddress = document.getElementById('ownerAddress');
            if (ownerAddress) {
                ownerAddress.value = walletData.address;
            }

            // Preencher informações da rede
            const networkDisplay = document.getElementById('network-display');
            const networkValue = document.getElementById('networkValue');
            const networkDisplayHidden = document.getElementById('networkDisplay');
            
            if (networkDisplay && walletData.network) {
                const networkName = walletData.network.name || this.getNetworkName(walletData.network.chainId) || 'Desconhecida';
                networkDisplay.value = `${networkName} (Chain ID: ${walletData.network.chainId})`;
            }
            if (networkValue && walletData.network) {
                networkValue.value = walletData.network.chainId || '';
            }
            if (networkDisplayHidden && walletData.network) {
                networkDisplayHidden.value = walletData.network.name || this.getNetworkName(walletData.network.chainId) || 'Desconhecida';
            }
        }
    }

    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            56: 'BSC Mainnet',
            97: 'BSC Testnet',
            137: 'Polygon Mainnet',
            80001: 'Mumbai Testnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet'
        };
        return networks[parseInt(chainId)] || `Rede ${chainId}`;
    }

    handleBasicInfoComplete() {
        // Não marcar owner-config automaticamente
        // Usuário deve clicar no botão "Próximo"
    }

    handleOwnerConfigComplete() {
        // Preparar resumo e habilitar deploy
        this.prepareTokenSummary();
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.disabled = false;
        }
    }

    prepareTokenSummary() {
        const tokenName = document.getElementById('tokenName')?.value || '';
        const tokenSymbol = document.getElementById('tokenSymbol')?.value || '';
        const decimals = document.getElementById('decimals')?.value || '18';
        const totalSupply = document.getElementById('totalSupply')?.value || '';
        const ownerAddress = document.getElementById('ownerAddress')?.value || '';
        const tokenImage = document.getElementById('tokenImage')?.value || '';
        const networkDisplay = document.getElementById('network-display')?.value || '';

        const summaryDiv = document.getElementById('token-summary');
        if (summaryDiv) {
            summaryDiv.innerHTML = `
                <div class="row g-2">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center p-2 bg-dark rounded border">
                            <i class="bi bi-tag text-primary me-2 fs-5"></i>
                            <div class="flex-grow-1">
                                <small class="text-muted d-block">Nome</small>
                                <span class="text-white fw-semibold">${tokenName}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center p-2 bg-dark rounded border">
                            <i class="bi bi-code-square text-primary me-2 fs-5"></i>
                            <div class="flex-grow-1">
                                <small class="text-muted d-block">Símbolo</small>
                                <span class="text-white fw-semibold">${tokenSymbol}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center p-2 bg-dark rounded border">
                            <i class="bi bi-cash-stack text-primary me-2 fs-5"></i>
                            <div class="flex-grow-1">
                                <small class="text-muted d-block">Total Supply</small>
                                <span class="text-white fw-semibold">${this.formatNumber(totalSupply)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center p-2 bg-dark rounded border">
                            <i class="bi bi-123 text-primary me-2 fs-5"></i>
                            <div class="flex-grow-1">
                                <small class="text-muted d-block">Decimais</small>
                                <span class="text-white fw-semibold">${decimals}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="d-flex align-items-center p-2 bg-dark rounded border">
                            <i class="bi bi-person-badge text-primary me-2 fs-5"></i>
                            <div class="flex-grow-1">
                                <small class="text-muted d-block">Proprietário</small>
                                <code class="text-white small">${ownerAddress}</code>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="d-flex align-items-center p-2 bg-dark rounded border">
                            <i class="bi bi-globe text-primary me-2 fs-5"></i>
                            <div class="flex-grow-1">
                                <small class="text-muted d-block">Rede de Deploy</small>
                                <span class="text-white fw-semibold">${networkDisplay}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex align-items-center p-2 bg-success bg-opacity-10 rounded border border-success">
                            <i class="bi bi-coin text-success me-2 fs-5"></i>
                            <div class="flex-grow-1">
                                <small class="text-muted d-block">Custo</small>
                                <span class="text-success fw-bold">0.01 BNB</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
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

            // Deploy real do contrato
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
            // Conectar com a carteira
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // ABI do contrato ERC-20 simples
            const contractABI = [
                "constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply)",
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function decimals() view returns (uint8)",
                "function totalSupply() view returns (uint256)",
                "function balanceOf(address) view returns (uint256)",
                "function transfer(address to, uint256 amount) returns (bool)",
                "function approve(address spender, uint256 amount) returns (bool)",
                "function transferFrom(address from, address to, uint256 amount) returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)",
                "event Transfer(address indexed from, address indexed to, uint256 value)",
                "event Approval(address indexed owner, address indexed spender, uint256 value)"
            ];

            // Bytecode do contrato compilado (ERC-20 básico)
            const contractBytecode = "0x608060405234801561001057600080fd5b5060405161066038038061066083398101604081905261002f91610155565b835161004290600390602087019061008e565b50825161005690600490602086019061008e565b506005805460ff191660ff8316179055600254610077906000906000906100e4565b61008185826101e4565b50505050506102a7565b82805461009a90610236565b90600052602060002090601f0160209004810192826100bc5760008555610102565b82601f106100d557805160ff1916838001178555610102565b82800160010185558215610102579182015b828111156101025782518255916020019190600101906100e7565b5061010e929150610112565b5090565b5b8082111561010e5760008155600101610113565b600082601f83011261013857600080fd5b81516020610145826101e4565b6040516101528282610271565b8381528281019150858301600585901b8701840188101561017257600080fd5b60005b858110156101a05781518352602092830192919091019060010161017557855183015260200180610175565b5090979650505050505050565b600080600080608085870312156101c357600080fd5b845193506020850151925060408501516101dc816102a0565b6060959095015193969295505050565b60008219821115610201576102016102ab565b500190565b600181811c9082168061021a57607f821691505b6020821081141561023b57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b6000608082840312156102696000fd5b50919050565b601f8201601f191681016001600160401b038111828210171561029457610294610290565b6040529392505050565b61ffff811681146102ae57600080fd5b50565b60405180910390fd5b6103aa806102b66000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461014157806370a082311461015457806395d89b411461017d578063a457c2d714610185578063a9059cbb14610198578063dd62ed3e146101ab57600080fd5b806306fdde03146100ae57806318160ddd146100cc57806323b872dd146100e5578063313ce567146100f857806339509351146100f8575b600080fd5b6100b66101e4565b6040516100c391906102e1565b60405180910390f35b6100d560025481565b6040519081526020016100c3565b6100f86100f3366004610280565b610276565b005b60055460405160ff90911681526020016100c3565b6100f861014f3660046102bc565b610331565b6100d5610162366004610262565b6001600160a01b031660009081526020819052604090205490565b6100b661036d565b6100f86101933660046102bc565b61037c565b6100f86101a63660046102bc565b6103c1565b6100d56101b9366004610250565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101f39061033a565b80601f016020809104026020016040519081016040528092919081815260200182805461021f9061033a565b801561026c5780601f106102415761010080835404028352916020019161026c565b820191906000526020600020905b81548152906001019060200180831161024f57829003601f168201915b5050505050905090565b60006102836003856102ee565b90508034565b60405180606001604052806060815260200160608152602001600360ff1681525081565b6001600160a01b038082168352602083015260408201526060810151602080830152608082015160408301526040820151606083015260a0820151608083015260c0820151151560a083015260e0820151151560c083015261010082015115156000190160e083015290565b60008060408385031215610263578182fd5b50508035926020909101359150565b60006020828403121561028457600080fd5b81356001600160a01b038116811461029b57600080fd5b9392505050565b600080604083850312156102b557600080fd5b8235915060208301356102c781610396565b809150509250929050565b600060208083525183516060828501526102ef60808501826102f9565b905060208501516040850152604085015115156060850152809250505092915050565b60008151808452610322816020860160208601610370565b601f01601f19169290920160200192915050565b600181811c9082168061034a57607f821691505b6020821081141561036b57634e487b7160e01b600052602260045260246000fd5b50919050565b60005b8381101561038b578181015183820152602001610373565b838111156102c75750506000910152565b6001600160a01b03811681146103ab57600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b63ffffffff60e01b81168114610363578182fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000";

            // Preparar dados do constructor
            const totalSupplyWei = ethers.utils.parseUnits(tokenData.totalSupply.toString(), tokenData.decimals);
            
            console.log('Dados para deploy:', {
                name: tokenData.name,
                symbol: tokenData.symbol,
                decimals: tokenData.decimals,
                totalSupply: totalSupplyWei.toString()
            });

            // Criar factory do contrato
            const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, signer);
            
            // Fazer deploy com configurações mais seguras
            const contract = await contractFactory.deploy(
                tokenData.name,
                tokenData.symbol,
                tokenData.decimals,
                totalSupplyWei,
                {
                    gasLimit: 3000000, // Aumentar gas limit para 3M
                    gasPrice: ethers.utils.parseUnits('5', 'gwei') // Gas price fixo
                }
            );

            console.log('Contrato deployado, aguardando confirmação...');
            
            // Aguardar confirmação
            const deployReceipt = await contract.deployTransaction.wait(1);
            
            console.log('Deploy confirmado:', deployReceipt);
            
            return {
                contractAddress: contract.address,
                transactionHash: deployReceipt.transactionHash,
                network: await provider.getNetwork(),
                gasUsed: deployReceipt.gasUsed.toString(),
                blockNumber: deployReceipt.blockNumber
            };

        } catch (error) {
            console.error('Erro detalhado no deploy:', error);
            
            // Mensagens de erro mais amigáveis
            let errorMessage = 'Erro desconhecido no deploy';
            
            if (error.message.includes('insufficient funds')) {
                errorMessage = 'Saldo insuficiente para pagar o gas da transação';
            } else if (error.message.includes('user rejected')) {
                errorMessage = 'Transação rejeitada pelo usuário';
            } else if (error.message.includes('network')) {
                errorMessage = 'Erro de conectividade com a rede';
            } else if (error.reason) {
                errorMessage = error.reason;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
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
                    <h5 class="text-success mt-3">Deploy Concluído!</h5>
                    <p class="text-muted">Seu token foi criado com sucesso na blockchain</p>
                </div>
                
                <div class="row g-3">
                    <div class="col-12">
                        <div class="alert alert-success">
                            <strong><i class="bi bi-link-45deg me-1"></i>Endereço do Contrato:</strong><br>
                            <code class="text-dark">${deployResult.contractAddress}</code>
                            <button class="btn btn-sm btn-outline-success ms-2" onclick="navigator.clipboard.writeText('${deployResult.contractAddress}')">
                                <i class="bi bi-clipboard"></i>
                            </button>
                            ${explorerUrl ? `<a href="${explorerUrl}" target="_blank" class="btn btn-sm btn-outline-primary ms-1">
                                <i class="bi bi-box-arrow-up-right"></i> Ver no Explorer
                            </a>` : ''}
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="alert alert-info">
                            <strong><i class="bi bi-hash me-1"></i>Transaction Hash:</strong><br>
                            <code class="text-dark">${deployResult.transactionHash}</code>
                            <button class="btn btn-sm btn-outline-info ms-2" onclick="navigator.clipboard.writeText('${deployResult.transactionHash}')">
                                <i class="bi bi-clipboard"></i>
                            </button>
                            ${txUrl ? `<a href="${txUrl}" target="_blank" class="btn btn-sm btn-outline-primary ms-1">
                                <i class="bi bi-box-arrow-up-right"></i> Ver Transação
                            </a>` : ''}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-secondary">
                            <strong><i class="bi bi-globe me-1"></i>Rede:</strong><br>
                            <span class="text-muted">${networkName} (Chain ID: ${deployResult.network?.chainId})</span>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-secondary">
                            <strong><i class="bi bi-fuel-pump me-1"></i>Gas Usado:</strong><br>
                            <span class="text-muted">${this.formatNumber(deployResult.gasUsed || '0')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-warning mt-3">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Próximos Passos:</strong>
                    <ul class="mb-0 mt-2">
                        <li>Adicione o token à sua carteira usando o endereço do contrato</li>
                        <li>Baixe o código fonte (.sol) para referência futura</li>
                        <li>Considere fazer a verificação do contrato no explorer</li>
                    </ul>
                </div>
            `;
        }

        // Mostrar botão de download do contrato
        const downloadBtn = document.getElementById('download-contract-btn');
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-block';
            downloadBtn.addEventListener('click', () => this.downloadContract());
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
        if (!baseUrl) return null;
        
        return `${baseUrl}/${type}/${hash}`;
    }

    handleDeployError(error) {
        const deployBtn = document.getElementById('deploy-token-btn');
        if (deployBtn) {
            deployBtn.disabled = false;
            deployBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>CRIAR TOKEN (0.01 BNB)';
        }

        alert(`Erro no deploy: ${error.message}`);
    }

    downloadContract() {
        // Gerar arquivo .sol personalizado
        const tokenName = document.getElementById('tokenName')?.value || 'MyToken';
        const tokenSymbol = document.getElementById('tokenSymbol')?.value || 'MTK';
        const decimals = document.getElementById('decimals')?.value || '18';
        const totalSupply = document.getElementById('totalSupply')?.value || '1000000';

        const contractCode = this.generateSolidityContract(tokenName, tokenSymbol, decimals, totalSupply);
        
        const blob = new Blob([contractCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tokenSymbol.toLowerCase()}-token.sol`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateSolidityContract(name, symbol, decimals, supply) {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ${name} (${symbol})
 * @dev Token ERC-20 criado via XCAFE Token Creator
 * @notice Este contrato implementa um token ERC-20 padrão
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract ${symbol}Token is IERC20 {
    string public constant name = "${name}";
    string public constant symbol = "${symbol}";
    uint8 public constant decimals = ${decimals};
    uint256 public constant totalSupply = ${supply} * 10**${decimals};
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    constructor() {
        _balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function totalSupply() public pure override returns (uint256) {
        return totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(recipient != address(0), "Transfer to zero address");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        
        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;
        
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        require(recipient != address(0), "Transfer to zero address");
        require(_balances[sender] >= amount, "Insufficient balance");
        require(_allowances[sender][msg.sender] >= amount, "Insufficient allowance");
        
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        _allowances[sender][msg.sender] -= amount;
        
        emit Transfer(sender, recipient, amount);
        return true;
    }
}`;
    }

    formatNumber(num) {
        // Remove formatação se existir
        const cleanNum = typeof num === 'string' ? num.replace(/[^\d]/g, '') : num;
        return new Intl.NumberFormat('pt-BR').format(cleanNum);
    }

    parseSupplyValue(value) {
        // Remove formatação e retorna apenas números
        return value.replace(/[^\d]/g, '');
    }
}

// Inicializar o gerenciador de fluxo progressivo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 DOMContentLoaded - Criando Progressive Flow Manager');
    window.progressiveFlow = new ProgressiveFlowManager();
});

// Compatibilidade com código existente - mantém algumas funções que podem ser chamadas
window.validateStep1 = function() { return true; };
window.validateStep2 = function() { return window.progressiveFlow?.sectionValidations?.['basic-info']?.complete || false; };
window.nextStep = function(step) { console.log('nextStep chamado para:', step); };
window.prevStep = function() { console.log('prevStep chamado'); };
