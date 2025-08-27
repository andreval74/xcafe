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
    const tokenName = document.getElementById(tokenNameId)?.value.trim() || tokenSymbol;
    
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
    
    // Gerar link simples para add-token.html
    const baseUrl = window.location.origin + window.location.pathname.replace('link-index.html', '');
    const shareableLink = `${baseUrl}add-token.html?address=${encodeURIComponent(tokenAddress)}&symbol=${encodeURIComponent(tokenSymbol)}&decimals=${encodeURIComponent(tokenDecimals)}&chainId=${encodeURIComponent(selectedNetwork.chainId)}&name=${encodeURIComponent(tokenName)}`;
    
    // Exibir o link
    const linkField = document.getElementById(generatedLinkId);
    linkField.value = shareableLink;
    
    // Mostrar container de resultado
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
    
    // Trocar o botão "Gerar Link" por "Limpar Informações"
    const generateBtn = document.getElementById(btnGenerateLinkId);
    if (generateBtn) {
      generateBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Limpar Informações';
      generateBtn.className = 'btn btn-outline-danger w-100';
      // Remover o listener antigo e adicionar o novo
      generateBtn.removeEventListener('click', generateLink);
      generateBtn.addEventListener('click', function() {
        clearForm();
        // Restaurar o botão original
        generateBtn.innerHTML = '<i class="bi bi-link-45deg"></i> Gerar Link';
        generateBtn.className = 'btn btn-primary w-100';
        // Restaurar o listener original
        generateBtn.removeEventListener('click', arguments.callee);
        generateBtn.addEventListener('click', generateLink);
      });
    }
    
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

// ========== SOLUÇÃO MOBILE 2024: FORMATOS TESTADOS E FUNCIONAIS ==========

