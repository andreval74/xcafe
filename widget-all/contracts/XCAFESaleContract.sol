// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title XCAFESaleContract
 * @dev Smart contract para sistema de cobrança XCAFE com comissão de 2%
 */
contract XCAFESaleContract is ReentrancyGuard, Ownable, Pausable {
    IERC20 public immutable usdtToken;
    
    // Configurações
    uint256 public constant COMMISSION_RATE = 200; // 2% = 200 basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    // Endereços
    address public treasuryWallet;
    address public backendWallet;
    
    // Estruturas
    struct Purchase {
        address buyer;
        uint256 amount;
        uint256 commission;
        uint256 timestamp;
        string operationTag;
        bool processed;
    }
    
    struct CreditPackage {
        uint256 credits;
        uint256 price; // em USDT (6 decimais)
        bool active;
    }
    
    // Mapeamentos
    mapping(uint256 => Purchase) public purchases;
    mapping(string => bool) public usedOperationTags;
    mapping(uint256 => CreditPackage) public creditPackages;
    mapping(address => uint256) public userCredits;
    
    // Contadores
    uint256 public purchaseCounter;
    uint256 public packageCounter;
    
    // Eventos
    event PurchaseCreated(
        uint256 indexed purchaseId,
        address indexed buyer,
        uint256 amount,
        uint256 commission,
        string operationTag
    );
    
    event PurchaseProcessed(
        uint256 indexed purchaseId,
        address indexed buyer,
        uint256 credits
    );
    
    event CreditPackageCreated(
        uint256 indexed packageId,
        uint256 credits,
        uint256 price
    );
    
    event CreditPackageUpdated(
        uint256 indexed packageId,
        uint256 credits,
        uint256 price,
        bool active
    );
    
    event CreditsAdded(
        address indexed user,
        uint256 amount
    );
    
    event CreditsUsed(
        address indexed user,
        uint256 amount,
        string service
    );
    
    event CommissionWithdrawn(
        address indexed to,
        uint256 amount
    );
    
    // Modificadores
    modifier onlyBackend() {
        require(msg.sender == backendWallet, "Only backend can call this");
        _;
    }
    
    modifier validOperationTag(string memory _tag) {
        require(bytes(_tag).length > 0, "Operation tag cannot be empty");
        require(!usedOperationTags[_tag], "Operation tag already used");
        _;
    }
    
    constructor(
        address _usdtToken,
        address _treasuryWallet,
        address _backendWallet
    ) {
        require(_usdtToken != address(0), "Invalid USDT token address");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        require(_backendWallet != address(0), "Invalid backend wallet");
        
        usdtToken = IERC20(_usdtToken);
        treasuryWallet = _treasuryWallet;
        backendWallet = _backendWallet;
        
        // Criar pacotes de crédito padrão
        _createCreditPackage(100, 10 * 10**6); // 100 créditos por $10
        _createCreditPackage(500, 45 * 10**6); // 500 créditos por $45 (10% desconto)
        _createCreditPackage(1000, 80 * 10**6); // 1000 créditos por $80 (20% desconto)
        _createCreditPackage(5000, 350 * 10**6); // 5000 créditos por $350 (30% desconto)
    }
    
    /**
     * @dev Comprar créditos com USDT
     */
    function purchaseCredits(
        uint256 _packageId,
        string memory _operationTag
    ) external nonReentrant whenNotPaused validOperationTag(_operationTag) {
        require(_packageId > 0 && _packageId <= packageCounter, "Invalid package ID");
        
        CreditPackage memory package = creditPackages[_packageId];
        require(package.active, "Package not active");
        
        uint256 totalAmount = package.price;
        uint256 commission = (totalAmount * COMMISSION_RATE) / BASIS_POINTS;
        uint256 netAmount = totalAmount - commission;
        
        // Transferir USDT do comprador
        require(
            usdtToken.transferFrom(msg.sender, address(this), totalAmount),
            "USDT transfer failed"
        );
        
        // Transferir valor líquido para o treasury
        require(
            usdtToken.transfer(treasuryWallet, netAmount),
            "Treasury transfer failed"
        );
        
        // Criar registro de compra
        purchaseCounter++;
        purchases[purchaseCounter] = Purchase({
            buyer: msg.sender,
            amount: totalAmount,
            commission: commission,
            timestamp: block.timestamp,
            operationTag: _operationTag,
            processed: false
        });
        
        // Marcar tag como usada
        usedOperationTags[_operationTag] = true;
        
        emit PurchaseCreated(
            purchaseCounter,
            msg.sender,
            totalAmount,
            commission,
            _operationTag
        );
    }
    
    /**
     * @dev Processar compra e adicionar créditos (apenas backend)
     */
    function processPurchase(
        uint256 _purchaseId,
        uint256 _packageId
    ) external onlyBackend {
        require(_purchaseId > 0 && _purchaseId <= purchaseCounter, "Invalid purchase ID");
        require(_packageId > 0 && _packageId <= packageCounter, "Invalid package ID");
        
        Purchase storage purchase = purchases[_purchaseId];
        require(!purchase.processed, "Purchase already processed");
        
        CreditPackage memory package = creditPackages[_packageId];
        
        // Adicionar créditos ao usuário
        userCredits[purchase.buyer] += package.credits;
        purchase.processed = true;
        
        emit PurchaseProcessed(_purchaseId, purchase.buyer, package.credits);
        emit CreditsAdded(purchase.buyer, package.credits);
    }
    
    /**
     * @dev Usar créditos (apenas backend)
     */
    function useCredits(
        address _user,
        uint256 _amount,
        string memory _service
    ) external onlyBackend {
        require(userCredits[_user] >= _amount, "Insufficient credits");
        
        userCredits[_user] -= _amount;
        
        emit CreditsUsed(_user, _amount, _service);
    }
    
    /**
     * @dev Adicionar créditos manualmente (apenas owner)
     */
    function addCredits(
        address _user,
        uint256 _amount
    ) external onlyOwner {
        userCredits[_user] += _amount;
        
        emit CreditsAdded(_user, _amount);
    }
    
    /**
     * @dev Criar novo pacote de créditos (apenas owner)
     */
    function createCreditPackage(
        uint256 _credits,
        uint256 _price
    ) external onlyOwner {
        _createCreditPackage(_credits, _price);
    }
    
    /**
     * @dev Atualizar pacote de créditos (apenas owner)
     */
    function updateCreditPackage(
        uint256 _packageId,
        uint256 _credits,
        uint256 _price,
        bool _active
    ) external onlyOwner {
        require(_packageId > 0 && _packageId <= packageCounter, "Invalid package ID");
        
        creditPackages[_packageId] = CreditPackage({
            credits: _credits,
            price: _price,
            active: _active
        });
        
        emit CreditPackageUpdated(_packageId, _credits, _price, _active);
    }
    
    /**
     * @dev Sacar comissões acumuladas (apenas owner)
     */
    function withdrawCommissions() external onlyOwner {
        uint256 balance = usdtToken.balanceOf(address(this));
        require(balance > 0, "No commissions to withdraw");
        
        require(
            usdtToken.transfer(owner(), balance),
            "Commission withdrawal failed"
        );
        
        emit CommissionWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Atualizar endereço do treasury (apenas owner)
     */
    function updateTreasuryWallet(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        treasuryWallet = _newTreasury;
    }
    
    /**
     * @dev Atualizar endereço do backend (apenas owner)
     */
    function updateBackendWallet(address _newBackend) external onlyOwner {
        require(_newBackend != address(0), "Invalid backend address");
        backendWallet = _newBackend;
    }
    
    /**
     * @dev Pausar/despausar contrato (apenas owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Função interna para criar pacote de créditos
     */
    function _createCreditPackage(
        uint256 _credits,
        uint256 _price
    ) internal {
        require(_credits > 0, "Credits must be greater than 0");
        require(_price > 0, "Price must be greater than 0");
        
        packageCounter++;
        creditPackages[packageCounter] = CreditPackage({
            credits: _credits,
            price: _price,
            active: true
        });
        
        emit CreditPackageCreated(packageCounter, _credits, _price);
    }
    
    /**
     * @dev Obter informações de compra
     */
    function getPurchaseInfo(uint256 _purchaseId) external view returns (
        address buyer,
        uint256 amount,
        uint256 commission,
        uint256 timestamp,
        string memory operationTag,
        bool processed
    ) {
        require(_purchaseId > 0 && _purchaseId <= purchaseCounter, "Invalid purchase ID");
        
        Purchase memory purchase = purchases[_purchaseId];
        return (
            purchase.buyer,
            purchase.amount,
            purchase.commission,
            purchase.timestamp,
            purchase.operationTag,
            purchase.processed
        );
    }
    
    /**
     * @dev Obter informações de pacote de créditos
     */
    function getCreditPackageInfo(uint256 _packageId) external view returns (
        uint256 credits,
        uint256 price,
        bool active
    ) {
        require(_packageId > 0 && _packageId <= packageCounter, "Invalid package ID");
        
        CreditPackage memory package = creditPackages[_packageId];
        return (package.credits, package.price, package.active);
    }
    
    /**
     * @dev Obter saldo de créditos do usuário
     */
    function getUserCredits(address _user) external view returns (uint256) {
        return userCredits[_user];
    }
    
    /**
     * @dev Obter saldo de comissões acumuladas
     */
    function getAccumulatedCommissions() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }
    
    /**
     * @dev Verificar se tag de operação foi usada
     */
    function isOperationTagUsed(string memory _tag) external view returns (bool) {
        return usedOperationTags[_tag];
    }
    
    /**
     * @dev Obter lista de pacotes ativos
     */
    function getActivePackages() external view returns (uint256[] memory) {
        uint256[] memory activePackages = new uint256[](packageCounter);
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= packageCounter; i++) {
            if (creditPackages[i].active) {
                activePackages[activeCount] = i;
                activeCount++;
            }
        }
        
        // Redimensionar array
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activePackages[i];
        }
        
        return result;
    }
}