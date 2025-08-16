"use client";
import { buildTokenList } from "@/lib/tokens/actions";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";
import { useSnapshot } from "valtio";
import { useAccount } from "wagmi";
import { getTransactionReceipt, waitForTransactionReceipt } from "@wagmi/core";
import toast from "react-hot-toast";
import { wagmiConfig } from "@/lib/config/wagmi";
import { tokenSelectState } from "../../state/token-select-state";
import { toggleActivityNotification } from "../../state/notifications/activity-notification";
import { notificationsState } from "../../state/notifications/notifications-state";

export default function TokensProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { mostRecentSuccessfulTx, pendingTxs } =
    useSnapshot(notificationsState);

  useEffect(() => {
    const handleNotifications = async () => {
      if (pendingTxs.length > 0) {
        const pendingTxPromises = pendingTxs.map(async (pendingTx) => {
          try {
            if (pendingTx.isCompleted) {
              return;
            }
            if (!pendingTx.txHash) return;

            const oldReceipt = await getTransactionReceipt(wagmiConfig, {
              hash: pendingTx.txHash,
            }).catch(() => null);

            if (oldReceipt) {
              notificationsState.pendingTxs = pendingTxs.map((tx) =>
                tx.txHash?.toLowerCase() ===
                oldReceipt.transactionHash.toLowerCase()
                  ? { ...tx, isCompleted: true }
                  : tx
              );
              return;
            }

            const notificationId = toggleActivityNotification({
              txHash: pendingTx.txHash!,
              status: "pending",
              title: pendingTx.title,
              description: pendingTx.description,
              chainId: pendingTx.chainId,
            });
            const receipt = await waitForTransactionReceipt(wagmiConfig, {
              hash: pendingTx.txHash!,
            });
            toggleActivityNotification({
              txHash: receipt.transactionHash,
              status: receipt.status,
              title:
                receipt.status === "success"
                  ? pendingTx.successTitle
                  : pendingTx.failureTitle,
              description: pendingTx.description,
              chainId: pendingTx.chainId,
              isInfiniteDuration: true,
            });
            toast.remove(notificationId);
            // Mark as completed instead of filtering
            notificationsState.pendingTxs = pendingTxs.map((tx) =>
              tx.txHash?.toLowerCase() === receipt.transactionHash.toLowerCase()
                ? { ...tx, isCompleted: true }
                : tx
            );
            if (receipt.status === "success") {
              notificationsState.mostRecentSuccessfulTx =
                receipt.transactionHash;
            }
          } catch (error) {
            toggleActivityNotification({
              txHash: pendingTx.txHash,
              status: "reverted",
              title: pendingTx.failureTitle,
              description: "",
              chainId: pendingTx.chainId,
            });
            // Mark as completed instead of filtering
            notificationsState.pendingTxs = pendingTxs.map((tx) =>
              tx.txHash === pendingTx.txHash ? { ...tx, isCompleted: true } : tx
            );
            console.error(error);
          }
        });
        await Promise.allSettled(pendingTxPromises);
      }
    };
    handleNotifications();
  }, [pendingTxs]);

  useQuery({
    queryKey: ["tokens", address, chainId, isConnected, mostRecentSuccessfulTx],
    queryFn: async () => {
      if (isConnected && address && chainId) {
        await buildTokenList({ userAddress: address });
      } else {
        tokenSelectState.isBuildingTokenList = true;
        tokenSelectState.tokens = {
          ...Object.fromEntries(
            Object.entries({
              ...tokenSelectState.tokens,
            }).map(([key, token]) => [
              key,
              {
                ...token,
                balanceOf: BigInt(0),
              },
            ])
          ),
        };
        tokenSelectState.isBuildingTokenList = false;
      }
      return tokenSelectState.tokens;
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  return <>{children}</>;
}
