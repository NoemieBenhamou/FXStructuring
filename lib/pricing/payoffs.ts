import type { OptionType } from "@/lib/pricing/garman-kohlhagen";

export function optionPayoff(optionType: OptionType, spotAtMaturity: number, strike: number, notional: number) {
  if (optionType === "call") {
    return Math.max(spotAtMaturity - strike, 0) * notional;
  }

  return Math.max(strike - spotAtMaturity, 0) * notional;
}

export function forwardPayoff(
  spotAtMaturity: number,
  forwardRate: number,
  notional: number,
  direction: "buyBase" | "sellBase"
) {
  const raw = (spotAtMaturity - forwardRate) * notional;
  return direction === "buyBase" ? -raw : raw;
}

export function riskReversalPayoff(params: {
  spotAtMaturity: number;
  callStrike: number;
  putStrike: number;
  notional: number;
  direction: "buyBase" | "sellBase";
}) {
  const { spotAtMaturity, callStrike, putStrike, notional, direction } = params;
  const longCall = Math.max(spotAtMaturity - callStrike, 0) * notional;
  const shortPut = -Math.max(putStrike - spotAtMaturity, 0) * notional;
  const payoff = longCall + shortPut;
  return direction === "buyBase" ? payoff : -payoff;
}

export function knockOutForwardPayoff(params: {
  spotAtMaturity: number;
  forwardRate: number;
  barrier: number;
  notional: number;
  direction: "buyBase" | "sellBase";
  barrierType: "lower" | "upper";
}) {
  const { spotAtMaturity, forwardRate, barrier, notional, direction, barrierType } = params;
  const knockedOut = barrierType === "lower" ? spotAtMaturity <= barrier : spotAtMaturity >= barrier;
  if (knockedOut) return 0;

  return forwardPayoff(spotAtMaturity, forwardRate, notional, direction);
}

export function targetForwardFixingPnl(params: {
  fixing: number;
  strike: number;
  notional: number;
  leverage: number;
  direction: "buyBase" | "sellBase";
}) {
  const { fixing, strike, notional, leverage, direction } = params;
  const favorable = direction === "sellBase" ? fixing > strike : fixing < strike;
  const effectiveNotional = favorable ? notional : notional * leverage;

  return direction === "sellBase"
    ? (strike - fixing) * effectiveNotional
    : (fixing - strike) * effectiveNotional;
}
