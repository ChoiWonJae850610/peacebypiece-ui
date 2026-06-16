import type {
  AttachmentSnapshot,
  CreateAttachmentRecordInput,
  WorkOrderAttachmentDbRecord,
} from "@/lib/workorder/persistence/attachmentTypes";

export type AttachmentRepositoryInfo = {
  mode: "db";
  adapterConfigured: boolean;
  supportsWrite: boolean;
};

export type AttachmentRepository = {
  getRepositoryInfo: () => AttachmentRepositoryInfo;
  listSnapshotByWorkOrderId: (workOrderId: string) => Promise<AttachmentSnapshot>;
};

export type AttachmentWritableRepository = AttachmentRepository & {
  createAttachment: (input: CreateAttachmentRecordInput) => Promise<WorkOrderAttachmentDbRecord>;
  getAttachmentById: (attachmentId: string) => Promise<WorkOrderAttachmentDbRecord | null>;
  countActiveAttachmentsByWorkOrderId: (workOrderId: string) => Promise<number>;
  setPrimaryDesignAttachment: (input: { workOrderId: string; attachmentId: string }) => Promise<WorkOrderAttachmentDbRecord | null>;
  softDeleteAttachment: (input: { attachmentId: string; deletedBy?: string | null; trashRetentionDays?: number | null }) => Promise<WorkOrderAttachmentDbRecord | null>;
};
