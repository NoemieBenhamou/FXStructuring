import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/page-header";
import { PortfolioRiskPanel } from "@/components/portfolio/portfolio-risk-panel";

export default async function PortfolioPage() {
  const t = await getTranslations("portfolio");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} badge={t("badge")} />
      <PortfolioRiskPanel />
    </div>
  );
}
