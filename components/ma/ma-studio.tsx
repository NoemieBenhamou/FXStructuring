"use client";

import { useMemo, useState } from "react";
import maCase from "@/data/fx/ma-case.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

export function MaStudio() {
  const [tenor, setTenor] = useState<keyof typeof maCase.tenors>("6M");
  const [spot, setSpot] = useState(maCase.spot);
  const [notionalUsd, setNotionalUsd] = useState(maCase.notionalUsd);
  const [dealProbability, setDealProbability] = useState(0.72);
  const [forwardPoints, setForwardPoints] = useState(0.008);
  const [optionPremiumProxy, setOptionPremiumProxy] = useState(0.021);

  const analysis = useMemo(() => {
    const tenorData = maCase.tenors[tenor];
    const forwardRate = tenorData.forward + forwardPoints;
    const eurNeededAtSpot = notionalUsd / spot;
    const eurNeededForward = notionalUsd / forwardRate;
    const breakageRisk = (eurNeededAtSpot - eurNeededForward) * (1 - dealProbability);
    const contingentCost = eurNeededForward * optionPremiumProxy * dealProbability;

    return {
      forwardRate,
      eurNeededAtSpot,
      eurNeededForward,
      breakageRisk,
      contingentCost,
      expectedProtectedNotional: notionalUsd * dealProbability
    };
  }, [dealProbability, forwardPoints, notionalUsd, optionPremiumProxy, spot, tenor]);

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Deal inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Field label="Tenor">
            <Select value={tenor} onChange={(event) => setTenor(event.target.value as keyof typeof maCase.tenors)}>
              {Object.keys(maCase.tenors).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <NumberField label="Spot" value={spot} onChange={setSpot} />
          <NumberField label="Transaction amount (USD)" value={notionalUsd} onChange={setNotionalUsd} />
          <NumberField label="Deal probability" value={dealProbability} onChange={setDealProbability} />
          <NumberField label="Forward points proxy" value={forwardPoints} onChange={setForwardPoints} />
          <NumberField label="Option premium proxy" value={optionPremiumProxy} onChange={setOptionPremiumProxy} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Forward rate" value={analysis.forwardRate.toFixed(4)} />
          <Metric label="EUR needed at spot" value={formatNumber(analysis.eurNeededAtSpot, 0)} />
          <Metric label="EUR under forward" value={formatNumber(analysis.eurNeededForward, 0)} />
          <Metric label="Expected protected notional" value={formatNumber(analysis.expectedProtectedNotional, 0)} />
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Breakage and contingency view</CardTitle>
              <Badge variant="amber">Conditional exposure</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <CopyPanel
              title="Vanilla forward hedge"
              body={`At ${analysis.forwardRate.toFixed(4)}, the plain forward removes FX uncertainty but leaves breakage risk if the deal fails before closing.`}
            />
            <CopyPanel
              title="Breakage risk if deal fails"
              body={`Illustrative unwind cost proxy: EUR ${formatNumber(analysis.breakageRisk, 0)} under the current probability and forward-point assumptions.`}
            />
            <CopyPanel
              title="Deal-contingent forward estimate"
              body={`A deal-contingent structure shifts part of the economics into contingency premium, estimated here at EUR ${formatNumber(analysis.contingentCost, 0)}.`}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Execution timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <TimelineStep title="Signing" body="FX exposure becomes visible but not yet certain." active />
              <TimelineStep title="Regulatory" body="Probability can gap on approvals and financing checkpoints." active />
              <TimelineStep title="Long-stop" body="Forward breakage risk peaks if closing confidence weakens." />
              <TimelineStep title="Closing" body="Contingent settlement activates only if the transaction completes." />
            </div>
            <div className="rounded-2xl border border-bank-border bg-bank-bgAlt/50 px-4 py-4 text-sm leading-7 text-bank-muted">
              Risk summary: M&amp;A hedging needs a clear long-stop date, explicit failure mechanics, and alignment between transaction probability and the hedge design. Plain forwards are simple, but they can misalign with conditional deal exposure.
            </div>
          </CardContent>
        </Card>
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

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <Input type="number" step="any" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </Field>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-2 p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-bank-muted">{label}</div>
        <div className="font-mono text-lg text-bank-text">{value}</div>
      </CardContent>
    </Card>
  );
}

function CopyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-bank-border bg-bank-bgAlt/50 p-4">
      <div className="text-sm font-semibold text-bank-text">{title}</div>
      <div className="mt-2 text-sm leading-7 text-bank-muted">{body}</div>
    </div>
  );
}

function TimelineStep({ title, body, active = false }: { title: string; body: string; active?: boolean }) {
  return (
    <div className="rounded-2xl border border-bank-border bg-bank-bgAlt/50 p-4">
      <div className="flex items-center gap-2">
        <span className={active ? "h-2.5 w-2.5 rounded-full bg-bank-gold" : "h-2.5 w-2.5 rounded-full bg-bank-muted"} />
        <div className="text-sm font-semibold text-bank-text">{title}</div>
      </div>
      <div className="mt-3 text-sm leading-7 text-bank-muted">{body}</div>
    </div>
  );
}
