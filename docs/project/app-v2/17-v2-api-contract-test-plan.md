# WAFL v2 API Contract Test Plan

Version: `2.0.0-alpha.21`
Status: alpha.20/21 static contracts and alpha.22 approved dev/test DB runtime evidence active

## 1. Purpose

This plan validates the WorkOrder v2 contract before migration or route implementation. It separates alpha.20 repository-static evidence from alpha.21 SQL draft validation and alpha.22 dev/test runtime evidence.

## 2. Alpha.20 tests

### TypeScript compile

Target:

- `lib/domain/work-orders/contracts/*.ts`.
- `tests/workorder-v2-contract.compile.ts`.

Assertions:

- strict compile.
- command bodies omit `companyId`.
- list item omits full images/attachments/materials.
- decimal/date/cursor/version branded types are usable.
- error code union includes conflict and tenant boundaries.

Command: root `npx tsc --noEmit`.

### Static contract

Test: `tests/workorder-v2-api-contract.mjs`.

Assertions:

- required contract files and exports exist.
- `any` and unbounded `Record<string, unknown>` are absent.
- default/max page limits are 30/50.
- required list/detail/tab/command/error/state contracts exist.
- public read models contain no storage key or raw token.
- privileged system scope is separate and audit-required.
- no `app/api` runtime file imports alpha.20 contracts.
- `db/v2` contains no SQL.

### Document structure

- docs 15/16/17 links resolve.
- Mermaid fence and sequence syntax are statically checked.
- db/v2 child README links resolve.
- Korean/Unicode contract passes.

## 3. Pagination contract

Alpha.21 static fixtures:

- default 30, max 50.
- cursor encodes sort tuple without exposing raw internals.
- invalid signature/version returns `CURSOR_INVALID`.
- sort uses `(updated_at,id)` tie-break.

Alpha.22 dev/test:

- traverse all pages at 500 and 5,000 rows.
- no duplicate/missing ID.
- concurrent update behavior is documented.
- tenant filter applies before cursor range.
- last page returns null cursor and `hasMore=false`.

## 4. Error envelope contract

Static:

- every error has code/message/retryable/correlationId.
- field errors and entity version are optional and typed.
- DB error/raw SQL/stack/token fields are absent.

Runtime later:

- HTTP 400 validation/cursor/limit.
- 401 auth required.
- 403 explicit permission denial.
- 404 missing/cross-company opaque resource.
- 409 version/state/revision conflict.
- 423-style semantics remain represented by 409 or 423 only after API policy choice; current code is `LOCKED`.
- 429 rate limited.
- 500 sanitized internal error.

## 5. State transition contract

Static fixtures cover:

- work order draft -> ready -> issued.
- completed -> revised creates a new draft revision.
- finalized/completed revision is never reopened.
- material editing -> requested -> completed.
- requested material cancellation requires reason and returns to editing through a separate command.
- process completed has no reopen command.
- document pending -> generated/failed; generated -> revoked -> deleted.

Forbidden transitions must fail before repository mutation and emit an audit-safe error.

## 6. Optimistic concurrency and idempotency

Alpha.21 service contract draft:

- mutation requires `expectedVersion`.
- SQL update predicates include current version.
- zero updated rows resolves to 409 conflict, not not-found without tenant recheck.

Alpha.22 runtime:

- two clients patch same version; one succeeds, one gets conflict.
- response returns `nextVersion`.
- retry with same idempotency key produces one issue/order/process/document effect.
- same key with different payload is rejected.

## 7. Tenant and RLS

Alpha.21 SQL contract:

- every tenant table has company ownership.
- RLS enabled and policy draft present.
- tenant policy uses authenticated company claim.
- privileged system policy/path is separate.
- service role use is documented and bounded.

Alpha.22 dev/test matrix:

- company A cannot list/read/update/delete company B.
- child ID from B cannot be attached to A parent.
- assigned member visibility is enforced.
- customer admin still remains tenant-scoped.
- system-admin privileged access requires actor/reason/correlation and writes audit event.
- missing privileged audit causes command failure.

Production migration is blocked until all RLS tests pass.

## 8. Readiness

Static fixtures:

- each hard blocker and warning code is represented.
- client preview is distinguishable from server canonical result.

Runtime later:

- representative image, total quantity, matrix sum, material, accessory state, due date, and partner gates.
- issue uses server result for the same expected entity version.
- stale client preview cannot bypass issue.
- warning-only work can issue when policy allows.

## 9. Document number, revision, and QR

Alpha.21 static/schema contract:

