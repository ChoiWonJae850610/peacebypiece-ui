# 0.9.180 작업지시서 영구삭제 상태 정책

## 목적

작업지시서 영구삭제는 Neon DB row를 즉시 hard delete 하지 않는다. 작업지시서 본문, 발주정보, 생산구성, 메모, 히스토리, 리오더 관계는 연결 범위가 넓고 텍스트 데이터 중심이라 저장소 용량 부담이 작다. 따라서 고객관리자 화면에서는 사라지게 하되, DB에는 상태값으로 보존하는 정책을 우선 적용한다.

## 상태 컬럼

`spec_sheets`와 `memos`에 아래 컬럼을 추가한다.

- `delete_status`
  - `active`: 정상 표시 상태
  - `trashed`: 휴지통 상태
  - `purge_requested`: 영구삭제 요청 상태
  - `purged`: 사용자 화면과 휴지통에서 제외되는 삭제 완료 상태
  - `restored`: 복구 이력 표시용 상태
- `purge_status`
  - `none`: purge 대상 아님
  - `pending`: purge 대기
  - `purge_requested`: purge 요청됨
  - `purged`: purge 완료
  - `failed`: purge 실패
  - `restored`: 복구 완료
- `purge_requested_at`
- `purged_at`
- `purged_by`

## 화면 표시 기준

고객관리자 휴지통은 아래 조건의 작업지시서를 표시하지 않는다.

- `spec_sheets.delete_status = 'purged'`
- 또는 `spec_sheets.purged_at IS NOT NULL`

작업지시서가 위 상태가 되면 해당 작업지시서 대표 row와 작업지시서에 종속된 묶음 첨부 row는 고객관리자 휴지통에서 제외한다.

## 작업지시서 삭제 흐름

작업지시서 삭제 시점에는 hard delete 하지 않는다.

- `spec_sheets.is_active = false`
- `spec_sheets.deleted_at = now()`
- `spec_sheets.delete_status = 'trashed'`
- `spec_sheets.purge_status = 'pending'`
- 작업지시서 삭제와 함께 삭제된 `memos`도 `delete_status = 'trashed'`, `purge_status = 'pending'`으로 표시한다.

## 작업지시서 복구 흐름

작업지시서 복구 시:

- `spec_sheets.is_active = true`
- `spec_sheets.deleted_at = NULL`
- `spec_sheets.delete_status = 'active'`
- `spec_sheets.purge_status = 'none'`
- `spec_sheets.purge_requested_at = NULL`
- `spec_sheets.purged_at = NULL`
- `spec_sheets.purged_by = NULL`
- 작업지시서 삭제와 함께 삭제된 메모도 같은 기준으로 복구한다.

## 작업지시서 영구삭제 예정 흐름

다음 단계에서는 작업지시서 영구삭제 버튼을 누르면:

- 실제 `DELETE FROM spec_sheets`는 하지 않는다.
- `spec_sheets.delete_status = 'purged'`
- `spec_sheets.purge_status = 'purged'`
- `spec_sheets.purged_at = now()`
- `spec_sheets.purged_by = actorId`
- 작업지시서 대표 row와 묶음 첨부 row는 고객관리자 휴지통에서 제외한다.
- R2 직접 삭제는 하지 않는다.

## R2/첨부 정책

첨부파일은 기존 `attachment_trash_items`와 Worker 기반 purge 흐름을 유지한다. 작업지시서 영구삭제 상태 처리와 R2 객체 삭제는 분리한다.
