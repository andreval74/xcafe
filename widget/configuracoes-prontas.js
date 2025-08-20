/**
 * š€ xcafe Widget - Configuraá§á£o Simplificada
 * 
 * Este arquivo fornece templates de configuraá§á£o prontos para diferentes cená¡rios.
 * Copie e adapte conforme sua necessidade.
 */

// ==================== CONFIGURAá‡á•ES PRONTAS ====================

/**
 * “¦ CONFIGURAá‡áƒO BáSICA
 * Para comeá§ar rapidamente com configuraá§áµes má­nimas
 */
const CONFIGURACAO_BASICA = {
  containerId: 'xcafe-widget',              // ï¸ ALTERAR: ID do seu container
  contractAddress: '0x...',                  // ï¸ ALTERAR: Seu contrato de token
  tokenPrice: '0.001',                       // ï¸ ALTERAR: Preá§o por token (BNB/ETH)
  receiverWallet: '0x...',                   // ï¸ ALTERAR: Sua carteira para receber pagamentos
  tokenSymbol: 'TOKEN',                      // ï¸ ALTERAR: Sá­mbolo do seu token
  tokenName: 'Meu Token'                     // ï¸ ALTERAR: Nome do seu token
};

/**
 * Ž¨ CONFIGURAá‡áƒO COM TEMA PERSONALIZADO
 * Para um visual mais personalizado
 */
const CONFIGURACAO_PERSONALIZADA = {
  containerId: 'xcafe-widget',
  contractAddress: '0x...',                  // ï¸ ALTERAR
  tokenPrice: '0.001',                       // ï¸ ALTERAR
  receiverWallet: '0x...',                   // ï¸ ALTERAR
  tokenSymbol: 'TOKEN',                      // ï¸ ALTERAR
  tokenName: 'Meu Token',                    // ï¸ ALTERAR
  
  // Customizaá§áµes visuais
  theme: 'light',                            // 'dark' ou 'light'
  showLogo: false,                           // Ocultar logo xcafe
  showPoweredBy: false,                      // Ocultar "Powered by"
};

/**
 * ”§ CONFIGURAá‡áƒO AVANá‡ADA
 * Com todas as opá§áµes disponá­veis
 */
const CONFIGURACAO_AVANCADA = {
  containerId: 'xcafe-widget',
  contractAddress: '0x...',                  // ï¸ ALTERAR
  tokenPrice: '0.001',                       // ï¸ ALTERAR
  receiverWallet: '0x...',                   // ï¸ ALTERAR
  tokenSymbol: 'TOKEN',                      // ï¸ ALTERAR
  tokenName: 'Meu Token',                    // ï¸ ALTERAR
  
  // Limites de compra
  minPurchase: '10',                         // Compra má­nima
  maxPurchase: '10000',                      // Compra má¡xima
  
  // Rede e configuraá§áµes tá©cnicas
  preferredNetwork: 56,                      // 1=Ethereum, 56=BSC
  autoDetectPrice: true,                     // Auto-detectar preá§o do contrato
  gasLimit: 200000,                          // Limite de gas
  
  // Visual
  theme: 'dark',
  showLogo: true,
  showPoweredBy: true
};

/**
 * Œ CONFIGURAá‡á•ES POR REDE
 */

// Para Ethereum Mainnet
const CONFIGURACAO_ETHEREUM = {
  containerId: 'xcafe-widget',
  contractAddress: '0x...',                  // ï¸ Seu contrato ERC-20 no Ethereum
  tokenPrice: '0.001',                       // ï¸ Preá§o em ETH
  receiverWallet: '0x...',                   // ï¸ Sua carteira Ethereum
  tokenSymbol: 'TOKEN',
  tokenName: 'Ethereum Token',
  preferredNetwork: 1,                       // Ethereum Mainnet
  theme: 'dark'
};

// Para BSC (Binance Smart Chain)
const CONFIGURACAO_BSC = {
  containerId: 'xcafe-widget',
  contractAddress: '0x...',                  // ï¸ Seu contrato BEP-20 na BSC
  tokenPrice: '0.001',                       // ï¸ Preá§o em BNB
  receiverWallet: '0x...',                   // ï¸ Sua carteira BSC
  tokenSymbol: 'TOKEN',
  tokenName: 'BSC Token',
  preferredNetwork: 56,                      // BSC Mainnet
  theme: 'dark'
};

// Para Testes (BSC Testnet)
const CONFIGURACAO_TESTE = {
  containerId: 'xcafe-widget',
  contractAddress: '0x...',                  // ï¸ Seu contrato de teste
  tokenPrice: '0.001',                       // ï¸ Preá§o em tBNB
  receiverWallet: '0x...',                   // ï¸ Sua carteira de teste
  tokenSymbol: 'TESTTOKEN',
  tokenName: 'Token de Teste',
  preferredNetwork: 97,                      // BSC Testnet
  theme: 'light',
  minPurchase: '1',                          // Valores baixos para teste
  maxPurchase: '100'
};

// ==================== EXEMPLOS DE IMPLEMENTAá‡áƒO ====================

/**
 * ’» EXEMPLO 1: HTML + JavaScript Inline
 * 
 * Cole este cá³digo no seu HTML:
 */
