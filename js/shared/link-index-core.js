// js/shared/link-index-core.js
// Centraliza toda a lógica de geração de link de token para todas as telas
import { fetchAllNetworks, showAutocomplete, copyToClipboard, shareLink, showCopyAndShareButtons } from './token-link-utils.js';
import { fetchTokenData } from './token-global.js';

export function setupLinkGenerator({
  networkSearchId = 'networkSearch',
  networkAutocompleteId = 'networkAutocomplete',
  rpcUrlId = 'rpcUrl',
  blockExplorerId = 'blockExplorer',
  nativeCurrencyId = 'nativeCurrency',
  nativeDecimalsId = 'nativeDecimals',
  tokenAddressId = 'tokenAddress',
  tokenNameId = 'tokenName',
  tokenSymbolId = 'tokenSymbol',
  tokenDecimalsId = 'tokenDecimals',
  tokenImageId = 'tokenImage',
  btnTokenSearchId = 'btnTokenSearch',
  btnGenerateLinkId = 'btnGenerateLink',
  btnCopyLinkId = 'btnCopyLink',
  btnShareLinkId = 'btnShareLink',
  btnClearId = 'btnClear',
  generatedLinkId = 'generatedLink',
  tokenLoadingId = 'tokenLoading',
  generatedLinkContainerId = 'generatedLinkContainer',
  onLinkGenerated = null
} = {}) {
  let allNetworks = [];
  let selectedNetwork = null;
  
  // Tornar selectedNetwork globalmente acessível
  window.selectedNetwork = null;

  function selectNetwork(network) {
    selectedNetwork = network;
    window.selectedNetwork = network; // Atualizar variável global também
    document.getElementById(rpcUrlId).value = network.rpc[0];
    document.getElementById(blockExplorerId).value = network.explorers ? network.explorers[0].url : '';
    
    // Verifica se os campos de moeda nativa existem antes de tentar definir valores
    const nativeCurrencyEl = document.getElementById(nativeCurrencyId);
    if (nativeCurrencyEl) {
      nativeCurrencyEl.value = network.nativeCurrency.symbol;
    }
    
    const nativeDecimalsEl = document.getElementById(nativeDecimalsId);
    if (nativeDecimalsEl) {
      nativeDecimalsEl.value = network.nativeCurrency.decimals;
    }
    
    document.getElementById(networkSearchId).value = `${network.name} (${network.chainId})`;
    document.getElementById(networkAutocompleteId).style.display = 'none';
  }

  async function fetchTokenDataAndFill() {
    const tokenAddress = document.getElementById(tokenAddressId).value.trim();
    if (!tokenAddress) {
      alert('⚠️ Informe o endereço do token.');
      return;
    }
    if (!selectedNetwork || !selectedNetwork.rpc || selectedNetwork.rpc.length === 0) {
      alert('⚠️ Nenhuma rede selecionada.');
      return;
    }
    document.getElementById(tokenLoadingId).style.display = 'block';
    let provider = new ethers.providers.JsonRpcProvider(selectedNetwork.rpc[0]);
    try {
      const data = await fetchTokenData(tokenAddress, provider);
      if (document.getElementById(tokenNameId)) document.getElementById(tokenNameId).value = data.name;
      document.getElementById(tokenSymbolId).value = data.symbol;
      document.getElementById(tokenDecimalsId).value = data.decimals;
      // Imagem TrustWallet
      let networkSlug = selectedNetwork.slug || selectedNetwork.name.toLowerCase().replace(/\s+/g, '');
      const imageUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${networkSlug}/assets/${tokenAddress}/logo.png`;
      try {
        const resp = await fetch(imageUrl, { method: 'HEAD' });
        document.getElementById(tokenImageId).value = resp.ok ? imageUrl : '';
      } catch {
        document.getElementById(tokenImageId).value = '';
      }
    } catch (err) {
      alert('❌ Erro ao buscar dados do token. Verifique se o contrato está na rede selecionada.');
    }
    document.getElementById(tokenLoadingId).style.display = 'none';
  }

  function generateLink() {
    if (!selectedNetwork || !selectedNetwork.chainId || !selectedNetwork.name) {
      alert('Selecione uma rede válida antes de gerar o link!');
      return;
    }
    
    // Validar campos obrigatórios
    const tokenAddress = document.getElementById(tokenAddressId).value.trim();
    const tokenSymbol = document.getElementById(tokenSymbolId).value.trim();
    const tokenDecimals = document.getElementById(tokenDecimalsId).value.trim();
    
    if (!tokenAddress) {
      alert('⚠️ Informe o endereço do token.');
      return;
    }
    
    if (!tokenSymbol) {
      alert('⚠️ Informe o símbolo do token.');
      return;
    }
    
    if (!tokenDecimals) {
      alert('⚠️ Informe os decimais do token.');
      return;
    }
    
    const data = {
      type: 'ERC20',
      options: {
        address: tokenAddress,
        symbol: tokenSymbol,
        decimals: parseInt(tokenDecimals),
        image: document.getElementById(tokenImageId).value || ''
      }
    };
    
    // Gerar links funcionais para diferentes wallets
    const chainIdHex = `0x${selectedNetwork.chainId.toString(16)}`;
    const tokenData = {
      address: tokenAddress,
      symbol: tokenSymbol,
      decimals: parseInt(tokenDecimals),
      image: document.getElementById(tokenImageId).value || ''
    };
    
    // Formato 1: MetaMask - Método wallet_watchAsset
    const metamaskData = {
      type: 'ERC20',
      options: {
        address: tokenAddress,
        symbol: tokenSymbol,
        decimals: parseInt(tokenDecimals),
        image: tokenData.image || ''
      }
    };
    
    // Link JavaScript para MetaMask (esse é o que realmente funciona)
    const metamaskLink = `javascript:if(typeof ethereum !== 'undefined'){ethereum.request({method: 'wallet_watchAsset', params: {type: 'ERC20', options: {address: '${tokenAddress}', symbol: '${tokenSymbol}', decimals: ${parseInt(tokenDecimals)}, image: '${tokenData.image || ''}'}}}).catch(console.error);}else{alert('MetaMask não detectado!');}`;
    
    // Formato 2: Deep Links para mobile wallets - versões corrigidas
    
    // MetaMask Mobile - Deep link direto com network switch
    const metamaskMobileLink = `https://metamask.app.link/send/?address=${tokenAddress}&uint256=0&chainId=${selectedNetwork.chainId}`;
    
    // TrustWallet - Deep link nativo correto
    const trustWalletNativeLink = `trust://add_asset?asset=c${selectedNetwork.chainId}_t${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}`;
    
    // Link universal para múltiplas wallets (WalletConnect padrão)
    const walletConnectLink = `wc:add-token?address=${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}&chainId=${selectedNetwork.chainId}&name=${encodeURIComponent(tokenName)}`;
    
    // Link web universal que funciona em várias wallets
    const webUniversalLink = `https://app.uniswap.org/tokens/ethereum/${tokenAddress}?chain=${selectedNetwork.name.toLowerCase().replace(/\s+/g, '')}`;
    
    // Link direto do CoinGecko/DeFiPulse para adicionar token
    const defiLink = `https://www.coingecko.com/en/coins/ethereum/contract/${tokenAddress}`;
    
    // Formato 3: Web3 Modal format 
    const web3Link = `ethereum:${tokenAddress}@${selectedNetwork.chainId}/transfer`;
    
    // Formato 4: Link direto no explorador de blocos com instrução
    const explorerLink = selectedNetwork.explorers ? `${selectedNetwork.explorers[0].url}/token/${tokenAddress}` : `https://etherscan.io/token/${tokenAddress}`;
    
    // Formato 5: Código JavaScript para copiar e executar
    const jsCode = `
// Cole este código no console do navegador (F12 > Console)
if (typeof ethereum !== 'undefined') {
  ethereum.request({
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20',
      options: {
        address: '${tokenAddress}',
        symbol: '${tokenSymbol}',
        decimals: ${parseInt(tokenDecimals)},
        image: '${tokenData.image || ''}'
      }
    }
  }).then((success) => {
    if (success) {
      console.log('Token adicionado com sucesso!');
    } else {
      console.log('Token não foi adicionado.');
    }
  }).catch((error) => {
    console.error('Erro ao adicionar token:', error);
  });
} else {
  alert('MetaMask não está instalado!');
}
    `.trim();
    
    // Link principal (código JS)
    const mainLink = jsCode;
    
    // Exibir o link principal
    const linkField = document.getElementById(generatedLinkId);
    linkField.value = mainLink;
    
    // Criar seção com métodos funcionais
    const linkContainer = document.getElementById(generatedLinkContainerId);
    if (linkContainer) {
      linkContainer.innerHTML = `
        <div class="mb-3">
          <label class="form-label">Métodos para Adicionar o Token:</label>
          
          <div class="mb-3">
            <label class="form-label text-primary">
              <i class="bi bi-1-circle"></i> <strong>Método 1: Botão Direto (Recomendado)</strong>
            </label>
            <button class="btn btn-primary w-100 mb-2" onclick="addTokenToMetaMask('${tokenAddress}', '${tokenSymbol}', ${parseInt(tokenDecimals)}, '${tokenData.image || ''}')">
              <i class="bi bi-fox"></i> Adicionar Token ao MetaMask 
              <small class="d-block">⚡ Adiciona automaticamente a rede ${selectedNetwork.name} se necessário</small>
            </button>
          </div>
          
          <div class="mb-3">
            <label class="form-label text-success">
              <i class="bi bi-2-circle"></i> <strong>Método 2: Código JavaScript (Console)</strong>
            </label>
            <div class="alert alert-info">
              <small>1. Abra o console do navegador (F12 > Console)<br>
              2. Cole o código abaixo e pressione Enter</small>
            </div>
            <div class="input-group mb-2">
              <textarea class="form-control" readonly rows="3" id="jsCodeArea">${jsCode}</textarea>
              <button class="btn btn-outline-secondary" onclick="copyToClipboard('jsCodeArea')" type="button">
                <i class="bi bi-clipboard"></i>
              </button>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label text-info">
              <i class="bi bi-3-circle"></i> <strong>Método 3: Deep Link Mobile</strong>
            </label>
            
            <!-- Botão de tentativa automática -->
            <div class="mb-3">
              <button class="btn btn-primary w-100" onclick="tryAddTokenMobile('${tokenAddress}', '${tokenSymbol}', '${tokenDecimals}', '${tokenName}', ${selectedNetwork.chainId})" type="button">
                <i class="bi bi-phone"></i> Tentar Adicionar no Mobile (Auto)
              </button>
              <small class="text-muted">Tenta vários métodos automaticamente até encontrar um que funcione</small>
            </div>
            
            <!-- QR Code para escanear do celular -->
            <div class="mb-3">
              <button class="btn btn-success w-100" onclick="generateTokenQR('${tokenAddress}', '${tokenSymbol}', '${tokenDecimals}', '${tokenName}', ${selectedNetwork.chainId})" type="button">
                <i class="bi bi-qr-code"></i> Gerar QR Code para Escanear
              </button>
              <div id="qrCodeContainer" class="text-center mt-2" style="display:none;">
                <div id="qrCodeDiv"></div>
                <small class="text-muted">Escaneie com a câmera da sua carteira móvel</small>
              </div>
            </div>
            
            <!-- Links manuais para fallback -->
            <div class="mb-2">
              <small class="text-muted">MetaMask Mobile (Link Direto):</small>
              <div class="input-group mb-2">
                <input class="form-control" readonly value="${metamaskMobileLink}" id="metamaskMobileLink" />
                <button class="btn btn-outline-secondary" onclick="copyToClipboard('metamaskMobileLink')" type="button">
                  <i class="bi bi-clipboard"></i>
                </button>
                <button class="btn btn-outline-primary" onclick="window.open('${metamaskMobileLink}', '_blank')" type="button">
                  <i class="bi bi-box-arrow-up-right"></i>
                </button>
              </div>
            </div>
            
            <div class="mb-2">
              <small class="text-muted">TrustWallet Nativo:</small>
              <div class="input-group mb-2">
                <input class="form-control" readonly value="${trustWalletNativeLink}" id="trustWalletNativeLink" />
                <button class="btn btn-outline-secondary" onclick="copyToClipboard('trustWalletNativeLink')" type="button">
                  <i class="bi bi-clipboard"></i>
                </button>
                <button class="btn btn-outline-primary" onclick="window.open('${trustWalletNativeLink}', '_blank')" type="button">
                  <i class="bi bi-box-arrow-up-right"></i>
                </button>
              </div>
            </div>
            
            <div class="mb-2">
              <small class="text-muted">Link Web Universal:</small>
              <div class="input-group mb-2">
                <input class="form-control" readonly value="${webUniversalLink}" id="webUniversalLink" />
                <button class="btn btn-outline-secondary" onclick="copyToClipboard('webUniversalLink')" type="button">
                  <i class="bi bi-clipboard"></i>
                </button>
                <button class="btn btn-outline-primary" onclick="window.open('${webUniversalLink}', '_blank')" type="button">
                  <i class="bi bi-box-arrow-up-right"></i>
                </button>
              </div>
            </div>
            
          </div>
          
          <div class="mb-3">
            <label class="form-label text-warning">
              <i class="bi bi-4-circle"></i> <strong>Método 4: Manual (Explorador)</strong>
            </label>
            <div class="input-group mb-2">
              <input class="form-control" readonly value="${explorerLink}" id="explorerLink" />
              <button class="btn btn-outline-secondary" onclick="copyToClipboard('explorerLink')" type="button">
                <i class="bi bi-clipboard"></i>
              </button>
              <button class="btn btn-outline-warning" onclick="window.open('${explorerLink}', '_blank')" type="button">
                <i class="bi bi-box-arrow-up-right"></i>
              </button>
            </div>
          </div>
          
          <div class="alert alert-success mt-3">
            <i class="bi bi-info-circle"></i>
            <strong>Como usar:</strong>
            <ul class="mb-0 mt-2">
              <li><strong>Método 1:</strong> Clique no botão azul - adiciona automaticamente a rede e o token</li>
              <li><strong>Método 2:</strong> Para desenvolvedores - cole no console</li>
              <li><strong>Método 3:</strong> Para dispositivos móveis</li>
              <li><strong>Método 4:</strong> Copie o endereço e adicione manualmente</li>
            </ul>
            
            <div class="alert alert-info mt-2 mb-0">
              <i class="bi bi-lightbulb"></i>
              <strong>Novo:</strong> O botão azul agora detecta automaticamente se você está na rede correta e:
              <ul class="mb-0 mt-1">
                <li>✅ Muda para a rede correta se você já tem ela</li>
                <li>✅ Adiciona a rede se você não tem ela</li>
                <li>✅ Adiciona o token depois que a rede está configurada</li>
              </ul>
            </div>
          </div>
          
          <div class="alert alert-warning mt-2">
            <i class="bi bi-exclamation-triangle"></i>
            <strong>Informações do Token:</strong><br>
            <small>
              <strong>Endereço:</strong> ${tokenAddress}<br>
              <strong>Símbolo:</strong> ${tokenSymbol}<br>
              <strong>Decimais:</strong> ${parseInt(tokenDecimals)}<br>
              <strong>Rede:</strong> ${selectedNetwork.name} (${selectedNetwork.chainId})
            </small>
          </div>
        </div>
      `;
      linkContainer.style.display = 'block';
    }
    showCopyAndShareButtons(btnCopyLinkId, btnShareLinkId, true);
    if (onLinkGenerated) onLinkGenerated(link, {
      tokenAddress: tokenAddress,
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
      network: selectedNetwork
    });
  }

  function clearForm() {
    document.getElementById(networkSearchId).value = '';
    document.getElementById(rpcUrlId).value = '';
    document.getElementById(blockExplorerId).value = '';
    
    // Verifica se os campos de moeda nativa existem antes de limpar
    const nativeCurrencyEl = document.getElementById(nativeCurrencyId);
    if (nativeCurrencyEl) {
      nativeCurrencyEl.value = '';
    }
    
    const nativeDecimalsEl = document.getElementById(nativeDecimalsId);
    if (nativeDecimalsEl) {
      nativeDecimalsEl.value = '';
    }
    
    document.getElementById(tokenAddressId).value = '';
    document.getElementById(tokenSymbolId).value = '';
    document.getElementById(tokenDecimalsId).value = '';
    document.getElementById(tokenImageId).value = '';
    if (document.getElementById(tokenNameId)) document.getElementById(tokenNameId).value = '';
    document.getElementById(generatedLinkId).value = '';
    showCopyAndShareButtons(btnCopyLinkId, btnShareLinkId, false);
    document.getElementById(networkAutocompleteId).style.display = 'none';
    document.getElementById(tokenLoadingId).style.display = 'none';
    if (generatedLinkContainerId && document.getElementById(generatedLinkContainerId)) {
      document.getElementById(generatedLinkContainerId).style.display = 'none';
    }
    selectedNetwork = null;
    window.selectedNetwork = null; // Limpar variável global também
  }

  document.addEventListener('DOMContentLoaded', async () => {
    allNetworks = await fetchAllNetworks();
    document.getElementById(networkSearchId).addEventListener('input', () =>
      showAutocomplete(networkSearchId, networkAutocompleteId, allNetworks, selectNetwork)
    );
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#' + networkAutocompleteId) && e.target.id !== networkSearchId) {
        document.getElementById(networkAutocompleteId).style.display = 'none';
      }
    });
    document.getElementById(btnTokenSearchId)?.addEventListener('click', fetchTokenDataAndFill);
    document.getElementById(btnGenerateLinkId)?.addEventListener('click', generateLink);
    document.getElementById(btnCopyLinkId)?.addEventListener('click', () => copyToClipboard(generatedLinkId));
    document.getElementById(btnShareLinkId)?.addEventListener('click', () => shareLink(generatedLinkId));
    document.getElementById(btnClearId)?.addEventListener('click', clearForm);
    document.querySelectorAll('input, textarea, select').forEach(function(el) {
      if (el.value) {
        el.classList.add('filled');
      }
    });
    showCopyAndShareButtons(btnCopyLinkId, btnShareLinkId, false);
    const linkField = document.getElementById(generatedLinkId);
    linkField.addEventListener('input', function() {
      if (!linkField.value) {
        showCopyAndShareButtons(btnCopyLinkId, btnShareLinkId, false);
      }
    });
  });
}

