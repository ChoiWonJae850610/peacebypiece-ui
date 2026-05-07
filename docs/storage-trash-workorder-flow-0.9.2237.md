# 0.9.2237 — 작업지시서 삭제/복구/시스템 후보 플로우 통합 점검

## 목적

작업지시서 단위 휴지통 항목의 복구/영구삭제 요청과 시스템관리자 실제 삭제 후보 흐름을 분리한다.

## 정책

- 고객관리자 저장소 화면의 `영구삭제`는 실제 삭제 완료가 아니라 `영구삭제 요청`이다.
- 시스템관리자 `/system/storage-usage`에서 실제 삭제 후보를 확인하고 처리한다.
- 작업지시서 실제 삭제 처리 시 작업지시서는 DB 삭제 완료 상태가 되고, 연결 첨부파일은 기존 R2 Worker purge 후보 흐름으로 이어진다.
- 작업지시서가 아직 시스템관리자에서 실제 처리되기 전이면 고객관리자 저장소 화면에서 복구할 수 있다.

## 변경 사항

1. 작업지시서 영구삭제 요청 API가 `delete_status='purged'`로 즉시 전환하지 않도록 수정했다.
2. 작업지시서 영구삭제 요청 시 `delete_status='purge_requested'`, `purge_status='purge_requested'`로 표시한다.
3. 연결 메모도 실제 삭제 완료가 아니라 `purge_requested` 상태로 전환한다.
4. 작업지시서와 함께 휴지통 이동한 첨부파일은 `attachment_trash_items.purge_status='purge_requested'`로 표시한다.
5. 작업지시서 복구는 `pending`뿐 아니라 `purge_requested` 상태의 묶음 첨부도 함께 복구할 수 있게 했다.
6. 고객관리자 메시지에서 “영구삭제 완료 상태” 표현을 “영구삭제 요청”으로 변경했다.

## 테스트

1. `/worker`에서 작업지시서를 삭제한다.
2. `/admin/files`에서 삭제된 작업지시서가 휴지통 항목으로 보이는지 확인한다.
3. 해당 작업지시서를 복구하면 작업지시서와 연결 첨부/메모가 함께 복구되는지 확인한다.
4. 다시 삭제 후 `/admin/files`에서 영구삭제를 실행한다.
5. DB에서 `spec_sheets.delete_status='purge_requested'`, `purge_status='purge_requested'`인지 확인한다.
6. `/system/storage-usage`에서 작업지시서 실제 삭제 후보로 보이는지 확인한다.
7. 시스템관리자에서 후보를 처리하면 `spec_sheets.delete_status='purged'`, `purged_at IS NOT NULL`인지 확인한다.
