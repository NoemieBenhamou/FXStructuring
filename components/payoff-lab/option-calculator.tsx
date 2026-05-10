"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FxPairSelector } from "@/components/common/fx-pair-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { computePairSnapshot } from "@/lib/market";
import { priceFxOption, type OptionType } from "@/lib/pricing/garman-kohlhagen";
import { rangeAroundSpot } from "@/lib/pricing/chart-data";
import { forwardPayoff, knockOutForwardPayoff, optionPayoff, riskReversalPayoff, targetForwardFixingPnl } from "@/lib/pricing/payoffs";
import { cn, formatNumber } from "@/lib/utils";

type Direction = "buyBase" | "sellBase";
type SeriesKey = "option" | "forward" | "riskReversal" | "knockOutForward" | "tarf";

const SERIES = [
  { key: "option", label: "option", stroke: "#38A3C7", width: 2.3 },
  { key: "forward", label: "forward", stroke: "#C8A45D", width: 2.1 },
  { key: "riskReversal", label: "riskReversal", stroke: "#6dd3c7", width: 1.8 },
  { key: "knockOutForward", label: "knockOutForward", stroke: "#efb65b", width: 1.8 },
  { key: "tarf", label: "tarf", stroke: "#f97373", width: 1.8 }
] as const satisfies ReadonlyArray<{ key: SeriesKey; label: string; stroke: string; width: number }>;

