/**
 * Módulo compartilhado para gerenciar Conexão com a carteira
 * Este módulo pode ser importado por qualquer página que precise de Conexão com MetaMask
 */

import { connectMetaMask, listenMetaMask } from '../add-metamask.js';
import { detectCurrentNetwork, updateNetworkInfo } from '../network-manager.js';

// Estado do provider e da Conexão
let currentProvider = null;
let isConnecting = false;

/**
 * Atualiza a interface de Conexão com o status atual
 * @param {string} status - Status da Conexão ('connecting', 'connected', 'error', etc.)
 */
function updateConnectionInterface(status = '') {
    const connectionSection = document.querySelector('.connection-section');
    const walletStatus = document.getElementById('wallet-status');
    const btnConectar = document.getElementById('connect-metamask-btn');
    const ownerInput = document.getElementById('ownerAddress');
    const currentNetworkSpan = document.getElementById('current-network');
    const networkInfoSection = document.getElementById('network-info-section');

    console.log('Atualizando interface de Conexão com status:', status);

    // Remove estado de carregamento
    if (connectionSection) {
        connectionSection.classList.remove('connecting');
        if (status === 'connected') {
            connectionSection.classList.add('connected-state');
        }
    }
    
    // Controla a visibilidade das informações de rede
    if (networkInfoSection) {
        if (status === 'connected') {
            networkInfoSection.style.display = 'block';
            console.log('Informações de rede mostradas após Conexão');
        } else {
            networkInfoSection.style.display = 'none';
            console.log('Informações de rede escondidas - não conectado');
        }
    }
    
    // Atualiza status da carteira
    if (walletStatus) {
        switch(status) {
            case 'connecting':
                walletStatus.value = 'Conectando com MetaMask...';
                walletStatus.classList.remove('wallet-status-connected');
                break;
            case 'connected':
                // Busca o endereço completo da carteira
                if (ownerInput && ownerInput.value) {
                    walletStatus.value = ownerInput.value; // Endereço completo
                } else {
                    walletStatus.value = 'Carteira conectada com sucesso!';
                }
                walletStatus.classList.add('wallet-status-connected');
                break;
            case 'error':
                walletStatus.value = 'Erro na Conexão. Tente novamente.';
                walletStatus.classList.remove('wallet-status-connected');
                break;
            default:
                walletStatus.value = status || 'Clique em "Conectar" para iniciar';
                walletStatus.classList.remove('wallet-status-connected');
        }
        console.log('… Wallet status atualizado:', walletStatus.value);
    }

    // Se houver um campo de proprietário, atualiza ele também
    if (ownerInput && ownerInput.value) {
        ownerInput.classList.add('filled');
    }

    // Atualiza o span da rede se disponível (só quando conectado)
    if (currentNetworkSpan && status === 'connected') {
    // A rede será atualizada pela função updateNetworkInfo do network-manager
        console.log('… Preparado para atualizAção da rede via network-manager');
    } else if (currentNetworkSpan && status !== 'connected') {
    // Limpa a rede quando não conectado
        currentNetworkSpan.textContent = '-';
    }

    // Atualiza Botão
    if (btnConectar) {
        if (status === 'connected') {
            btnConectar.innerHTML = '<i class="bi bi-check-circle"></i> CONECTADO';
            btnConectar.disabled = true;
            btnConectar.className = 'btn btn-success';
            console.log('Botão marcado como conectado');
        } else if (status === 'connecting') {
            btnConectar.innerHTML = '<i class="spinner-border spinner-border-sm"></i> CONECTANDO...';
            btnConectar.disabled = true;
            btnConectar.className = 'btn btn-warning';
        } else {
            btnConectar.innerHTML = '<i class="bi bi-wallet2"></i> CONECTAR';
            btnConectar.disabled = isConnecting;
            btnConectar.className = 'btn btn-outline-warning';
        }
    }
}

/**
 * Inicializa o componente de Conexão da carteira
 * Corrige o problema de speculation rule inserindo o HTML de forma segura
 */
