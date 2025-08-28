/**
 * Deploy Híbrido - API compila, usuário deploya
 * Melhor dos dois mundos
 */

// Endpoint apenas para compilação (grátis)
app.post('/api/compile-only', async (req, res) => {
    try {
        const { sourceCode, contractName, optimization } = req.body;
        
        // Compilar (não custa gas, só processamento)
        const compiled = await compileContract(sourceCode, contractName, optimization);
        
        res.json({
            success: true,
            compilation: {
                abi: compiled.abi,
                bytecode: compiled.bytecode,
                contractName: contractName
            },
            deployInstructions: {
                message: "Contrato compilado com sucesso!",
                nextSteps: [
                    "1. Conecte seu MetaMask na rede desejada",
                    "2. Clique em 'Deploy' abaixo",  
                    "3. Confirme a transação no MetaMask",
                    "4. Aguarde confirmação na blockchain"
                ]
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Erro na compilação: ' + error.message 
        });
    }
});

// Frontend JavaScript para usar a compilação
const frontendDeployCode = `
// No frontend, após receber compilação da API:
async function deployCompiledContract(compilationData, userParams) {
    try {
        // 1. Conectar MetaMask
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // 2. Criar factory do contrato
        const contractFactory = new ethers.ContractFactory(
            compilationData.abi,
            compilationData.bytecode,
            signer
        );
        
        // 3. Deploy (usuário paga)
        const contract = await contractFactory.deploy(
            userParams.name,
            userParams.symbol,
            userParams.totalSupply,
            { gasLimit: 2000000 } // Limite de gas adequado
        );
        
        // 4. Aguardar confirmação
        await contract.deployed();
        
        return {
            success: true,
            contractAddress: contract.address,
            transactionHash: contract.deployTransaction.hash
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
`;

module.exports = { frontendDeployCode };
