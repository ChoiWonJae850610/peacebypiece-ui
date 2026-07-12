# WAFL v2 WorkOrder Revision Issue Command Evidence

## Status

- Target version: `2.0.0-alpha.27`.
- Baseline: `2.0.0-alpha.26`, commit `1910dcb69deadecfc2c2d1c7923a8246cb229a78`.
- Current gate: `ALPHA27_ISSUE_RUNTIME_AND_COMPLETION_PASS`. The approved issue effect committed exactly once and bounded read-only/GET-only completion passed. WorkOrder scalar PATCH and material scalar PATCH returned runtime `LOCKED`; material order immutability is accepted through the shared runtime guard, repository ordering, typed mapping, and rollback static contract without another terminal-line request.
- APP_VERSION and mobile mirrors are `2.0.0-alpha.27` for final delivery.

## Scope and route

`POST /api/v2/work-orders/:workOrderId/revisions/issue` finalizes the current draft revision and issues the WorkOrder. Input is bounded to `clientRequestId`, `expectedWorkOrderVersion`, `expectedRevisionVersion`, `expectedRevisionId`, optional `issueNote`, and the required `Idempotency-Key` header. Tenant, actor, revision number, document number, issue time, status, and next revision identity are server-owned.

PDF, QR, generated-document rows, Preview, R2, Worker, mobile API connection, correction, rollback, and cancellation are excluded.

## Applied schema decision and blocker

Applied migrations `001` through `008` provide the current revision pointer, WorkOrder/revision versions, atomic tenant/day sequence allocator, tenant-unique document base, one draft revision, immutable revision/child guards, tenant RLS, hashed receipts, append-only events, and the tenant-safe numbering-settings function.

The alpha.27 read-only preflight then proved `wafl_v2_tenant_runtime` cannot select `company_settings`. That legacy table has no v2 tenant RLS policy, so granting broad table SELECT would be unsafe. The issue transaction therefore cannot read `document_number_prefix`/`company_code` and `business_timezone` under the fixed tenant role. Reading those values before entering the transaction or through a privileged application query would violate the required tenant/RLS and atomicity boundary.

Migration 008 was applied once to approved dev/test fingerprint `01e5dcc7fea3`, audited as ledger 8/8, and followed by a passing alpha.27 read-only preflight. Existing migrations must not be modified or reapplied.

### Alpha.27a applied boundary

Migration draft `008_v2_tenant_document_number_settings_function.sql` adds only `public.wafl_v2_document_number_settings()` and its ACL. The zero-argument, `STABLE SECURITY DEFINER` function uses fixed `search_path = pg_catalog, public, pg_temp`, reads tenant/member claims, verifies an actual approved membership, and returns at most one row with only `document_code` and `business_timezone`.

The existing canonical non-superuser migration executor is the function owner. The approved dev/test executor has historical `BYPASSRLS=true`; this is recorded rather than hidden. `company_settings` has no RLS to bypass, while the function itself is constrained by zero arguments, fixed search path, fully qualified objects, approved membership validation, bounded columns, and one-row limit. `PUBLIC` EXECUTE is revoked; only the NOBYPASSRLS `wafl_v2_tenant_runtime` receives EXECUTE. No direct `company_settings` SELECT grant is added. The issue repository calls the function after tenant claims are installed and within the same write transaction as allocation/finalization.

The applied schema delta is one function object, its ACL, and migration ledger row 008. A separately approved synthetic fixture added exactly one `company_settings` row for each of Company A/B/H using `WAFN` and `Asia/Seoul`; Company C and business/production data were untouched. Current ledger is 8/8.

Rollback, only after separate destructive approval, is one transaction that revokes runtime EXECUTE, drops `public.wafl_v2_document_number_settings()`, and removes exactly ledger row 008 after matching filename/SHA. Automatic rollback is forbidden.

