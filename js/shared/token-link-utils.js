// js/shared/token-link-utils.js
// Funções utilitárias para geração de link de token, autocomplete de redes, busca de token, copiar/compartilhar link

import { fetchTokenData } from './token-global.js';

export async function fetchAllNetworks() {
  const res = await fetch('https://chainid.network/chains.json');
  return await res.json();
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
