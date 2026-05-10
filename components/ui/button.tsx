import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-bank-gold text-bank-bg hover:bg-[#d7b676]",
  secondary: "border border-bank-border bg-bank-bgAlt/80 text-bank-text hover:bg-bank-panel",
  ghost: "text-bank-muted hover:bg-bank-bgAlt/70 hover:text-bank-text"
} as const;

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
