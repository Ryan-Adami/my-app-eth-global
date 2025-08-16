import { TokenInfo } from "@/lib/tokens/tokens.mainnet";
import { proxy } from "valtio";

export interface PendingTxNotificationProps {
  txHash?: `0x${string}`;
  logoURI?: string;
  title: string;
  description?: string;
  successTitle: string;
  failureTitle: string;
  chainId?: number;
  isCompleted: boolean;
  token?: TokenInfo;
}

export interface ReceiptTxNotificationProps {
  txHash?: `0x${string}`;
  status: "success" | "reverted" | "pending" | "warning" | "info";
  title: string;
  description?: string;
  chainId?: number;
  isInfiniteDuration?: boolean;
  isTransactionLink?: boolean;
}

interface NotificationsStateProps {
  pendingTxs: PendingTxNotificationProps[];
  txReceipts: ReceiptTxNotificationProps[];
  mostRecentSuccessfulTx: string | undefined;
}

export const notificationsState = proxy<NotificationsStateProps>({
  pendingTxs: [],
  txReceipts: [],
  mostRecentSuccessfulTx: undefined,
});
