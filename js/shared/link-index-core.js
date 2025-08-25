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
window.generateTokenQR = async function(tokenAddress, tokenSymbol, tokenDecimals, tokenName, chainId) {
  const container = document.getElementById('qrCodeContainer');
  const qrDiv = document.getElementById('qrCodeDiv');
  
  if (!container || !qrDiv) {
    alert('❌ Elementos do QR Code não encontrados no HTML!');
    return;
  }
  
  // Limpar QR Code anterior
  qrDiv.innerHTML = '<div class="text-center"><i class="bi bi-hourglass-split"></i> Gerando QR Code...</div>';
  
  // Dados do token em formato estruturado para wallets
  const tokenData = {
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20',
      options: {
        address: tokenAddress,
        symbol: tokenSymbol,
        decimals: parseInt(tokenDecimals),
        image: document.getElementById('tokenImage')?.value || ''
      }
    },
    chainId: chainId,
    chainName: window.selectedNetwork?.name || 'Unknown',
    rpcUrls: window.selectedNetwork?.rpc || [],
    blockExplorerUrls: window.selectedNetwork?.explorers?.map(e => e.url) || []
  };
  
  const qrText = JSON.stringify(tokenData);
  
  console.log('� Dados do QR:', qrText);
  
  // Mostrar container
  container.style.display = 'block';
  
  // Usar sempre API externa (mais confiável que bibliotecas externas)
  console.log('🌐 Usando API externa para QR Code personalizado XCafe');
  
  // Converter para formato EIP-681 se necessário
  let finalQRText = qrText;
  
  // Se qrText parece ser JSON, extrair informações e criar formato EIP-681
  if (qrText.includes('wallet_watchAsset') || qrText.includes('"method"')) {
    finalQRText = `ethereum:${tokenAddress}@${chainId}/transfer?symbol=${tokenSymbol}&decimals=${tokenDecimals}&name=${encodeURIComponent(tokenName)}`;
    console.log('🔄 Usando formato EIP-681 para compatibilidade:', finalQRText);
  }
  
  generateFallbackQR(qrDiv, finalQRText, tokenSymbol, tokenName, chainId);
  
  // Rolar até o QR Code
  setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth' });
  }, 500);
};

// Função para gerar QR Code usando biblioteca (canvas)
async function generateCanvasQR(qrDiv, qrText, tokenSymbol, tokenName, chainId) {
  return new Promise((resolve, reject) => {
    try {
      // Limpar conteúdo
      qrDiv.innerHTML = '';
      
      // Criar canvas
      const canvas = document.createElement('canvas');
      qrDiv.appendChild(canvas);
      
      QRCode.toCanvas(canvas, qrText, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      }, function (error) {
        if (error) {
          console.error('❌ Erro ao gerar QR Code:', error);
          generateFallbackQR(qrDiv, qrText, tokenSymbol, tokenName, chainId);
          reject(error);
        } else {
          console.log('✅ QR Code gerado com sucesso via canvas!');
          canvas.style.border = '2px solid #28a745';
          canvas.style.borderRadius = '8px';
          canvas.style.maxWidth = '100%';
          addQRInfo(qrDiv, qrText, tokenSymbol, tokenName, chainId);
          resolve();
        }
      });
      
    } catch (error) {
      console.error('❌ Erro na biblioteca QRCode:', error);
      generateFallbackQR(qrDiv, qrText, tokenSymbol, tokenName, chainId);
      reject(error);
    }
  });
}

// Função para gerar QR Code usando API externa (fallback)
// Função para gerar QR Code usando API externa (método confiável)
function generateFallbackQR(qrDiv, qrText, tokenSymbol, tokenName, chainId) {
  console.log('🌐 Gerando QR Code personalizado via API externa');
  
  const qrSize = 350;
  
  // Criar QR Code customizado com logo XCafe
  generateCustomQRWithLogo(qrDiv, qrText, qrSize, tokenSymbol, tokenName, chainId);
}

