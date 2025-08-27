﻿/**
 * › ï¸ COMMON UTILITIES - Má“DULO COMPARTILHADO
 * 
 * “ RESPONSABILIDADES:
 * - Funá§áµes utilitá¡rias reutilizá¡veis entre má³dulos
 * - Helpers para formataá§á£o e validaá§á£o
 * - Funá§áµes de UI/UX comuns
 * - Gerenciamento de toast/alertas
 * 
 * ”— USADO POR:
 * - Todos os má³dulos da aplicaá§á£o
 * - Especialmente: validaá§áµes, formataá§áµes, notificaá§áµes
 * 
 * “¤ EXPORTS:
 * - Funá§áµes de validaá§á£o (validaá§áµes)
 * - Funá§áµes de formataá§á£o (formatNumber, formatAddress, etc)
 * - Funá§áµes de UI (showToast, showModal, etc)
 * - Utilitá¡rios gerais (sleep, debounce, etc)
 */

// ==================== SISTEMA DE LOGGING ====================

/**
 * Sistema centralizado de logging para utilitá¡rios
 */
const CommonUtils = {
  config: {
    showDebugLogs: true,
    logLevel: 'info' // debug, info, warning, error
  },
  
  log(message, type = 'info', component = 'UTILS') {
    if (!this.config.showDebugLogs) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const levels = { debug: 0, info: 1, warning: 2, error: 3 };
    const currentLevel = levels[this.config.logLevel] || 1;
    
    if (levels[type] >= currentLevel) {
      const prefix = {
        debug: '”§',
        info: '› ï¸',
        warning: 'âš ï¸',
        error: 'âŒ'
      }[type] || '“‹';
      
      console.log(`${prefix} [${component} ${timestamp}] ${message}`);
    }
  }
};

// ==================== VALIDAá‡á•ES ====================

/**
 * Funá§áµes de validaá§á£o reutilizá¡veis
 */
