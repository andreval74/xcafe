/**
 * ’¾ STORAGE MANAGER - GERENCIAMENTO DE DADOS ENTRE Má“DULOS
 * 
 * “‹ RESPONSABILIDADES:
 * - Salvar/carregar dados do projeto token entre módulos
 * - Validar integridade dos dados
 * - Gerenciar estado de progresso do fluxo
 * - Sincronizar dados entre localStorage e sessionStorage
 * - Fornecer interface única para acesso aos dados
 * 
 * ”— USADO POR:
 * - Todos os módulos (01-dados-basicos, 02-personalizacao, etc.)
 * - Sistema principal (add-index.html)
 * - Templates e verificaçÃo
 * 
 * “Š ESTRUTURA DE DADOS:
 * - TokenProjectData: Dados principais do projeto
 * - ModuleProgress: Status de progresso de cada módulo
 * - TemporaryData: Dados temporários para transferáªncia
 */

// ==================== ESTRUTURA DE DADOS CENTRAL ====================

/**
 * Estrutura padrÃo dos dados do projeto token
 */
const DEFAULT_PROJECT_DATA = {
  // IdentificaçÃo do projeto
  projectId: null,
  createdAt: null,
  lastModified: null,
  
  // Dados básicos do token (Módulo 01)
  tokenName: '',
  tokenSymbol: '',
  decimals: 18,
  totalSupply: '',
  ownerAddress: '',
  tokenImage: '',
  
  // Dados de rede
  networkId: '',
  networkName: '',
  networkChainId: null,
  
  // PersonalizaçÃo (Módulo 02)
  contractType: 'simple', // 'simple' ou 'custom'
  targetSuffix: '',
  saltFound: '',
  predictedAddress: '',
  
  // CompilaçÃo e Deploy (Módulo 03)
  contractSource: '',
  contractName: '',
  contractAbi: null,
  contractBytecode: '',
  compilationConfig: null,
  compilerVersion: '',
  
  // Deploy
  deployedAddress: '',
  deployTxHash: '',
  deployBlockNumber: null,
  deployGasUsed: null,
  
  // VerificaçÃo (Módulo 04)
  verificationStatus: 'pending', // 'pending', 'success', 'failed'
  verificationTxId: '',
  verificationUrl: '',
  
  // Status do processo por módulo
  moduleProgress: {
    'dados-basicos': false,
    'personalizacao': false,
    'resumo-criacao': false,
    'verificacao': false,
    'finalizacao': false
  }
};

/**
 * Classe principal para gerenciamento de storage
 */
class TokenStorageManager {
  
  constructor() {
    this.STORAGE_KEYS = {
      PROJECT_DATA: 'TokenProjectData',
      MODULE_STATE: 'CurrentModuleState',
      TEMP_DATA: 'TempModuleData',
      BACKUP_DATA: 'TokenProjectBackup'
    };
    
    this.DEBUG = true;
    this.initialized = false;
    
    this.log('š€ Storage Manager inicializado');
  }
  
  // ==================== LOGGING ====================
  
  log(message, type = 'info') {
    if (!this.DEBUG) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '’¾',
      success: '…',
      warning: 'Ãš ï¸',
      error: 'ÃŒ',
      debug: '”§'
    }[type] || '“‹';
    
