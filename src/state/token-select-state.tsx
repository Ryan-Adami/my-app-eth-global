import {
  ARBITRUM_MAINNET_TOKENS,
  AVALANCHE_MAINNET_TOKENS,
  BASE_MAINNET_TOKENS,
  ETH_MAINNET_TOKENS,
} from "@/lib/tokens/tokens.mainnet";
import { proxy } from "valtio";

export const tokenSelectState = proxy({
  isBuildingTokenList: false,
  tokens: structuredClone({
    ...ETH_MAINNET_TOKENS,
    ...ARBITRUM_MAINNET_TOKENS,
    ...AVALANCHE_MAINNET_TOKENS,
    ...BASE_MAINNET_TOKENS,
  }),
});
