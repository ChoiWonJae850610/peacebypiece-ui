# WAFL v2 API Contract Test Plan

## 27. Alpha.67 identity/PICK/basic-spec/readiness/public-viewer gate

- Issued/finalized/read-only identity is fixed in mobile and rejected by the server command; draft round-zero identity remains editable and Reorder remains 본생산.
- Season and detail-item PICK contracts prove exact options, legacy read compatibility, nested WorkOrder-local direct input, and no catalog mutation.
- The four exact WAFL starter-template names, every seed core/addon POM, all twelve source sizes, cm SOT, selected-size-only projection, no custom-size invention, and company-template separation are permanent checks. Unmapped new POMs are explicitly grid-only.
- Readiness proves zero Fabric/Accessory and optional detail gaps are warnings that remain visible but do not block issue; Basic Process hard rules stay intact and mobile/server consume one result.
- Browser QA launches Chromium and WebKit, redeems `/v`, waits for a nonzero `data-rendered=true` first-page canvas, keeps Download, and re-proves invalid/revoked/network bounds plus internal-file 401.
- Native viewer keeps actual vertical PDF rendering/zoom and a passive page indicator, while a
  bottom sibling WAFL `닫기` Pressable invokes the Document-context close callback. Top return and
  explicit previous/next page controls are absent.
- Permanent inventory advances from `170/170` to `171/171`; ledger remains `20/20`, migration `021` stays absent, production/owner-fixture mutation is `0/0`, and `PHYSICAL_RESULT_NOT_INFERRED` remains.

## 29. Alpha.67 viewer close / PDF process / PICK cleanup gate

- Season and Detail Item bounded option lists use non-virtualized `View`/`Pressable` rendering under
  the `WaflInputSheet` vertical owner; same-orientation nested VirtualizedList count is zero.
- Maker WAFL recommendation visibility returns only the current category WAFL basic system template
  plus the independent company-template route; QA/legacy system recommendations are excluded without
  deleting compatibility data.
- Native viewer close is a real sticky bottom footer sibling with one shared WAFL primary action,
  exact accessibility label, actual close callback, and no top return or previous/next controls.
- Issued PDF evidence covers Basic-only and Basic-plus-Additional snapshots: cover Basic partner,
  omitted empty Additional section, Additional-only detail rows, absent visible `개정차수`, and
  preserved quantity formatting.
- Permanent inventory advances from `172/172` to `173/173`; ledger remains `20/20`, migration `021`
  stays absent, production/owner-fixture mutation is `0/0`, and `PHYSICAL_RESULT_NOT_INFERRED` remains.

## 30. Alpha.67 picker/action/list/Reorder UX gate

- Season and Detail Item reuse the canonical static `WaflOptionGrid` selected-cell grammar and place WorkOrder-local `+ 직접입력` outside the recommendation grid; nested VirtualizedList count remains zero.
- Requested Basic Process renders the shared warning action as icon plus `발주취소` without exposing manual completion or changing the lifecycle command.
- ISSUE refresh is awaited, patches the canonical list item status/document projection, and performs one invalidated-query reconcile on list return; `작성 중 -> 진행 중` filter membership changes without manual refresh.
- Reorder confirmation contains only the server-round preview and `아니오 / 예`; cancel performs no command, confirm sends total quantity zero and due date null, and navigation/hydration use the returned WorkOrder ID and authoritative round.
- Permanent inventory advances from `173/173` to `174/174`; ledger remains `20/20`, migration `021` stays absent, production/owner-fixture mutation is `0/0`, and only this package's new physical changes retain `PHYSICAL_RESULT_NOT_INFERRED`.

## 31. Alpha.67 final PDF redesign and PICK reel-polish gate

- Season is the canonical paired option-reel owner and Detail Item is the canonical single
  option-reel owner; neither route imports the option grid or a nested VirtualizedList. Both prove
  the exact direct/PICK mode-switch pair and staged X/V lifecycle.
- Requested Basic Process keeps the warning action and `발주 취소` accessibility meaning while the
  visible compact caption is exactly `취소`.
- Issued PDF contracts prove the branded landscape cover, human fact cards, five-count summary,
  deterministic original/Sample/Reorder badges, absent QR/status/revision display, omitted empty
  sections, Basic-only cover ownership, Additional-only process table, weighted continuation,
  repeated headers, four-up attachment paging, and existing quantity/Finished-Spec pagination.
