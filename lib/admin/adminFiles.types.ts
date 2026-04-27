export type AdminFileUsageCard = {
  label: string;
  value: string;
  description: string;
};

export type AdminFileTabKey = "attachments" | "trash" | "storage";

export type AdminFileTabItem = {
  key: AdminFileTabKey;
  label: string;
  description: string;
};

export type AdminFileStatus = "active" | "trashed" | "purged";

export type AdminManagedFileItem = {
  id: string;
  workorderId: string;
  workorderTitle: string;
  fileName: string;
  fileType: string;
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
  fileSizeBytes: number;
  fileSizeLabel: string;
  deletedAt: string;
  deletedBy: string;
  purgeAfterAt: string;
  deleteReason: string;
};

export type AdminStoragePolicyItem = {
  label: string;
  value: string;
  description: string;
};

export type AdminFileActionStatus = "pending-api" | "success" | "error";

export type AdminFileActionResult = {
  ok: boolean;
  status: AdminFileActionStatus;
  message: string;
};

export type AdminFileManagementSnapshot = {
  usageCards: AdminFileUsageCard[];
  tabs: AdminFileTabItem[];
  attachments: AdminManagedFileItem[];
  trashItems: AdminTrashFileItem[];
  storagePolicies: AdminStoragePolicyItem[];
};
