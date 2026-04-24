import type { AttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const mockAttachmentMemoRepository: AttachmentMemoRepository = {
  getRepositoryInfo: () => ({
    mode: "mock",
    adapterConfigured: true,
    supportsWrite: false,
  }),
  listSnapshotByWorkOrderId: async () => ({
    attachments: [],
    memoThreads: [],
  }),
};
