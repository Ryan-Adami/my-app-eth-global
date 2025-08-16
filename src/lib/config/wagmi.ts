import { http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  mainnet,
  AppKitNetwork,
  arbitrum,
  avalanche,
  base,
} from "@reown/appkit/networks";
import { fallback } from "wagmi";
import { ETH_MAINNET_INFO } from "./chain-constants";

export const networks = [mainnet] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  networks: networks,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  batch: {
    multicall: true,
  },
  transports: {
    [ETH_MAINNET_INFO.id]: fallback([
      http(ETH_MAINNET_INFO.rpcUrls.default.http[1]),
    ]),
    [arbitrum.id]: http(),
    [avalanche.id]: http(),
    [base.id]: http(),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
