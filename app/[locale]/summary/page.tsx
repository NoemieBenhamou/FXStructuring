import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/page-header";
import { ClientSummary } from "@/components/summary/client-summary";

export default async function SummaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("summary");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
      <ClientSummary locale={locale} />
    </div>
  );
}
