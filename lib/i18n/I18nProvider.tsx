"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, getI18n, type Locale } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  i18n: ReturnType<typeof getI18n>;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const I18N_LOCALE_STORAGE_KEY = "peacebypiece.admin.locale";

type I18nProviderProps = {
  children: ReactNode;
  initialLocale?: Locale;
};

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(I18N_LOCALE_STORAGE_KEY) as Locale | null;
    if (storedLocale === "ko" || storedLocale === "en") {
      setLocaleState(storedLocale);
    }
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(I18N_LOCALE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, i18n: getI18n(locale) }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