const Validators = {
  
  /**
   * Valida endereá§o Ethereum/BSC
   */
  isValidAddress(address) {
    if (!address || typeof address !== 'string') return false;
    
    // Verificar formato bá¡sico
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    const isValid = addressRegex.test(address);
    
    CommonUtils.log(`Validando endereá§o ${address}: ${isValid ? 'vá¡lido' : 'invá¡lido'}`, 'debug');
    return isValid;
  },
  
  /**
   * Valida sá­mbolo de token
   */
  isValidTokenSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') return false;
    
    // 3-8 caracteres, apenas letras e náºmeros
    const symbolRegex = /^[A-Z0-9]{3,8}$/;
    const isValid = symbolRegex.test(symbol.toUpperCase());
    
    CommonUtils.log(`Validando sá­mbolo ${symbol}: ${isValid ? 'vá¡lido' : 'invá¡lido'}`, 'debug');
    return isValid;
  },
  
  /**
   * Valida nome de token
   */
  isValidTokenName(name) {
    if (!name || typeof name !== 'string') return false;
    
    // 3-50 caracteres, letras, náºmeros, espaá§os e alguns sá­mbolos
    const nameRegex = /^[a-zA-Z0-9\s\-_.]{3,50}$/;
    const isValid = nameRegex.test(name);
    
    CommonUtils.log(`Validando nome ${name}: ${isValid ? 'vá¡lido' : 'invá¡lido'}`, 'debug');
    return isValid;
  },
  
  /**
   * Valida valor de supply
   */
  isValidSupply(supply) {
    if (!supply) return false;
    
    const numericSupply = parseFloat(supply.toString().replace(/,/g, ''));
    const isValid = !isNaN(numericSupply) && numericSupply > 0 && numericSupply <= 1e18;
    
    CommonUtils.log(`Validando supply ${supply}: ${isValid ? 'vá¡lido' : 'invá¡lido'}`, 'debug');
    return isValid;
  },
  
  /**
   * Valida decimais
   */
  isValidDecimals(decimals) {
    const numDecimals = parseInt(decimals);
    const isValid = !isNaN(numDecimals) && numDecimals >= 0 && numDecimals <= 18;
    
    CommonUtils.log(`Validando decimais ${decimals}: ${isValid ? 'vá¡lido' : 'invá¡lido'}`, 'debug');
    return isValid;
  },
  
  /**
   * Valida URL de imagem
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return true; // Opcional
    
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
      
      const hasValidProtocol = validProtocols.includes(urlObj.protocol);
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      );
      
      const isValid = hasValidProtocol && hasValidExtension;
      
      CommonUtils.log(`Validando URL imagem ${url}: ${isValid ? 'vá¡lida' : 'invá¡lida'}`, 'debug');
      return isValid;
      
    } catch (error) {
      CommonUtils.log(`URL imagem invá¡lida ${url}: ${error.message}`, 'debug');
      return false;
    }
  },
  
  /**
   * Valida dados completos do token
   */
  validateTokenData(data) {
    const errors = [];
    
    if (!this.isValidTokenName(data.name)) {
      errors.push('Nome do token invá¡lido (3-50 caracteres)');
    }
    
    if (!this.isValidTokenSymbol(data.symbol)) {
      errors.push('Sá­mbolo do token invá¡lido (3-8 caracteres maiáºsculos)');
    }
    
    if (!this.isValidSupply(data.supply)) {
      errors.push('Total supply invá¡lido');
    }
    
    if (!this.isValidDecimals(data.decimals)) {
      errors.push('Decimais invá¡lidos (0-18)');
    }
    
    if (!this.isValidAddress(data.owner)) {
      errors.push('Endereá§o do proprietá¡rio invá¡lido');
    }
    
    if (data.image && !this.isValidImageUrl(data.image)) {
      errors.push('URL da imagem invá¡lida');
    }
    
    const isValid = errors.length === 0;
    CommonUtils.log(`Validaá§á£o completa: ${isValid ? 'aprovada' : `${errors.length} erros`}`, 
      isValid ? 'info' : 'warning');
    
    return {
      isValid,
      errors
    };
  }
};

// ==================== FORMATAá‡áƒO ====================

/**
 * Funá§áµes de formataá§á£o de dados
 */
