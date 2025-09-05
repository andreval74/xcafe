// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SaleContract
 * @dev Smart contract para sistema de vendas de créditos com comissão de 2%
 */
contract SaleContract is ReentrancyGuard, Ownable, Pausable {
    
    // Estrutura para pacotes de créditos
    struct CreditPackage {
        uint256 id;
        uint256 credits;
        uint256 priceInWei;
        bool active;
        string name;
        string description;
    }
    
    // Estrutura para transações
    struct Transaction {
        address buyer;
        uint256 packageId;
        uint256 credits;
        uint256 amountPaid;
        uint256 commission;
        uint256 timestamp;
        string txHash;
    }
    
    // Variáveis de estado
    uint256 public constant COMMISSION_RATE = 200; // 2% = 200 basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    address public commissionWallet;
    uint256 public totalCommissionCollected;
    uint256 public totalSales;
    uint256 public nextPackageId;
    uint256 public nextTransactionId;
    
    // Mappings
    mapping(uint256 => CreditPackage) public creditPackages;
    mapping(uint256 => Transaction) public transactions;
    mapping(address => uint256[]) public userTransactions;
    mapping(address => uint256) public userTotalCredits;
    
    // Arrays para iteração
    uint256[] public activePackageIds;
    
    // Events
    event PackageCreated(uint256 indexed packageId, uint256 credits, uint256 price, string name);
    event PackageUpdated(uint256 indexed packageId, uint256 credits, uint256 price, bool active);
    event CreditsPurchased(address indexed buyer, uint256 indexed packageId, uint256 credits, uint256 amountPaid, uint256 commission);
    event CommissionWithdrawn(address indexed wallet, uint256 amount);
    event CommissionWalletUpdated(address indexed oldWallet, address indexed newWallet);
    
    // Modifiers
    modifier validPackage(uint256 packageId) {
        require(packageId > 0 && packageId < nextPackageId, "Invalid package ID");
        require(creditPackages[packageId].active, "Package not active");
        _;
    }
    
    modifier onlyCommissionWallet() {
        require(msg.sender == commissionWallet, "Only commission wallet");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _commissionWallet Endereço da carteira que receberá as comissões
     */
    constructor(address _commissionWallet) {
        require(_commissionWallet != address(0), "Invalid commission wallet");
        commissionWallet = _commissionWallet;
        nextPackageId = 1;
        nextTransactionId = 1;
        
        // Criar pacotes padrão
        _createDefaultPackages();
    }
    
    /**
     * @dev Criar pacotes padrão de créditos
     */
    function _createDefaultPackages() internal {
        // Pacote Básico - 100 créditos por 0.01 ETH
        _createPackage(100, 0.01 ether, "Básico", "Pacote básico com 100 créditos");
        
        // Pacote Intermediário - 500 créditos por 0.04 ETH (20% desconto)
        _createPackage(500, 0.04 ether, "Intermediário", "Pacote intermediário com 500 créditos");
        
        // Pacote Avançado - 1000 créditos por 0.07 ETH (30% desconto)
        _createPackage(1000, 0.07 ether, "Avançado", "Pacote avançado com 1000 créditos");
        
        // Pacote Premium - 5000 créditos por 0.3 ETH (40% desconto)
        _createPackage(5000, 0.3 ether, "Premium", "Pacote premium com 5000 créditos");
    }
    
    /**
     * @dev Criar novo pacote de créditos
     * @param credits Quantidade de créditos
     * @param priceInWei Preço em Wei
     * @param name Nome do pacote
     * @param description Descrição do pacote
     */
    function _createPackage(
        uint256 credits,
        uint256 priceInWei,
        string memory name,
        string memory description
    ) internal {
        uint256 packageId = nextPackageId++;
        
        creditPackages[packageId] = CreditPackage({
            id: packageId,
            credits: credits,
            priceInWei: priceInWei,
            active: true,
            name: name,
            description: description
        });
        
        activePackageIds.push(packageId);
        
        emit PackageCreated(packageId, credits, priceInWei, name);
    }
    
    /**
     * @dev Comprar créditos
     * @param packageId ID do pacote de créditos
     */
    function buyCredits(uint256 packageId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validPackage(packageId) 
    {
        CreditPackage memory package = creditPackages[packageId];
        
        require(msg.value >= package.priceInWei, "Insufficient payment");
        
        // Calcular comissão
        uint256 commission = (msg.value * COMMISSION_RATE) / BASIS_POINTS;
        uint256 netAmount = msg.value - commission;
        
        // Registrar transação
        uint256 transactionId = nextTransactionId++;
        transactions[transactionId] = Transaction({
            buyer: msg.sender,
            packageId: packageId,
            credits: package.credits,
            amountPaid: msg.value,
            commission: commission,
            timestamp: block.timestamp,
            txHash: ""
        });
        
        // Atualizar registros do usuário
        userTransactions[msg.sender].push(transactionId);
        userTotalCredits[msg.sender] += package.credits;
        
        // Atualizar totais
        totalCommissionCollected += commission;
        totalSales += msg.value;
        
        // Transferir comissão
        if (commission > 0) {
            (bool commissionSent, ) = commissionWallet.call{value: commission}("");
            require(commissionSent, "Commission transfer failed");
        }
        
        // Transferir valor líquido para o owner
        if (netAmount > 0) {
            (bool ownerSent, ) = owner().call{value: netAmount}("");
            require(ownerSent, "Owner transfer failed");
        }
        
        // Reembolsar excesso se houver
        if (msg.value > package.priceInWei) {
            uint256 excess = msg.value - package.priceInWei;
            (bool excessSent, ) = msg.sender.call{value: excess}("");
            require(excessSent, "Excess refund failed");
        }
        
        emit CreditsPurchased(msg.sender, packageId, package.credits, msg.value, commission);
    }
    
    /**
     * @dev Criar novo pacote (apenas owner)
     */
    function createPackage(
        uint256 credits,
        uint256 priceInWei,
        string memory name,
        string memory description
    ) external onlyOwner {
        require(credits > 0, "Credits must be greater than 0");
        require(priceInWei > 0, "Price must be greater than 0");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        _createPackage(credits, priceInWei, name, description);
    }
    
    /**
     * @dev Atualizar pacote existente (apenas owner)
     */
    function updatePackage(
        uint256 packageId,
        uint256 credits,
        uint256 priceInWei,
        bool active,
        string memory name,
        string memory description
    ) external onlyOwner {
        require(packageId > 0 && packageId < nextPackageId, "Invalid package ID");
        require(credits > 0, "Credits must be greater than 0");
        require(priceInWei > 0, "Price must be greater than 0");
        
        CreditPackage storage package = creditPackages[packageId];
        package.credits = credits;
        package.priceInWei = priceInWei;
        package.active = active;
        package.name = name;
        package.description = description;
        
        emit PackageUpdated(packageId, credits, priceInWei, active);
    }
    
    /**
     * @dev Atualizar carteira de comissão (apenas owner)
     */
    function updateCommissionWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet address");
        address oldWallet = commissionWallet;
        commissionWallet = newWallet;
        
        emit CommissionWalletUpdated(oldWallet, newWallet);
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
     * @dev Sacar fundos de emergência (apenas owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool sent, ) = owner().call{value: balance}("");
        require(sent, "Emergency withdraw failed");
    }
    
    // View functions
    
    /**
     * @dev Obter informações de um pacote
     */
    function getPackage(uint256 packageId) external view returns (CreditPackage memory) {
        require(packageId > 0 && packageId < nextPackageId, "Invalid package ID");
        return creditPackages[packageId];
    }
    
    /**
     * @dev Obter todos os pacotes ativos
     */
    function getActivePackages() external view returns (CreditPackage[] memory) {
        uint256 activeCount = 0;
        
        // Contar pacotes ativos
        for (uint256 i = 0; i < activePackageIds.length; i++) {
            if (creditPackages[activePackageIds[i]].active) {
                activeCount++;
            }
        }
        
        // Criar array com pacotes ativos
        CreditPackage[] memory activePackages = new CreditPackage[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < activePackageIds.length; i++) {
            uint256 packageId = activePackageIds[i];
            if (creditPackages[packageId].active) {
                activePackages[index] = creditPackages[packageId];
                index++;
            }
        }
        
        return activePackages;
    }
    
    /**
     * @dev Obter transações de um usuário
     */
    function getUserTransactions(address user) external view returns (uint256[] memory) {
        return userTransactions[user];
    }
    
    /**
     * @dev Obter detalhes de uma transação
     */
    function getTransaction(uint256 transactionId) external view returns (Transaction memory) {
        require(transactionId > 0 && transactionId < nextTransactionId, "Invalid transaction ID");
        return transactions[transactionId];
    }
    
    /**
     * @dev Obter créditos totais de um usuário
     */
    function getUserCredits(address user) external view returns (uint256) {
        return userTotalCredits[user];
    }
    
    /**
     * @dev Obter estatísticas do contrato
     */
    function getContractStats() external view returns (
        uint256 _totalSales,
        uint256 _totalCommission,
        uint256 _totalPackages,
        uint256 _totalTransactions
    ) {
        return (
            totalSales,
            totalCommissionCollected,
            nextPackageId - 1,
            nextTransactionId - 1
        );
    }
    
    /**
     * @dev Calcular comissão para um valor
     */
    function calculateCommission(uint256 amount) external pure returns (uint256) {
        return (amount * COMMISSION_RATE) / BASIS_POINTS;
    }
    
    /**
     * @dev Verificar se o contrato pode receber Ether
     */
    receive() external payable {
        revert("Direct payments not allowed");
    }
    
    fallback() external payable {
        revert("Function not found");
    }
}