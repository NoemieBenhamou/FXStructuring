export const structureCopy = {
  forward: {
    client: "Removes FX uncertainty for a known cashflow and locks the budget rate immediately.",
    sales: "Clear benchmark product with immediate forward comparison and simple story for treasury teams.",
    trading: "Linear delta exposure with no convexity, but mark-to-market can move materially before maturity.",
    riskControl: "Transaction certainty matters because breakage can create unwind cost if the underlying flow disappears."
  },
  vanillaOption: {
    client: "Protects the adverse move while preserving upside if the market moves favorably.",
    sales: "Strong narrative when the client values flexibility more than minimizing upfront premium.",
    trading: "Long convexity and vega exposure with clean vanilla hedgeability.",
    riskControl: "Premium affordability and hedge-accounting treatment should be assessed upfront."
  },
  riskReversal: {
    client: "Zero-cost protection with a defined worst case, financed by giving up favorable moves beyond the sold option strike.",
    sales: "Clean narrative versus the forward benchmark; useful when skew allows buying relatively cheaper optionality and selling richer optionality.",
    trading: "Vanilla-based delta, gamma and vega exposure. Smile and skew marking matter for valuation and hedging.",
    riskControl: "Suitability depends on the client understanding the sold option obligation and the loss of participation beyond the sold strike."
  },
  knockOutForward: {
    client: "Improves the contractual hedge rate, but the hedge can disappear if the barrier condition is met.",
    sales: "Attractive forward-enhancement story when the barrier is viewed as remote under the client’s market view.",
    trading: "Barrier risk, gap risk and vega sensitivity. Hedgeability depends on liquidity and barrier proximity.",
    riskControl: "Should not usually be the only hedge for critical cashflows because protection may terminate."
  },
  tarf: {
    client: "Potentially achieves a better-than-forward rate with zero upfront premium while the target has not been reached.",
    sales: "Appealing carry-enhancement narrative for recurring cashflows.",
    trading: "Path-dependent exposure with leverage, unwind sensitivity, and changing Greeks over fixings.",
    riskControl: "Cashflow integrity is critical. If receivables or payables disappear, the hedge can become a speculative obligation."
  },
  basketOption: {
    client: "Addresses diversified currency baskets when the objective is portfolio-level risk reduction instead of single-pair perfection.",
    sales: "Efficient way to frame a broader hedge conversation for global portfolios and multi-market revenue streams.",
    trading: "Correlation assumptions and cross-gamma matter alongside spot and volatility.",
    riskControl: "Model transparency and basis risk must be highlighted because the basket is not a perfect hedge for each leg."
  },
  dealContingentForward: {
    client: "Provides FX protection only if the underlying transaction closes, reducing unwanted hedge breakage risk.",
    sales: "Useful for cross-border M&A where the exposure is conditional on deal completion.",
    trading: "Pricing depends on vanilla forward economics, option time value, and deal-risk assessment.",
    riskControl: "Requires clear documentation of deal contingency, long-stop date, and settlement mechanics."
  }
} as const;
