import { ATTACHMENT_MEMO_REPOSITORY_MODE } from "@/lib/constants/app";
import { mockAttachmentMemoRepository } from "@/lib/workorder/persistence/mockAttachmentMemoRepository";
import type { AttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const ATTACHMENT_MEMO_REPOSITORY_MODES = ["mock", "db"] as const;

export type AttachmentMemoRepositoryMode = (typeof ATTACHMENT_MEMO_REPOSITORY_MODES)[number];

export function isAttachmentMemoRepositoryMode(value: string): value is AttachmentMemoRepositoryMode {
  return ATTACHMENT_MEMO_REPOSITORY_MODES.includes(value as AttachmentMemoRepositoryMode);
}

export function getDefaultAttachmentMemoRepositoryMode(): AttachmentMemoRepositoryMode {
  const envMode = process.env.ATTACHMENT_MEMO_REPOSITORY_MODE ?? process.env.NEXT_PUBLIC_ATTACHMENT_MEMO_REPOSITORY_MODE;
  if (envMode && isAttachmentMemoRepositoryMode(envMode)) return envMode;

  return isAttachmentMemoRepositoryMode(ATTACHMENT_MEMO_REPOSITORY_MODE) ? ATTACHMENT_MEMO_REPOSITORY_MODE : "mock";
}

export async function createAttachmentMemoRepository(
  mode: AttachmentMemoRepositoryMode = getDefaultAttachmentMemoRepositoryMode(),
): Promise<AttachmentMemoRepository> {
  if (mode === "db") {
    const { createDbAttachmentMemoRepository } = await import("@/lib/workorder/persistence/dbAttachmentMemoRepository");
    return createDbAttachmentMemoRepository();
  }

  return mockAttachmentMemoRepository;
}
