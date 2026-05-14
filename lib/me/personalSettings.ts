import type { CompanyLanguage } from "@/lib/admin/settings/companyTypes";
import { DEFAULT_PBP_THEME_ID, PBP_THEME_OPTIONS, getPbpThemeDefinition } from "@/lib/theme/themeRegistry";
import type { PbpThemeId } from "@/lib/theme/themeTypes";

export const PERSONAL_SETTINGS_STORAGE_KEY = "peacebypiece.personal.settings";
export const PERSONAL_SETTINGS_CHANGE_EVENT = "peacebypiece:personal-settings-change";

export type PersonalSettingsTheme = PbpThemeId;
export type PersonalSettingsLanguage = CompanyLanguage;
export type PersonalSettingsDensity = "comfortable" | "compact";
export type PersonalSettingsDefaultHome = "workspace" | "workorder";

export type PersonalSettingsHomeRoute = "/workspace" | "/worker";

export type PersonalSettingsDraft = {
  language: PersonalSettingsLanguage;
  theme: PersonalSettingsTheme;
  density: PersonalSettingsDensity;
  defaultHome: PersonalSettingsDefaultHome;
};

export type PersonalSettingsOption<TValue extends string> = {
  value: TValue;
};

export const DEFAULT_PERSONAL_SETTINGS: PersonalSettingsDraft = {
  language: "ko",
  theme: DEFAULT_PBP_THEME_ID,
  density: "comfortable",
  defaultHome: "workspace",
};

export const PERSONAL_LANGUAGE_OPTIONS: PersonalSettingsOption<PersonalSettingsLanguage>[] = [
  { value: "ko" },
  { value: "en" },
];

export const PERSONAL_THEME_OPTIONS: PersonalSettingsOption<PersonalSettingsTheme>[] = PBP_THEME_OPTIONS.map((option) => ({
  value: option.id,
}));

export const PERSONAL_DENSITY_OPTIONS: PersonalSettingsOption<PersonalSettingsDensity>[] = [
  { value: "comfortable" },
  { value: "compact" },
];

export const PERSONAL_DEFAULT_HOME_OPTIONS: PersonalSettingsOption<PersonalSettingsDefaultHome>[] = [
  { value: "workspace" },
  { value: "workorder" },
];

function isPersonalLanguage(value: unknown): value is PersonalSettingsLanguage {
  return value === "ko" || value === "en";
}

function isLegacyPersonalTheme(value: unknown): value is "blue" | "emerald" | "violet" | "stone" {
  return value === "blue" || value === "emerald" || value === "violet" || value === "stone";
}

function migrateLegacyPersonalTheme(value: "blue" | "emerald" | "violet" | "stone"): PersonalSettingsTheme {
  return value === "stone" ? "beige-atelier" : DEFAULT_PBP_THEME_ID;
}

function isPersonalTheme(value: unknown): value is PersonalSettingsTheme {
  if (typeof value !== "string") return false;
  return getPbpThemeDefinition(value as PersonalSettingsTheme).id === value;
}

function normalizePersonalTheme(value: unknown): PersonalSettingsTheme {
  if (isPersonalTheme(value)) return value;
  if (isLegacyPersonalTheme(value)) return migrateLegacyPersonalTheme(value);
  return DEFAULT_PERSONAL_SETTINGS.theme;
}

function isPersonalDensity(value: unknown): value is PersonalSettingsDensity {
  return value === "comfortable" || value === "compact";
}

function isPersonalDefaultHome(value: unknown): value is PersonalSettingsDefaultHome {
  return value === "workspace" || value === "workorder";
}

export function normalizePersonalSettings(value: unknown): PersonalSettingsDraft {
  const source = typeof value === "object" && value !== null ? value as Partial<Record<keyof PersonalSettingsDraft, unknown>> : {};

  return {
    language: isPersonalLanguage(source.language) ? source.language : DEFAULT_PERSONAL_SETTINGS.language,
    theme: normalizePersonalTheme(source.theme),
    density: isPersonalDensity(source.density) ? source.density : DEFAULT_PERSONAL_SETTINGS.density,
    defaultHome: isPersonalDefaultHome(source.defaultHome) ? source.defaultHome : DEFAULT_PERSONAL_SETTINGS.defaultHome,
  };
}

export function readStoredPersonalSettings(storage: Storage | null | undefined): PersonalSettingsDraft {
  if (!storage) return DEFAULT_PERSONAL_SETTINGS;

  try {
    const rawValue = storage.getItem(PERSONAL_SETTINGS_STORAGE_KEY);
    if (!rawValue) return DEFAULT_PERSONAL_SETTINGS;
    return normalizePersonalSettings(JSON.parse(rawValue));
  } catch {
    return DEFAULT_PERSONAL_SETTINGS;
  }
}

export function resolvePersonalSettingsHomeRoute(defaultHome: PersonalSettingsDefaultHome): PersonalSettingsHomeRoute {
  return defaultHome === "workorder" ? "/worker" : "/workspace";
}

export function applyPersonalSettingsToDocument(settings: PersonalSettingsDraft, documentElement: HTMLElement | null | undefined) {
  if (!documentElement) return;
  documentElement.lang = settings.language;
  documentElement.dataset.density = settings.density;
  documentElement.dataset.personalTheme = settings.theme;
  documentElement.dataset.pbpPersonalTheme = settings.theme;
}

export function writeStoredPersonalSettings(storage: Storage | null | undefined, settings: PersonalSettingsDraft): PersonalSettingsDraft {
  const normalizedSettings = normalizePersonalSettings(settings);
  if (storage) {
    storage.setItem(PERSONAL_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
  }
  dispatchPersonalSettingsChange(normalizedSettings);
  return normalizedSettings;
}

export function resetStoredPersonalSettings(storage: Storage | null | undefined): PersonalSettingsDraft {
  if (storage) {
    storage.removeItem(PERSONAL_SETTINGS_STORAGE_KEY);
  }
  dispatchPersonalSettingsChange(DEFAULT_PERSONAL_SETTINGS);
  return DEFAULT_PERSONAL_SETTINGS;
}

export function dispatchPersonalSettingsChange(settings: PersonalSettingsDraft) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PERSONAL_SETTINGS_CHANGE_EVENT, { detail: { settings } }));
}
