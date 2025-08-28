/**
 * Frontend atualizado - Deploy Híbrido
 * API compila, usuário deploya via MetaMask
 */

class XcafeTokenCreatorV3 {
    constructor() {
        this.apiUrl = 'https://sua-api.onrender.com';
        this.provider = null;
        this.signer = null;
    }

    // 1. Conectar MetaMask
    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask não encontrado');
            }

            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            const address = await this.signer.getAddress();
            console.log('Wallet conectada:', address);
            
            return { success: true, address };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 2. Compilar contrato na API (grátis)
    async compileContract(tokenData) {
        try {
            const response = await fetch(`${this.apiUrl}/api/compile-only`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceCode: this.generateTokenCode(tokenData),
                    contractName: tokenData.name.replace(/\s+/g, ''),
                    optimization: true
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error);
            }

            return result.compilation;
        } catch (error) {
            throw new Error('Erro na compilação: ' + error.message);
        }
    }

    // 3. Deploy via MetaMask (usuário paga)
    async deployToken(tokenData) {
        try {
            // Conectar wallet se necessário
            if (!this.signer) {
                const connection = await this.connectWallet();
                if (!connection.success) {
                    throw new Error('Falha ao conectar MetaMask');
                }
            }

            // Compilar contrato
            console.log('Compilando contrato...');
            const compilation = await this.compileContract(tokenData);

            // Verificar rede
            const network = await this.provider.getNetwork();
            console.log('Rede detectada:', network.name);

            // Estimar gas
            const gasEstimate = await this.estimateDeployGas(compilation, tokenData);
            
            // Confirmar com usuário
            const confirmed = confirm(`
Deploy do token ${tokenData.name}:
- Rede: ${network.name}
- Gas estimado: ${gasEstimate.formatted}
- Custo aproximado: ${gasEstimate.cost}

Confirmar deploy?
            `);
            
            if (!confirmed) {
                return { success: false, error: 'Deploy cancelado pelo usuário' };
            }

            // Criar factory do contrato
            const contractFactory = new ethers.ContractFactory(
                compilation.abi,
                compilation.bytecode,
                this.signer
            );

            // Deploy com parâmetros
            console.log('Fazendo deploy...');
            const contract = await contractFactory.deploy(
                tokenData.name,
                tokenData.symbol,
                ethers.utils.parseUnits(tokenData.totalSupply, 18),
                {
                    gasLimit: gasEstimate.gasLimit
                }
            );

            // Aguardar confirmação
            console.log('Aguardando confirmação...');
            await contract.deployed();

            return {
                success: true,
                contractAddress: contract.address,
                transactionHash: contract.deployTransaction.hash,
                message: `Token ${tokenData.name} deployado com sucesso!`
            };

        } catch (error) {
            return {
                success: false,
                error: 'Erro no deploy: ' + error.message
            };
        }
    }

    // Estimar gas para deploy
    async estimateDeployGas(compilation, tokenData) {
        try {
            const contractFactory = new ethers.ContractFactory(
                compilation.abi,
                compilation.bytecode,
                this.signer
            );

            const gasLimit = await contractFactory.signer.estimateGas(
                contractFactory.getDeployTransaction(
                    tokenData.name,
                    tokenData.symbol,
                    ethers.utils.parseUnits(tokenData.totalSupply, 18)
                )
            );

            const gasPrice = await this.provider.getGasPrice();
            const gasCost = gasLimit.mul(gasPrice);
            
            return {
                gasLimit: gasLimit,
                gasPrice: gasPrice,
                cost: ethers.utils.formatEther(gasCost),
                formatted: gasLimit.toString() + ' gas'
            };
            
        } catch (error) {
            // Fallback para estimate padrão
            return {
                gasLimit: 2000000,
                gasPrice: await this.provider.getGasPrice(),
                cost: '~0.01',
                formatted: '~2M gas'
            };
        }
    }

    // Gerar código Solidity do token
    generateTokenCode(tokenData) {
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ${tokenData.name.replace(/\s+/g, '')} {
    string public name = "${tokenData.name}";
    string public symbol = "${tokenData.symbol}";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
        `;
    }
}

// Inicializar quando página carregar
const tokenCreator = new XcafeTokenCreatorV3();

// Event listeners para botões
document.addEventListener('DOMContentLoaded', function() {
    // Botão conectar wallet
    document.getElementById('connectWallet')?.addEventListener('click', async () => {
        const result = await tokenCreator.connectWallet();
        if (result.success) {
            alert('Wallet conectada: ' + result.address);
        } else {
            alert('Erro: ' + result.error);
        }
    });

    // Botão deploy token
    document.getElementById('deployToken')?.addEventListener('click', async () => {
        const tokenData = {
            name: document.getElementById('tokenName').value,
            symbol: document.getElementById('tokenSymbol').value,
            totalSupply: document.getElementById('totalSupply').value
        };

        if (!tokenData.name || !tokenData.symbol || !tokenData.totalSupply) {
            alert('Preencha todos os campos!');
            return;
        }

        const result = await tokenCreator.deployToken(tokenData);
        
        if (result.success) {
            alert(`Sucesso!\nContrato: ${result.contractAddress}\nTX: ${result.transactionHash}`);
        } else {
            alert('Erro: ' + result.error);
        }
    });
});
