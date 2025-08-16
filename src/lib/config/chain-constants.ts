export const ETH_MAINNET_INFO = {
  id: 1 as number,
  chainIdHex: "0x1",
  name: `Ethereum`,
  network: `mainnet`,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [
        "https://cloudflare-eth.com",
        "https://ethereum.publicnode.com",
      ] as string[],
    },
    public: {
      http: [
        "https://cloudflare-eth.com",
        "https://ethereum.publicnode.com",
        "https://rpc.mevblocker.io",
      ] as string[],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
  },
  testnet: false,
};
