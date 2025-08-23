// js/link-index.js
// Script mínimo para inicializar o gerador de link usando o core centralizado
import { setupLinkGenerator } from './shared/link-index-core.js';
import { autoUpdateChainsJson } from './shared/token-link-utils.js';

autoUpdateChainsJson();
setupLinkGenerator();