- Generation service/repository contain no embedded-QR token creation. Explicit manual Share and
  `/v` remain, while legacy embedded-token repository reads remain compatible.
- Isolated normal, rich, and sparse PDFs are generated, every page is rasterized and visually
  inspected, and no page may hide clipping or a false continuation.
- Permanent inventory advances from `174/174` to `175/175`; ledger remains `20/20`, migration `021`
  stays absent, production/owner-fixture mutation is `0/0`, and only this package's new physical
  changes retain `PHYSICAL_RESULT_NOT_INFERRED`.

Document role: verification owner for the normative contracts in `16-workorder-api-command-read-model-contracts.md`. It defines test layers, gates, budgets, and required evidence; it does not redefine API semantics or authorize Runtime mutation. Version-specific execution authority belongs to the active Delta and `09-codex-working-rules.md`.

## Alpha.55 material order lifecycle additions

- Verify current `editing -> requested`, `requested -> editing` cancellation, re-request, and `requested -> completed`.
- Verify cancel preserves reason, `cancelled_at`, event, receipt, and version deltas while creating no new `cancelled` operational row.
- Verify the two retained alpha.26 synthetic `cancelled` rows remain byte-for-byte unchanged, read-only, actionless, and visibly distinct as legacy cancellation history.
- Verify request locks normal edits, cancel restores them, complete applies terminal lock, archived and permission-denied lines expose no order action, and one user action emits at most one command.
- Verify canonical calculation readiness, typed errors, stale/conflict/runtime guards, canonical response revalidation, in-flight release, and automatic/duplicate/unknown mutation zero.
- Verify stock-covered inputs with positive demand and `stockUse >= demand` accept canonical `orderQuantity = 0`, amount `0`, and absent/zero supplier-price inputs while retaining request/cancel/re-request/complete and lock behavior.
- Verify positive external order quantity still requires supplier and unit price greater than zero, while demand `0`, invalid numeric input, missing unit, formula drift, archived state, permission denial, and invalid transitions remain blocked.
- Verify a retained zero-order dev/test fixture through exact request/cancel/re-request/complete version, event, and receipt deltas without changing the user-device fixture or the two legacy-cancelled rows.

## Alpha.46 date-only and bounded mobile update additions

- Verify draft-only product name/due date/quantity PATCH, changed-fields-only payload, `expectedVersion`, one post-save detail GET, local list synchronization, and non-draft read-only behavior.
- Verify exact Next-only runtime approval, default read-only runner, exact external UUID PATCH route, and continued blocking of create/material/process/revision and arbitrary API paths.
- Verify PostgreSQL `date` columns cross repositories as `YYYY-MM-DD` strings, reject invalid calendar values and JavaScript Date objects, remain identical under UTC and Asia/Seoul, and do not alter timestamp/timestamptz ISO mapping.
- Verify explicit save, dirty warning, continue editing, discard, manual conflict recovery, and zero autosave/automatic retry/polling.

## Alpha.30 additions

- Check additive nullable migration fields, matching limits, no backfill/index/destructive SQL, and dev/test apply gate.
- Check material usageArea, process PATCH expectedVersion/tenant/audit/LOCKED without status transition, and revision factory memo.
- Check Korean factory labels, revision-only Preview data, hidden internal fields, print pagination, and no PDF/QR/R2 path.

## Alpha.28 Preview gate

Validate contiguous SQL placeholders, company/revision scope, no `SELECT *`, typed draft/cross-tenant errors, deterministic repeated GET, bounded statement/payload metrics, safe asset metadata, A4/print rules, and pre/post mutation count equality.

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

## 19. Alpha.67 Nth Reorder gate

- Static: exact eligibility, bounded client payload, root/source locks, server round allocator,
  hashed receipt replay, migration-019 uniqueness, no migration 021, copy/reset matrix, safe
  attachment selection, direct Overview navigation, history, and retained list badges/filters.
- Isolated DEV/TEST Runtime: create an issued 본생산 source fixture; reject Sample, draft,
  Rework and cancelled sources; verify same-key replay and concurrent different-key round
  uniqueness; verify copied configuration, zero quantity cells, reset lifecycle state,
  independent assets, history order, list filters, direct detail read, and the new Reorder's own
  first issue. Exact fixture/object cleanup or explicitly documented retained ownership is required.
