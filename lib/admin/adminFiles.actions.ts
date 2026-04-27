import type { AdminFileActionResult, AdminManagedFileItem, AdminTrashFileItem } from "@/lib/admin/adminFiles.types";

function createPendingResult(message: string): AdminFileActionResult {
  return {
    ok: false,
    status: "pending-api",
    message,
  };
}

function createEmptySelectionResult(actionLabel: string): AdminFileActionResult {
  return createPendingResult(`${actionLabel}할 파일을 먼저 선택해야 합니다.`);
}

export function requestMoveAttachmentsToTrash(items: AdminManagedFileItem[]): AdminFileActionResult {
  if (items.length === 0) return createEmptySelectionResult("휴지통으로 이동");

  return createPendingResult(
    `${items.length}개 파일은 휴지통 이동 actionFlow 대상으로 선택되었습니다. 실제 연결 시 attachments.deleted_at/deleted_by/delete_reason/purge_after_at 업데이트와 attachment_trash_items insert를 하나의 DB 작업으로 처리합니다. R2 원본은 즉시 삭제하지 않습니다.`,
  );
}

export function requestRestoreTrashItems(items: AdminTrashFileItem[]): AdminFileActionResult {
  if (items.length === 0) return createEmptySelectionResult("복구");

  return createPendingResult(
    `${items.length}개 파일은 복구 actionFlow 대상으로 선택되었습니다. 실제 연결 시 attachments의 삭제 관련 컬럼을 초기화하고 attachment_trash_items의 restored_at/restored_by를 기록합니다.`,
  );
}

export function requestPurgeTrashItems(items: AdminTrashFileItem[]): AdminFileActionResult {
  if (items.length === 0) return createEmptySelectionResult("영구삭제");

  return createPendingResult(
    `${items.length}개 파일은 영구삭제 actionFlow 대상으로 선택되었습니다. 실제 연결 시 purge_status를 요청 상태로 변경하고 별도 정리 작업에서 R2 원본/썸네일 삭제 후 purged_at을 기록합니다.`,
  );
}
