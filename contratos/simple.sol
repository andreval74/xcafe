// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/*
Gerado por:
Smart Contract Cafe
https://smartcontract.cafe
*/

contract {{TOKEN_SYMBOL}} {
    // INFORMAÇÕES DO TOKEN
    string public name = {{TOKEN_NAME}};
    string public symbol = "{{TOKEN_SYMBOL}}";
    uint8 public decimals = {{DECIMALS}};
    uint256 public totalSupply = {{TOKEN_SUPPLY}} * (10 ** uint256(decimals));
    
    // PROPRIEDADE E CONTROLE
    address public owner = {{OWNER_ADDRESS}};
    bool public paused = false;
    bool public terminated = false;
    
    // MAPEAMENTOS
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // EVENTOS
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Paused(address account);
    event Unpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // MODIFICADORES
    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o proprietario pode executar esta funcao");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Token esta pausado");
        _;
    }
    
    modifier whenNotTerminated() {
        require(!terminated, "Token foi terminado");
        _;
    }
    
    // CONSTRUTOR
    constructor() {
        _balances[owner] = totalSupply;
        emit Transfer(address(0), owner, totalSupply);
    }
    
    // FUNÇÕES ERC-20 BÁSICAS
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public whenNotPaused whenNotTerminated returns (bool) {
        address sender = msg.sender;
        require(_balances[sender] >= amount, "Saldo insuficiente");
        require(to != address(0), "Nao pode transferir para endereco zero");
        
        _balances[sender] -= amount;
        _balances[to] += amount;
        
        emit Transfer(sender, to, amount);
        return true;
    }
    
    function allowance(address tokenOwner, address spender) public view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }
    
    function approve(address spender, uint256 amount) public whenNotPaused returns (bool) {
        address tokenOwner = msg.sender;
        require(spender != address(0), "Nao pode aprovar para endereco zero");
        
        _allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public whenNotPaused whenNotTerminated returns (bool) {
        require(_allowances[from][msg.sender] >= amount, "Allowance insuficiente");
        require(_balances[from] >= amount, "Saldo insuficiente");
        require(to != address(0), "Nao pode transferir para endereco zero");
        
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // FUNÇÕES DE ADMINISTRAÇÃO
    function pause() public onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() public onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function terminate() public onlyOwner {
        terminated = true;
        paused = true;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Novo proprietario nao pode ser endereco zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    // FUNÇÃO PARA AUMENTAR ALLOWANCE (CONVENIÊNCIA)
    function increaseAllowance(address spender, uint256 addedValue) public whenNotPaused returns (bool) {
        address tokenOwner = msg.sender;
        approve(spender, _allowances[tokenOwner][spender] + addedValue);
        return true;
    }
    
    // FUNÇÃO PARA DIMINUIR ALLOWANCE (CONVENIÊNCIA)  
    function decreaseAllowance(address spender, uint256 subtractedValue) public whenNotPaused returns (bool) {
        address tokenOwner = msg.sender;
        uint256 currentAllowance = _allowances[tokenOwner][spender];
        require(currentAllowance >= subtractedValue, "Allowance menor que valor a subtrair");
        approve(spender, currentAllowance - subtractedValue);
        return true;
    }
}
