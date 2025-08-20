// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * ðŸŽ¯ CONTRATO SIMPLES PARA TESTE DO WIDGET xcafe
 * 
 * Este contrato permite compra direta de tokens enviando BNB/ETH
 * FunÃ§Ã£o buy() funcional para demonstraÃ§Ã£o
 */

contract xcafeTestToken {
    
    // InformaÃ§Ãµes bÃ¡sicas do token
    string public name = "xcafe Test Token";
    string public symbol = "xcafeTEST";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**decimals; // 1 milhÃ£o de tokens
    
    // Mapeamento de saldos
    mapping(address => uint256) private balances;
    
    // ConfiguraÃ§Ãµes de venda
    uint256 public tokenPrice = 1000000000000000; // 0.001 BNB por token
    address public owner;
    address public treasury; // Carteira que recebe os BNB
    
    // Eventos
    event Transfer(address indexed from, address indexed to, uint256 value);
    event TokensPurchased(address indexed buyer, uint256 bnbAmount, uint256 tokenAmount);
    
    constructor() {
        owner = msg.sender;
        treasury = msg.sender; // Owner recebe os BNB
        balances[address(this)] = totalSupply; // Todos os tokens ficam no contrato
    }
    
    // FunÃ§Ã£o principal de compra - o que o widget vai chamar
    function buy() external payable {
        require(msg.value > 0, "Envie BNB para comprar tokens");
        require(msg.value >= tokenPrice, "Valor minimo: 0.001 BNB");
        
        // Calcular quantos tokens o comprador recebe
        uint256 tokensToReceive = (msg.value * 10**decimals) / tokenPrice;
        
        // Verificar se hÃ¡ tokens suficientes
        require(balances[address(this)] >= tokensToReceive, "Tokens insuficientes no contrato");
        
        // Transferir tokens para o comprador
        balances[address(this)] -= tokensToReceive;
        balances[msg.sender] += tokensToReceive;
        
        // Transferir BNB para o treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        require(success, "Falha na transferencia de BNB");
        
        emit Transfer(address(this), msg.sender, tokensToReceive);
        emit TokensPurchased(msg.sender, msg.value, tokensToReceive);
    }
    
    // FunÃ§Ãµes de compatibilidade
    function buyTokens() external payable {
        buy();
    }
    
    function purchase() external payable {
        buy();
    }
    
    // FunÃ§Ãµes de preÃ§o para compatibilidade com widget
    function tokenPrice() external view returns (uint256) {
        return tokenPrice;
    }
    
    function price() external view returns (uint256) {
        return tokenPrice;
    }
    
    // FunÃ§Ã£o de saldo ERC-20 bÃ¡sica
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
    
    // Configurar treasury (sÃ³ owner)
    function setTreasury(address newTreasury) external {
        require(msg.sender == owner, "Apenas owner");
        treasury = newTreasury;
    }
    
    // Configurar preÃ§o (sÃ³ owner)  
    function setTokenPrice(uint256 newPrice) external {
        require(msg.sender == owner, "Apenas owner");
        tokenPrice = newPrice;
    }
    
    // Retirar tokens nÃ£o vendidos (sÃ³ owner)
    function withdrawTokens(uint256 amount) external {
        require(msg.sender == owner, "Apenas owner");
        require(balances[address(this)] >= amount, "Saldo insuficiente");
        
        balances[address(this)] -= amount;
        balances[owner] += amount;
        
        emit Transfer(address(this), owner, amount);
    }
}



