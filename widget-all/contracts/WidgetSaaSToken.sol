// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title WidgetSaaSToken
 * @dev Token ERC20 com funcionalidades avançadas para Widget SaaS
 * Inclui: Venda direta, controle de acesso, pause/unpause, queima de tokens
 */
contract WidgetSaaSToken is ERC20, ERC20Burnable, Pausable, Ownable, ReentrancyGuard {
    
    // Eventos
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event SaleStatusChanged(bool isActive);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event WhitelistUpdated(address indexed user, bool status);
    
    // Variáveis de estado
    uint256 public tokenPrice; // Preço em wei por token
    bool public saleActive;
    uint256 public maxSupply;
    uint256 public totalSold;
    uint256 public maxPurchaseAmount;
    uint256 public minPurchaseAmount;
    
    // Mapping para whitelist
    mapping(address => bool) public whitelist;
    bool public whitelistRequired;
    
    // Estrutura para rastrear compras
    struct Purchase {
        address buyer;
        uint256 amount;
        uint256 cost;
        uint256 timestamp;
        bytes32 txHash;
    }
    
    Purchase[] public purchases;
    mapping(address => uint256[]) public userPurchases;
    
    /**
     * @dev Constructor
     * @param name Nome do token
     * @param symbol Símbolo do token
     * @param initialSupply Fornecimento inicial
     * @param _tokenPrice Preço inicial do token em wei
     * @param _maxSupply Fornecimento máximo
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _tokenPrice,
        uint256 _maxSupply
    ) ERC20(name, symbol) {
        require(_maxSupply > 0, "Max supply must be greater than 0");
        require(_tokenPrice > 0, "Token price must be greater than 0");
        require(initialSupply <= _maxSupply, "Initial supply exceeds max supply");
        
        maxSupply = _maxSupply * 10**decimals();
        tokenPrice = _tokenPrice;
        saleActive = true;
        whitelistRequired = false;
        
        maxPurchaseAmount = 1000 * 10**decimals(); // 1000 tokens máximo por compra
        minPurchaseAmount = 1 * 10**decimals(); // 1 token mínimo por compra
        
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply * 10**decimals());
        }
    }
    
    /**
     * @dev Modifier para verificar se a venda está ativa
     */
    modifier saleIsActive() {
        require(saleActive, "Sale is not active");
        _;
    }
    
    /**
     * @dev Modifier para verificar whitelist
     */
    modifier onlyWhitelisted() {
        if (whitelistRequired) {
            require(whitelist[msg.sender], "Address not whitelisted");
        }
        _;
    }
    
    /**
     * @dev Comprar tokens enviando BNB/ETH
     */
    function buyTokens() external payable nonReentrant whenNotPaused saleIsActive onlyWhitelisted {
        require(msg.value > 0, "Must send BNB/ETH to buy tokens");
        
        uint256 tokenAmount = (msg.value * 10**decimals()) / tokenPrice;
        
        require(tokenAmount >= minPurchaseAmount, "Purchase amount too low");
        require(tokenAmount <= maxPurchaseAmount, "Purchase amount too high");
        require(totalSupply() + tokenAmount <= maxSupply, "Would exceed max supply");
        
        // Mint tokens para o comprador
        _mint(msg.sender, tokenAmount);
        
        // Atualizar estatísticas
        totalSold += tokenAmount;
        
        // Registrar compra
        bytes32 txHash = keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenAmount));
        purchases.push(Purchase({
            buyer: msg.sender,
            amount: tokenAmount,
            cost: msg.value,
            timestamp: block.timestamp,
            txHash: txHash
        }));
        
        userPurchases[msg.sender].push(purchases.length - 1);
        
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }
    
    /**
     * @dev Definir preço do token (apenas owner)
     */
    function setTokenPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        uint256 oldPrice = tokenPrice;
        tokenPrice = _newPrice;
        emit PriceUpdated(oldPrice, _newPrice);
    }
    
    /**
     * @dev Ativar/desativar venda (apenas owner)
     */
    function setSaleActive(bool _active) external onlyOwner {
        saleActive = _active;
        emit SaleStatusChanged(_active);
    }
    
    /**
     * @dev Definir quantidades mínima e máxima de compra
     */
    function setPurchaseLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(_min > 0, "Min amount must be greater than 0");
        require(_max > _min, "Max amount must be greater than min");
        minPurchaseAmount = _min;
        maxPurchaseAmount = _max;
    }
    
    /**
     * @dev Ativar/desativar whitelist
     */
    function setWhitelistRequired(bool _required) external onlyOwner {
        whitelistRequired = _required;
    }
    
    /**
     * @dev Adicionar/remover endereços da whitelist
     */
    function updateWhitelist(address[] calldata addresses, bool status) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = status;
            emit WhitelistUpdated(addresses[i], status);
        }
    }
    
    /**
     * @dev Pausar contrato (apenas owner)
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Despausar contrato (apenas owner)
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Sacar fundos do contrato (apenas owner)
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Sacar fundos parciais (apenas owner)
     */
    function withdrawPartialFunds(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient balance");
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Mint tokens adicionais (apenas owner)
     */
    function mintTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Obter histórico de compras de um usuário
     */
    function getUserPurchases(address user) external view returns (uint256[] memory) {
        return userPurchases[user];
    }
    
    /**
     * @dev Obter detalhes de uma compra específica
     */
    function getPurchaseDetails(uint256 index) external view returns (Purchase memory) {
        require(index < purchases.length, "Purchase index out of bounds");
        return purchases[index];
    }
    
    /**
     * @dev Obter total de compras realizadas
     */
    function getTotalPurchases() external view returns (uint256) {
        return purchases.length;
    }
    
    /**
     * @dev Calcular quantidade de tokens por valor em BNB/ETH
     */
    function calculateTokenAmount(uint256 bnbAmount) external view returns (uint256) {
        require(bnbAmount > 0, "Amount must be greater than 0");
        return (bnbAmount * 10**decimals()) / tokenPrice;
    }
    
    /**
     * @dev Calcular custo em BNB/ETH para quantidade de tokens
     */
    function calculateBNBCost(uint256 tokenAmount) external view returns (uint256) {
        require(tokenAmount > 0, "Amount must be greater than 0");
        return (tokenAmount * tokenPrice) / 10**decimals();
    }
    
    /**
     * @dev Obter informações do contrato
     */
    function getContractInfo() external view returns (
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint256 _tokenPrice,
        uint256 _totalSold,
        bool _saleActive,
        bool _whitelistRequired,
        uint256 _minPurchase,
        uint256 _maxPurchase
    ) {
        return (
            totalSupply(),
            maxSupply,
            tokenPrice,
            totalSold,
            saleActive,
            whitelistRequired,
            minPurchaseAmount,
            maxPurchaseAmount
        );
    }
    
    /**
     * @dev Override necessário para Pausable
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal whenNotPaused override {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Receber BNB diretamente (chama buyTokens)
     */
    receive() external payable {
        buyTokens();
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        buyTokens();
    }
}

