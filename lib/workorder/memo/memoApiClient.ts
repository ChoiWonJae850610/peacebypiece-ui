import type { MemoReply, MemoThread, UserProfile, WorkOrder } from "@/types/workorder";

export type MemoPersistApiResult = {
  thread?: MemoThread;
  reply?: MemoReply;
  memo?: MemoThread | MemoReply;
  memoId?: string;
  error?: string;
  message?: string;
};

type MemoPersistTarget = "thread" | "reply";

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  return (await response.json().catch(() => fallback)) as T;
}

async function persistMemo(payload: {
  target: MemoPersistTarget;
  workOrder: Pick<WorkOrder, "id">;
  currentUser: Pick<UserProfile, "id" | "name" | "role">;
  threadId?: string;
  content: string;
}): Promise<MemoPersistApiResult> {
  const response = await fetch("/api/workorders/memos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      target: payload.target,
      orderId: payload.workOrder.id,
      threadId: payload.threadId,
      authorId: payload.currentUser.id,
      authorName: payload.currentUser.name,
      authorRole: payload.currentUser.role,
      content: payload.content,
    }),
  });

  const result = await readJson<MemoPersistApiResult>(response, { error: "INVALID_MEMO_RESPONSE" });

  if (!response.ok) {
    throw new Error(result.message || result.error || "MEMO_PERSIST_FAILED");
  }

  return result;
}

export async function createMemoThreadInDb(payload: {
  workOrder: Pick<WorkOrder, "id">;
  currentUser: Pick<UserProfile, "id" | "name" | "role">;
  content: string;
}): Promise<MemoThread> {
  const result = await persistMemo({ ...payload, target: "thread" });
  if (!result.thread) throw new Error("MEMO_THREAD_RESPONSE_MISSING");
  return result.thread;
}

export async function createMemoReplyInDb(payload: {
  workOrder: Pick<WorkOrder, "id">;
  currentUser: Pick<UserProfile, "id" | "name" | "role">;
  threadId: string;
  content: string;
}): Promise<MemoReply> {
  const result = await persistMemo({ ...payload, target: "reply" });
  if (!result.reply) throw new Error("MEMO_REPLY_RESPONSE_MISSING");
  return result.reply;
}

export async function updateMemoInDb(payload: { memoId: string; content: string }): Promise<void> {
  const response = await fetch("/api/workorders/memos", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ memoId: payload.memoId, content: payload.content }),
  });
  const result = await readJson<MemoPersistApiResult>(response, { error: "INVALID_MEMO_RESPONSE" });
  if (!response.ok) {
    throw new Error(result.message || result.error || "MEMO_UPDATE_FAILED");
  }
}

export async function deleteMemoInDb(payload: { memoId: string; target: MemoPersistTarget }): Promise<void> {
  const response = await fetch("/api/workorders/memos", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ memoId: payload.memoId, target: payload.target }),
  });
  const result = await readJson<MemoPersistApiResult>(response, { error: "INVALID_MEMO_RESPONSE" });
  if (!response.ok) {
    throw new Error(result.message || result.error || "MEMO_DELETE_FAILED");
  }
}
