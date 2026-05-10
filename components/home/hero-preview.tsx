"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import demoNews from "@/data/news/fx-news-demo.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatFxPair, MAJOR_FX_PAIRS, normalizeFxPair, OTHER_SUPPORTED_FX_PAIRS } from "@/lib/constants";
import { computePairSnapshot, computeRealizedVol, hasPairSeries } from "@/lib/market";

function parseLookbackPeriod(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 5), 252);
}

function quantile(values: number[], probability: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function getVolatilityRegime(latestVolatility: number, history: number[]) {
  const q25 = quantile(history, 0.25);
  const q75 = quantile(history, 0.75);

  if (latestVolatility < q25) {
    return {
      label: "Market is Calm",
      variant: "green" as const,
      subtitle: "Low-vol regime",
      description:
        "Stable market conditions, compressed risk premia, often trend-friendly but vulnerable to volatility shocks.",
      q25,
      q75
    };
  }

  if (latestVolatility <= q75) {
    return {
      label: "Normal / neutral regime",
      variant: "blue" as const,
      subtitle: "Medium volatility",
      description: "Typical market environment; volatility is trading inside its interquartile range.",
      q25,
      q75
    };
  }

  return {
    label: "Market is Stressed",
    variant: "red" as const,
    subtitle: "High-vol regime",
    description: "Volatility is above its upper quartile and market pricing is reflecting a stressed backdrop.",
    q25,
    q75
  };
}

const curveDefinitions = [
  { key: "volatility1", color: "#38A3C7" },
  { key: "volatility2", color: "#C8A45D" },
  { key: "volatility3", color: "#7EE0D6" }
] as const;

type CurveKey = (typeof curveDefinitions)[number]["key"];

export function HeroPreview() {
  const [pair, setPair] = useState("EURUSD");
  const [selectedPair, setSelectedPair] = useState("EURUSD");
  const [customPair, setCustomPair] = useState("");
  const [volatility1PeriodInput, setVolatility1PeriodInput] = useState("20");
  const [volatility2PeriodInput, setVolatility2PeriodInput] = useState("60");
  const [volatility3PeriodInput, setVolatility3PeriodInput] = useState("125");
  const [visibleCurves, setVisibleCurves] = useState<Record<CurveKey, boolean>>({
    volatility1: true,
    volatility2: true,
    volatility3: true
  });

  const snapshot = useMemo(() => computePairSnapshot(pair), [pair]);
  const volatility1Period = useMemo(() => parseLookbackPeriod(volatility1PeriodInput, 20), [volatility1PeriodInput]);
  const volatility2Period = useMemo(() => parseLookbackPeriod(volatility2PeriodInput, 60), [volatility2PeriodInput]);
  const volatility3Period = useMemo(() => parseLookbackPeriod(volatility3PeriodInput, 125), [volatility3PeriodInput]);

  const chartData = useMemo(() => {
    const periodMap = {
      volatility1: volatility1Period,
      volatility2: volatility2Period,
      volatility3: volatility3Period
    } as const;

    return snapshot.series
      .map((point, index) => {
        const row: {
          date: string;
          volatility1: number | null;
          volatility2: number | null;
          volatility3: number | null;
        } = {
          date: point.date,
          volatility1: null,
          volatility2: null,
          volatility3: null
        };

        for (const definition of curveDefinitions) {
          const lookback = periodMap[definition.key];
          row[definition.key] =
            index >= lookback ? computeRealizedVol(snapshot.series.slice(0, index + 1), lookback) : null;
        }

        return row;
      })
      .filter((point) => point.volatility1 !== null || point.volatility2 !== null || point.volatility3 !== null);
  }, [snapshot.series, volatility1Period, volatility2Period, volatility3Period]);

  const displayedValues = useMemo(() => {
    return chartData.flatMap((point) => {
      const values: number[] = [];
      for (const definition of curveDefinitions) {
        if (!visibleCurves[definition.key]) continue;
        const value = point[definition.key];
        if (typeof value === "number") values.push(value);
      }
      return values;
    });
  }, [chartData, visibleCurves]);

  const chartDomain = useMemo(() => {
    if (displayedValues.length === 0) return [0, 1] as const;
    const min = Math.min(...displayedValues);
    const max = Math.max(...displayedValues);
    const range = max - min;
    const padding = range > 0 ? range * 0.05 : Math.max(Math.abs(max) * 0.05, 0.25);
    return [min - padding, max + padding] as const;
  }, [displayedValues]);

  const volatility1History = useMemo(() => {
    return chartData.flatMap((point) => (typeof point.volatility1 === "number" ? [point.volatility1] : []));
  }, [chartData]);

  const latestVolatility1 = volatility1History.at(-1) ?? 0;
  const volatilityRegime = useMemo(
    () => getVolatilityRegime(latestVolatility1, volatility1History),
    [latestVolatility1, volatility1History]
  );

  const ideaCards = [
    { name: "Forward", note: "Budget certainty for known USD outflow." },
    { name: "Vanilla option", note: "Preserve upside while capping worst case." },
    { name: "Risk reversal", note: "Zero-premium protection with sold-strike trade-off." }
  ];

  function submitCustomPair() {
    const normalized = normalizeFxPair(customPair);
    if (normalized.length === 6 && hasPairSeries(normalized)) {
      setPair(normalized);
      setSelectedPair("__custom__");
      setCustomPair(formatFxPair(normalized));
    }
  }

  function toggleCurve(key: CurveKey) {
    setVisibleCurves((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 lg:min-w-[360px]">
            <div className="text-xs uppercase tracking-[0.22em] text-bank-gold">Pair selection</div>
            <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
              <Select
                value={selectedPair}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedPair(value);
                  if (value !== "__custom__") {
                    setPair(value);
                  }
                }}
              >
                <optgroup label="Major crosses">
                  {MAJOR_FX_PAIRS.map((item) => (
                    <option key={item} value={item}>
                      {formatFxPair(item)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other supported crosses">
                  {OTHER_SUPPORTED_FX_PAIRS.map((item) => (
                    <option key={item} value={item}>
                      {formatFxPair(item)}
                    </option>
                  ))}
                </optgroup>
                <option value="__custom__">Other cross...</option>
              </Select>
              {selectedPair === "__custom__" ? (
                <div className="flex gap-2">
                  <Input
                    value={customPair}
                    placeholder="Type EUR/TRY or NOKSEK"
                    onChange={(event) => setCustomPair(event.target.value.toUpperCase())}
                  />
                  <Button onClick={submitCustomPair}>Load</Button>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[24px] border-bank-border/90 sm:rounded-[28px]">
        <div className="grid gap-0 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="border-b border-bank-border xl:border-b-0 xl:border-r">
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-5">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-bank-gold">Preview cockpit</div>
                <div className="mt-1 text-lg font-semibold text-bank-text sm:text-xl">{snapshot.pair} selected</div>
              </div>
              <Badge variant={volatilityRegime.variant} title="Regime is derived from the latest Volatility 1 reading versus its two-year distribution.">
                {volatilityRegime.label}
              </Badge>
            </div>
            <div className="grid gap-3 px-4 pb-4 sm:px-5 sm:pb-5 md:grid-cols-3 md:gap-4">
              <PreviewMetric label="Spot" value={snapshot.spot.toFixed(4)} />
              <PreviewMetric label="Volatility 1" value={`${latestVolatility1.toFixed(2)}%`} />
              <PreviewMetric label="Q25 / Q75" value={`${volatilityRegime.q25.toFixed(2)}% / ${volatilityRegime.q75.toFixed(2)}%`} />
            </div>
            <div className="grid gap-3 px-4 pb-3 sm:px-5 lg:grid-cols-3">
              <VolatilityControl
                label="Volatility 1"
                period={volatility1PeriodInput}
                onPeriodChange={setVolatility1PeriodInput}
                active={visibleCurves.volatility1}
                onToggle={() => toggleCurve("volatility1")}
              />
              <VolatilityControl
                label="Volatility 2"
                period={volatility2PeriodInput}
                onPeriodChange={setVolatility2PeriodInput}
                active={visibleCurves.volatility2}
                onToggle={() => toggleCurve("volatility2")}
              />
              <VolatilityControl
                label="Volatility 3"
                period={volatility3PeriodInput}
                onPeriodChange={setVolatility3PeriodInput}
                active={visibleCurves.volatility3}
                onToggle={() => toggleCurve("volatility3")}
              />
            </div>
            <div className="h-[240px] px-2 pb-2 sm:h-[280px] sm:px-3 sm:pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <XAxis dataKey="date" minTickGap={40} tick={{ fill: "#CBD5E1", fontSize: 10 }} />
                  <YAxis domain={chartDomain} tick={{ fill: "#CBD5E1", fontSize: 10 }} width={48} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                  <ReferenceLine
                    y={volatilityRegime.q25}
                    stroke="#7EE0D6"
                    strokeDasharray="5 5"
                    ifOverflow="extendDomain"
                    label={{ value: "Q25", fill: "#7EE0D6", fontSize: 10, position: "insideTopLeft" }}
                  />
                  <ReferenceLine
                    y={volatilityRegime.q75}
                    stroke="#C8A45D"
                    strokeDasharray="5 5"
                    ifOverflow="extendDomain"
                    label={{ value: "Q75", fill: "#C8A45D", fontSize: 10, position: "insideTopLeft" }}
                  />
                  {curveDefinitions.map((definition) =>
                    visibleCurves[definition.key] ? (
                      <Line
                        key={definition.key}
                        type="monotone"
                        dataKey={definition.key}
                        name={`${definition.key.replace("volatility", "Volatility ")} realized volatility`}
                        stroke={definition.color}
                        dot={false}
                        strokeWidth={2.1}
                        connectNulls={false}
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="grid gap-2 text-sm text-bank-muted sm:grid-cols-3">
                <LegendItem color="#38A3C7" label={`Volatility 1: ${volatility1Period}-day realized volatility`} />
                <LegendItem color="#C8A45D" label={`Volatility 2: ${volatility2Period}-day realized volatility`} />
                <LegendItem color="#7EE0D6" label={`Volatility 3: ${volatility3Period}-day realized volatility`} />
              </div>
              <div
                className="rounded-2xl border border-bank-border bg-bank-bgAlt/55 px-4 py-3 text-sm text-bank-muted"
                title="The regime is anchored to the latest Volatility 1 reading versus the two-year distribution of that same realized-volatility series."
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={volatilityRegime.variant}>{volatilityRegime.subtitle}</Badge>
                  <span className="font-medium text-bank-text">{volatilityRegime.label}</span>
                </div>
                <p className="mt-2 leading-6">{volatilityRegime.description}</p>
                <p className="mt-2 text-xs leading-5 text-bank-muted">
                  Quantile framework: calm if latest Volatility 1 is below Q25 ({volatilityRegime.q25.toFixed(2)}%), neutral if between Q25 and Q75 ({volatilityRegime.q75.toFixed(2)}%), stressed if above Q75.
                </p>
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
    </div>
  );
}

function VolatilityControl({
  label,
  period,
  onPeriodChange,
  active,
  onToggle
}: {
  label: string;
  period: string;
  onPeriodChange: (value: string) => void;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-bank-border bg-bank-bgAlt/40 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-bank-muted">{label} period</div>
      <Input type="number" min={5} max={252} value={period} onChange={(event) => onPeriodChange(event.target.value)} />
      <Button variant={active ? "primary" : "secondary"} onClick={onToggle} title={`Toggle ${label.toLowerCase()} on or off.`}>
        {label}
      </Button>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
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
