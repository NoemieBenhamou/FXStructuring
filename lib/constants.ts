export const MAJOR_FX_PAIRS = [
  "EURUSD",
  "GBPUSD",
  "EURCHF",
  "AUDUSD",
  "USDJPY",
  "USDCAD",
  "USDCHF",
  "USDTRY",
  "USDMXN",
  "EURJPY"
] as const;

export const FX_PAIRS = [
  ...MAJOR_FX_PAIRS,
  "NZDUSD",
  "EURGBP",
  "GBPJPY",
  "AUDJPY",
  "EURCAD",
  "EURAUD",
  "USDSEK",
  "USDNOK",
  "USDZAR",
  "USDCNH"
] as const;

export const CURRENCY_FILTERS = ["FX", "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "EM FX"] as const;

export const OTHER_SUPPORTED_FX_PAIRS = FX_PAIRS.filter((pair) => !MAJOR_FX_PAIRS.includes(pair as (typeof MAJOR_FX_PAIRS)[number]));

export function normalizeFxPair(pair: string) {
  return pair.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
}

export function formatFxPair(pair: string) {
  const normalized = normalizeFxPair(pair);
  if (normalized.length !== 6) return normalized;
  return `${normalized.slice(0, 3)}/${normalized.slice(3, 6)}`;
}
