# WAFL v2 WorkOrder Detail and Lazy Read API Evidence

Version: `2.0.0-alpha.24`
Status: completed; final Git delivery identity is recorded in the matching repo-state artifact
Predecessors: `16-workorder-api-command-read-model-contracts.md`, `17-v2-api-contract-test-plan.md`, `19-v2-dev-test-migration-and-performance-evidence.md`, `20-workorder-list-read-api-evidence.md`

## 1. Boundary

Alpha.24 adds the core route `GET /api/v2/work-orders/:workOrderId` and seven lazy routes: materials, size-color, size-spec, processes, assets, documents, and history. The Expo app remains disconnected. No command, migration, schema validation, seed, cleanup, reset, rollback, R2/Worker/PDF, share, QR, business-data, or production path is added.

The runtime reuses approved dev/test migration ledger 7, index 007, and the existing 10,900 synthetic WorkOrders.

## 2. Authentication and tenant boundary

- The alpha.23 dev/test runtime/fingerprint/prefix/read-approval guard runs before the DB-backed workspace guard.
- `requireWorkspaceApiGuard({ permissionCode: "workorder.read" })` supplies company and visibility scope.
- Client `companyId`, `revisionId`, and `memberId` are rejected as unsupported query keys.
- Missing, invalid, and cross-company WorkOrder IDs return the same typed `NOT_FOUND` envelope.
- Approval-pending company C remains `FORBIDDEN` before repository access.

## 3. Core detail contract

The initial core payload contains only:

- product and WorkOrder identity,
- current revision number/status/finalized timestamp,
- status, quantity, due date, amounts, representative-image metadata,
- readiness, entity version, latest document summary,
- per-tab counts.

It excludes material/process/asset rows, size matrices, document snapshots, history rows, storage keys, and tokens.

Core and process due dates retain PostgreSQL calendar semantics: SQL returns date columns as text, repository mapping validates `YYYY-MM-DD`, and no JavaScript Date/UTC conversion is allowed. Timestamp fields such as `finalizedAt` keep their existing ISO datetime representation.

## 4. Lazy endpoint contract

| Endpoint | Returned data | Pagination |
|---|---|---|
| `materials?type=fabric|accessory` | one material type only | signed cursor, 30/50 |
| `size-color` | colors, sizes, quantity cells | bounded to current revision |
| `size-spec` | spec metadata, size rows, POM columns, cells | bounded to current revision |
| `processes` | process rows and six-step derived summary | bounded to current revision |
| `assets` | image/attachment metadata and representative/include flags | signed cursor, 30/50 |
| `documents` | generated-document metadata only | signed cursor, 30/50 |
| `history` | command code, safe change summary, occurred time | signed cursor, 30/50 |

Collection cursors are HMAC-signed, versioned, expiring, URL-safe, and bound to authenticated company, visibility, WorkOrder ID, and tab kind. Cross-tab or cross-tenant reuse returns `CURSOR_INVALID`.

## 5. Query and protocol contract

Each repository callback executes two bounded statements:

1. local company/member/access-mode/correlation claims,
2. one core or tab-specific SQL statement.

The fixed transaction helper combines `BEGIN READ ONLY` and `SET LOCAL ROLE wafl_v2_tenant_runtime` in one protocol call. The response statement-count header is not the total endpoint DB protocol-call count; a normal active company-admin request still includes the separate company-access read and commit.

## 6. Security and payload exclusions

- Asset data returns no storage/thumbnail object key and no raw or signed R2 URL.
- Document data returns no snapshot, object key, content hash, token hash, or raw token.
- History returns no metadata JSON, actor member ID, system actor, privileged reason, secret, or URL.
- Finalized revision data is read-only; no write endpoint exists in alpha.24.

## 7. Runtime evidence gate

The canonical command is:

```powershell
.\tools\pipeline\peacebypiece-auto-pipeline.ps1 -RunWaflV2Alpha24DetailApiVerification -WaflV2Confirmation "VERIFY WAFL V2 ALPHA24 DETAIL API"
```

It must verify A/H/B reads, C `FORBIDDEN`, generic cross-company `NOT_FOUND`, typed errors, lazy cursor duplicate/missing zero, forbidden-field scanning, per-route DB/API timings, payload sizes, and identical pre/post DB snapshots. Every core/tab DB p95 must remain <= 250ms; API p95 remains explicitly checked against 500ms.

## 8. Performance evidence

Final successful runtime log: `OK_Wafl_V2_Alpha24_Detail_API_Verification_2.0.0-alpha.24-20260711-213958.txt`.

| Route | DB p50/p95/max | API p50/p95/max | API >500ms | Payload max |
|---|---|---|---:|---:|
| core | `78.81 / 79.96 / 79.96ms` | `451.34 / 464.02 / 464.02ms` | 0 | 1,162B |
| materials fabric | `76.87 / 79.28 / 79.28ms` | `450.51 / 454.14 / 454.14ms` | 0 | 2,546B |
| materials accessory | `77.02 / 77.46 / 77.46ms` | `448.92 / 470.07 / 470.07ms` | 0 | 4,923B |
| size-color | `81.83 / 83.31 / 83.31ms` | `452.63 / 458.22 / 458.22ms` | 0 | 3,521B |
| size-spec | `74.83 / 76.14 / 76.14ms` | `445.49 / 446.89 / 446.89ms` | 0 | 260B |
| processes | `76.47 / 76.98 / 76.98ms` | `447.29 / 476.41 / 476.41ms` | 0 | 1,471B |
| assets | `79.67 / 80.34 / 80.34ms` | `449.83 / 455.86 / 455.86ms` | 0 | 830B |
| documents | `74.36 / 74.66 / 74.66ms` | `444.60 / 452.36 / 452.36ms` | 0 | 206B |
| history | `74.34 / 75.69 / 75.69ms` | `445.20 / 447.97 / 447.97ms` | 0 | 199B |
| Company H core | `78.14 / 81.75 / 81.75ms` | `449.28 / 455.84 / 455.84ms` | 0 | 1,164B |

Each metric uses 10 warm runtime samples and is printed before assertions. All DB p95 values remain below 250ms and all API p95 values remain below 500ms. The alpha.23 Company H list warning remains p95 `481.46ms`, max `614.93ms`, with 3 samples over 500ms.

Accessory pagination returned 10 rows over 4 pages and asset pagination returned 2 rows over 1 page, both with duplicate/missing `0/0`.

The first two read-only cycles failed on the materials route. Sanitized SQLSTATE `42501` proved the cause was an unauthorized join to the legacy `partners` table. The final implementation keeps `supplierPartnerId`, returns nullable `partnerName`, and removes that legacy dependency without a grant, migration, or schema mutation. Both failure handoffs remain preserved outside `4. Newest`.

## 9. Mutation accounting

- Alpha.24 DB schema mutation: false.
- Dev/test seed or fixture mutation: false.
- Business-data mutation: false.
- R2/Worker/PDF mutation: false.
- Production access or mutation: false.

## 10. Next gate

Alpha.25 may add WorkOrder create and basic-info update commands only under a separate explicit write/mutation contract after alpha.24 runtime and Finish gates pass.
