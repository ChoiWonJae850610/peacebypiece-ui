import type { CompanyThemeColor } from "@/lib/admin/settings/companyTypes";

export const ADMIN_THEME_STORAGE_KEY = "peacebypiece.admin.theme";
export const ADMIN_THEME_CHANGE_EVENT = "peacebypiece:admin-theme-change";

export type AdminThemeTokenSet = {
  surface: string;
  surfaceHover: string;
  soft: string;
  softText: string;
  border: string;
  ring: string;
  textOnSurface: string;
  mutedOnSurface: string;
};

export const ADMIN_THEME_TOKENS: Record<CompanyThemeColor, AdminThemeTokenSet> = {
  blue: {
    surface: "#111827",
    surfaceHover: "#1f2937",
    soft: "#eff6ff",
    softText: "#1d4ed8",
    border: "#bfdbfe",
    ring: "rgba(59,130,246,0.16)",
    textOnSurface: "#ffffff",
    mutedOnSurface: "#dbeafe",
  },
  emerald: {
    surface: "#064e3b",
    surfaceHover: "#065f46",
    soft: "#ecfdf5",
    softText: "#047857",
    border: "#a7f3d0",
    ring: "rgba(16,185,129,0.16)",
    textOnSurface: "#ffffff",
    mutedOnSurface: "#d1fae5",
  },
  violet: {
    surface: "#4c1d95",
    surfaceHover: "#5b21b6",
    soft: "#f5f3ff",
    softText: "#6d28d9",
    border: "#ddd6fe",
    ring: "rgba(139,92,246,0.18)",
    textOnSurface: "#ffffff",
    mutedOnSurface: "#ede9fe",
  },
  stone: {
    surface: "#0c0a09",
    surfaceHover: "#1c1917",
    soft: "#f5f5f4",
    softText: "#57534e",
    border: "#d6d3d1",
    ring: "rgba(120,113,108,0.16)",
    textOnSurface: "#ffffff",
    mutedOnSurface: "#e7e5e4",
  },
};

export const DEFAULT_ADMIN_THEME: CompanyThemeColor = "blue";

export function isCompanyThemeColor(value: unknown): value is CompanyThemeColor {
  return value === "blue" || value === "emerald" || value === "violet" || value === "stone";
}

export function resolveAdminThemeTokens(theme: CompanyThemeColor): AdminThemeTokenSet {
  return ADMIN_THEME_TOKENS[theme] ?? ADMIN_THEME_TOKENS[DEFAULT_ADMIN_THEME];
}

export function persistAdminTheme(theme: CompanyThemeColor) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent(ADMIN_THEME_CHANGE_EVENT, { detail: { theme } }));
}
