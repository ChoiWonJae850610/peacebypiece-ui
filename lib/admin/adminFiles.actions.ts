import type { AdminFileActionResult, AdminManagedFileItem, AdminTrashFileItem } from "@/lib/admin/adminFiles.types";

function createResult(input: { ok: boolean; status: AdminFileActionResult["status"]; message: string }): AdminFileActionResult {
  return input;
}

function createEmptySelectionResult(actionLabel: string): AdminFileActionResult {
  return createResult({
    ok: false,
    status: "empty-selection",
    message: `${actionLabel}할 파일을 먼저 선택해야 합니다.`,
  });
}

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as TResponse & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `REQUEST_FAILED_${response.status}`);
  }

  return payload;
}

type TrashApiResponse = {
  ok: boolean;
  requestedCount: number;
  affectedCount: number;
};

export async function requestMoveAttachmentsToTrash(items: AdminManagedFileItem[]): Promise<AdminFileActionResult> {
  if (items.length === 0) return createEmptySelectionResult("휴지통으로 이동");

  try {
    const results = await Promise.allSettled(
      items.map((item) =>
        postJson<{ attachmentId: string | null; trashMode?: string }>("/api/workorders/attachments/delete", {
          attachmentId: item.id,
          deletedBy: "admin",
          deleteReason: "관리자 파일/용량 관리에서 휴지통 이동",
        }),
      ),
    );

    const successCount = results.filter((result) => result.status === "fulfilled").length;

    return createResult({
      ok: successCount > 0,
      status: successCount === items.length ? "success" : "error",
      message: `${successCount}/${items.length}개 파일을 휴지통으로 이동했습니다. attachments soft delete와 attachment_trash_items 기록을 사용합니다.`,
    });
  } catch (error) {
    return createResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "휴지통 이동 요청에 실패했습니다.",
    });
  }
}

export async function requestRestoreTrashItems(items: AdminTrashFileItem[]): Promise<AdminFileActionResult> {
  if (items.length === 0) return createEmptySelectionResult("복구");

  try {
    const result = await postJson<TrashApiResponse>("/api/admin/files/trash/restore", {
      trashItemIds: items.map((item) => item.id),
      restoredBy: "admin",
    });

    return createResult({
      ok: result.ok,
      status: result.ok ? "success" : "error",
      message: `${result.affectedCount}/${result.requestedCount}개 파일을 휴지통에서 복구했습니다. attachments 삭제 컬럼을 초기화하고 휴지통 이력을 restored 상태로 변경했습니다.`,
    });
  } catch (error) {
    return createResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "휴지통 복구 요청에 실패했습니다.",
    });
  }
}

export async function requestPurgeTrashItems(items: AdminTrashFileItem[]): Promise<AdminFileActionResult> {
  if (items.length === 0) return createEmptySelectionResult("영구삭제");

  try {
    const result = await postJson<TrashApiResponse>("/api/admin/files/trash/purge", {
      trashItemIds: items.map((item) => item.id),
    });

    return createResult({
      ok: result.ok,
      status: result.ok ? "success" : "error",
      message: `${result.affectedCount}/${result.requestedCount}개 파일을 영구삭제 요청 상태로 변경했습니다. R2 실제 삭제는 별도 정리 작업에서 처리됩니다.`,
    });
  } catch (error) {
    return createResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "영구삭제 요청에 실패했습니다.",
    });
  }
}
