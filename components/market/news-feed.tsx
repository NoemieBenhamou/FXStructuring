"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type FxNewsArticle, fetchFxNews } from "@/lib/api/client";
import { CURRENCY_FILTERS } from "@/lib/constants";

export function NewsFeed({
  currency = "FX",
  compact = false,
  showFilters = false
}: {
  currency?: string;
  compact?: boolean;
  showFilters?: boolean;
}) {
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [articles, setArticles] = useState<FxNewsArticle[]>([]);
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(null);
  const [mode, setMode] = useState("demo");
  const [source, setSource] = useState("Static demo news");
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  useEffect(() => {
    let active = true;

    async function load() {
      const json = await fetchFxNews(selectedCurrency);

      if (!active) return;

      setArticles(json.articles);
      setMode(json.mode);
      setRefreshedAt(json.refreshedAt);
      setSource(json.source);
      setSelectedArticleUrl((current) => {
        if (json.articles.length === 0) return null;
        const existing = current ? json.articles.find((article) => article.url === current) : null;
        return existing?.url ?? json.articles[0].url;
      });
    }

    void load();

    return () => {
      active = false;
    };
  }, [selectedCurrency]);

  const visibleArticles = useMemo(() => articles.slice(0, compact ? 3 : 10), [articles, compact]);
  const selectedArticle = useMemo(() => {
    if (visibleArticles.length === 0) return null;
    return visibleArticles.find((article) => article.url === selectedArticleUrl) ?? visibleArticles[0];
  }, [selectedArticleUrl, visibleArticles]);

  return (
    <Card className="h-full rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Market Pulse</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={mode === "live" ? "green" : "blue"}>{mode}</Badge>
            <Badge variant="default">{source}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showFilters ? (
          <div className="flex flex-wrap gap-2">
            {CURRENCY_FILTERS.map((filter) => (
              <Button
                key={filter}
                variant="secondary"
                className={selectedCurrency === filter ? "border-bank-gold text-bank-gold" : ""}
                onClick={() => setSelectedCurrency(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
        ) : null}
        {refreshedAt ? (
          <div className="text-xs uppercase tracking-[0.18em] text-bank-muted">
            Refreshed {formatDistanceToNowStrict(new Date(refreshedAt), { addSuffix: true })}
          </div>
        ) : null}
        <div className={compact ? "space-y-3" : "grid gap-4 xl:grid-cols-[0.95fr_1.05fr]"}>
          <div className="space-y-3">
            {visibleArticles.map((article) => {
              const isSelected = article.url === selectedArticle?.url;

              return (
                <button
                  key={`${article.title}-${article.publishedAt}`}
                  type="button"
                  onClick={() => setSelectedArticleUrl(article.url)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-bank-gold bg-bank-bgAlt text-bank-text shadow-[0_0_0_1px_rgba(200,164,93,0.22)]"
                      : "border-bank-border bg-bank-bgAlt/50 text-bank-text hover:border-bank-cyan/50 hover:bg-bank-bgAlt/70"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{article.source}</Badge>
                    {article.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="gold">{tag}</Badge>
                    ))}
                  </div>
                  <div className="mt-3 text-sm leading-6">{article.title}</div>
                  <div className="mt-2 text-xs text-bank-muted">
                    {new Date(article.publishedAt).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedArticle ? (
            <div className="rounded-2xl border border-bank-border bg-bank-bgAlt/60 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{selectedArticle.source}</Badge>
                {selectedArticle.tags.map((tag) => (
                  <Badge key={tag} variant="gold">{tag}</Badge>
                ))}
              </div>
              <div className="mt-3 text-lg font-semibold leading-7 text-bank-text">{selectedArticle.title}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-bank-muted">
                {new Date(selectedArticle.publishedAt).toLocaleString()}
              </div>
              <div className="mt-4 text-sm leading-7 text-bank-muted">
                {selectedArticle.summary?.trim()
                  ? selectedArticle.summary
                  : "Select a headline to focus on it here, then open the original article when you want the full source story."}
              </div>
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-bank-cyan transition hover:text-bank-text"
              >
                <span>Open original article</span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
