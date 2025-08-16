"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";

interface PrivyAppProviderProps {
  children: React.ReactNode;
}

export const PrivyAppProvider: React.FC<PrivyAppProviderProps> = ({
  children,
}) => {
  return (
    <PrivyProvider
      appId={"cmeefh83c00cpl20ccrehw2tn"}
      config={{
        loginMethods: ["telegram"],
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
};
