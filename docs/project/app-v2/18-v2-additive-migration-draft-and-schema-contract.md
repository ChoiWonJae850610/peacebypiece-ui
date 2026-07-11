# WAFL v2 Additive Migration Draft and Schema Contract

Version: `2.0.0-alpha.21`
Status: `LEVEL_2_STATIC_VERIFIED` target; SQL draft only, never applied in alpha.21
Predecessors: `13-core-domain-schema-v2.md`, `16-workorder-api-command-read-model-contracts.md`, `17-v2-api-contract-test-plan.md`

## 1. Result boundary

Alpha.21 converts the alpha.20 WorkOrder type/API contract into six ordered PostgreSQL migration drafts under `db/v2/migrations/`. These files are executable only after a later approved dev/test runner sets both explicit session gates. Alpha.21 does not connect to Neon, execute SQL, create a schema, validate constraints, seed data, or run a benchmark.

The legacy/current baseline remains unchanged:

- `db/schema/`
- `db/migrations/`
- `db/audits/`
- `db/seed/`
- `db/test/`

## 2. Ordered draft set

| Order | File | Responsibility |
| --- | --- | --- |
| 001 | `001_v2_tenant_document_number_foundation.sql` | dev/test execution gate, tenant/RLS claim helpers, company code/timezone additions, atomic daily document sequence |
| 002 | `002_v2_work_orders_revisions.sql` | WorkOrder identity, immutable revision, entity version, idempotency receipt |
| 003 | `003_v2_revision_content.sql` | revision-scoped materials, colors, sizes, quantity matrix, size spec, actual processes |
| 004 | `004_v2_assets_revision_linkage.sql` | current image/attachment metadata and immutable revision asset linkage |
| 005 | `005_v2_documents_access_events.sql` | generated document snapshot, hash-only opaque access token metadata, domain events |
| 006 | `006_v2_deferred_constraints_indexes.sql` | tenant-consistent composite FKs, `NOT VALID` rollout, list/tab/document/history indexes |

Each file starts with an alpha.21 execution prohibition. Migration 001 checks `wafl.runtime_environment` and `wafl.migration_execution_approved`; later files call the guard function. Production and direct Neon SQL Editor execution are not normal or authorized paths.

## 3. API contract to schema map

| Alpha.20 contract | Alpha.21 schema draft |
| --- | --- |
| `WorkOrderId`, `WorkOrderRevisionId` | `work_orders.id uuid`, `work_order_revisions.id uuid` |
| authenticated `CompanyId` scope | direct `company_id text`, company-consistent composite FK, RLS claim helper |
| `EntityVersion`, `expectedVersion` | `entity_version integer` on work order/revision and mutable detail rows; command SQL must compare before increment |
| idempotent issue/complete | `work_order_command_receipts` keyed by company, command, and idempotency key with request hash |
| immutable finalized revision | revision status/checks plus `work_order_revisions_immutable_guard` trigger |
| decimal/date DTO primitives | `numeric`, `date`, `timestamptz`; API serialization remains decimal string/ISO |
| readiness | relational due date, quantity, representative image, material/accessory/process state; canonical readiness remains server domain logic |
| bounded list/cursor | active recent/status/due indexes using company plus stable `(updated_at, id)` ordering |
| tab lazy read | revision/material/process/asset/document ordering indexes; no whole WorkOrder JSON aggregate |
| display document number | company business timezone, atomic daily sequence row, immutable base/snapshot fields |
| opaque QR/access | `document_access_tokens.token_hash`, expiry, revoke, rotation; no raw token column |
| generated document snapshot | immutable `generated_documents` metadata, hash, renderer/schema version, JSON snapshot |
| audit/history | `domain_events` with correlation, command, actor, safe metadata and privileged reason |

## 4. Cursor and query contract

The default list order remains `(updated_at DESC, id DESC)` within authenticated company scope. SQL draft indexes support:

- recent active page,
- status-filtered page,
- due-date page,
- trash/purge candidates,
- revision/material/process/asset order,
- latest generated document,
- domain event history.

The schema does not authorize offset pagination, unbounded child aggregation, `SELECT *`, or row-by-row child queries. API list defaults remain 30 and maximum 50. Payload and query budgets remain those in document 16 until alpha.22 measurement.

## 5. Concurrency and idempotency

Document sequence allocation uses one `(company_id, business_date)` row with `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING`. `max()+1` is prohibited.

The future command repository must:

1. lock or conditionally update the target work order using `expectedVersion`,
2. reject a version mismatch as `CONFLICT`,
3. increment and return `nextVersion`,
4. store one idempotency receipt for issue/completion effects,
5. reject reuse of the same idempotency key with a different request hash.

No command repository or API route is implemented in alpha.21.

## 6. Tenant and RLS draft

Every new tenant-owned table carries direct `company_id`. Tenant policies compare row company to `wafl.company_id`. The privileged-system policy is separate and requires:

- `wafl.access_mode = privileged_system`,
- exact target company,
- system actor ID,
- privileged reason,
- correlation ID.

This is a schema gate, not permission completion. Alpha.22 must prove company A cannot read or mutate company B, child rows cannot cross company boundaries, and privileged operations create a matching audit event. Service-role bypass is not a normal customer API path.

## 7. Constraint rollout

Composite tenant FKs are declared `NOT VALID` in draft 006. Alpha.22 order is:

1. approved dev/test migration apply,
2. read-only orphan/company mismatch reconciliation,
3. parent identity constraint validation,
4. revision child/asset/document constraint validation,
5. RLS and privileged-path tests,
6. only then performance seed and benchmark.

No `VALIDATE CONSTRAINT`, backfill, cleanup, or destructive statement runs in alpha.21.

## 8. Static evidence

`tests/workorder-v2-migration-schema-contract.mjs` verifies:

- exact six-file order,
- alpha.21 execution gate,
- additive-only SQL,
- absence of drop/truncate/destructive delete/rename,
- absence of raw token columns and `max()+1`,
- company scope and RLS registry,
- immutable revision/document triggers,
- idempotency/version/token/index contracts,
- `NOT VALID` without active validation,
- no changes under legacy DB, `app/api`, Cloudflare, or root package/lock paths.

The existing alpha.20 WorkOrder type/static contract remains active and allows alpha.21 SQL only under `db/v2/migrations/`.

The `automation-infrastructure` pipeline profile runs both WorkOrder contracts. Its migration allowlist is version-bound to `2.0.0-alpha.21` and contains the exact six paths above. Finish applies the same expected-version and exact-path rule. This is a source-delivery guard only; it does not add a migration execution command or PowerShell menu.

## 9. Alpha.22 gate

Alpha.22 may begin only with a separate explicit work order and owner approval. Its scope is limited to an approved Neon dev/test branch:

- migration apply and rollback rehearsal,
- post-apply read-only audit,
- tenant/RLS isolation,
- cursor traversal and concurrent document sequence allocation,
- optimistic concurrency and idempotency,
- deterministic 500/5,000 WorkOrder seed,
- query count, payload, p50/p95, and index-plan evidence.

Production migration, production data, Full Reset, R2/PDF mutation, and API cutover remain forbidden.
