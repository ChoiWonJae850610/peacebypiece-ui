"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { CompanyThemeColor } from "@/lib/admin/settings/companyTypes";
import {
  ADMIN_THEME_CHANGE_EVENT,
  ADMIN_THEME_STORAGE_KEY,
  DEFAULT_ADMIN_THEME,
  isCompanyThemeColor,
  resolveAdminThemeTokens,
} from "@/lib/admin/theme";

type AdminThemeScopeProps = {
  children: ReactNode;
  initialTheme?: CompanyThemeColor;
};

type ThemeEvent = CustomEvent<{ theme?: unknown }>;

async function fetchCurrentTheme(): Promise<CompanyThemeColor | null> {
  try {
    const response = await fetch("/api/admin/companies/current", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { settings?: { ui?: { themeColor?: unknown } } } | null;
    const theme = payload?.settings?.ui?.themeColor;
    return isCompanyThemeColor(theme) ? theme : null;
  } catch {
    return null;
  }
}

export default function AdminThemeScope({ children, initialTheme = DEFAULT_ADMIN_THEME }: AdminThemeScopeProps) {
  const [theme, setTheme] = useState<CompanyThemeColor>(initialTheme);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    const hasStoredTheme = isCompanyThemeColor(storedTheme);
    if (hasStoredTheme) {
      setTheme(storedTheme);
    } else {
      void fetchCurrentTheme().then((currentTheme) => {
        if (!currentTheme) return;
        setTheme(currentTheme);
        window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, currentTheme);
      });
    }

    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as ThemeEvent).detail?.theme;
      if (isCompanyThemeColor(nextTheme)) {
        setTheme(nextTheme);
        window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ADMIN_THEME_STORAGE_KEY) return;
      if (isCompanyThemeColor(event.newValue)) setTheme(event.newValue);
    };

    window.addEventListener(ADMIN_THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(ADMIN_THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const tokens = resolveAdminThemeTokens(theme);
  const style = useMemo(
    () => ({
      "--admin-theme-surface": tokens.surface,
      "--admin-theme-surface-hover": tokens.surfaceHover,
      "--admin-theme-soft": tokens.soft,
      "--admin-theme-soft-text": tokens.softText,
      "--admin-theme-border": tokens.border,
      "--admin-theme-ring": tokens.ring,
      "--admin-theme-text-on-surface": tokens.textOnSurface,
      "--admin-theme-muted-on-surface": tokens.mutedOnSurface,
    }) as CSSProperties,
    [tokens],
  );

  return (
    <div data-admin-theme={theme} style={style} className="h-full">
      {children}
    </div>
  );
}
