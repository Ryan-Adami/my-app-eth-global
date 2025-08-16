import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { WagmiContextProvider } from "@/components/providers/wagmi-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants";
import TokensProvider from "@/components/providers/tokens-provider";
import { PrivyAppProvider } from "@/components/providers/privy-provider";
import { TelegramProvider } from "@/components/providers/telegram-provider";
import { Root } from "@/components/Root";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextTopLoader
          initialPosition={0.15}
          shadow="0 0 10px #000, 0 0 5px #000"
          height={4}
        />
        <TelegramProvider>
          <PrivyAppProvider>
            <WagmiContextProvider>
              <TokensProvider>
                <TooltipProvider delayDuration={100} skipDelayDuration={50}>
                  <Root>{children}</Root>
                </TooltipProvider>
              </TokensProvider>
            </WagmiContextProvider>
          </PrivyAppProvider>
        </TelegramProvider>
        <Toaster containerStyle={{ marginTop: "48px", zIndex: 50 }} />
      </body>
    </html>
  );
}