- company/date sequence and company timezone setting.
- unique base number and `(work_order_id,revision_no)`.
- no `max()+1` allocator.
- finalized revision immutable.
- code snapshot fields on revision.
- token hash, expiry, revoke fields; raw token column absent.

Alpha.22 dev/test:

- concurrent issue allocates distinct sequential numbers.
- R2 finalized documents R0/R1/R2 all remain addressable by authorized history.
- code changes do not alter prior number.
- completed R2 correction creates R3 draft.
- token revoke/rotate/expire behavior.
- work order trash revokes access; 30-day purge candidate includes documents.

## 10. Payload and query budget

Static:

- list DTO forbidden-field scanner.
- no whole WorkOrder command.
- cell batch max 250.
- list limit max 50.

Alpha.22 benchmark:

| Target | Gate |
| --- | --- |
| list query count | <= 3 |
| detail header query count | <= 3 |
| each tab query count | <= 3 |
| list 30 payload | <= 150KB uncompressed |
| list 50 payload | <= 200KB uncompressed |
| 500-row list DB p95 | <= 100ms |
| 5,000-row list DB p95 | <= 200ms |
| detail + selected tab DB p95 | <= 250ms |
| indexed search DB p95 | <= 250ms |

Regression scanners reject:

- `SELECT *` in v2 list/read repositories.
- unbounded list query.
- full material/attachment/process JSON aggregation.
- row-by-row child query.
- full child collection delete/reinsert.
- original file/storage metadata in list DTO.

## 11. Alpha.21 gate

Before SQL draft review completes:

- alpha.20 compile/static contracts PASS.
- docs and db/v2 boundaries accepted.
- migration is additive and bounded.
- RLS policy draft included.
- no DB apply command runs.
- compatibility/read-only audit draft exists.
- rollback/feature flag stance documented.

Active alpha.21 test: `tests/workorder-v2-migration-schema-contract.mjs`.

It verifies exact migration order, execution gates, additive-only SQL, tenant company scope, RLS policy separation, immutable revision/document guards, atomic sequence allocation, hash-only access tokens, deferred tenant constraints, and required query indexes. It also rejects changes under legacy DB paths, `app/api`, Cloudflare, and root package/lock files.

## 12. Alpha.22 gate

Before any production proposal:

- approved Neon dev/test branch only.
- migration apply PASS.
- post-apply audit zero critical mismatch.
- tenant/RLS tests PASS.
- 500/5,000 seed and benchmark PASS.
- cursor, conflict, idempotency, readiness, document number tests PASS.
- DB/R2 cleanup and rollback rehearsal evidence.
- no production data or production mutation.

Alpha.22 actual result:

- migration ledger 6/6 and v1 baseline unchanged.
- RLS 20/20, deferred FK precondition issues 0, critical mismatch 0.
- deterministic WorkOrders: 500 + 5,000 + 5,400 multi-tenant.
- cursor duplicate/missing 0; concurrency, idempotency, readiness, revision, privileged audit, and document sequence PASS.
- list p95 81.56ms at 500 and 78.88ms at 5,000; detail/tab max 148.74ms; indexed search p95 max 79.01ms.
- list 30/50 payload max 13,981/23,311 bytes.
- cleanup and rollback rehearsal were not run because the explicit alpha.22 owner instruction prohibited cleanup, reset, and rollback SQL. Persistent data is synthetic `wafl-fn` dev/test evidence only.

## 13. PowerShell follow-up

No menu is added in alpha.20. Future candidates:

| Candidate | Classification | Confirmation/environment |
| --- | --- | --- |
| V2 Schema Contract Validate | read-only/safe | none |
| V2 Migration Validate | read-only/safe | none |
| V2 Dev/Test Migration Apply | mutation | dev/test + confirmation |
| V2 Post-Apply Audit | read-only | target environment approval |
| V2 Dev/Test Full Reset | destructive | dev/test + exact explicit confirmation |
| V2 Performance Seed 500/5000 | mutation | dev/test + explicit confirmation |

Menu numbers are assigned only after collision review in alpha.21~22.

## 14. Alpha.20 expected result

- TypeScript compile: PASS.
- static WorkOrder v2 contract: PASS.
- DB/API/route runtime: NOT_RUN by design.
- migration/Neon/RLS execution: NOT_RUN by design.
- performance benchmark: NOT_RUN by design.

## 15. Alpha.23 list Read API gate

