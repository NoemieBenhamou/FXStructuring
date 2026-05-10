"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales } from "@/i18n";
import { Select } from "@/components/ui/select";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      aria-label="Select language"
      className="min-w-32"
      value={locale}
      onChange={(event) => {
        router.replace(pathname, { locale: event.target.value });
      }}
    >
      {locales.map((item) => (
        <option key={item} value={item}>
          {localeLabels[item]}
        </option>
      ))}
    </Select>
  );
}
