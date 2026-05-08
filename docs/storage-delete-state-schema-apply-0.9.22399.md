# 0.9.22399 삭제 상태 DB schema 리팩토링 1차 적용

## 목표

`delete_reason`에 문장과 정책 의미가 섞여 있던 구조를 바로 제거하지 않고, 구조화된 삭제 메타데이터 컬럼을 추가해 신규 흐름부터 코드값 기준으로 판정하도록 정리한다.

## 적용 원칙

- `delete_reason`은 이번 버전에서 제거하지 않는다.
- 기존 데이터와 기존 fallback을 위해 `delete_reason`은 legacy 보조값으로 유지한다.
- 신규 삭제/복원/삭제 요청 판정은 아래 구조화 컬럼을 우선 사용한다.
- 작업지시서 묶음 삭제 판정은 `delete_source = 'workorder_bundle'`을 우선 사용하고, 기존 데이터는 `delete_reason = '작업지시서 삭제로 함께 휴지통 이동'`으로 fallback 처리한다.

## 신규 컬럼

대상 테이블:

- `spec_sheets`
- `attachments`
- `attachment_trash_items`
- `memos`

공통 삭제 메타데이터:

- `delete_source`
  - `manual`
  - `workorder_bundle`
  - `system`
- `delete_scope`
  - `single`
  - `bundle`
- `delete_parent_type`
  - `none`
  - `workorder`
- `delete_parent_id`
- `delete_batch_id`

추가 purge 메타데이터:

- `purge_requested_by`
- `purge_failure_code` (`attachment_trash_items`)

## 코드 반영

- 작업지시서 삭제 시 첨부/메모에 `workorder_bundle` 메타데이터를 기록한다.
- 개별 첨부 삭제 시 `manual + single` 메타데이터를 기록한다.
- 작업지시서 복원/삭제 요청 시 `delete_source` 기준으로 묶음 첨부를 찾고, 기존 데이터는 `delete_reason`으로 fallback한다.
- 시스템관리자 실제 삭제 후보 조회도 동일한 구조화 메타데이터 우선 판정을 사용한다.
- `processing` purge 상태를 check constraint와 타입에 포함했다.

## SQL 반영

추가 migration:

- `db/schema/patch_0_9_22399_delete_state_metadata.sql`

full reset 반영:

- `db/schema/full_reset.sql`
- `db/schema/spec_sheets.sql`
- `db/schema/full_reset_smoke_test.sql`

## 전체 리셋 판단

현재 서비스 중인 운영 데이터가 없고 삭제 상태 구조를 바꾸는 버전이므로 전체 리셋을 권장한다.

## 확인 항목

1. `full_reset.sql` 실행 후 smoke test 통과
2. 작업지시서 삭제 시 첨부/메모에 `delete_source = 'workorder_bundle'` 기록
3. 개별 첨부 삭제 시 `delete_source = 'manual'`, `delete_scope = 'single'` 기록
4. 작업지시서 복원 시 묶음 첨부/메모 복원
5. 작업지시서 선택 삭제 시 묶음 첨부/메모도 삭제 요청 상태로 전환
6. 시스템관리자 실제 삭제 후보에서 작업지시서 묶음 후보가 정상 집계
7. 기존 `delete_reason` 기반 데이터도 fallback으로 처리