- Production and owner-fixture mutation are zero. Actual Rework creation and Additional Process
  Order are not inferred from this gate. Physical-iPhone result remains `NOT_INFERRED`.

## 20. Alpha.67 detail-entry, post-create and image-pipeline gate

- A Sample core detail remains readable when contextual Series History returns `NOT_FOUND`;
  required detail/images/partner versions still agree.
- Reorder command success commits the returned WorkOrder ID before list reconciliation. A current
  filter may exclude it, and a simulated first hydration failure followed by retry produces one
  create command total and reads the same created identity.
- One isolated synthetic PNG proves prepare 200, original upload 200, complete 201, transformed
  WebP thumbnail 200, representative read, canonical delete, active-row residual zero, and exact
  source/derivative object residual zero.
- Worker deployment evidence proves `R2_BUCKET`, `IMAGES`, and preserved secret-binding names
  without exposing binding values; the transform receives a `ReadableStream`.
- The permanent inventory advances from `162/162` to `163/163`; migration remains `20/20`,
  migration `021` is absent, production/owner-fixture mutation is `0/0`, and physical result is
  not inferred.

## 21. Alpha.67 issue/PDF/material/action remediation gate

- A single imported resolver proves Korean detail item plus canonical category produces the same
  nonblocking readiness result and issue document segment; an absent item still blocks.
- Ordinary and direct-Reorder issue/PDF paths consume the canonical `DOCUMENT_R0` capability.
  A simulated PDF failure preserves issued identity and retry invokes PDF generation only.
- Fabric and Accessory prove never-requested hard delete, cancelled-history archive, and
  requested/completed removal denial, including preserved lifecycle history.
- Production `완료`/`취소` actions prove equal icon-only geometry, distinct accessibility labels,
  and unchanged command routing.
- The permanent inventory advances from `163/163` to `164/164`; ledger remains `20/20`, migration
  `021` stays absent, production/owner-fixture mutation is `0/0`, and physical result is not
  inferred.

## 22. Alpha.67 PDF generation retry/public viewer gate

- Mobile parity asserts the exact generate path, revision payload, workspace cookie, idempotency
  header, 120-second document budget, generated/pending status reconciliation, and generated row
  read after the command.
- A second generation-only request for the same issued revision returns the same current generated
  identity. WorkOrder status, revision count, issue events, and generated-document count prove
  issue/finalize/R1/R2 replay zero.
- Viewer target resolves the existing embedded-QR identity without creating a manual share. `/v`,
  public session, public PDF file, and public download work without a workspace session; the
  internal file route without that session remains `API_SESSION_REQUIRED`.
- Static security contracts forbid a mobile `보기` action from opening `inlineUrl`, forbid a raw R2
  target, and retain the existing token hash/session boundaries.
- The permanent inventory advances from `164/164` to `165/165`; ledger remains `20/20`, migration
  `021` stays absent, production/owner-fixture mutation is `0/0`, and physical result is not
  inferred.

## 23. Alpha.67 mobile image asset integrity/PDF gate

- A mobile fixture where advisory picker size differs from fetched Blob size proves prepare uses
  Blob bytes and complete persists actual R2 object bytes plus SHA-256.
- Completion proves actual MIME/size bounds, actual-byte quota recheck, derivatives, representative
  read, receipt replay without a duplicate row, and exact isolated object/row cleanup.
- A hash-null legacy image with a stale declared size may generate by bounded object inspection and
  an in-memory hash without DB backfill. A hash-present size/hash corruption remains a hard failure.
- An owner-equivalent preserved render input proves the cover emits exactly one landscape page and
  all following pages are portrait. Generation failure categories retain the first failing owner.
- The permanent inventory advances from `165/165` to `166/166`; ledger remains `20/20`, migration
  `021` stays absent, production/owner-fixture mutation is `0/0`, and physical result is not inferred.

## 24. Alpha.67 viewer/share/reset clean-base gate

- Browser-equivalent Playwright proof loads `/v`, at least one same-host `/_next` asset, public
  session, and iframe PDF as 200 responses without a workspace session. Invalid and network paths
  terminate in bounded safe states; the internal file route remains `API_SESSION_REQUIRED`.
