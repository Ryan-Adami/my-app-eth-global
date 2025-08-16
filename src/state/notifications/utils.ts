import { TokenInfo } from "@/lib/tokens/tokens.mainnet";
import { notificationsState } from "./notifications-state";

export const addPendingTx = (
  txHash: `0x${string}` | undefined,
  title: string,
  successTitle: string,
  failureTitle: string,
  chainId: number,
  token?: TokenInfo,
  isBridgeTx?: "native" | "layerzero",
  description?: string
) => {
  if (txHash !== undefined) {
    const exists = notificationsState.pendingTxs.some(
      (tx) => tx.txHash?.toLocaleLowerCase() === txHash.toLocaleLowerCase()
    );

    if (!exists) {
      notificationsState.pendingTxs.push({
        txHash: txHash,
        logoURI: token?.logoURI || "",
        title: title,
        description: description ?? "",
        successTitle: successTitle,
        failureTitle: failureTitle,
        isCompleted: false,
        chainId: chainId,
        token: token,
      });
    }
  }
};
