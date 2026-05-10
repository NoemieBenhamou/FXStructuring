"use client";

import { useMemo, useState } from "react";
import { FxPairSelector } from "@/components/common/fx-pair-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addBusinessDays,
  buildFixingSchedule,
  clampPositiveInteger,
  formatScheduleDate,
  getClientSummaryCopy,
  getDefaultTarfForm,
  parseIsoDate,
  tarfTermSheetSections,
  toIsoDate,
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

const datePickerFields = new Set<TermSheetFieldKey>(["tradeDate", "effectiveDate"]);
const computedFields = new Set<TermSheetFieldKey>(["finalExpiryDate", "finalSettlementDate", "fixingDates", "settlementDates"]);
const numericFields = new Set<TermSheetFieldKey>(["numberOfFixings", "settlementPeriodDays"]);
const frequencyOptions = ["Weekly", "Monthly"] as const;
const referenceSources = ["Reuters", "BFIX", "Bloomberg", "Other"] as const;
const editableControlClassName = "border-bank-cyan/50 bg-bank-cyan/10 focus:border-bank-cyan";
const editableSurfaceClassName = "rounded-2xl border border-bank-cyan/35 bg-bank-cyan/5 p-3";
const computedSurfaceClassName = "rounded-2xl border border-bank-border/70 bg-bank-bgAlt/60 px-4 py-3 text-sm leading-6 text-bank-text";

export function ClientSummary({ locale }: { locale: string }) {
  const copy = getClientSummaryCopy(locale);
  const [activeView, setActiveView] = useState<"summary" | "tarf">("summary");
  const [form, setForm] = useState<TarfTermSheetForm>(() => getDefaultTarfForm());
  const computedForm = useMemo(() => {
    const tradeDate = parseIsoDate(form.tradeDate) ?? addBusinessDays(new Date(), 2);
    const effectiveDate = parseIsoDate(form.effectiveDate) ?? addBusinessDays(new Date(), 3);
    const numberOfFixings = clampPositiveInteger(form.numberOfFixings, 12).toString();
    const settlementPeriodDays = clampPositiveInteger(form.settlementPeriodDays, 2, 30).toString();
    const fixingSchedule = buildFixingSchedule(toIsoDate(effectiveDate), numberOfFixings, form.fixingFrequency);
    const settlementSchedule = fixingSchedule.map((date) =>
      addBusinessDays(date, clampPositiveInteger(settlementPeriodDays, 2, 30))
    );
    const finalExpiryDate = fixingSchedule.at(-1) ?? effectiveDate;
    const finalSettlementDate = settlementSchedule.at(-1) ?? addBusinessDays(finalExpiryDate, 2);

    return {
      ...form,
      tradeDate: toIsoDate(tradeDate),
      effectiveDate: toIsoDate(effectiveDate),
      numberOfFixings,
      settlementPeriodDays,
      finalExpiryDate: toIsoDate(finalExpiryDate),
      finalSettlementDate: toIsoDate(finalSettlementDate),
      fixingDates: fixingSchedule.map(formatScheduleDate).join(", "),
      settlementDates: settlementSchedule.map(formatScheduleDate).join(", ")
    };
  }, [form]);

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
        form: computedForm
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
            <MetricCard label="Indicative strike" value={computedForm.strikeRate.replace("K = ", "")} />
            <MetricCard label="Leverage factor" value={computedForm.leverageFactor} />
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
              <CardContent className="text-sm leading-7 text-amber-100">{computedForm.knockOutEvent}. The structure remains subject to suitability, target redemption mechanics, and leverage governance.</CardContent>
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
              <div className="flex flex-wrap gap-3 rounded-2xl border border-bank-border/70 bg-bank-bgAlt/45 px-4 py-3 text-xs text-bank-muted">
                <div className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-bank-cyan/50 bg-bank-cyan/20" />
                  Fields in blue are user inputs
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-bank-border bg-bank-bgAlt/80" />
                  Darker boxes are computed outputs
                </div>
              </div>
              {tarfTermSheetSections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-bank-gold">{section.title}</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.fields.map((field) => {
                      const multiline = multiLineFields.has(field.key);
                      const wide = wideFields.has(field.key);
                      const inputClassName =
                        "w-full rounded-2xl border border-bank-border bg-bank-bgAlt px-4 py-3 text-sm text-bank-text outline-none transition placeholder:text-bank-muted focus:border-bank-cyan";
                      const value = computedFields.has(field.key) ? computedForm[field.key] : form[field.key];

                      return (
                        <label key={field.key} className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-bank-muted">{field.label}</span>
                            {computedFields.has(field.key) ? (
                              <span className="text-[10px] uppercase tracking-[0.18em] text-bank-muted">Output</span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Input</span>
                            )}
                          </div>
                          {field.key === "currencyPair" ? (
                            <FxPairSelector pair={form.currencyPair} onPairChange={(pair) => updateField("currencyPair", pair)} label="" tone="editable" />
                          ) : computedFields.has(field.key) ? (
                            <div className={computedSurfaceClassName}>
                              {value}
                            </div>
                          ) : datePickerFields.has(field.key) ? (
                            <div className={editableSurfaceClassName}>
                              <Input
                                className={editableControlClassName}
                                type="date"
                                value={value}
                                onChange={(event) => updateField(field.key, event.target.value)}
                              />
                            </div>
                          ) : field.key === "fixingFrequency" ? (
                            <div className={`${editableSurfaceClassName} flex flex-wrap gap-2`}>
                              {frequencyOptions.map((option) => (
                                <Button
                                  key={option}
                                  type="button"
                                  variant={form.fixingFrequency === option ? "primary" : "secondary"}
                                  className={form.fixingFrequency === option ? undefined : "border-bank-cyan/50 bg-bank-cyan/10 text-bank-text hover:bg-bank-cyan/20"}
                                  onClick={() => updateField("fixingFrequency", option)}
                                >
                                  {option}
                                </Button>
                              ))}
                            </div>
                          ) : field.key === "referenceSource" ? (
                            <div className={`${editableSurfaceClassName} flex flex-wrap gap-2`}>
                              {referenceSources.map((option) => (
                                <Button
                                  key={option}
                                  type="button"
                                  variant={form.referenceSource === option ? "primary" : "secondary"}
                                  className={form.referenceSource === option ? undefined : "border-bank-cyan/50 bg-bank-cyan/10 text-bank-text hover:bg-bank-cyan/20"}
                                  onClick={() => updateField("referenceSource", option)}
                                >
                                  {option}
                                </Button>
                              ))}
                            </div>
                          ) : multiline ? (
                            <div className={editableSurfaceClassName}>
                              <textarea
                                value={value}
                                onChange={(event) => updateField(field.key, event.target.value)}
                                rows={3}
                                className={`${inputClassName} ${editableControlClassName} resize-y`}
                              />
                            </div>
                          ) : (
                            <div className={editableSurfaceClassName}>
                              <Input
                                className={editableControlClassName}
                                type={numericFields.has(field.key) ? "number" : "text"}
                                min={numericFields.has(field.key) ? 1 : undefined}
                                value={value}
                                onChange={(event) => updateField(field.key, event.target.value)}
                              />
                            </div>
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
                        <div className="text-sm leading-6 text-bank-text">{computedForm[field.key]}</div>
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
