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

export const ETH_MAINNET_ADDRESSES = Object.values(ETH_MAINNET_TOKENS).map(
  (token) => token.address
);