// Função global para copiar links individuais
window.copyToClipboard = function(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.select();
    el.setSelectionRange(0, 99999); // Para dispositivos móveis
    navigator.clipboard.writeText(el.value).then(() => {
      // Feedback visual
      const button = el.nextElementSibling;
      if (button) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check"></i>';
        button.classList.add('btn-success');
        button.classList.remove('btn-outline-secondary');
        
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.classList.remove('btn-success');
          button.classList.add('btn-outline-secondary');
        }, 1500);
      }
    }).catch(() => {
      // Fallback para navegadores mais antigos
      try {
        document.execCommand('copy');
      } catch (err) {
        alert('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
      }
    });
  }
};

// Função global para adicionar token diretamente ao MetaMask
window.addTokenToMetaMask = async function(address, symbol, decimals, image = '') {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Verificar se temos uma rede selecionada
      if (!window.selectedNetwork) {
        alert('❌ Por favor, selecione uma rede primeiro.');
        return;
      }
      
      // Primeiro: verificar/adicionar a rede se necessário
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const requiredChainId = `0x${window.selectedNetwork.chainId.toString(16)}`;
      
      if (currentChainId !== requiredChainId) {
        console.log(`Rede atual: ${currentChainId}, Rede necessária: ${requiredChainId}`);
        
        try {
          // Tentar mudar para a rede necessária
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: requiredChainId }],
          });
          
          console.log('✅ Rede alterada com sucesso');
        } catch (switchError) {
          // Se a rede não existe, adicionar ela
          if (switchError.code === 4902) {
            console.log('🔗 Rede não encontrada, adicionando...');
            
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: requiredChainId,
                  chainName: window.selectedNetwork.name,
                  nativeCurrency: {
                    name: window.selectedNetwork.nativeCurrency.symbol,
                    symbol: window.selectedNetwork.nativeCurrency.symbol,
                    decimals: window.selectedNetwork.nativeCurrency.decimals
                  },
                  rpcUrls: window.selectedNetwork.rpc,
                  blockExplorerUrls: window.selectedNetwork.explorers ? [window.selectedNetwork.explorers[0].url] : null
                }]
              });
              
              console.log('✅ Rede adicionada e selecionada com sucesso');
            } catch (addError) {
              console.error('❌ Erro ao adicionar rede:', addError);
              alert(`❌ Erro ao adicionar rede ${window.selectedNetwork.name}: ${addError.message}`);
              return;
            }
          } else {
            console.error('❌ Erro ao trocar rede:', switchError);
            alert(`❌ Erro ao trocar para rede ${window.selectedNetwork.name}: ${switchError.message}`);
            return;
          }
        }
      }
      
      // Aguardar um pouco para a rede se estabilizar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Segundo: adicionar o token
      console.log('🪙 Adicionando token...');
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: address,
            symbol: symbol,
            decimals: decimals,
            image: image
          }
        }
      });

      if (wasAdded) {
        alert(`✅ Token ${symbol} adicionado ao MetaMask com sucesso na rede ${window.selectedNetwork.name}!`);
      } else {
        alert('❌ Token não foi adicionado. Verifique se você confirmou a ação no MetaMask.');
      }
    } catch (error) {
      console.error('Erro ao adicionar token:', error);
      if (error.code === 4001) {
        alert('❌ Usuário rejeitou a solicitação.');
      } else {
        alert('❌ Erro ao adicionar token: ' + error.message);
      }
    }
  } else {
    alert('❌ MetaMask não foi detectado! Instale o MetaMask ou use outro método.');
    // Fallback: mostrar instruções manuais
    const networkInfo = window.selectedNetwork || { name: 'Desconhecida', chainId: '?', rpc: ['?'] };
    const tokenInfo = `
Adicione manualmente:
Rede: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})
RPC: ${networkInfo.rpc[0]}
Endereço do Token: ${address}
Símbolo: ${symbol}
Decimais: ${decimals}
${image ? 'Imagem: ' + image : ''}
    `;
    if (confirm('MetaMask não detectado. Copiar informações completas?')) {
      navigator.clipboard.writeText(tokenInfo).then(() => {
        alert('✅ Informações copiadas! Cole no seu aplicativo de carteira.');
      }).catch(() => {
        alert(tokenInfo);
      });
    }
  }
};