/**
 * @title TokenFactory
 * @dev Factory para criar novos contratos de token
 */
contract TokenFactory is Ownable {
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply,
        uint256 tokenPrice,
        uint256 maxSupply
    );
    
    struct TokenInfo {
        address tokenAddress;
        address creator;
        string name;
        string symbol;
        uint256 createdAt;
        bool isActive;
    }
    
    TokenInfo[] public createdTokens;
    mapping(address => uint256[]) public userTokens;
    mapping(address => bool) public isValidToken;
    
    uint256 public creationFee = 0.01 ether; // Taxa para criar token
    
    /**
     * @dev Criar novo token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 tokenPrice,
        uint256 maxSupply
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        
        // Criar novo contrato de token
        WidgetSaaSToken newToken = new WidgetSaaSToken(
            name,
            symbol,
            initialSupply,
            tokenPrice,
            maxSupply
        );
        
        // Transferir ownership para o criador
        newToken.transferOwnership(msg.sender);
        
        // Registrar token
        createdTokens.push(TokenInfo({
            tokenAddress: address(newToken),
            creator: msg.sender,
            name: name,
            symbol: symbol,
            createdAt: block.timestamp,
            isActive: true
        }));
        
        userTokens[msg.sender].push(createdTokens.length - 1);
        isValidToken[address(newToken)] = true;
        
        emit TokenCreated(
            address(newToken),
            msg.sender,
            name,
            symbol,
            initialSupply,
            tokenPrice,
            maxSupply
        );
        
        return address(newToken);
    }
    
    /**
     * @dev Definir taxa de criação
     */
    function setCreationFee(uint256 _fee) external onlyOwner {
        creationFee = _fee;
    }
    
    /**
     * @dev Obter tokens criados por usuário
     */
    function getUserTokens(address user) external view returns (uint256[] memory) {
        return userTokens[user];
    }
    
    /**
     * @dev Obter total de tokens criados
     */
    function getTotalTokens() external view returns (uint256) {
        return createdTokens.length;
    }
    
    /**
     * @dev Sacar taxas coletadas
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Verificar se endereço é token válido
     */
    function validateToken(address tokenAddress) external view returns (bool) {
        return isValidToken[tokenAddress];
    }
}
