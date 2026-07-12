# WAFL v2 WorkOrder Create and Basic Update Command Evidence

Version: `2.0.0-alpha.25`
Status: implemented; static, read-only preflight, and explicitly approved dev/test Command runtime verified
Predecessors: `16-workorder-api-command-read-model-contracts.md`, `17-v2-api-contract-test-plan.md`, `19-v2-dev-test-migration-and-performance-evidence.md`, `20-workorder-list-read-api-evidence.md`, `21-workorder-detail-lazy-read-api-evidence.md`

## 1. 목적과 범위

Alpha.25는 v2 WorkOrder Command의 첫 vertical slice다.

- `POST /api/v2/work-orders`: draft WorkOrder와 R0 draft revision 생성.
- `PATCH /api/v2/work-orders/:workOrderId`: current draft revision의 scalar 기본정보 수정.
- tenant RLS, actor, correlation ID, idempotency receipt, optimistic concurrency, append-only domain event를 같은 transaction 경계에서 처리.

이번 범위는 제품명, 제품 분류 code, 시즌, 품목 code, 수량, 납기일, 기본 메모만 다룬다. 대표 이미지, 자산, 원단, 부자재, 사이즈·색상, 치수표, 공정, 발주, revision 발행, 문서번호, Preview, PDF, QR, R2, Worker, 모바일 API 연결은 제외한다.

## 2. 적용 schema 계약

신규 migration이나 schema 변경 없이 적용된 alpha.22/23 구조를 사용한다.

- `work_orders`: `draft`, nullable `current_revision_id`, `entity_version`, nullable document number.
- `work_order_revisions`: R0 `draft`, revision snapshot scalar, single-draft partial unique, immutable finalized guard.
- `work_order_command_receipts`: company/command/idempotency key unique receipt와 request hash/result identity.
- `domain_events`: append-only audit-safe event.
- migration ledger `001~007`과 tenant runtime role/RLS/write grant를 그대로 사용.

표시 문서번호는 생성하지 않는다. 번호 sequence allocator와 generated document/token table은 alpha.25 Command에서 접근하지 않는다.

## 3. DTO와 validation

Create 입력:

- body: `clientRequestId`, `productName`, optional `productTypeCode`, `seasonCode`, `itemCode`, `dueDate`, `totalQuantity`, `memo`.
- header: `Idempotency-Key` 필수.
- `companyId`, `memberId`, `revisionId`, `currentRevisionId`와 unknown field는 거부.

PATCH 입력:

- path의 opaque `workOrderId`.
- body: `clientRequestId`, `expectedVersion`, non-empty `patch`.
- patch 허용 필드는 create scalar와 동일.
- current revision ID는 client가 전달하지 않는다.

공통으로 JSON body는 16KB 이하이며 문자열 길이, ISO date, 정수 수량을 server에서 검증한다. 성공 응답은 bounded `WorkOrderDraftCommandResult`와 `nextVersion`만 반환하고 child collection, storage key, token, snapshot, RLS claim은 반환하지 않는다.

## 4. Tenant와 runtime gate

- 기존 workspace guard가 `workorder.create` 또는 `workorder.update`를 검사하고 session membership에서 company/actor를 얻는다.
- client company scope는 사용하지 않는다.
- repository transaction은 고정 SQL `BEGIN; SET LOCAL ROLE wafl_v2_tenant_runtime`으로 시작한 뒤 local company/member/access/correlation claims를 설치한다.
- production 차단과 approved dev/test fingerprint는 alpha.23 read runtime guard를 재사용한다.
- route loading/invalid-request preflight에는 `WAFL_V2_COMMAND_API_ENABLED=1`만 사용한다.
- 실제 mutation에는 별도 exact value `WAFL_V2_COMMAND_MUTATION_APPROVED=2.0.0-alpha.25-dev-test-command-runtime`가 추가로 필요하다.

Company C는 workspace company-access guard에서 repository 진입 전에 `FORBIDDEN`이다. Cross-company path ID는 company predicate와 RLS로 찾지 못하며 generic `NOT_FOUND`로만 반환한다.

## 5. Create, idempotency, transaction

Create transaction은 다음을 원자적으로 수행한다.

1. tenant claims 설치.
2. `work_order_command_receipts` receipt 선점.
3. `work_orders` draft 생성.
4. `work_order_revisions` R0 draft 생성.
5. current revision 연결.
6. `domain_events` append.
7. receipt에 result WorkOrder/revision/version 기록.

Raw idempotency key는 DB, event, response, log에 저장하지 않는다. 저장 receipt key는 command/company/actor/raw key를 SHA-256으로 scope한 값이다. request hash에는 business payload만 포함한다. 같은 actor/scope/key와 같은 payload는 기존 result를 replay하고, 다른 payload는 typed `409 CONFLICT`이며 추가 mutation이 없다.

## 6. PATCH와 optimistic concurrency

