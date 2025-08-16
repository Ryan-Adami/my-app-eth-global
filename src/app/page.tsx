"use client";

import { BackButtonWrapper } from "@/components/back-button-wrapper";

import { usePrivy, useSessionSigners } from "@privy-io/react-auth";
import { retrieveLaunchParams } from "@telegram-apps/bridge";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);

  const { login, authenticated, ready, user } = usePrivy();
  const { addSessionSigners } = useSessionSigners();

  useEffect(() => {
    // Check if we're in a Telegram Mini App environment
    const checkTelegramEnv = () => {
      try {
        const launchParams = retrieveLaunchParams();
        if (launchParams) {
          setIsTelegramEnv(true);
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
  }, [authenticated, ready, login]);

  // Show loading state while attempting to login in Telegram environment
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
      <div>{user?.wallet?.address}</div>
    </BackButtonWrapper>
  );
}
