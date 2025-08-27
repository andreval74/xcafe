/**
 * xcafe Token Deploy API
 * API para deploy de tokens ERC-20 em múltiplas redes
 */

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting simple
const rateLimitMap = new Map();
const RATE_LIMIT = 3; // 3 requests por minuto
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto

function rateLimit(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(clientIP)) {
        rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    const clientData = rateLimitMap.get(clientIP);
    
    if (now > clientData.resetTime) {
        rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    if (clientData.count >= RATE_LIMIT) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Tente novamente em 1 minuto.'
        });
    }
    
    clientData.count++;
    next();
}

// Carregar redes do chains.json
let SUPPORTED_NETWORKS = {};
let providers = {};

function loadNetworksFromChains() {
    try {
        const chainsPath = path.join(__dirname, '..', 'chains.json');
        const chainsData = JSON.parse(fs.readFileSync(chainsPath, 'utf8'));
        
        console.log(`📡 Carregando ${chainsData.length} redes do chains.json...`);
        
        for (const chain of chainsData) {
            // Normalizar dados da rede
            const networkData = {
                name: chain.name,
                chainId: chain.chainId,
                rpcUrl: Array.isArray(chain.rpc) ? chain.rpc[0] : chain.rpc,
                explorerUrl: Array.isArray(chain.explorers) ? chain.explorers[0]?.url : chain.explorers?.url,
                symbol: chain.nativeCurrency?.symbol || 'ETH',
                decimals: chain.nativeCurrency?.decimals || 18,
                // Configurações específicas por rede
                gasPrice: getDefaultGasPrice(chain.chainId),
                gasLimit: getDefaultGasLimit(chain.chainId),
                // Verificar se a rede é suportada para deploy
                deploySupported: isDeploySupported(chain.chainId)
            };
            
            SUPPORTED_NETWORKS[chain.chainId] = networkData;
            
            // Criar provider apenas para redes suportadas
            if (networkData.deploySupported) {
                try {
                    providers[chain.chainId] = new ethers.providers.JsonRpcProvider(networkData.rpcUrl);
                    console.log(`✅ Provider criado para ${networkData.name} (${chain.chainId})`);
                } catch (error) {
                    console.warn(`⚠️  Erro ao criar provider para ${networkData.name}:`, error.message);
                }
            } else {
                console.log(`ℹ️  Rede ${networkData.name} (${chain.chainId}) carregada mas deploy não suportado`);
            }
        }
        
        const supportedCount = Object.values(SUPPORTED_NETWORKS).filter(n => n.deploySupported).length;
        console.log(`🚀 ${supportedCount} redes com deploy ativo de ${chainsData.length} total`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar chains.json:', error);
        // Fallback para redes básicas se chains.json falhar
        loadFallbackNetworks();
    }
}

function getDefaultGasPrice(chainId) {
    const gasPrices = {
        1: '20', // Ethereum - mais caro
        56: '5', // BSC
        97: '5', // BSC Testnet
        137: '30', // Polygon
        43114: '25' // Avalanche
    };
    
    return gasPrices[chainId] || '10';
}

function getDefaultGasLimit(chainId) {
    // Limite de gas otimizado por rede
    const gasLimits = {
        1: 1200000, // Ethereum - mais conservativo
        56: 800000, // BSC
        97: 800000, // BSC Testnet
        137: 1000000, // Polygon
        43114: 1000000 // Avalanche
    };
    
    return gasLimits[chainId] || 1000000;
}

function isDeploySupported(chainId) {
    // Lista de redes que suportam deploy de token
    // Pode ser expandida conforme necessário
    const supportedChains = [
        1,    // Ethereum Mainnet
        56,   // BSC Mainnet
        97,   // BSC Testnet
        137,  // Polygon Mainnet
        80001, // Polygon Mumbai (se estiver no chains.json)
        43114, // Avalanche (se estiver no chains.json)
        250,   // Fantom (se estiver no chains.json)
        8453,  // Base (se estiver no chains.json)
        42161, // Arbitrum (se estiver no chains.json)
        10     // Optimism (se estiver no chains.json)
    ];
    
    return supportedChains.includes(chainId);
}

function loadFallbackNetworks() {
    console.log('📋 Carregando redes fallback...');
    
    SUPPORTED_NETWORKS = {
        56: {
            name: 'BSC Mainnet',
            chainId: 56,
            rpcUrl: 'https://bsc-dataseed1.binance.org/',
            explorerUrl: 'https://bscscan.com',
            symbol: 'BNB',
            gasPrice: '5',
            gasLimit: 800000,
            deploySupported: true
        },
        97: {
            name: 'BSC Testnet',
            chainId: 97,
            rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
            explorerUrl: 'https://testnet.bscscan.com',
            symbol: 'tBNB',
            gasPrice: '5',
            gasLimit: 800000,
            deploySupported: true
        }
    };
    
    // Criar providers
    for (const [chainId, network] of Object.entries(SUPPORTED_NETWORKS)) {
        providers[chainId] = new ethers.providers.JsonRpcProvider(network.rpcUrl);
    }
}

// Contrato ERC-20 simples
const TOKEN_CONTRACT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract XcafeToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        address _owner
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * 10**_decimals;
        balanceOf[_owner] = totalSupply;
        emit Transfer(address(0), _owner, totalSupply);
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
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
`;

// Bytecode pré-compilado do contrato (você deve compilar o contrato Solidity)
const TOKEN_CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50604051610c12380380610c1283398101604081905261002f916101f4565b845161004290600090602088019061008a565b50835161005690600190602087019061008a565b506002805460ff191660ff851617905561007382600a610341565b61007d9083610406565b6003819055600460008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef6003546040516100fc91815260200190565b60405180910390a3505050505061049f565b828054610118906103e9565b90600052602060002090601f01602090048101928261013a5760008555610180565b82601f1061015357805160ff1916838001178555610180565b82800160010185558215610180579182015b82811115610180578251825591602001919060010190610165565b5061018c929150610190565b5090565b5b8082111561018c5760008155600101610191565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126101cc57600080fd5b81516001600160401b038111156101e5576101e56101a5565b604051601f8201601f19908116603f0116810190828211818310171561020d5761020d6101a5565b81604052838152602092508683858801011115610229576000fd5b600091505b8382101561024b578582018301518183018401529082019061022e565b8382111561025c5760008385840101525b9695505050505050565b600080600080600060a0868803121561027e57600080fd5b85516001600160401b038082111561029557600080fd5b6102a189838a016101bb565b965060208801519150808211156102b757600080fd5b6102c389838a016101bb565b9550604088015194506060880151935060808801519150808211156102e757600080fd5b506102f4888289016101bb565b9150509295509295909350565b634e487b7160e01b600052601160045260246000fd5b600181815b8085111561035257816000190482111561033857610338610301565b8085161561034557918102915b93841c939080029061031c565b509250929050565b60008261036957506001610400565b8161037657506000610400565b816001811461038c576002811461039657610b2565b6001915050610400565b60ff8411156103a7576103a7610301565b50506001821b610400565b5060208310610133831016604e8410600b84101617156103d5575081810a610400565b6103df8383610317565b80600019048211156103f3576103f3610301565b029392505050565b60006104008383610351565b9392505050565b600081600019048311821515161561042157610421610301565b500290565b600181811c9082168061043a57607f821691505b60208210811415610454576020821014604b8411156103d5575b50919050565b634e487b7160e01b600052602260045260246000fd5b610764806104ae6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c80633950935111610066578063395093511461012157806370a082311461013457806395d89b411461015d578063a457c2d714610165578063a9059cbb1461017857600080fd5b806306fdde03146100a3578063095ea7b3146100c157806318160ddd146100e457806323b872dd146100f6578063313ce56714610109575b600080fd5b6100ab61018b565b6040516100b89190610679565b60405180910390f35b6100d46100cf3660046106ea565b610219565b60405190151581526020016100b8565b6003545b6040519081526020016100b8565b6100d4610104366004610714565b610230565b60025460405160ff90911681526020016100b8565b6100d461012f3660046106ea565b6102a4565b6100e8610142366004610750565b73ffffffffffffffffffffffffffffffffffffffff1660009081526004602052604090205490565b6100ab6102e0565b6100d46101733660046106ea565b6102ed565b6100d46101863660046106ea565b610396565b6000805461019890610772565b80601f01602080910402602001604051908101604052809291908181526020018280546101c490610772565b80156102115780601f106101e657610100808354040283529160200191610211565b820191906000526020600020905b8154815290600101906020018083116101f457829003601f168201915b505050505081565b60006102263384846103a3565b5060015b92915050565b600061023d8484846104d6565b73ffffffffffffffffffffffffffffffffffffffff84166000908152600560209081526040808320338452909152902054828110156102835760405162461bcd60e51b815260040161027a906106c6565b60405180910390fd5b6102978533610292868561075b565b6103a3565b60019150505b9392505050565b33600081815260056020908152604080832073ffffffffffffffffffffffffffffffffffffffff8716845290915281205490916102269185906102929086906106f4565b6001805461019890610772565b33600090815260056020908152604080832073ffffffffffffffffffffffffffffffffffffffff86168452909152812054828110156103745760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760448201527f207a65726f000000000000000000000000000000000000000000000000000000606482015260840161027a565b610381338561029286856106c6565b5060019392505050565b60006102263384846104d6565b73ffffffffffffffffffffffffffffffffffffffff83166104255760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460448201527f7265737300000000000000000000000000000000000000000000000000000000606482015260840161027a565b73ffffffffffffffffffffffffffffffffffffffff82166104ae5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f20616464726560448201527f7373000000000000000000000000000000000000000000000000000000000000606482015260840161027a565b73ffffffffffffffffffffffffffffffffffffffff83811660008181526005602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591015b60405180910390a3505050565b73ffffffffffffffffffffffffffffffffffffffff83166105595760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f20616460448201527f6472657373000000000000000000000000000000000000000000000000000000606482015260840161027a565b73ffffffffffffffffffffffffffffffffffffffff82166105e25760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201527f6573730000000000000000000000000000000000000000000000000000000000606482015260840161027a565b73ffffffffffffffffffffffffffffffffffffffff8316600090815260046020526040902054818110156106625760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e742065786365656473206260448201526530b630b731b29c60d11b606482015260840161027a565b61066c82826106c6565b73ffffffffffffffffffffffffffffffffffffffff80861660009081526004602052604080822093909355908516815290812080548492906106af9084906106f4565b909155505060408051838152602081018390527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a3506001949350505050565b600060208083528351808285015260005b818110156106a65785810183015185820160400152820161068a565b818111156106b8576000604083870101525b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016929092016040019392505050565b634e487b7160e01b600052601160045260246000fd5b60006020828403121561071f57600080fd5b813573ffffffffffffffffffffffffffffffffffffffff8116811461029d57600080fd5b600181811c9082168061075957607f821691505b6020821081141561077957634e487b7160e01b600052602260045260246000fd5b50919050565b6000828210156107915761079161070c565b500390565b600082198211156107a9576107a961070c565b500190565b600080604083850312156107c157600080fd5b82359150602083013573ffffffffffffffffffffffffffffffffffffffff811681146107ec57600080fd5b809150509250929050565b60008060006060848603121561080c57600080fd5b833592506020840135915060408401356108258161087e565b809150509250925092565b600073ffffffffffffffffffffffffffffffffffffffff808716835280861660208401525083604083015282606083015260a0608083015261087760a08301846108a9565b9695505050505050565b73ffffffffffffffffffffffffffffffffffffffff811681146108a357600080fd5b50919050565b60008151808452602080850194506020840160005b838110156108e05781518752958201959082019060010190565b5094950050000000fefe";

// Inicializar redes
loadNetworksFromChains();

// Health check
app.get('/', (req, res) => {
    const supportedNetworks = Object.values(SUPPORTED_NETWORKS)
        .filter(n => n.deploySupported)
        .map(n => ({
            name: n.name,
            chainId: n.chainId,
            symbol: n.symbol
        }));
    
    res.json({
        service: 'xcafe Token Deploy API',
        version: '2.0.0',
        status: 'online',
        timestamp: new Date().toISOString(),
        totalNetworks: Object.keys(SUPPORTED_NETWORKS).length,
        deploySupportedNetworks: supportedNetworks.length,
        supportedNetworks: supportedNetworks
    });
});

// Verificar rede
app.get('/networks', (req, res) => {
    const { deployOnly } = req.query;
    
    let networks = Object.values(SUPPORTED_NETWORKS);
    
    if (deployOnly === 'true') {
        networks = networks.filter(n => n.deploySupported);
    }
    
    res.json({
        success: true,
        networks: networks.map(n => ({
            name: n.name,
            chainId: n.chainId,
            symbol: n.symbol,
            explorerUrl: n.explorerUrl,
            deploySupported: n.deploySupported
        }))
    });
});

// Obter informações de uma rede específica
app.get('/network/:chainId', (req, res) => {
    const { chainId } = req.params;
    const networkConfig = SUPPORTED_NETWORKS[parseInt(chainId)];
    
    if (!networkConfig) {
        return res.status(404).json({
            success: false,
            error: `Rede com Chain ID ${chainId} não encontrada`
        });
    }
    
    res.json({
        success: true,
        network: {
            name: networkConfig.name,
            chainId: networkConfig.chainId,
            symbol: networkConfig.symbol,
            explorerUrl: networkConfig.explorerUrl,
            deploySupported: networkConfig.deploySupported,
            gasPrice: networkConfig.gasPrice + ' gwei',
            gasLimit: networkConfig.gasLimit
        }
    });
});

// Deploy de token
app.post('/deploy-token', rateLimit, async (req, res) => {
    try {
        const {
            tokenName,
            tokenSymbol,
            decimals,
            totalSupply,
            ownerAddress,
            chainId,
            deployerPrivateKey // Chave privada temporária para deploy
        } = req.body;

        // Validações
        if (!tokenName || !tokenSymbol || !totalSupply || !ownerAddress || !chainId || !deployerPrivateKey) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros obrigatórios: tokenName, tokenSymbol, totalSupply, ownerAddress, chainId, deployerPrivateKey'
            });
        }

        // Verificar se a rede é suportada
        const networkConfig = SUPPORTED_NETWORKS[chainId];
        if (!networkConfig) {
            return res.status(400).json({
                success: false,
                error: `Rede ${chainId} não encontrada. Use GET /networks para ver redes disponíveis.`
            });
        }
        
        if (!networkConfig.deploySupported) {
            return res.status(400).json({
                success: false,
                error: `Deploy não suportado para ${networkConfig.name}. Use GET /networks?deployOnly=true para ver redes com deploy ativo.`
            });
        }

        // Obter provider da rede
        const provider = providers[chainId];
        if (!provider) {
            return res.status(500).json({
                success: false,
                error: `Provider não disponível para ${networkConfig.name}`
            });
        }

        // Criar wallet do deployer
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);

        // Verificar saldo
        const balance = await wallet.getBalance();
        const minBalance = ethers.utils.parseEther('0.01'); // Mínimo base

        if (balance.lt(minBalance)) {
            return res.status(400).json({
                success: false,
                error: `Saldo insuficiente para deploy. Mínimo: 0.01 ${networkConfig.symbol}`
            });
        }

        // Preparar dados do contrato
        const contractFactory = new ethers.ContractFactory(
            // ABI simplificado
            [
                "constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply, address _owner)"
            ],
            TOKEN_CONTRACT_BYTECODE,
            wallet
        );

        // Deploy do contrato com configurações otimizadas por rede
        console.log(`🚀 Iniciando deploy do token ${tokenName} na ${networkConfig.name}...`);
        const deployTransaction = await contractFactory.deploy(
            tokenName,
            tokenSymbol,
            parseInt(decimals) || 18,
            totalSupply,
            ownerAddress,
            {
                gasLimit: networkConfig.gasLimit,
                gasPrice: ethers.utils.parseUnits(networkConfig.gasPrice, 'gwei')
            }
        );

        // Aguardar confirmação
        const deployedContract = await deployTransaction.deployed();
        const receipt = await deployedContract.deployTransaction.wait();

        res.json({
            success: true,
            contract: {
                address: deployedContract.address,
                name: tokenName,
                symbol: tokenSymbol,
                decimals: parseInt(decimals) || 18,
                totalSupply: totalSupply,
                owner: ownerAddress
            },
            transaction: {
                hash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.effectiveGasPrice?.toString()
            },
            network: {
                name: networkConfig.name,
                chainId: chainId,
                symbol: networkConfig.symbol,
                explorer: `${networkConfig.explorerUrl}/tx/${receipt.transactionHash}`
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro no deploy:', error);
        
        let errorMessage = 'Erro interno do servidor';
        if (error.message.includes('insufficient funds')) {
            errorMessage = 'Saldo insuficiente para pagar as taxas de gas';
        } else if (error.message.includes('nonce')) {
            errorMessage = 'Erro de nonce. Tente novamente em alguns segundos';
        } else if (error.message.includes('gas')) {
            errorMessage = 'Erro relacionado ao gas. Verifique os parâmetros';
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verificar status de uma transação
app.get('/transaction/:hash/:chainId', async (req, res) => {
    try {
        const { hash, chainId } = req.params;
        
        const networkConfig = SUPPORTED_NETWORKS[parseInt(chainId)];
        if (!networkConfig) {
            return res.status(400).json({
                success: false,
                error: 'Rede não suportada'
            });
        }
        
        const provider = providers[parseInt(chainId)];
        if (!provider) {
            return res.status(400).json({
                success: false,
                error: 'Provider não disponível para esta rede'
            });
        }

        const receipt = await provider.getTransactionReceipt(hash);
        
        if (!receipt) {
            return res.json({
                success: true,
                status: 'pending',
                network: networkConfig.name
            });
        }

        res.json({
            success: true,
            status: receipt.status === 1 ? 'confirmed' : 'failed',
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            network: networkConfig.name,
            explorer: `${networkConfig.explorerUrl}/tx/${hash}`
        });

    } catch (error) {
        console.error('Erro ao verificar transação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar transação'
        });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 xcafe Token Deploy API rodando na porta ${PORT}`);
    
    const deploySupported = Object.values(SUPPORTED_NETWORKS).filter(n => n.deploySupported);
    const networkNames = deploySupported.map(n => `${n.name} (${n.chainId})`).join(', ');
    
    console.log(`📊 ${deploySupported.length} redes com deploy ativo:`);
    deploySupported.forEach(network => {
        console.log(`   • ${network.name} (Chain ${network.chainId}) - ${network.symbol}`);
    });
});