// Função para gerar QR Code customizado com logo XCafe
async function generateCustomQRWithLogo(qrDiv, qrText, size, tokenSymbol, tokenName, chainId) {
  
  // Corrigir formato do QR Code para ser reconhecido pelas wallets
  // Usar formato EIP-681 ao invés de JSON complexo
  let correctedQRText = qrText;
  
  // Se qrText for JSON, converter para formato EIP-681
  if (qrText.startsWith('{')) {
    try {
      const tokenData = JSON.parse(qrText);
      const address = tokenData.params?.options?.address || '';
      const symbol = tokenData.params?.options?.symbol || tokenSymbol;
      const decimals = tokenData.params?.options?.decimals || 18;
      const name = tokenName || symbol;
      
      correctedQRText = `ethereum:${address}@${chainId}/transfer?symbol=${symbol}&decimals=${decimals}&name=${encodeURIComponent(name)}`;
      console.log('🔄 Convertido de JSON para EIP-681:', correctedQRText);
    } catch (e) {
      console.warn('⚠️ Erro ao converter JSON, usando formato original');
    }
  }
  
  // APIs para QR Code base (sem logo ainda)
  const apiUrls = [
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(correctedQRText)}&format=png&margin=5&bgcolor=FFFFFF&color=000000&ecc=M`,
    `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(correctedQRText)}&chld=M|2`,
    `https://quickchart.io/qr?text=${encodeURIComponent(correctedQRText)}&size=${size}&margin=5&format=png`
  ];
  
  let currentAPI = 0;
  
  function tryNextAPI() {
    if (currentAPI >= apiUrls.length) {
      // Se todas as APIs falharam, mostrar dados em texto
      showTextFallback(qrDiv, correctedQRText, tokenSymbol, tokenName, chainId);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = apiUrls[currentAPI];
    
    img.onload = function() {
      console.log(`✅ QR Code base carregado via API ${currentAPI + 1}`);
      
      // Criar canvas para adicionar logo
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = size;
      canvas.height = size;
      
      // Desenhar QR Code de base
      ctx.drawImage(img, 0, 0, size, size);
      
      // Carregar e adicionar logo XCafe
      addLogoToQR(canvas, ctx, size, qrDiv, correctedQRText, tokenSymbol, tokenName, chainId);
    };
    
    img.onerror = function() {
      console.warn(`❌ API ${currentAPI + 1} falhou, tentando próxima...`);
      currentAPI++;
      tryNextAPI();
    };
  }
  
  tryNextAPI();
}

