/**
 * Sistema de Créditos para Deploy
 * Usuário paga pelos deploys que faz
 */

// Estrutura de cobrança
const DEPLOYMENT_COSTS = {
    'bsc': 0.001,      // BNB
    'ethereum': 0.02,   // ETH  
    'polygon': 0.5      // MATIC
};

// Endpoint com cobrança
app.post('/api/deploy-token-paid', async (req, res) => {
    try {
        const { userAddress, network, tokenData, paymentTxHash } = req.body;
        
        // 1. Verificar pagamento do usuário
        const paymentValid = await verifyPayment(paymentTxHash, userAddress, network);
        if (!paymentValid) {
            return res.status(402).json({
                success: false,
                error: 'Pagamento não verificado',
                required: DEPLOYMENT_COSTS[network] + ' ' + getNetworkCurrency(network)
            });
        }
        
        // 2. Fazer deploy (API paga, mas foi reembolsada)
        const deployment = await deployToken(tokenData, network);
        
        // 3. Registrar deploy pago
        await registerPaidDeployment({
            user: userAddress,
            contract: deployment.contractAddress,
            cost: DEPLOYMENT_COSTS[network],
            network: network,
            timestamp: Date.now()
        });
        
        res.json({
            success: true,
            contractAddress: deployment.contractAddress,
            transactionHash: deployment.transactionHash,
            receipt: 'Deploy pago com sucesso'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para usuário pagar deploy
app.post('/api/pay-deployment', async (req, res) => {
    try {
        const { network } = req.body;
        const cost = DEPLOYMENT_COSTS[network];
        const currency = getNetworkCurrency(network);
        
        // Endereço da API para receber pagamento
        const paymentAddress = process.env.PAYMENT_WALLET_ADDRESS;
        
        res.json({
            success: true,
            paymentDetails: {
                address: paymentAddress,
                amount: cost,
                currency: currency,
                network: network,
                instructions: `Envie ${cost} ${currency} para ${paymentAddress} na rede ${network}`
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
