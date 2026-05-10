"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatFxPair, MAJOR_FX_PAIRS, normalizeFxPair, OTHER_SUPPORTED_FX_PAIRS } from "@/lib/constants";

type FxPairSelectorProps = {
  pair: string;
  onPairChange: (pair: string) => void;
  label?: string;
};

export function FxPairSelector({
  pair,
  onPairChange,
  label = "Currency pair"
}: FxPairSelectorProps) {
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

  return (
    <div className="grid gap-1.5">
      <span className="text-xs uppercase tracking-[0.2em] text-bank-muted">{label}</span>
      <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <Select
          value={selectedPair}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedPair(value);
            if (value !== "__custom__") {
              onPairChange(value);
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
            <Button type="button" onClick={submitCustomPair}>
              Load
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
