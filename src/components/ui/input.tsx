import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
