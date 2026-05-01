import type {
  CompanyFilePolicySettings,
  CompanyLanguage,
  CompanySettings,
  CompanySettingsUpdateInput,
  CompanyThemeColor,
} from "@/lib/admin/settings/companyTypes";

export type AdminSettingSaveState = "idle" | "saving" | "saved" | "error";
export type AdminStorageStatusTone = "normal" | "caution" | "danger";

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

export type AdminStorageStatusPreview = {
  tone: AdminStorageStatusTone;
  label: string;
  description: string;
};

export type AdminStorageThresholdPolicy = {
  cautionThresholdPercent: number;
  dangerThresholdPercent: number;
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

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function getAdminSettingsUpdatedAtLabel(updatedAt?: string | null): string | null {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = padDatePart(date.getUTCMonth() + 1);
  const day = padDatePart(date.getUTCDate());
  const hours = padDatePart(date.getUTCHours());
  const minutes = padDatePart(date.getUTCMinutes());

  return `최근 저장 ${year}.${month}.${day} ${hours}:${minutes}`;
}

export function normalizeAdminFilePolicyDraft(filePolicy: CompanyFilePolicySettings): CompanyFilePolicySettings {
  const retentionDays = ADMIN_RETENTION_DAY_OPTIONS.includes(filePolicy.trashRetentionDays as (typeof ADMIN_RETENTION_DAY_OPTIONS)[number])
    ? filePolicy.trashRetentionDays
    : 15;
  const storageLimitGb = Number.isFinite(filePolicy.storageLimitGb) ? Math.max(1, Math.min(999, Math.trunc(filePolicy.storageLimitGb))) : 5;
  const warningThresholdPercent = Number.isFinite(filePolicy.warningThresholdPercent)
    ? Math.max(1, Math.min(99, Math.trunc(filePolicy.warningThresholdPercent)))
    : 80;

  return {
    ...filePolicy,
    trashRetentionDays: retentionDays,
    storageLimitGb,
    warningThresholdPercent,
  };
}

export function buildAdminStorageThresholdPolicy(filePolicy: CompanyFilePolicySettings): AdminStorageThresholdPolicy {
  const cautionThresholdPercent = normalizeAdminFilePolicyDraft(filePolicy).warningThresholdPercent;
  const dangerThresholdPercent = Math.min(100, Math.max(cautionThresholdPercent + 1, cautionThresholdPercent + 10));
  return { cautionThresholdPercent, dangerThresholdPercent };
}

export function buildAdminStorageStatusPreview(filePolicy: CompanyFilePolicySettings): AdminStorageStatusPreview[] {
  const { cautionThresholdPercent, dangerThresholdPercent } = buildAdminStorageThresholdPolicy(filePolicy);
  return [
    { tone: "normal", label: "정상", description: `${cautionThresholdPercent}% 미만 사용` },
    { tone: "caution", label: "주의", description: `${cautionThresholdPercent}% 이상 ${dangerThresholdPercent}% 미만 사용` },
    { tone: "danger", label: "위험", description: `${dangerThresholdPercent}% 이상 또는 한도 초과` },
  ];
}
