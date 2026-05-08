import {
  buildAdminFilePolicyUpdateInput,
  createAdminTrashActionMessage,
  createAdminTrashFileActionSummary,
  createEmptyAdminTrashActionSummary,
  mergeAdminTrashActionSummaries,
} from "@/lib/admin/adminFiles.presentation";
import type {
  AdminFileActionResult,
  AdminManagedFileItem,
  AdminPurgeWorkerActionResult,
  AdminStoragePolicySettings,
  AdminTrashActionResultSummary,
  AdminTrashActionType,
  AdminTrashFileItem,
} from "@/lib/admin/adminFiles.types";

function createAdminFileActionResult(input: AdminFileActionResult): AdminFileActionResult {
  return input;
}

function createEmptySelectionResult(actionLabel: string): AdminFileActionResult {
  return createAdminFileActionResult({
    ok: false,
    status: "empty-selection",
    message: `${actionLabel}할 항목을 먼저 선택해야 합니다.`,
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
  documentCount?: number;
  designCount?: number;
  message?: string;
};

type WorkOrderTrashApiResponse = {
  ok: boolean;
  requestedCount: number;
  affectedCount: number;
  attachmentCount?: number;
  documentCount?: number;
  designCount?: number;
  memoCount?: number;
  message?: string;
};

type PurgeWorkerApiResponse = {
  ok: boolean;
  dryRun: boolean;
  candidateCount: number;
  purgedCount: number;
  failedCount: number;
  items?: unknown[];
};

type TrashSelectionFlowInput = {
  items?: AdminTrashFileItem[];
  workOrderIds?: string[];
};

function normalizeWorkOrderIds(workOrderIds: string[] | undefined): string[] {
  return Array.from(new Set((workOrderIds ?? []).map((id) => id.trim()).filter(Boolean)));
}

function createSummaryFromTrashApiResponse(
  response: TrashApiResponse,
  fallbackItems: AdminTrashFileItem[],
): AdminTrashActionResultSummary {
  if (typeof response.documentCount === "number" || typeof response.designCount === "number") {
    return {
      ...createEmptyAdminTrashActionSummary(),
      documentCount: response.documentCount ?? 0,
      designCount: response.designCount ?? 0,
    };
  }
  return createAdminTrashFileActionSummary(fallbackItems, response.affectedCount);
}

function createSummaryFromWorkOrderResponse(
  response: WorkOrderTrashApiResponse,
): AdminTrashActionResultSummary {
  return {
    ...createEmptyAdminTrashActionSummary(),
    workOrderCount: response.affectedCount,
    documentCount: response.documentCount ?? response.attachmentCount ?? 0,
    designCount: response.designCount ?? 0,
    memoCount: response.memoCount ?? 0,
  };
}

function createTrashSelectionFlowResult(
  action: AdminTrashActionType,
  requestedCount: number,
  affectedCount: number,
  summary: AdminTrashActionResultSummary,
): AdminFileActionResult {
  const ok = affectedCount > 0;
  return createAdminFileActionResult({
    ok,
    status: ok ? "success" : "error",
    message: createAdminTrashActionMessage(action, summary),
    requestedCount,
    affectedCount,
    summary,
  });
}

async function runWorkOrderTrashAction(
  action: AdminTrashActionType,
  workOrderId: string,
): Promise<WorkOrderTrashApiResponse> {
  const url = action === "restore"
    ? "/api/admin/files/workorders/restore"
    : "/api/admin/files/workorders/purge";
  const actorKey = action === "restore" ? "restoredBy" : "purgedBy";
  return postAdminJson<WorkOrderTrashApiResponse>(url, {
    workOrderId,
    [actorKey]: "admin",
  });
}

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
      message: successCount === items.length ? `문서/디자인 ${successCount}개를 휴지통으로 이동했습니다.` : `문서/디자인 ${successCount}개를 휴지통으로 이동했습니다. 일부 항목은 처리하지 못했습니다.`,
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
  if (items.length === 0) return createEmptySelectionResult("복원");

  const blockedItem = items.find((item) => !item.canRestore);
  if (blockedItem) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: blockedItem.restoreDisabledReason || "선택한 항목 중 복원할 수 없는 항목이 있습니다.",
    });
  }

  try {
    const result = await postAdminJson<TrashApiResponse>("/api/admin/files/trash/restore", {
      trashItemIds: items.map((item) => item.id),
      restoredBy: "admin",
    });

    const summary = createSummaryFromTrashApiResponse(result, items);
    return createTrashSelectionFlowResult("restore", result.requestedCount, result.affectedCount, summary);
  } catch (error) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "휴지통 복원 요청에 실패했습니다.",
    });
  }
}

