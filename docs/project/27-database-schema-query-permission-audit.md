# Database Schema, Query, and Permission Audit

Version: 0.24.21.10  
Status: Canonical read-only database audit  
Scope: `db/schema/full_reset.sql`, migrations/seeds/tests, application repositories/routes, tenant guards, indexes, and future policy requirements

## 1. Executive conclusion

The current schema is usable for the existing product, but it contains several overlapping generations of membership, billing, permission, storage, deletion, and workorder structures. The main risk is not a lack of tables; it is multiple competing sources of truth and denormalized compatibility columns that can drift.

This version performs analysis and documentation only. It does not execute SQL, mutate DB/R2, add migrations, delete tables, or change runtime queries.

### Inventory snapshot

- Tables: 60
- Explicit indexes: 193
- Views: 2
- `full_reset.sql` header version: 0.17.29, which is stale relative to the application version
- Repository RLS policy definitions found: none
- Primary tenant control currently depends mainly on application query scope and route/service guards

The absence of repository-managed RLS does not prove the deployed database has no policies, but it means the repository cannot currently reconstruct or verify RLS as part of `full_reset.sql`.

## 2. Highest-risk findings

### 2.1 User and membership source-of-truth overlap — High

The schema contains all of the following:

- `users.company_id` and `users.role`
- `company_users`
- `company_members`
- legacy role/permission tables
- template-based role/permission tables

This permits contradictory states, for example a user whose `users.company_id`, `company_users`, and approved `company_members` company do not agree, or whose role differs between legacy and template systems.

Recommended direction for 0.24.21.11:

1. Select one canonical membership table.
2. Keep identity fields in `users` and remove company/role authority from it after a safe migration.
3. Treat invitation/join-request lifecycle as provisioning inputs, not parallel membership truth.
4. Add explicit invariants and reconciliation queries before any column removal.

No destructive consolidation should occur before code references and real data are audited in the target environment.

### 2.2 Billing and plan source-of-truth overlap — High

Billing state is distributed across:

- `companies.requested_plan_code`, `default_plan_id`, storage/member limits, billing/subscription status, Trial dates
- `company_subscriptions`
- `plans`
- `company_plan_assignments`

The current model can represent different active plans and limits for the same company. `company_subscriptions.plan_code` is also text-based while `company_plan_assignments.plan_id` references `plans`.

Recommended direction:

- `plans`: canonical plan catalog
- one canonical company subscription/assignment record for current lifecycle
- separate immutable billing attempts/transactions
- company-level cached limits only if explicitly derived and reconciled
- one documented precedence rule until migration is complete

### 2.3 Workorder aggregate width and denormalized identity — High

`spec_sheets` has 55 columns and mixes:

- core workorder identity
- category foreign keys and copied category labels
- copied company/user names
- workflow state
- rework/reorder relationships
- inventory summary
- rejection state
- trash/purge lifecycle

This reduces joins but creates synchronization risk. Examples include `company_name`, `category1/2/3`, `manager`, `created_by_role`, and rejection-name snapshots alongside IDs.

Recommended direction:

- preserve immutable display snapshots only where the business explicitly requires historical text
- use foreign keys for live references
- move deletion/purge execution state into a lifecycle/event table if it continues growing
- keep list-read projections as views/materialized projections rather than uncontrolled duplicated columns

### 2.4 Attachment and deletion lifecycle overlap — High

`attachments` contains extensive soft-delete/purge fields while `attachment_trash_items` also models trash state. Workorder deletion has similar fields in `spec_sheets` and separate purge routes.

Risks:

- one resource showing active in one table and trashed in another
- duplicated scheduled purge dates
- partial restore/purge operations
- quota calculations disagreeing with actual R2 state

Recommended direction:

- define one lifecycle owner per resource
- use a deletion job/queue table for execution state
- retain resource tables for current state and immutable audit logs for actions
- reconcile DB metadata and R2 inventory before final deletion

### 2.5 Application-only tenant isolation — High

No `CREATE POLICY` or `ENABLE ROW LEVEL SECURITY` statements were found in the repository schema. Many repositories do apply `company_id` scope, but tenant safety depends on every route and query doing so correctly.

Recommended direction:

- inventory every tenant table and every route/repository access path
- document whether production uses database RLS outside this repository
- if not, introduce RLS in staged migrations after compatibility tests
- keep application-level scope even if RLS is added; use defense in depth

### 2.6 Unconstrained text identifiers — Medium/High

Several columns ending in `_id` are plain text without foreign keys. Some are valid polymorphic/audit snapshots, but others may be missing constraints. Examples include company owner/default plan references, actor/author/manager references, source line references, and deletion parent/batch identifiers.

Each must be classified as one of:

- live relational FK
- immutable snapshot reference
- polymorphic reference with explicit type
- correlation/batch identifier
- obsolete compatibility field

Do not add foreign keys blindly because historical/audit and polymorphic identifiers may intentionally outlive their source rows.

### 2.7 Mixed ID-generation policy — Medium

The schema mixes caller-generated text IDs and `gen_random_uuid()::text`. This can be intentional, but the policy is undocumented and increases collision, URL exposure, and migration complexity.

Recommended policy:

- database-generated UUID/ULID-style IDs for new internal entities
- opaque stable URL identifier for workorders, distinct from access authorization
- external provider IDs stored in separate uniquely constrained columns
- no sequential or semantically meaningful identifier in protected URLs

### 2.8 Mixed timestamp semantics — Medium

Most tables use `timestamptz`, while `spec_sheets.created_at` and `updated_at` use `timestamp without time zone`; `due_date` is text. This can cause timezone and sorting inconsistencies.

Recommended direction:

- persisted instants: `timestamptz`
- calendar-only values: `date`
- avoid text dates except raw import staging
- migrate `due_date` only after all accepted formats and UI behavior are confirmed

### 2.9 Aggregate and inventory tables may be ahead of runtime usage — Medium

The daily/monthly stats tables and some material inventory tables have very few runtime references compared with their schema size. This does not prove they are unused, but they require evidence before being treated as production sources.

Recommended direction:

- identify writers, schedules, and consumers
- mark tables as canonical, derived, experimental, or deprecated
- do not delete until runtime, scripts, tests, and deployed jobs are checked

### 2.10 Index count is already high — Medium

With 193 explicit indexes across 60 tables, the next step is not to add broad indexes indiscriminately. Every additional index increases write, vacuum, migration, and storage cost.

0.24.21.11 must provide query-backed proposals using actual predicates/orderings and, where possible, `EXPLAIN (ANALYZE, BUFFERS)` from a safe non-production dataset.

## 3. Domain-by-domain assessment

| Domain | Current structure | Assessment | 0.24.21.11 action |
| --- | --- | --- | --- |
| Company | `companies`, settings, files, onboarding | core table carries onboarding and billing caches | define canonical ownership of profile/onboarding/billing fields |
| Identity | `users`, `system_users` | customer and system identities are separated, which is useful | retain separation; define global email uniqueness and deletion behavior |
| Membership | `company_users`, `company_members`, invitations, join requests | overlapping lifecycle and authority | choose canonical membership and reconciliation path |
| Permissions | legacy catalogs plus template permissions | parallel permission generations | map active runtime reads/writes before consolidation |
| Billing | companies, subscriptions, plans, assignments | multiple active-source candidates | define plan/subscription source of truth and billing event tables |
| Workorders | `spec_sheets` plus detail tables | very wide aggregate with snapshots | classify columns and move growing lifecycle state out |
| Materials | material masters, attributes, stocks, orders, allocations/lots | capable but partially dormant/complex | verify actual inventory workflow before enabling/merging |
| Files/R2 | attachments, trash, company files, onboarding files | several resource-specific lifecycles | unify lifecycle contract and reconciliation jobs |
| Policies | documents, versions, agreements | reasonable versioned evidence model | retain; verify unique/current-version constraints |
| Audit/history | audit and history logs | purpose boundaries are not fully explicit | define operational audit vs customer activity ownership/retention |
| Statistics | daily/monthly aggregate tables and snapshots | derived data needs writer/readiness evidence | document refresh jobs, idempotency, and anonymization |

## 4. Missing or incomplete structures for confirmed policy

These are requirements to design, not automatic instructions to create one table per bullet.

### Required before payment launch