    console.log(`${prefix} [STORAGE-MANAGER ${timestamp}] ${message}`);
  }
  
  // ==================== INICIALIZAá‡áƒO ====================
  
  /**
   * Inicializa o storage manager
   * Cria estrutura padrÃo se nÃo existir
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      // Verificar se dados existem
      let projectData = this.getProjectData();
      
      if (!projectData || !projectData.projectId) {
        // Criar novo projeto
        projectData = { ...DEFAULT_PROJECT_DATA };
        projectData.projectId = this.generateProjectId();
        projectData.createdAt = new Date().toISOString();
        projectData.lastModified = new Date().toISOString();
        
        this.saveProjectData(projectData);
        this.log('Novo projeto criado: ' + projectData.projectId, 'success');
      } else {
        this.log('Projeto existente carregado: ' + projectData.projectId, 'success');
      }
      
      this.initialized = true;
      
    } catch (error) {
      this.log(`Erro na inicializaçÃo: ${error.message}`, 'error');
    }
  }
  
  /**
   * Gera ID único para o projeto
   */
  generateProjectId() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // ==================== DADOS PRINCIPAIS ====================
  
  /**
   * Obtém todos os dados do projeto
   */
  getProjectData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.PROJECT_DATA);
      if (data) {
        const parsed = JSON.parse(data);
        this.log(`Dados carregados: ${Object.keys(parsed).length} propriedades`);
        return parsed;
      }
      return null;
    } catch (error) {
      this.log(`Erro ao carregar dados: ${error.message}`, 'error');
      return null;
    }
  }
  
  /**
   * Salva todos os dados do projeto
   */
  saveProjectData(data) {
    try {
      // Atualizar timestamp
      data.lastModified = new Date().toISOString();
      
      // Fazer backup dos dados atuais
      this.createBackup();
      
      // Salvar novos dados
      localStorage.setItem(this.STORAGE_KEYS.PROJECT_DATA, JSON.stringify(data));
      
      this.log('Dados salvos com sucesso', 'success');
      
      // Notificar outros módulos sobre mudança
      this.notifyDataChange(data);
      
    } catch (error) {
      this.log(`Erro ao salvar dados: ${error.message}`, 'error');
      throw error;
    }
  }
  
  /**
   * Atualiza campos específicos do projeto
   */
  updateProjectData(updates) {
    try {
      const currentData = this.getProjectData() || { ...DEFAULT_PROJECT_DATA };
      const updatedData = { ...currentData, ...updates };
      this.saveProjectData(updatedData);
      
      this.log(`Dados atualizados: ${Object.keys(updates).join(', ')}`, 'success');
      return updatedData;
      
    } catch (error) {
      this.log(`Erro ao atualizar dados: ${error.message}`, 'error');
      throw error;
    }
  }
  
  // ==================== PROGRESSO DOS Má“DULOS ====================
  
  /**
   * Marca um módulo como completo
   */
  completeModule(moduleName) {
    try {
      const data = this.getProjectData();
      if (data) {
        data.moduleProgress[moduleName] = true;
        this.saveProjectData(data);
        this.log(`Módulo ${moduleName} marcado como completo`, 'success');
        return true;
      }
      return false;
    } catch (error) {
      this.log(`Erro ao completar módulo: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Verifica se um módulo está completo
   */
  isModuleComplete(moduleName) {
    const data = this.getProjectData();
    return data && data.moduleProgress && data.moduleProgress[moduleName] === true;
  }
  
  /**
   * Verifica se um módulo pode ser acessado
   */
  canAccessModule(moduleName) {
    const moduleOrder = [
      'dados-basicos',
      'personalizacao', 
      'resumo-criacao',
      'verificacao',
      'finalizacao'
    ];
    
    const currentIndex = moduleOrder.indexOf(moduleName);
    if (currentIndex === -1) return false;
    
    // Primeiro módulo sempre pode ser acessado
    if (currentIndex === 0) return true;
    
    // Verificar se módulo anterior está completo
    const previousModule = moduleOrder[currentIndex - 1];
    return this.isModuleComplete(previousModule);
  }
  
  /**
   * Obtém status de todos os módulos
   */
  getModuleProgress() {
    const data = this.getProjectData();
    return data ? data.moduleProgress : { ...DEFAULT_PROJECT_DATA.moduleProgress };
  }
  
  // ==================== DADOS ESPECáFICOS POR TIPO ====================
  
  /**
   * Salva dados básicos do token (Módulo 01)
   */
  saveBasicTokenData(tokenData) {
    const updates = {
      tokenName: tokenData.nome || tokenData.tokenName,
      tokenSymbol: tokenData.symbol || tokenData.tokenSymbol,
      decimals: parseInt(tokenData.decimals) || 18,
      totalSupply: tokenData.supply || tokenData.totalSupply,
      ownerAddress: tokenData.owner || tokenData.ownerAddress,
      tokenImage: tokenData.image || tokenData.tokenImage,
      networkId: tokenData.networkId,
      networkName: tokenData.networkName,
      networkChainId: tokenData.chainId
    };
    
    this.log('Salvando dados básicos do token...', 'debug');
    return this.updateProjectData(updates);
  }
  
  /**
   * Salva dados de personalizaçÃo (Módulo 02)
   */
  saveCustomizationData(customData) {
    const updates = {
      contractType: customData.contractType || 'simple',
      targetSuffix: customData.targetSuffix || '',
      saltFound: customData.saltFound || '',
      predictedAddress: customData.predictedAddress || ''
    };
    
    this.log('Salvando dados de personalizaçÃo...', 'debug');
    return this.updateProjectData(updates);
  }
  
  /**
   * Salva dados de compilaçÃo (Módulo 03)
   */
  saveCompilationData(compileData) {
    const updates = {
      contractSource: compileData.sourceCode || compileData.contractSource,
      contractName: compileData.contractName,
      contractAbi: compileData.abi || compileData.contractAbi,
      contractBytecode: compileData.bytecode || compileData.contractBytecode,
      compilationConfig: compileData.config || compileData.compilationConfig,
      compilerVersion: compileData.compilerVersion || compileData.version
    };
    
    this.log('Salvando dados de compilaçÃo...', 'debug');
    return this.updateProjectData(updates);
  }
  
  /**
   * Salva dados de deploy (Módulo 03)
   */
  saveDeployData(deployData) {
    const updates = {
      deployedAddress: deployData.address || deployData.deployedAddress,
      deployTxHash: deployData.txHash || deployData.transactionHash,
      deployBlockNumber: deployData.blockNumber,
      deployGasUsed: deployData.gasUsed
    };
    
    this.log('Salvando dados de deploy...', 'debug');
    return this.updateProjectData(updates);
  }
  
  /**
   * Salva dados de verificaçÃo (Módulo 04)
   */
  saveVerificationData(verifyData) {
    const updates = {
      verificationStatus: verifyData.status || 'pending',
      verificationTxId: verifyData.txId || verifyData.guid,
      verificationUrl: verifyData.url || verifyData.verificationUrl
    };
    
    this.log('Salvando dados de verificaçÃo...', 'debug');
    return this.updateProjectData(updates);
  }
  
  // ==================== DADOS TEMPORáRIOS ====================
  
  /**
   * Salva dados temporários para transferáªncia entre módulos
   */
  saveTempData(data, key = 'default') {
    try {
      const tempData = {
        key: key,
        data: data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutos
      };
      
      sessionStorage.setItem(this.STORAGE_KEYS.TEMP_DATA + '_' + key, JSON.stringify(tempData));
      this.log(`Dados temporários salvos: ${key}`, 'debug');
      
    } catch (error) {
      this.log(`Erro ao salvar dados temporários: ${error.message}`, 'error');
    }
  }
  
  /**
   * Carrega dados temporários
   */
  loadTempData(key = 'default') {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEYS.TEMP_DATA + '_' + key);
      if (!stored) return null;
      
      const tempData = JSON.parse(stored);
      
      // Verificar expiraçÃo
      if (Date.now() > tempData.expiresAt) {
        this.clearTempData(key);
        this.log(`Dados temporários expirados: ${key}`, 'warning');
        return null;
      }
      
      this.log(`Dados temporários carregados: ${key}`, 'debug');
      return tempData.data;
      
    } catch (error) {
      this.log(`Erro ao carregar dados temporários: ${error.message}`, 'error');
      return null;
    }
  }
  
  /**
   * Limpa dados temporários
   */
  clearTempData(key = 'default') {
    sessionStorage.removeItem(this.STORAGE_KEYS.TEMP_DATA + '_' + key);
    this.log(`Dados temporários limpos: ${key}`, 'debug');
  }
  
  // ==================== BACKUP E RESTAURAá‡áƒO ====================
  
  /**
   * Cria backup dos dados atuais
   */
  createBackup() {
    try {
      const currentData = localStorage.getItem(this.STORAGE_KEYS.PROJECT_DATA);
      if (currentData) {
        const backupData = {
          data: currentData,
          timestamp: Date.now(),
          date: new Date().toISOString()
        };
        
        localStorage.setItem(this.STORAGE_KEYS.BACKUP_DATA, JSON.stringify(backupData));
        this.log('Backup criado com sucesso', 'debug');
      }
    } catch (error) {
      this.log(`Erro ao criar backup: ${error.message}`, 'error');
    }
  }
  
  /**
   * Restaura dados do backup
   */
  restoreFromBackup() {
    try {
      const backup = localStorage.getItem(this.STORAGE_KEYS.BACKUP_DATA);
      if (backup) {
        const backupData = JSON.parse(backup);
        localStorage.setItem(this.STORAGE_KEYS.PROJECT_DATA, backupData.data);
        this.log('Dados restaurados do backup', 'success');
        return true;
      }
      return false;
    } catch (error) {
      this.log(`Erro ao restaurar backup: ${error.message}`, 'error');
      return false;
    }
  }
  
  // ==================== COMPATIBILIDADE COM SISTEMA EXISTENTE ====================
  
  /**
   * Sincroniza com dados do sistema existente
   * Mantém compatibilidade com add-index.html
   */
  syncWithExistingSystem() {
    try {
      const projectData = this.getProjectData();
      if (!projectData) return;
      
      // Sincronizar variáveis globais existentes
      if (projectData.contractSource && typeof window !== 'undefined') {
        window.contratoSource = projectData.contractSource;
        window.contratoName = projectData.contractName;
        window.contratoAbi = projectData.contractAbi;
        window.contratoBytecode = projectData.contractBytecode;
        window.resolvedCompilerVersion = projectData.compilerVersion;
      }
      
      // Sincronizar localStorage existente
      if (projectData.deployedAddress) {
        const deployedContract = {
          address: projectData.deployedAddress,
          contractName: projectData.contractName,
          sourceCode: projectData.contractSource,
          abi: projectData.contractAbi,
          bytecode: projectData.contractBytecode,
          compilerVersion: projectData.compilerVersion,
          networkName: projectData.networkName,
          txHash: projectData.deployTxHash
        };
        
        localStorage.setItem('deployedContract', JSON.stringify(deployedContract));
      }
      
      this.log('SincronizaçÃo com sistema existente concluída', 'success');
      
    } catch (error) {
      this.log(`Erro na sincronizaçÃo: ${error.message}`, 'error');
    }
  }
  
  /**
   * Importa dados do sistema existente
   */
  importFromExistingSystem() {
    try {
      let imported = false;
      
      // Importar de localStorage existente
      const deployedContract = localStorage.getItem('deployedContract');
      if (deployedContract) {
        const data = JSON.parse(deployedContract);
        
        this.saveCompilationData({
          sourceCode: data.sourceCode,
          contractName: data.contractName,
          abi: data.abi,
          bytecode: data.bytecode,
          compilerVersion: data.compilerVersion
        });
        
        this.saveDeployData({
          address: data.address,
          txHash: data.txHash
        });
        
        imported = true;
        this.log('Dados importados do localStorage existente', 'success');
      }
      
      // Importar de variáveis globais
      if (typeof window !== 'undefined') {
        const globalData = {};
        
        if (window.contratoSource) globalData.contractSource = window.contratoSource;
        if (window.contratoName) globalData.contractName = window.contratoName;
        if (window.contratoAbi) globalData.contractAbi = window.contratoAbi;
        if (window.contratoBytecode) globalData.contractBytecode = window.contratoBytecode;
        if (window.resolvedCompilerVersion) globalData.compilerVersion = window.resolvedCompilerVersion;
        
        if (Object.keys(globalData).length > 0) {
          this.saveCompilationData(globalData);
          imported = true;
          this.log('Dados importados das variáveis globais', 'success');
        }
      }
      
      return imported;
      
    } catch (error) {
      this.log(`Erro na importaçÃo: ${error.message}`, 'error');
      return false;
    }
  }
  
  // ==================== VALIDAá‡áƒO E LIMPEZA ====================
  
  /**
   * Valida integridade dos dados
   */
  validateData() {
    const data = this.getProjectData();
    if (!data) return false;
    
    const errors = [];
    
    // Validações básicas
    if (!data.projectId) errors.push('ID do projeto ausente');
    if (!data.createdAt) errors.push('Data de criaçÃo ausente');
    
    // Validações por módulo
    if (data.moduleProgress['dados-basicos']) {
      if (!data.tokenName) errors.push('Nome do token ausente');
      if (!data.tokenSymbol) errors.push('Símbolo do token ausente');
      if (!data.ownerAddress) errors.push('Endereço do proprietário ausente');
    }
    
    if (data.moduleProgress['resumo-criacao']) {
      if (!data.contractSource) errors.push('Código fonte ausente');
      if (!data.deployedAddress) errors.push('Endereço de deploy ausente');
    }
    
    if (errors.length > 0) {
      this.log(`Erros de validaçÃo: ${errors.join(', ')}`, 'error');
      return false;
    }
    
    this.log('Dados validados com sucesso', 'success');
    return true;
  }
  
  /**
   * Limpa todos os dados do projeto
   */
  clearAllData() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.PROJECT_DATA);
      localStorage.removeItem(this.STORAGE_KEYS.BACKUP_DATA);
      sessionStorage.removeItem(this.STORAGE_KEYS.MODULE_STATE);
      
      // Limpar dados temporários
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_KEYS.TEMP_DATA)) {
          sessionStorage.removeItem(key);
        }
      });
      
      this.log('Todos os dados limpos', 'warning');
      this.initialized = false;
      
    } catch (error) {
      this.log(`Erro ao limpar dados: ${error.message}`, 'error');
    }
  }
  
  // ==================== NOTIFICAá‡á•ES ====================
  
  /**
   * Notifica outros módulos sobre mudanças nos dados
   */
  notifyDataChange(data) {
    // Disparar evento customizado para outros módulos escutarem
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('tokenDataChanged', {
        detail: {
          projectId: data.projectId,
          lastModified: data.lastModified,
          moduleProgress: data.moduleProgress
        }
      });
      
      window.dispatchEvent(event);
      this.log('Evento de mudança de dados disparado', 'debug');
    }
  }
  
  // ==================== UTILITáRIOS ====================
  
  /**
   * Obtém resumo dos dados para debug
   */
  getDataSummary() {
    const data = this.getProjectData();
    if (!data) return 'Nenhum dado encontrado';
    
    const completedModules = Object.entries(data.moduleProgress)
      .filter(([_, completed]) => completed)
      .map(([module, _]) => module);
    
    return {
      projectId: data.projectId,
      createdAt: data.createdAt,
      lastModified: data.lastModified,
      tokenName: data.tokenName,
      deployedAddress: data.deployedAddress,
      completedModules: completedModules,
      totalModules: Object.keys(data.moduleProgress).length
    };
  }
  
  /**
   * Exporta dados para download
   */
  exportData() {
    try {
      const data = this.getProjectData();
      if (!data) return null;
      
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `token-project-${data.projectId}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      this.log('Dados exportados com sucesso', 'success');
      
    } catch (error) {
      this.log(`Erro ao exportar dados: ${error.message}`, 'error');
    }
  }
}

// ==================== INSTá‚NCIA GLOBAL ====================

// Criar instá¢ncia global
window.TokenStorage = new TokenStorageManager();

// Inicializar automaticamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.TokenStorage.initialize();
  });
} else {
  window.TokenStorage.initialize();
}

// ==================== EXPORTS PARA COMPATIBILIDADE ====================

// Funções de conveniáªncia para uso direto
window.saveTokenData = (data) => window.TokenStorage.updateProjectData(data);
window.loadTokenData = () => window.TokenStorage.getProjectData();
window.completeModule = (name) => window.TokenStorage.completeModule(name);
window.canAccessModule = (name) => window.TokenStorage.canAccessModule(name);

// Export para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenStorageManager;
}