// Função principal para gerar QR Codes e links MOBILE
function generateMultiWalletQRCodes(qrDiv, tokenAddress, tokenSymbol, tokenDecimals, tokenName, chainId) {
  console.log('📱 MODO MOBILE CORRIGIDO: Gerando formatos que realmente funcionam');
  
  // Armazenar informações do token globalmente para usar nas funções auxiliares
  window.currentTokenAddress = tokenAddress;
  window.currentTokenSymbol = tokenSymbol;
  window.currentTokenDecimals = tokenDecimals;
  window.currentTokenName = tokenName;
  window.currentChainId = chainId;
  
  // Formatos MOBILE TESTADOS (baseados em pesquisa real 2024)
  const mobileFormats = [
    {
      name: 'TrustWallet Oficial',
      description: '🛡️ Link oficial TrustWallet - SEMPRE FUNCIONA',
      data: `https://link.trustwallet.com/add_asset?asset=c${chainId}_t${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}`,
      type: 'browser',
      priority: 1,
      icon: '🛡️'
    },
    {
      name: 'Página de Token',
      description: '🌐 Página web para adicionar token - UNIVERSAL',
      data: `${window.location.origin}/add-token.html?address=${tokenAddress}&symbol=${tokenSymbol}&decimals=${tokenDecimals}&chainId=${chainId}&name=${encodeURIComponent(tokenName)}`,
      type: 'browser',
      priority: 1,
      icon: '🌐'
    },
    {
      name: 'QR Code Simples',
      description: '📱 QR com endereço do contrato - SIMPLES E FUNCIONA',
      data: tokenAddress,
      type: 'qrcode',
      priority: 1,
      icon: '📱'
    },
    {
      name: 'QR Code Universal',
      description: '� QR Code padrão para todas as wallets',
      data: `ethereum:${tokenAddress}@${chainId}?symbol=${tokenSymbol}&decimals=${tokenDecimals}&name=${encodeURIComponent(tokenName)}`,
      type: 'qrcode',
      priority: 1,
      icon: '�'
    },
    {
      name: 'Coinbase Wallet',
      description: '🅾️ Link direto para Coinbase Wallet',
      data: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.origin + '/add-token.html?address=' + tokenAddress + '&symbol=' + tokenSymbol + '&decimals=' + tokenDecimals)}`,
      type: 'deeplink',
      priority: 2,
      icon: '🅾️'
    }
  ];

  // Criar interface MOBILE OTIMIZADA
  qrDiv.innerHTML = `
    <div class="mobile-qr-container">
      <div class="alert alert-warning mobile-alert">
        <i class="bi bi-exclamation-triangle"></i>
        <strong>� VERSÃO CORRIGIDA</strong><br>
        <small>Links simples e QR codes que realmente funcionam no celular!</small>
      </div>
      
      <!-- BOTÕES GRANDES PARA MOBILE -->
      <div class="mobile-wallet-buttons d-grid gap-3 mb-4">
        ${mobileFormats.filter(f => f.priority === 1).map(format => `
          <button class="btn btn-success btn-lg mobile-wallet-btn" onclick="handleMobileWalletAction('${format.type}', '${format.data.replace(/'/g, "\\'")}', '${format.name}')">
            <div class="d-flex align-items-center justify-content-between">
              <div class="text-start">
                <div class="mobile-wallet-icon">${format.icon}</div>
                <strong>${format.name}</strong><br>
                <small>${format.description}</small>
              </div>
              <i class="bi bi-arrow-right-circle fs-3"></i>
            </div>
          </button>
        `).join('')}
      </div>
      
      <!-- QR CODE MOBILE -->
      <div class="mobile-qr-section">
        <div class="text-center mb-3">
          <h5><i class="bi bi-qr-code-scan"></i> QR Code Mobile</h5>
          <p class="text-muted small">Escaneie com o leitor de QR da sua wallet</p>
        </div>
        <div id="mobileQRDisplay" class="text-center"></div>
      </div>
      
      <!-- INSTRUÇÕES MOBILE -->
      <div class="mobile-instructions mt-4">
        <details class="mobile-help">
          <summary class="btn btn-outline-info btn-sm w-100">
            <i class="bi bi-question-circle"></i> Como usar no celular?
          </summary>
          <div class="mt-3 p-3 bg-light text-dark rounded">
            <h6>📱 No Celular:</h6>
            <ol class="small">
              <li><strong>Toque no botão da sua wallet</strong> para abrir diretamente</li>
              <li><strong>OU escaneie o QR Code</strong> com o leitor da wallet</li>
              <li><strong>Confirme</strong> quando a wallet pedir para adicionar o token</li>
            </ol>
            
            <h6 class="mt-3">🛠️ Se não funcionar:</h6>
            <ul class="small">
              <li><strong>TrustWallet:</strong> Use o primeiro botão - sempre funciona</li>
              <li><strong>QR Code simples:</strong> Apenas endereço do contrato</li>
              <li><strong>Cópia manual:</strong> Copie e adicione manualmente na wallet</li>
              <li><strong>Instruções:</strong> Tutorial passo-a-passo</li>
            </ul>
          </div>
        </details>
      </div>
      
      <!-- OPÇÕES AVANÇADAS -->
      <div class="mobile-advanced mt-3">
        <details class="mobile-advanced-options">
          <summary class="btn btn-outline-secondary btn-sm w-100">
            <i class="bi bi-gear"></i> Opções Avançadas
          </summary>
          <div class="mt-3">
            <div class="d-grid gap-2">
              ${mobileFormats.filter(f => f.priority === 2).map(format => `
                <button class="btn btn-outline-primary btn-sm" onclick="handleMobileWalletAction('${format.type}', '${format.data.replace(/'/g, "\\'")}', '${format.name}')">
                  ${format.icon} ${format.name}
                </button>
              `).join('')}
            </div>
          </div>
        </details>
      </div>
    </div>
  `;

  // Gerar QR Code principal otimizado para mobile
  generateMobileOptimizedQR(mobileFormats.find(f => f.type === 'qrcode'), tokenSymbol, tokenName);
}

// Função para gerar QR Code otimizado para mobile
async function generateMobileOptimizedQR(format, tokenSymbol, tokenName) {
  const container = document.getElementById('mobileQRDisplay');
  if (!container || !format) return;
  
  container.innerHTML = '<div class="text-center text-muted"><i class="bi bi-hourglass-split"></i> Gerando QR Mobile...</div>';
  
  const qrSize = 280; // Tamanho maior para mobile
  
  // APIs otimizadas para mobile
  const mobileQRApis = [
    `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(format.data)}&format=png&margin=15&bgcolor=FFFFFF&color=000000&ecc=H`,
    `https://chart.googleapis.com/chart?chs=${qrSize}x${qrSize}&cht=qr&chl=${encodeURIComponent(format.data)}&chld=H|5`,
    `https://quickchart.io/qr?text=${encodeURIComponent(format.data)}&size=${qrSize}&margin=15&format=png&ecLevel=H`
  ];
  
  let apiIndex = 0;
  
  function tryMobileQRAPI() {
    if (apiIndex >= mobileQRApis.length) {
      container.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i><br>
          QR Code temporariamente indisponível.<br>
          <small>Use os botões diretos acima!</small>
        </div>
      `;
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = mobileQRApis[apiIndex];
    
    img.onload = function() {
      container.innerHTML = `
        <div class="mobile-qr-display">
          <div class="qr-container-mobile">
            <img src="${img.src}" alt="QR Code Mobile" class="qr-mobile-img">
            <div class="qr-mobile-overlay">
              <div class="xcafe-badge-mobile">XCafe</div>
            </div>
          </div>
          <div class="mt-3">
            <button class="btn btn-success btn-sm" onclick="downloadMobileQR('${img.src}', '${tokenSymbol}_mobile_qr')">
              <i class="bi bi-download"></i> Baixar QR Code
            </button>
            <button class="btn btn-outline-success btn-sm ms-2" onclick="shareMobileQR('${format.data}')">
              <i class="bi bi-share"></i> Compartilhar
            </button>
          </div>
          <div class="mt-2">
            <small class="text-muted">
              <i class="bi bi-info-circle"></i> 
              QR Code otimizado para leitores móveis
            </small>
          </div>
        </div>
      `;
    };
    
    img.onerror = function() {
      console.warn(`Mobile QR API ${apiIndex + 1} falhou, tentando próxima...`);
      apiIndex++;
      tryMobileQRAPI();
    };
  }
  
  tryMobileQRAPI();
}

// Função para tratar ações das wallets no mobile - VERSÃO CORRIGIDA
window.handleMobileWalletAction = function(type, data, walletName) {
  console.log(`📱 Ação mobile CORRIGIDA: ${type} para ${walletName}`);
  console.log(`🔗 Dados:`, data);
  
  // Feedback visual imediato
  const button = event.target.closest('button');
  const originalHtml = button.innerHTML;
  button.innerHTML = '<i class="bi bi-hourglass-split"></i> Abrindo...';
  button.disabled = true;
  
  switch(type) {
    case 'browser':
      // Links que abrem no navegador (sempre funcionam)
      console.log('🌐 Abrindo no navegador:', data);
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // Mobile: abrir na mesma aba
        window.location.href = data;
      } else {
        // Desktop: nova aba
        window.open(data, '_blank');
      }
      break;
      
    case 'qrcode':
      // Mostrar QR Code simples
      console.log('📱 Gerando QR Code simples');
      const qrSection = document.getElementById('mobileQRDisplay');
      if (qrSection) {
        // Gerar QR Code apenas com o endereço do contrato
        generateSimpleMobileQR(data, qrSection);
        qrSection.scrollIntoView({ behavior: 'smooth' });
      }
      break;
      
    case 'copy':
      // Copiar endereço do contrato
      console.log('� Copiando endereço:', data);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data).then(() => {
          button.innerHTML = '<i class="bi bi-check"></i> Copiado!';
          button.className = 'btn btn-success btn-lg mobile-wallet-btn';
        }).catch(() => {
          prompt('Copie o endereço do contrato:', data);
        });
      } else {
        prompt('Copie o endereço do contrato:', data);
      }
      break;
      
    case 'manual':
      // Mostrar instruções manuais
      showManualInstructions(walletName);
      break;
  }
  
  // Restaurar botão após 3 segundos
  setTimeout(() => {
    if (type !== 'copy') { // Não restaurar se foi cópia bem-sucedida
      button.innerHTML = originalHtml;
      button.disabled = false;
    }
  }, 3000);
};

// Função para baixar QR Code mobile
window.downloadMobileQR = function(imageSrc, filename) {
  const link = document.createElement('a');
  link.download = filename + '.png';
  link.href = imageSrc;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Função para compartilhar QR Code mobile
window.shareMobileQR = async function(qrData) {
  if (navigator.share) {
    // API nativa de compartilhamento do mobile
    try {
      await navigator.share({
        title: 'Adicionar Token à Wallet',
        text: 'Use este link para adicionar o token à sua wallet:',
        url: qrData.startsWith('http') ? qrData : window.location.href
      });
    } catch(error) {
      console.log('Compartilhamento cancelado');
    }
  } else {
    // Fallback: copiar para clipboard
    try {
      await navigator.clipboard.writeText(qrData);
      alert('✅ Link copiado para a área de transferência!');
    } catch(error) {
      // Último fallback: mostrar o texto
      prompt('Copie este link:', qrData);
    }
  }
};

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

// NOVAS FUNÇÕES AUXILIARES PARA MOBILE

// Função para gerar QR Code simples (apenas endereço do contrato)
function generateSimpleMobileQR(contractAddress, container) {
  console.log('📱 Gerando QR Code simples com endereço:', contractAddress);
  
  container.innerHTML = '<div class="text-center text-muted"><i class="bi bi-hourglass-split"></i> Gerando QR simples...</div>';
  
  const qrSize = 300;
  
  // Usar apenas o endereço do contrato (mais simples e sempre funciona)
  const apiUrls = [
    `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(contractAddress)}&format=png&margin=20&bgcolor=FFFFFF&color=000000&ecc=H`,
    `https://chart.googleapis.com/chart?chs=${qrSize}x${qrSize}&cht=qr&chl=${encodeURIComponent(contractAddress)}&chld=H|4`,
    `https://quickchart.io/qr?text=${encodeURIComponent(contractAddress)}&size=${qrSize}&margin=20&format=png&ecLevel=H`
  ];
  
  let apiIndex = 0;
  
  function trySimpleQRAPI() {
    if (apiIndex >= apiUrls.length) {
      container.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i><br>
          QR Code indisponível no momento.<br>
          <div class="mt-2">
            <strong>Endereço do Contrato:</strong><br>
            <code style="word-break: break-all;">${contractAddress}</code>
            <button class="btn btn-sm btn-primary mt-2" onclick="navigator.clipboard.writeText('${contractAddress}').then(() => alert('Endereço copiado!'))">
              <i class="bi bi-clipboard"></i> Copiar Endereço
            </button>
          </div>
        </div>
      `;
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = apiUrls[apiIndex];
    
    img.onload = function() {
      console.log('✅ QR Code simples gerado com sucesso');
      container.innerHTML = `
        <div class="mobile-qr-display">
          <div class="qr-container-mobile">
            <img src="${img.src}" alt="QR Code - Endereço do Contrato" class="qr-mobile-img">
            <div class="qr-mobile-overlay">
              <div class="xcafe-badge-mobile">XCafe</div>
            </div>
          </div>
          <div class="mt-3">
            <h6 class="text-success">📱 QR Code Simples</h6>
            <p class="small text-muted">
              Contém apenas o endereço do contrato.<br>
              <strong>Para usar:</strong> Escaneie com sua wallet e adicione manualmente.
            </p>
            <div class="mt-2">
              <button class="btn btn-success btn-sm" onclick="downloadMobileQR('${img.src}', 'contract_address_qr')">
                <i class="bi bi-download"></i> Baixar
              </button>
              <button class="btn btn-outline-primary btn-sm ms-2" onclick="navigator.clipboard.writeText('${contractAddress}').then(() => alert('✅ Endereço copiado!'))">
                <i class="bi bi-clipboard"></i> Copiar Endereço
              </button>
            </div>
          </div>
        </div>
      `;
    };
    
    img.onerror = function() {
      console.warn(`QR API ${apiIndex + 1} falhou, tentando próxima...`);
      apiIndex++;
      trySimpleQRAPI();
    };
  }
  
  trySimpleQRAPI();
}

// Função para mostrar instruções manuais
function showManualInstructions(walletName) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 15px;
    padding: 25px;
    max-width: 400px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    color: #333;
  `;
  
  content.innerHTML = `
    <div class="text-center mb-3">
      <h4 style="color: #28a745;">📖 Como Adicionar Token Manualmente</h4>
      <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
              style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
    </div>
    
    <div style="text-align: left;">
      <h6 style="color: #007bff;">🛡️ TrustWallet:</h6>
      <ol style="font-size: 14px;">
        <li>Abra o TrustWallet</li>
        <li>Toque no ícone <strong>"+"</strong> no topo</li>
        <li>Selecione <strong>"Add Custom Token"</strong></li>
        <li>Cole o endereço do contrato</li>
        <li>Preencha símbolo e decimais</li>
        <li>Toque em <strong>"Done"</strong></li>
      </ol>
      
      <h6 style="color: #f6851b; margin-top: 20px;">🦊 MetaMask:</h6>
      <ol style="font-size: 14px;">
        <li>Abra o MetaMask</li>
        <li>Vá para <strong>"Assets"</strong></li>
        <li>Role para baixo e toque <strong>"Import tokens"</strong></li>
        <li>Cole o endereço do contrato</li>
        <li>Os outros campos preenchem automaticamente</li>
        <li>Toque em <strong>"Import"</strong></li>
      </ol>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <h6 style="color: #28a745; margin-bottom: 10px;">📋 Informações do Token:</h6>
        <div style="font-family: monospace; font-size: 12px; word-break: break-all;">
          <strong>Endereço:</strong> <span id="modalContractAddress"></span><br>
          <strong>Símbolo:</strong> <span id="modalSymbol"></span><br>
          <strong>Decimais:</strong> <span id="modalDecimals"></span>
        </div>
        <button onclick="navigator.clipboard.writeText(document.getElementById('modalContractAddress').textContent).then(() => alert('✅ Endereço copiado!'))" 
                style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 5px; margin-top: 10px; cursor: pointer;">
          <i class="bi bi-clipboard"></i> Copiar Endereço
        </button>
      </div>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Preencher as informações do token
  setTimeout(() => {
    const addressEl = document.getElementById('modalContractAddress');
    const symbolEl = document.getElementById('modalSymbol');
    const decimalsEl = document.getElementById('modalDecimals');
    
    if (addressEl && window.currentTokenAddress) addressEl.textContent = window.currentTokenAddress;
    if (symbolEl && window.currentTokenSymbol) symbolEl.textContent = window.currentTokenSymbol;
    if (decimalsEl && window.currentTokenDecimals) decimalsEl.textContent = window.currentTokenDecimals;
  }, 100);
  
  // Fechar ao clicar fora
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
