export type AdminFileUsageCard = {
  label: string;
  value: string;
  description: string;
};

export type AdminFileTrendPeriod = 7 | 15 | 30;

export type AdminRecentUploadTrendPoint = {
  label: string;
  value: number;
};

export type AdminFileTypeDistributionItem = {
  label: string;
  value: number;
  percent: number;
};

export type AdminStorageUsageSummary = {
  usedBytes: number;
  limitBytes: number;
  usedLabel: string;
  limitLabel: string;
  usagePercent: number;
  statusLabel: string;
  statusTone: "normal" | "caution" | "danger";
};

export type AdminFileTabKey = "workorders" | "attachments" | "trash" | "storage";

export type AdminFileTabItem = {
  key: AdminFileTabKey;
  label: string;
  description: string;
};

export const ADMIN_FILE_LIFECYCLE_STATUS = {
  ACTIVE: "ACTIVE",
  DELETED: "DELETED",
  TEMP: "TEMP",
} as const;

export type AdminFileLifecycleStatus = (typeof ADMIN_FILE_LIFECYCLE_STATUS)[keyof typeof ADMIN_FILE_LIFECYCLE_STATUS];

export type AdminFileStatus = "active" | "trashed" | "purged" | "temp" | AdminFileLifecycleStatus;

export type AdminTrashPurgeStatus = "pending" | "purge_requested" | "purged" | "failed" | "restored";

export type AdminTrashRestorePolicy = "file_unit" | "parent_deleted_restore_blocked" | "bundle_required";

export type AdminFileSortKey = "latest" | "size" | "workorder";


export type AdminStorageWorkOrderItem = {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
  updatedAt: string;
  deletedAt: string | null;
  attachmentCount: number;
  trashAttachmentCount: number;
  memoCount: number;
  trashMemoCount: number;
  restorePolicyLabel: string;
  attachmentSummaryLabel: string;
  memoSummaryLabel: string;
};

export type AdminManagedFileItem = {
  id: string;
  workorderId: string;
  workorderTitle: string;
  fileName: string;
  fileType: string;
  fileIcon: string;
  fileSizeBytes: number;
  fileSizeLabel: string;
  uploadedAt: string;
  uploadedBy: string;
  status: AdminFileStatus;
  statusLabel: string;
  deletedAt: string | null;
  deletedBy: string | null;
  deleteReason: string | null;
  purgeAfterAt: string | null;
};

export type AdminTrashFileItem = {
  id: string;
  attachmentId: string;
  workorderId: string;
  workorderTitle: string;
  fileName: string;
  fileIcon: string;
  fileSizeBytes: number;
  fileSizeLabel: string;
  deletedAt: string;
  deletedBy: string;
  purgeAfterAt: string;
  restoreDaysLeft: number;
  restoreLabel: string;
  deleteReason: string;
  purgeStatus: AdminTrashPurgeStatus;
  purgeStatusLabel: string;
  isPurgeReady: boolean;
  lastPurgeError: string | null;
  parentWorkOrderDeleted: boolean;
  restorePolicy: AdminTrashRestorePolicy;
  restorePolicyLabel: string;
  canRestore: boolean;
  restoreDisabledReason: string | null;
  canPurge: boolean;
  purgeDisabledReason: string | null;
};

export type AdminStoragePolicyItem = {
  label: string;
  value: string;
  description: string;
};

export type AdminStoragePolicySettings = {
  softDeleteEnabled: boolean;
  includeTrashInUsage: boolean;
  purgeAfterDays: 1 | 5 | 15 | 30;
};

export type AdminFileActionStatus = "empty-selection" | "pending-api" | "success" | "error";

export type AdminPurgeWorkerActionResult = AdminFileActionResult & {
  dryRun: boolean;
  candidateCount: number;
  purgedCount: number;
  failedCount: number;
};

export type AdminFileActionResult = {
  ok: boolean;
  status: AdminFileActionStatus;
  message: string;
};

export type AdminFileDataSource = "db" | "placeholder";

export type AdminFileManagementSnapshot = {
  dataSource: AdminFileDataSource;
  dataSourceLabel: string;
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  tabs: AdminFileTabItem[];
  workOrders: AdminStorageWorkOrderItem[];
  attachments: AdminManagedFileItem[];
  trashItems: AdminTrashFileItem[];
  storagePolicies: AdminStoragePolicyItem[];
  policySettings: AdminStoragePolicySettings;
  recentUploadTrend: AdminRecentUploadTrendPoint[];
  recentUploadTrendPeriod: AdminFileTrendPeriod;
  fileTypeDistribution: AdminFileTypeDistributionItem[];
};