- Static contract verifies exact GET-only route, canonical DTO reuse, 30/50 limits, signed/expiring tenant-bound cursor, typed errors, dev/test fingerprint guard, read-only transaction, RLS role/claims, page-first SQL, and forbidden list fields/query shapes.
- Runtime uses the built local Next server and authenticated synthetic company sessions for A/H/B/C.
- Company A must never observe H/B/C rows, IDs, or cursor position. Cross-company cursor reuse returns `CURSOR_INVALID`; unsupported company/workOrder ID query parameters return `VALIDATION_ERROR`.
- 500 and 5,000 traversal must return 10 and 100 pages at limit 50, duplicate 0 and missing 0.
- Repository query count must be at most 3. Payload budgets remain 150KB for default 30 and 200KB for 50.
- DB and API p50/p95/max are recorded. DB p95 budgets remain 100ms at 500 and 200ms at 5,000; API server p95 remains 500ms excluding remote client network.
- Before/after schema fingerprint and v2 row counts must be identical. Schema, seed, business, R2, Worker, PDF, and production mutation are all false for alpha.23.
- Failure creates a failure handoff and stops; retry needs owner approval. Success evidence is recorded in document 20.

## 16. Alpha.24 detail and lazy Read API gate

- Core detail returns only header, current revision, amounts, representative metadata, tab counts, readiness, document summary, and version.
- Materials/assets/documents/history use default/max 30/50 signed cursors bound to company, visibility, WorkOrder, and tab kind.
- Size-color, size-spec, processes, assets, documents, and history each read only their own tab data; core does not eager-load child collections.
- Missing and cross-company IDs return identical `NOT_FOUND`; company C remains `FORBIDDEN`; unauthenticated access remains `AUTH_REQUIRED`.
- Repository callback statement count is 2 and is documented separately from endpoint protocol calls.
- Every core/tab DB p95 remains <= 250ms. API p50/p95/max and over-500ms outliers are logged before assertions.
- Before/after schema fingerprint and row counts remain identical. Schema, seed, business, R2/Worker/PDF, and production mutation are false.
- Runtime success evidence is recorded in document 21. Failure preserves a handoff and never changes `4. Newest`.

## 17. Alpha.25 and alpha.26 Command gates

Alpha.26 adds a static material/order gate: shared fabric/accessory DTOs, bounded decimals, final derived-amount overflow validation, tenant-safe material/supplier references, exact permissions, fixed tenant transaction, hashed receipts, expectedVersion, append-only events, and no hard DELETE. It permits only `editing -> requested` and `requested -> cancelled|completed`; direct status PATCH and completed rollback are rejected. Its read-only preflight must prove target fingerprint, ledger 7/7, invalid/auth/Company C denial, alpha.23~25 read regression, and identical snapshots without valid mutation. Separately approved synthetic runtime and APP_VERSION alpha.26 remain blocked until that preflight passes.

## 18. Alpha.27 revision issue gate

- Static: POST-only route, bounded DTO, forbidden client-owned fields, exact approval, fixed tenant role/RLS, atomic allocator, unique base, dual expected versions, receipt/event, immutable revision/children, and no next draft/document/PDF/QR/R2.
- Preflight: exact fingerprint, ledger `7/7`, schema privileges, issuable synthetic target, required fields/materials, document number absent, Company B/H `NOT_FOUND`, Company C `FORBIDDEN`, alpha.23-26 Read regression, and unchanged counts.
- Approved runtime: one issue effect under concurrent requests, one base number, one receipt/event, no new revision row, WorkOrder/revision `+1/+1`, replay same result, payload conflict, tenant isolation, immutable scalar/material Commands, and bounded completion ledger.
- Failure never authorizes automatic write replay, cleanup/reset/rollback, migration, or another index/number attempt.

### Alpha.25 create/basic update

- Static contract verifies the exact POST/PATCH routes, bounded scalar DTO, unknown company/member/revision field rejection, required Idempotency-Key/expectedVersion, fixed tenant write role, receipt hashing, one transaction, current-draft lock, typed conflict, append-only safe event, and no document/material/process command expansion.
- Owner approval 전 preflight는 valid create/PATCH를 보내지 않는다. Auth, malformed/unsupported fields, missing key/version, Company C pre-mutation denial, alpha.23/24 GET regression, and identical before/after ledger/schema/row counts만 확인한다.
- Owner approval 후에만 Company A synthetic draft 1개 create/update, same-key replay/different-payload conflict, competing PATCH single winner, finalized/cross-tenant denial, history/read-model reflection, and performance/mutation ledger를 검증한다.
- Cleanup/reset/rollback은 실행하지 않는다. Schema/index/migration, business data, R2/Worker/PDF, production mutation은 모두 false여야 한다.
- Runtime success evidence is recorded in document 22. Approval 전에는 APP_VERSION alpha.25 확정, commit/push/Finish, `4. Newest` 변경을 하지 않는다.
