import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-bank-border/80 bg-bank-bgAlt/70 text-bank-text",
  gold: "border-bank-gold/50 bg-bank-gold/10 text-bank-gold",
  green: "border-bank-green/50 bg-bank-green/10 text-emerald-200",
  red: "border-bank-red/50 bg-bank-red/10 text-rose-200",
  amber: "border-bank-amber/50 bg-bank-amber/10 text-amber-200",
  blue: "border-bank-cyan/50 bg-bank-cyan/10 text-cyan-200"
} as const;

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
