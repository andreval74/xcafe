// Processador de arquivos Solidity
const SolProcessor = {
    /**
     * Processa arquivo .sol
     */
    async processFile(file) {
        if (!file) return null;

        try {
            const codigo = await this.readFile(file);
            const infos = this.extrairInfos(codigo);
            
            // Atualiza a UI
            this.atualizarUI(file.name, codigo, infos);
            
            // Salva para uso global
            window.currentSolInfo = {
                codigo,
                nome: file.name,
                ...infos
            };
            
            return window.currentSolInfo;
        } catch (error) {
            console.error('âŒ Erro ao processar arquivo:', error);
            throw error;
        }
    },

    /**
     * Láª o arquivo como texto
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    /**
     * Extrai informaá§áµes do contrato
     */
    extrairInfos(codigo) {
        const infos = {
            version: '',
            nome: '',
            optimizacao: false,
            licenca: '',
            libraries: [],
            imports: []
        };
        
        try {
            // Extrai versá£o do compilador
            const versionMatch = codigo.match(/pragma solidity\s*(.*?);/);
            if (versionMatch) {
                infos.version = versionMatch[1].trim();
            }
            
            // Extrai nome do contrato
            const contractMatch = codigo.match(/contract\s+(\w+)/);
            if (contractMatch) {
                infos.nome = contractMatch[1];
            }
            
            // Verifica se tem otimizaá§á£o
            infos.optimizacao = codigo.includes('optimizer') || 
                               codigo.includes('optimization') || 
                               codigo.includes('optimized');
            
            // Extrai licená§a
            const licenseMatch = codigo.match(/SPDX-License-Identifier:\s*(.*)/);
            if (licenseMatch) {
                infos.licenca = licenseMatch[1].trim();
            }

            // Extrai bibliotecas
            const libraryRegex = /library\s+(\w+)/g;
            let libraryMatch;
            while ((libraryMatch = libraryRegex.exec(codigo)) !== null) {
                infos.libraries.push(libraryMatch[1]);
            }

            // Extrai imports
            const importRegex = /import\s+["'](.+?)["'];/g;
            let importMatch;
            while ((importMatch = importRegex.exec(codigo)) !== null) {
                infos.imports.push(importMatch[1]);
            }
            
        } catch (error) {
            console.error('âŒ Erro ao extrair informaá§áµes:', error);
        }
        
        return infos;
    },

    /**
     * Atualiza a interface com as informaá§áµes
     */
    atualizarUI(fileName, codigo, infos) {
        // Mostra seá§á£o de detalhes
        const detailsSection = document.getElementById('contract-details');
        if (detailsSection) {
            detailsSection.style.display = 'block';
        }
        
        // Atualiza campos
        const campos = {
            'contract-name': `Contrato: ${infos.nome || fileName}`,
            'compiler-version-display': infos.version || 'Ná£o detectado',
            'optimization-display': infos.optimizacao ? 'Sim' : 'Ná£o',
            'license-display': infos.licenca || 'Ná£o especificada',
            'libraries-display': infos.libraries?.length > 0 ? infos.libraries.join(', ') : 'Nenhuma',
            'codigo-fonte': codigo
        };
        
        Object.entries(campos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.textContent = valor;
        });
    },

    /**
     * Limpa todos os campos e remove arquivo
     */
    limpar() {
        // Limpa input
        const input = document.getElementById('solFileInput');
        if (input) input.value = '';
        
        // Esconde seá§á£o de detalhes
        const detailsSection = document.getElementById('contract-details');
        if (detailsSection) {
            detailsSection.style.display = 'none';
        }
        
        // Limpa campos
        const campos = {
            'contract-name': 'Informaá§áµes do Contrato',
            'compiler-version-display': '-',
            'optimization-display': '-',
            'license-display': '-',
            'libraries-display': '-',
            'codigo-fonte': ''
        };
        
        Object.entries(campos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.textContent = valor;
        });
        
        // Remove dados globais
        window.currentSolInfo = null;
    }
};

// Funá§áµes exportadas para uso global
async function processarArquivoSol(input) {
    if (!input?.files?.length) return;
    await SolProcessor.processFile(input.files[0]);
}

function limparArquivoSol() {
    SolProcessor.limpar();
}

// ==================== EXPORTS GLOBAIS ====================

// Torna as funá§áµes disponá­veis globalmente
window.SolProcessorGlobal = {
    processarArquivoSol,
    limparArquivoSol,
    SolProcessor
};

console.log('“„ [SOL-PROCESSOR] Má³dulo carregado - Funá§áµes disponá­veis globalmente');




