import { ETH_MAINNET_INFO } from "@/lib/config/chain-constants";
import { arbitrum, avalanche, base, Chain } from "viem/chains";
import {
  ARBITRUM_MAINNET_TOKENS,
  AVALANCHE_MAINNET_TOKENS,
  BASE_MAINNET_TOKENS,
  TokensObject,
} from "./tokens.mainnet";
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
        "https://upload.wikimedia.org/wikipedia/commons/b/b7/ETHEREUM-YOUTUBE-PROFILE-PIC.png",
      tokenList: ETH_MAINNET_TOKENS,
      nativeCurrency: ETH_MAINNET_INFO.nativeCurrency,
      network: ETH_MAINNET_INFO,
    },
  ],
  [
    arbitrum.id,
    {
      id: arbitrum.id,
      name: "Arbitrum",
      blockExplorer: arbitrum.blockExplorers.default,
      logoURI:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdvncrIV74_kXqcACD8doVBeG5aDHHXRDDqw&s",
      tokenList: ARBITRUM_MAINNET_TOKENS,
      nativeCurrency: arbitrum.nativeCurrency,
      network: arbitrum,
    },
  ],
  [
    avalanche.id,
    {
      id: avalanche.id,
      name: avalanche.name,
      blockExplorer: avalanche.blockExplorers.default,
      logoURI:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4h7zSafilvGpowXKLHQnfO-XmaE7hoEFKug&s",
      tokenList: AVALANCHE_MAINNET_TOKENS,
      nativeCurrency: avalanche.nativeCurrency,
      network: avalanche,
    },
  ],
  [
    base.id,
    {
      id: base.id,
      name: base.name,
      blockExplorer: base.blockExplorers.default,
      logoURI:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSswKRfheiyB5QHc0BgZ8oh5ErqyaX0M_ewbA&s",
      tokenList: BASE_MAINNET_TOKENS,
      nativeCurrency: base.nativeCurrency,
      network: base,
    },
  ],
]);
