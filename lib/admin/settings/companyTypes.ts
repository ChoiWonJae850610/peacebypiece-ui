export type CompanyThemeColor = "blue" | "emerald" | "violet" | "stone";
export type CompanyLanguage = "ko" | "en";

export type CompanyFilePolicySettings = {
  softDeleteEnabled: boolean;
  includeTrashInUsage: boolean;
  trashRetentionDays: number;
  storageLimitGb: number;
  warningThresholdPercent: number;
};

export type CompanyNotificationPolicySettings = {
  reviewRequestEnabled: boolean;
  orderReadyEnabled: boolean;
  storageWarningEnabled: boolean;
  purgeResultEnabled: boolean;
};

export type CompanyUiSettings = {
  themeColor: CompanyThemeColor;
  language: CompanyLanguage;
  compactMode: boolean;
};

export type CompanySettings = {
  companyId: string;
  ui: CompanyUiSettings;
  filePolicy: CompanyFilePolicySettings;
  notificationPolicy: CompanyNotificationPolicySettings;
  updatedAt?: string | null;
};

export type CompanySettingsUpdateInput = {
  ui?: Partial<CompanyUiSettings>;
  filePolicy?: Partial<CompanyFilePolicySettings>;
  notificationPolicy?: Partial<CompanyNotificationPolicySettings>;
};

export type AdminCompanySummary = {
  id: string;
  name: string;
  memo?: string | null;
  isActive: boolean;
};
