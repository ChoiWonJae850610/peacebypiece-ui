# 저장소/휴지통 삭제 상태 DB 구조 리팩토링 설계 — 0.9.22398

## 목적

0.9.22395~0.9.22397에서 고객관리자 휴지통 액션 결과 메시지와 actionFlow 책임을 먼저 정리했다. 0.9.22398에서는 다음 단계의 schema 적용을 위해 삭제/복원/삭제 요청/실제 삭제 상태를 문장 기반이 아니라 코드 기반으로 정리한다.

이번 버전은 설계 문서와 SQL 초안 작성이 목표다. 실제 DB schema 변경은 적용하지 않는다.

## 현재 구조 점검

### spec_sheets

현재 `spec_sheets`는 다음 삭제 관련 컬럼을 가진다.

- `is_active`
- `delete_status`
- `purge_status`
- `purge_requested_at`
- `purged_at`
- `purged_by`
- `deleted_at`

문제점:

1. `delete_status`와 `purge_status`가 역할상 겹친다.
2. `delete_status` check constraint에는 `trashed`, `restored`가 포함되어 있으나, 코드 상수에서는 작업지시서 삭제 상태를 `deleted`로 다루는 부분이 있다.
3. 작업지시서 묶음 삭제인지, 단독 삭제인지 판단할 구조화된 컬럼이 없다.
4. 복원 가능 상태와 시스템관리자 실제 삭제 후보 상태가 `delete_status`, `purge_status`, `deleted_at`, `purged_at`의 조합으로 흩어져 있다.

### attachments

현재 `attachments`는 다음 삭제 관련 컬럼을 가진다.

- `is_active`
- `deleted_at`
- `deleted_by`
- `delete_reason`
- `purge_after_at`

문제점:

1. `delete_reason`에 정책 의미가 들어간다.
2. 작업지시서 삭제로 함께 휴지통 이동한 파일인지 단독 삭제 파일인지 `delete_reason` 문장 비교로 판단한다.
3. 고객용 문장이 DB 상태값처럼 사용될 수 있는 구조다.
4. `attachments` 자체에는 `delete_status`, `purge_status`가 없고, purge 상태는 `attachment_trash_items`에 분산되어 있다.

### attachment_trash_items

현재 `attachment_trash_items`는 파일 휴지통 snapshot 및 purge queue 역할을 같이 한다.

- `attachment_id`
- `order_id`
- `storage_key`
- `thumbnail_key`
- `deleted_by`
- `delete_reason`
- `deleted_at`
- `purge_after_at`
- `restored_at`
- `restored_by`
- `purged_at`
- `purge_status`
- `purge_attempt_count`
- `last_purge_attempt_at`
- `last_purge_error`

문제점:

1. 원본 `attachments.delete_reason`과 `attachment_trash_items.delete_reason`이 중복된다.
2. 작업지시서 묶음 삭제 파일 판정이 `delete_reason` 문장 비교에 의존한다.
3. purge queue 성격과 휴지통 표시 snapshot 성격이 섞여 있다.

### memos

현재 `memos`는 다음 삭제 관련 컬럼을 가진다.

- `is_active`
- `delete_status`
- `purge_status`
- `purge_requested_at`
- `purged_at`
- `purged_by`
- `deleted_at`

문제점:

1. 작업지시서 묶음 삭제 메모와 단독 삭제 메모를 구분할 구조화된 컬럼이 없다.
2. 첨부파일과 같은 delete source/scope 기준이 없다.
3. parent memo 삭제 정책과 purge 정책을 구분해서 추적하기 어렵다.

## 삭제 상태 표준안

### delete_status

삭제 생명주기에서 고객관리자 휴지통 표시와 복원 가능 여부를 판단하는 상태다.

허용값:

- `active`: 정상 항목
- `trashed`: 고객관리자 휴지통에 있는 항목
- `purge_requested`: 고객관리자가 선택 삭제를 눌러 시스템관리자 실제 삭제 대기 상태가 된 항목
- `purged`: 시스템관리자가 실제 삭제를 완료한 항목

`restored`는 상태값으로 유지하지 않는다. 복원되면 `active`로 돌아가고, 복원 이력은 `restored_at`, history log 또는 별도 audit에서 다룬다.

### delete_source

삭제가 발생한 원인을 코드로 저장한다.

허용값:

- `manual`: 사용자가 파일/메모/작업지시서를 단독 삭제
- `workorder_bundle`: 작업지시서 삭제로 하위 문서/디자인/메모가 함께 휴지통 이동
- `system`: 시스템 또는 migration에 의한 삭제 상태 보정

### delete_scope

삭제 단위를 코드로 저장한다.

허용값:

- `single`: 단독 삭제
- `bundle`: 작업지시서 묶음 삭제

### delete_parent_type

삭제가 상위 객체에 의해 발생했는지 표시한다.

허용값:

- `none`: 상위 삭제 없음
- `workorder`: 작업지시서 삭제에 따른 하위 항목 삭제

