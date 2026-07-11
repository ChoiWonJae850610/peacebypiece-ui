# WAFL v2 API Contract Test Plan

Version: `2.0.0-alpha.20`
Status: static/compile tests active; DB/API runtime tests planned

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
