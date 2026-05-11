"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatFxPair, MAJOR_FX_PAIRS, normalizeFxPair, OTHER_SUPPORTED_FX_PAIRS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type FxPairSelectorProps = {
  pair: string;
  onPairChange: (pair: string) => void;
  label?: string;
  tone?: "default" | "editable";
};

export function FxPairSelector({
  pair,
  onPairChange,
  label,
  tone = "default"
}: FxPairSelectorProps) {
  const t = useTranslations("common.fxPairSelector");
  const normalizedPair = normalizeFxPair(pair);
  const isListedPair =
    MAJOR_FX_PAIRS.includes(normalizedPair as (typeof MAJOR_FX_PAIRS)[number]) ||
    OTHER_SUPPORTED_FX_PAIRS.includes(normalizedPair as (typeof OTHER_SUPPORTED_FX_PAIRS)[number]);

  const [selectedPair, setSelectedPair] = useState<string>(isListedPair ? normalizedPair : "__custom__");
  const [customPair, setCustomPair] = useState<string>(isListedPair ? "" : formatFxPair(normalizedPair));

  useEffect(() => {
    const nextPair = normalizeFxPair(pair);
    const nextListed =
      MAJOR_FX_PAIRS.includes(nextPair as (typeof MAJOR_FX_PAIRS)[number]) ||
      OTHER_SUPPORTED_FX_PAIRS.includes(nextPair as (typeof OTHER_SUPPORTED_FX_PAIRS)[number]);

    setSelectedPair(nextListed ? nextPair : "__custom__");
    setCustomPair(nextListed ? "" : formatFxPair(nextPair));
  }, [pair]);

  function submitCustomPair() {
    const normalized = normalizeFxPair(customPair);
    if (normalized.length === 6) {
      onPairChange(normalized);
      setSelectedPair("__custom__");
      setCustomPair(formatFxPair(normalized));
    }
  }

  const editable = tone === "editable";
  const selectClassName = editable ? "border-bank-cyan/50 bg-bank-cyan/10 focus:border-bank-cyan" : undefined;
  const inputClassName = editable ? "border-bank-cyan/50 bg-bank-cyan/10 focus:border-bank-cyan" : undefined;
  const surfaceClassName = editable ? "rounded-2xl border border-bank-cyan/35 bg-bank-cyan/5 p-3" : undefined;
  const displayLabel = label ?? t("label");

  return (
    <div className="grid gap-1.5">
      {displayLabel ? <span className="text-xs uppercase tracking-[0.2em] text-bank-muted">{displayLabel}</span> : null}
      <div className={cn(surfaceClassName)}>
        <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <Select
            className={selectClassName}
            value={selectedPair}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedPair(value);
              if (value !== "__custom__") {
                onPairChange(value);
              }
            }}
          >
            <optgroup label={t("majorCrosses")}>
              {MAJOR_FX_PAIRS.map((item) => (
                <option key={item} value={item}>
                  {formatFxPair(item)}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("otherSupportedCrosses")}>
              {OTHER_SUPPORTED_FX_PAIRS.map((item) => (
                <option key={item} value={item}>
                  {formatFxPair(item)}
                </option>
              ))}
            </optgroup>
            <option value="__custom__">{t("otherCross")}</option>
          </Select>
          {selectedPair === "__custom__" ? (
            <div className="flex gap-2">
              <Input
                className={inputClassName}
                value={customPair}
                placeholder={t("customPairPlaceholder")}
                onChange={(event) => setCustomPair(event.target.value.toUpperCase())}
              />
              <Button className={editable ? "border border-bank-cyan/50 bg-bank-cyan/10 text-bank-text hover:bg-bank-cyan/20" : undefined} type="button" onClick={submitCustomPair}>
                {t("load")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