- payment-provider customer/payment-method token reference
- immutable payment attempt and retry history
- successful transaction/refund evidence
- subscription transition history
- scheduled Trial conversion and dunning milestones

### Required before account deletion automation

- termination/deletion candidate record or job queue
- manual/automatic execution state
- retry/error state
- deletion manifest by resource family
- completion notification evidence
- irreversible anonymization/mapping-removal evidence

### Required for final category and size system

- canonical system product category hierarchy
- company enable/disable state without copying the catalog
- company-created categories
- size-system/version model
- POM/measurement definitions and measurement type
- cm/inch values or canonical-unit conversion policy
- product/category-to-POM template mapping

### Required for PDF lifecycle

Existing `attachments.generated_document_type` may be sufficient, but the following must be explicit:

- current latest final PDF uniqueness
- incomplete vs final document state
- generated-at/source revision
- replacement transaction that deletes the superseded object safely
- R2/DB reconciliation status

### Required for support and operations

- structured inquiry record if in-app inquiry tracking is required
- non-content error-event model or external log sink
- retention class and anonymization status
- incident correlation ID

## 5. Query and join observations

The repository has already split large workorder SQL into multiple read/write flow modules, which is preferable to one monolithic repository. However, schema overlap still forces broad joins and compatibility mapping.

Key audit rules for 0.24.21.11:

1. Measure joins by real endpoint/query, not by table count alone.
2. A join is not inherently bad; inconsistent duplicated state is usually worse.
3. Denormalize only for a documented read projection or immutable historical snapshot.
4. Every duplicated field needs an owner and reconciliation rule.
5. Every tenant query must scope company before resource lookup or use an equivalent secure join.
6. Dynamic SQL/schema-column fallbacks must not silently hide missing migrations in production.

## 6. Safe constraint and index candidates for follow-up

These are candidates only. 0.24.21.10 does not apply them.

- case-insensitive normalized uniqueness for active customer-admin email, aligned with the one-company policy
- one active subscription/plan assignment per company
- unique active latest-final-PDF per workorder/document type
- uniqueness for company/category hierarchy paths where appropriate
- membership uniqueness that does not permit multiple contradictory active roles unless explicitly intended
- missing live-reference foreign keys after classification
- check constraints for lifecycle timestamps and state transitions
- query-backed partial indexes for deletion candidates, payment retry queue, and current active records

## 7. Tables requiring explicit keep/consolidate/deprecate decision

Highest-priority decision sets:

1. `users` vs `company_users` vs `company_members`
2. `role_catalog`/`permission_catalog`/`role_permissions`/`company_user_permissions` vs role-template/member-permission structures
3. company billing columns vs `company_subscriptions` vs `plans`/`company_plan_assignments`
4. `attachments` deletion columns vs `attachment_trash_items`
5. `history_logs` vs `audit_logs`
6. aggregate stats tables and their actual refresh jobs
7. material stock/allocation/lot structures and current product scope

No table in this list is approved for deletion by this audit.

## 8. 0.24.21.11 required deliverables

- canonical source-of-truth matrix
- per-table keep/consolidate/deprecate classification
- PK/FK/unique/check/index proposal with evidence
- safe migration phases and rollback plan
- preflight reconciliation SQL
- dry-run duplicate/orphan/conflict reports
- tenant-isolation/RLS decision and staged plan
- query-specific index proposals
- missing-table DDL proposals for payment, deletion, size/POM, and PDF lifecycle
- explicit stop conditions for destructive or production-dependent work

## 9. Stop conditions

Stop before implementation when any of the following is true:

- deployed production schema differs from `full_reset.sql`
- existing data contains conflicting membership or billing truth
- an ID column's historical/polymorphic behavior is unknown
- a proposed constraint would reject existing records
- a table has external writers/jobs not represented in the repository
- RLS status cannot be verified
- migration requires destructive conversion without backup and rollback evidence

## 10. Audit verdict

Proceed with 0.24.21.11 before Codex Sprint A modifies DB-backed product flows. UI-only Sprint A work can remain planned, but payment, account deletion, default catalog/size, PDF lifecycle, and opaque workorder-ID schema changes should follow the source-of-truth and migration plan produced in 0.24.21.11.