// Função para tentar múltiplos métodos de adição de token no mobile
window.tryAddTokenMobile = async function(tokenAddress, tokenSymbol, tokenDecimals, tokenName, chainId) {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (!isMobile) {
    alert('⚠️ Esta função foi otimizada para dispositivos móveis. Use o Método 1 (MetaMask Desktop) em computadores.');
    return;
  }
  
  // Lista de tentativas em ordem de prioridade
  const attempts = [
    {
      name: 'TrustWallet Nativo',
      url: `trust://add_asset?asset=c${chainId}_t${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}`
    },
    {
      name: 'MetaMask Mobile Direto',
      url: `https://metamask.app.link/send/?address=${tokenAddress}&uint256=0&chainId=${chainId}`
    },
    {
      name: 'MetaMask com Network',
      url: `metamask://addToken?address=${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}`
    },
    {
      name: 'SafePal Wallet',
      url: `safepal://add_asset?contract=${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}&chainId=${chainId}`
    },
    {
      name: 'TokenPocket',
      url: `tokenpocket://add_asset?contract=${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}&chainId=${chainId}`
    }
  ];
  
  let currentAttempt = 0;
  
  function tryNext() {
    if (currentAttempt >= attempts.length) {
      // Todas as tentativas falharam, mostrar opções manuais
      showManualOptions();
      return;
    }
    
    const attempt = attempts[currentAttempt];
    
    // Mostrar qual método está sendo tentado
    const resultDiv = document.createElement('div');
    resultDiv.className = 'alert alert-info';
    resultDiv.innerHTML = `
      🔄 Tentando: ${attempt.name}<br>
      <small>Se não abrir nenhum app em 3 segundos, tentaremos o próximo método...</small>
    `;
    document.body.appendChild(resultDiv);
    
    // Tentar abrir o deep link
    window.location.href = attempt.url;
    
    // Aguardar 3 segundos e tentar próximo se não funcionou
    setTimeout(() => {
      resultDiv.remove();
      currentAttempt++;
      tryNext();
    }, 3000);
  }
  
  function showManualOptions() {
    const tokenInfo = `
INFORMAÇÕES DO TOKEN
====================
Endereço: ${tokenAddress}
Símbolo: ${tokenSymbol}
Nome: ${tokenName}
Decimais: ${tokenDecimals}
Chain ID: ${chainId}

INSTRUÇÕES MANUAIS:
1. Abra sua carteira manualmente
2. Procure por "Adicionar Token" ou "Import Token"
3. Cole o endereço: ${tokenAddress}
4. Preencha os outros campos se necessário
`;
    
    if (confirm('❌ Nenhum método automático funcionou. Deseja copiar as informações para adicionar manualmente?')) {
      navigator.clipboard.writeText(tokenInfo).then(() => {
        alert('✅ Informações copiadas! Cole na sua carteira e adicione manualmente.');
      }).catch(() => {
        alert(tokenInfo);
      });
    }
  }
  
  // Iniciar tentativas
  alert('🚀 Iniciando tentativas automáticas...\n\nVários apps de carteira podem abrir. Escolha o que você deseja usar!');
  tryNext();
};