### delete_parent_id

`delete_parent_type = 'workorder'`인 경우 상위 작업지시서 ID를 저장한다. 단독 삭제일 때는 `NULL`이다.

### delete_batch_id

같은 삭제 액션으로 묶인 항목을 추적하기 위한 ID다. 작업지시서 1건과 하위 문서/디자인/메모가 한 번에 삭제되면 같은 `delete_batch_id`를 가진다.

### purge_status

시스템관리자 실제 삭제 단계의 상태다.

허용값:

- `none`: 실제 삭제 요청 없음
- `requested`: 고객관리자가 삭제 요청함
- `processing`: 시스템관리자 또는 purge worker 처리 중
- `failed`: 실제 삭제 실패. 재시도 후보
- `purged`: 실제 삭제 완료

기존 `purge_requested`는 길고 중복된 상태명이므로 신규 표준에서는 `requested`로 줄인다. 다만 migration 과정에서는 legacy fallback을 둔다.

### purge 관련 컬럼

공통 권장 컬럼:

- `purge_requested_at`
- `purge_requested_by`
- `purged_at`
- `purged_by`
- `purge_failure_code`
- `purge_failure_message`
- `purge_attempt_count`
- `last_purge_attempt_at`

## 테이블별 적용안

### spec_sheets

추가 또는 정리 대상:

- `delete_source`
- `delete_scope`
- `delete_parent_type`
- `delete_parent_id`
- `delete_batch_id`
- `purge_requested_by`
- `purge_failure_code`
- `purge_failure_message`
- `purge_attempt_count`
- `last_purge_attempt_at`

정리 대상:

- `delete_status`: `active | trashed | purge_requested | purged`로 통일
- `purge_status`: `none | requested | processing | failed | purged`로 통일

### attachments

추가 또는 정리 대상:

- `delete_status`
- `delete_source`
- `delete_scope`
- `delete_parent_type`
- `delete_parent_id`
- `delete_batch_id`
- `purge_status`
- `purge_requested_at`
- `purge_requested_by`
- `purged_at`
- `purged_by`
- `purge_failure_code`
- `purge_failure_message`
- `purge_attempt_count`
- `last_purge_attempt_at`

`delete_reason`은 `legacy_delete_reason`으로 남겨 migration fallback에만 사용한다. 신규 코드에서는 고객용 문장 또는 정책 문장을 저장하지 않는다.

### attachment_trash_items

단기적으로는 유지한다. 이유는 R2 purge 후보 조회와 파일 휴지통 snapshot 역할이 이미 이 테이블을 기준으로 구성되어 있기 때문이다.

정리 방향:

1. `delete_reason`은 `legacy_delete_reason`으로 전환한다.
2. `delete_source`, `delete_scope`, `delete_parent_type`, `delete_parent_id`, `delete_batch_id`를 추가한다.
3. `purge_status`는 신규 표준값으로 전환한다.
4. 장기적으로는 `attachments`가 source of truth가 되고, `attachment_trash_items`는 purge queue/snapshot 전용으로 축소한다.

### memos

추가 또는 정리 대상:

- `delete_source`
- `delete_scope`
- `delete_parent_type`
- `delete_parent_id`
- `delete_batch_id`
- `purge_requested_by`
- `purge_failure_code`
- `purge_failure_message`
- `purge_attempt_count`
- `last_purge_attempt_at`

메모는 R2 객체가 없으므로 purge worker 대상은 아니지만, 작업지시서 삭제/복원/선택 삭제 정책상 동일한 상태 모델을 가져야 한다.

## 판정 로직 전환 기준

### 현재 방식

```ts
reason === "작업지시서 삭제로 함께 휴지통 이동"
```

### 변경 방식

```ts
deleteSource === "workorder_bundle"
deleteScope === "bundle"
deleteParentType === "workorder"
deleteParentId === workOrderId
```

## 고객관리자 UI 문구 원칙

DB에는 고객용 문장을 저장하지 않는다.

예:

- DB: `delete_source = 'workorder_bundle'`
- UI: `작업지시서 삭제로 함께 이동된 문서`

고객관리자 화면의 결과 메시지는 presentation formatter에서만 생성한다.

- `작업지시서 n건과 문서 n개, 디자인 n개, 메모 n개를 복원하였습니다.`
- `작업지시서 n건과 문서 n개, 디자인 n개, 메모 n개를 삭제 요청하였습니다.`

## migration SQL 초안

> 주의: 아래 SQL은 이번 버전에서 적용하지 않는다. 0.9.22399 또는 별도 schema 적용 버전에서 full_reset.sql, smoke test와 함께 반영한다.

