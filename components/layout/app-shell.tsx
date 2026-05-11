"use client";

import { useState } from "react";
import { Globe2, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MarketTicker } from "@/components/layout/market-ticker";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const navKeys = [
  ["home", ""],
  ["market", "/market"],
  ["exposure", "/exposure"],
  ["structures", "/structures"],
  ["payoffLab", "/payoff-lab"],
  ["portfolio", "/portfolio"],
  ["summary", "/summary"]
] as const;

export function AppShell({
  children,
  disclaimer
}: {
  children: React.ReactNode;
  disclaimer: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const appT = useTranslations("app");
  const pathname = usePathname();

  const navigation = navKeys.map(([key, href]) => ({
    key,
    href: href || "/",
    label: t(key)
  }));

  return (
    <div className="dashboard-grid min-h-screen bg-bank-grid bg-[length:44px_44px]">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-bank-border lg:bg-bank-bgAlt/90 lg:backdrop-blur">
        <div className="border-b border-bank-border px-6 py-6">
          <div className="text-xs uppercase tracking-[0.24em] text-bank-gold">{appT("name")}</div>
          <div className="mt-2 text-2xl font-semibold text-bank-text">{appT("workspace")}</div>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "block rounded-xl px-4 py-3 text-sm transition",
                  active
                    ? "bg-bank-panel text-bank-text shadow-card"
                    : "text-bank-muted hover:bg-bank-bg hover:text-bank-text"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-40 border-b border-bank-border bg-bank-bg/90 backdrop-blur lg:ml-72">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div>
              <div className="text-xs font-semibold text-bank-text sm:text-sm">{appT("name")}</div>
              <div className="hidden text-xs uppercase tracking-[0.22em] text-bank-muted sm:block">{appT("workspaceShort")}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Globe2 className="hidden h-4 w-4 text-bank-muted sm:block" />
              <LocaleSwitcher />
            </div>
          </div>
        </div>

        {open ? (
          <div className="border-t border-bank-border px-4 py-4 lg:hidden">
            <nav className="grid gap-2">
              {navigation.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm",
                      active ? "bg-bank-panel text-bank-text" : "bg-bank-bgAlt/60 text-bank-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}

        <MarketTicker />
      </header>

      <main className="px-3 py-4 sm:px-6 sm:py-6 lg:ml-72 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">{children}</div>
      </main>

      <footer className="border-t border-bank-border bg-bank-bg/90 lg:ml-72">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs leading-6 text-bank-muted sm:px-6 lg:px-8">
          {disclaimer}
        </div>
      </footer>
    </div>
  );
}
