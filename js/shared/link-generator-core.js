// js/shared/link-generator-core.js
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
    document.getElementById(nativeCurrencyId).value = network.nativeCurrency.symbol;
    document.getElementById(nativeDecimalsId).value = network.nativeCurrency.decimals;
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
    const data = {
      chainId: selectedNetwork.chainId,
      chainName: selectedNetwork.name,
      rpcUrl: document.getElementById(rpcUrlId).value,
      blockExplorer: document.getElementById(blockExplorerId).value,
      nativeCurrency: document.getElementById(nativeCurrencyId).value,
      nativeDecimals: document.getElementById(nativeDecimalsId).value,
      tokenAddress: document.getElementById(tokenAddressId).value,
      tokenSymbol: document.getElementById(tokenSymbolId).value,
      tokenDecimals: document.getElementById(tokenDecimalsId).value,
      tokenImage: document.getElementById(tokenImageId).value,
      tokenName: document.getElementById(tokenNameId) ? document.getElementById(tokenNameId).value : '',
      networkName: document.getElementById(networkSearchId) ? document.getElementById(networkSearchId).value : ''
    };
    const link = `https://metamask.app.link/dapp/seusite.com/addtoken?${new URLSearchParams(data).toString()}`;
    document.getElementById(generatedLinkId).value = link;
    if (generatedLinkContainerId && document.getElementById(generatedLinkContainerId)) {
      document.getElementById(generatedLinkContainerId).style.display = 'block';
    }
    showCopyAndShareButtons(btnCopyLinkId, btnShareLinkId, true);
    if (onLinkGenerated) onLinkGenerated(link, data);
  }

  function clearForm() {
    document.getElementById(networkSearchId).value = '';
    document.getElementById(rpcUrlId).value = '';
    document.getElementById(blockExplorerId).value = '';
    document.getElementById(nativeCurrencyId).value = '';
    document.getElementById(nativeDecimalsId).value = '';
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
