import { cn } from "../../lib/utils";

export function Tabs({ className, ...props }) {
  return <div className={cn("flex flex-col gap-3", className)} {...props} />;
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn("inline-flex h-10 items-center rounded-lg bg-muted p-1 text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ active, className, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
        active && "bg-background text-foreground shadow-sm",
        className,
      )}
      type="button"
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <div className={cn("outline-none", className)} {...props} />;
}
