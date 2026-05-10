import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/page-header";
import { StructureWorkbench } from "@/components/structuring/structure-workbench";

export default async function StructuresPage() {
  const t = await getTranslations("structures");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Recommendation engine" title={t("title")} description={t("subtitle")} badge={t("whyThisTrades")} />
      <StructureWorkbench />
    </div>
  );
}
