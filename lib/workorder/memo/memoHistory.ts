import type { MemoAttachmentPayload } from "@/types/workorder";

export function getMemoPayloadInfo(payload?: MemoAttachmentPayload) {
  return {
    selectedAttachmentIds: payload?.selectedAttachmentIds ?? [],
    files: payload?.files ?? [],
  };
}
