/**
 * Exemplo de Implementação dos Novos Endpoints para API xcafe
 * Compilação e Deploy de Contratos Solidity
 */

const express = require('express');
const cors = require('cors');
const solc = require('solc');
const { ethers } = require('ethers');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 requests por minuto
    message: { success: false, error: "Rate limit exceeded. Tente novamente em 1 minuto." }
});

app.use('/api/', apiLimiter);

// Configurações de rede
const NETWORK_CONFIGS = {
    1: { // Ethereum Mainnet
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY',
        explorer: 'https://etherscan.io',
        currency: 'ETH'
    },
    56: { // BSC Mainnet
        name: 'BNB Smart Chain',
        rpcUrl: 'https://bsc-dataseed1.binance.org',
        explorer: 'https://bscscan.com',
        currency: 'BNB'
    },
    97: { // BSC Testnet
        name: 'BSC Testnet',
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        explorer: 'https://testnet.bscscan.com',
        currency: 'tBNB'
    },
    137: { // Polygon
        name: 'Polygon Mainnet',
        rpcUrl: 'https://polygon-mainnet.infura.io/v3/YOUR_KEY',
        explorer: 'https://polygonscan.com',
        currency: 'MATIC'
    }
};

/**
 * Endpoint: Compilar contrato Solidity
 */
app.post('/api/compile', async (req, res) => {
    try {
        const { sourceCode, contractName, solcVersion = '0.8.19', optimization = true, optimizationRuns = 200 } = req.body;

        if (!sourceCode || !contractName) {
            return res.status(400).json({
                success: false,
                error: 'sourceCode e contractName são obrigatórios'
            });
        }

        console.log(`🔨 Compilando contrato: ${contractName}`);

        // Preparar input para solc
        const input = {
            language: 'Solidity',
            sources: {
                [`${contractName}.sol`]: {
                    content: sourceCode
                }
            },
            settings: {
                optimizer: {
                    enabled: optimization,
                    runs: optimizationRuns
                },
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'evm.gasEstimates']
                    }
                }
            }
        };

        // Compilar
        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        // Verificar erros
        if (output.errors) {
            const errors = output.errors.filter(error => error.severity === 'error');
            const warnings = output.errors.filter(error => error.severity === 'warning');
            
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    errors: errors.map(err => err.formattedMessage),
                    warnings: warnings.map(warn => warn.formattedMessage)
                });
            }
        }

        // Extrair resultado da compilação
        const contractKey = `${contractName}.sol:${contractName}`;
        const contract = output.contracts[`${contractName}.sol`][contractName];

        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contrato não encontrado na compilação'
            });
        }

        const result = {
            success: true,
            bytecode: '0x' + contract.evm.bytecode.object,
            abi: contract.abi,
            metadata: contract.metadata ? JSON.parse(contract.metadata) : null,
            gasEstimate: contract.evm.gasEstimates?.creation?.totalCost || null,
            warnings: output.errors ? output.errors.filter(e => e.severity === 'warning').map(w => w.formattedMessage) : [],
            errors: []
        };

        console.log(`✅ Compilação concluída: ${contractName}`);
        res.json(result);

    } catch (error) {
        console.error('❌ Erro na compilação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno na compilação: ' + error.message
        });
    }
});

/**
 * Endpoint: Deploy de contrato compilado
 */
app.post('/api/deploy-compiled', async (req, res) => {
    try {
        const { 
            bytecode, 
            abi, 
            constructorParams = [], 
            chainId, 
            ownerAddress, 
            gasLimit = 'auto',
            gasPrice = 'auto'
        } = req.body;

        if (!bytecode || !abi || !chainId || !ownerAddress) {
            return res.status(400).json({
                success: false,
                error: 'bytecode, abi, chainId e ownerAddress são obrigatórios'
            });
        }

        const network = NETWORK_CONFIGS[chainId];
        if (!network) {
            return res.status(400).json({
                success: false,
                error: `Rede ${chainId} não suportada`
            });
        }

        console.log(`🚀 Fazendo deploy na rede: ${network.name}`);

        // Conectar ao provedor
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        
        // Criar carteira temporária para deploy (em produção, usar HSM ou similar)
        const deployerWallet = ethers.Wallet.createRandom().connect(provider);
        
        // Criar factory do contrato
        const contractFactory = new ethers.ContractFactory(abi, bytecode, deployerWallet);
        
        // Estimar gas
        let estimatedGas;
        try {
            estimatedGas = await contractFactory.getDeployTransaction(...constructorParams).estimateGas();
        } catch (error) {
            estimatedGas = ethers.parseUnits('2000000', 'wei');
        }

        // Configurar opções de deploy
        const deployOptions = {
            gasLimit: gasLimit === 'auto' ? estimatedGas : gasLimit
        };

        if (gasPrice !== 'auto') {
            deployOptions.gasPrice = gasPrice;
        }

        // Fazer deploy
        const contract = await contractFactory.deploy(...constructorParams, deployOptions);
        const receipt = await contract.deploymentTransaction().wait();

        console.log(`✅ Deploy concluído: ${await contract.getAddress()}`);

        res.json({
            success: true,
            contractAddress: await contract.getAddress(),
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: receipt.gasPrice?.toString() || 'N/A',
            explorerUrl: `${network.explorer}/address/${await contract.getAddress()}`
        });

    } catch (error) {
        console.error('❌ Erro no deploy:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno no deploy: ' + error.message
        });
    }
});

/**
 * Endpoint: Compilar e fazer deploy em fluxo único
 */
