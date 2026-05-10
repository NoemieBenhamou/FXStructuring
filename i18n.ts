export const locales = ["en", "de", "fr", "it", "es", "pt", "zh-CN", "ja", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  es: "Español",
  pt: "Português",
  "zh-CN": "中文",
  ja: "日本語",
  ar: "العربية"
};

export const rtlLocales: Locale[] = ["ar"];
