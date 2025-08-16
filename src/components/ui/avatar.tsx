"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const avatarFallbackVariants = cva(
  "flex h-full w-full items-center justify-center rounded-full bg-muted",
  {
    variants: {
      variant: {
        default: "",
        primary: "bg-blue-900 text-blue-400 border border-blue-950",
      },
      size: {
        sm: "text-[8px]",
        default: "text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, variant, size, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(avatarFallbackVariants({ variant, size, className }))}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

interface AvatarsGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number;
  total?: number;
}

const AvatarsGroup = ({
  className,
  children,
  limit = 2,
  total,
  ...props
}: AvatarsGroupProps) => {
  const avatars = React.Children.toArray(children).slice(0, limit);
  return (
    <div
      className={cn(
        "flex flex-row items-center flex-wrap space-x-[-12px]",
        className
      )}
      {...props}
    >
      {avatars}
      {total && (
        <Avatar>
          <AvatarFallback>+{total - limit}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export { Avatar, AvatarImage, AvatarFallback, AvatarsGroup };
