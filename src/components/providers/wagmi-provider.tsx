"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { networks, wagmiAdapter, wagmiConfig } from "@/lib/config/wagmi";
import { createAppKit } from "@reown/appkit/react";

const queryClient = new QueryClient();

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: "1226c57230a0b6d1b7d28fb4071e6bad",
  networks,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#ffffff",
  },
});

export function WagmiContextProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
