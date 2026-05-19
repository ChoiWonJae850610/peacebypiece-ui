import type { AttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const ATTACHMENT_MEMO_REPOSITORY_MODES = ["db"] as const;

export type AttachmentMemoRepositoryMode = (typeof ATTACHMENT_MEMO_REPOSITORY_MODES)[number];

export function isAttachmentMemoRepositoryMode(value: string): value is AttachmentMemoRepositoryMode {
  return ATTACHMENT_MEMO_REPOSITORY_MODES.includes(value as AttachmentMemoRepositoryMode);
}

export function getDefaultAttachmentMemoRepositoryMode(): AttachmentMemoRepositoryMode {
  return "db";
}

export async function createAttachmentMemoRepository(
  mode: AttachmentMemoRepositoryMode = getDefaultAttachmentMemoRepositoryMode(),
): Promise<AttachmentMemoRepository> {
  mode;
  const { createDbAttachmentMemoRepository } = await import("@/lib/workorder/persistence/dbAttachmentMemoRepository");
  return createDbAttachmentMemoRepository();
}
