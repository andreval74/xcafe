// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title WidgetSaleContract
 * @dev Contrato para vendas de tokens e créditos com pagamento em USDT e comissão de 2%
 */
contract WidgetSaleContract {
    // Endereço da plataforma que recebe comissão
    address public immutable platformWallet;
    
    // Token USDT (configurado no deploy)
    IERC20 public immutable usdtToken;
    
    // Comissão da plataforma (2% = 200 basis points)
    uint256 public constant PLATFORM_FEE = 200; // 2%
    uint256 public constant FEE_BASE = 10000; // 100%
    
    // Estrutura para pacotes de créditos
    struct CreditPackage {
        uint256 id;
        uint256 credits;
        uint256 priceInUSDT; // Preço em USDT (6 decimais)
        bool active;
        string name;
    }
    
    // Estrutura para vendas de tokens
    struct TokenSale {
        address tokenContract;
        address seller;
        uint256 pricePerToken; // Preço por token em USDT (6 decimais)
        uint256 tokensAvailable;
        bool isActive;
        string apiKey;
    }
    
    // Storage
    mapping(uint256 => TokenSale) public tokenSales;
    mapping(uint256 => CreditPackage) public creditPackages;
    mapping(string => bool) public approvedApiKeys;
    mapping(string => address) public apiKeyOwners;
    
    uint256 public nextSaleId = 1;
    uint256 public nextPackageId = 1;
    
    // Eventos
    event SaleCreated(uint256 indexed saleId, address indexed seller, address indexed tokenContract, uint256 pricePerToken, uint256 tokensAvailable, string apiKey);
    event TokensPurchased(uint256 indexed saleId, address indexed buyer, address indexed seller, uint256 tokenAmount, uint256 usdtAmount, uint256 platformFee);
    event CreditsPurchased(uint256 indexed packageId, address indexed buyer, uint256 credits, uint256 usdtAmount, uint256 platformFee, string txHash);
    event ApiKeyApproved(string apiKey, address indexed owner);
    
    constructor(address _platformWallet, address _usdtToken) {
        require(_platformWallet != address(0), "Platform wallet cannot be zero address");
        require(_usdtToken != address(0), "USDT token cannot be zero address");
        
        platformWallet = _platformWallet;
        usdtToken = IERC20(_usdtToken);
        
        _createDefaultPackages();
    }
    
    function _createDefaultPackages() internal {
        creditPackages[1] = CreditPackage({
            id: 1,
            credits: 100,
            priceInUSDT: 10 * 10**6, // $10 USDT
            active: true,
            name: "Basico"
        });
        
        creditPackages[2] = CreditPackage({
            id: 2,
            credits: 500,
            priceInUSDT: 40 * 10**6, // $40 USDT
            active: true,
            name: "Padrao"
        });
        
        creditPackages[3] = CreditPackage({
            id: 3,
            credits: 1000,
            priceInUSDT: 70 * 10**6, // $70 USDT
            active: true,
            name: "Premium"
        });
        
        nextPackageId = 4;
    }
    
    function approveApiKey(string calldata apiKey, address owner) external {
        require(msg.sender == platformWallet, "Only platform can approve API keys");
        require(owner != address(0), "Owner cannot be zero address");
        
        approvedApiKeys[apiKey] = true;
        apiKeyOwners[apiKey] = owner;
        emit ApiKeyApproved(apiKey, owner);
    }
    
    function createTokenSale(
        address tokenContract,
        uint256 pricePerToken,
        uint256 tokensToSell,
        string calldata apiKey
    ) external returns (uint256 saleId) {
        require(approvedApiKeys[apiKey], "Invalid API key");
        require(apiKeyOwners[apiKey] == msg.sender, "Not owner of API key");
        require(tokenContract != address(0), "Token contract cannot be zero address");
        require(pricePerToken > 0, "Price must be greater than zero");
        require(tokensToSell > 0, "Tokens to sell must be greater than zero");
        
        IERC20 token = IERC20(tokenContract);
        require(token.balanceOf(msg.sender) >= tokensToSell, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= tokensToSell, "Insufficient token allowance");
        
        saleId = nextSaleId++;
        
        tokenSales[saleId] = TokenSale({
            tokenContract: tokenContract,
            seller: msg.sender,
            pricePerToken: pricePerToken,
            tokensAvailable: tokensToSell,
            isActive: true,
            apiKey: apiKey
        });
        
        emit SaleCreated(saleId, msg.sender, tokenContract, pricePerToken, tokensToSell, apiKey);
    }
    
    function buyTokens(uint256 saleId, uint256 tokenAmount) external {
        require(tokenAmount > 0, "Token amount must be greater than zero");
        
        TokenSale storage sale = tokenSales[saleId];
        require(sale.isActive, "Sale is not active");
        require(sale.tokensAvailable >= tokenAmount, "Insufficient tokens available");
        
        uint256 totalCost = (tokenAmount * sale.pricePerToken) / 10**18;
        require(totalCost > 0, "Total cost must be greater than zero");
        
        uint256 platformFeeAmount = (totalCost * PLATFORM_FEE) / FEE_BASE;
        uint256 sellerAmount = totalCost - platformFeeAmount;
        
        require(usdtToken.balanceOf(msg.sender) >= totalCost, "Insufficient USDT balance");
        require(usdtToken.allowance(msg.sender, address(this)) >= totalCost, "Insufficient USDT allowance");
        
        require(usdtToken.transferFrom(msg.sender, sale.seller, sellerAmount), "Failed to transfer USDT to seller");
        require(usdtToken.transferFrom(msg.sender, platformWallet, platformFeeAmount), "Failed to transfer platform fee");
        
        IERC20 token = IERC20(sale.tokenContract);
        require(token.transferFrom(sale.seller, msg.sender, tokenAmount), "Failed to transfer tokens");
        
        sale.tokensAvailable -= tokenAmount;
        
        emit TokensPurchased(saleId, msg.sender, sale.seller, tokenAmount, totalCost, platformFeeAmount);
    }
    
    function buyCreditPackage(uint256 packageId, string calldata txHash) external {
        CreditPackage storage package = creditPackages[packageId];
        require(package.active, "Package is not active");
        
        uint256 totalCost = package.priceInUSDT;
        uint256 platformFeeAmount = (totalCost * PLATFORM_FEE) / FEE_BASE;
        
        require(usdtToken.balanceOf(msg.sender) >= totalCost, "Insufficient USDT balance");
        require(usdtToken.allowance(msg.sender, address(this)) >= totalCost, "Insufficient USDT allowance");
        
        require(usdtToken.transferFrom(msg.sender, platformWallet, totalCost), "Failed to transfer USDT");
        
        emit CreditsPurchased(packageId, msg.sender, package.credits, totalCost, platformFeeAmount, txHash);
    }
    
    // View functions
    function getSaleInfo(uint256 saleId) external view returns (
        address tokenContract,
        address seller,
        uint256 pricePerToken,
        uint256 tokensAvailable,
        bool isActive,
        string memory apiKey
    ) {
        TokenSale storage sale = tokenSales[saleId];
        return (sale.tokenContract, sale.seller, sale.pricePerToken, sale.tokensAvailable, sale.isActive, sale.apiKey);
    }
    
    function getPackageInfo(uint256 packageId) external view returns (
        uint256 credits,
        uint256 priceInUSDT,
        bool active,
        string memory name
    ) {
        CreditPackage storage package = creditPackages[packageId];
        return (package.credits, package.priceInUSDT, package.active, package.name);
    }
    
    function calculateTokenCost(uint256 saleId, uint256 tokenAmount) external view returns (
        uint256 totalCost,
        uint256 platformFee,
        uint256 sellerAmount
    ) {
        TokenSale storage sale = tokenSales[saleId];
        totalCost = (tokenAmount * sale.pricePerToken) / 10**18;
        platformFee = (totalCost * PLATFORM_FEE) / FEE_BASE;
        sellerAmount = totalCost - platformFee;
    }
    
    function getAllPackages() external view returns (CreditPackage[] memory) {
        CreditPackage[] memory packages = new CreditPackage[](3);
        for (uint256 i = 1; i <= 3; i++) {
            packages[i-1] = creditPackages[i];
        }
        return packages;
    }
}
