import demoNews from "@/data/news/fx-news-demo.json";
import type { MarketRange } from "@/lib/api/client";
import { CURRENCY_FILTERS, formatFxPair, normalizeFxPair } from "@/lib/constants";
import { computePairSnapshotFromSeries, getPairSeries, hasPairSeries, type FxSeriesPoint } from "@/lib/market";

type GNewsArticle = {
  title?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  source?: { name?: string };
};

const DAY_SECONDS = 24 * 60 * 60;
const RANGE_DAYS: Record<Exclude<MarketRange, "CUSTOM">, number> = {
  "1M": 31,
  "3M": 92,
  "6M": 183,
  "1Y": 366,
  "2Y": 731
};

const googleNewsQueries: Record<string, string> = {
  FX: "foreign exchange market OR currency market OR central bank FX",
  USD: "USD foreign exchange market OR dollar index OR USD rates",
  EUR: "EUR foreign exchange market OR euro currency OR ECB FX",
  GBP: "GBP foreign exchange market OR sterling FX OR Bank of England FX",
  JPY: "JPY foreign exchange market OR yen FX OR Bank of Japan FX",
  CHF: "CHF foreign exchange market OR Swiss franc FX",
  CAD: "CAD foreign exchange market OR Canadian dollar FX",
  AUD: "AUD foreign exchange market OR Australian dollar FX",
  CNY: "CNY foreign exchange market OR yuan FX OR renminbi FX",
  "EM FX": "emerging market FX OR EM currencies OR carry trade FX"
};

const CURATED_NEWS_SOURCES = [
  "Reuters",
  "Bloomberg",
  "LSEG",
  "MNI",
  "Dow Jones Newswires",
  "The Wall Street Journal",
  "WSJ",
  "FX Markets",
  "ForexLive",
  "DailyFX",
  "Investing.com"
] as const;

const CURATED_NEWS_SOURCE_MATCHERS = [
  "reuters",
  "bloomberg",
  "lseg",
  "mni",
  "dow jones",
  "wall street journal",
  "wsj",
  "fx markets",
  "forexlive",
  "dailyfx",
  "investing.com"
];

const GENERIC_NEWS_TITLE_PATTERNS = [
  /^currencies\b/i,
  /^bloomberg\b/i,
  /^global market headlines\b/i,
  /^bloomberg europe\b/i
];

const FX_RELEVANCE_MATCHERS = [
  "fx",
  "foreign exchange",
  "forex",
  "currency",
  "currencies",
  "dollar",
  "euro",
  "yen",
  "sterling",
  "franc",
  "yuan",
  "renminbi",
  "rupee",
  "rupiah",
  "real",
  "forint",
  "zloty",
  "peso",
  "won",
  "krone",
  "ruble",
  "lira",
  "rand",
  "central bank",
  "ecb",
  "boj",
  "fed",
  "snb",
  "carry trade",
  "dxy",
  "dollar index",
  "intervention"
];

function stripTags(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "");
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripTags(decodeHtml(stripTags(match[1]).trim())).trim() : "";
}

function normalizeNewsText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function matchesCuratedSource(source: string, title: string) {
  const haystack = `${source} ${title}`.toLowerCase();
  return CURATED_NEWS_SOURCE_MATCHERS.some((matcher) => haystack.includes(matcher));
}

function isRecentNewsArticle(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime();
  if (!Number.isFinite(publishedTime)) return false;
  const maxAgeMs = 45 * DAY_SECONDS * 1000;
  return Date.now() - publishedTime <= maxAgeMs;
}

function isGenericLandingPage(title: string) {
  return GENERIC_NEWS_TITLE_PATTERNS.some((pattern) => pattern.test(title));
}

function isRelevantFxArticle(title: string, summary: string) {
  const haystack = `${title} ${summary}`.toLowerCase();
  return FX_RELEVANCE_MATCHERS.some((matcher) => haystack.includes(matcher));
}

