import type { MemoReply, MemoThread } from "@/types/workorder";

const LEGACY_DELETED_MEMO_CONTENT = "삭제된 메모입니다.";

type MemoLike = Pick<MemoThread | MemoReply, "content" | "deletedAt">;

export function isDeletedMemoItem(item: MemoLike): boolean {
  return Boolean(item.deletedAt) || item.content.trim() === LEGACY_DELETED_MEMO_CONTENT;
}

export function getMemoDisplayContent(item: MemoLike, deletedLabel: string): string {
  return isDeletedMemoItem(item) ? deletedLabel : item.content;
}
