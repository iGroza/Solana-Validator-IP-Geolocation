// Minimal, SSR-safe i18n. Provides a LocaleProvider and a useI18n() hook.
// useI18n() is safe to call outside a provider (falls back to defaults).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, dict, type Locale } from "./dict";

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a key; falls back to EN then to the key itself. */
  t: (key: string, fallback?: string) => string;
}

function translate(locale: Locale, key: string, fallback?: string): string {
  const table = dict[locale] ?? dict[DEFAULT_LOCALE];
  if (table && key in table) return table[key];
  const en = dict[DEFAULT_LOCALE];
  if (en && key in en) return en[key];
  return fallback ?? key;
}

// Default no-op-safe value so useI18n() works even without a provider.
const defaultValue: I18nValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, fallback) => translate(DEFAULT_LOCALE, key, fallback),
};

const I18nContext = createContext<I18nValue>(defaultValue);

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const t = useCallback(
    (key: string, fallback?: string) => translate(locale, key, fallback),
    [locale]
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

export type { Locale };
