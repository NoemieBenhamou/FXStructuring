import { structureCopy } from "@/lib/content/structure-copy";

export type ClientType =
  | "corporateImporter"
  | "corporateExporter"
  | "financialSponsor"
  | "assetManager"
  | "privateBankClient"
  | "treasuryCenter";

export type Direction = "buyBase" | "sellBase" | "buyQuote" | "sellQuote";
export type Objective =
  | "certainty"
  | "improveForward"
  | "zeroPremium"
  | "upsideParticipation"
  | "maConditionality"
  | "portfolioRiskReduction";

export type ExposureInput = {
  clientType: ClientType;
  pair: string;
  direction: Direction;
  notional: number;
  tenorMonths: number;
  objective: Objective;
  constraints: {
    vanillaOnly: boolean;
    zeroCostOnly: boolean;
    noLeverage: boolean;
    noBarrier: boolean;
    hedgeAccountingSensitive: boolean;
    barrierAllowed: boolean;
    targetAllowed: boolean;
  };
};

export type StructureRecommendation = {
  id: string;
  name: string;
  bestUseCase: string;
  payoffIntuition: string;
  clientBenefit: string;
  salesAngle: string;
  tradingRisk: string;
  riskControlWarning: string;
  complexity: number;
  suitabilityFlags: string[];
};

function baseFlags(input: ExposureInput) {
  const flags = ["Budget-rate clarity"];
  if (input.constraints.hedgeAccountingSensitive) flags.push("Hedge-accounting review");
  if (input.tenorMonths > 12) flags.push("Long-dated execution review");
  return flags;
}

function forwardRecommendation(input: ExposureInput): StructureRecommendation {
  return {
    id: "forward",
    name: "Forward",
    bestUseCase: "Known exposure requiring rate certainty and benchmark transparency.",
    payoffIntuition: "Locks the future exchange rate and removes spot uncertainty for the hedged cashflow.",
    clientBenefit: structureCopy.forward.client,
    salesAngle: structureCopy.forward.sales,
    tradingRisk: structureCopy.forward.trading,
    riskControlWarning: structureCopy.forward.riskControl,
    complexity: 1,
    suitabilityFlags: [...baseFlags(input), "Breakage risk if exposure fails"]
  };
}

function vanillaOptionRecommendation(input: ExposureInput): StructureRecommendation {
  return {
    id: "vanilla-option",
    name: "Vanilla Option",
    bestUseCase: "Client values downside protection while preserving upside participation.",
    payoffIntuition: "Pays premium upfront to cap the adverse move while leaving favorable moves open.",
    clientBenefit: structureCopy.vanillaOption.client,
    salesAngle: structureCopy.vanillaOption.sales,
    tradingRisk: structureCopy.vanillaOption.trading,
    riskControlWarning: structureCopy.vanillaOption.riskControl,
    complexity: 2,
    suitabilityFlags: [...baseFlags(input), "Premium-funded"]
  };
}

function riskReversalRecommendation(input: ExposureInput): StructureRecommendation {
  return {
    id: "risk-reversal",
    name: "Risk Reversal",
    bestUseCase: "Zero-premium protection where the client accepts giving up some favorable tail participation.",
    payoffIntuition: "Buy protection and fund it by selling an opposite-side option farther away from spot.",
    clientBenefit: structureCopy.riskReversal.client,
    salesAngle: structureCopy.riskReversal.sales,
    tradingRisk: structureCopy.riskReversal.trading,
    riskControlWarning: structureCopy.riskReversal.riskControl,
    complexity: 3,
    suitabilityFlags: [...baseFlags(input), "Sold-option obligation"]
  };
}

function knockOutForwardRecommendation(input: ExposureInput): StructureRecommendation {
  return {
    id: "knock-out-forward",
    name: "Knock-Out Forward",
    bestUseCase: "Forward enhancement when the client can tolerate hedge termination if a barrier is hit.",
    payoffIntuition: "Improves the rate relative to a plain forward, but the contract terminates if the barrier condition is triggered.",
    clientBenefit: structureCopy.knockOutForward.client,
    salesAngle: structureCopy.knockOutForward.sales,
    tradingRisk: structureCopy.knockOutForward.trading,
    riskControlWarning: structureCopy.knockOutForward.riskControl,
    complexity: 4,
    suitabilityFlags: [...baseFlags(input), "Barrier path dependency"]
  };
}