async function setupWalletConnection() {
    try {
    console.log('Configurando Conexão da carteira...');
        
        // Procura pelo local onde o template deve ser injetado
        const connectionSection = document.querySelector('.connection-section');
        if (!connectionSection) {
            console.warn('⚠️ Seção de Conexão não encontrada na página');
            return;
        }

        console.log('… Seção de Conexão encontrada');

        // Verifica se já existe conteúdo na seção (HTML já presente na página)
        const existingButton = document.getElementById('connect-metamask-btn');
        if (existingButton) {
            console.log('… Interface de Conexão já presente, configurando botões...');
            // Apenas configura o Botão existente
            existingButton.addEventListener('click', handleConnection);
            console.log('… Botão de Conexão configurado');
            
            // Configura listeners globais para mudanças de conta
            setupGlobalListeners();
            return;
        }

        // Se não existe, tenta carregar template
        console.log('“„ Carregando template wallet-connection...');
        const response = await fetch('./templates/wallet-connection.html');
        if (!response.ok) {
            console.warn(`âš ï¸ Template não encontrado (${response.status}), usando fallback`);
            createFallbackInterface();
            setupGlobalListeners();
            return;
        }
        
        const template = await response.text();
        console.log('… Template carregado com sucesso');
        
        // Método seguro para inserir HTML sem causar speculation rule warning
        // Cria um elemento temporário e move seus filhos para evitar problemas
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = template;
        
        // Remove todo o conteúdo atual da seção
        connectionSection.innerHTML = '';
        
        // Move cada elemento filho do template para a seção
        while (tempDiv.firstChild) {
            connectionSection.appendChild(tempDiv.firstChild);
        }
        
        // Configura o Botão de Conexão após inserir o template
        const btnConectar = document.getElementById('connect-metamask-btn');
        if (btnConectar) {
            btnConectar.addEventListener('click', handleConnection);
            console.log('… Botão de Conexão configurado');
        } else {
            console.warn('âš ï¸ Botão de Conexão não encontrado no template');
        }
        
        // Configura listeners globais para mudanças de conta
        setupGlobalListeners();
        
        console.log('… Componente de Conexão configurado com sucesso');
        
    } catch (error) {
        console.error('âŒ Erro ao configurar Conexão da carteira:', error);
        
        // Fallback: cria interface básica se falhar
        createFallbackInterface();
        setupGlobalListeners();
    }
}

/**
 * Cria uma interface básica de Conexão se o template falhar
 */
