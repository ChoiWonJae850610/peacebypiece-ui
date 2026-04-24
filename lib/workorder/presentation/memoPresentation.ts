import type { MemoReply, MemoThread } from "@/types/workorder";

type MemoLike = Pick<MemoThread | MemoReply, "content" | "deletedAt" | "isVisible">;

export function isDeletedMemoItem(item: MemoLike, deletedLabel?: string): boolean {
  return Boolean(item.deletedAt) || (Boolean(deletedLabel) && item.content.trim() === deletedLabel);
}

export function isVisibleMemoItem(item: MemoLike): boolean {
  return item.isVisible !== false;
}

export function getVisibleMemoReplies(replies: MemoReply[] = []): MemoReply[] {
  return replies.filter(isVisibleMemoItem);
}

export function getVisibleMemoThreads(threads: MemoThread[] = []): MemoThread[] {
  return threads.filter(isVisibleMemoItem);
}

export function hasVisibleMemoReplies(thread: Pick<MemoThread, "replies">): boolean {
  return getVisibleMemoReplies(thread.replies ?? []).length > 0;
}

export function getMemoDisplayContent(item: MemoLike, deletedLabel: string): string {
  return isDeletedMemoItem(item, deletedLabel) ? deletedLabel : item.content;
}
