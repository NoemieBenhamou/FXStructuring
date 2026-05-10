import { cn } from "@/lib/utils";

export function StatList({
  items,
  compact = false
}: {
  items: Array<{ label: string; value: string; tone?: "neutral" | "positive" | "negative" | "gold" }>;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4")}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-bank-border bg-bank-bgAlt/50 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-bank-muted">{item.label}</div>
          <div
            className={cn(
              "mt-2 font-mono text-lg",
              item.tone === "positive" && "text-emerald-200",
              item.tone === "negative" && "text-rose-200",
              item.tone === "gold" && "text-bank-gold",
              (!item.tone || item.tone === "neutral") && "text-bank-text"
            )}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
