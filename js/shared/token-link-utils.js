// Checa e baixa chains.json atualizado a cada 5 dias (432000000 ms)
export async function autoUpdateChainsJson() {
  const API_URL = 'https://chainid.network/chains.json';
  const LOCAL_KEY = 'xcafe_chainsjson_lastupdate';
  const now = Date.now();
  let lastUpdate = 0;
  try {
    lastUpdate = parseInt(localStorage.getItem(LOCAL_KEY) || '0', 10);
  } catch (e) {}
  if (now - lastUpdate < 432000000) return; // menos de 5 dias
  try {
    const [apiRes, localRes] = await Promise.all([
      fetch(API_URL),
      fetch('./chains.json')
    ]);
    if (!apiRes.ok || !localRes.ok) return;
    const [apiData, localData] = await Promise.all([
      apiRes.text(),
      localRes.text()
    ]);
    if (apiData !== localData) {
      // Força download automático do novo arquivo
      const blob = new Blob([apiData], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chains.json';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      alert('Arquivo chains.json atualizado! Salve o novo arquivo para garantir as redes mais recentes.');
    }
    localStorage.setItem(LOCAL_KEY, now.toString());
  } catch (e) {}
}
// js/shared/token-link-utils.js
// Funções utilitárias para gerAção de link de token, autocomplete de redes, busca de token, copiar/compartilhar link


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



// Busca lista de redes priorizando localStorage, atualiza em background se necessário

export async function fetchAllNetworks() {
  // Sempre tenta usar chains.json local
  try {
    const res = await fetch('./chains.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {}
  // Se chains.json não existir ou estiver vazio, retorna lista mínima
  return fallbackNetworks;
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

