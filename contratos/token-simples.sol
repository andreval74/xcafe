﻿// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * ðŸŽ¯ CONTRATO SIMPLES E ROBUSTO PARA SISTEMA xcafe
 * 
 * âœ… Foco total na compatibilidade:
 * - ERC-20 bÃ¡sico mas completo
 * - FunÃ§Ã£o buy() otimizada
 * - Valores de teste amigÃ¡veis
 * - Zero complexidade desnecessÃ¡ria
 */

contract xcafeTokenSimple {
    
    // ==================== INFORMAÃ‡Ã•ES BÃSICAS ====================
    string public name = "xcafe Simple Token";
    string public symbol = "SCSIMPLE";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    // ==================== MAPEAMENTOS ====================
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // ==================== CONFIGURAÃ‡Ã•ES ====================
    address public owner;
    uint256 private _tokenPrice = 1000000000000000; // 0.001 BNB por token
    bool public saleActive = true;
    bool public paused = false;
    
    // Limites amigÃ¡veis para testes
    uint256 public minPurchase = 500000000000000; // 0.0005 BNB (muito baixo para testes)
    uint256 public maxPurchase = 1000000000000000000; // 1 BNB
    
    // ==================== EVENTOS ====================
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TokensPurchased(address indexed buyer, uint256 ethSpent, uint256 tokensReceived);
    
    // ==================== CONSTRUTOR ====================
    constructor() {
        owner = msg.sender;
        totalSupply = 1000000 * 10**decimals;
        _balances[address(this)] = totalSupply; // Todos os tokens no contrato
        emit Transfer(address(0), address(this), totalSupply);
    }
    
    // ==================== MODIFICADORES ====================
    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas proprietario");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Pausado");
        _;
    }
    
    modifier whenSaleActive() {
        require(saleActive, "Venda inativa");
        _;
    }
    
    // ==================== FUNÃ‡Ã•ES ERC-20 BÃSICAS ====================
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Endereco zero");
        require(_balances[msg.sender] >= amount, "Saldo insuficiente");
        
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address tokenOwner, address spender) public view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Endereco zero");
        require(_balances[from] >= amount, "Saldo insuficiente");
        require(_allowances[from][msg.sender] >= amount, "Allowance insuficiente");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // ==================== FUNÃ‡Ã•ES DE PREÃ‡O ====================
    function tokenPrice() external view returns (uint256) {
        return _tokenPrice;
    }
    
    function price() external view returns (uint256) {
        return _tokenPrice;
    }
    
    function getPrice() external view returns (uint256) {
        return _tokenPrice;
    }
    
    // ==================== FUNÃ‡ÃƒO DE COMPRA PRINCIPAL ====================
    function buy() external payable whenNotPaused whenSaleActive {
        require(msg.value >= minPurchase, "Abaixo do minimo");
        require(msg.value <= maxPurchase, "Acima do maximo");
        
        uint256 tokensToReceive = (msg.value * 10**decimals) / _tokenPrice;
        require(_balances[address(this)] >= tokensToReceive, "Tokens insuficientes");
        
        _balances[address(this)] -= tokensToReceive;
        _balances[msg.sender] += tokensToReceive;
        
        emit Transfer(address(this), msg.sender, tokensToReceive);
        emit TokensPurchased(msg.sender, msg.value, tokensToReceive);
    }
    
    // ==================== FUNÃ‡Ã•ES ALTERNATIVAS ====================
    function buyTokens() external payable {
        this.buy{value: msg.value}();
    }
    
    function purchase() external payable {
        this.buy{value: msg.value}();
    }
    
    // ==================== FUNÃ‡Ã•ES DE DIAGNÃ“STICO ====================
    function tokensForSale() external view returns (uint256) {
        return _balances[address(this)];
    }
    
    function tokensAvailable() external view returns (uint256) {
        return _balances[address(this)];
    }
    
    // ==================== FUNÃ‡Ã•ES ADMINISTRATIVAS ====================
    function setTokenPrice(uint256 newPrice) external onlyOwner {
        _tokenPrice = newPrice;
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
    
    function setSaleActive(bool _active) external onlyOwner {
        saleActive = _active;
    }
    
    function setLimits(uint256 _min, uint256 _max) external onlyOwner {
        minPurchase = _min;
        maxPurchase = _max;
    }
    
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // ==================== RECEBIMENTO DE BNB ====================
    receive() external payable {
        // Permite receber BNB diretamente
    }
}