// Função para gerar QR Code com informações do token
window.generateTokenQR = function(tokenAddress, tokenSymbol, tokenDecimals, tokenName, chainId) {
  const container = document.getElementById('qrCodeContainer');
  const qrDiv = document.getElementById('qrCodeDiv');
  
  // Limpar QR Code anterior
  qrDiv.innerHTML = '';
  
  // Dados do token em formato JSON para QR
  const tokenData = {
    address: tokenAddress,
    symbol: tokenSymbol,
    name: tokenName,
    decimals: parseInt(tokenDecimals),
    chainId: chainId,
    type: 'ERC20'
  };
  
  // Tentar usar biblioteca QRCode se disponível, senão usar API online
  const qrText = JSON.stringify(tokenData);
  
  // Usar API do Google Charts para gerar QR (funciona offline depois de carregar)
  const qrSize = 200;
  const qrImageUrl = `https://chart.googleapis.com/chart?chs=${qrSize}x${qrSize}&cht=qr&chl=${encodeURIComponent(qrText)}`;
  
  qrDiv.innerHTML = `
    <img src="${qrImageUrl}" alt="QR Code do Token" style="max-width: 100%; height: auto; border: 2px solid #dee2e6; border-radius: 8px;">
    <div class="mt-2">
      <small class="text-muted">
        <strong>Dados do QR:</strong><br>
        ${tokenSymbol} (${tokenName})<br>
        Chain ID: ${chainId}<br>
        <button class="btn btn-sm btn-outline-secondary mt-1" onclick="copyToClipboard('qrData')" type="button">
          Copiar JSON
        </button>
        <textarea id="qrData" style="display:none;">${qrText}</textarea>
      </small>
    </div>
  `;
  
  // Mostrar container
  container.style.display = 'block';
  
  // Rolar até o QR Code
  container.scrollIntoView({ behavior: 'smooth' });
};