One tenant write transaction locks the WorkOrder and current revision, validates both versions and pointer, allocates one base number, changes the revision `draft -> finalized`, changes the WorkOrder to `issued`, advances both versions, completes one receipt, and appends one event. Failure rolls back the complete effect, including sequence allocation.

## Number and snapshot boundary

The stored base is `{COMPANY}-{SEASON}-{ITEM}-{YYMMDD}-{SEQUENCE}` and the displayed value appends `-R{revision_no}`. Company business timezone determines the issue date. Replay returns the same revision and number; `max()+1` is forbidden.

The finalized revision scalar snapshot and all revision-scoped material/size/process rows become immutable through existing guards. Alpha.27 creates no document snapshot row because PDF/document lifecycle begins later.

## Preconditions

The minimum safe gate requires a current draft revision, WorkOrder status `draft` or `ready_to_issue`, product name/type, season/item code, due date, positive quantity, company document code, and at least one fabric and accessory line. Existing material statuses are retained as issued facts; alpha.27 does not invent a stricter material readiness policy.

## Next draft and permission

No next draft is created automatically. Canonical correction remains a separate revision-draft Command, and the current pointer stays on the finalized revision. This avoids silently copying order state, receipts, or events.

The active catalog has no separate `workorder.issue`; alpha.27 reuses canonical `workorder.update` and adds no permission/schema row.

## Idempotency, concurrency, and audit

The stored receipt key is a SHA-256 scope over command, tenant, actor, WorkOrder, revision, and raw key. The request hash includes both expected versions and issue note. The raw key is never persisted.

Two competing requests with the same versions must produce one success and one typed conflict, one allocated base, one receipt/event, no new revision row, and WorkOrder/revision version `+1/+1`.

`work_order.revision.issue` records bounded revision/number/state/version/issue metadata and `nextDraftCreated: false`. It stores no raw key, token, URL, storage key, full snapshot, or session claim.

## Verification and approval gate

1. Static contracts, TypeScript, lint/build, Unicode, PowerShell, links, route guard, mutation audit: PASS.
2. Migration 008 function/ACL audit, Company A/B/H fixture isolation, and canonical read-only preflight: PASS. Direct runtime table SELECT remains false.
3. First approved issue runtime attempt stopped at the read-only baseline because the runner expected ledger 7 instead of the actual 8. API server start, issue POST, document allocation, receipt/event writes, and version changes were all zero.
4. Post-failure preflight confirmed R0 draft, WorkOrder/revision version 14/14, no document number, and `NO_PARTIAL_MUTATION`. The runner-only ledger assertion is corrected to 8.
5. A new matching checkpoint was approved, and the single synthetic issue effect committed within the declared budget.
6. Bounded read-only completion and GET-only alpha.23-26 regression passed without mutation replay.
7. Actual scalar/material/order `LOCKED` negative responses remain pending because the runner assertion used the wrong response path after the committed effect.

### Approved issue runtime and completion result

The approved single issue effect committed on the Company A synthetic R0 target. It allocated `WAFN-26FWA-A25CMD-260711-001-R0`, changed WorkOrder/revision from `draft/draft` to `issued/finalized`, advanced both versions from 14 to 15, completed one hashed receipt, appended one issue event with actor/time, and created no revision, next draft, generated document, R2 object, or PDF.

Concurrent issue produced one winner and one typed conflict. Same-key replay returned the same result without another mutation, a changed payload with that key returned typed conflict, Company B/H returned `NOT_FOUND`, and Company C returned `FORBIDDEN`.

The runtime stopped at the first immutable-lock negative assertion because the runner sent an undefined `expectedVersion`; canonical responses keep `nextVersion` beside `result`, not inside it. Post-runtime bounded read-only and GET-only completion proved versions 15/15, exactly one issue receipt/event, incomplete receipts 0, document-number collision count 1, revision/draft counts 1/0, generated-document rows 0, alpha.23-26 Read regression PASS, and `NO_PARTIAL_MUTATION`. Runtime was not replayed. The corrected runner now reads `data.nextVersion`, but actual scalar/material/order `LOCKED` responses for this issued target remain pending a separately approved no-write negative Command verification.