app.post('/api/compile-and-deploy', async (req, res) => {
    try {
        const {
            sourceCode,
            contractName,
            constructorParams = [],
            chainId,
            ownerAddress,
            solcVersion = '0.8.19',
            optimization = true,
            gasLimit = 'auto',
            gasPrice = 'auto'
        } = req.body;

        if (!sourceCode || !contractName || !chainId || !ownerAddress) {
            return res.status(400).json({
                success: false,
                error: 'sourceCode, contractName, chainId e ownerAddress são obrigatórios'
            });
        }

        console.log(`⚡ Iniciando compilação e deploy: ${contractName}`);

        // Passo 1: Compilar
        const compileResult = await compileContract({
            sourceCode,
            contractName,
            solcVersion,
            optimization
        });

        if (!compileResult.success) {
            return res.status(400).json(compileResult);
        }

        // Passo 2: Deploy
        const deployResult = await deployCompiledContract({
            bytecode: compileResult.bytecode,
            abi: compileResult.abi,
            constructorParams,
            chainId,
            ownerAddress,
            gasLimit,
            gasPrice
        });

        if (!deployResult.success) {
            return res.status(500).json(deployResult);
        }

        console.log(`✅ Compilação e deploy concluídos: ${deployResult.contractAddress}`);

        res.json({
            success: true,
            contractAddress: deployResult.contractAddress,
            transactionHash: deployResult.transactionHash,
            blockNumber: deployResult.blockNumber,
            gasUsed: deployResult.gasUsed,
            gasPrice: deployResult.gasPrice,
            compilationWarnings: compileResult.warnings,
            explorerUrl: deployResult.explorerUrl
        });

    } catch (error) {
        console.error('❌ Erro na compilação/deploy:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno: ' + error.message
        });
    }
});

/**
 * Endpoint: Verificar contrato no explorador
 */
app.post('/api/verify-contract', async (req, res) => {
    try {
        const { contractAddress, sourceCode, chainId, constructorParams = [] } = req.body;

        if (!contractAddress || !sourceCode || !chainId) {
            return res.status(400).json({
                success: false,
                error: 'contractAddress, sourceCode e chainId são obrigatórios'
            });
        }

        const network = NETWORK_CONFIGS[chainId];
        if (!network) {
            return res.status(400).json({
                success: false,
                error: `Rede ${chainId} não suportada`
            });
        }

        console.log(`🔍 Verificando contrato: ${contractAddress}`);

        // Aqui você integraria com APIs de verificação como Etherscan, BSCScan, etc.
        // Por simplicidade, vamos simular uma verificação bem-sucedida
        
        // Simulação de delay de verificação
        await new Promise(resolve => setTimeout(resolve, 2000));

        res.json({
            success: true,
            verified: true,
            verificationUrl: `${network.explorer}/address/${contractAddress}#code`,
            message: 'Contrato verificado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro na verificação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno na verificação: ' + error.message
        });
    }
});

/**
 * Endpoint: Analisar contrato para problemas
 */
app.post('/api/analyze-contract', async (req, res) => {
    try {
        const { sourceCode, analysisType = ['security', 'gas'] } = req.body;

        if (!sourceCode) {
            return res.status(400).json({
                success: false,
                error: 'sourceCode é obrigatório'
            });
        }

        console.log('📊 Analisando contrato...');

        const issues = [];
        const suggestions = [];

        // Análises básicas (em produção, usar ferramentas como Mythril, Slither)
        if (analysisType.includes('security')) {
            if (sourceCode.includes('tx.origin')) {
                issues.push({
                    severity: 'high',
                    type: 'security',
                    message: 'Uso de tx.origin pode ser inseguro'
                });
            }

            if (!sourceCode.includes('ReentrancyGuard') && sourceCode.includes('call')) {
                issues.push({
                    severity: 'medium',
                    type: 'security',
                    message: 'Considere usar ReentrancyGuard para calls externos'
                });
            }
        }

        if (analysisType.includes('gas')) {
            if (sourceCode.includes('for (') && sourceCode.includes('storage')) {
                issues.push({
                    severity: 'medium',
                    type: 'gas',
                    message: 'Loops com storage podem ser custosos'
                });
            }
        }

        res.json({
            success: true,
            issues,
            suggestions,
            summary: `${issues.length} problemas encontrados`
        });

    } catch (error) {
        console.error('❌ Erro na análise:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno na análise: ' + error.message
        });
    }
});

// Funções auxiliares para reuso interno
async function compileContract(data) {
    // Implementação da compilação (mesma lógica do endpoint /compile)
    // Retorna resultado da compilação
}

async function deployCompiledContract(data) {
    // Implementação do deploy (mesma lógica do endpoint /deploy-compiled)
    // Retorna resultado do deploy
}

// Endpoint existente mantido para compatibilidade
app.post('/deploy-token', async (req, res) => {
    // Implementação existente do deploy de tokens
    res.status(500).json({
        success: false,
        error: 'Endpoint legado - use /api/compile-and-deploy'
    });
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API xcafe Extended rodando na porta ${PORT}`);
    console.log('📋 Novos endpoints disponíveis:');
    console.log('  POST /api/compile - Compilar contrato');
    console.log('  POST /api/deploy-compiled - Deploy de bytecode');
    console.log('  POST /api/compile-and-deploy - Fluxo completo');
    console.log('  POST /api/verify-contract - Verificar contrato');
    console.log('  POST /api/analyze-contract - Analisar problemas');
});

module.exports = app;
