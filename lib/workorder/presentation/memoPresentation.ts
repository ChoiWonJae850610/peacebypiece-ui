import type { MemoReply, MemoThread } from "@/types/workorder";

type MemoLike = Pick<MemoThread | MemoReply, "content" | "deletedAt">;

export function isDeletedMemoItem(item: MemoLike, deletedLabel?: string): boolean {
  return Boolean(item.deletedAt) || (Boolean(deletedLabel) && item.content.trim() === deletedLabel);
}

export function getMemoDisplayContent(item: MemoLike, deletedLabel: string): string {
  return isDeletedMemoItem(item, deletedLabel) ? deletedLabel : item.content;
}
