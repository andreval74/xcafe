// js/link-generator.js
// Script mínimo para inicializar o gerador de link usando o core centralizado
import { setupLinkGenerator } from './shared/link-generator-core.js';
import { autoUpdateChainsJson } from './shared/token-link-utils.js';

autoUpdateChainsJson();
setupLinkGenerator();