function createFallbackInterface() {
    const connectionSection = document.querySelector('.connection-section');
    if (!connectionSection) return;
    
    connectionSection.innerHTML = `
        <div class="card border-warning">
            <div class="card-body">
                <h5 class="card-title">
                    <i class="bi bi-wallet2 text-warning me-2"></i>Conexão da Carteira
                </h5>
                <div class="d-flex gap-3 align-items-center">
                    <input type="text" class="form-control" id="wallet-status" 
                           placeholder="Clique em 'Conectar' para iniciar" style="font-family: monospace;" readonly>
                    <button id="connect-metamask-btn" type="button" class="btn btn-outline-warning">
                        <i class="bi bi-wallet2"></i> CONECTAR
                    </button>
                </div>
                <div class="row mt-2" id="network-info-section" style="display: none;">
                    <div class="col-md-12">
                        <small class="text-muted network-info">
                            <i class="bi bi-wifi"></i> Rede: <span id="current-network" class="fw-bold">-</span>
                            <span id="chain-id-display" class="chain-id ms-2">
                                <i class="bi bi-link-45deg"></i> Chain ID: <span id="chain-id-value">-</span>
                            </span>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Configura o Botão
    const btnConectar = document.getElementById('connect-metamask-btn');
    if (btnConectar) {
        btnConectar.addEventListener('click', handleConnection);
    }
    
    console.log('… Interface de fallback criada');
}

/**
 * Manipula o processo de Conexão com a carteira
 * @param {Event} event - Evento do clique no Botão
 */
async function handleConnection(event) {
    event.preventDefault();
    
    if (isConnecting) {
        console.log('âš ï¸ Conexão já em andamento, aguarde...');
        return;
    }
    
    if (!window.ethereum) {
        alert('MetaMask não encontrado! Por favor, instale a extensão MetaMask no seu navegador.');
        return;
    }

    try {
        isConnecting = true;
        console.log('”— Iniciando processo de Conexão...');
        updateConnectionInterface('connecting');

        // Conecta com MetaMask
        currentProvider = await connectMetaMask();
        console.log('… MetaMask conectado');
        
        // Busca o endereço da carteira conectada
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
            const ownerInput = document.getElementById('ownerAddress');
            if (ownerInput) {
                ownerInput.value = accounts[0];
                console.log('… Endereço da carteira salvo:', accounts[0]);
            }
        }
        
        // Detecta a rede atual
        await detectCurrentNetwork();
        updateNetworkInfo();
        console.log('… Rede detectada e informações atualizadas');
        
        // Os listeners já foram configurados no setupGlobalListeners()
        console.log('… Listeners já configurados globalmente');
        
        // Atualiza interface para estado conectado
        updateConnectionInterface('connected');
        console.log('… Conexão concluída com sucesso');

    } catch (error) {
        console.error('âŒ Erro ao conectar com MetaMask:', error);
        updateConnectionInterface('error');
        alert('Erro ao conectar com MetaMask: ' + error.message);
    } finally {
        isConnecting = false;
    }
}

/**
 * Retorna o provider atual da carteira conectada
 * @returns {Object|null} Provider do MetaMask ou null se não conectado
 */
function getCurrentProvider() {
    return currentProvider;
}

/**
 * Configura listeners globais para mudanças no MetaMask
 */
function setupGlobalListeners() {
    if (!window.ethereum) return;
    
    console.log('Ž§ Configurando listeners globais para MetaMask...');
    
    // Remove listeners existentes para evitar duplicAção
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
    
    // Listener para mudanças de conta
    window.ethereum.on('accountsChanged', async function (accounts) {
        console.log('”„ Evento accountsChanged:', accounts);
        
        const walletStatus = document.getElementById('wallet-status');
        const ownerInput = document.getElementById('ownerAddress');
        const networkInfoSection = document.getElementById('network-info-section');
        const btnConectar = document.getElementById('connect-metamask-btn');
        
        if (accounts.length > 0 && accounts[0]) {
            console.log('… Nova conta detectada:', accounts[0]);
            
            // Atualiza campo da carteira
            if (walletStatus) {
                walletStatus.value = accounts[0];
                walletStatus.classList.add('wallet-status-connected');
                console.log('… Campo wallet-status atualizado:', accounts[0]);
            }
            
            // Atualiza campo de owner se existir
            if (ownerInput) {
                ownerInput.value = accounts[0];
                console.log('… Campo ownerAddress atualizado:', accounts[0]);
            }
            
            // Mantém Botão como conectado
            if (btnConectar) {
                btnConectar.innerHTML = '<i class="bi bi-check-circle"></i> CONECTADO';
                btnConectar.disabled = true;
                btnConectar.className = 'btn btn-success';
            }
            
            // Detecta rede da nova conta
            await detectCurrentNetwork();
            updateNetworkInfo();
            
        } else {
            console.log('âŒ Carteira desconectada');
            
            // Limpa campos
            if (walletStatus) {
                walletStatus.value = 'Clique em "Conectar" para iniciar';
                walletStatus.classList.remove('wallet-status-connected');
            }
            
            if (ownerInput) {
                ownerInput.value = '';
            }
            
            // Esconde informações de rede
            if (networkInfoSection) {
                networkInfoSection.style.display = 'none';
            }
            
            // Restaura Botão para estado desconectado
            if (btnConectar) {
                btnConectar.innerHTML = '<i class="bi bi-wallet2"></i> CONECTAR';
                btnConectar.disabled = false;
                btnConectar.className = 'btn btn-outline-warning';
            }
            
            // Limpa dados de rede
            currentNetwork = null;
        }
    });
    
    // Listener para mudanças de rede
    window.ethereum.on('chainChanged', async function (chainId) {
        console.log('”„ Rede alterada:', chainId);
        
        // Só processa se houver carteira conectada
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
            await detectCurrentNetwork();
            updateNetworkInfo();
        }
    });
    
    console.log('… Listeners globais configurados (sem duplicAção)');
}

// ==================== EXPORTS GLOBAIS ====================

// Torna as funções disponíveis globalmente
window.WalletConnection = {
    setupWalletConnection,
    getCurrentProvider
};

console.log('”— [WALLET-CONNECTION] Módulo carregado - Funções disponíveis globalmente');





