"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import portfolioCase from "@/data/fx/portfolio-case.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type WeightRow = { currency: string; weight: number };

const initialRows: WeightRow[] = Object.entries(portfolioCase.weights).map(([currency, weight]) => ({
  currency,
  weight
}));

function correlation(a: number, b: number) {
  if (a === b) return 1;
  return Number((0.15 + ((a + 1) * (b + 3)) % 7 / 10).toFixed(2));
}

export function PortfolioRiskPanel() {
  const [rows, setRows] = useState(initialRows);
  const normalized = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + row.weight, 0);
    return rows.map((row, index) => ({
      ...row,
      normalizedWeight: total === 0 ? 0 : row.weight / total,
      volatility: 7 + index * 1.3
    }));
  }, [rows]);

  const analytics = useMemo(() => {
    const standaloneRisk = normalized.reduce((sum, row) => sum + row.normalizedWeight * row.volatility, 0);
    let variance = 0;
    normalized.forEach((rowA, indexA) => {
      normalized.forEach((rowB, indexB) => {
        variance += rowA.normalizedWeight * rowB.normalizedWeight * rowA.volatility * rowB.volatility * correlation(indexA, indexB);
      });
    });

    const portfolioRisk = Math.sqrt(variance);
    return {
      standaloneRisk,
      portfolioRisk,
      diversificationBenefit: standaloneRisk - portfolioRisk
    };
  }, [normalized]);

  const frontier = normalized.map((row, index) => ({
    hedgeCost: 35 + index * 12,
    residualCvar: Math.max(4, 18 - index * 1.2)
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <RiskMetric label="Standalone risk" value={`${analytics.standaloneRisk.toFixed(2)}%`} />
        <RiskMetric label="Portfolio risk" value={`${analytics.portfolioRisk.toFixed(2)}%`} />
        <RiskMetric label="Diversification benefit" value={`${analytics.diversificationBenefit.toFixed(2)}%`} tone="gold" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Editable exposure table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto bank-scrollbar">
            <table className="min-w-full text-left text-sm">
              <thead className="text-bank-muted">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Currency</th>
                  <th className="pb-3 pr-4 font-medium">Weight</th>
                  <th className="pb-3 pr-4 font-medium">Normalized</th>
                  <th className="pb-3 pr-4 font-medium">Standalone vol</th>
                </tr>
              </thead>
              <tbody>
                {normalized.map((row, index) => (
                  <tr key={row.currency} className="border-t border-bank-border">
                    <td className="py-3 pr-4">{row.currency}</td>
                    <td className="py-3 pr-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={rows[index].weight}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item, rowIndex) =>
                              rowIndex === index ? { ...item, weight: Number(event.target.value) } : item
                            )
                          )
                        }
                      />
                    </td>
                    <td className="py-3 pr-4 font-mono">{(row.normalizedWeight * 100).toFixed(1)}%</td>
                    <td className="py-3 pr-4 font-mono">{row.volatility.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Exposure mix</CardTitle>
              <Badge variant="blue">Base currency: EUR</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={normalized}
                  dataKey="normalizedWeight"
                  nameKey="currency"
                  outerRadius={120}
                  fill="#38A3C7"
                  stroke="#061A2D"
                  strokeWidth={3}
                />
                <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Correlation heatmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {normalized.slice(0, 6).map((rowA, indexA) => (
              <div key={rowA.currency} className="grid grid-cols-7 gap-2">
                <div className="text-xs uppercase tracking-[0.2em] text-bank-muted">{rowA.currency}</div>
                {normalized.slice(0, 6).map((rowB, indexB) => {
                  const value = correlation(indexA, indexB);
                  return (
                    <div
                      key={`${rowA.currency}-${rowB.currency}`}
                      className="flex h-10 items-center justify-center rounded-xl text-xs font-medium text-bank-text"
                      style={{ backgroundColor: `rgba(56, 163, 199, ${0.15 + value * 0.45})` }}
                    >
                      {value.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Hedge cost vs residual cVaR</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={frontier} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#163452" strokeDasharray="4 4" />
                <XAxis dataKey="hedgeCost" tick={{ fill: "#CBD5E1", fontSize: 11 }} />
                <YAxis tick={{ fill: "#CBD5E1", fontSize: 11 }} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Area type="monotone" dataKey="residualCvar" stroke="#C8A45D" fill="rgba(200,164,93,0.22)" strokeWidth={2.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RiskMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "gold" }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-2 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-bank-muted">{label}</div>
        <div className={tone === "gold" ? "font-mono text-2xl text-bank-gold" : "font-mono text-2xl text-bank-text"}>{value}</div>
      </CardContent>
    </Card>
  );
}
