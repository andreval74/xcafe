const hre = require("hardhat");

async function main() {
  console.log("Starting XCAFE Sale Contract deployment...");

  // Endereços de configuração
  const USDT_ADDRESS = {
    bsc: "0x55d398326f99059fF775485246999027B3197955", // USDT BSC Mainnet
    bscTestnet: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", // USDT BSC Testnet
    polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT Polygon Mainnet
    polygonMumbai: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", // LINK Mumbai (para teste)
    localhost: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", // Endereço de teste
  };

  // Obter rede atual
  const network = hre.network.name;
  console.log(`Deploying to network: ${network}`);

  // Configurar endereços baseado na rede
  let usdtAddress, treasuryWallet, backendWallet;

  if (network === "localhost" || network === "hardhat") {
    // Para desenvolvimento local
    const [deployer, treasury, backend] = await hre.ethers.getSigners();
    usdtAddress = USDT_ADDRESS.localhost;
    treasuryWallet = treasury.address;
    backendWallet = backend.address;
    
    console.log("Local development addresses:");
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Treasury: ${treasuryWallet}`);
    console.log(`Backend: ${backendWallet}`);
  } else {
    // Para redes públicas, usar variáveis de ambiente
    usdtAddress = USDT_ADDRESS[network];
    treasuryWallet = process.env.TREASURY_WALLET;
    backendWallet = process.env.BACKEND_WALLET;

    if (!treasuryWallet || !backendWallet) {
      throw new Error("TREASURY_WALLET and BACKEND_WALLET must be set in .env file");
    }
  }

  if (!usdtAddress) {
    throw new Error(`USDT address not configured for network: ${network}`);
  }

  console.log("Contract configuration:");
  console.log(`USDT Token: ${usdtAddress}`);
  console.log(`Treasury Wallet: ${treasuryWallet}`);
  console.log(`Backend Wallet: ${backendWallet}`);

  // Deploy do contrato
  const XCAFESaleContract = await hre.ethers.getContractFactory("XCAFESaleContract");
  
  console.log("Deploying XCAFESaleContract...");
  const contract = await XCAFESaleContract.deploy(
    usdtAddress,
    treasuryWallet,
    backendWallet
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`\n✅ XCAFESaleContract deployed to: ${contractAddress}`);

  // Verificar configuração inicial
  console.log("\nVerifying initial configuration...");
  
  const packageCounter = await contract.packageCounter();
  console.log(`Credit packages created: ${packageCounter}`);

  // Listar pacotes criados
  for (let i = 1; i <= packageCounter; i++) {
    const packageInfo = await contract.getCreditPackageInfo(i);
    console.log(`Package ${i}: ${packageInfo.credits} credits for $${hre.ethers.formatUnits(packageInfo.price, 6)} USDT`);
  }

  // Salvar informações de deploy
  const deployInfo = {
    network: network,
    contractAddress: contractAddress,
    usdtAddress: usdtAddress,
    treasuryWallet: treasuryWallet,
    backendWallet: backendWallet,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const fs = require('fs');
  const path = require('path');
  
  // Criar diretório deployments se não existir
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Salvar informações de deploy
  const deploymentFile = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployInfo, null, 2));
  
  console.log(`\n📄 Deployment info saved to: ${deploymentFile}`);

  // Verificação no Etherscan (apenas para redes públicas)
  if (network !== "localhost" && network !== "hardhat") {
    console.log("\n⏳ Waiting for block confirmations...");
    await contract.deploymentTransaction().wait(6);

    console.log("\n🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
          usdtAddress,
          treasuryWallet,
          backendWallet,
        ],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("❌ Etherscan verification failed:", error.message);
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Update backend configuration with contract address");
  console.log("2. Update frontend configuration with contract address");
  console.log("3. Test the contract functionality");
  
  return {
    contractAddress,
    deployInfo
  };
}

// Executar deploy
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });