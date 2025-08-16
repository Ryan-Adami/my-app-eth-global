import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center z-10 justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:bg-accent disabled:text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-sky-500 text-white hover:bg-sky-600",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border text-gray-100 border-gray-100 hover:border-gray-200 bg-transparent hover:text-gray-200",
        outlineInput:
          "border text-foreground border-input hover:border-input-300 bg-transparent disabled:pointer-events-diabled disabled:opacity-50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        connect: "bg-sky-500/20 hover:bg-sky-500/15 text-sky-400 rounded-xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const loaderVariants = cva("ml-2 animate-spin text-foreground", {
  variants: {
    size: {
      default: "h-[16px] w-[16px]",
      sm: "h-[14px] w-[14px]",
      lg: "h-[18px] w-[18px]",
      icon: "h-[14px] w-[14px]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // When using asChild, avoid cloning and nesting content
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {props.children}
        </Comp>
      );
    }

    // When not using asChild, we can safely include the loading indicator
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {props.children}
        {isLoading && (
          <Loader2
            className={cn(
              loaderVariants({
                size: size,
              })
            )}
          />
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
