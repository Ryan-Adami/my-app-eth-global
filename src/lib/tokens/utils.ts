import { ETH_MAINNET_INFO } from "@/lib/config/chain-constants";
import { Chain } from "viem/chains";
import { TokensObject } from "./tokens.mainnet";
import { ETH_MAINNET_TOKENS } from "./tokens.mainnet";

export interface ChainInfo {
  id: number;
  blockExplorer: {
    name: string;
    url: string;
  };
  name: string;
  logoURI: string;
  tokenList: TokensObject;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
  network?: Chain;
}

export const APPROVED_CHAINS = new Map<number, ChainInfo>([
  [
    ETH_MAINNET_INFO.id,
    {
      id: ETH_MAINNET_INFO.id,
      blockExplorer: ETH_MAINNET_INFO.blockExplorers.default,
      name: ETH_MAINNET_INFO.name,
      logoURI:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIa3GDAlj9jCzDOu-MBV7_NRhZ4VlzN-i8pg&s",
      tokenList: ETH_MAINNET_TOKENS,
      nativeCurrency: ETH_MAINNET_INFO.nativeCurrency,
      network: ETH_MAINNET_INFO,
    },
  ],
]);