export async function runPurgeTrashItemsFlow(items: AdminTrashFileItem[]): Promise<AdminFileActionResult> {
  if (items.length === 0) return createEmptySelectionResult("선택 삭제");

  const blockedItem = items.find((item) => !item.canPurge);
  if (blockedItem) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: blockedItem.purgeDisabledReason || "선택한 항목 중 삭제 요청할 수 없는 항목이 있습니다.",
    });
  }

  try {
    const result = await postAdminJson<TrashApiResponse>("/api/admin/files/trash/purge", {
      trashItemIds: items.map((item) => item.id),
    });

    const summary = createSummaryFromTrashApiResponse(result, items);
    return createTrashSelectionFlowResult("purge", result.requestedCount, result.affectedCount, summary);
  } catch (error) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "삭제 요청에 실패했습니다.",
    });
  }
}

export async function runRestoreTrashSelectionFlow(input: TrashSelectionFlowInput): Promise<AdminFileActionResult> {
  const fileTargets = (input.items ?? []).filter((item) => item.canRestore);
  const skippedCount = (input.items ?? []).length - fileTargets.length;
  const workOrderIds = normalizeWorkOrderIds(input.workOrderIds);
  if (fileTargets.length === 0 && workOrderIds.length === 0) return createEmptySelectionResult("복원");

  try {
    const summaries: AdminTrashActionResultSummary[] = [];
    let requestedCount = 0;
    let affectedCount = 0;

    if (fileTargets.length > 0) {
      const result = await runRestoreTrashItemsFlow(fileTargets);
      if (!result.ok) throw new Error(result.message);
      requestedCount += result.requestedCount ?? 0;
      affectedCount += result.affectedCount ?? 0;
      summaries.push(result.summary ?? createAdminTrashFileActionSummary(fileTargets, result.affectedCount ?? 0));
    }

    for (const workOrderId of workOrderIds) {
      const result = await runWorkOrderTrashAction("restore", workOrderId);
      requestedCount += result.requestedCount;
      affectedCount += result.affectedCount;
      summaries.push(createSummaryFromWorkOrderResponse(result));
    }

    const summary = mergeAdminTrashActionSummaries(summaries);
    summary.skippedCount = skippedCount;
    return createTrashSelectionFlowResult("restore", requestedCount, affectedCount, summary);
  } catch (error) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "선택 항목 복원 요청에 실패했습니다.",
    });
  }
}

export async function runPurgeTrashSelectionFlow(input: TrashSelectionFlowInput): Promise<AdminFileActionResult> {
  const fileTargets = (input.items ?? []).filter((item) => item.canPurge);
  const skippedCount = (input.items ?? []).length - fileTargets.length;
  const workOrderIds = normalizeWorkOrderIds(input.workOrderIds);
  if (fileTargets.length === 0 && workOrderIds.length === 0) return createEmptySelectionResult("선택 삭제");

  try {
    const summaries: AdminTrashActionResultSummary[] = [];
    let requestedCount = 0;
    let affectedCount = 0;

    if (fileTargets.length > 0) {
      const result = await runPurgeTrashItemsFlow(fileTargets);
      if (!result.ok) throw new Error(result.message);
      requestedCount += result.requestedCount ?? 0;
      affectedCount += result.affectedCount ?? 0;
      summaries.push(result.summary ?? createAdminTrashFileActionSummary(fileTargets, result.affectedCount ?? 0));
    }

    for (const workOrderId of workOrderIds) {
      const result = await runWorkOrderTrashAction("purge", workOrderId);
      requestedCount += result.requestedCount;
      affectedCount += result.affectedCount;
      summaries.push(createSummaryFromWorkOrderResponse(result));
    }

    const summary = mergeAdminTrashActionSummaries(summaries);
    summary.skippedCount = skippedCount;
    return createTrashSelectionFlowResult("purge", requestedCount, affectedCount, summary);
  } catch (error) {
    return createAdminFileActionResult({
      ok: false,
      status: "error",
      message: error instanceof Error ? error.message : "선택 항목 삭제 요청에 실패했습니다.",
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
