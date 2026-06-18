"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { CompanyThemeColor } from "@/lib/admin/settings/companyTypes";
import { waflLegacyApiRequest } from "@/lib/api/waflApiClient";
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
    const payload = await waflLegacyApiRequest<{ settings?: { ui?: { themeColor?: unknown } } }>(
      "/api/admin/companies/current",
      { method: "GET", cache: "no-store" },
      "회사 테마를 불러오지 못했습니다.",
    );
    const theme = payload.settings?.ui?.themeColor;
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
      const loadCurrentTheme = async () => {
        const currentTheme = await fetchCurrentTheme();
        if (!currentTheme) return;
        setTheme(currentTheme);
        window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, currentTheme);
      };
      void loadCurrentTheme();
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
