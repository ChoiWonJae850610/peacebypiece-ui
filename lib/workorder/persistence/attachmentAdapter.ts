import type { AttachmentRepository } from "@/lib/workorder/persistence/attachmentRepository";

export const ATTACHMENT_REPOSITORY_MODES = ["db"] as const;
export type AttachmentRepositoryMode = (typeof ATTACHMENT_REPOSITORY_MODES)[number];

export function isAttachmentRepositoryMode(value: string): value is AttachmentRepositoryMode {
  return ATTACHMENT_REPOSITORY_MODES.includes(value as AttachmentRepositoryMode);
}

export function getDefaultAttachmentRepositoryMode(): AttachmentRepositoryMode {
  return "db";
}

export async function createAttachmentRepository(
  mode: AttachmentRepositoryMode = getDefaultAttachmentRepositoryMode(),
): Promise<AttachmentRepository> {
  mode;
  const { createDbAttachmentRepository } = await import("@/lib/workorder/persistence/dbAttachmentRepository");
  return createDbAttachmentRepository();
}
