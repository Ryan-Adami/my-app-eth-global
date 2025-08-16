"use client";

import { cn, formatNumber } from "@/lib/utils";
import { TokenInfo } from "@/lib/tokens/tokens.mainnet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { APPROVED_CHAINS } from "@/lib/tokens/utils";
import { formatUnits } from "viem";

interface TokenDisplayProps {
  token: TokenInfo;
  className?: string;
}

export function TokenDisplay({ token, className }: TokenDisplayProps) {
  const balance = formatUnits(token?.balanceOf ?? 0n, token?.decimals);
  const formattedBalance = formatNumber({
    value: balance,
    minMaxPrecision: [2, 2],
  });
  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between bg-accent p-4 rounded-lg",
        className
      )}
    >
      <div className="flex flex-row gap-2 items-center">
        <div>
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={token?.logoURI} />
              <AvatarFallback variant="primary" size="sm">
                {token?.symbol.slice(0, 3)}
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
                  src={APPROVED_CHAINS.get(token?.chainId)?.logoURI}
                  alt="token indicator"
                  className="h-full w-full object-cover bg-foreground"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-foreground font-medium">{token?.name}</div>
          <div className="text-sm text-muted-foreground">
            {`${formattedBalance} ${token?.symbol}`}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-foreground">
          ${formattedBalance}
        </div>
      </div>
    </div>
  );
}