That negative verification was attempted once with pre/post bounded snapshots. WorkOrder scalar PATCH returned typed `LOCKED`. Material scalar PATCH returned `FORBIDDEN` because `materialCommandService` requires `WAFL_V2_ALPHA26_MUTATION_APPROVAL`, while the verification server carried the alpha.27 issue approval. The runner stopped immediately, so material order was not called. A subsequent read-only/GET-only completion confirmed that WorkOrder/revision remained 15/15 and issued/finalized, receipt/event stayed 1/1, the number stayed unique, all material rows remained unchanged, and no generated document, revision, or draft was added. Material scalar/order `LOCKED` therefore remains a runtime evidence gap requiring a new explicit approval using the canonical alpha.26 material guard; no service/guard relaxation is authorized.

A second bounded negative verification used only the canonical alpha.26 material approval. Material scalar PATCH returned typed `LOCKED` for the completed accessory at line version 4, and the complete pre/post snapshot was unchanged. The runner then found only `cancelled, completed, cancelled` material statuses. Because the owner required an otherwise valid `editing` order-request candidate and prohibited using a terminal line when state validation could be relevant, it did not call the order route. Material order `LOCKED` remains unexecuted; no fixture, material, revision, receipt, event, or document mutation was introduced.

### Material order immutable contract evidence

Final acceptance combines the WorkOrder scalar runtime `LOCKED`, material scalar runtime `LOCKED`, and the shared material-order static boundary. The owner explicitly chose not to call order request on a terminal line.

- `app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-request/route.ts:1-7`, `order-cancel/route.ts:1-7`, and `order-complete/route.ts:1-7` all delegate to `handleMaterialOrderTransitionV2`; there is no route-specific mutation bypass.
- `lib/domain/work-orders/command/materialCommandRoute.ts:88-107,143-151` validates the bounded request and sends request/cancel/complete through the same `transitionMaterialOrder` service boundary.
- `lib/domain/work-orders/command/materialCommandService.ts:86-89,240-285` maps repository reason `locked` to HTTP 409 `LOCKED`, requires the fixed alpha.26 material approval, and delegates all three order kinds to `transitionMaterialOrderV2`.
- `lib/domain/work-orders/command/materialCommandRepository.ts:287-294` checks WorkOrder `draft` before revision `draft`. An issued WorkOrder therefore raises `locked` before any material-status transition decision.
- `lib/domain/work-orders/command/materialCommandRepository.ts:674-757` uses one shared transition boundary for request/cancel/complete. Within it, provisional receipt reservation is followed by `lockMaterialTarget`, `assertCurrentDraft` at line 705, material-state validation at lines 706-713, material UPDATE from line 718, and event append from line 747. Thus issued/finalized lock is evaluated before material status transition, line UPDATE, parent/revision version advance, and event append.
- `lib/db/client.ts:153-156,159-198` wraps that boundary in one tenant write transaction and executes `ROLLBACK` on every thrown `LOCKED` error. The transaction is entered and a receipt may be provisionally reserved, but no receipt, event, WorkOrder/revision/material version, or status mutation is durably committed.
- `tests/workorder-v2-alpha26-material-command-api-contract.mjs` now fixes the shared routes, typed mapping, exact guard-before-status-before-UPDATE/event order, and transaction rollback contract. This is the static proof used instead of another terminal-line request.

Verdict: `MATERIAL_ORDER_LOCKED_PASS_BY_SHARED_RUNTIME_GUARD_AND_STATIC_CONTRACT`.

Production, business data, R2, Worker, PDF, migration, schema, index, seed, cleanup, reset, and rollback remain untouched.

## Alpha.28 handoff

Alpha.28 may build Preview from the finalized revision and its revision-scoped children. PDF/QR/R2 document lifecycle remains alpha.29.
