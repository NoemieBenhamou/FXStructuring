import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/page-header";
import { ExposureTranslator } from "@/components/structuring/exposure-translator";

export default async function ExposurePage() {
  const t = await getTranslations("exposure");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Client workflow" title={t("title")} description={t("subtitle")} />
      <ExposureTranslator />
    </div>
  );
}
