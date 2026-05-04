import { buildAdminFilePolicyUpdateInput } from "@/lib/admin/adminFiles.presentation";
import type { AdminFileActionResult, AdminManagedFileItem, AdminPurgeWorkerActionResult, AdminStoragePolicySettings, AdminTrashFileItem } from "@/lib/admin/adminFiles.types";

function createAdminFileActionResult(input: { ok: boolean; status: AdminFileActionResult["status"]; message: string }): AdminFileActionResult {
  return input;
}

function createEmptySelectionResult(actionLabel: string): AdminFileActionResult {
  return createAdminFileActionResult({
    ok: false,
    status: "empty-selection",
    message: `${actionLabel}할 파일을 먼저 선택해야 합니다.`,
  });
}

async function postAdminJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as (TResponse & { message?: string; error?: string }) | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.message || payload?.error || `REQUEST_FAILED_${response.status}`);
  }

  return payload;
}

type TrashApiResponse = {
  ok: boolean;
  requestedCount: number;
  affectedCount: number;
};

type PurgeWorkerApiResponse = {
  ok: boolean;
  dryRun: boolean;
  candidateCount: number;
  purgedCount: number;
  failedCount: number;
  items?: unknown[];
};

export async function runMoveAttachmentsToTrashFlow(items: AdminManagedFileItem[]): Promise<AdminFileActionResult> {
  if (items.length === 0) return createEmptySelectionResult("휴지통으로 이동");

  try {
    const results = await Promise.allSettled(
      items.map((item) =>
        postAdminJson<{ attachmentId: string | null; trashMode?: string }>("/api/workorders/attachments/delete", {
          attachmentId: item.id,
          deletedBy: "admin",
          deleteReason: "관리자 파일/용량 관리에서 휴지통 이동",
        }),
      ),
    );

    const successCount = results.filter((result) => result.status === "fulfilled").length;

    return createAdminFileActionResult({
      ok: successCount > 0,
      status: successCount === items.length ? "success" : "error",
      message: `${successCount}/${items.length}개 파일을 휴지통으로 이동했습니다. attachments soft delete와 attachment_trash_items 기록을 사용합니다.`,
    });
  } catch (error) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "휴지통 이동 요청에 실패했습니다.",
    });
  }
}

export async function runRestoreTrashItemsFlow(items: AdminTrashFileItem[]): Promise<AdminFileActionResult> {
  if (items.length === 0) return createEmptySelectionResult("복구");

  const blockedItem = items.find((item) => !item.canRestore);
  if (blockedItem) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: blockedItem.restoreDisabledReason || "선택한 파일 중 복구할 수 없는 항목이 있습니다.",
    });
  }

  try {
    const result = await postAdminJson<TrashApiResponse>("/api/admin/files/trash/restore", {
      trashItemIds: items.map((item) => item.id),
      restoredBy: "admin",
    });

    return createAdminFileActionResult({
      ok: result.ok,
      status: result.ok ? "success" : "error",
      message: `${result.affectedCount}/${result.requestedCount}개 파일을 휴지통에서 복구했습니다. attachments 삭제 컬럼을 초기화하고 휴지통 이력을 restored 상태로 변경했습니다.`,
    });
  } catch (error) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "휴지통 복구 요청에 실패했습니다.",
    });
  }
}

export async function runPurgeTrashItemsFlow(items: AdminTrashFileItem[]): Promise<AdminFileActionResult> {
  if (items.length === 0) return createEmptySelectionResult("영구삭제");

  const blockedItem = items.find((item) => !item.canPurge);
  if (blockedItem) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: blockedItem.purgeDisabledReason || "선택한 파일 중 영구삭제할 수 없는 항목이 있습니다.",
    });
  }

  try {
    const result = await postAdminJson<TrashApiResponse>("/api/admin/files/trash/purge", {
      trashItemIds: items.map((item) => item.id),
    });

    return createAdminFileActionResult({
      ok: result.ok,
      status: result.ok ? "success" : "error",
      message: `${result.affectedCount}/${result.requestedCount}개 파일을 영구삭제 요청 상태로 변경했습니다. 요청된 파일은 휴지통 목록에서 제외되며 R2 실제 삭제는 purge worker에서 처리됩니다.`,
    });
  } catch (error) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "영구삭제 요청에 실패했습니다.",
    });
  }
}

export async function runPurgeWorkerFlow(dryRun: boolean): Promise<AdminPurgeWorkerActionResult> {
  try {
    const response = await fetch(`/api/admin/files/trash/purge-worker?dryRun=${dryRun ? "true" : "false"}&limit=50`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as (PurgeWorkerApiResponse & { message?: string; error?: string }) | null;

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.message || payload?.error || `PURGE_WORKER_FAILED_${response.status}`);
    }

    const message = dryRun
      ? `dryRun 결과: 실제 삭제 가능 후보 ${payload.candidateCount}개를 확인했습니다.`
      : `실제 삭제 결과: 후보 ${payload.candidateCount}개 중 ${payload.purgedCount}개 삭제 완료, ${payload.failedCount}개 실패.`;

    return {
      ok: true,
      status: payload.failedCount > 0 ? "error" : "success",
      message,
      dryRun: payload.dryRun,
      candidateCount: payload.candidateCount,
      purgedCount: payload.purgedCount,
      failedCount: payload.failedCount,
    };
  } catch (error) {
    return {
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "purge worker 실행에 실패했습니다.",
      dryRun,
      candidateCount: 0,
      purgedCount: 0,
      failedCount: 0,
    };
  }
}

export async function runUpdateFilePolicySettingsFlow(policySettings: AdminStoragePolicySettings): Promise<AdminFileActionResult> {
  try {
    const response = await fetch("/api/admin/companies/current", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildAdminFilePolicyUpdateInput(policySettings)),
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      return createAdminFileActionResult({
        ok: false,
        status: "error",
        message: payload?.message ? `파일 정책 저장 실패: ${payload.message}` : "파일 정책 저장 실패",
      });
    }

    return createAdminFileActionResult({
      ok: true,
      status: "success",
      message: "파일/용량 정책을 저장했습니다.",
    });
  } catch (error) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? `파일 정책 저장 실패: ${error.message}` : "파일 정책 저장 실패",
    });
  }
}