const Formatters = {
  
  /**
   * Formata náºmeros para exibiá§á£o
   */
  formatNumber(number, options = {}) {
    if (!number && number !== 0) return '';
    
    const defaults = {
      locale: 'pt-BR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    };
    
    const config = { ...defaults, ...options };
    
    try {
      const formatted = Number(number).toLocaleString(config.locale, {
        minimumFractionDigits: config.minimumFractionDigits,
        maximumFractionDigits: config.maximumFractionDigits
      });
      
      CommonUtils.log(`Formatando náºmero ${number} -> ${formatted}`, 'debug');
      return formatted;
      
    } catch (error) {
      CommonUtils.log(`Erro ao formatar náºmero ${number}: ${error.message}`, 'error');
      return number.toString();
    }
  },
  
  /**
   * Formata endereá§o para exibiá§á£o
   */
  formatAddress(address, startChars = 8, endChars = 6) {
    if (!address || !Validators.isValidAddress(address)) return '';
    
    if (address.length <= startChars + endChars + 2) {
      return address; // Endereá§o muito curto para truncar
    }
    
    const formatted = `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
    CommonUtils.log(`Formatando endereá§o ${address} -> ${formatted}`, 'debug');
    
    return formatted;
  },
  
  /**
   * Formata hash de transaá§á£o
   */
  formatTxHash(hash, startChars = 10, endChars = 8) {
    return this.formatAddress(hash, startChars, endChars);
  },
  
  /**
   * Formata timestamp para data
   */
  formatDate(timestamp, options = {}) {
    if (!timestamp) return '';
    
    const defaults = {
      locale: 'pt-BR',
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const config = { ...defaults, ...options };
    
    try {
      const date = new Date(timestamp);
      const formatted = date.toLocaleString(config.locale, config);
      
      CommonUtils.log(`Formatando data ${timestamp} -> ${formatted}`, 'debug');
      return formatted;
      
    } catch (error) {
      CommonUtils.log(`Erro ao formatar data ${timestamp}: ${error.message}`, 'error');
      return timestamp.toString();
    }
  },
  
  /**
   * Formata bytes para tamanho legá­vel
   */
  formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    const formatted = `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
    CommonUtils.log(`Formatando bytes ${bytes} -> ${formatted}`, 'debug');
    
    return formatted;
  },
  
  /**
   * Formata tempo de duraá§á£o
   */
  formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
};

// ==================== UTILITáRIOS DE UI ====================

/**
 * Funá§áµes para interface do usuá¡rio
 */
const UIUtils = {
  
  /**
   * Mostra toast de notificaá§á£o
   */
  showToast(message, type = 'info', duration = 5000) {
    CommonUtils.log(`Mostrando toast: ${type} - ${message}`, 'debug', 'UI');
    
    const toastId = `toast-${Date.now()}`;
    const typeClasses = {
      success: 'bg-success text-white',
      error: 'bg-danger text-white',
      warning: 'bg-warning text-dark',
      info: 'bg-info text-white'
    };
    
    const icons = {
      success: 'bi-check-circle',
      error: 'bi-x-circle',
      warning: 'bi-exclamation-triangle',
      info: 'bi-info-circle'
    };
    
    const toastClass = typeClasses[type] || typeClasses.info;
    const iconClass = icons[type] || icons.info;
    
    // Criar container de toasts se ná£o existir
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }
    
    // Criar toast
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast show ${toastClass}`;
    toast.innerHTML = `
      <div class="toast-body d-flex align-items-center">
        <i class="bi ${iconClass} me-2"></i>
        <span class="flex-grow-1">${message}</span>
        <button type="button" class="btn-close btn-close-white ms-2" onclick="this.closest('.toast').remove()"></button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remover
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, duration);
    }
    
    return toastId;
  },
  
  /**
   * Mostra modal de confirmaá§á£o
   */
  showConfirmModal(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
    return new Promise((resolve) => {
      const modalId = `confirm-modal-${Date.now()}`;
      
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = modalId;
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-question-circle text-warning me-2"></i>${title}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="${modalId}-cancel">
                ${cancelText}
              </button>
              <button type="button" class="btn btn-primary" id="${modalId}-confirm">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
      
      // Event listeners
      document.getElementById(`${modalId}-confirm`).onclick = () => {
        bootstrapModal.hide();
        resolve(true);
      };
      
      document.getElementById(`${modalId}-cancel`).onclick = () => {
        bootstrapModal.hide();
        resolve(false);
      };
      
      // Remover modal quando fechado
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
      });
      
      CommonUtils.log(`Modal de confirmaá§á£o criado: ${title}`, 'debug', 'UI');
    });
  },
  
  /**
   * Mostra loading em elemento
   */
  showLoading(element, text = 'Carregando...') {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    
    if (!element) return;
    
    const originalContent = element.innerHTML;
    element.setAttribute('data-original-content', originalContent);
    
    element.innerHTML = `
      <div class="d-flex align-items-center justify-content-center">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        <span>${text}</span>
      </div>
    `;
    
    element.disabled = true;
    
    CommonUtils.log(`Loading mostrado em elemento: ${element.id || 'sem id'}`, 'debug', 'UI');
  },
  
  /**
   * Remove loading de elemento
   */
  hideLoading(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    
    if (!element) return;
    
    const originalContent = element.getAttribute('data-original-content');
    if (originalContent) {
      element.innerHTML = originalContent;
      element.removeAttribute('data-original-content');
    }
    
    element.disabled = false;
    
    CommonUtils.log(`Loading removido de elemento: ${element.id || 'sem id'}`, 'debug', 'UI');
  },
  
  /**
   * Atualiza progresso em barra
   */
  updateProgress(elementId, percentage, text = '') {
    const progressBar = document.getElementById(elementId);
    if (!progressBar) return;
    
    progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    
    if (text) {
      progressBar.textContent = text;
    }
    
    CommonUtils.log(`Progresso atualizado: ${elementId} -> ${percentage}%`, 'debug', 'UI');
  },
  
  /**
   * Copia texto para clipboard
   */
  async copyToClipboard(text, showFeedback = true) {
    try {
      await navigator.clipboard.writeText(text);
      
      if (showFeedback) {
        this.showToast('Copiado para á¡rea de transferáªncia!', 'success', 2000);
      }
      
      CommonUtils.log(`Texto copiado: ${text.substring(0, 20)}...`, 'debug', 'UI');
      return true;
      
    } catch (error) {
      CommonUtils.log(`Erro ao copiar: ${error.message}`, 'error', 'UI');
      
      if (showFeedback) {
        this.showToast('Erro ao copiar texto', 'error');
      }
      
      return false;
    }
  }
};

