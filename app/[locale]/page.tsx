import { getTranslations } from "next-intl/server";
import { HeroPreview } from "@/components/home/hero-preview";
import { PageHeader } from "@/components/common/page-header";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("eyebrow")} title={t("headline")} description={t("description")} />
      <HeroPreview />
    </div>
  );
}
