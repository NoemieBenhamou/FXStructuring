"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FxPairSelector } from "@/components/common/fx-pair-selector";
import { structureCopy } from "@/lib/content/structure-copy";
import { recommendStructures, type ExposureInput } from "@/lib/recommendations";

const defaultInput: ExposureInput = {
  clientType: "corporateExporter",
  pair: "AUDJPY",
  direction: "sellBase",
  notional: 5000000,
  tenorMonths: 6,
  objective: "improveForward",
  constraints: {
    vanillaOnly: false,
    zeroCostOnly: false,
    noLeverage: false,
    noBarrier: false,
    hedgeAccountingSensitive: false,
    barrierAllowed: true,
    targetAllowed: true
  }
};

const copyKeys = {
  forward: "forward",
  "vanilla-option": "vanillaOption",
  "risk-reversal": "riskReversal",
  "knock-out-forward": "knockOutForward",
  tarf: "tarf",
  "basket-option": "basketOption",
  "deal-contingent-forward": "dealContingentForward"
} as const;

export function StructureWorkbench() {
  const [input, setInput] = useState(defaultInput);
  const recommendations = useMemo(() => recommendStructures(input), [input]);

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Structuring controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-4">
            <FxPairSelector pair={input.pair} onPairChange={(pair) => setInput({ ...input, pair })} label="Pair" />
          </div>
          <Field label="Objective">
            <Select value={input.objective} onChange={(event) => setInput({ ...input, objective: event.target.value as ExposureInput["objective"] })}>
              <option value="certainty">Certainty</option>
              <option value="improveForward">Improve forward</option>
              <option value="zeroPremium">Zero premium</option>
              <option value="upsideParticipation">Upside participation</option>
              <option value="portfolioRiskReduction">Portfolio risk reduction</option>
            </Select>
          </Field>
          <Field label="Tenor (months)">
            <Input type="number" value={input.tenorMonths} onChange={(event) => setInput({ ...input, tenorMonths: Number(event.target.value) })} />
          </Field>
          <Field label="Notional">
            <Input type="number" value={input.notional} onChange={(event) => setInput({ ...input, notional: Number(event.target.value) })} />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl border border-bank-border bg-bank-bgAlt/50 px-4 py-3 text-sm text-bank-text">
            <input type="checkbox" checked={input.constraints.barrierAllowed} onChange={(event) => setInput({ ...input, constraints: { ...input.constraints, barrierAllowed: event.target.checked, noBarrier: !event.target.checked } })} className="h-4 w-4 accent-[#c8a45d]" />
            Barrier allowed
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-bank-border bg-bank-bgAlt/50 px-4 py-3 text-sm text-bank-text">
            <input type="checkbox" checked={input.constraints.targetAllowed} onChange={(event) => setInput({ ...input, constraints: { ...input.constraints, targetAllowed: event.target.checked } })} className="h-4 w-4 accent-[#c8a45d]" />
            Target allowed
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-bank-border bg-bank-bgAlt/50 px-4 py-3 text-sm text-bank-text">
            <input type="checkbox" checked={input.constraints.noLeverage} onChange={(event) => setInput({ ...input, constraints: { ...input.constraints, noLeverage: event.target.checked } })} className="h-4 w-4 accent-[#c8a45d]" />
            No leverage
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-bank-border bg-bank-bgAlt/50 px-4 py-3 text-sm text-bank-text">
            <input type="checkbox" checked={input.constraints.hedgeAccountingSensitive} onChange={(event) => setInput({ ...input, constraints: { ...input.constraints, hedgeAccountingSensitive: event.target.checked } })} className="h-4 w-4 accent-[#c8a45d]" />
            Hedge-accounting sensitive
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {recommendations.map((recommendation) => {
          const why = structureCopy[copyKeys[recommendation.id as keyof typeof copyKeys]];

          return (
            <Card key={recommendation.id} className="rounded-3xl">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{recommendation.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="gold">Complexity {recommendation.complexity}/5</Badge>
                    {recommendation.name.includes("TARF") ? <Badge variant="amber">Cashflow integrity warning</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CopyRow label="Best use case" value={recommendation.bestUseCase} />
                <CopyRow label="Payoff intuition" value={recommendation.payoffIntuition} />
                <CopyRow label="Client benefit" value={recommendation.clientBenefit} />
                <CopyRow label="Sales angle" value={recommendation.salesAngle} />
                <CopyRow label="Trading risk" value={recommendation.tradingRisk} />
                <CopyRow label="Risk-control warning" value={recommendation.riskControlWarning} />
                <div className="rounded-2xl border border-bank-border bg-bank-bgAlt/55 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-bank-gold">Why this trades</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Perspective title="Client" body={why.client} />
                    <Perspective title="Sales" body={why.sales} />
                    <Perspective title="Trading" body={why.trading} />
                    <Perspective title="Risk Control" body={why.riskControl} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendation.suitabilityFlags.map((flag) => (
                    <Badge key={flag} variant={flag.toLowerCase().includes("risk") ? "amber" : "default"}>
                      {flag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
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

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-bank-border bg-bank-bgAlt/45 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-bank-muted">{label}</div>
      <div className="mt-2 text-sm leading-7 text-bank-text">{value}</div>
    </div>
  );
}

function Perspective({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-bank-border bg-bank-bg px-4 py-3">
      <div className="text-sm font-semibold text-bank-text">{title}</div>
      <div className="mt-2 text-sm leading-6 text-bank-muted">{body}</div>
    </div>
  );
}
