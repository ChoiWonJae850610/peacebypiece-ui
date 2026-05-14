"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, getI18n, type Locale } from "@/lib/i18n";
import {
  PERSONAL_SETTINGS_CHANGE_EVENT,
  PERSONAL_SETTINGS_STORAGE_KEY,
  readStoredPersonalSettings,
} from "@/lib/me/personalSettings";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  i18n: ReturnType<typeof getI18n>;
};

const I18nContext = createContext<I18nContextValue | null>(null);
export const I18N_LOCALE_STORAGE_KEY = "peacebypiece.admin.locale";

type I18nProviderProps = {
  children: ReactNode;
  initialLocale?: Locale;
};
function isSupportedLocale(value: unknown): value is Locale {
  return value === "ko" || value === "en";
}

function resolveStoredLocale(storage: Storage | null | undefined, fallbackLocale: Locale): Locale {
  if (!storage) return fallbackLocale;

  const hasPersonalSettings = storage.getItem(PERSONAL_SETTINGS_STORAGE_KEY) !== null;
  if (hasPersonalSettings) {
    const personalSettingsLocale = readStoredPersonalSettings(storage).language;
    return isSupportedLocale(personalSettingsLocale) ? personalSettingsLocale : fallbackLocale;
  }

  const legacyLocale = storage.getItem(I18N_LOCALE_STORAGE_KEY);
  return isSupportedLocale(legacyLocale) ? legacyLocale : fallbackLocale;
}

type PersonalSettingsLanguageChangeEvent = CustomEvent<{
  settings?: {
    language?: unknown;
  };
}>;


export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const syncLocale = (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      document.documentElement.lang = nextLocale;
    };

    syncLocale(resolveStoredLocale(window.localStorage, initialLocale));

    const handlePersonalSettingsChange = (event: Event) => {
      const nextLocale = (event as PersonalSettingsLanguageChangeEvent).detail?.settings?.language;
      if (isSupportedLocale(nextLocale)) {
        syncLocale(nextLocale);
        window.localStorage.setItem(I18N_LOCALE_STORAGE_KEY, nextLocale);
        return;
      }
      syncLocale(resolveStoredLocale(window.localStorage, initialLocale));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PERSONAL_SETTINGS_STORAGE_KEY && event.key !== I18N_LOCALE_STORAGE_KEY) return;
      syncLocale(resolveStoredLocale(window.localStorage, initialLocale));
    };

    window.addEventListener(PERSONAL_SETTINGS_CHANGE_EVENT, handlePersonalSettingsChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(PERSONAL_SETTINGS_CHANGE_EVENT, handlePersonalSettingsChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [initialLocale]);

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
