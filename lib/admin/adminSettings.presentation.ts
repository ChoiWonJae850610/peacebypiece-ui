import type {
  CompanyLanguage,
  CompanySettings,
  CompanySettingsUpdateInput,
  CompanyThemeColor,
} from "@/lib/admin/companySettings.types";

export type AdminSettingSaveState = "idle" | "saving" | "saved" | "error";

export type AdminThemeOption = {
  label: string;
  value: CompanyThemeColor;
  swatchClassName: string;
  description: string;
};

export type AdminLanguageOption = {
  label: string;
  value: CompanyLanguage;
};

export const ADMIN_THEME_OPTIONS: AdminThemeOption[] = [
  { label: "Blue", value: "blue", swatchClassName: "bg-blue-500", description: "기본 관리자 색상" },
  { label: "Emerald", value: "emerald", swatchClassName: "bg-emerald-500", description: "차분한 운영 색상" },
  { label: "Violet", value: "violet", swatchClassName: "bg-violet-500", description: "브랜드 강조 색상" },
  { label: "Stone", value: "stone", swatchClassName: "bg-stone-500", description: "무채색 운영 색상" },
];

export const ADMIN_LANGUAGE_OPTIONS: AdminLanguageOption[] = [
  { label: "한국어", value: "ko" },
  { label: "English", value: "en" },
];

export const ADMIN_RETENTION_DAY_OPTIONS = [1, 5, 15, 30] as const;

export function getAdminSettingsSaveLabel(saveState: AdminSettingSaveState): string {
  if (saveState === "saving") return "저장 중";
  if (saveState === "saved") return "저장됨";
  if (saveState === "error") return "다시 저장";
  return "설정 저장";
}

export function buildCompanySettingsUpdateInput(settings: CompanySettings): CompanySettingsUpdateInput {
  return {
    ui: settings.ui,
    filePolicy: settings.filePolicy,
    notificationPolicy: settings.notificationPolicy,
  };
}

export function getAdminSettingsUpdatedAtLabel(updatedAt?: string | null): string | null {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return null;
  return `최근 저장 ${date.toLocaleString("ko-KR")}`;
}
