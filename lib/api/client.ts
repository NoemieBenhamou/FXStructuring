export type FxSeriesPoint = {
  date: string;
  close: number;
};

export type FxVolPoint = {
  date: string;
  rv20: number;
  rv60: number;
};

export type MarketSnapshot = {
  pair: string;
  spot: number;
  oneDayMove: number;
  oneMonthMove: number;
  threeMonthMove: number;
  rv20: number;
  rv60: number;
  high252: number;
  low252: number;
  drawdownFromHigh: number;
  regime: string;
  lastDate: string;
  series: FxSeriesPoint[];
  volSeries: FxVolPoint[];
};

export type MarketDataResponse = {
  mode: "demo" | "live" | "hybrid";
  pair: string;
  source: string;
  status: string;
  timestamp: string;
  snapshot: MarketSnapshot;
};

export type MarketRange = "1M" | "3M" | "6M" | "1Y" | "2Y" | "CUSTOM";

export type FxNewsArticle = {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  tags: string[];
  summary?: string;
};

export type FxNewsResponse = {
  mode: "demo" | "live";
  source: string;
  refreshedAt: string;
  articles: FxNewsArticle[];
};

export type MarketTickerItem = {
  symbol: string;
  label: string;
  group: "Index" | "Commodity" | "Rates";
  price: number;
  changePercent: number;
  currency?: string;
};

export type MarketTickerResponse = {
  mode: "demo" | "live";
  source: string;
  refreshedAt: string;
  items: MarketTickerItem[];
};

export async function fetchMarketData(pair: string, options?: { range?: MarketRange; startDate?: string; endDate?: string }) {
  const params = new URLSearchParams({ pair });
  if (options?.range) params.set("range", options.range);
  if (options?.startDate) params.set("startDate", options.startDate);
  if (options?.endDate) params.set("endDate", options.endDate);

  const response = await fetch(`/api/fx/market?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch market data");
  return response.json() as Promise<MarketDataResponse>;
}

export async function fetchLiveFx(pair: string) {
  const response = await fetch(`/api/fx/live?pair=${encodeURIComponent(pair)}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch live FX data");
  return response.json();
}

export async function fetchFxNews(currency: string) {
  const response = await fetch(`/api/news/fx?currency=${encodeURIComponent(currency)}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch FX news");
  return response.json() as Promise<FxNewsResponse>;
}

export async function fetchMarketTicker() {
  const response = await fetch("/api/market/ticker", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch market ticker");
  return response.json() as Promise<MarketTickerResponse>;
}
