# Database Source-of-Truth and Safe Migration Design

Version: 0.24.21.11  
Status: Canonical design; no SQL execution  
Predecessor: `docs/project/27-database-schema-query-permission-audit.md`

## 1. Decision summary

This version converts the 0.24.21.10 audit into an executable-safe design. It does not modify the database. The repository remains on the current schema until read-only reconciliation, deployed-schema comparison, query-plan evidence, and explicit migration approval are complete.

### Canonical source-of-truth matrix

| Domain | Canonical source | Transitional/derived structures | Rule |
| --- | --- | --- | --- |
| User identity | `users` | `users.company_id`, `users.role` are legacy authority candidates | `users` owns identity/profile only; company and role authority moves to canonical membership after migration |
| Company membership | `company_members` | `company_users` | `company_members` owns lifecycle/status and one approved membership per user; `company_users` is compatibility only until runtime references are removed |
| Role/permissions | role template/member permission system | legacy role/permission catalogs | one active permission generation must be selected after code-reference inventory; no dual writes after cutover |
| Plan catalog | `plans` | hard-coded plan code checks | plan code remains unique catalog key; application constants must match catalog |
| Current subscription | `company_subscriptions` | billing/status/limits in `companies`; `company_plan_assignments` | `company_subscriptions` owns customer lifecycle; `company_plan_assignments` may remain system-admin commercial override history, not a competing current subscription |
| Billing evidence | new immutable payment attempt/transaction tables | none | retries, success, refund, provider ids are append-only evidence |
| Workorder core | `spec_sheets` plus detail tables | copied names/categories and lifecycle columns | live relations use IDs; only explicitly historical snapshots remain duplicated |
| Workorder URL | new opaque stable URL id on `spec_sheets` | PK `id` | URL id is identification only; authorization always checks session, tenant, permission, resource state |
| Attachments | `attachments` | `attachment_trash_items` | resource row owns current state; trash table owns deletion job/execution state; no conflicting dual authority |
| PDF current final | `attachments` with generated-document metadata | old final rows | one active latest final PDF per company/workorder/document type; prior final is removed after replacement succeeds |
| Product categories | system catalog + company activation + company custom category | copied labels on workorders | system catalog immutable to customer; company may disable or add custom values |
| Size/POM | versioned size systems and POM templates | ad-hoc JSON/labels | body circumference is source, 1/4 is derived reference, workorder PDF uses finished-garment flat measurements |
| Account deletion | deletion candidate/job + manifest | delete/purge flags scattered across resources | queue/job owns execution; resources expose current state; audit log records result |
| Audit/logging | operational audit/security/payment/deletion logs | customer activity history | retention and visibility differ; raw operational logs are not customer-facing |

## 2. Immediate invariants before any migration

1. A user must not have approved memberships in more than one company.
2. A company must have at most one current subscription.
3. A company must have at most one active plan assignment if assignments remain enabled.
4. `users.company_id` and `users.role` must not be trusted after canonical membership cutover.
5. Every tenant-owned row must resolve to an existing company.
6. Workorder, attachment, trash, PDF, and deletion-job company ids must agree.
7. Active final PDFs must satisfy one-current-final uniqueness.
8. No foreign key or unique constraint is validated until reconciliation returns zero violating rows.

Read-only checks are in `db/audits/0.24.21.11-reconciliation-readonly.sql`.

## 3. Membership migration design

### Target

- `users`: global identity and profile.
- `company_members`: canonical membership lifecycle and role-template reference.
- `company_users`: compatibility projection during migration, then deprecated after all writers/readers are removed.

### Stages

1. Inventory all runtime reads/writes to `users.company_id`, `users.role`, `company_users`, and `company_members`.
2. Run conflict queries for cross-company membership, duplicate approved rows, and role divergence.
3. Choose a deterministic winner only after user review; do not auto-resolve cross-company conflicts.
4. Make application reads prefer `company_members` with compatibility fallback.
5. Stop writes to legacy authority columns/tables.
6. Backfill canonical rows in dev/test.
7. Add/validate uniqueness and consistency constraints.
8. Remove fallback only after one full QA cycle.
9. Physical column/table removal is a later migration, not part of Sprint A.

### Rollback

Keep dual-readable compatibility for one release window. Rollback re-enables legacy reads; no destructive removal occurs in the same migration as canonical cutover.

## 4. Billing migration design

### Target

- `plans`: catalog.
- `company_subscriptions`: current lifecycle and selected plan.
- `company_plan_assignments`: optional system-admin override/history only.
- new immutable `payment_attempts`, `payment_transactions`, and subscription events before PG launch.
- `companies` billing/limit fields become derived cache or are retired after migration.