const EXEMPLO_HTML_INLINE = `
<!DOCTYPE html>
<html>
<head>
    <title>Meu Token - Compre Agora</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div style="max-width: 500px; margin: 50px auto; padding: 20px;">
        <h1>š€ Compre Nosso Token</h1>
        
        <!-- Widget será¡ renderizado aqui -->
        <div id="xcafe-widget"></div>
    </div>

    <!-- Incluir script do widget -->
    <script src="https://cdn.jsdelivr.net/gh/andreval74/xcafe/widget/xcafe-widget.js"></script>
    
    <script>
        // Configurar e inicializar
        xcafeWidget.init({
            containerId: 'xcafe-widget',
            contractAddress: '0x1234567890abcdef1234567890abcdef12345678', // ï¸ SEU CONTRATO
            tokenPrice: '0.001',                                            // ï¸ SEU PREá‡O
            receiverWallet: '0x9876543210fedcba9876543210fedcba98765432',   // ï¸ SUA CARTEIRA
            tokenSymbol: 'MEUTOKEN',                                        // ï¸ SEU SáMBOLO
            tokenName: 'Meu Token Incrá­vel'                                 // ï¸ SEU NOME
        });
    </script>
</body>
</html>
`;

/**
 * âš›ï¸ EXEMPLO 2: React Component
 */
const EXEMPLO_REACT = `
import React, { useEffect } from 'react';

const TokenPurchaseWidget = () => {
  useEffect(() => {
    // Carregar script do widget
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/andreval74/xcafe/widget/xcafe-widget.js';
    script.async = true;
    
    script.onload = () => {
      // Configurar widget apá³s carregar
      window.xcafeWidget.init({
        containerId: 'react-xcafe-widget',
        contractAddress: '0x...', // ï¸ SEU CONTRATO
        tokenPrice: '0.001',       // ï¸ SEU PREá‡O
        receiverWallet: '0x...',   // ï¸ SUA CARTEIRA
        tokenSymbol: 'TOKEN',      // ï¸ SEU SáMBOLO
        tokenName: 'Meu Token'     // ï¸ SEU NOME
      });
    };
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="token-purchase-section">
      <h2>š€ Compre Nosso Token</h2>
      <div id="react-xcafe-widget"></div>
    </div>
  );
};

export default TokenPurchaseWidget;
`;

/**
 * “± EXEMPLO 3: WordPress (Shortcode)
 */
const EXEMPLO_WORDPRESS = `
// No functions.php do seu tema:
function xcafe_widget_shortcode($atts) {
    $atts = shortcode_atts(array(
        'contract' => '',
        'price' => '0.001',
        'wallet' => '',
        'symbol' => 'TOKEN',
        'name' => 'Token',
        'theme' => 'dark'
    ), $atts);
    
    $widget_id = 'xcafe-widget-' . uniqid();
    
    ob_start();
    ?>
    <div id="<?php echo $widget_id; ?>"></div>
    
    <script>
    if (!window.xcafeWidgetLoaded) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/andreval74/xcafe/widget/xcafe-widget.js';
        script.onload = function() {
            initxcafeWidget();
        };
        document.head.appendChild(script);
        window.xcafeWidgetLoaded = true;
    } else {
        initxcafeWidget();
    }
    
    function initxcafeWidget() {
        const widget = new (window.xcafeWidget.constructor)();
        widget.init({
            containerId: '<?php echo $widget_id; ?>',
            contractAddress: '<?php echo esc_js($atts['contract']); ?>',
            tokenPrice: '<?php echo esc_js($atts['price']); ?>',
            receiverWallet: '<?php echo esc_js($atts['wallet']); ?>',
            tokenSymbol: '<?php echo esc_js($atts['symbol']); ?>',
            tokenName: '<?php echo esc_js($atts['name']); ?>',
            theme: '<?php echo esc_js($atts['theme']); ?>'
        });
    }
    </script>
    <?php
    
    return ob_get_clean();
}
add_shortcode('xcafe_widget', 'xcafe_widget_shortcode');

// Uso no WordPress:
// [xcafe_widget contract="0x..." price="0.001" wallet="0x..." symbol="MEUTOKEN" name="Meu Token"]
`;

// ==================== CHECKLIST DE IMPLEMENTAá‡áƒO ====================

/**
 * … CHECKLIST ANTES DE PUBLICAR
 * 
 * Configuraá§á£o:
 * â–¡ Contrato do token está¡ correto e funcionando
 * â–¡ Endereá§o da carteira receptora está¡ correto
 * â–¡ Preá§o do token está¡ definido adequadamente
 * â–¡ Limites má­nimos e má¡ximos configurados (se necessá¡rio)
 * 
 * Testes:
 * â–¡ Testado em rede de teste primeiro (BSC Testnet ou Sepolia)
 * â–¡ Conexá£o com MetaMask funciona
 * â–¡ Cá¡lculo de preá§os está¡ correto
 * â–¡ Transaá§áµes sá£o processadas adequadamente
 * â–¡ Interface responsiva em diferentes dispositivos
 * 
 * Seguraná§a:
 * â–¡ Contrato auditado e seguro
 * â–¡ Endereá§os validados
 * â–¡ Configuraá§áµes de gas adequadas
 * 
 * UX/UI:
 * â–¡ Tema apropriado para seu site
 * â–¡ Mensagens de erro claras
 * â–¡ Loading states funcionando
 * â–¡ Feedback visual adequado
 */

// ==================== EXPORT PARA USO ====================

// Descomente a configuraá§á£o que deseja usar:
// const minhaConfiguracao = CONFIGURACAO_BASICA;
// const minhaConfiguracao = CONFIGURACAO_PERSONALIZADA;
// const minhaConfiguracao = CONFIGURACAO_AVANCADA;
// const minhaConfiguracao = CONFIGURACAO_BSC;
// const minhaConfiguracao = CONFIGURACAO_ETHEREUM;

// Para usar:
// xcafeWidget.init(minhaConfiguracao);

console.log('“‹ Configuraá§áµes xcafe Widget carregadas!');
console.log('’¡ Dica: Adapte as configuraá§áµes acima para seu projeto.');




