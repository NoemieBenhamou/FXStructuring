import tarfCase from "@/data/fx/audusd-tarf-case.json";
import { formatFxPair } from "@/lib/constants";

export const localeCopy = {
  en: {
    technical:
      "AUDJPY hedging discussion supports a structured zero-premium package when the client wants improved carry but can tolerate sold-option or barrier features. Relative volatility and skew justify comparing a risk reversal against a knock-out forward before escalating to TARF complexity.",
    client:
      "You can improve today’s hedge level if you accept that some favorable market moves may be capped or that protection can switch off under predefined conditions. The right structure depends on whether budget certainty or carry improvement matters more.",
    email:
      "We recommend comparing a plain forward, a zero-cost risk reversal and a knock-out forward against your budget rate. The next step is to confirm cashflow certainty, downside tolerance and whether any barrier feature is acceptable for governance purposes."
  },
  de: {
    technical:
      "Die AUDJPY-Absicherungsdiskussion spricht fuer ein strukturiertes Zero-Premium-Paket, wenn der Kunde besseren Carry sucht und gleichzeitig verkaufte Optionen oder Barrier-Elemente tragen kann. Volatilitaet und Skew sprechen fuer einen Vergleich von Risk Reversal und Knock-Out Forward vor einer TARF-Eskalation.",
    client:
      "Sie koennen das heutige Hedge-Niveau verbessern, wenn Sie akzeptieren, dass guenstige Marktbewegungen teilweise begrenzt werden oder der Schutz unter definierten Bedingungen entfaellt. Entscheidend ist, ob Budgetsicherheit oder Carry-Verbesserung wichtiger ist.",
    email:
      "Wir empfehlen den Vergleich eines Plain-Forward, eines Zero-Cost Risk Reversal und eines Knock-Out Forward gegen Ihren Budgetkurs. Der naechste Schritt ist die Bestaetigung von Cashflow-Sicherheit, Verlusttoleranz und der Governance-Faehigkeit moeglicher Barrier-Features."
  },
  fr: {
    technical:
      "La discussion de couverture AUDJPY soutient une solution structuree sans prime lorsque le client recherche un meilleur carry tout en acceptant des options vendues ou des caracteristiques de barriere. La volatilite relative et le skew justifient une comparaison entre risk reversal et knock-out forward avant toute complexite de type TARF.",
    client:
      "Vous pouvez ameliorer le niveau de couverture actuel si vous acceptez qu'une partie des mouvements favorables soit plafonnee ou que la protection puisse disparaitre selon des conditions predeterminees. Le bon choix depend de la priorite entre certitude budgetaire et amelioration du carry.",
    email:
      "Nous recommandons de comparer un forward simple, un risk reversal zero-cost et un knock-out forward par rapport au cours budget. La prochaine etape consiste a confirmer la certitude du flux, la tolerance au downside et l'acceptabilite d'une barriere du point de vue de la gouvernance."
  }
} as const;

export type TarfTermSheetForm = {
  productName: string;
  productType: string;
  clientProfile: string;
  objective: string;
  tradeDate: string;
  effectiveDate: string;
  finalExpiryDate: string;
  finalSettlementDate: string;
  currencyPair: string;
  quoteConvention: string;
  clientDirection: string;
  calculationAgent: string;
  documentation: string;
  numberOfFixings: string;
  fixingFrequency: string;
  fixingDates: string;
  settlementPeriodDays: string;
  settlementDates: string;
  referenceSource: string;
  strikeRate: string;
  forwardReference: string;
  targetPoints: string;
  accumulatedItmPoints: string;
  knockOutEvent: string;
  premium: string;
  notional1: string;
  notional2: string;
  leverageFactor: string;
};

export type TermSheetFieldKey = keyof TarfTermSheetForm;

export type TermSheetField = {
  key: TermSheetFieldKey;
  label: string;
  placeholder?: string;
};

export type TermSheetSection = {
  title: string;
  fields: TermSheetField[];
};

export function getClientSummaryCopy(locale: string) {
  return localeCopy[locale as keyof typeof localeCopy] ?? localeCopy.en;
}

