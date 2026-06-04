import { cn } from "../../lib/utils";
import { Label } from "./label";

export function Form({ className, ...props }) {
  return <form className={cn("space-y-6", className)} {...props} />;
}

export function FormField({ className, ...props }) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FormItem({ className, ...props }) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export function FormLabel({ className, ...props }) {
  return <Label className={cn("text-sm font-medium", className)} {...props} />;
}

export function FormControl({ className, ...props }) {
  return <div className={cn("flex flex-col", className)} {...props} />;
}

export function FormDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function FormMessage({ className, ...props }) {
  return <p className={cn("text-sm text-red-500", className)} {...props} />;
}