### Rules

- `plans.code` must be unique.
- one current subscription per company remains enforced.
- company limits are resolved from plan + explicit override; duplicated cached limits require reconciliation.
- provider customer/payment-method ids are unique external references, never raw card data.
- retry milestones 0/3/7/14/21/30 days are events, not booleans added to `companies`.

## 5. Workorder and URL design

- Add an opaque stable URL identifier separate from the primary key.
- Use UUID/ULID-style random generation and a unique index.
- Do not expose sequential or semantic identifiers.
- Authorization remains session + company + permission + resource-state checks.
- Migrate `created_at` and `updated_at` to `timestamptz` only after timezone assumptions are verified.
- Migrate `due_date` from text to `date` only after accepted input formats are inventoried and invalid values are resolved.
- Classify every copied text column as historical snapshot, derived display projection, compatibility field, or removal candidate before changing it.

## 6. Attachment, trash, PDF, and deletion design

### Ownership

- `attachments`: file metadata and current resource state.
- `attachment_trash_items`: deletion job/execution state while pending/restorable/purging.
- immutable audit log: who requested/restored/purged and result.

### Consistency

- at most one open trash item per attachment.
- company/workorder/storage metadata must match between attachment and trash row.
- restore closes the trash item and restores the resource in one transaction.
- final purge occurs only after R2 deletion and reconciliation succeed.
- current final workorder PDF has one active row per company/workorder/document type.
- replacement sequence: generate new object → verify → transactionally mark new current → delete/retire old object → reconcile.

## 7. Constraint strategy

Use staged constraints:

1. read-only reconciliation;
2. cleanup/backfill in dev/test;
3. add FK/check as `NOT VALID` where PostgreSQL supports it;
4. deploy compatible application code;
5. validate constraints;
6. enforce `NOT NULL` only after null count is zero;
7. remove compatibility fields in a later release.

The safe DDL draft is in `db/audits/0.24.21.11-safe-ddl-draft.sql`. It is intentionally commented and must not be run as a migration.

## 8. Index policy

The schema already has 193 explicit indexes. New indexes require:

- an identified production-shaped query;
- predicate/order match;
- duplicate/overlap check;
- `EXPLAIN (ANALYZE, BUFFERS)` on safe dev/test data;
- write/storage impact review.

### High-confidence review candidates

- `company_users` unique definition currently includes role, permitting multiple roles for one company/user. This conflicts with single-role membership policy and should not be changed until reconciliation and canonical-membership cutover.
- `company_members` already has a company/user unique index; approved-cross-company uniqueness needs a user-scoped partial unique index only if policy remains one company per user and data is clean.
- workorder list indexes overlap heavily; retain only query-backed variants after EXPLAIN evidence.
- attachment/trash indexes are extensive; do not add more until lifecycle query plans are measured.
- plan/subscription indexes should follow the chosen canonical model, not preserve all competing sources.

## 9. RLS and tenant isolation

Repository-managed RLS remains unproven. Before introducing RLS:

1. compare deployed schema and policies with repository schema;
2. inventory tenant tables and service-account access paths;
3. define session-to-company context;
4. create read policies first in dev/test;
5. run tenant escape tests;
6. add write policies;
7. retain application-level company guards;
8. stop if background jobs cannot provide explicit tenant context.

RLS is defense in depth, not a replacement for route/repository authorization.

## 10. New structures required before launch

Design candidates, not approved migrations:

- payment method provider reference;
- payment attempts/transactions/refunds/subscription events;
- account termination/deletion queue, resource manifest, notification evidence;
- system categories, company category activation, company custom categories;
- size-system versions, POM definitions, category/POM templates, measurement values;
- explicit generated PDF revision/current-state metadata;
- opaque workorder URL id;
- repository-managed RLS policies or documented external policy source.

## 11. Stop/go gate before 0.24.22 and later migrations

### GO for UI Sprint A

- no DB mutation is required for the selected UI work;
- current APIs remain backward-compatible;
- tenant guards are not weakened;
- DB-dependent features are feature-gated or use existing read contracts.

### STOP for DB implementation

Stop and request explicit approval when any of these occur:

- schema/migration/backfill is required;
- reconciliation returns conflicts or orphans;
- deployed DB differs materially from `full_reset.sql`;
- production data/R2 access is required;
- legacy writer/job cannot be identified;
- rollback cannot preserve compatibility.

## 12. 0.24.22 boundary

0.24.22 remains Codex Sprint A for UI productization. This document prevents Sprint A from silently changing database authority. Any database implementation discovered during Sprint A must be split into a separately approved migration version.
