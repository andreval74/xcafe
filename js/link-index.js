// js/link-index.js
// Versão simplificada do gerador de link - apenas link compartilhável
import { fetchAllNetworks, showAutocomplete, copyToClipboard, shareLink, showCopyAndShareButtons } from './shared/token-link-utils.js';
import { fetchTokenData } from './shared/token-global.js';
import { autoUpdateChainsJson } from './shared/token-link-utils.js';

// Inicializar chains
autoUpdateChainsJson();

// Variáveis globais
let allNetworks = [];
let selectedNetwork = null;

// IDs dos elementos
const networkSearchId = 'networkSearch';
const networkAutocompleteId = 'networkAutocomplete';
const rpcUrlId = 'rpcUrl';
const blockExplorerId = 'blockExplorer';
const tokenAddressId = 'tokenAddress';
const tokenNameId = 'tokenName';
const tokenSymbolId = 'tokenSymbol';
const tokenDecimalsId = 'tokenDecimals';
const tokenImageId = 'tokenImage';
const btnTokenSearchId = 'btnTokenSearch';
const btnCopyLinkId = 'btnCopyLink';
const btnShareLinkId = 'btnShareLink';
const generatedLinkId = 'generatedLink';
const tokenLoadingId = 'tokenLoading';
const generatedLinkContainerId = 'generatedLinkContainer';

function selectNetwork(network) {
	selectedNetwork = network;
	window.selectedNetwork = network; // Para compatibilidade
	document.getElementById(rpcUrlId).value = network.rpc[0];
	document.getElementById(blockExplorerId).value = network.explorers ? network.explorers[0].url : '';
	document.getElementById(networkSearchId).value = `${network.name} (${network.chainId})`;
	document.getElementById(networkAutocompleteId).style.display = 'none';
	
	// Mostrar status da rede selecionada
	const networkStatus = document.getElementById('network-status');
	const selectedNetworkName = document.getElementById('selected-network-name');
	if (networkStatus && selectedNetworkName) {
		selectedNetworkName.textContent = `${network.name} (Chain ID: ${network.chainId})`;
		networkStatus.style.display = 'block';
	}
	
	// Liberar próxima etapa (seção do token)
	showNextSection('token-section');
}

