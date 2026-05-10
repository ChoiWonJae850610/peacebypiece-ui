import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";

export type OrganizationSettingStatus = "active" | "fixed" | "planned";
export type OrganizationSettingScopeId = "file-policy" | "storage-policy" | "notification-policy" | "standards" | "member-permissions";
export type OrganizationSettingSummaryUnit = "gb" | "days" | "percent" | "count";

export type OrganizationSettingSummaryCard = {
  id: string;
  value: number;
  unit: OrganizationSettingSummaryUnit;
};

export type OrganizationSettingScopeCard = {
  id: OrganizationSettingScopeId;
  status: OrganizationSettingStatus;
};

export type OrganizationSettingsViewModel = {
  summaryCards: OrganizationSettingSummaryCard[];
  scopeCards: OrganizationSettingScopeCard[];
  personalSettingsHref: string;
};

function countEnabledNotificationPolicies(settings: CompanySettings): number {
  return Object.values(settings.notificationPolicy).filter(Boolean).length;
}

export function buildOrganizationSettingsViewModel(settings: CompanySettings): OrganizationSettingsViewModel {
  return {
    summaryCards: [
      { id: "storage-limit", value: settings.filePolicy.storageLimitGb, unit: "gb" },
      { id: "trash-retention", value: settings.filePolicy.trashRetentionDays || COMPANY_FILE_TRASH_RETENTION_DAYS, unit: "days" },
      { id: "warning-threshold", value: settings.filePolicy.warningThresholdPercent, unit: "percent" },
      { id: "notification-events", value: countEnabledNotificationPolicies(settings), unit: "count" },
    ],
    scopeCards: [
      { id: "file-policy", status: "active" },
      { id: "storage-policy", status: "active" },
      { id: "notification-policy", status: "active" },
      { id: "standards", status: "active" },
      { id: "member-permissions", status: "planned" },
    ],
    personalSettingsHref: "/me/settings",
  };
}
