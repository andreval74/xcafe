// ADDTOKEN-INDEX.JS - Só para a tela de cadastro/geração do link

import { fetchAllNetworks, showAutocomplete, copyToClipboard, shareLink, showCopyAndShareButtons } from './shared/token-link-utils.js';
import { fetchTokenData } from './shared/token-global.js';

let allNetworks = [];
let selectedNetwork = null;

function selectNetwork(network) {
    selectedNetwork = network;
    document.getElementById('rpcUrl').value = network.rpc[0];
    document.getElementById('blockExplorer').value = network.explorers ? network.explorers[0].url : "";
    document.getElementById('nativeCurrency').value = network.nativeCurrency.symbol;
    document.getElementById('nativeDecimals').value = network.nativeCurrency.decimals;
    document.getElementById('networkSearch').value = `${network.name} (${network.chainId})`;
    document.getElementById('networkAutocomplete').style.display = 'none';
}

async function fetchTokenDataAndFill() {
    const tokenAddress = document.getElementById('tokenAddress').value.trim();
    if (!tokenAddress) {
        alert('⚠️ Informe o endereço do token.');
        return;
    }
    if (!selectedNetwork || !selectedNetwork.rpc || selectedNetwork.rpc.length === 0) {
        alert('⚠️ Nenhuma rede selecionada.');
        return;
    }
    document.getElementById('tokenLoading').style.display = 'block';
    let provider = new ethers.providers.JsonRpcProvider(selectedNetwork.rpc[0]);
    try {
        const data = await fetchTokenData(tokenAddress, provider);
        if (document.getElementById('tokenName')) document.getElementById('tokenName').value = data.name;
        document.getElementById('tokenSymbol').value = data.symbol;
        document.getElementById('tokenDecimals').value = data.decimals;
        // Imagem TrustWallet
        let networkSlug = selectedNetwork.slug || selectedNetwork.name.toLowerCase().replace(/\s+/g, '');
        const imageUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${networkSlug}/assets/${tokenAddress}/logo.png`;
        try {
            const resp = await fetch(imageUrl, { method: 'HEAD' });
            document.getElementById('tokenImage').value = resp.ok ? imageUrl : '';
        } catch {
            document.getElementById('tokenImage').value = '';
        }
    } catch (err) {
        alert('❌ Erro ao buscar dados do token. Verifique se o contrato está na rede selecionada.');
    }
    document.getElementById('tokenLoading').style.display = 'none';
}

function generateLink() {
    if (!selectedNetwork || !selectedNetwork.chainId || !selectedNetwork.name) {
        alert('Selecione uma rede válida antes de gerar o link!');
        return;
    }
    // Exemplo de geração de link (ajuste conforme sua lógica)
    const data = {
        chainId: selectedNetwork.chainId,
        chainName: selectedNetwork.name,
        rpcUrl: document.getElementById('rpcUrl').value,
        blockExplorer: document.getElementById('blockExplorer').value,
        nativeCurrency: document.getElementById('nativeCurrency').value,
        nativeDecimals: document.getElementById('nativeDecimals').value,
        tokenAddress: document.getElementById('tokenAddress').value,
        tokenSymbol: document.getElementById('tokenSymbol').value,
        tokenDecimals: document.getElementById('tokenDecimals').value,
        tokenImage: document.getElementById('tokenImage').value,
        tokenName: document.getElementById('tokenName') ? document.getElementById('tokenName').value : '',
        networkName: document.getElementById('networkSearch') ? document.getElementById('networkSearch').value : ''
    };
    // Aqui você pode customizar a geração do link
    const link = `https://metamask.app.link/dapp/seusite.com/addtoken?${new URLSearchParams(data).toString()}`;
    document.getElementById('generatedLink').value = link;
    showCopyAndShareButtons('btnCopyLink', 'btnShareLink', true);
}

function clearForm() {
    document.getElementById('networkSearch').value = '';
    document.getElementById('rpcUrl').value = '';
    document.getElementById('blockExplorer').value = '';
    document.getElementById('nativeCurrency').value = '';
    document.getElementById('nativeDecimals').value = '';
    document.getElementById('tokenAddress').value = '';
    document.getElementById('tokenSymbol').value = '';
    document.getElementById('tokenDecimals').value = '';
    document.getElementById('tokenImage').value = '';
    if (document.getElementById('tokenName')) document.getElementById('tokenName').value = '';
    document.getElementById('generatedLink').value = '';
    showCopyAndShareButtons('btnCopyLink', 'btnShareLink', false);
    document.getElementById('networkAutocomplete').style.display = 'none';
    document.getElementById('tokenLoading').style.display = 'none';
    selectedNetwork = null;
}

document.addEventListener('DOMContentLoaded', async () => {
    allNetworks = await fetchAllNetworks();
    document.getElementById('networkSearch').addEventListener('input', () =>
        showAutocomplete('networkSearch', 'networkAutocomplete', allNetworks, selectNetwork)
    );
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#networkAutocomplete') && e.target.id !== 'networkSearch') {
            document.getElementById('networkAutocomplete').style.display = 'none';
        }
    });
    document.getElementById('btnTokenSearch')?.addEventListener('click', fetchTokenDataAndFill);
    document.getElementById('btnGenerateLink')?.addEventListener('click', generateLink);
    document.getElementById('btnCopyLink')?.addEventListener('click', () => copyToClipboard('generatedLink'));
    document.getElementById('btnShareLink')?.addEventListener('click', () => shareLink('generatedLink'));
    document.getElementById('btnClear')?.addEventListener('click', clearForm);
    document.querySelectorAll('input, textarea, select').forEach(function(el) {
        if (el.value) {
            el.classList.add('filled');
        }
    });
    showCopyAndShareButtons('btnCopyLink', 'btnShareLink', false);
    const linkField = document.getElementById('generatedLink');
    linkField.addEventListener('input', function() {
        if (!linkField.value) {
            showCopyAndShareButtons('btnCopyLink', 'btnShareLink', false);
        }
    });
});