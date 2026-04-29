import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyId: WORKSPACE_COMPANY_ID,
  ui: {
    themeColor: "blue",
    language: "ko",
    compactMode: false,
  },
  filePolicy: {
    softDeleteEnabled: true,
    includeTrashInUsage: true,
    trashRetentionDays: 15,
    storageLimitGb: 5,
    warningThresholdPercent: 80,
  },
  notificationPolicy: {
    reviewRequestEnabled: true,
    orderReadyEnabled: true,
    storageWarningEnabled: true,
    purgeResultEnabled: true,
  },
};

export function buildDefaultCompanySettings(companyId: string): CompanySettings {
  return {
    ...DEFAULT_COMPANY_SETTINGS,
    companyId,
    ui: { ...DEFAULT_COMPANY_SETTINGS.ui },
    filePolicy: { ...DEFAULT_COMPANY_SETTINGS.filePolicy },
    notificationPolicy: { ...DEFAULT_COMPANY_SETTINGS.notificationPolicy },
  };
}
