import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { locales, rtlLocales } from "@/i18n";
import fallbackMessages from "@/messages/en.json";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const intlMessages = await getMessages();
  const disclaimer =
    (intlMessages as { app?: { disclaimer?: string } }).app?.disclaimer ?? fallbackMessages.app.disclaimer;

  return (
    <div lang={locale} dir={rtlLocales.includes(locale as "ar") ? "rtl" : "ltr"}>
      <NextIntlClientProvider messages={intlMessages}>
        <AppShell disclaimer={disclaimer}>
          {children}
        </AppShell>
      </NextIntlClientProvider>
    </div>
  );
}
