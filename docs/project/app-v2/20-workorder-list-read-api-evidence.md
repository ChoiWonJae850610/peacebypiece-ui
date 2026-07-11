# WAFL v2 WorkOrder List Read API Evidence

Version: `2.0.0-alpha.23`
Status: completed, committed, and pushed on `master`
Predecessors: `16-workorder-api-command-read-model-contracts.md`, `17-v2-api-contract-test-plan.md`, `19-v2-dev-test-migration-and-performance-evidence.md`

## 1. Boundary

Alpha.23 implements only `GET /api/v2/work-orders`. It reuses the alpha.22 dev/test schema and 10,900 synthetic WorkOrders without migration, seed, cleanup, reset, constraint validation, or rollback migration SQL.

The route is not connected to `apps/mobile`. It adds no command, detail/tab, upload, R2, Worker, PDF, QR, share, order, delivery, business-data, or production path.

## 2. Authentication and tenant scope

- The route first checks `WAFL_V2_READ_API_ENABLED`, read approval, development/test runtime, approved host/database fingerprint, and the canonical `wafl-fn` prefix.
- This environment-only guard runs before the DB-backed workspace guard, preventing a disabled or production runtime from touching DB through this route.
- The existing workspace guard requires `workorder.read` and supplies company scope from the authenticated session.
- `companyId`, `workOrderId`, and unknown query parameters are rejected. Client scope is never trusted.
- A list-only helper sends fixed `BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime` SQL in one protocol call. The role is not derived from input, and local company/member/correlation RLS claims are still installed only after the role is active.

## 3. Cursor and response

- Default limit: 30. Maximum: 50. Overflow returns `LIMIT_EXCEEDED` rather than clamping.
- Stable order: `(updated_at DESC, id DESC)`.
- Cursor: HMAC-signed, versioned, one-hour expiry, bound to tenant and visibility scope.
- Tampered, expired, version-mismatched, or cross-tenant cursor returns `CURSOR_INVALID`.
- Success uses the existing WAFL `{ ok: true, data }` envelope and canonical `WorkOrderListPage`.
- Failure uses canonical `{ ok: false, error: { code, message, retryable, correlationId } }`.

Each item contains only WorkOrder ID, display document number, product name, state, due date, total quantity, estimated amount summary, one representative-image metadata object, incomplete fabric/accessory counts, process count, latest document status, and updated timestamp. Storage keys, raw tokens, child lists, matrices, snapshots, and attachment metadata are excluded.

Synthetic alpha.22 image rows have no R2 objects. The representative metadata is returned with `thumbnailUrl: null` rather than exposing a storage key or inventing a working file URL.

## 4. Query shape

Repository callback statements are fixed at two:

1. set local RLS claims,
2. execute one bounded list query.

`X-WAFL-List-Query-Count: 2` reports only those bounded callback statements. A successful endpoint request still has five sequential DB protocol calls: the company-access read, combined read-only begin plus fixed tenant role, claims, list SQL, and commit. Session verification and the company-admin permission decision remain local on this tested path.

The list SQL first selects at most `limit + 1` WorkOrder IDs. Material counts, process counts, latest document state, current revision amount, and representative image metadata are then aggregated only for that page. It uses no `SELECT *`, lateral per-row aggregate, full child JSON aggregate, offset pagination, storage object key, or N+1 child query.

## 5. Runtime verification contract

The canonical command is:

```powershell
.\tools\pipeline\peacebypiece-auto-pipeline.ps1 -RunWaflV2Alpha23ListApiVerification -WaflV2Confirmation "VERIFY WAFL V2 ALPHA23 READ API"
```

It starts the built Next server on localhost and checks:

- unauthenticated typed error,
- authenticated active company A/H/B reads and the canonical approval-pending company C `FORBIDDEN` policy,
- cross-company row/ID/cursor isolation,
- invalid/expired/version cursor errors,
- limit overflow and unsupported ID query errors,
- 500 rows in 10 pages and 5,000 rows in 100 pages,
- duplicate/missing zero,
- repository query count and 30/50 payload budgets,
- DB and API p50/p95/max,
- identical pre/post schema fingerprint and v2 row counts.

## 6. Evidence

Approved index migration `007_v2_work_order_list_material_lookup_index.sql` added only `work_order_material_lines_company_revision_cover_idx` on the approved dev/test target. Migration ledger is 7/7, migrations 001-006 and the alpha.22 synthetic seed were reused, and the legacy v1 fingerprint remained unchanged.

The completed runtime log is `OK_Wafl_V2_Alpha23_List_API_Verification_2.0.0-alpha.23-20260711-210852.txt`. Earlier failed-run logs and failure handoffs remain preserved and are not completion artifacts.

| Evidence | Result |
|---|---:|
| Company A list DB, 30 samples | p50 `82.96ms`, p95 `86.17ms`, max `88.90ms`, over 100ms `0` |
| Company A API, 30 samples | p50 `457.43ms`, p95 `463.29ms`, max `465.71ms`, over 500ms `0` |
| Company A transaction, 30 samples | p50 `231.31ms`, p95 `237.28ms`, max `237.83ms` |
| Company H API, 100-page traversal | p50 `462.71ms`, p95 `481.46ms`, max `614.93ms`, over 500ms `3` |
| Company H transaction, 100-page traversal | p50 `235.70ms`, p95 `252.25ms`, max `386.10ms` |
| 30-row / max 50-row payload | `17,932` / `29,842` bytes |
| Cursor traversal | 500/10 pages and 5,000/100 pages; duplicate `0`, missing `0` |

The completed Company A correctness traversal is the warm-up for three additional passes over the same ten cursor pages. API and transaction distributions are printed before budget assertions; logs contain no cursor tuple, WorkOrder ID, raw token, DB URL, or secret. Company A and H API p95 remain below the unchanged `500ms` budget. Company A 30-sample DB p95 remains below `100ms`; Company H traversal DB p95 is `101.10ms`, below its `200ms` 5,000-row budget.

## 7. Mutation accounting

- Dev/test DB schema mutation: true for the separately approved additive index 007 only.
- Final read-only runtime verification schema mutation: false.
- Dev/test seed or fixture mutation: false.
- Business data mutation: false.
- R2/Worker/PDF mutation: false.
- Production access or mutation: false.

## 8. Next gate

Alpha.23 completed at commit `33052fd305e131cedf47cd6f1d86987c96a4dd23`, pushed with master/origin synchronized and a matching final source ZIP/repo-state handoff. Alpha.24 may add WorkOrder detail header and tab-specific lazy reads, but must not add commands or mobile integration.
