import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppTooltipProps = {
  children: ReactNode;
  className?: string;
  label: ReactNode;
  side?: "top" | "bottom";
};

export function AppTooltip({ children, className, label, side = "top" }: AppTooltipProps) {
  return (
    <div className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 rounded-xl border border-bank-border bg-bank-panel/95 px-3 py-2 text-left text-xs leading-5 text-bank-text opacity-0 shadow-2xl shadow-black/30 backdrop-blur transition duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2"
        )}
      >
        {label}
      </div>
    </div>
  );
}
