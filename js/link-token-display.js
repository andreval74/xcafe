// js/link-token-display.js
// Reutiliza as funções existentes do link-index.js para exibir dados do token
import { fetchAllNetworks } from './shared/token-link-utils.js';

/**
 * Detecta a carteira e rede conectadas
 */
async function detectWalletAndNetwork(tokenChainId = null, allNetworks = []) {
    console.log('🔍 Detectando carteira e rede...');
    
    const connectedWalletInput = document.getElementById('connectedWallet');
    const connectedNetworkInput = document.getElementById('connectedNetwork');
    const connectionWarning = document.getElementById('connection-warning');
    
    try {
        // Detectar carteira conectada
        let walletName = 'Não conectado';
        let walletProvider = null;
        
        if (typeof window.ethereum !== 'undefined') {
            // Verificar se é MetaMask
            if (window.ethereum.isMetaMask) {
                walletName = 'MetaMask';
                walletProvider = window.ethereum;
            }
            // Verificar se é TrustWallet
            else if (window.ethereum.isTrustWallet || window.ethereum.isTrust) {
                walletName = 'TrustWallet';
                walletProvider = window.ethereum;
            }
            // Outras carteiras EIP-6963
            else if (window.ethereum.providers && window.ethereum.providers.length > 0) {
                const provider = window.ethereum.providers[0];
                walletName = provider.info?.name || 'Carteira Web3';
                walletProvider = provider;
            }
            else {
                walletName = 'Carteira Web3';
                walletProvider = window.ethereum;
            }
        }
        
        connectedWalletInput.value = walletName;
        
        // Detectar rede conectada
        if (walletProvider) {
            try {
                const chainId = await walletProvider.request({ method: 'eth_chainId' });
                const chainIdDecimal = parseInt(chainId, 16);
                
                // Buscar informações da rede
                const network = allNetworks.find(net => net.chainId === chainIdDecimal);
                
                if (network) {
                    connectedNetworkInput.value = `${network.name} (${chainIdDecimal})`;
                    
                    // Verificar se a rede conectada é diferente da rede do token
                    if (tokenChainId && parseInt(tokenChainId) !== chainIdDecimal) {
                        const tokenNetwork = allNetworks.find(net => net.chainId === parseInt(tokenChainId));
                        connectionWarning.style.display = 'block';
                        
                        const warningText = document.getElementById('connection-warning-text');
                        if (warningText) {
                            warningText.innerHTML = `
                                Sua carteira está conectada na rede <strong>${network.name}</strong>, 
                                mas o token está na rede <strong>${tokenNetwork ? tokenNetwork.name : 'Chain ID ' + tokenChainId}</strong>. 
                                Mude para a rede correta para adicionar o token.
                            `;
                        }
                    } else {
                        connectionWarning.style.display = 'none';
                    }
                } else {
                    connectedNetworkInput.value = `Rede Desconhecida (${chainIdDecimal})`;
                    connectionWarning.style.display = 'block';
                }
                
            } catch (error) {
                console.warn('Erro ao detectar rede:', error);
                connectedNetworkInput.value = 'Erro ao detectar rede';
            }
        } else {
            connectedNetworkInput.value = 'Nenhuma carteira conectada';
        }
        
    } catch (error) {
        console.error('❌ Erro ao detectar carteira e rede:', error);
        connectedWalletInput.value = 'Erro ao detectar';
        connectedNetworkInput.value = 'Erro ao detectar';
    }
}

// Código de inicializAção após carregar a página
document.addEventListener('DOMContentLoaded', async function () {
    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const address = urlParams.get('address');
    const symbol = urlParams.get('symbol');
    const decimals = urlParams.get('decimals') || '18';
    const name = urlParams.get('name') || symbol;
    const chainId = urlParams.get('chainId') || '1';

    // Validar parâmetros
    if (!address || !symbol) {
        console.error('❌ Parâmetros obrigatórios não encontrados');
        document.getElementById('addTokenContent').style.display = 'none';
        document.getElementById('errorContent').style.display = 'block';
        return;
    }

    // Carregar redes disponíveis (reutilizar função existente)
    const allNetworks = await fetchAllNetworks();
    const selectedNetwork = allNetworks.find(n => n.chainId.toString() === chainId.toString());
    
    // Detectar carteira e rede conectadas
    await detectWalletAndNetwork(chainId, allNetworks);
    
    // Monitorar mudanças de carteira/rede
    if (typeof window.ethereum !== 'undefined') {
        // Monitorar mudança de contas
        window.ethereum.on('accountsChanged', async () => {
            console.log('🔄 Conta alterada, atualizando detecção...');
            await detectWalletAndNetwork(chainId, allNetworks);
        });
        
        // Monitorar mudança de rede
        window.ethereum.on('chainChanged', async () => {
            console.log('🔄 Rede alterada, atualizando detecção...');
            await detectWalletAndNetwork(chainId, allNetworks);
        });
    }
    
    if (selectedNetwork) {
        document.getElementById('networkDisplay').value = `${selectedNetwork.name} (${selectedNetwork.chainId})`;
    } else {
        document.getElementById('networkDisplay').value = `Rede ${chainId}`;
    }

    // Preencher informações básicas do token
    document.getElementById('tokenAddress').value = address;
    document.getElementById('tokenSymbol').value = symbol;
    document.getElementById('tokenName').value = name;
    document.getElementById('tokenDecimals').value = decimals;

    // Carregar imagem do token (reutilizar lógica existente do link-index)
    if (selectedNetwork) {
        const networkSlug = selectedNetwork.slug || selectedNetwork.name.toLowerCase().replace(/\s+/g, '');
        const imageUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${networkSlug}/assets/${address}/logo.png`;
        
        try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            if (response.ok) {
                document.getElementById('tokenImage').src = imageUrl;
                document.getElementById('tokenImage').style.display = 'block';
                document.getElementById('defaultIcon').style.display = 'none';
                console.log('✅ Imagem do token carregada:', imageUrl);
            }
        } catch (error) {
            console.log('ℹ️ Imagem do token não disponível');
        }
    }

    // Configurar Botão do explorer (reutilizar lógica existente)
    const explorerBtn = document.getElementById('explorer-btn');
    if (explorerBtn && selectedNetwork && selectedNetwork.explorers) {
        explorerBtn.addEventListener('click', function() {
            const explorerUrl = `${selectedNetwork.explorers[0].url}/token/${address}`;
            window.open(explorerUrl, '_blank');
        });
    }

    // Esconder loading e mostrar conteúdo
    document.getElementById('tokenInfo').style.display = 'none';
    document.getElementById('addTokenContent').style.display = 'block';

    // Configurar wallets (usar função existente)
    setTimeout(() => {
        if (typeof setupWalletButtons === 'function') {
            console.log('✅ Configurando wallets com função existente');
            setupWalletButtons(address, symbol, decimals, name, chainId);
        } else {
            console.error('❌ função setupWalletButtons não encontrada');
        }
    }, 1000);
});

