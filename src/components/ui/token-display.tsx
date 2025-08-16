"use client";

import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TokenInfo } from "@/lib/tokens/tokens.mainnet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { APPROVED_CHAINS } from "@/lib/tokens/utils";

interface TokenDisplayProps {
  token: TokenInfo;
  className?: string;
  showCopyButton?: boolean;
  onCopy?: (address: string) => void;
  usdValue?: number; // Optional USD value for the token balance
}

export function TokenDisplay({
  token,
  className,
  showCopyButton = true,
  onCopy,
  usdValue,
}: TokenDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!token.address) return;

    try {
      await navigator.clipboard.writeText(token.address);
      setCopied(true);
      onCopy?.(token.address);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {}
  };

  // Format balance based on token decimals
  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return "0";
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;
    const fractionStr = fraction.toString().padStart(decimals, "0");
    return `${whole}.${fractionStr}`;
  };

  // Format USD value
  const formatUSDValue = (value?: number) => {
    if (!value) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const balance = formatBalance(token.balanceOf, token.decimals);
  const usdFormatted = formatUSDValue(usdValue);

  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between bg-accent p-2 rounded-lg",
        className
      )}
    >
      <div className="flex flex-row gap-2 items-center">
        <div className="p-2">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={token.logoURI} />
              <AvatarFallback variant="primary" size="sm">
                {token.symbol.slice(0, 3)}
              </AvatarFallback>
            </Avatar>
            {token?.chainId !== undefined && (
              <div
                className={cn(
                  "absolute -bottom-0 -right-1 h-5 w-5 overflow-hidden rounded-sm border border-background"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={APPROVED_CHAINS.get(token.chainId)?.logoURI}
                  alt="token indicator"
                  className="h-full w-full object-cover bg-foreground"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-foreground font-medium">{token.name}</div>
          <div className="text-sm text-muted-foreground">
            {copied ? "Copied!" : `${balance} ${token.symbol}`}
          </div>
          {usdFormatted && (
            <div className="text-xs text-muted-foreground">{usdFormatted}</div>
          )}
        </div>
      </div>
      {showCopyButton && token.address && (
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