function curateArticles<T extends { title: string; source: string; publishedAt: string; url: string; summary?: string }>(articles: T[]) {
  return dedupeArticles(articles)
    .filter((article) => matchesCuratedSource(article.source, article.title))
    .filter((article) => isRecentNewsArticle(article.publishedAt))
    .filter((article) => !isGenericLandingPage(article.title))
    .filter((article) => isRelevantFxArticle(article.title, article.summary ?? ""))
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, 18);
}

function dedupeArticles<T extends { title: string; url: string }>(articles: T[]) {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = `${article.title.toLowerCase()}|${article.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildCuratedGoogleNewsQuery(currency: string) {
  const topic = googleNewsQueries[currency] ?? googleNewsQueries.FX;
  const sources = [
    "site:reuters.com",
    "site:bloomberg.com",
    "site:lseg.com",
    "site:mni.com",
    "site:wsj.com",
    "site:fx-markets.com",
    "site:forexlive.com",
    "site:dailyfx.com",
    "site:investing.com"
  ].join(" OR ");

  return `(${topic}) (${sources})`;
}

function buildYahooSymbol(pair: string) {
  return `${normalizeFxPair(pair)}=X`;
}

async function fetchYahooSeries(url: string, pair: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "FXStructuringLag/1.0" },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`Yahoo history failed for ${pair}`);
  }

  const json = await response.json() as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }>;
    };
  };

  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index]
    }))
    .filter((point): point is FxSeriesPoint & { close: number } => typeof point.close === "number")
    .map((point) => ({ date: point.date, close: point.close }));
}

async function fetchYahooHistoryForWindow(pair: string, period1: number, period2: number) {
  const symbol = buildYahooSymbol(pair);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d`;
  return fetchYahooSeries(url, pair);
}

async function fetchYahooHistory(pair: string, endDate?: string) {
  const period2 = endDate ? dateToUnix(endDate, true) : Math.floor(Date.now() / 1000);
  return fetchYahooHistoryForWindow(pair, period2 - 731 * DAY_SECONDS, period2);
}

function dateToUnix(date: string, endOfDay = false) {
  const suffix = endOfDay ? "T23:59:59.000Z" : "T00:00:00.000Z";
  return Math.floor(new Date(`${date}${suffix}`).getTime() / 1000);
}

function filterSeriesByRange(series: FxSeriesPoint[], range: MarketRange, startDate?: string, endDate?: string) {
  if (range === "CUSTOM") {
    if (!startDate || !endDate) return series;
    return series.filter((point) => point.date >= startDate && point.date <= endDate);
  }

  const days = RANGE_DAYS[range];
  return series.slice(-Math.min(series.length, days));
}

async function fetchGoogleNewsRss(currency: string) {
  const query = buildCuratedGoogleNewsQuery(currency);
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const response = await fetch(rssUrl, {
    headers: { "User-Agent": "FXStructuringLag/1.0" },
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error("Google News RSS request failed");
  }

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);

  const articles = items.map((item) => ({
    title: normalizeNewsText(extractTag(item, "title")),
    source: normalizeNewsText(extractTag(item, "source") || "Google News"),
    publishedAt: new Date(extractTag(item, "pubDate")).toISOString(),
    url: extractTag(item, "link"),
    summary: normalizeNewsText(extractTag(item, "description")),
    tags: currency === "FX" ? ["FX"] : ["FX", currency]
  }));

  return curateArticles(articles);
}

