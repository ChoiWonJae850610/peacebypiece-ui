# 0.9.22371 — 작업지시서 영구삭제 요청 SQL parameter 오류 수정

## 목적

고객관리자 저장소 휴지통에서 작업지시서 항목을 영구삭제 요청할 때 PostgreSQL 오류 `could not determine data type of parameter $2`가 발생하는 문제를 수정한다.

## 원인

`purgeWorkOrderTrashBundle` 쿼리에서 `$1`, `$3`만 참조하면서 params 배열에는 `[workOrderId, actorId, WORKORDER_BUNDLE_DELETE_REASON]`를 전달했다. SQL 안에서 `$2`가 사용되지 않아 PostgreSQL이 `$2`의 타입을 결정하지 못했다.

## 수정

- `attachment_trash_items.delete_reason` 비교 parameter를 `$3`에서 `$2`로 변경
- params 배열을 `[workOrderId, WORKORDER_BUNDLE_DELETE_REASON]`로 축소
- APP_VERSION을 `0.9.22371`로 변경

## 확인

1. `/admin/files`에서 작업지시서 휴지통 항목 선택
2. 영구삭제 실행
3. `could not determine data type of parameter $2` 오류가 사라지는지 확인
4. 작업지시서가 `purge_requested` 상태로 남는지 확인
5. `/system/storage-usage` 실제 삭제 후보에 계속 표시되는지 확인
