# WAFL v2 Dev/Test Migration and Performance Evidence

Version: `2.0.0-alpha.22`
Status: `LEVEL_2_STATIC_VERIFIED` plus approved dev/test DB runtime evidence
Target fingerprint: `01e5dcc7fea3` (host/database SHA-256 prefix only; no URL or credential)

## 1. Boundary

Alpha.22 applied the reviewed `db/v2/migrations/001` through `006` sequence only to the approved development/test Neon target. The canonical PowerShell runner loaded the local connection secret without printing it and required:

- an allowlisted development/test runtime,
- the approved connection fingerprint,
- the canonical `wafl-fn` fixture prefix,
- an exact operation-specific confirmation phrase,
- a non-superuser migration owner,
- a dedicated `NOLOGIN`, `NOBYPASSRLS` tenant runtime role for RLS evidence.

Production DB, R2, Worker, PDF, API binding, business data, Full Reset, cleanup, destructive rollback SQL, and legacy v1 migration files were not accessed or changed.

## 2. Migration result

| Item | Result |
| --- | --- |
| Ordered migrations | `001` through `006` PASS |
| Migration ledger | 6 matching filename/SHA-256 rows |
| v1 baseline fingerprint | unchanged: `e9429ac90ff17afd08843c21221bf1f1b1e2dcca574108665615ac4ece292fcc` |
| v2 schema fingerprint | `637f7b5f56e20d99f00c5a4f3e014665331f9012ca739ac67dee04586db195c5` |
| Tenant RLS tables | 20/20 enabled and forced |
| Deferred tenant FKs | 44 `NOT VALID` constraints, reconciliation issue count 0 |
| Post-apply critical mismatch | 0 |

The deferred FKs remain `NOT VALID`. Alpha.22 proved the validation preconditions with read-only orphan, tenant mismatch, revision-child, and document-number collision checks. It did not run `ALTER TABLE ... VALIDATE CONSTRAINT`; that schema mutation needs a later explicit gate.

## 3. Deterministic seed result

| Profile | Company distribution | WorkOrders |
| --- | --- | ---: |
| A | `wafl-fn-company-a` | 500 |
| B | `wafl-fn-company-h` | 5,000 |
| C | `wafl-fn-company-b/c/d`, 1,800 each | 5,400 |
| Total | five existing dev/test fixture companies | 10,900 |

Each WorkOrder has one finalized revision plus deterministic fabric/accessory, color, size, color-size quantity, process, image metadata, attachment metadata, and revision linkage rows. Storage keys are synthetic metadata only; no R2 object was created.

## 4. Runtime contracts

The customer path used `SET LOCAL ROLE wafl_v2_tenant_runtime`, not the migration owner role that has `BYPASSRLS`.

- Company A cannot list/read/update/delete Company H rows or child attachments: PASS.
- Privileged access without actor/reason/correlation/audit event: blocked.
- Privileged access after rollback-only audit event context: PASS.
- Same `expectedVersion` submitted twice: one update succeeds, one conflicts.
- Same idempotency key and payload: one effect; different payload reuse: rejected.
- Finalized revision direct mutation: blocked.
- Stale readiness/entity version cannot issue: blocked.
- Atomic document sequence concurrency: 12 attempts, 12 unique values; no `max()+1`.
- Cursor traversal: 500 rows/10 pages and 5,000 rows/100 pages, duplicate 0, missing 0, terminal empty page PASS.

## 5. Performance evidence

All values are DB-runner measurements on the approved development/test target. They are not production SLO claims.

| Scenario | p50 | p95 | max | Query count |
| --- | ---: | ---: | ---: | ---: |
| 500-row list page | 79.09ms | 81.56ms | 83.64ms | 1 |
| 5,000-row list page | 76.32ms | 78.88ms | 78.93ms | 1 |
| 500 detail + selected tab | 148.38ms | 148.38ms | 148.38ms | 2 |
| 5,000 detail + selected tab | 148.74ms | 148.74ms | 148.74ms | 2 |
| 500 indexed exact-name search | 73.93ms | 75.90ms | 76.13ms | 1 |
| 5,000 indexed exact-name search | 73.96ms | 79.01ms | 79.17ms | 1 |

Payload evidence:

- list 30 at 500 rows: 13,921 bytes.
- list 50 at 500 rows: 23,201 bytes.
- list 30 at 5,000 rows: 13,981 bytes.
- list 50 at 5,000 rows: 23,311 bytes.

All alpha.22 query, latency, and payload budgets passed.

## 6. Failure evidence

Two non-destructive runner defects were found before the final PASS:

1. The first apply attempt stopped before SQL because the runner mistook a PL/pgSQL body `BEGIN` for a nested transaction. Ledger and v2 table counts remained zero.
2. The first runtime verify attempt failed in a rollback-only transaction because `INSERT ... RETURNING id` required the privileged SELECT policy before the audit event ID was installed in session context.

Both failures produced artifacts under `Logs/Repo_Status/Failure_Handoff/`. They are not completion artifacts and were never published to `4. Newest`. Each retry occurred only after explicit owner approval.

## 7. Mutation accounting

- Dev/test DB schema mutation: true, additive migrations `001` through `006` only.
- Dev/test test-data mutation: true, deterministic `wafl-fn` fixtures and synthetic sequence allocation.
- Legacy v1 schema/data destructive mutation: false.
- Business data mutation: false.
- Dev/test or production R2 mutation: false.
- Worker/PDF/API runtime mutation: false.
- Production mutation: false.

## 8. Next gate

Alpha.23 may implement only the bounded WorkOrder list Read API vertical slice. It must reuse authenticated company scope, stable opaque cursor order, list limits 30/50, the measured indexes, and the query/payload budgets. Write commands, mobile API integration, production migration, and constraint validation remain separately gated.
