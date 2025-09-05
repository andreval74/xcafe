// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UniversalSaleContract
 * @dev Contrato universal de venda com comissão automática de 2%
 * 
 * 🎯 FUNCIONALIDADES:
 * - Venda de qualquer token ERC-20
 * - Comissão automática de 2% para plataforma
 * - Suporte a múltiplas moedas de pagamento
 * - Sistema de aprovação simplificado
 * - Logs detalhados para auditoria
 * 
 * 💰 FUNCIONAMENTO:
 * 1. Dono do token faz approve para este contrato
 * 2. Comprador paga em token aceito (USDT, BUSD, etc)
 * 3. Contrato transfere 98% para vendedor, 2% para plataforma
 * 4. Token é transferido para comprador
 */

contract UniversalSaleContract is ReentrancyGuard, Ownable {
    
    // ==================== ESTRUTURAS ====================
    
    struct SaleConfig {
        address tokenAddress;      // Endereço do token sendo vendido
        address paymentToken;      // Token aceito como pagamento (USDT, BUSD, etc)
        address seller;            // Endereço do vendedor
        uint256 tokenPrice;        // Preço por token (em wei do payment token)
        uint256 minPurchase;       // Compra mínima
        uint256 maxPurchase;       // Compra máxima
        bool isActive;             // Se a venda está ativa
        uint256 totalSold;         // Total vendido até agora
        uint256 createdAt;         // Timestamp de criação
    }
    
    struct Commission {
        address platformWallet;    // Carteira que recebe comissão
        uint256 rate;             // Taxa de comissão (200 = 2%)
        uint256 totalCollected;   // Total coletado em comissões
    }
    
    // ==================== VARIÁVEIS DE ESTADO ====================
    
    // Configuração de comissão (2% = 200 basis points)
    Commission public commission = Commission({
        platformWallet: address(0),
        rate: 200,
        totalCollected: 0
    });
    
    // Base para cálculos de porcentagem (10000 = 100%)
    uint256 public constant BASIS_POINTS = 10000;
    
    // Mapping de configurações de venda por ID
    mapping(bytes32 => SaleConfig) public sales;
    
    // Mapping de vendas por seller
    mapping(address => bytes32[]) public sellerSales;
    
    // Tokens de pagamento aceitos
    mapping(address => bool) public acceptedPaymentTokens;
    
    // Contador de vendas
    uint256 public totalSales;
    
    // ==================== EVENTOS ====================
    
    event SaleCreated(
        bytes32 indexed saleId,
        address indexed seller,
        address indexed tokenAddress,
        address paymentToken,
        uint256 tokenPrice
    );
    
    event TokensPurchased(
        bytes32 indexed saleId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenAmount,
        uint256 paymentAmount,
        uint256 commission
    );
    
    event SaleStatusChanged(
        bytes32 indexed saleId,
        bool isActive
    );
    
    event CommissionWithdrawn(
        address indexed token,
        uint256 amount,
        address indexed to
    );
    
    event PaymentTokenUpdated(
        address indexed token,
        bool accepted
    );
    
    // ==================== MODIFICADORES ====================
    
    modifier onlyActiveSale(bytes32 saleId) {
        require(sales[saleId].isActive, "Venda nao esta ativa");
        _;
    }
    
    modifier onlyValidSale(bytes32 saleId) {
        require(sales[saleId].seller != address(0), "Venda nao existe");
        _;
    }
    
    modifier onlySeller(bytes32 saleId) {
        require(sales[saleId].seller == msg.sender, "Apenas o vendedor pode executar");
        _;
    }
    
    // ==================== CONSTRUTOR ====================
    
    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Carteira da plataforma invalida");
        
        commission.platformWallet = _platformWallet;
        
        // Configurar tokens de pagamento padrão
        // USDT na BSC
        acceptedPaymentTokens[0x55d398326f99059fF775485246999027B3197955] = true;
        // BUSD na BSC  
        acceptedPaymentTokens[0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56] = true;
        // USDT na Ethereum
        acceptedPaymentTokens[0xdAC17F958D2ee523a2206206994597C13D831ec7] = true;
    }
    
    // ==================== FUNÇÕES DE CONFIGURAÇÃO ====================
    
    /**
     * @dev Cria nova configuração de venda
     * @param tokenAddress Endereço do token a ser vendido
     * @param paymentToken Token aceito como pagamento
     * @param tokenPrice Preço por token
     * @param minPurchase Compra mínima
     * @param maxPurchase Compra máxima
     */
    function createSale(
        address tokenAddress,
        address paymentToken,
        uint256 tokenPrice,
        uint256 minPurchase,
        uint256 maxPurchase
    ) external returns (bytes32 saleId) {
        require(tokenAddress != address(0), "Token address invalido");
        require(acceptedPaymentTokens[paymentToken], "Token de pagamento nao aceito");
        require(tokenPrice > 0, "Preco deve ser maior que zero");
        require(minPurchase <= maxPurchase, "Compra minima deve ser menor ou igual a maxima");
        
        // Gerar ID único para a venda
        saleId = keccak256(abi.encodePacked(
            msg.sender,
            tokenAddress,
            paymentToken,
            block.timestamp,
            totalSales
        ));
        
        // Verificar se venda já existe
        require(sales[saleId].seller == address(0), "Venda ja existe");
        
        // Criar configuração de venda
        sales[saleId] = SaleConfig({
            tokenAddress: tokenAddress,
            paymentToken: paymentToken,
            seller: msg.sender,
            tokenPrice: tokenPrice,
            minPurchase: minPurchase,
            maxPurchase: maxPurchase,
            isActive: true,
            totalSold: 0,
            createdAt: block.timestamp
        });
        
        // Adicionar às vendas do seller
        sellerSales[msg.sender].push(saleId);
        totalSales++;
        
        emit SaleCreated(saleId, msg.sender, tokenAddress, paymentToken, tokenPrice);
        
        return saleId;
    }
    
    /**
     * @dev Atualiza status da venda
     */
    function setSaleStatus(bytes32 saleId, bool isActive) 
        external 
        onlyValidSale(saleId) 
        onlySeller(saleId) 
    {
        sales[saleId].isActive = isActive;
        emit SaleStatusChanged(saleId, isActive);
    }
    
    /**
     * @dev Atualiza preço do token
     */
    function updateTokenPrice(bytes32 saleId, uint256 newPrice) 
        external 
        onlyValidSale(saleId) 
        onlySeller(saleId) 
    {
        require(newPrice > 0, "Preco deve ser maior que zero");
        sales[saleId].tokenPrice = newPrice;
    }
    
    // ==================== FUNÇÕES DE COMPRA ====================
    
    /**
     * @dev Compra tokens da venda configurada
     * @param saleId ID da configuração de venda
     * @param tokenAmount Quantidade de tokens a comprar
     */
    function purchaseTokens(bytes32 saleId, uint256 tokenAmount) 
        external 
        nonReentrant 
        onlyValidSale(saleId) 
        onlyActiveSale(saleId) 
    {
        SaleConfig storage sale = sales[saleId];
        
        require(tokenAmount >= sale.minPurchase, "Quantidade menor que o minimo");
        require(tokenAmount <= sale.maxPurchase, "Quantidade maior que o maximo");
        
        // Calcular valores
        uint256 totalPayment = tokenAmount * sale.tokenPrice / 1e18;
        uint256 commissionAmount = totalPayment * commission.rate / BASIS_POINTS;
        uint256 sellerAmount = totalPayment - commissionAmount;
        
        // Verificar allowances
        IERC20 paymentToken = IERC20(sale.paymentToken);
        IERC20 saleToken = IERC20(sale.tokenAddress);
        
        require(
            paymentToken.allowance(msg.sender, address(this)) >= totalPayment,
            "Allowance insuficiente do token de pagamento"
        );
        
        require(
            saleToken.allowance(sale.seller, address(this)) >= tokenAmount,
            "Allowance insuficiente do token de venda"
        );
        
        // Executar transferências
        // 1. Receber pagamento do comprador
        require(
            paymentToken.transferFrom(msg.sender, address(this), totalPayment),
            "Falha na transferencia do pagamento"
        );
        
        // 2. Transferir para vendedor (98%)
        require(
            paymentToken.transfer(sale.seller, sellerAmount),
            "Falha na transferencia para vendedor"
        );
        
        // 3. Transferir comissão para plataforma (2%)
        require(
            paymentToken.transfer(commission.platformWallet, commissionAmount),
            "Falha na transferencia da comissao"
        );
        
        // 4. Transferir tokens para comprador
        require(
            saleToken.transferFrom(sale.seller, msg.sender, tokenAmount),
            "Falha na transferencia dos tokens"
        );
        
        // Atualizar estatísticas
        sale.totalSold += tokenAmount;
        commission.totalCollected += commissionAmount;
        
        emit TokensPurchased(
            saleId,
            msg.sender,
            sale.seller,
            tokenAmount,
            totalPayment,
            commissionAmount
        );
    }
    
    // ==================== FUNÇÕES ADMINISTRATIVAS ====================
    
    /**
     * @dev Adiciona/remove token de pagamento aceito
     */
    function setPaymentToken(address token, bool accepted) external onlyOwner {
        require(token != address(0), "Token address invalido");
        acceptedPaymentTokens[token] = accepted;
        emit PaymentTokenUpdated(token, accepted);
    }
    
    /**
     * @dev Atualiza carteira da plataforma
     */
    function setPlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Carteira invalida");
        commission.platformWallet = newWallet;
    }
    
    /**
     * @dev Atualiza taxa de comissão
     */
    function setCommissionRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Taxa maxima eh 10%"); // 10% = 1000 basis points
        commission.rate = newRate;
    }
    
    /**
     * @dev Função de emergência para retirar tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Token address invalido");
        
        IERC20(token).transfer(owner(), amount);
        emit CommissionWithdrawn(token, amount, owner());
    }
    
    // ==================== FUNÇÕES DE CONSULTA ====================
    
    /**
     * @dev Obtém informações da venda
     */
    function getSaleInfo(bytes32 saleId) external view returns (SaleConfig memory) {
        return sales[saleId];
    }
    
    /**
     * @dev Obtém vendas de um seller
     */
    function getSellerSales(address seller) external view returns (bytes32[] memory) {
        return sellerSales[seller];
    }
    
    /**
     * @dev Calcula valores de uma compra
     */
    function calculatePurchase(bytes32 saleId, uint256 tokenAmount) 
        external 
        view 
        returns (uint256 totalPayment, uint256 commissionAmount, uint256 sellerAmount) 
    {
        SaleConfig memory sale = sales[saleId];
        require(sale.seller != address(0), "Venda nao existe");
        
        totalPayment = tokenAmount * sale.tokenPrice / 1e18;
        commissionAmount = totalPayment * commission.rate / BASIS_POINTS;
        sellerAmount = totalPayment - commissionAmount;
    }
    
    /**
     * @dev Verifica se token de pagamento é aceito
     */
    function isPaymentTokenAccepted(address token) external view returns (bool) {
        return acceptedPaymentTokens[token];
    }
    
    /**
     * @dev Obtém estatísticas da comissão
     */
    function getCommissionStats() external view returns (Commission memory) {
        return commission;
    }
    
    /**
     * @dev Obtém estatísticas gerais
     */
    function getGeneralStats() external view returns (
        uint256 _totalSales,
        uint256 _totalCommissionCollected,
        address _platformWallet,
        uint256 _commissionRate
    ) {
        return (
            totalSales,
            commission.totalCollected,
            commission.platformWallet,
            commission.rate
        );
    }
}
