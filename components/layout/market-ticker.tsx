"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMarketTicker, type MarketTickerItem } from "@/lib/api/client";

function formatTickerPrice(item: MarketTickerItem) {
  if (item.label.includes("Yield")) return `${item.price.toFixed(2)}%`;
  if (item.price >= 1000) return item.price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return item.price.toFixed(2);
}

function formatTickerMove(changePercent: number) {
  return `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
}

export function MarketTicker() {
  const [items, setItems] = useState<MarketTickerItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadTicker() {
      try {
        const response = await fetchMarketTicker();
        if (active) {
          setItems(response.items);
        }
      } catch {
        if (active) {
          setItems([]);
        }
      }
    }

    void loadTicker();
    const interval = window.setInterval(() => {
      void loadTicker();
    }, 300000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const tickerItems = useMemo(() => (items.length > 0 ? [...items, ...items] : []), [items]);

  if (tickerItems.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-bank-border/70 bg-bank-bgAlt/70 px-3 py-2 sm:px-6 lg:px-8">
      <div className="ticker-mask">
        <div className="ticker-track">
          {tickerItems.map((item, index) => (
            <div key={`${item.symbol}-${index}`} className="inline-flex items-center gap-3 rounded-full border border-bank-border/60 bg-bank-bg/55 px-3 py-1 text-xs whitespace-nowrap">
              <span className="uppercase tracking-[0.18em] text-bank-gold">{item.label}</span>
              <span className="font-medium text-bank-text">{formatTickerPrice(item)}</span>
              <span className={item.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}>{formatTickerMove(item.changePercent)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-bank-muted">
        Refresh every 5 mn • 15 mn delay
      </div>
    </div>
  );
}
