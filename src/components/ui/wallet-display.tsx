"use client";

import { Copy, Check } from "lucide-react";
import { shortenEthWalletAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface WalletDisplayProps {
  icon: React.ReactNode;
  name: string;
  address?: string;
  className?: string;
  showCopyButton?: boolean;
  onCopy?: (address: string) => void;
}

export function WalletDisplay({
  icon,
  name,
  address,
  className,
  showCopyButton = true,
  onCopy,
}: WalletDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      onCopy?.(address);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {}
  };

  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between bg-accent p-4 rounded-lg",
        className
      )}
    >
      <div className="flex flex-row gap-2">
        <div className="p-2 border bg-foreground rounded-lg">{icon}</div>
        <div className="flex flex-col">
          <div className="text-foreground">{name}</div>
          {address && (
            <div className="text-sm text-muted-foreground">
              {copied ? "Copied!" : shortenEthWalletAddress(address)}
            </div>
          )}
        </div>
      </div>
      {showCopyButton && address && (
        <button
          onClick={handleCopy}
          className={
            "bg-background rounded-full p-2 hover:bg-muted transition-colors"
          }
          aria-label={copied ? "Address copied" : "Copy address"}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