export function OptionCalculator() {
  const [pair, setPair] = useState("EURUSD");
  const [optionType, setOptionType] = useState<OptionType>("call");
  const [direction, setDirection] = useState<Direction>("buyBase");
  const [spot, setSpot] = useState(1.08);
  const [strike, setStrike] = useState(1.1);
  const [volatility, setVolatility] = useState(0.09);
  const [domesticRate, setDomesticRate] = useState(0.035);
  const [foreignRate, setForeignRate] = useState(0.025);
  const [maturityYears, setMaturityYears] = useState(0.5);
  const [notional, setNotional] = useState(10000000);
  const [barrier, setBarrier] = useState(1.02);
  const [leverage, setLeverage] = useState(2);
  const [target, setTarget] = useState(350000);
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    option: true,
    forward: true,
    riskReversal: true,
    knockOutForward: true,
    tarf: true
  });

  useEffect(() => {
    const snapshot = computePairSnapshot(pair);
    const decimals = snapshot.spot > 10 ? 3 : 4;
    setSpot(snapshot.spot);
    setStrike(Number((snapshot.spot * 1.02).toFixed(decimals)));
    setBarrier(Number((snapshot.spot * 0.95).toFixed(decimals)));
  }, [pair]);

  const result = useMemo(
    () =>
      priceFxOption({
        optionType,
        spot,
        strike,
        domesticRate,
        foreignRate,
        volatility,
        maturityYears,
        notional
      }),
    [optionType, spot, strike, domesticRate, foreignRate, volatility, maturityYears, notional]
  );

  const chartData = useMemo(() => {
    return rangeAroundSpot(spot, 0.2, 81).map((scenarioSpot) => {
      const knockedOut = scenarioSpot <= barrier;

      return {
        spot: scenarioSpot,
        option: optionPayoff(optionType, scenarioSpot, strike, notional) - result.premium,
        forward: forwardPayoff(scenarioSpot, strike, notional, direction),
        riskReversal: riskReversalPayoff({
          spotAtMaturity: scenarioSpot,
          callStrike: strike * 1.03,
          putStrike: strike * 0.97,
          notional,
          direction
        }),
        knockOutForward: knockedOut
          ? null
          : knockOutForwardPayoff({
              spotAtMaturity: scenarioSpot,
              forwardRate: strike,
              barrier,
              notional,
              direction,
              barrierType: "lower"
            }),
        tarf: targetForwardFixingPnl({
          fixing: scenarioSpot,
          strike,
          notional,
          leverage,
          direction
        })
      };
    });
  }, [barrier, direction, leverage, notional, optionType, result.premium, spot, strike]);

  const scenarios = useMemo(() => {
    const testSpots = [spot * 0.9, spot, spot * 1.1];
    return testSpots.map((scenarioSpot) => ({
      spot: scenarioSpot,
      optionPnL: optionPayoff(optionType, scenarioSpot, strike, notional) - result.premium,
      forwardPnL: forwardPayoff(scenarioSpot, strike, notional, direction),
      riskReversalPnL: riskReversalPayoff({
        spotAtMaturity: scenarioSpot,
        callStrike: strike * 1.03,
        putStrike: strike * 0.97,
        notional,
        direction
      })
    }));
  }, [direction, notional, optionType, result.premium, spot, strike]);

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardContent className="py-5">
          <FxPairSelector pair={pair} onPairChange={setPair} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="hidden lg:block">
          <Controls
            optionType={optionType}
            direction={direction}
            spot={spot}
            strike={strike}
            volatility={volatility}
            domesticRate={domesticRate}
            foreignRate={foreignRate}
            maturityYears={maturityYears}
            notional={notional}
            barrier={barrier}
            leverage={leverage}
            target={target}
            onOptionType={setOptionType}
            onDirection={setDirection}
            onSpot={setSpot}
            onStrike={setStrike}
            onVolatility={setVolatility}
            onDomesticRate={setDomesticRate}
            onForeignRate={setForeignRate}
            onMaturityYears={setMaturityYears}
            onNotional={setNotional}
            onBarrier={setBarrier}
            onLeverage={setLeverage}
            onTarget={setTarget}
          />
        </div>

        <div className="space-y-6">
          <details className="lg:hidden">
            <summary className="cursor-pointer rounded-2xl border border-bank-border bg-bank-bgAlt/70 px-4 py-3 text-sm font-medium text-bank-text">
              Open pricing controls
            </summary>
            <div className="mt-4">
              <Controls
                optionType={optionType}
                direction={direction}
                spot={spot}
                strike={strike}
                volatility={volatility}
                domesticRate={domesticRate}
                foreignRate={foreignRate}
                maturityYears={maturityYears}
                notional={notional}
                barrier={barrier}
                leverage={leverage}
                target={target}
                onOptionType={setOptionType}
                onDirection={setDirection}
                onSpot={setSpot}
                onStrike={setStrike}
                onVolatility={setVolatility}
                onDomesticRate={setDomesticRate}
                onForeignRate={setForeignRate}
                onMaturityYears={setMaturityYears}
                onNotional={setNotional}
                onBarrier={setBarrier}
                onLeverage={setLeverage}
                onTarget={setTarget}
              />
            </div>
          </details>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Premium" value={result.premium} />
            <Metric label="Delta" value={result.delta} decimals={4} />
            <Metric label="Gamma" value={result.gamma} decimals={6} />
            <Metric label="Vega / 1 vol pt" value={result.vega} />
            <Metric label="Theta / day" value={result.theta} />
            <Metric label="Rho domestic" value={result.rhoDomestic} />
            <Metric label="Rho foreign" value={result.rhoForeign} />
            <Metric label="Target" value={target} />
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Structure comparison at maturity</CardTitle>
                <Badge variant="gold">Illustrative only</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SERIES.map((series) => {
                  const enabled = visibleSeries[series.key];

                  return (
                    <button
                      key={series.key}
                      type="button"
                      onClick={() =>
                        setVisibleSeries((current) => ({
                          ...current,
                          [series.key]: !current[series.key]
                        }))
                      }
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                        enabled
                          ? "border-bank-border bg-bank-bgAlt/70 text-bank-text"
                          : "border-bank-border/60 bg-bank-bg/60 text-bank-muted opacity-70"
                      )}
                      aria-pressed={enabled}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.stroke }} />
                      <span>{series.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#163452" strokeDasharray="4 4" />
                  <XAxis dataKey="spot" tick={{ fill: "#CBD5E1", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#CBD5E1", fontSize: 11 }} width={72} />
                  <Tooltip />
                  {SERIES.map((series) => (
                    <Line
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      name={series.label}
                      stroke={series.stroke}
                      dot={false}
                      strokeWidth={series.width}
                      hide={!visibleSeries[series.key]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Scenario table</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto bank-scrollbar">
              <table className="min-w-full text-left text-sm">
                <thead className="text-bank-muted">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Spot at maturity</th>
                    <th className="pb-3 pr-4 font-medium">Option P&amp;L</th>
                    <th className="pb-3 pr-4 font-medium">Forward P&amp;L</th>
                    <th className="pb-3 pr-4 font-medium">Risk reversal P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((scenario) => (
                    <tr key={scenario.spot} className="border-t border-bank-border">
                      <td className="py-3 pr-4 font-mono">{scenario.spot.toFixed(4)}</td>
                      <td className="py-3 pr-4 font-mono">{formatNumber(scenario.optionPnL, 0)}</td>
                      <td className="py-3 pr-4 font-mono">{formatNumber(scenario.forwardPnL, 0)}</td>
                      <td className="py-3 pr-4 font-mono">{formatNumber(scenario.riskReversalPnL, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border-bank-amber/60 bg-bank-amber/10">
        <CardContent className="py-4 text-sm leading-7 text-amber-100">
          Educational prototype only. Not investment advice. Prices, payoffs, probabilities, Greeks and risk metrics are illustrative and not executable market quotes. Live feeds, where enabled, are third-party data sources and may be delayed, incomplete or unavailable.
        </CardContent>
      </Card>
    </div>
  );
}

function Controls(props: {
  optionType: OptionType;
  direction: Direction;
  spot: number;
  strike: number;
  volatility: number;
  domesticRate: number;
  foreignRate: number;
  maturityYears: number;
  notional: number;
  barrier: number;
  leverage: number;
  target: number;
  onOptionType: (value: OptionType) => void;
  onDirection: (value: Direction) => void;
  onSpot: (value: number) => void;
  onStrike: (value: number) => void;
  onVolatility: (value: number) => void;
  onDomesticRate: (value: number) => void;
  onForeignRate: (value: number) => void;
  onMaturityYears: (value: number) => void;
  onNotional: (value: number) => void;
  onBarrier: (value: number) => void;
  onLeverage: (value: number) => void;
  onTarget: (value: number) => void;
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Pricing controls</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Field label="Option type">
          <Select value={props.optionType} onChange={(event) => props.onOptionType(event.target.value as OptionType)}>
            <option value="call">Call</option>
            <option value="put">Put</option>
          </Select>
        </Field>
        <Field label="Direction">
          <Select value={props.direction} onChange={(event) => props.onDirection(event.target.value as Direction)}>
            <option value="buyBase">Buy base</option>
            <option value="sellBase">Sell base</option>
          </Select>
        </Field>
        <NumberField label="Spot" value={props.spot} onChange={props.onSpot} />
        <NumberField label="Strike" value={props.strike} onChange={props.onStrike} />
        <NumberField label="Volatility" value={props.volatility} onChange={props.onVolatility} />
        <NumberField label="Domestic rate" value={props.domesticRate} onChange={props.onDomesticRate} />
        <NumberField label="Foreign rate" value={props.foreignRate} onChange={props.onForeignRate} />
        <NumberField label="Maturity years" value={props.maturityYears} onChange={props.onMaturityYears} />
        <NumberField label="Notional" value={props.notional} onChange={props.onNotional} />
        <NumberField label="KO barrier" value={props.barrier} onChange={props.onBarrier} />
        <NumberField label="TARF leverage" value={props.leverage} onChange={props.onLeverage} />
        <NumberField label="Target" value={props.target} onChange={props.onTarget} />
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-[0.2em] text-bank-muted">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <Input type="number" step="any" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </Field>
  );
}

function Metric({ label, value, decimals = 0 }: { label: string; value: number; decimals?: number }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-2 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bank-muted">{label}</div>
        <div className="font-mono text-lg text-bank-text">{formatNumber(value, decimals)}</div>
      </CardContent>
    </Card>
  );
}