```sql
-- 1) 공통 상태 컬럼 추가: spec_sheets
ALTER TABLE spec_sheets
  ADD COLUMN IF NOT EXISTS delete_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS delete_scope text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS delete_parent_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS delete_parent_id text,
  ADD COLUMN IF NOT EXISTS delete_batch_id text,
  ADD COLUMN IF NOT EXISTS purge_requested_by text,
  ADD COLUMN IF NOT EXISTS purge_failure_code text,
  ADD COLUMN IF NOT EXISTS purge_failure_message text,
  ADD COLUMN IF NOT EXISTS purge_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purge_attempt_at timestamptz;

-- 2) 공통 상태 컬럼 추가: attachments
ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS delete_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS delete_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS delete_scope text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS delete_parent_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS delete_parent_id text,
  ADD COLUMN IF NOT EXISTS delete_batch_id text,
  ADD COLUMN IF NOT EXISTS purge_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS purge_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS purge_requested_by text,
  ADD COLUMN IF NOT EXISTS purged_at timestamptz,
  ADD COLUMN IF NOT EXISTS purged_by text,
  ADD COLUMN IF NOT EXISTS purge_failure_code text,
  ADD COLUMN IF NOT EXISTS purge_failure_message text,
  ADD COLUMN IF NOT EXISTS purge_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purge_attempt_at timestamptz;

-- 3) legacy 문장 컬럼 보존
ALTER TABLE attachments
  RENAME COLUMN delete_reason TO legacy_delete_reason;

-- 4) attachment_trash_items 구조화
ALTER TABLE attachment_trash_items
  ADD COLUMN IF NOT EXISTS delete_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS delete_scope text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS delete_parent_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS delete_parent_id text,
  ADD COLUMN IF NOT EXISTS delete_batch_id text,
  ADD COLUMN IF NOT EXISTS purge_requested_by text,
  ADD COLUMN IF NOT EXISTS purged_by text,
  ADD COLUMN IF NOT EXISTS purge_failure_code text,
  ADD COLUMN IF NOT EXISTS purge_failure_message text;

ALTER TABLE attachment_trash_items
  RENAME COLUMN delete_reason TO legacy_delete_reason;

-- 5) memos 구조화
ALTER TABLE memos
  ADD COLUMN IF NOT EXISTS delete_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS delete_scope text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS delete_parent_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS delete_parent_id text,
  ADD COLUMN IF NOT EXISTS delete_batch_id text,
  ADD COLUMN IF NOT EXISTS purge_requested_by text,
  ADD COLUMN IF NOT EXISTS purge_failure_code text,
  ADD COLUMN IF NOT EXISTS purge_failure_message text,
  ADD COLUMN IF NOT EXISTS purge_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purge_attempt_at timestamptz;

-- 6) 기존 문장 기반 작업지시서 묶음 삭제 데이터를 구조화된 코드로 보정
UPDATE attachments
   SET delete_source = 'workorder_bundle',
       delete_scope = 'bundle',
       delete_parent_type = 'workorder',
       delete_parent_id = order_id
 WHERE legacy_delete_reason = '작업지시서 삭제로 함께 휴지통 이동';

UPDATE attachment_trash_items
   SET delete_source = 'workorder_bundle',
       delete_scope = 'bundle',
       delete_parent_type = 'workorder',
       delete_parent_id = order_id
 WHERE legacy_delete_reason = '작업지시서 삭제로 함께 휴지통 이동';
```

## full_reset 반영 필요 여부

실제 schema 적용 버전에서는 `db/schema/full_reset.sql` 반영이 필요하다.

반영 대상:

1. `spec_sheets`
2. `attachments`
3. `attachment_trash_items`
4. `memos`
5. 관련 check constraint
6. 관련 index

## smoke test 추가 필요 항목

`db/schema/full_reset_smoke_test.sql`에 다음 컬럼 존재 확인을 추가한다.

- `spec_sheets.delete_source`
- `spec_sheets.delete_scope`
- `spec_sheets.delete_batch_id`
- `attachments.delete_status`
- `attachments.delete_source`
- `attachments.delete_scope`
- `attachments.delete_batch_id`
- `attachments.purge_status`
- `attachment_trash_items.delete_source`
- `attachment_trash_items.delete_scope`
- `attachment_trash_items.delete_batch_id`
- `memos.delete_source`
- `memos.delete_scope`
- `memos.delete_batch_id`

## 다음 버전 적용 순서

1. full_reset.sql에 신규 컬럼과 constraint 반영
2. full_reset_smoke_test.sql에 컬럼 존재 검사 추가
3. legacy migration SQL 작성
4. trashPolicy.ts에 구조화된 delete source/scope 상수 추가
5. serverActions/storagePurgeCandidates에서 `delete_reason` 비교 제거
6. `legacy_delete_reason` fallback은 한두 버전만 유지
7. 고객관리자/시스템관리자 휴지통 회귀 테스트

## 이번 버전 완료 기준

- 삭제 상태 표준값 확정
- `delete_reason`을 정책 판정값으로 쓰지 않는 방향 확정
- 실제 schema 적용은 다음 버전으로 분리
- DB에는 고객용 문장을 저장하지 않는 기준 확정
