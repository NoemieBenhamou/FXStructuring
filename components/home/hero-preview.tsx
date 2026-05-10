"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import demoNews from "@/data/news/fx-news-demo.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { computePairSnapshot } from "@/lib/market";

export function HeroPreview() {
  const snapshot = computePairSnapshot("EURUSD");
  const [showRv20, setShowRv20] = useState(true);
  const [showRv60, setShowRv60] = useState(true);
  const ideaCards = [
    { name: "Forward", note: "Budget certainty for known USD outflow." },
    { name: "Vanilla option", note: "Preserve upside while capping worst case." },
    { name: "Risk reversal", note: "Zero-premium protection with sold-strike trade-off." }
  ];
  const chartData = useMemo(
    () =>
      snapshot.volSeries
        .map((point) => ({
          date: point.date,
          rv20: Number.isFinite(point.rv20) && point.rv20 > 0 ? point.rv20 : null,
          rv60: Number.isFinite(point.rv60) && point.rv60 > 0 ? point.rv60 : null
        }))
        .filter((point) => point.rv20 !== null || point.rv60 !== null),
    [snapshot.volSeries]
  );

  return (
    <Card className="overflow-hidden rounded-[24px] border-bank-border/90 sm:rounded-[28px]">
      <div className="grid gap-0 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="border-b border-bank-border xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-5">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-bank-gold">Preview cockpit</div>
              <div className="mt-1 text-lg font-semibold text-bank-text sm:text-xl">EURUSD selected</div>
            </div>
            <Badge variant="blue">{snapshot.regime}</Badge>
          </div>
          <div className="grid gap-3 px-4 pb-4 sm:px-5 sm:pb-5 md:grid-cols-3 md:gap-4">
            <PreviewMetric label="Spot" value={snapshot.spot.toFixed(4)} />
            <PreviewMetric label="20D RV" value={`${snapshot.rv20.toFixed(2)}%`} />
            <PreviewMetric label="1M move" value={`${snapshot.oneMonthMove.toFixed(2)}%`} />
          </div>
          <div className="px-4 pb-3 sm:px-5">
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
              <Button className="w-full sm:w-auto" variant={showRv20 ? "primary" : "secondary"} onClick={() => setShowRv20((value) => !value)}>
                {showRv20 ? "Hide blue line" : "Show blue line"}
              </Button>
              <Button className="w-full sm:w-auto" variant={showRv60 ? "primary" : "secondary"} onClick={() => setShowRv60((value) => !value)}>
                {showRv60 ? "Hide yellow line" : "Show yellow line"}
              </Button>
            </div>
          </div>
          <div className="h-[220px] px-2 pb-2 sm:h-[260px] sm:px-3 sm:pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="date" minTickGap={40} tick={{ fill: "#CBD5E1", fontSize: 10 }} />
                <YAxis tick={{ fill: "#CBD5E1", fontSize: 10 }} width={44} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                {showRv20 ? <Line type="monotone" dataKey="rv20" name="20D realized volatility" stroke="#38A3C7" dot={false} strokeWidth={2.2} connectNulls={false} /> : null}
                {showRv60 ? <Line type="monotone" dataKey="rv60" name="60D realized volatility" stroke="#C8A45D" dot={false} strokeWidth={2.2} connectNulls={false} /> : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="grid gap-2 text-sm text-bank-muted sm:flex sm:flex-wrap sm:items-center sm:gap-4">
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#38A3C7]" />
                Blue line: 20-day realized volatility
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C8A45D]" />
                Yellow line: 60-day realized volatility
              </div>
            </div>
            <div className="text-sm text-bank-muted">
              Realized volatility shows how much EUR/USD has actually been moving. The blue line reacts faster to recent changes, while the yellow line is smoother because it uses a longer lookback window.
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-bank-muted">Structure ideas</div>
            {ideaCards.map((idea) => (
              <div key={idea.name} className="rounded-2xl border border-bank-border bg-bank-bgAlt/55 px-4 py-3">
                <div className="text-sm font-semibold text-bank-text">{idea.name}</div>
                <div className="mt-2 text-sm text-bank-muted">{idea.note}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-bank-muted">News preview</div>
            {demoNews.articles.slice(0, 2).map((article) => (
              <div key={article.title} className="rounded-2xl border border-bank-border bg-bank-bgAlt/55 px-4 py-3">
                <div className="text-sm text-bank-text">{article.title}</div>
                <div className="mt-2 text-xs text-bank-muted">{article.source}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-2 p-3.5 sm:p-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-bank-muted">{label}</div>
        <div className="font-mono text-lg text-bank-text sm:text-xl">{value}</div>
      </CardContent>
    </Card>
  );
}
