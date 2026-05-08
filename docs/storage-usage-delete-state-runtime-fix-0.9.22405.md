# 저장소 실제 삭제 후보 런타임/build 오류 보정 (0.9.22405)

## 목적

0.9.22404에서 `delete_reason` fallback을 제거하는 과정 중 남은 인자와 undefined 참조를 정리한다.

## 수정 내용

- `getTrashRestorePolicy`에서 더 이상 `deleteReason`을 받지 않도록 정리했다.
- `isWorkOrderBundleTrashMetadata` 호출 인자에서 `deleteReason`을 제거했다.
- `/system/storage-usage` 실제 삭제 후보 조회 중 존재하지 않는 `deleteStateMetadata.attachmentTrashItems` 참조를 제거했다.
- 작업지시서 묶음 후보 판정은 `trashPolicy.ts`의 구조화 메타데이터 predicate만 사용한다.
- 시스템관리자 purge 실행 중 `deleteStateMetadata`를 넘기던 잔여 호출을 제거했다.

## DB 변경

없음.

## 확인 기준

1. `npm run build`에서 `deleteReason` 타입 오류가 사라져야 한다.
2. `/system/storage-usage` 진입 시 `attachmentTrashItems` undefined 런타임 오류가 사라져야 한다.
3. 작업지시서 묶음 삭제 후보 판정은 `delete_source`, `delete_scope`, `delete_parent_type`, `delete_parent_id` 기준을 유지해야 한다.
