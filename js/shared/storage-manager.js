/**
 * ’¾ STORAGE MANAGER - GERENCIAMENTO DE DADOS ENTRE Má“DULOS
 * 
 * “‹ RESPONSABILIDADES:
 * - Salvar/carregar dados do projeto token entre má³dulos
 * - Validar integridade dos dados
 * - Gerenciar estado de progresso do fluxo
 * - Sincronizar dados entre localStorage e sessionStorage
 * - Fornecer interface áºnica para acesso aos dados
 * 
 * ”— USADO POR:
 * - Todos os má³dulos (01-dados-basicos, 02-personalizacao, etc.)
 * - Sistema principal (add-index.html)
 * - Templates e verificaá§á£o
 * 
 * “Š ESTRUTURA DE DADOS:
 * - TokenProjectData: Dados principais do projeto
 * - ModuleProgress: Status de progresso de cada má³dulo
 * - TemporaryData: Dados temporá¡rios para transferáªncia
 */

// ==================== ESTRUTURA DE DADOS CENTRAL ====================

/**
 * Estrutura padrá£o dos dados do projeto token
 */
const DEFAULT_PROJECT_DATA = {
  // Identificaá§á£o do projeto
  projectId: null,
  createdAt: null,
  lastModified: null,
  
  // Dados bá¡sicos do token (Má³dulo 01)
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
  
  // Personalizaá§á£o (Má³dulo 02)
  contractType: 'simple', // 'simple' ou 'custom'
  targetSuffix: '',
  saltFound: '',
  predictedAddress: '',
  
  // Compilaá§á£o e Deploy (Má³dulo 03)
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
  
  // Verificaá§á£o (Má³dulo 04)
  verificationStatus: 'pending', // 'pending', 'success', 'failed'
  verificationTxId: '',
  verificationUrl: '',
  
  // Status do processo por má³dulo
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
      warning: 'âš ï¸',
      error: 'âŒ',
      debug: '”§'
    }[type] || '“‹';
    
    console.log(`${prefix} [STORAGE-MANAGER ${timestamp}] ${message}`);
  }
  
  // ==================== INICIALIZAá‡áƒO ====================
  
  /**
   * Inicializa o storage manager
   * Cria estrutura padrá£o se ná£o existir
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
      this.log(`Erro na inicializaá§á£o: ${error.message}`, 'error');
    }
  }
  
  /**
   * Gera ID áºnico para o projeto
   */
  generateProjectId() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // ==================== DADOS PRINCIPAIS ====================
  
  /**
   * Obtá©m todos os dados do projeto
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
      
      // Notificar outros má³dulos sobre mudaná§a
      this.notifyDataChange(data);
      
    } catch (error) {
      this.log(`Erro ao salvar dados: ${error.message}`, 'error');
      throw error;
    }
  }
  
  /**
   * Atualiza campos especá­ficos do projeto
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
   * Marca um má³dulo como completo
   */
  completeModule(moduleName) {
    try {
      const data = this.getProjectData();
      if (data) {
        data.moduleProgress[moduleName] = true;
        this.saveProjectData(data);
        this.log(`Má³dulo ${moduleName} marcado como completo`, 'success');
        return true;
      }
      return false;
    } catch (error) {
      this.log(`Erro ao completar má³dulo: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Verifica se um má³dulo está¡ completo
   */
  isModuleComplete(moduleName) {
    const data = this.getProjectData();
    return data && data.moduleProgress && data.moduleProgress[moduleName] === true;
  }
  
  /**
   * Verifica se um má³dulo pode ser acessado
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
    
    // Primeiro má³dulo sempre pode ser acessado
    if (currentIndex === 0) return true;
    
    // Verificar se má³dulo anterior está¡ completo
    const previousModule = moduleOrder[currentIndex - 1];
    return this.isModuleComplete(previousModule);
  }
  
  /**
   * Obtá©m status de todos os má³dulos
   */
  getModuleProgress() {
    const data = this.getProjectData();
    return data ? data.moduleProgress : { ...DEFAULT_PROJECT_DATA.moduleProgress };
  }
  
  // ==================== DADOS ESPECáFICOS POR TIPO ====================
  
  /**
   * Salva dados bá¡sicos do token (Má³dulo 01)
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
    
    this.log('Salvando dados bá¡sicos do token...', 'debug');
    return this.updateProjectData(updates);
  }
  
  /**
   * Salva dados de personalizaá§á£o (Má³dulo 02)
   */
  saveCustomizationData(customData) {
    const updates = {
      contractType: customData.contractType || 'simple',
      targetSuffix: customData.targetSuffix || '',
      saltFound: customData.saltFound || '',
      predictedAddress: customData.predictedAddress || ''
    };
    
    this.log('Salvando dados de personalizaá§á£o...', 'debug');
    return this.updateProjectData(updates);
  }
  
  /**
   * Salva dados de compilaá§á£o (Má³dulo 03)
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
    
    this.log('Salvando dados de compilaá§á£o...', 'debug');
    return this.updateProjectData(updates);
  }
  
  /**
   * Salva dados de deploy (Má³dulo 03)
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
   * Salva dados de verificaá§á£o (Má³dulo 04)
   */
  saveVerificationData(verifyData) {
    const updates = {
      verificationStatus: verifyData.status || 'pending',
      verificationTxId: verifyData.txId || verifyData.guid,
      verificationUrl: verifyData.url || verifyData.verificationUrl
    };
    
    this.log('Salvando dados de verificaá§á£o...', 'debug');
    return this.updateProjectData(updates);
  }
  
  // ==================== DADOS TEMPORáRIOS ====================
  
  /**
   * Salva dados temporá¡rios para transferáªncia entre má³dulos
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
      this.log(`Dados temporá¡rios salvos: ${key}`, 'debug');
      
    } catch (error) {
      this.log(`Erro ao salvar dados temporá¡rios: ${error.message}`, 'error');
    }
  }
  
  /**
   * Carrega dados temporá¡rios
   */
  loadTempData(key = 'default') {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEYS.TEMP_DATA + '_' + key);
      if (!stored) return null;
      
      const tempData = JSON.parse(stored);
      
      // Verificar expiraá§á£o
      if (Date.now() > tempData.expiresAt) {
        this.clearTempData(key);
        this.log(`Dados temporá¡rios expirados: ${key}`, 'warning');
        return null;
      }
      
      this.log(`Dados temporá¡rios carregados: ${key}`, 'debug');
      return tempData.data;
      
    } catch (error) {
      this.log(`Erro ao carregar dados temporá¡rios: ${error.message}`, 'error');
      return null;
    }
  }
  
  /**
   * Limpa dados temporá¡rios
   */
  clearTempData(key = 'default') {
    sessionStorage.removeItem(this.STORAGE_KEYS.TEMP_DATA + '_' + key);
    this.log(`Dados temporá¡rios limpos: ${key}`, 'debug');
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
   * Mantá©m compatibilidade com add-index.html
   */
  syncWithExistingSystem() {
    try {
      const projectData = this.getProjectData();
      if (!projectData) return;
      
      // Sincronizar variá¡veis globais existentes
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
      
      this.log('Sincronizaá§á£o com sistema existente concluá­da', 'success');
      
    } catch (error) {
      this.log(`Erro na sincronizaá§á£o: ${error.message}`, 'error');
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
      
      // Importar de variá¡veis globais
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
          this.log('Dados importados das variá¡veis globais', 'success');
        }
      }
      
      return imported;
      
    } catch (error) {
      this.log(`Erro na importaá§á£o: ${error.message}`, 'error');
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
    
    // Validaá§áµes bá¡sicas
    if (!data.projectId) errors.push('ID do projeto ausente');
    if (!data.createdAt) errors.push('Data de criaá§á£o ausente');
    
    // Validaá§áµes por má³dulo
    if (data.moduleProgress['dados-basicos']) {
      if (!data.tokenName) errors.push('Nome do token ausente');
      if (!data.tokenSymbol) errors.push('Sá­mbolo do token ausente');
      if (!data.ownerAddress) errors.push('Endereá§o do proprietá¡rio ausente');
    }
    
    if (data.moduleProgress['resumo-criacao']) {
      if (!data.contractSource) errors.push('Cá³digo fonte ausente');
      if (!data.deployedAddress) errors.push('Endereá§o de deploy ausente');
    }
    
    if (errors.length > 0) {
      this.log(`Erros de validaá§á£o: ${errors.join(', ')}`, 'error');
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
      
      // Limpar dados temporá¡rios
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
   * Notifica outros má³dulos sobre mudaná§as nos dados
   */
  notifyDataChange(data) {
    // Disparar evento customizado para outros má³dulos escutarem
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('tokenDataChanged', {
        detail: {
          projectId: data.projectId,
          lastModified: data.lastModified,
          moduleProgress: data.moduleProgress
        }
      });
      
      window.dispatchEvent(event);
      this.log('Evento de mudaná§a de dados disparado', 'debug');
    }
  }
  
  // ==================== UTILITáRIOS ====================
  
  /**
   * Obtá©m resumo dos dados para debug
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

// Funá§áµes de conveniáªncia para uso direto
window.saveTokenData = (data) => window.TokenStorage.updateProjectData(data);
window.loadTokenData = () => window.TokenStorage.getProjectData();
window.completeModule = (name) => window.TokenStorage.completeModule(name);
window.canAccessModule = (name) => window.TokenStorage.canAccessModule(name);

// Export para má³dulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenStorageManager;
}




