import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/page-header";
import { MaStudio } from "@/components/ma/ma-studio";

export default async function MaPage() {
  const t = await getTranslations("ma");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Conditional hedging" title={t("title")} description={t("subtitle")} badge="Breakage control" />
      <MaStudio />
    </div>
  );
}
