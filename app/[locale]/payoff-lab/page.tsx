import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/common/page-header";
import { OptionCalculator } from "@/components/payoff-lab/option-calculator";

export default async function PayoffLabPage() {
  const t = await getTranslations("payoff");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Quant workflow" title={t("title")} description={t("subtitle")} badge="Garman-Kohlhagen" />
      <OptionCalculator />
    </div>
  );
}
