"use client";

import { BackButtonWrapper } from "@/components/back-button-wrapper";
import { generateCoinbaseOnrampURLAction } from "@/lib/coinbase/ramp.actions";
import { toggleActivityNotification } from "@/state/notifications/activity-notification";

import { usePrivy, useSessionSigners } from "@privy-io/react-auth";
import {
  initDataState,
  useSignal,
  closeMiniApp,
} from "@telegram-apps/sdk-react";
import {
  ArrowRightLeft,
  Loader2,
  Scan,
  Send,
  UserIcon,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useServerAction } from "zsa-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { EthereumIcon } from "@/components/ui/icons/ethereum";
import { WalletDisplay } from "@/components/ui/wallet-display";
import { ActionButtons } from "@/components/ui/action-buttons";
import { TokenDisplay } from "@/components/ui/token-display";
import { useSnapshot } from "valtio";
import { tokenSelectState } from "@/state/token-select-state";
import { ArbitrumIcon } from "@/components/ui/icons/arbitrum";
import { BaseIcon } from "@/components/ui/icons/base";
import { AvalancheIcon } from "@/components/ui/icons/avalanche";

export default function Home() {
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [isReceiveDrawerOpen, setIsReceiveDrawerOpen] = useState(false);

  const { login, authenticated, ready, user } = usePrivy();
  const { addSessionSigners } = useSessionSigners();
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const initData = useSignal(initDataState);
  const { tokens } = useSnapshot(tokenSelectState);

  useEffect(() => {
    // Check if we're in a Telegram Mini App environment
    const checkTelegramEnv = () => {
      try {
        if (initData) {
          setIsTelegramEnv(true);

          // Extract Telegram user ID from init data
          if (initData.user?.id) {
            setTelegramId(initData.user.id.toString());
          }

          // In Telegram Mini App, Privy should handle seamless login automatically
          // when the user is not authenticated
          if (!authenticated && ready) {
            login();
            if (user?.wallet?.address) {
              addSessionSigners({
                address: user.wallet.address,
                signers: [
                  {
                    signerId: "qey1tpgwftard3imgm52sjmc",
                    policyIds: [],
                  },
                ],
              });
            }
          }
        }
      } catch {
        console.log("Not in Telegram Mini App environment");
        setIsTelegramEnv(false);
      }
    };

    checkTelegramEnv();
  }, [
    initData,
    authenticated,
    ready,
    login,
    user?.wallet?.address,
    addSessionSigners,
  ]);

  const {
    execute: generateCoinbaseOnrampURL,
    isPending: isCoinbaseOnrampPending,
  } = useServerAction(generateCoinbaseOnrampURLAction, {
    onError: (error) => {
      toast.remove();
      toggleActivityNotification({
        status: "reverted",
        title: error.err?.message || "Failed to generate onramp URL",
      });
    },
    onSuccess: (data) => {
      if (data.data.url) {
        window.open(data.data.url);
      }
      toast.remove();
    },
  });

  if (isTelegramEnv && !authenticated && ready) {
    return (
      <BackButtonWrapper back={false}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Loader2 className="animate-spin" />
        </div>
      </BackButtonWrapper>
    );
  }

  return (
    <BackButtonWrapper back={false}>
      <div className="flex flex-col p-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex gap-2 items-center">
            <Avatar className="w-10 h-10">
              <AvatarImage src={initData?.user?.photo_url} />
              <AvatarFallback>
                <UserIcon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              {initData?.user?.username && (
                <div className="text-sm text-muted-foreground">
                  @{initData?.user?.username}
                </div>
              )}
              <div className=" font-medium">
                {initData?.user?.first_name} {initData?.user?.last_name}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="flex items-center justify-center"
            onClick={() => {
              setIsReceiveDrawerOpen(true);
            }}
          >
            <Scan className="w-6 h-6" />
          </Button>
        </div>
        {user?.wallet?.address &&
          tokens["1~0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"].balanceOf ===
            0n && (
            <div className="flex flex-col items-center justify-center p-4 mt-4 rounded-md bg-muted animate-in fade-in duration-500">
              <Waves className="w-10 h-10" />
              <div className="text-xl mt-4">
                Welcome
                {initData?.user?.username ? `, @${initData.user.username}` : ""}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Add USDC to your wallet to get started
              </div>
              <Button
                disabled={
                  isCoinbaseOnrampPending ||
                  user?.wallet?.address === undefined ||
                  telegramId === null
                }
                className="mt-4 w-full"
                onClick={() =>
                  generateCoinbaseOnrampURL({
                    asset: "USDC",
                    amount: "20",
                    network: "ethereum",
                    fiatCurrency: "USD",
                    addresses: [
                      {
                        address: user!.wallet!.address,
                        blockchains: ["ethereum"],
                      },
                    ],
                    telegramId: telegramId!,
                  })
                }
              >
                Buy USDC with cash
              </Button>
              <Drawer
                open={isReceiveDrawerOpen}
                onOpenChange={setIsReceiveDrawerOpen}
              >
                <DrawerTrigger asChild>
                  <Button variant="outline" className="mt-2 w-full">
                    Receive USDC
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                      <DrawerTitle>Receive USDC</DrawerTitle>
                      <DrawerDescription>
                        Receive USDC to any of your addresses below
                      </DrawerDescription>
                    </DrawerHeader>
                    <WalletDisplay
                      icon={
                        <EthereumIcon className="w-6 h-6 text-background" />
                      }
                      name="Ethereum"
                      address={user?.wallet?.address}
                    />
                    <WalletDisplay
                      icon={
                        <ArbitrumIcon className="w-6 h-6 text-background" />
                      }
                      name="Arbitrum"
                      address={user?.wallet?.address}
                    />
                    <WalletDisplay
                      icon={
                        <AvalancheIcon className="w-6 h-6 text-background" />
                      }
                      name="Avalanche"
                      address={user?.wallet?.address}
                    />
                    <WalletDisplay
                      icon={<BaseIcon className="w-6 h-6 text-background" />}
                      name="Base"
                      address={user?.wallet?.address}
                    />
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          )}
        <ActionButtons
          actions={[
            {
              icon: <Scan />,
              label: "Receive",
              onClick: () => {
                setIsReceiveDrawerOpen(true);
              },
            },
            {
              icon: <Send />,
              label: "Send",
              onClick: () => {
                closeMiniApp();
              },
            },
            {
              icon: <ArrowRightLeft />,
              label: "Transfer",
              onClick: () => {
                closeMiniApp();
              },
            },
          ]}
        />
        <div className="mt-4 text-xl font-medium mb-2">Tokens</div>
        <div className="flex flex-col gap-2">
          <TokenDisplay
            token={tokens["1~0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"]}
          />
          <TokenDisplay
            token={tokens["42161~0xaf88d065e77c8cc2239327c5edb3a432268e5831"]}
          />
          <TokenDisplay
            token={tokens["43114~0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"]}
          />
          <TokenDisplay
            token={tokens["8453~0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"]}
          />
        </div>
      </div>
    </BackButtonWrapper>
  );
}
