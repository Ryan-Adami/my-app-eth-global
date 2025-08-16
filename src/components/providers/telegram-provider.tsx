"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { mockEnv } from "@/utils/mockEnv";
import { init } from "@/utils/init";
import { Loader2 } from "lucide-react";

export function TelegramProvider({ children }: PropsWithChildren) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTelegram = async () => {
      try {
        await mockEnv();
        const launchParams = retrieveLaunchParams();
        const { tgWebAppPlatform: platform } = launchParams;
        const debug =
          (launchParams.tgWebAppStartParam || "").includes("debug") ||
          process.env.NODE_ENV === "development";

        // Configure all application dependencies.
        await init({
          debug,
          eruda: debug && ["ios", "android"].includes(platform),
          mockForMacOS: platform === "macos",
        });

        setIsInitialized(true);
      } catch (e) {
        console.error("Failed to initialize Telegram SDK:", e);
        setError(e instanceof Error ? e.message : "Unknown error");
        // Still set as initialized to prevent infinite loading
        setIsInitialized(true);
      }
    };

    initializeTelegram();
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "red",
        }}
      >
        <div>Failed to initialize: {error}</div>
      </div>
    );
  }

  return <>{children}</>;
}
