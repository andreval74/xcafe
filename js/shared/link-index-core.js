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

  function selectNetwork(network) {
    selectedNetwork = network;
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
    
    // Gerar link no formato MetaMask wallet_addEthereumChain
    const params = new URLSearchParams({
      chainId: `0x${selectedNetwork.chainId.toString(16)}`,
      chainName: selectedNetwork.name,
      rpcUrls: selectedNetwork.rpc[0],
      nativeCurrency: JSON.stringify(selectedNetwork.nativeCurrency),
      blockExplorerUrls: selectedNetwork.explorers ? selectedNetwork.explorers[0].url : '',
      tokenAddress: tokenAddress,
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
      tokenImage: document.getElementById(tokenImageId).value || ''
    });
    
    const link = `https://metamask.app.link/add-token?${params.toString()}`;
    document.getElementById(generatedLinkId).value = link;
    if (generatedLinkContainerId && document.getElementById(generatedLinkContainerId)) {
      document.getElementById(generatedLinkContainerId).style.display = 'block';
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
