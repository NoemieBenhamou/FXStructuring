import majorFxDaily from "@/data/fx/major-fx-daily.json";

export type FxSeriesPoint = {
  date: string;
  close: number;
};

type FxHistoryData = {
  generatedAt: string;
  pairs: Record<string, FxSeriesPoint[]>;
};

const marketData = majorFxDaily as FxHistoryData;

function dailyReturns(series: FxSeriesPoint[]) {
  return series.slice(1).map((point, index) => Math.log(point.close / series[index].close));
}

function stdDev(values: number[]) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function classifyMarketRegime(input: {
  spot: number;
  high252: number;
  low252: number;
  rv20: number;
  rv60: number;
}) {
  const { spot, high252, low252, rv20, rv60 } = input;
  if (rv20 > rv60 * 1.35) return "Realized volatility accelerating";
  if (rv20 < rv60 * 0.75) return "Realized volatility compressing";
  if (spot > high252 * 0.98) return "Near one-year high";
  if (spot < low252 * 1.02) return "Near one-year low";
  return "Range-bound / neutral";
}

export function getAvailablePairs() {
  return Object.keys(marketData.pairs);
}

export function hasPairSeries(pair: string) {
  return pair in marketData.pairs;
}

export function getPairSeries(pair: string) {
  return marketData.pairs[pair] ?? marketData.pairs.EURUSD;
}

export function computeRealizedVol(series: FxSeriesPoint[], lookback: number) {
  const returns = dailyReturns(series).slice(-lookback);
  return stdDev(returns) * Math.sqrt(252) * 100;
}

export function computePairSnapshotFromSeries(pair: string, series: FxSeriesPoint[]) {
  const closes = series.map((point) => point.close);
  const last = closes.at(-1) ?? 0;
  const previous = closes.at(-2) ?? last;
  const oneMonth = closes.at(-22) ?? closes[0];
  const threeMonth = closes.at(-64) ?? closes[0];
  const high252 = Math.max(...closes.slice(-252));
  const low252 = Math.min(...closes.slice(-252));
  const rv20 = computeRealizedVol(series, 20);
  const rv60 = computeRealizedVol(series, 60);

  return {
    pair,
    spot: last,
    oneDayMove: ((last / previous) - 1) * 100,
    oneMonthMove: ((last / oneMonth) - 1) * 100,
    threeMonthMove: ((last / threeMonth) - 1) * 100,
    rv20,
    rv60,
    high252,
    low252,
    drawdownFromHigh: ((last / high252) - 1) * 100,
    regime: classifyMarketRegime({ spot: last, high252, low252, rv20, rv60 }),
    lastDate: series.at(-1)?.date ?? "",
    series,
    volSeries: series.map((point, index) => ({
      date: point.date,
      rv20: index >= 20 ? computeRealizedVol(series.slice(0, index + 1), 20) : 0,
      rv60: index >= 60 ? computeRealizedVol(series.slice(0, index + 1), 60) : 0
    }))
  };
}

export function computePairSnapshot(pair: string) {
  return computePairSnapshotFromSeries(pair, getPairSeries(pair));
}

export function getMarketOverview() {
  return getAvailablePairs().slice(0, 10).map((pair) => computePairSnapshot(pair));
}
