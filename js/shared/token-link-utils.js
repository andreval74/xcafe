// js/shared/token-link-utils.js
// Funções utilitárias para geração de link de token, autocomplete de redes, busca de token, copiar/compartilhar link


import { fallbackNetworks } from './networks-fallback.js';
import { fetchTokenData } from './token-global.js';


// Mostra mensagem visual de fallback
function showNetworkFallbackMessage(tipo) {
  let msg = '';
  if (tipo === 'localStorage') {
    msg = '⚠️ Usando lista de redes salva localmente (pode estar desatualizada).';
  } else if (tipo === 'fallback') {
    msg = '⚠️ Usando lista mínima de redes (offline).';
  }
  let el = document.getElementById('networkFallbackMsg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'networkFallbackMsg';
    el.className = 'alert alert-warning my-2';
    const parent = document.querySelector('main') || document.body;
    parent.prepend(el);
  }
  el.textContent = msg;
}

export async function fetchAllNetworks() {
  // 1. Tenta chains.json local
  try {
    const res = await fetch('./chains.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Remove mensagem de fallback se existir
        const el = document.getElementById('networkFallbackMsg');
        if (el) el.remove();
        return data;
      }
    }
  } catch (e) { /* ignora erro de arquivo local */ }

  // 2. Tenta API online e atualiza chains.json/localStorage
  const apiUrl = 'https://chainid.network/chains.json';
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Erro ao buscar redes online');
    const data = await res.json();
    // Salva no localStorage para uso offline futuro
    try {
      localStorage.setItem('xcafe_networks_cache', JSON.stringify({ts: Date.now(), data}));
    } catch (e) { /* ignore quota errors */ }
    // Atualiza chains.json local via API (se rodando localmente, pode não funcionar em produção)
    try {
      fetch('./chains.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) { /* ignore */ }
    // Remove mensagem de fallback se existir
    const el = document.getElementById('networkFallbackMsg');
    if (el) el.remove();
    return data;
  } catch (e) {
    // 3. Tenta cache localStorage
    try {
      const cache = localStorage.getItem('xcafe_networks_cache');
      if (cache) {
        const obj = JSON.parse(cache);
        showNetworkFallbackMessage('localStorage');
        return obj.data;
      }
    } catch (e2) { /* ignore */ }
    // 4. Fallback mínimo
    showNetworkFallbackMessage('fallback');
    return fallbackNetworks;
  }
}

export function showAutocomplete(inputId, listId, allNetworks, onSelect) {
  const input = document.getElementById(inputId);
  const value = input.value.toLowerCase();
  const list = document.getElementById(listId);
  list.innerHTML = '';
  if (!value) {
    list.style.display = 'none';
    return;
  }
  const filtered = allNetworks.filter(n =>
    n.name.toLowerCase().includes(value) || n.chainId.toString().includes(value)
  ).slice(0, 10);
  if (filtered.length === 0) {
    list.style.display = 'none';
    return;
  }
  filtered.forEach(n => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'list-group-item list-group-item-action';
    item.textContent = `${n.name} (${n.chainId})`;
    item.onclick = () => onSelect(n);
    list.appendChild(item);
  });
  list.style.display = 'block';
}

export function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  el.select();
  document.execCommand('copy');
}

export function shareLink(elementId, text = 'Adicione este token à carteira') {
  const link = document.getElementById(elementId).value;
  if (navigator.share) {
    navigator.share({ text, url: link });
  } else {
  alert('Compartilhamento direto não suportado neste navegador.');
  }
}

export function showCopyAndShareButtons(copyBtnId, shareBtnId, show) {
  const copyBtn = document.getElementById(copyBtnId);
  const shareBtn = document.getElementById(shareBtnId);
  if (copyBtn && shareBtn) {
    if (show) {
      copyBtn.classList.remove('d-none');
      shareBtn.classList.remove('d-none');
    } else {
      copyBtn.classList.add('d-none');
      shareBtn.classList.add('d-none');
    }
  }
}
