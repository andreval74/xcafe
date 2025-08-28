/**
 * Versão melhorada da API - Usuário paga deploy
 * xcafe Token Creator v3.0
 */

const express = require('express');
const { ethers } = require('ethers');

// Endpoint modificado - usuário paga
app.post('/api/prepare-deployment', async (req, res) => {
    try {
        const { sourceCode, contractName, constructorArgs, network } = req.body;

        // 1. Compilar contrato (API faz isso)
        const compiled = await compileContract(sourceCode, contractName);
        
        // 2. Preparar dados para deploy
        const deployData = {
            bytecode: compiled.bytecode,
            abi: compiled.abi,
            constructorArgs: constructorArgs,
            gasEstimate: await estimateGas(compiled.bytecode, constructorArgs, network)
        };

        // 3. Retornar dados para usuário fazer deploy
        res.json({
            success: true,
            deployData: deployData,
            instructions: {
                message: "Use estes dados no seu MetaMask para fazer o deploy",
                steps: [
                    "1. Conecte seu MetaMask",
                    "2. Certifique-se que tem " + deployData.gasEstimate.total + " de gas",
                    "3. Use o botão 'Deploy' no frontend"
                ]
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Frontend usa estes dados para deploy via MetaMask
app.post('/api/verify-deployment', async (req, res) => {
    try {
        const { transactionHash, network } = req.body;
        
        // Verificar se deploy foi bem sucedido
        const receipt = await getTransactionReceipt(transactionHash, network);
        
        res.json({
            success: true,
            contractAddress: receipt.contractAddress,
            verified: true
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
