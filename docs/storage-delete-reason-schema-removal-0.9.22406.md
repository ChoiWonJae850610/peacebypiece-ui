# 0.9.22406 — delete_reason DB 컬럼 제거 및 삭제 상태 판정 단일화

## 목적

개발 DB를 reset할 수 있는 단계이므로 기존 데이터 호환용 `delete_reason` fallback을 유지하지 않는다. 삭제 상태는 문장 컬럼이 아니라 구조화된 메타데이터 컬럼으로만 판정한다.

## 반영 내용

- `attachments.delete_reason` 컬럼 제거
- `attachment_trash_items.delete_reason` 컬럼 제거
- `full_reset.sql`에서 `delete_reason` 제거
- demo seed SQL에서 `delete_reason` insert/select 제거
- `full_reset_smoke_test.sql`에 legacy `delete_reason` 컬럼 잔존 검사 추가
- 첨부 삭제 API와 repository에서 `deleteReason` 입력 제거
- 관리자 저장소 server action에서 `delete_reason` select/update/mapping 제거
- 작업지시서 삭제 시 첨부 휴지통 row 생성은 `delete_source`, `delete_scope`, `delete_parent_type`, `delete_parent_id`, `delete_batch_id` 기준으로만 기록

## 삭제 상태 기준

신규 삭제 상태 판정은 아래 컬럼 기준으로 한다.

- `delete_source`
- `delete_scope`
- `delete_parent_type`
- `delete_parent_id`
- `delete_batch_id`
- `purge_status`

## DB 적용

기존 DB에는 migration SQL을 적용하거나 전체 리셋을 실행한다.

```sql
ALTER TABLE IF EXISTS attachments
  DROP COLUMN IF EXISTS delete_reason;

ALTER TABLE IF EXISTS attachment_trash_items
  DROP COLUMN IF EXISTS delete_reason;

ALTER TABLE IF EXISTS memos
  DROP COLUMN IF EXISTS delete_reason;

ALTER TABLE IF EXISTS spec_sheets
  DROP COLUMN IF EXISTS delete_reason;
```

## 테스트 기준

1. migration SQL 또는 full reset 적용
2. `full_reset_smoke_test.sql` 실행
3. 작업지시서 삭제 시 묶음 문서/디자인/메모에 구조화 메타데이터 기록 확인
4. 첨부 단독 삭제 시 `delete_source = manual`, `delete_scope = single` 확인
5. `/admin/files` 휴지통 목록 확인
6. `/system/storage-usage` 실제 삭제 후보 확인
7. `delete_reason` 컬럼이 없어도 build/runtime 오류가 없어야 함