async function fetchTokenDataAndFill() {
	console.log('🔍 Iniciando busca de dados do token...');
	const tokenAddress = document.getElementById(tokenAddressId).value.trim();
	console.log('📍 Endereço do token:', tokenAddress);
	if (!tokenAddress) {
		alert('⚠️ Informe o endereço do token.');
		return;
	}
	console.log('🌐 Rede selecionada:', selectedNetwork);
	if (!selectedNetwork || !selectedNetwork.rpc || selectedNetwork.rpc.length === 0) {
		alert('⚠️ Nenhuma rede selecionada.');
		return;
	}
	document.getElementById(tokenLoadingId).style.display = 'block';
	let provider = new ethers.providers.JsonRpcProvider(selectedNetwork.rpc[0]);
	console.log('🔗 Provider criado com RPC:', selectedNetwork.rpc[0]);
	try {
		const data = await fetchTokenData(tokenAddress, provider);
		console.log('✅ Dados do token recebidos:', data);
		document.getElementById(tokenNameId).value = data.name;
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
		
		// Mostrar status do token carregado
		const tokenStatus = document.getElementById('token-status');
		const loadedTokenInfo = document.getElementById('loaded-token-info');
		if (tokenStatus && loadedTokenInfo) {
			loadedTokenInfo.textContent = `${data.symbol} - ${data.name}`;
			tokenStatus.style.display = 'block';
		}
		
		// Gerar o link automaticamente após encontrar o token
		console.log('🔗 Gerando link automaticamente...');
		generateLink();
		
		// Liberar próxima etapa (seção de links gerados)
		showNextSection('generate-section');
	} catch (err) {
		console.error('❌ Erro ao buscar dados do token:', err);
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
	const tokenName = document.getElementById(tokenNameId).value.trim() || tokenSymbol;
  
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
  
	// Gerar link simples para link-token.html
	const baseUrl = window.location.origin + window.location.pathname.replace('link-index.html', '');
	const shareableLink = `${baseUrl}link-token.html?address=${encodeURIComponent(tokenAddress)}&symbol=${encodeURIComponent(tokenSymbol)}&decimals=${encodeURIComponent(tokenDecimals)}&chainId=${encodeURIComponent(selectedNetwork.chainId)}&name=${encodeURIComponent(tokenName)}`;
  
	// Exibir o link
	const linkField = document.getElementById(generatedLinkId);
	linkField.value = shareableLink;
  
	// Mostrar o container dos links gerados
	const linkContainer = document.getElementById(generatedLinkContainerId);
	if (linkContainer) {
		linkContainer.style.display = 'block';
	}
  
	console.log('✅ Link gerado com sucesso:', shareableLink);
}

function clearForm() {
	console.log('🧹 Limpando formulário...');
	
	// Limpar todos os campos de input
	const inputs = [
		networkSearchId, rpcUrlId, blockExplorerId, tokenAddressId,
		tokenNameId, tokenSymbolId, tokenDecimalsId, tokenImageId, generatedLinkId
	];
	
	inputs.forEach(inputId => {
		const element = document.getElementById(inputId);
		if (element) {
			element.value = '';
		}
	});
	
	// Ocultar elementos da interface
	document.getElementById(networkAutocompleteId).style.display = 'none';
	document.getElementById(tokenLoadingId).style.display = 'none';
	
	// Resetar variáveis de estado
	selectedNetwork = null;
	window.selectedNetwork = null;
	
	console.log('✅ Formulário limpo');
}

// Funções para controlar etapas progressivas
function showNextSection(sectionId) {
	const section = document.getElementById(sectionId);
	if (section) {
		section.style.display = 'block';
		// Scroll suave para a nova seção
		setTimeout(() => {
			section.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}
}

function hideAllSectionsAfter(sectionId) {
	const sections = ['token-section', 'generate-section'];
	const currentIndex = sections.indexOf(sectionId);
	
	if (currentIndex !== -1) {
		for (let i = currentIndex + 1; i < sections.length; i++) {
			const section = document.getElementById(sections[i]);
			if (section) {
				section.style.display = 'none';
			}
		}
	}
}

function clearAllSteps() {
	console.log('🧹 Limpando todos os dados e reiniciando sessão...');
	
	// Limpar formulário completamente
	clearForm();
	
	// Ocultar seções posteriores à primeira
	document.getElementById('token-section').style.display = 'none';
	document.getElementById('generate-section').style.display = 'none';
	
	// Ocultar status
	const networkStatus = document.getElementById('network-status');
	const tokenStatus = document.getElementById('token-status');
	const generatedLinkContainer = document.getElementById(generatedLinkContainerId);
	const tokenLoading = document.getElementById(tokenLoadingId);
	const networkAutocomplete = document.getElementById(networkAutocompleteId);
	
	if (networkStatus) networkStatus.style.display = 'none';
	if (tokenStatus) tokenStatus.style.display = 'none';
	if (generatedLinkContainer) generatedLinkContainer.style.display = 'none';
	if (tokenLoading) tokenLoading.style.display = 'none';
	if (networkAutocomplete) networkAutocomplete.style.display = 'none';
	
	// Limpar TODOS os campos de input (forçar limpeza)
	const inputs = [
		networkSearchId, rpcUrlId, blockExplorerId, tokenAddressId,
		tokenNameId, tokenSymbolId, tokenDecimalsId, tokenImageId, generatedLinkId
	];
	
	inputs.forEach(inputId => {
		const element = document.getElementById(inputId);
		if (element) {
			element.value = '';
		}
	});
	
	// Resetar completamente as variáveis de estado
	selectedNetwork = null;
	window.selectedNetwork = null;
	
	// Limpar qualquer cache ou estado persistente
	if (typeof Storage !== 'undefined') {
		// Limpar sessionStorage se estiver sendo usado
		sessionStorage.removeItem('selectedNetwork');
		sessionStorage.removeItem('tokenData');
	}
	
	// Scroll para o topo
	setTimeout(() => {
		document.getElementById('network-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, 100);
	
	console.log('✅ Sessão completamente reiniciada');
}

// Funções para os novos botões
function previewGeneratedLink() {
	const link = document.getElementById(generatedLinkId).value;
	if (link) {
		// Abrir na mesma aba para preview
		window.open(link, '_self');
	}
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
	console.log('🚀 Inicializando sistema...');
	allNetworks = await fetchAllNetworks();
	console.log('📡 Redes carregadas:', allNetworks.length);
	
	// Event listeners
	document.getElementById(networkSearchId).addEventListener('input', () =>
		showAutocomplete(networkSearchId, networkAutocompleteId, allNetworks, selectNetwork)
	);
	
	document.addEventListener('click', function(e) {
		if (!e.target.closest('#' + networkAutocompleteId) && e.target.id !== networkSearchId) {
			document.getElementById(networkAutocompleteId).style.display = 'none';
		}
	});
	
	const tokenSearchBtn = document.getElementById(btnTokenSearchId);
	if (tokenSearchBtn) {
		console.log('🔍 Botão de busca encontrado e configurado');
		tokenSearchBtn.addEventListener('click', fetchTokenDataAndFill);
	} else {
		console.error('❌ Botão de busca não encontrado!');
	}
	
	// Botões principais
	document.getElementById(btnCopyLinkId)?.addEventListener('click', () => copyToClipboard(generatedLinkId));
	document.getElementById(btnShareLinkId)?.addEventListener('click', () => shareLink(generatedLinkId));
	document.getElementById('btnPreviewLink')?.addEventListener('click', previewGeneratedLink);
	document.getElementById('btnClearAll')?.addEventListener('click', clearAllSteps);
	
	console.log('✅ Sistema inicializado com sucesso!');
});
