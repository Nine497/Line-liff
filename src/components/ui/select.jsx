import { forwardRef } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";

export const Select = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        ref={ref}
        className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
        <ChevronsUpDown className="h-4 w-4" />
      </span>
    </div>
  );
});
Select.displayName = "Select";