- company/workOrder/assigned visibility로 current WorkOrder와 revision을 `FOR UPDATE` 잠금.
- WorkOrder status와 revision status가 모두 `draft`인지 검사.
- `expectedVersion`이 현재 WorkOrder `entity_version`과 다르면 typed `409 CONFLICT`와 current version 반환.
- 실제 변경 필드가 있을 때 WorkOrder와 revision snapshot을 같은 transaction에서 갱신하고 version을 1회 증가.
- current draft가 아니면 `LOCKED` 또는 `REVISION_MISMATCH`.
- finalized/superseded/completed/issued revision을 직접 수정하지 않는다.
- client가 revision ID를 지정하거나 stale revision으로 우회할 수 없다.

## 7. Audit/history 안전성

Create와 실제 PATCH 성공은 같은 transaction에서 `domain_events`를 append한다.

허용 metadata:

- client request ID.
- 안전한 changed-field 이름 목록.
- version transition.
- revision number.

Event는 actor member, company scope, correlation ID, command code, resource ID, timestamp를 가진다. Raw authentication/idempotency token, DB URL, storage key, signed URL, secret, session claim 전체, document snapshot, before/after 전체 row는 저장하지 않는다. Event insert 실패는 transaction 전체를 rollback한다.

## 8. 정적 및 승인 전 runtime 검증

Canonical static test: `tests/workorder-v2-alpha25-command-api-contract.mjs`.

승인 전 read-only preflight:

```powershell
.\tools\pipeline\peacebypiece-auto-pipeline.ps1 -RunWaflV2Alpha25CommandPreflight -WaflV2Confirmation "VERIFY WAFL V2 ALPHA25 COMMAND PREFLIGHT"
```

이 preflight는 mutation approval이 존재하면 실패한다. 유효한 create/PATCH를 보내지 않고 auth, malformed payload, missing idempotency/expectedVersion, unsupported tenant/revision field, Company C 사전 차단, alpha.23/24 GET 회귀만 확인한다. 전후 migration ledger/schema/WorkOrder/revision/receipt/event count가 같아야 PASS다.

현재 결과: `PASS`.

- approved dev/test fingerprint: `01e5dcc7fea3`.
- runtime log: `OK_Wafl_V2_Alpha25_Command_Preflight_2.0.0-alpha.24-20260712-085501.txt`.
- valid create/PATCH request sent: false.
- Company C pre-mutation `FORBIDDEN`: PASS.
- alpha.23 list and alpha.24 detail/history GET regression: PASS.
- migration ledger: 7/7 unchanged.
- before/after schema, WorkOrder, revision, receipt, event snapshot: identical.
- DB/schema/test-data/business/R2/Worker/PDF/production mutation: all false.

## 9. 승인된 Command runtime 결과

Owner가 승인한 canonical command를 정확히 한 번 실행했다.

```powershell
.\tools\pipeline\peacebypiece-auto-pipeline.ps1 -RunWaflV2Alpha25CommandRuntimeVerification -WaflV2Confirmation "EXECUTE WAFL V2 ALPHA25 COMMAND RUNTIME"
```

Runner는 deterministic receipt가 이미 존재하면 시작 전에 중단한다. 자동 retry, cleanup, reset, rollback, migration, schema/index 변경은 수행하지 않는다.

결과는 `PASS`다.

- target fingerprint: `01e5dcc7fea3`.
- runtime log: `OK_Wafl_V2_Alpha25_Command_Runtime_2.0.0-alpha.24-20260712-090516.txt`.
- retained delta: WorkOrder `+1`, R0 revision `+1`, hashed create receipt `+1`, domain event `+3`.
- PATCH: 같은 WorkOrder에서 기본 PATCH와 concurrency winner PATCH, 총 2개 version transition.
- idempotency: 동일 payload replay는 single effect, 다른 payload 재사용은 typed conflict.
- concurrency: 동일 expectedVersion 경쟁에서 single winner.
- access: Company B/H cross-company 차단, Company C `FORBIDDEN`.
- immutability: finalized revision `LOCKED`.
- regression: alpha.23 list와 alpha.24 detail/history/lazy Read API PASS.
- cleanup/reset/rollback: 정책에 따라 `NOT_RUN`.

## 10. Mutation accounting

- DB migration/schema/index/constraint validation: false.
- dev/test DB test-data/fixture mutation: true; 승인된 synthetic WorkOrder/R0/receipt와 event만 retained.
- business data mutation: false.
- R2/Worker/PDF mutation: false.
- production access/mutation: false.

## 11. 잔여 리스크와 alpha.26 handoff

- 이번 측정은 단일 approved dev/test runtime 증거이므로 production 성능 기준으로 일반화하지 않는다.
- create/replay/update DB 시간은 각각 `715.57ms`, `453.82ms`, `529.44ms`; API 시간은 `1381.97ms`, `606.16ms`, `687.03ms`였다.
- create는 7 statements/1 transaction, replay는 4/1, update는 5/1이다. Alpha.26에서 자재 Command를 추가할 때 bounded statement와 원격 왕복 비용을 다시 측정한다.

Alpha.26 예정 범위는 원단·부자재 Command와 발주 요청/취소/완료이며 alpha.25와 별도 승인 경계를 가진다.
