import type { CompanyLanguage, CompanyThemeColor } from "@/lib/admin/settings/companyTypes";

export const PERSONAL_SETTINGS_STORAGE_KEY = "peacebypiece.personal.settings";
export const PERSONAL_SETTINGS_CHANGE_EVENT = "peacebypiece:personal-settings-change";

export type PersonalSettingsTheme = CompanyThemeColor;
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
  theme: "blue",
  density: "comfortable",
  defaultHome: "workspace",
};

export const PERSONAL_LANGUAGE_OPTIONS: PersonalSettingsOption<PersonalSettingsLanguage>[] = [
  { value: "ko" },
  { value: "en" },
];

export const PERSONAL_THEME_OPTIONS: PersonalSettingsOption<PersonalSettingsTheme>[] = [
  { value: "blue" },
  { value: "emerald" },
  { value: "violet" },
  { value: "stone" },
];

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

function isPersonalTheme(value: unknown): value is PersonalSettingsTheme {
  return value === "blue" || value === "emerald" || value === "violet" || value === "stone";
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
    theme: isPersonalTheme(source.theme) ? source.theme : DEFAULT_PERSONAL_SETTINGS.theme,
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
}

export function writeStoredPersonalSettings(storage: Storage | null | undefined, settings: PersonalSettingsDraft): PersonalSettingsDraft {
  const normalizedSettings = normalizePersonalSettings(settings);
  if (storage) {
    storage.setItem(PERSONAL_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
  }
  return normalizedSettings;
}

export function resetStoredPersonalSettings(storage: Storage | null | undefined): PersonalSettingsDraft {
  if (storage) {
    storage.removeItem(PERSONAL_SETTINGS_STORAGE_KEY);
  }
  return DEFAULT_PERSONAL_SETTINGS;
}
