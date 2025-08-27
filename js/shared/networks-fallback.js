// Lista mínima de redes populares para fallback local
export const fallbackNetworks = [
  {
    name: "BNB Smart Chain Mainnet",
    chainId: 56,
    rpc: ["https://bsc-dataseed.binance.org/"],
    explorers: [{ url: "https://bscscan.com" }],
    nativeCurrency: { symbol: "BNB", decimals: 18 }
  },
  {
    name: "BNB Smart Chain Testnet",
    chainId: 97,
    rpc: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    explorers: [{ url: "https://testnet.bscscan.com" }],
    nativeCurrency: { symbol: "tBNB", decimals: 18 }
  },
  {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpc: ["https://rpc.ankr.com/eth"],
    explorers: [{ url: "https://etherscan.io" }],
    nativeCurrency: { symbol: "ETH", decimals: 18 }
  },
  {
    name: "Polygon Mainnet",
    chainId: 137,
    rpc: ["https://polygon-rpc.com"],
    explorers: [{ url: "https://polygonscan.com" }],
    nativeCurrency: { symbol: "MATIC", decimals: 18 }
  }
];
