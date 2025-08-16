import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TipBoxProps {
  message: ReactNode; // Accept string or JSX
  className?: string;
  type?: "tip" | "notice" | "error";
}

const capitalizeFirstLetter = (type: string) => {
  if (!type) return type;
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export function InfoBox({ message, type = "tip", className }: TipBoxProps) {
  const baseClasses = "p-4 rounded-lg mb-2";

  const colorClasses = cn({
    "bg-blue-500/20 text-blue-400": type === "tip",
    "bg-yellow-500/20 text-yellow-400": type === "notice",
    "bg-red-500/20 text-red-400": type === "error",
  });

  return (
    <div className={cn(baseClasses, colorClasses, className)}>
      <span className="font-semibold">{capitalizeFirstLetter(type)}:</span>{" "}
      {message}
    </div>
  );
}
