import { getTranslations } from "next-intl/server";
import { HeroPreview } from "@/components/home/hero-preview";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const t = await getTranslations("home");

  const cards = [
    { title: "Market Cockpit", body: t("marketCard") },
    { title: "Structure Recommender", body: t("structureCard") },
    { title: "Payoff Lab", body: t("payoffCard") },
    { title: "Multilingual Client Summary", body: t("summaryCard") }
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("eyebrow")} title={t("headline")} description={t("description")} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="rounded-3xl">
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="text-base font-semibold text-bank-text">{card.title}</div>
              <div className="text-sm leading-6 text-bank-muted sm:leading-7">{card.body}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <HeroPreview />
    </div>
  );
}
