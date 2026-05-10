"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ChartColumnBig, Newspaper, RadioTower } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MarketDataResponse, type MarketRange, fetchMarketData } from "@/lib/api/client";
import { MetricCard } from "@/components/common/metric-card";
import { NewsFeed } from "@/components/market/news-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatFxPair, MAJOR_FX_PAIRS, normalizeFxPair, OTHER_SUPPORTED_FX_PAIRS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

function parseLookbackPeriod(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 2), 252);
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], mean: number) {
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function MarketCockpit({ initialPair = "EURUSD" }: { initialPair?: string }) {
  const [pair, setPair] = useState(initialPair);
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [customPair, setCustomPair] = useState("");
  const [tab, setTab] = useState<"overview" | "news">("overview");
  const [range, setRange] = useState<MarketRange>("2Y");
  const [valuationDate, setValuationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setUTCMonth(date.getUTCMonth() - 3);
    return date.toISOString().slice(0, 10);
  });
  const [maPeriodInput, setMaPeriodInput] = useState("20");
  const [volatilityPeriodInput, setVolatilityPeriodInput] = useState("20");
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [showBollingerBands, setShowBollingerBands] = useState(true);
  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);

  const snapshot = marketData?.snapshot;
  const maPeriod = useMemo(() => parseLookbackPeriod(maPeriodInput, 20), [maPeriodInput]);
  const volatilityPeriod = useMemo(() => parseLookbackPeriod(volatilityPeriodInput, 20), [volatilityPeriodInput]);
  const spotChartSeries = useMemo(() => {
    const series = snapshot?.series ?? [];

    return series.map((point, index) => {
      const maWindow = index >= maPeriod - 1 ? series.slice(index - maPeriod + 1, index + 1).map((item) => item.close) : null;
      const bbWindow =
        index >= volatilityPeriod - 1 ? series.slice(index - volatilityPeriod + 1, index + 1).map((item) => item.close) : null;

      const movingAverage = maWindow ? average(maWindow) : null;
      const bollingerMean = bbWindow ? average(bbWindow) : null;
      const bollingerDeviation =
        bbWindow && bollingerMean !== null ? standardDeviation(bbWindow, bollingerMean) : null;

      return {
        ...point,
        movingAverage,
        bollingerUpper: bollingerMean !== null && bollingerDeviation !== null ? bollingerMean + 2 * bollingerDeviation : null,
        bollingerLower: bollingerMean !== null && bollingerDeviation !== null ? bollingerMean - 2 * bollingerDeviation : null
      };
    });
  }, [maPeriod, snapshot?.series, volatilityPeriod]);

  const spotDomain = useMemo(() => {
    const values = spotChartSeries.flatMap((point) => {
      const seriesValues = [point.close];
      if (showMovingAverage && typeof point.movingAverage === "number") {
        seriesValues.push(point.movingAverage);
      }
      if (showBollingerBands) {
        if (typeof point.bollingerUpper === "number") seriesValues.push(point.bollingerUpper);
        if (typeof point.bollingerLower === "number") seriesValues.push(point.bollingerLower);
      }
      return seriesValues;
    });
    if (values.length === 0) return [0, 1] as const;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const padding = range > 0 ? range * 0.05 : Math.max(Math.abs(max) * 0.05, 0.01);

    return [min - padding, max + padding] as const;
  }, [showBollingerBands, showMovingAverage, spotChartSeries]);

  useEffect(() => {
    if (customStartDate > valuationDate) {
      setCustomStartDate(valuationDate);
    }
  }, [customStartDate, valuationDate]);

  useEffect(() => {
    let active = true;

    async function loadMarketData() {
      const json = await fetchMarketData(pair, {
        range,
        startDate: range === "CUSTOM" ? customStartDate : undefined,
        endDate: valuationDate
      });
      if (active) setMarketData(json);
    }

    void loadMarketData();

    return () => {
      active = false;
    };
  }, [customStartDate, pair, range, valuationDate]);

  function submitCustomPair() {
    const normalized = normalizeFxPair(customPair);
    if (normalized.length === 6) {
      setPair(normalized);
      setSelectedPair("__custom__");
      setCustomPair(formatFxPair(normalized));
    }
  }

  if (!snapshot || !marketData) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="py-8 text-sm text-bank-muted">Loading market data...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.22em] text-bank-gold">Pair selection</div>
            <div className="max-w-md text-sm text-bank-muted">
              Review major crosses first, then switch to any other supported cross or type a custom six-letter FX pair.
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[320px_auto] sm:items-start">
            <div className="grid gap-3">
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
            <div className="flex items-center gap-2 text-sm text-bank-muted">
              <RadioTower className="h-4 w-4" />
              {marketData.status}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === "overview" ? "primary" : "secondary"} onClick={() => setTab("overview")}>
          <ChartColumnBig className="mr-2 h-4 w-4" />
          Overview
        </Button>
        <Button variant={tab === "news" ? "primary" : "secondary"} onClick={() => setTab("news")}>
          <Newspaper className="mr-2 h-4 w-4" />
          FX News
        </Button>
      </div>

      {tab === "overview" ? (
        <>
          <Card className="rounded-3xl">
            <CardContent className="flex flex-col gap-4 py-5">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(["1M", "3M", "6M", "1Y", "2Y", "CUSTOM"] as MarketRange[]).map((item) => (
                    <Button
                      key={item}
                      variant={range === item ? "primary" : "secondary"}
                      onClick={() => setRange(item)}
                    >
                      {item === "CUSTOM" ? "Custom data" : item}
                    </Button>
                  ))}
                </div>
                <label className="grid gap-1.5 sm:min-w-[220px]">
                  <span className="text-xs uppercase tracking-[0.2em] text-bank-muted">Valuation date</span>
                  <Input type="date" value={valuationDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setValuationDate(event.target.value)} />
                </label>
              </div>
              {range === "CUSTOM" ? (
                <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                  <label className="grid gap-1.5">
                    <span className="text-xs uppercase tracking-[0.2em] text-bank-muted">Start date</span>
                    <Input
                      type="date"
                      value={customStartDate}
                      max={valuationDate}
                      onChange={(event) => setCustomStartDate(event.target.value)}
                    />
                  </label>
                  <div className="grid gap-1.5">
                    <span className="text-xs uppercase tracking-[0.2em] text-bank-muted">Range end</span>
                    <div className="flex min-h-10 items-center rounded-2xl border border-bank-border bg-bank-bgAlt/60 px-3 text-sm text-bank-text">
                      {valuationDate}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Spot" value={snapshot.spot} decimals={snapshot.spot > 10 ? 3 : 5} />
            <MetricCard label="1D Move" value={snapshot.oneDayMove} suffix="%" tone={snapshot.oneDayMove >= 0 ? "positive" : "negative"} />
            <MetricCard label="1M Move" value={snapshot.oneMonthMove} suffix="%" tone={snapshot.oneMonthMove >= 0 ? "positive" : "negative"} />
            <MetricCard label="3M Move" value={snapshot.threeMonthMove} suffix="%" tone={snapshot.threeMonthMove >= 0 ? "positive" : "negative"} />
            <MetricCard label="20D RV" value={snapshot.rv20} suffix="%" />
            <MetricCard label="60D RV" value={snapshot.rv60} suffix="%" />
            <MetricCard label="2Y High" value={snapshot.high252} decimals={snapshot.spot > 10 ? 3 : 5} />
            <MetricCard label="Drawdown vs High" value={snapshot.drawdownFromHigh} suffix="%" tone={snapshot.drawdownFromHigh >= 0 ? "positive" : "negative"} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="rounded-3xl">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{formatFxPair(snapshot.pair)} spot history</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="gold">{snapshot.regime}</Badge>
                    <Badge variant="blue">{marketData.source}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end">
                  <label className="grid gap-1.5">
                    <span className="text-xs uppercase tracking-[0.2em] text-bank-muted">Moving average period</span>
                    <Input
                      type="number"
                      min={2}
                      max={252}
                      value={maPeriodInput}
                      onChange={(event) => setMaPeriodInput(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs uppercase tracking-[0.2em] text-bank-muted">Volatility / Bollinger period</span>
                    <Input
                      type="number"
                      min={2}
                      max={252}
                      value={volatilityPeriodInput}
                      onChange={(event) => setVolatilityPeriodInput(event.target.value)}
                    />
                  </label>
                  <Button variant={showMovingAverage ? "primary" : "secondary"} onClick={() => setShowMovingAverage((value) => !value)}>
                    {showMovingAverage ? `Hide MA (${maPeriod})` : `Show MA (${maPeriod})`}
                  </Button>
                  <Button variant={showBollingerBands ? "primary" : "secondary"} onClick={() => setShowBollingerBands((value) => !value)}>
                    {showBollingerBands ? `Hide Bands (${volatilityPeriod})` : `Show Bands (${volatilityPeriod})`}
                  </Button>
                </div>
                <div className="h-[320px] sm:h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spotChartSeries} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="#163452" strokeDasharray="4 4" />
                      <XAxis dataKey="date" minTickGap={32} tick={{ fill: "#CBD5E1", fontSize: 11 }} />
                      <YAxis
                        domain={spotDomain}
                        tick={{ fill: "#CBD5E1", fontSize: 11 }}
                        width={72}
                        tickFormatter={(value) => Number(value).toFixed(snapshot.spot > 10 ? 0 : 4)}
                      />
                      <Tooltip formatter={(value) => Number(value).toFixed(snapshot.spot > 10 ? 3 : 5)} />
                      <Line type="monotone" dataKey="close" name="Spot" stroke="#38A3C7" strokeWidth={2.25} dot={false} />
                      {showMovingAverage ? (
                        <Line
                          type="monotone"
                          dataKey="movingAverage"
                          name={`MA (${maPeriod})`}
                          stroke="#C8A45D"
                          strokeWidth={1.9}
                          dot={false}
                        />
                      ) : null}
                      {showBollingerBands ? (
                        <>
                          <Line
                            type="monotone"
                            dataKey="bollingerUpper"
                            name={`Bollinger upper (${volatilityPeriod})`}
                            stroke="#7EE0D6"
                            strokeWidth={1.6}
                            strokeDasharray="6 4"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="bollingerLower"
                            name={`Bollinger lower (${volatilityPeriod})`}
                            stroke="#7EE0D6"
                            strokeWidth={1.6}
                            strokeDasharray="6 4"
                            dot={false}
                          />
                        </>
                      ) : null}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-bank-muted">
                  <div className="inline-flex items-center gap-2">
                    <Activity className="h-4 w-4 text-bank-gold" />
                    Regime: {snapshot.regime}
                  </div>
                  <div>Valuation date: {valuationDate}</div>
                  <div>Last close: {snapshot.lastDate}</div>
                  <div>Range context: {formatPercent(((snapshot.spot - snapshot.low252) / snapshot.low252) * 100)}</div>
                </div>
              </CardContent>
            </Card>

            <NewsFeed currency={snapshot.pair.slice(0, 3)} />
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Realized volatility ladder</CardTitle>
                <Badge variant="blue">{marketData.source}</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshot.volSeries} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#163452" strokeDasharray="4 4" />
                  <XAxis dataKey="date" minTickGap={32} tick={{ fill: "#CBD5E1", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#CBD5E1", fontSize: 11 }} width={56} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                  <Line type="monotone" dataKey="rv20" name="20D RV" stroke="#C8A45D" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="rv60" name="60D RV" stroke="#38A3C7" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <NewsFeed currency="FX" showFilters />
      )}
    </div>
  );
}
