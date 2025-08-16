import * as React from "react";

import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  isDismissable?: boolean;
  onClose(): void;
  icon?: React.ReactElement<{ className?: string }>;
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      className,
      isDismissable = true,
      isLoading = false,
      children,
      onClose,
      icon,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-row justify-between items-center relative max-sm:w-80 w-96 py-2 px-4 bg-accent rounded-xl border border-border/50",
        className
      )}
      {...props}
    >
      <div className="flex flex-row items-center gap-4 overflow-hidden overflow-ellipsis">
        {isLoading ? (
          <div>
            <Loader2 size="md" className="h-[24px] animate-spin" />
          </div>
        ) : icon ? (
          <div>
            {React.cloneElement(icon, {
              className: cn(icon.props.className),
            })}
          </div>
        ) : (
          <></>
        )}
        <div className="flex flex-col relative overflow-hidden overflow-ellipsis">
          {children}
        </div>
      </div>
      {isDismissable && (
        <X
          className="min-w-[28px] hover:text-muted-foreground cursor-pointer"
          onClick={onClose}
        />
      )}
    </div>
  )
);
Notification.displayName = "Notification";

const NotificationTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <div className="flex flex-row justify-between">
    <div
      ref={ref}
      className={cn("overflow-hidden overflow-ellipsis", className)}
      {...props}
    />
  </div>
));
NotificationTitle.displayName = "NotificationTitle";

const NotificationDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[14px] [&_p]:leading-relaxed overflow-hidden overflow-ellipsis text-muted-foreground",
      className
    )}
    {...props}
  />
));
NotificationDescription.displayName = "NotificationDescription";

export { Notification, NotificationTitle, NotificationDescription };
