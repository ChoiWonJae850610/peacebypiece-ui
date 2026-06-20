export type AdminDashboardPlanStorageTone = "normal" | "caution" | "danger";

export type AdminDashboardPlanStorageSummary = {
  planLabel: string;
  statusLabel: string;
  sourceLabel: string;
  storageUsedLabel: string;
  storageLimitLabel: string;
  storageUsagePercent: number;
  storageStatusLabel: string;
  storageStatusTone: AdminDashboardPlanStorageTone;
  activeStorageLabel: string;
  trashStorageLabel: string;
  memberUsageLabel: string;
  memberStatusLabel: string;
  memberStatusTone: "normal" | "caution";
  includeTrashInUsage: boolean;
  policySourceLabel: string;
  subscriptionHref: string;
  storageHref: string;
};
