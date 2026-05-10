"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getClientSummaryCopy,
  getDefaultTarfForm,
  tarfTermSheetSections,
  type TermSheetFieldKey,
  type TarfTermSheetForm
} from "@/lib/content/client-summary";

const multiLineFields = new Set<TermSheetFieldKey>([
  "clientProfile",
  "objective",
  "documentation",
  "fixingDates",
  "settlementDates",
  "referenceSource",
  "knockOutEvent",
  "notional2"
]);

const wideFields = new Set<TermSheetFieldKey>([
  "clientProfile",
  "objective",
  "documentation",
  "fixingDates",
  "settlementDates",
  "referenceSource",
  "knockOutEvent",
  "premium",
  "notional2",
  "leverageFactor"
]);

export function ClientSummary({ locale }: { locale: string }) {
  const copy = getClientSummaryCopy(locale);
  const [activeView, setActiveView] = useState<"summary" | "tarf">("summary");
  const [form, setForm] = useState<TarfTermSheetForm>(() => getDefaultTarfForm());

  function updateField(key: TermSheetFieldKey, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleDownloadPdf() {
    if (activeView === "summary") {
      const anchor = document.createElement("a");
      anchor.href = `/api/summary/pdf?locale=${encodeURIComponent(locale)}`;
      anchor.download = `fx-summary-${locale}.pdf`;
      anchor.click();
      return;
    }

    const response = await fetch("/api/summary/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode: "tarf",
        locale,
        form
      })
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tarf-termsheet-${locale}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={activeView === "summary" ? "primary" : "secondary"}
              onClick={() => setActiveView("summary")}
              title="Open the distribution-facing summary."
            >
              Client Summary
            </Button>
            <Button
              variant={activeView === "tarf" ? "primary" : "secondary"}
              onClick={() => setActiveView("tarf")}
              title="Open the TARF input form and indicative term sheet."
            >
              TARF
            </Button>
          </div>
          <Button
            onClick={() => void handleDownloadPdf()}
            title={activeView === "summary" ? "Download the client summary as PDF." : "Download the indicative TARF term sheet as PDF."}
          >
            {activeView === "summary" ? "Download summary in PDF" : "Download term sheet in PDF"}
          </Button>
        </CardContent>
      </Card>

      {activeView === "summary" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Reference pair" value={form.currencyPair} />
            <MetricCard label="Indicative strike" value={form.strikeRate.replace("K = ", "")} />
            <MetricCard label="Leverage factor" value={form.leverageFactor} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Technical explanation</CardTitle>
                  <Badge variant="blue">Desk framing</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-bank-muted">{copy.technical}</CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Client-friendly explanation</CardTitle>
                  <Badge variant="gold">Distribution tone</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-bank-muted">{copy.client}</CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Email-ready summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-bank-muted">{copy.email}</CardContent>
            </Card>

            <Card className="rounded-3xl border-bank-amber/60 bg-bank-amber/10">
              <CardHeader>
                <CardTitle>Risk warning</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-amber-100">{form.knockOutEvent}. The structure remains subject to suitability, target redemption mechanics, and leverage governance.</CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>TARF input menu</CardTitle>
                <Badge variant="gold">Live form</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {tarfTermSheetSections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-bank-gold">{section.title}</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.fields.map((field) => {
                      const multiline = multiLineFields.has(field.key);
                      const wide = wideFields.has(field.key);
                      const inputClassName =
                        "w-full rounded-2xl border border-bank-border bg-bank-bgAlt px-4 py-3 text-sm text-bank-text outline-none transition placeholder:text-bank-muted focus:border-bank-cyan";

                      return (
                        <label key={field.key} className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-bank-muted">{field.label}</span>
                          {multiline ? (
                            <textarea
                              value={form[field.key]}
                              onChange={(event) => updateField(field.key, event.target.value)}
                              rows={3}
                              className={`${inputClassName} resize-y`}
                            />
                          ) : (
                            <input
                              value={form[field.key]}
                              onChange={(event) => updateField(field.key, event.target.value)}
                              className={inputClassName}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Indicative term sheet</CardTitle>
                <Badge variant="blue">Auto-filled</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {tarfTermSheetSections.map((section) => (
                <div key={section.title} className="overflow-hidden rounded-2xl border border-bank-border/80 bg-bank-bgAlt/55">
                  <div className="border-b border-bank-border/80 px-4 py-3 text-xs uppercase tracking-[0.22em] text-bank-gold">
                    {section.title}
                  </div>
                  <div className="divide-y divide-bank-border/70">
                    {section.fields.map((field) => (
                      <div key={field.key} className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,190px)_1fr]">
                        <div className="text-xs uppercase tracking-[0.14em] text-bank-muted">{field.label}</div>
                        <div className="text-sm leading-6 text-bank-text">{form[field.key]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-bank-border/80 bg-bank-panel/60 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-bank-gold">Risk warning</div>
                <p className="mt-2 text-sm leading-6 text-bank-muted">
                  If the underlying USD receivable disappears, the hedge can become a speculative obligation. Add cashflow integrity monitoring and early-exit triggers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="space-y-2 py-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-bank-muted">{label}</div>
        <div className="text-xl font-semibold text-bank-text">{value}</div>
      </CardContent>
    </Card>
  );
}