- Native share has one structured body and exactly one viewer URL occurrence. Link metadata and
  managed-link access metadata remain visible without disclosing raw tokens.
- Before authorized DEV/TEST reset, the backup and KEEP/DELETE/R2 manifests are reopened, parsed,
  sized, and hashed. Execution requires those exact hashes, disables only named user immutability
  triggers inside one transaction, restores them before commit, and never relaxes FK triggers.
- Final proof requires target graph residual zero, every scheduled exact-owned R2 object 404,
  unchanged reference/config/sequence and unrelated-company signatures, ledger `20/20`, migration
  `021` absent, production/owner-fixture mutation `0/0`, and blank WorkOrder list with create entry
  still available. The inventory advances from `166/166` to `167/167`.
- Owner physical result is `PHYSICAL_RESULT_NOT_INFERRED`.

## 25. Alpha.67 post-clean-base physical corrections gate

- Image completion proves a 90-second bounded command attempt, ambiguity-only reconciliation with
  the exact original command/idempotency identity, immediate projection refresh on receipt, and no
  second completion/derivative invocation.
- Size and Color removal prove cells and matrix/work-order/revision totals reconcile together; Size
  also proves Finished Spec Size/value cleanup through the existing transaction owner.
- Readiness proves missing/ready/requested/completed Basic Process states, exact stable issue codes,
  제작 routing, Additional Process independence, and issue-command parity. Issue proves requested
  Basic Process auto-completion and replay event/completion zero.
- Fabric and Accessory prove shared 30/100 hard limits, counter grammar, and matching server rejection
  without truncation. Detail, issue snapshot, preview, and PDF prove Basic Process memo-first factory
  delivery truth with legacy fallback only. Rendered classification contains human Korean labels and
  no internal tuple.
- Mobile View must not open Safari. Current dependency/config audit records the missing embedded PDF
  capability as a native Development Build blocker; internal workspace file auth and share-only `/v`
  remain intact.
- The permanent inventory advances from `167/167` to `168/168`; ledger remains `20/20`, migration
  `021` stays absent, production/owner-fixture mutation is `0/0`, and physical result is not inferred.

## 26. Alpha.67 document UX/share/save gate

- A two-or-more-page native viewer proves disabled endpoint controls, renderer `setPage` ownership,
  and one page state shared by scroll callbacks and explicit previous/next actions.
- Requested Basic Process presentation exposes cancel only; manual complete is absent and issue-time
  auto-completion remains the canonical domain transition.
- Save proves workspace-authenticated internal acquisition, PDF MIME/signature/nonzero bounds,
  source/copy SHA equality, native local-file handoff, and cleanup. Safari, public token creation,
  raw R2, and secret-bearing query parameters are absent.
- Share/QR metadata renders four independent rows. Native business copy has exactly one controlled
  viewer URL and no revision/internal identifier.
- Browser-equivalent Chromium proves hydrated `/v`, an immediately mounted inline PDF request before
  any Download interaction, retained Download, bounded unavailable/network states, and continued
  unauthenticated rejection of the internal workspace file route.
- Permanent inventory advances from `169/169` to `170/170`; ledger remains `20/20`, migration `021`
  stays absent, production/owner-fixture mutation is `0/0`, and `PHYSICAL_RESULT_NOT_INFERRED` remains.

## 28. Alpha.67 PDF spec pagination/viewer touch/format gate

- Native viewer proof invokes the real return policy and asserts exactly one close callback, one
  minimum 44-point Pressable covering chevron plus label, the accessible name
  `문서로 돌아가기`, and native stacking above the PDF renderer.
- Pagination proves small and owner-like 16-row Finished Spec sections remain intact, preceding
  content moves an otherwise fitting section to a fresh page, and only a truly oversized section
  produces balanced continuation pages with repeated headers.
- Full-view proof requires parent-owned vertical scrolling, actual item count/near-bottom affordance,
  sticky footer ownership, and responsive single-Size width while preserving multi-Size horizontal
  behavior.
- Quantity proof covers integer-equivalent and meaningful fractional decimal strings without
  floating-point conversion. Public `/v` and Download remain regression gates.
- Permanent inventory advances from `171/171` to `172/172`; ledger remains `20/20`, migration `021`
  stays absent, production/owner-fixture mutation is `0/0`, and physical result is not inferred.
