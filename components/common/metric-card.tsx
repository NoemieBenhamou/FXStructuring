import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  suffix,
  tone = "neutral",
  decimals = 2
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: "neutral" | "positive" | "negative" | "gold";
  decimals?: number;
}) {
  const isNumber = typeof value === "number";
  const formatted = isNumber ? formatNumber(value, decimals) : value;

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 p-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-bank-muted">{label}</div>
        <div className="flex items-center gap-2">
          {tone === "positive" ? <ArrowUpRight className="h-4 w-4 text-emerald-300" /> : null}
          {tone === "negative" ? <ArrowDownRight className="h-4 w-4 text-rose-300" /> : null}
          <span
            className={cn(
              "font-mono text-2xl font-semibold tracking-tight",
              tone === "positive" && "text-emerald-200",
              tone === "negative" && "text-rose-200",
              tone === "gold" && "text-bank-gold",
              tone === "neutral" && "text-bank-text"
            )}
          >
            {formatted}
            {suffix}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
