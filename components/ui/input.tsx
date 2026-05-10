import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-bank-border bg-bank-bgAlt/80 px-3 py-2 text-sm text-bank-text outline-none transition placeholder:text-slate-500 focus:border-bank-cyan",
        className
      )}
      {...props}
    />
  );
}
