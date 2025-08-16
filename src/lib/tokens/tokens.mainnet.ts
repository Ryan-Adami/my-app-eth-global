import { Address } from "viem";

export type TokensObject = {
  [tokenId: string]: TokenInfo;
};

export type ExternalBridge = {
  name: string;
  url: string;
};

export type TokenInfo = {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  address: Address;
  chainId: number;
  balanceOf: bigint | undefined;
};

// ADDRESSES MUST BE LOWERCASED
export const ETH_MAINNET_TOKENS = {
  "1~0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
    tokenId: "1~0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    chainId: 1,
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
    balanceOf: undefined,
  },
} as TokensObject;

export const ARBITRUM_MAINNET_TOKENS = {
  "42161~0xaf88d065e77c8cc2239327c5edb3a432268e5831": {
    tokenId: "42161~0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    chainId: 42161,
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
    balanceOf: undefined,
  },
} as TokensObject;

export const AVALANCHE_MAINNET_TOKENS = {
  "43114~0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": {
    tokenId: "43114~0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    address: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
    chainId: 43114,
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
    balanceOf: undefined,
  },
} as TokensObject;

export const BASE_MAINNET_TOKENS = {
  "8453~0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": {
    tokenId: "8453~0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    chainId: 8453,
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
    balanceOf: undefined,
  },
} as TokensObject;

export const ETH_MAINNET_ADDRESSES = Object.values(ETH_MAINNET_TOKENS).map(
  (token) => token.address
);
