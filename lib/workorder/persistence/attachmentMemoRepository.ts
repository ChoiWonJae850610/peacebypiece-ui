import type {
  AttachmentMemoSnapshot,
  CreateAttachmentRecordInput,
  CreateMemoReplyRecordInput,
  CreateMemoThreadRecordInput,
  WorkOrderAttachmentDbRecord,
  WorkOrderMemoReplyDbRecord,
  WorkOrderMemoThreadDbRecord,
} from "@/lib/workorder/persistence/attachmentMemoTypes";

export type AttachmentMemoRepositoryInfo = {
  mode: "mock" | "db";
  adapterConfigured: boolean;
  supportsWrite: boolean;
};

export type AttachmentMemoRepository = {
  getRepositoryInfo: () => AttachmentMemoRepositoryInfo;
  listSnapshotByWorkOrderId: (workOrderId: string) => Promise<AttachmentMemoSnapshot>;
};

export type AttachmentMemoWritableRepository = AttachmentMemoRepository & {
  createAttachment: (input: CreateAttachmentRecordInput) => Promise<WorkOrderAttachmentDbRecord>;
  createMemoThread: (input: CreateMemoThreadRecordInput) => Promise<WorkOrderMemoThreadDbRecord>;
  createMemoReply: (input: CreateMemoReplyRecordInput) => Promise<WorkOrderMemoReplyDbRecord>;
  softDeleteAttachment: (attachmentId: string) => Promise<void>;
  softDeleteMemoThread: (threadId: string) => Promise<void>;
  softDeleteMemoReply: (replyId: string) => Promise<void>;
};