function isBusinessDay(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatScheduleDate(date: Date) {
  return toIsoDate(date);
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map((item) => Number.parseInt(item, 10));
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function addBusinessDays(startDate: Date, businessDays: number) {
  const date = new Date(startDate);
  let added = 0;

  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    if (isBusinessDay(date)) {
      added += 1;
    }
  }

  return date;
}

export function advanceFrequency(startDate: Date, frequency: string, step: number) {
  const date = new Date(startDate);

  if (frequency === "Weekly") {
    date.setDate(date.getDate() + step * 7);
    return date;
  }

  date.setMonth(date.getMonth() + step);
  return date;
}

export function clampPositiveInteger(value: string, fallback: number, max = 60) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export function buildFixingSchedule(effectiveDate: string, numberOfFixings: string, fixingFrequency: string) {
  const effective = parseIsoDate(effectiveDate);
  if (!effective) return [];

  const count = clampPositiveInteger(numberOfFixings, 12);
  return Array.from({ length: count }, (_, index) => advanceFrequency(effective, fixingFrequency, index));
}

export function getDefaultTarfForm(): TarfTermSheetForm {
  const pair = formatFxPair(tarfCase.pair);
  const tradeDate = addBusinessDays(new Date(), 2);
  const effectiveDate = addBusinessDays(new Date(), 3);
  const numberOfFixings = "12";
  const fixingFrequency = "Monthly";
  const settlementPeriodDays = "2";
  const fixingSchedule = buildFixingSchedule(toIsoDate(effectiveDate), numberOfFixings, fixingFrequency);
  const settlementSchedule = fixingSchedule.map((date) =>
    addBusinessDays(date, clampPositiveInteger(settlementPeriodDays, 2, 30))
  );
  const finalExpiryDate = fixingSchedule.at(-1) ?? effectiveDate;
  const finalSettlementDate = settlementSchedule.at(-1) ?? addBusinessDays(finalExpiryDate, 2);

  return {
    productName: "FX Target Redemption Forward / TARF",
    productType: "OTC FX structured forward",
    clientProfile: "Corporate importer with recurring USD purchase needs",
    objective:
      "Buy USD at an enhanced rate versus a standard forward, subject to target redemption and possible leverage.",
    tradeDate: toIsoDate(tradeDate),
    effectiveDate: toIsoDate(effectiveDate),
    finalExpiryDate: toIsoDate(finalExpiryDate),
    finalSettlementDate: toIsoDate(finalSettlementDate),
    currencyPair: pair,
    quoteConvention: "Domestic Currency per 1 USD",
    clientDirection: "Client buys USD and sells Domestic Currency",
    calculationAgent: "Bank",
    documentation: "ISDA Master Agreement / local master agreement / confirmation",
    numberOfFixings,
    fixingFrequency,
    fixingDates: fixingSchedule.map(formatScheduleDate).join(", "),
    settlementPeriodDays,
    settlementDates: settlementSchedule.map(formatScheduleDate).join(", "),
    referenceSource: "Reuters",
    strikeRate: `K = ${tarfCase.strike.toFixed(4)} Domestic Currency per USD`,
    forwardReference: "Standard market forward curve at trade date",
    targetPoints: "[Target points / pips]",
    accumulatedItmPoints: "0",
    knockOutEvent: "Occurs when Accumulated ITM Points >= Target Points",
    premium: "Zero upfront premium, unless otherwise specified",
    notional1: "USD [Notional 1] per fixing",
    notional2: "USD [Notional 2] per fixing, typically 1x to 2x Notional 1",
    leverageFactor: `Notional 2 / Notional 1 = ${tarfCase.leverage.toFixed(1)}x`
  };
}

export const tarfTermSheetSections: TermSheetSection[] = [
  {
    title: "Product Summary",
    fields: [
      { key: "productName", label: "Product Name" },
      { key: "productType", label: "Product Type" },
      { key: "clientProfile", label: "Client Profile" },
      { key: "objective", label: "Objective" },
      { key: "tradeDate", label: "Trade Date" },
      { key: "effectiveDate", label: "Effective Date" },
      { key: "finalExpiryDate", label: "Final Expiry Date" },
      { key: "finalSettlementDate", label: "Final Settlement Date" },
      { key: "currencyPair", label: "Currency Pair" },
      { key: "quoteConvention", label: "Quote Convention" },
      { key: "clientDirection", label: "Client Direction" },
      { key: "calculationAgent", label: "Calculation Agent" },
      { key: "documentation", label: "Documentation" }
    ]
  },
  {
    title: "Economic Terms",
    fields: [
      { key: "numberOfFixings", label: "Number of Fixings" },
      { key: "fixingFrequency", label: "Fixing Frequency" },
      { key: "fixingDates", label: "Fixing Date(s)" },
      { key: "settlementPeriodDays", label: "Settlement Period (business days)" },
      { key: "settlementDates", label: "Settlement Date(s)" },
      { key: "referenceSource", label: "Reference Source" },
      { key: "strikeRate", label: "Strike Rate" },
      { key: "forwardReference", label: "Forward Reference" },
      { key: "targetPoints", label: "Target Points" },
      { key: "accumulatedItmPoints", label: "Accumulated ITM Points at inception" },
      { key: "knockOutEvent", label: "Knock-Out Event" },
      { key: "premium", label: "Premium" },
      { key: "notional1", label: "Notional 1" },
      { key: "notional2", label: "Notional 2" },
      { key: "leverageFactor", label: "Leverage Factor" }
    ]
  }
];

export function buildTarfTermSheetMarkdown(form: TarfTermSheetForm) {
  return `# Indicative TARF Term Sheet

## Product Summary

| Field | Indicative Terms |
| --- | --- |
${tarfTermSheetSections[0].fields.map((field) => `| ${field.label} | ${form[field.key]} |`).join("\n")}

## Economic Terms

| Field | Indicative Terms |
| --- | --- |
${tarfTermSheetSections[1].fields.map((field) => `| ${field.label} | ${form[field.key]} |`).join("\n")}

## Risk Warning

${tarfCase.riskWarning}

## Disclaimer

This term sheet is indicative only and should not be treated as investment advice, a binding quote, or final legal documentation.
`;
}

export function buildSummaryMarkdown(locale: string) {
  const copy = getClientSummaryCopy(locale);
  const defaults = getDefaultTarfForm();

  return `# Client Summary

## Reference Structure

- Pair: ${defaults.currencyPair}
- Indicative strike: ${defaults.strikeRate}
- Leverage factor: ${defaults.leverageFactor}
- Fixing profile: ${defaults.numberOfFixings}

## Technical Explanation

${copy.technical}

## Client-Friendly Explanation

${copy.client}

## Email-Ready Summary

${copy.email}

## Risk Warning

${tarfCase.riskWarning}
`;
}

export function buildPdfSummaryContent(locale: string) {
  const copy = getClientSummaryCopy(locale);
  const defaults = getDefaultTarfForm();

  return {
    title: "FX Structure LAB",
    subtitle: "Client summary",
    pair: defaults.currencyPair,
    highlights: [
      { label: "Indicative strike", value: defaults.strikeRate.replace("K = ", "") },
      { label: "Leverage", value: defaults.leverageFactor },
      { label: "Fixings", value: defaults.numberOfFixings }
    ],
    sections: [
      { title: "Technical explanation", body: copy.technical },
      { title: "Client-friendly explanation", body: copy.client },
      { title: "Email-ready summary", body: copy.email },
      { title: "Risk warning", body: tarfCase.riskWarning }
    ],
    disclaimer:
      "Indicative document only. Not investment advice, not a binding quote, and not final legal documentation."
  };
}

export function buildPdfTarfContent(form: TarfTermSheetForm) {
  return {
    title: "FX Structure LAB",
    subtitle: "Indicative term sheet",
    pair: form.currencyPair,
    highlights: [
      { label: "Product", value: form.productName },
      { label: "Fixings", value: form.numberOfFixings },
      { label: "Leverage", value: form.leverageFactor }
    ],
    sections: tarfTermSheetSections.map((section) => ({
      title: section.title,
      rows: section.fields.map((field) => ({
        label: field.label,
        value: form[field.key]
      }))
    })),
    riskWarning: tarfCase.riskWarning,
    disclaimer:
      "Indicative term sheet only. Not investment advice, not a binding quote, and not final legal documentation."
  };
}
