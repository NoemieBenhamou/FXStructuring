"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { explainExposure, type ExposureInput } from "@/lib/recommendations";

const defaultInput: ExposureInput = {
  clientType: "corporateImporter",
  pair: "EURUSD",
  direction: "buyBase",
  notional: 25000000,
  tenorMonths: 6,
  objective: "certainty",
  constraints: {
    vanillaOnly: false,
    zeroCostOnly: false,
    noLeverage: true,
    noBarrier: true,
    hedgeAccountingSensitive: true,
    barrierAllowed: false,
    targetAllowed: false
  }
};

export function ExposureTranslator() {
  const [input, setInput] = useState<ExposureInput>(defaultInput);
  const [submitted, setSubmitted] = useState(defaultInput);
  const output = useMemo(() => explainExposure(submitted), [submitted]);

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Exposure brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Client type">
            <Select value={input.clientType} onChange={(event) => setInput({ ...input, clientType: event.target.value as ExposureInput["clientType"] })}>
              <option value="corporateImporter">Corporate importer</option>
              <option value="corporateExporter">Corporate exporter</option>
              <option value="financialSponsor">Financial sponsor</option>
              <option value="assetManager">Asset manager</option>
              <option value="privateBankClient">Private bank client</option>
              <option value="treasuryCenter">Treasury center</option>
            </Select>
          </Field>
          <Field label="Currency pair">
            <Input value={input.pair} onChange={(event) => setInput({ ...input, pair: event.target.value.toUpperCase() })} />
          </Field>
          <Field label="Direction">
            <Select value={input.direction} onChange={(event) => setInput({ ...input, direction: event.target.value as ExposureInput["direction"] })}>
              <option value="buyBase">Buys base</option>
              <option value="sellBase">Sells base</option>
              <option value="buyQuote">Buys quote</option>
              <option value="sellQuote">Sells quote</option>
            </Select>
          </Field>
          <Field label="Notional">
            <Input type="number" value={input.notional} onChange={(event) => setInput({ ...input, notional: Number(event.target.value) })} />
          </Field>
          <Field label="Tenor (months)">
            <Input type="number" value={input.tenorMonths} onChange={(event) => setInput({ ...input, tenorMonths: Number(event.target.value) })} />
          </Field>
          <Field label="Objective">
            <Select value={input.objective} onChange={(event) => setInput({ ...input, objective: event.target.value as ExposureInput["objective"] })}>
              <option value="certainty">Certainty</option>
              <option value="improveForward">Improve forward</option>
              <option value="zeroPremium">Zero premium</option>
              <option value="upsideParticipation">Upside participation</option>
              <option value="maConditionality">M&A conditionality</option>
              <option value="portfolioRiskReduction">Portfolio risk reduction</option>
            </Select>
          </Field>
          <div className="grid gap-2">
            <Toggle label="Vanilla only" checked={input.constraints.vanillaOnly} onToggle={(checked) => setInput({ ...input, constraints: { ...input.constraints, vanillaOnly: checked } })} />
            <Toggle label="No leverage" checked={input.constraints.noLeverage} onToggle={(checked) => setInput({ ...input, constraints: { ...input.constraints, noLeverage: checked } })} />
            <Toggle label="No barrier" checked={input.constraints.noBarrier} onToggle={(checked) => setInput({ ...input, constraints: { ...input.constraints, noBarrier: checked, barrierAllowed: !checked } })} />
            <Toggle label="Barrier allowed" checked={input.constraints.barrierAllowed} onToggle={(checked) => setInput({ ...input, constraints: { ...input.constraints, barrierAllowed: checked, noBarrier: !checked } })} />
            <Toggle label="Target allowed" checked={input.constraints.targetAllowed} onToggle={(checked) => setInput({ ...input, constraints: { ...input.constraints, targetAllowed: checked } })} />
          </div>
          <Button className="w-full" onClick={() => setSubmitted(input)}>Translate exposure</Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Exposure diagnosis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextPanel title="Exposure sentence" body={output.exposureSentence} />
            <TextPanel title="Risk direction" body={output.riskDirection} />
            <TextPanel title="Forward benchmark" body={output.benchmarkForward} />
            <TextPanel title="Relevant product universe" body={output.productUniverse} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Suitability flags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Array.from(new Set(output.suitabilityFlags)).map((flag) => (
              <Badge key={flag} variant={flag.toLowerCase().includes("risk") ? "amber" : "default"}>
                {flag}
              </Badge>
            ))}
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

function Toggle({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-bank-border bg-bank-bgAlt/50 px-4 py-3 text-sm text-bank-text">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} className="h-4 w-4 accent-[#c8a45d]" />
    </label>
  );
}

function TextPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-bank-border bg-bank-bgAlt/50 p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-bank-gold">{title}</div>
      <div className="mt-3 text-sm leading-7 text-bank-text">{body}</div>
    </div>
  );
}