// Função para adicionar logo XCafe ao centro do QR Code
function addLogoToQR(canvas, ctx, qrSize, qrDiv, qrText, tokenSymbol, tokenName, chainId) {
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  
  // Tentar carregar o logo do XCafe
  logo.src = './imgs/xcafe-192x192.png';
  
  logo.onload = function() {
    console.log('✅ Logo XCafe carregado com sucesso');
    
    // Calcular tamanho e posição do logo (cerca de 20% do QR Code)
    const logoSize = Math.round(qrSize * 0.18);
    const logoX = (qrSize - logoSize) / 2;
    const logoY = (qrSize - logoSize) / 2;
    
    // Criar fundo branco circular para o logo
    const bgSize = logoSize + 16;
    const bgX = (qrSize - bgSize) / 2;
    const bgY = (qrSize - bgSize) / 2;
    
    // Desenhar fundo circular branco com sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(qrSize/2, qrSize/2, bgSize/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Remover sombra
    ctx.shadowColor = 'transparent';
    
    // Desenhar borda verde ao redor do logo
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(qrSize/2, qrSize/2, bgSize/2 - 2, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Desenhar logo XCafe no centro
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    
    console.log('🎨 Logo XCafe adicionado ao QR Code');
    
    // Finalizar QR Code customizado
    finalizeCustomQR(canvas, qrDiv, qrText, tokenSymbol, tokenName, chainId);
  };
  
  logo.onerror = function() {
    console.warn('⚠️ Não foi possível carregar logo XCafe, tentando caminho alternativo...');
    
    // Tentar caminho alternativo
    logo.src = 'imgs/xcafe.png';
    
    logo.onload = function() {
      console.log('✅ Logo XCafe carregado (caminho alternativo)');
      
      // Mesmo processo de adicionar logo
      const logoSize = Math.round(qrSize * 0.18);
      const logoX = (qrSize - logoSize) / 2;
      const logoY = (qrSize - logoSize) / 2;
      const bgSize = logoSize + 16;
      
      // Fundo circular branco
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(qrSize/2, qrSize/2, bgSize/2, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      
      // Borda verde
      ctx.strokeStyle = '#28a745';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(qrSize/2, qrSize/2, bgSize/2 - 2, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Logo
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      
      finalizeCustomQR(canvas, qrDiv, qrText, tokenSymbol, tokenName, chainId);
    };
    
    logo.onerror = function() {
      console.error('❌ Não foi possível carregar nenhuma versão do logo XCafe');
      // Usar QR Code sem logo
      finalizeCustomQR(canvas, qrDiv, qrText, tokenSymbol, tokenName, chainId);
    };
  };
}

// Função para finalizar e exibir o QR Code customizado
function finalizeCustomQR(canvas, qrDiv, qrText, tokenSymbol, tokenName, chainId) {
  qrDiv.innerHTML = '';
  
  // Container principal
  const wrapper = document.createElement('div');
  wrapper.className = 'text-center';
  
  // Adicionar canvas estilizado
  canvas.style.cssText = 'max-width: 100%; height: auto; border: 3px solid #28a745; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);';
  wrapper.appendChild(canvas);
  
  // Adicionar marca XCafe
  const brandDiv = document.createElement('div');
  brandDiv.className = 'mt-2 mb-2';
  brandDiv.innerHTML = `
    <small class="text-success fw-bold">
      <img src="imgs/xcafe-32x32.png" alt="XCafe" style="width: 16px; height: 16px; margin-right: 5px;">
      Gerado por XCafe.app
    </small>
  `;
  wrapper.appendChild(brandDiv);
  
  qrDiv.appendChild(wrapper);
  
  // Adicionar informações e botões
  addQRInfo(qrDiv, qrText, tokenSymbol, tokenName, chainId);
  
  console.log('🎨 QR Code personalizado com logo XCafe criado com sucesso!');
}

// Função fallback para mostrar dados em texto
function showTextFallback(qrDiv, qrText, tokenSymbol, tokenName, chainId) {
  qrDiv.innerHTML = `
    <div class="alert alert-warning text-center">
      <div class="mb-2">
        <img src="imgs/xcafe-32x32.png" alt="XCafe" style="width: 24px; height: 24px;">
        <strong class="ms-2">XCafe.app</strong>
      </div>
      <i class="bi bi-exclamation-triangle"></i>
      <h6>QR Code não pôde ser gerado</h6>
      <p class="small">APIs externas indisponíveis. Use os dados abaixo:</p>
      <textarea class="form-control font-monospace small" rows="6" readonly style="font-size: 11px;">${qrText}</textarea>
      <div class="mt-3">
        <button class="btn btn-primary btn-sm" onclick="copyToClipboard('qrFallbackTextarea')">
          <i class="bi bi-clipboard"></i> Copiar Dados JSON
        </button>
        <small class="text-muted d-block mt-2">
          Cole estes dados em uma wallet que suporte importação via JSON
        </small>
      </div>
      <textarea id="qrFallbackTextarea" style="display:none;">${qrText}</textarea>
    </div>
  `;
}

// Função para adicionar informações e botões ao QR Code
function addQRInfo(qrDiv, qrText, tokenSymbol, tokenName, chainId) {
  const infoDiv = document.createElement('div');
  infoDiv.className = 'mt-3';
  infoDiv.innerHTML = `
    <div class="text-center">
      <small class="text-muted">
        <strong>📱 ${tokenSymbol} (${tokenName})</strong><br>
        <strong>🔗 Chain ID:</strong> ${chainId}<br>
        <div class="mt-2">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="copyToClipboard('qrDataTextarea')" type="button">
            <i class="bi bi-clipboard"></i> Copiar JSON
          </button>
          <button class="btn btn-sm btn-outline-success" onclick="downloadQRCode('${tokenSymbol}_token_qr')" type="button">
            <i class="bi bi-download"></i> Baixar PNG
          </button>
        </div>
      </small>
      <textarea id="qrDataTextarea" style="display:none;">${qrText}</textarea>
    </div>
  `;
  
  qrDiv.appendChild(infoDiv);
}

// Função para baixar o QR Code como imagem
window.downloadQRCode = function(filename) {
  const canvas = document.querySelector('#qrCodeDiv canvas');
  const img = document.querySelector('#qrCodeDiv img');
  
  if (canvas) {
    // Se foi gerado via canvas personalizado (com logo XCafe)
    console.log('📥 Baixando QR Code personalizado XCafe');
    const link = document.createElement('a');
    link.download = filename + '_xcafe.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mostrar feedback visual
    const button = document.querySelector('button[onclick*="downloadQRCode"]');
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="bi bi-check-circle"></i> Baixado!';
      button.className = 'btn btn-sm btn-success';
      setTimeout(() => {
        button.innerHTML = originalText;
        button.className = 'btn btn-sm btn-outline-success';
      }, 2000);
    }
    
  } else if (img) {
    // Se foi gerado via API externa (imagem simples)
    console.log('📥 Baixando QR Code da imagem');
    
    // Criar canvas temporário para adicionar marca XCafe
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    tempCanvas.width = img.naturalWidth || 300;
    tempCanvas.height = (img.naturalHeight || 300) + 40; // Espaço extra para marca
    
    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Desenhar QR Code
    ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.width);
    
    // Adicionar texto "Gerado por XCafe.app"
    ctx.fillStyle = '#28a745';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Gerado por XCafe.app', tempCanvas.width / 2, tempCanvas.height - 15);
    
    // Fazer download
    const link = document.createElement('a');
    link.download = filename + '_xcafe.png';
    link.href = tempCanvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } else {
    alert('❌ QR Code não encontrado. Gere um QR Code primeiro.');
  }
};

// ========== NOVA IMPLEMENTAÇÃO 2024: MÚLTIPLOS FORMATOS COMPATÍVEIS ==========

// Função principal para gerar múltiplos QR Codes compatíveis com diferentes wallets
function generateMultiWalletQRCodes(qrDiv, tokenAddress, tokenSymbol, tokenDecimals, tokenName, chainId) {
  // Formatos de deep links baseados na pesquisa de 2024
  const qrFormats = [
    {
      name: 'EIP-681 (Universal)',
      description: 'Padrão oficial Ethereum - Compatível com MetaMask, TrustWallet, Coinbase',
      data: `ethereum:${tokenAddress}@${chainId}/transfer?symbol=${tokenSymbol}&decimals=${tokenDecimals}&name=${encodeURIComponent(tokenName)}`,
      priority: 1
    },
    {
      name: 'TrustWallet Universal',
      description: 'Link web universal do TrustWallet',
      data: `https://link.trustwallet.com/add_asset?asset=c${chainId}_t${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}`,
      priority: 2
    },
    {
      name: 'WalletConnect v2',
      description: 'Protocolo WalletConnect para conectar wallets móveis',
      data: `wc:add-token?address=${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}&chainId=${chainId}&name=${encodeURIComponent(tokenName)}`,
      priority: 3
    },
    {
      name: 'MetaMask Mobile',
      description: 'Deep link específico para MetaMask Mobile',
      data: `https://metamask.app.link/add-token?address=${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}&chainId=${chainId}`,
      priority: 2
    }
  ];

  // Ordenar por prioridade
  qrFormats.sort((a, b) => a.priority - b.priority);

  // Criar interface com múltiplas opções
  qrDiv.innerHTML = `
    <div class="multi-wallet-qr-container">
      <div class="alert alert-info">
        <i class="bi bi-info-circle"></i>
        <strong>QR Codes Otimizados para Wallets Móveis</strong><br>
        Escaneie com sua wallet preferida ou use os links abaixo para adicionar o token diretamente.
      </div>
      
      <div class="row">
        <div class="col-12 col-lg-6">
          <div id="primaryQRContainer" class="text-center mb-3">
            <h6 class="text-success"><i class="bi bi-star-fill"></i> Recomendado</h6>
            <div id="primaryQR"></div>
            <small class="text-muted mt-2 d-block">${qrFormats[0].description}</small>
          </div>
        </div>
        
        <div class="col-12 col-lg-6">
          <div class="wallet-options">
            <h6><i class="bi bi-wallet2"></i> Opções por Wallet:</h6>
            <div id="walletLinks" class="d-grid gap-2"></div>
          </div>
        </div>
      </div>
      
      <div class="mt-3">
        <details class="qr-alternatives">
          <summary class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-qr-code-scan"></i> Ver Todos os QR Codes
          </summary>
          <div id="allQRCodes" class="row mt-3"></div>
        </details>
      </div>
    </div>
  `;

  // Gerar QR Code principal (EIP-681)
  generateSingleQR('primaryQR', qrFormats[0].data, 250, qrFormats[0].name);
  
  // Gerar links diretos para wallets
  generateWalletLinks(qrFormats, tokenSymbol, tokenName, chainId);
  
  // Gerar todos os QR Codes alternativos
  generateAllAlternativeQRs(qrFormats.slice(1), tokenSymbol, tokenName, chainId);
}

// Função para gerar links diretos para wallets
function generateWalletLinks(qrFormats, tokenSymbol, tokenName, chainId) {
  const walletLinksDiv = document.getElementById('walletLinks');
  
  const walletButtons = qrFormats.map(format => `
    <div class="d-flex align-items-center justify-content-between p-2 border rounded">
      <div class="flex-grow-1">
        <strong class="text-primary">${format.name}</strong><br>
        <small class="text-muted">${format.description}</small>
      </div>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-success" onclick="openWalletLink('${format.data.replace(/'/g, "\\'")}')">
          <i class="bi bi-box-arrow-up-right"></i> Abrir
        </button>
        <button class="btn btn-outline-success" onclick="copyWalletLink('${format.data.replace(/'/g, "\\'")}')">
          <i class="bi bi-clipboard"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  walletLinksDiv.innerHTML = walletButtons;
}

// Função para gerar QR Code individual
async function generateSingleQR(containerId, qrData, size = 200, title = '') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '<div class="text-center text-muted"><i class="bi bi-hourglass-split"></i> Gerando...</div>';
  
  // APIs para QR Code com fallback
  const qrApis = [
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}&format=png&margin=10&bgcolor=FFFFFF&color=000000&ecc=M`,
    `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(qrData)}&chld=M|4`,
    `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=${size}&margin=10&format=png`
  ];
  
  let apiIndex = 0;
  
  function tryNextAPI() {
    if (apiIndex >= qrApis.length) {
      container.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i><br>
          Erro ao gerar QR Code.<br>
          <small>Dados: ${qrData.length > 50 ? qrData.substring(0, 50) + '...' : qrData}</small>
        </div>
      `;
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = qrApis[apiIndex];
    
    img.onload = function() {
      // Criar canvas para adicionar logo XCafe
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = size;
      canvas.height = size;
      
      // Desenhar QR Code base
      ctx.drawImage(img, 0, 0, size, size);
      
      // Adicionar logo XCafe pequeno no canto
      addXCafeMark(ctx, size);
      
      // Mostrar resultado
      container.innerHTML = `
        <div class="qr-result">
          <canvas width="${size}" height="${size}" style="max-width: 100%; border: 2px solid #28a745; border-radius: 10px;"></canvas>
          <div class="mt-2">
            <button class="btn btn-sm btn-success" onclick="downloadQR(this.parentNode.parentNode.querySelector('canvas'), '${title || 'qrcode'}_xcafe')">
              <i class="bi bi-download"></i> Download
            </button>
          </div>
        </div>
      `;
      
      // Copiar canvas gerado para o canvas no HTML
      const displayCanvas = container.querySelector('canvas');
      const displayCtx = displayCanvas.getContext('2d');
      displayCtx.drawImage(canvas, 0, 0);
    };
    
    img.onerror = function() {
      apiIndex++;
      tryNextAPI();
    };
  }
  
  tryNextAPI();
}

// Função para adicionar marca XCafe discretamente
function addXCafeMark(ctx, qrSize) {
  const markSize = qrSize * 0.15;
  const markX = qrSize - markSize - 5;
  const markY = qrSize - markSize - 5;
  
  // Fundo semi-transparente
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(markX - 3, markY - 3, markSize + 6, markSize + 6);
  
  // Borda verde
  ctx.strokeStyle = '#28a745';
  ctx.lineWidth = 1;
  ctx.strokeRect(markX - 3, markY - 3, markSize + 6, markSize + 6);
  
  // Texto XCafe
  ctx.fillStyle = '#28a745';
  ctx.font = `bold ${markSize/4}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('XCafe', markX + markSize/2, markY + markSize/2 + 2);
}

// Função para gerar QR Codes alternativos
function generateAllAlternativeQRs(formats, tokenSymbol, tokenName, chainId) {
  const allQRDiv = document.getElementById('allQRCodes');
  
  const qrCards = formats.map((format, index) => `
    <div class="col-12 col-md-6 mb-3">
      <div class="card">
        <div class="card-header bg-light">
          <h6 class="mb-0">
            <i class="bi bi-qr-code"></i> ${format.name}
          </h6>
          <small class="text-muted">${format.description}</small>
        </div>
        <div class="card-body text-center">
          <div id="altQR_${index}">
            <button class="btn btn-outline-primary" onclick="generateSingleQR('altQR_${index}', '${format.data.replace(/'/g, "\\'")}', 180, '${format.name}')">
              <i class="bi bi-qr-code-scan"></i> Gerar QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  allQRDiv.innerHTML = qrCards;
}

// Funções auxiliares para interação
window.openWalletLink = function(url) {
  console.log('🔗 Abrindo link da wallet:', url);
  window.open(url, '_blank');
};

window.copyWalletLink = function(url) {
  navigator.clipboard.writeText(url).then(() => {
    // Feedback visual
    const button = event.target.closest('button');
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="bi bi-check"></i>';
    button.classList.add('btn-success');
    button.classList.remove('btn-outline-success');
    
    setTimeout(() => {
      button.innerHTML = originalHtml;
      button.classList.remove('btn-success');
      button.classList.add('btn-outline-success');
    }, 1500);
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    alert('Link copiado: ' + url);
  });
};

window.downloadQR = function(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename + '.png';
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
