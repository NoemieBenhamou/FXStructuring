import { normCdf, normPdf } from "@/lib/pricing/normal";

export type OptionType = "call" | "put";

export type FxOptionInput = {
  optionType: OptionType;
  spot: number;
  strike: number;
  domesticRate: number;
  foreignRate: number;
  volatility: number;
  maturityYears: number;
  notional: number;
};

export type FxOptionResult = {
  d1: number;
  d2: number;
  unitPrice: number;
  premium: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rhoDomestic: number;
  rhoForeign: number;
};

export function priceFxOption(input: FxOptionInput): FxOptionResult {
  const {
    optionType,
    spot: S,
    strike: K,
    domesticRate: rd,
    foreignRate: rf,
    volatility: sigma,
    maturityYears: T,
    notional
  } = input;

  if (S <= 0 || K <= 0 || sigma <= 0 || T <= 0 || notional <= 0) {
    throw new Error("Spot, strike, volatility, maturity and notional must be positive.");
  }

  const sqrtT = Math.sqrt(T);
  const dfDomestic = Math.exp(-rd * T);
  const dfForeign = Math.exp(-rf * T);
  const d1 = (Math.log(S / K) + (rd - rf + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const callUnit = S * dfForeign * normCdf(d1) - K * dfDomestic * normCdf(d2);
  const putUnit = K * dfDomestic * normCdf(-d2) - S * dfForeign * normCdf(-d1);
  const unitPrice = optionType === "call" ? callUnit : putUnit;

  const delta = optionType === "call" ? dfForeign * normCdf(d1) : -dfForeign * normCdf(-d1);
  const gamma = (dfForeign * normPdf(d1)) / (S * sigma * sqrtT);
  const vegaPerVolPoint = (S * dfForeign * normPdf(d1) * sqrtT) / 100;

  const callTheta = (
    -(S * dfForeign * normPdf(d1) * sigma) / (2 * sqrtT)
    - rd * K * dfDomestic * normCdf(d2)
    + rf * S * dfForeign * normCdf(d1)
  ) / 365;

  const putTheta = (
    -(S * dfForeign * normPdf(d1) * sigma) / (2 * sqrtT)
    + rd * K * dfDomestic * normCdf(-d2)
    - rf * S * dfForeign * normCdf(-d1)
  ) / 365;

  const rhoDomesticPerRatePoint = optionType === "call"
    ? (K * T * dfDomestic * normCdf(d2)) / 100
    : (-K * T * dfDomestic * normCdf(-d2)) / 100;

  const rhoForeignPerRatePoint = optionType === "call"
    ? (-T * S * dfForeign * normCdf(d1)) / 100
    : (T * S * dfForeign * normCdf(-d1)) / 100;

  return {
    d1,
    d2,
    unitPrice,
    premium: unitPrice * notional,
    delta,
    gamma,
    vega: vegaPerVolPoint * notional,
    theta: (optionType === "call" ? callTheta : putTheta) * notional,
    rhoDomestic: rhoDomesticPerRatePoint * notional,
    rhoForeign: rhoForeignPerRatePoint * notional
  };
}
