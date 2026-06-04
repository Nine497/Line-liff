import { cn } from "../../lib/utils";

export function Label({ className, htmlFor, children, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-2 block text-sm font-medium leading-none text-muted-foreground", className)}
      {...props}
    >
      {children}
    </label>
  );
}