function tarfRecommendation(input: ExposureInput): StructureRecommendation {
  return {
    id: "tarf",
    name: "Target Forward / TARF",
    bestUseCase: "Recurring exposures seeking carry enhancement with tolerance for leverage and path dependency.",
    payoffIntuition: "Accrues beneficial fixings toward a target but can magnify adverse fixings through leverage.",
    clientBenefit: structureCopy.tarf.client,
    salesAngle: structureCopy.tarf.sales,
    tradingRisk: structureCopy.tarf.trading,
    riskControlWarning: structureCopy.tarf.riskControl,
    complexity: 5,
    suitabilityFlags: [...baseFlags(input), "Cashflow integrity critical", "Leverage review"]
  };
}

function basketOptionRecommendation(input: ExposureInput): StructureRecommendation {
  return {
    id: "basket-option",
    name: "Basket Option",
    bestUseCase: "Multi-currency portfolios where a holistic risk reduction objective matters more than single-pair precision.",
    payoffIntuition: "Protects a weighted basket rather than a single pair, reducing hedge cost through diversification.",
    clientBenefit: structureCopy.basketOption.client,
    salesAngle: structureCopy.basketOption.sales,
    tradingRisk: structureCopy.basketOption.trading,
    riskControlWarning: structureCopy.basketOption.riskControl,
    complexity: 4,
    suitabilityFlags: [...baseFlags(input), "Correlation model sensitivity"]
  };
}

function dealContingentForwardRecommendation(input: ExposureInput): StructureRecommendation {
  return {
    id: "deal-contingent-forward",
    name: "Deal-Contingent Forward",
    bestUseCase: "Cross-border M&A where the underlying transaction remains conditional until closing.",
    payoffIntuition: "Activates only if the deal closes, reducing breakage risk relative to a plain forward.",
    clientBenefit: structureCopy.dealContingentForward.client,
    salesAngle: structureCopy.dealContingentForward.sales,
    tradingRisk: structureCopy.dealContingentForward.trading,
    riskControlWarning: structureCopy.dealContingentForward.riskControl,
    complexity: 4,
    suitabilityFlags: [...baseFlags(input), "Conditional settlement mechanics"]
  };
}

export function recommendStructures(input: ExposureInput): StructureRecommendation[] {
  const recommendations: StructureRecommendation[] = [forwardRecommendation(input)];

  if (input.objective === "certainty" || input.objective === "upsideParticipation") {
    recommendations.push(vanillaOptionRecommendation(input));
  }

  if (input.objective === "zeroPremium" && !input.constraints.vanillaOnly) {
    recommendations.push(riskReversalRecommendation(input));
  }

  if (input.objective === "improveForward" && input.constraints.barrierAllowed && !input.constraints.noBarrier) {
    recommendations.push(knockOutForwardRecommendation(input));
  }

  if (input.objective === "improveForward" && input.constraints.targetAllowed && !input.constraints.noLeverage) {
    recommendations.push(tarfRecommendation(input));
  }

  if (input.objective === "maConditionality") {
    recommendations.push(dealContingentForwardRecommendation(input));
  }

  if (input.objective === "portfolioRiskReduction") {
    recommendations.push(basketOptionRecommendation(input));
  }

  return recommendations;
}

const directionCopy: Record<Direction, string> = {
  buyBase: "buys base currency",
  sellBase: "sells base currency",
  buyQuote: "buys quote currency",
  sellQuote: "sells quote currency"
};

export function explainExposure(input: ExposureInput) {
  const adverseScenario =
    input.direction === "buyBase" || input.direction === "sellQuote"
      ? `${input.pair} rising`
      : `${input.pair} falling`;

  const [base, quote] = [input.pair.slice(0, 3), input.pair.slice(3, 6)];
  const benchmark = `A forward would lock a ${base}/${quote} benchmark for ${input.tenorMonths}M, but create mark-to-market unwind risk if the underlying flow changes.`;

  const productUniverse = recommendStructures(input).map((recommendation) => recommendation.name).join(", ");

  return {
    exposureSentence: `The client ${directionCopy[input.direction]} in ${input.pair} for ${input.tenorMonths} months on a notional of ${input.notional.toLocaleString("en-US")}.`,
    riskDirection: `The adverse scenario is ${adverseScenario}, because that would worsen the effective funding or conversion rate for the planned cashflow.`,
    benchmarkForward: benchmark,
    productUniverse,
    suitabilityFlags: recommendStructures(input).flatMap((recommendation) => recommendation.suitabilityFlags)
  };
}
