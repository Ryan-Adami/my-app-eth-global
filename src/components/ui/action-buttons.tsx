"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ActionButton {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

interface ActionButtonsProps {
  actions: ActionButton[];
  className?: string;
  iconClassName?: string;
}

export function ActionButtons({
  actions,
  className,
  iconClassName = "w-6 h-6 text-sky-500",
}: ActionButtonsProps) {
  return (
    <div className={cn("flex flex-row gap-2 mt-4 w-full", className)}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className="bg-muted flex flex-col rounded-lg p-4 items-center justify-center flex-1 hover:bg-muted/80 transition-colors"
        >
          <div className={iconClassName}>{action.icon}</div>
          <div className="text-xs mt-1">{action.label}</div>
        </button>
      ))}
    </div>
  );
}
