# 저장소 삭제 상태 판정 단일화 — 0.9.22404

## 목적

개발 DB를 reset 가능한 상태로 전제하고, 작업지시서 묶음 삭제 판정에서 `delete_reason` 문장 기반 fallback을 제거한다.

## 변경 원칙

- `delete_reason`은 삭제 상태 판정에 사용하지 않는다.
- 작업지시서 묶음 삭제는 구조화 메타데이터로만 판정한다.
- 신규 판정 기준은 `delete_source`, `delete_scope`, `delete_parent_type`, `delete_parent_id`, `delete_batch_id`다.
- `delete_reason` 컬럼 자체는 이번 버전에서 삭제하지 않는다.
- DB 컬럼 제거는 다음 schema 정리 버전에서 처리한다.

## 판정 기준

### 작업지시서 묶음 삭제

```sql
COALESCE(delete_source, '') = 'workorder_bundle'
OR (
  COALESCE(delete_scope, '') = 'bundle'
  AND COALESCE(delete_parent_type, '') = 'workorder'
)
```

특정 작업지시서 하위 항목을 찾을 때는 `delete_parent_id = 작업지시서 ID` 조건을 함께 사용한다.

### 개별 삭제

개별 삭제는 `delete_source = 'manual'`, `delete_scope = 'single'` 기준으로 기록한다.

## 이번 버전에서 제거한 것

- `ADMIN_FILE_TRASH_REASONS.workorderBundle` 상수 의존
- `isWorkOrderBundleTrashReason()` 문장 비교 함수
- `delete_reason = '작업지시서 삭제로 함께 휴지통 이동'` 기반 SQL fallback
- 시스템관리자 실제 삭제 후보의 `delete_reason` fallback
- 작업지시서 묶음 복원/삭제 요청의 legacy reason 파라미터

## 남겨둔 것

- `delete_reason` 컬럼
- 기존 UI item의 `deleteReason` 표시 필드
- 삭제 사유가 단순 표시값으로 쓰이는 흐름

## 다음 단계

0.9.22405에서 DB schema의 `delete_reason` 컬럼 제거를 검토한다.

필요 작업:

1. `full_reset.sql`에서 `delete_reason` 제거
2. `spec_sheets.sql`에서 `delete_reason` 제거
3. attachments / attachment_trash_items / memos의 `delete_reason` 제거
4. insert/update/select 잔여 참조 제거
5. smoke test를 구조화 컬럼 기준으로 보강

## 검증 기준

1. 작업지시서 삭제 시 첨부/메모에 `delete_source = 'workorder_bundle'`이 기록된다.
2. 작업지시서 복원 시 묶음 문서/디자인/메모가 구조화 컬럼 기준으로 복원된다.
3. 작업지시서 선택 삭제 시 묶음 문서/디자인/메모가 구조화 컬럼 기준으로 삭제 요청된다.
4. 시스템관리자 실제 삭제 후보가 구조화 컬럼 기준으로 집계된다.
5. 코드에서 작업지시서 묶음 판정을 위해 `delete_reason` 문장을 비교하지 않는다.
