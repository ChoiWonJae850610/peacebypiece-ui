import { NextRequest, NextResponse } from "next/server";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";
import type { MemoReply, MemoThread, RoleType } from "@/types/workorder";
import type { WorkOrderMemoDbRecord, WorkOrderMemoReplyDbRecord, WorkOrderMemoThreadDbRecord } from "@/lib/workorder/persistence/attachmentMemoTypes";

export const runtime = "nodejs";

type MemoTarget = "thread" | "reply";

type MemoCreateRequest = {
  target?: unknown;
  orderId?: unknown;
  threadId?: unknown;
  authorId?: unknown;
  authorName?: unknown;
  authorRole?: unknown;
  content?: unknown;
};

type MemoUpdateRequest = {
  memoId?: unknown;
  content?: unknown;
};

type MemoDeleteRequest = {
  target?: unknown;
  memoId?: unknown;
};

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "createMemoThread" in repository && "createMemoReply" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeTarget(value: unknown): MemoTarget {
  return value === "reply" ? "reply" : "thread";
}

function normalizeRole(value: unknown): RoleType {
  return value === "designer" || value === "inspector" || value === "admin" ? value : "admin";
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function mapMemoBase(row: WorkOrderMemoDbRecord, authorName: string, authorRole: RoleType) {
  return {
    id: row.id,
    authorId: row.author_id ?? "system",
    authorName: row.author_id ? authorName : "시스템",
    authorRole,
    content: row.body,
    createdAt: toIsoString(row.created_at),
    deletedAt: row.deleted_at,
    isVisible: row.is_active,
  };
}

function mapThread(row: WorkOrderMemoThreadDbRecord, authorName: string, authorRole: RoleType): MemoThread {
  return {
    ...mapMemoBase(row, authorName, authorRole),
    replies: [],
  };
}

function mapReply(row: WorkOrderMemoReplyDbRecord, authorName: string, authorRole: RoleType): MemoReply {
  return mapMemoBase(row, authorName, authorRole);
}


export async function GET(request: NextRequest) {
  try {
    const orderId = readText(request.nextUrl.searchParams.get("orderId"));
    if (!orderId) return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });

    const repository = await createAttachmentMemoRepository();
    const snapshot = await repository.listSnapshotByWorkOrderId(orderId);
    return NextResponse.json({ orderId, memoThreads: snapshot.memoThreads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memo loading failed.";
    console.error("[MEMO_LOAD_FAILED]", { message, error });
    return NextResponse.json({ error: "MEMO_LOAD_FAILED", message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as MemoCreateRequest | null;
    const target = normalizeTarget(payload?.target);
    const orderId = readText(payload?.orderId);
    const threadId = readText(payload?.threadId);
    const authorId = readText(payload?.authorId);
    const authorName = readText(payload?.authorName) ?? authorId ?? "시스템";
    const authorRole = normalizeRole(payload?.authorRole);
    const content = readText(payload?.content);

    if (!orderId) return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "MEMO_CONTENT_REQUIRED" }, { status: 400 });
    if (target === "reply" && !threadId) return NextResponse.json({ error: "THREAD_ID_REQUIRED" }, { status: 400 });

    const repository = await createAttachmentMemoRepository();
    if (!isWritableRepository(repository)) {
      return NextResponse.json({ error: "MEMO_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
    }

    if (target === "reply") {
      const created = await repository.createMemoReply({
        order_id: orderId,
        thread_id: threadId!,
        reply: {
          id: crypto.randomUUID(),
          authorId: authorId ?? "system",
          authorName,
          authorRole,
          content,
          createdAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({ reply: mapReply(created, authorName, authorRole) });
    }

    const created = await repository.createMemoThread({
      order_id: orderId,
      thread: {
        id: crypto.randomUUID(),
        authorId: authorId ?? "system",
        authorName,
        authorRole,
        content,
        createdAt: new Date().toISOString(),
        replies: [],
      },
    });

    return NextResponse.json({ thread: mapThread(created, authorName, authorRole) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memo creation failed.";
    console.error("[MEMO_CREATE_FAILED]", { message, error });
    return NextResponse.json({ error: "MEMO_CREATE_FAILED", message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as MemoUpdateRequest | null;
    const memoId = readText(payload?.memoId);
    const content = readText(payload?.content);

    if (!memoId) return NextResponse.json({ error: "MEMO_ID_REQUIRED" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "MEMO_CONTENT_REQUIRED" }, { status: 400 });

    const repository = await createAttachmentMemoRepository();
    if (!isWritableRepository(repository)) {
      return NextResponse.json({ error: "MEMO_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
    }

    const updated = await repository.updateMemo(memoId, content);
    if (!updated) return NextResponse.json({ error: "MEMO_NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ memo: mapMemoBase(updated, updated.author_id ?? "시스템", "admin") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memo update failed.";
    console.error("[MEMO_UPDATE_FAILED]", { message, error });
    return NextResponse.json({ error: "MEMO_UPDATE_FAILED", message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as MemoDeleteRequest | null;
    const target = normalizeTarget(payload?.target);
    const memoId = readText(payload?.memoId);

    if (!memoId) return NextResponse.json({ error: "MEMO_ID_REQUIRED" }, { status: 400 });

    const repository = await createAttachmentMemoRepository();
    if (!isWritableRepository(repository)) {
      return NextResponse.json({ error: "MEMO_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
    }

    if (target === "reply") {
      await repository.softDeleteMemoReply(memoId);
    } else {
      await repository.softDeleteMemoThread(memoId);
    }

    return NextResponse.json({ memoId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memo delete failed.";
    console.error("[MEMO_DELETE_FAILED]", { message, error });
    return NextResponse.json({ error: "MEMO_DELETE_FAILED", message }, { status: 500 });
  }
}
