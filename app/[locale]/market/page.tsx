import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/page-header";
import { MarketCockpit } from "@/components/market/market-cockpit";

export default async function MarketPage() {
  const t = await getTranslations("market");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
      <MarketCockpit />
    </div>
  );
}
