import {
  ADMIN_LANGUAGE_OPTIONS,
  ADMIN_THEME_OPTIONS,
  getAdminSettingsUpdatedAtLabel,
  type AdminLanguageOption,
  type AdminThemeOption,
} from "@/lib/admin/settings/presentation";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";

export type AdminSettingsDateLabels = {
  joinedAt: string;
  age: string;
  updatedAt: string;
};

export type AdminSettingsDateText = {
  joinedPending: string;
  updatedPending: string;
  updatedPrefix: string;
};

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function getSelectedAdminTheme(settings: CompanySettings): AdminThemeOption {
  return ADMIN_THEME_OPTIONS.find((option) => option.value === settings.ui.themeColor) ?? ADMIN_THEME_OPTIONS[0];
}

export function getSelectedAdminLanguage(settings: CompanySettings): AdminLanguageOption {
  return ADMIN_LANGUAGE_OPTIONS.find((option) => option.value === settings.ui.language) ?? ADMIN_LANGUAGE_OPTIONS[0];
}

export function getAdminSettingsDateLabels(
  updatedAt: string | null | undefined,
  text: AdminSettingsDateText,
  now: Date = new Date(),
): AdminSettingsDateLabels {
  if (!updatedAt) return { joinedAt: text.joinedPending, age: "D+0", updatedAt: text.updatedPending };

  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return { joinedAt: text.joinedPending, age: "D+0", updatedAt: text.updatedPending };

  const start = new Date(parsed);
  start.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const ageDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const joinedAt = `${parsed.getFullYear()}.${padDatePart(parsed.getMonth() + 1)}.${padDatePart(parsed.getDate())}`;
  const updatedLabel = getAdminSettingsUpdatedAtLabel(updatedAt)?.replace("최근 저장 ", text.updatedPrefix) ?? text.updatedPending;

  return {
    joinedAt,
    age: `D+${ageDays}`,
    updatedAt: updatedLabel,
  };
}

export function withAdminSettingsUiDraft(settings: CompanySettings, ui: Partial<CompanySettings["ui"]>): CompanySettings {
  return {
    ...settings,
    ui: {
      ...settings.ui,
      ...ui,
    },
  };
}
