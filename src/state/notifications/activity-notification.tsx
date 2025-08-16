import toast from "react-hot-toast";

import {
  ArrowUpRightFromSquare,
  CheckCircle,
  Loader2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { APPROVED_CHAINS } from "@/lib/tokens/utils";
import { ReceiptTxNotificationProps } from "./notifications-state";
import {
  Notification,
  NotificationTitle,
  NotificationDescription,
} from "@/components/ui/notification";
import { NEXT_PUBLIC_SITE_URL } from "@/constants";

export const toggleActivityNotification = ({
  txHash,
  status,
  title,
  description,
  chainId,
  isInfiniteDuration = false,
  isTransactionLink = false,
}: ReceiptTxNotificationProps) => {
  const toastId = toast.custom(
    (t) => (
      <div
        key={txHash ?? title}
        className={t.visible ? "animate-enter" : "animate-leave"}
      >
        <Notification
          onClose={() => toast.remove(t.id)}
          icon={
            status === "success" ? (
              <CheckCircle className="text-green-500" size={36} />
            ) : status === "pending" ? (
              <Loader2 className="animate-spin" size={36} />
            ) : status === "warning" ? (
              <AlertTriangle className="text-yellow-500" size={36} />
            ) : status === "info" ? (
              <Info className="text-blue-500" size={36} />
            ) : (
              <XCircle className="text-red-500" size={36} />
            )
          }
          className="mt-2"
        >
          <NotificationTitle>{title}</NotificationTitle>
          {description && (
            <NotificationDescription>{description}</NotificationDescription>
          )}
          {isTransactionLink ? (
            <NotificationDescription>
              <a
                className="flex flex-row items-start gap-2 hover:underline hover:cursor-pointer w-full text-left"
                href={`${NEXT_PUBLIC_SITE_URL}/dashboard/transactions`}
              >
                <div className="text-left">View transaction</div>
                <ArrowUpRightFromSquare
                  size={12}
                  className="mt-1 flex-shrink-0"
                />
              </a>
            </NotificationDescription>
          ) : (
            txHash &&
            chainId && (
              <NotificationDescription>
                <a
                  className="flex flex-row items-start gap-2 hover:underline hover:cursor-pointer w-full text-left"
                  href={`${
                    APPROVED_CHAINS.get(chainId)?.blockExplorer?.url
                  }/tx/${txHash}`}
                  target="_blank"
                >
                  <div className="text-left">View transaction</div>
                  <ArrowUpRightFromSquare
                    size={12}
                    className="mt-1 flex-shrink-0"
                  />
                </a>
              </NotificationDescription>
            )
          )}
        </Notification>
      </div>
    ),
    {
      position: "top-right",
      duration: isInfiniteDuration ? Infinity : undefined,
    }
  );

  return toastId;
};