// ==================== UTILITáRIOS GERAIS ====================

/**
 * Funá§áµes utilitá¡rias gerais
 */
const GeneralUtils = {
  
  /**
   * Pausa execuá§á£o por tempo especificado
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Debounce - executa funá§á£o apenas apá³s perá­odo de inatividade
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  /**
   * Throttle - limita execuá§áµes de funá§á£o por perá­odo
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  /**
   * Gera ID áºnico
   */
  generateId(prefix = 'id') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`;
  },
  
  /**
   * Remove acentos de string
   */
  removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },
  
  /**
   * Capitaliza primeira letra
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  /**
   * Converte para slug (URL-friendly)
   */
  toSlug(str) {
    return this.removeAccents(str)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
  
  /**
   * Verifica se objeto está¡ vazio
   */
  isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
  },
  
  /**
   * Deep clone de objeto
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }
  },
  
  /**
   * Retry com backoff exponencial
   */
  async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        CommonUtils.log(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`, 'warning');
        
        await this.sleep(delay);
      }
    }
  }
};

// ==================== INICIALIZAá‡áƒO ====================

document.addEventListener('DOMContentLoaded', function() {
  CommonUtils.log('Common Utilities carregado e pronto', 'info');
  
  // Configurar handlers globais de erro
  window.addEventListener('unhandledrejection', (event) => {
    CommonUtils.log(`Promise rejeitada: ${event.reason}`, 'error');
  });
  
  // Adicionar CSS para toasts se ná£o existir
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast {
        min-width: 300px;
        max-width: 500px;
        margin-bottom: 10px;
      }
      .toast .btn-close-white {
        filter: brightness(0) invert(1);
      }
      .spinner-border.spinning {
        animation: spinner-border 0.75s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }
});

// ==================== EXPORTS GLOBAIS ====================

// Disponibilizar má³dulos globalmente
window.CommonUtils = CommonUtils;
window.Validators = Validators;
window.Formatters = Formatters;
window.UIUtils = UIUtils;
window.GeneralUtils = GeneralUtils;

// Funá§áµes de conveniáªncia globais
window.showToast = UIUtils.showToast.bind(UIUtils);
window.showConfirmModal = UIUtils.showConfirmModal.bind(UIUtils);
window.copyToClipboard = UIUtils.copyToClipboard.bind(UIUtils);
window.formatNumber = Formatters.formatNumber.bind(Formatters);
window.formatAddress = Formatters.formatAddress.bind(Formatters);
window.validateTokenData = Validators.validateTokenData.bind(Validators);

CommonUtils.log('Common Utilities inicializado e exportado', 'success');