export async function getMarketData(pair: string, options?: { range?: MarketRange; startDate?: string; endDate?: string }) {
  const normalizedPair = normalizeFxPair(pair);
  const range = options?.range ?? "2Y";
  const staticSeries = hasPairSeries(normalizedPair) ? getPairSeries(normalizedPair) : null;
  let source = "Static demo history";
  let status = "Using bundled demo history.";
  let mode: "demo" | "live" | "hybrid" = "demo";
  let baseSeries = staticSeries;

  try {
    if (range === "CUSTOM" && options?.startDate && options?.endDate) {
      baseSeries = await fetchYahooHistoryForWindow(
        normalizedPair,
        dateToUnix(options.startDate),
        dateToUnix(options.endDate, true)
      );
      source = "Yahoo Finance chart API";
      status = `Loaded custom historical market data for ${formatFxPair(normalizedPair)} from Yahoo Finance.`;
      mode = "live";
    } else {
      baseSeries = await fetchYahooHistory(normalizedPair, options?.endDate);
      source = "Yahoo Finance chart API";
      status = options?.endDate
        ? `Loaded ${range} historical market data for ${formatFxPair(normalizedPair)} from Yahoo Finance as of ${options.endDate}.`
        : `Loaded ${range} historical market data for ${formatFxPair(normalizedPair)} from Yahoo Finance.`;
      mode = "live";
    }
  } catch {
    if (!baseSeries) {
      baseSeries = getPairSeries("EURUSD");
      source = "Static fallback history";
      status = `Custom cross ${formatFxPair(normalizedPair)} could not be loaded from Yahoo Finance. Showing EUR/USD fallback history.`;
      mode = "hybrid";
    } else {
      source = "Static fallback history";
      status = options?.endDate
        ? `Yahoo Finance unavailable for ${formatFxPair(normalizedPair)} as of ${options.endDate}. Using bundled ${range} demo history.`
        : `Yahoo Finance unavailable for ${formatFxPair(normalizedPair)}. Using bundled ${range} demo history.`;
      mode = "hybrid";
    }
  }

  const filteredSeries = filterSeriesByRange(baseSeries, range, options?.startDate, options?.endDate);
  const safeSeries = filteredSeries.length > 1 ? filteredSeries : baseSeries;

  return {
    mode,
    pair: normalizedPair,
    source,
    status,
    timestamp: new Date().toISOString(),
    snapshot: computePairSnapshotFromSeries(normalizedPair, safeSeries)
  };
}

export async function getLiveFxData(pair: string) {
  const normalizedPair = normalizeFxPair(pair);
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return {
      mode: "demo",
      pair: normalizedPair,
      status: "No ALPHA_VANTAGE_API_KEY configured. Using centralized fallback data layer.",
      timestamp: new Date().toISOString(),
      quote: null
    };
  }

  const from = normalizedPair.slice(0, 3);
  const to = normalizedPair.slice(3, 6);
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
  const response = await fetch(url, { next: { revalidate: 60 } });
  const json = await response.json();

  return {
    mode: "live",
    pair: normalizedPair,
    source: "Alpha Vantage",
    timestamp: new Date().toISOString(),
    raw: json
  };
}

export async function getFxNews(currency: string) {
  const normalizedCurrency = CURRENCY_FILTERS.includes(currency as (typeof CURRENCY_FILTERS)[number]) ? currency : "FX";
  const apiKey = process.env.GNEWS_API_KEY;

  if (apiKey) {
    const q = encodeURIComponent(`${normalizedCurrency} foreign exchange OR FX market`);
    const url = `https://gnews.io/api/v4/search?q=${q}&lang=en&max=18&apikey=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: 300 } });
    const json = await response.json() as { articles?: GNewsArticle[] };

    return {
      mode: "live" as const,
      source: "Curated institutional sources via GNews",
      refreshedAt: new Date().toISOString(),
      articles: curateArticles(
        (json.articles ?? []).map((article) => ({
          title: normalizeNewsText(article.title ?? "Untitled article"),
          source: normalizeNewsText(article.source?.name ?? "GNews"),
          publishedAt: article.publishedAt ?? new Date().toISOString(),
          url: article.url ?? "#",
          summary: normalizeNewsText(article.description ?? ""),
          tags: normalizedCurrency === "FX" ? ["FX"] : ["FX", normalizedCurrency]
        }))
      )
    };
  }

  try {
    const articles = await fetchGoogleNewsRss(normalizedCurrency);
    return {
      mode: "live" as const,
      source: `Curated feed: ${CURATED_NEWS_SOURCES.join(", ")}`,
      refreshedAt: new Date().toISOString(),
      articles
    };
  } catch {
    return {
      mode: "demo" as const,
      source: "Static demo news",
      refreshedAt: new Date().toISOString(),
      articles: demoNews.articles.filter((article) => article.tags.includes(normalizedCurrency) || normalizedCurrency === "FX")
    };
  }
}
