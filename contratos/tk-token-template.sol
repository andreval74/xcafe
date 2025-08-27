// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * 🎯 CONTRATO ERC-20 SIMPLIFICADO PARA XCAFE TOKEN CREATOR
 * 
 * ✅ Características:
 * - ERC-20 básico e funcional
 * - Deploy via CREATE (padrão) ou CREATE2 (premium)
 * - Compatível com todas as carteiras
 * - Sem funções administrativas complexas
 * - Otimizado para baixo custo de gas
 */

contract xcafeCreatedToken {
    
    // ==================== INFORMAÇÕES DO TOKEN ====================
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    // ==================== MAPEAMENTOS ====================
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;
    
    // ==================== EVENTOS ====================
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // ==================== CONSTRUTOR ====================
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        
        // Todos os tokens vão para quem fez o deploy
        balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    // ==================== FUNÇÕES ERC-20 BÁSICAS ====================
    
    /**
     * Retorna o saldo de uma conta
     */
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
    
    /**
     * Transfere tokens para outro endereço
     */
    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Transfer para endereco zero");
        require(balances[msg.sender] >= amount, "Saldo insuficiente");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * Retorna o allowance entre dois endereços
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return allowances[owner][spender];
    }
    
    /**
     * Aprova um endereço para gastar tokens
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * Transfere tokens de um endereço para outro (com allowance)
     */
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Transfer para endereco zero");
        require(balances[from] >= amount, "Saldo insuficiente");
        require(allowances[from][msg.sender] >= amount, "Allowance insuficiente");
        
        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // ==================== FUNÇÕES AUXILIARES ====================
    
    /**
     * Aumenta o allowance
     */
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        allowances[msg.sender][spender] += addedValue;
        emit Approval(msg.sender, spender, allowances[msg.sender][spender]);
        return true;
    }
    
    /**
     * Diminui o allowance
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        uint256 currentAllowance = allowances[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "Allowance abaixo de zero");
        
        allowances[msg.sender][spender] = currentAllowance - subtractedValue;
        emit Approval(msg.sender, spender, allowances[msg.sender][spender]);
        return true;
    }
}
