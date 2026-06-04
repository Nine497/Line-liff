import { cn } from "../../lib/utils";

export function Dialog({ open, className, children, ...props }) {
  if (!open) return null;

  return (
    <div
      className={cn("fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogContent({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-input bg-background text-foreground shadow-2xl",
        className,
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("flex flex-col gap-2 p-6 pt-0 sm:flex-row sm:justify-end", className)} {...props} />;
}
