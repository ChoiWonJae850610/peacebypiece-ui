import type { AdminFileActionResult, AdminManagedFileItem, AdminTrashFileItem } from "@/lib/admin/adminFiles.types";

function createPendingResult(message: string): AdminFileActionResult {
  return {
    ok: false,
    status: "pending-api",
    message,
  };
}

export function requestMoveAttachmentToTrash(item: AdminManagedFileItem | null): AdminFileActionResult {
  if (!item) {
    return createPendingResult("삭제할 첨부파일을 먼저 선택해야 합니다.");
  }

  return createPendingResult(
    `${item.fileName} 파일은 아직 실제 DB API와 연결되지 않았습니다. 이후 attachments.deleted_at, deleted_by, delete_reason, purge_after_at 업데이트로 연결합니다.`,
  );
}

export function requestRestoreTrashItem(item: AdminTrashFileItem | null): AdminFileActionResult {
  if (!item) {
    return createPendingResult("복구할 휴지통 파일을 먼저 선택해야 합니다.");
  }

  return createPendingResult(
    `${item.fileName} 파일 복구는 아직 실제 DB API와 연결되지 않았습니다. 이후 attachments의 삭제 관련 컬럼 초기화로 연결합니다.`,
  );
}

export function requestPurgeTrashItem(item: AdminTrashFileItem | null): AdminFileActionResult {
  if (!item) {
    return createPendingResult("영구 삭제할 휴지통 파일을 먼저 선택해야 합니다.");
  }

  return createPendingResult(
    `${item.fileName} 파일 영구 삭제는 아직 실제 R2 삭제 API와 연결되지 않았습니다. purge_after_at 이후 정리 작업으로 연결합니다.`,
  );
}
