# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.23

## Purpose

This roadmap starts the `2.0.x` App-first line.

## Current checkpoint

### 2.0.0-alpha.1

Status: done.

- Add App-first transition documents.
- Align app display version to `2.0.0-alpha.1`.
- Preserve `/ui` alpha.27 as the design-baseline showroom.
- Do not create an Expo project.

### 2.0.0-alpha.2

Status: done.

- Record `www.wafl.co.kr` as the public WAFL app landing site.
- Keep `/ui`, `/roadmap`, and `/functions` localhost-only development check routes.
- Record `/system` and `/workspace` as long-term removal targets without deleting them.
- Create `apps/mobile` Expo SDK 55 skeleton.
- Add mock-only 제작 카드 navigation for 개요, 이미지·첨부, 사이즈·색상, 원단, 부자재, 제작 플로우, 출력·공유.
- Align app display version to `2.0.0-alpha.2`.
- Do not connect real DB, API, R2, PDF, Worker, auth, camera, file, or share behavior.

### 2.0.0-alpha.3

Status: done.

- Expand the Expo skeleton into a visually inspectable mock production-card UX.
- Improve the start/header area with WAFL version, representative image placeholder, production quantity, due date, state, and next recommendation.
- Keep a one-column iPhone flow while centering the app surface on tablet widths without turning it into a desktop multi-column layout.
- Add clearer mock sections for overview, image/attachment, size/color, fabric, accessory, production flow, and output/share.
- Split repeated mock data into constants and repeated row/metric/action components.
- Keep all controls mock-only: no DB, API, R2, PDF, Worker, auth, camera, file picker, upload, share, or production mutation.
- Align app display version to `2.0.0-alpha.3`.

### 2.0.0-alpha.4

Status: done.

- Add `docs/project/app-v2/11-app-design-theme-v1.md`.
- Apply App Design Theme v1: `동대문 제작 워크룸 / Dongdaemun Atelier Ops`.
- Redesign `apps/mobile` mock visual foundation toward a dense Korean apparel production workroom.
- Use warm paper/off-white base, deep navy primary, brick orange/thread amber production accents, and deep olive completion status.
- Keep normal mobile production-card screens portrait-first.
- Keep tablet portrait/landscape support without turning the app into a desktop admin three-panel layout.
- Keep actions icon-first, and expose only one current primary action for fabric/accessory status rows.
- Do not add new dependencies, font files, external image assets, real camera/file/upload/share/PDF/API/DB/R2/Worker behavior, or root package metadata changes.
- Align app display version to `2.0.0-alpha.4`.

### 2.0.0-alpha.5

Status: done.

- Correct the App-first mobile mock visual fidelity after App Design Theme v1 adoption.
- Remove runtime design-explanation strip from the app surface and keep theme rationale in docs.
- Reduce boxed sample-app feeling with softer surfaces, line-based metrics, compact navigation, and practical workbench spacing.
- Replace plain text image/material placeholders with React Native `View`/`Text` based garment thumbnail, representative image, output preview, and swatch visuals.
- Keep the mock professional, dense, and production-oriented without external assets, font files, or new dependencies.
- Keep normal mobile production-card screens portrait-first and tablet portrait/landscape support with restrained width.
- Keep all actions mock-only and preserve the one-current-primary-action rule for fabric/accessory rows.
- Defer image/attachment deepening and representative-image UX rules to a later checkpoint.
- Align app display version to `2.0.0-alpha.5`.

### 2.0.0-alpha.6

Status: done.

- Align the `apps/mobile` mock with the settled `/ui` production-card flow.
- Reframe the app mock away from generic production/project management and toward WAFL production-card input, order, factory-delivery, document, and delivery-request work.
- Add compact tab-aware `다음 확인` / `작업 사인` guidance.
- Reframe production flow as `제작 공장 + 추가 공정 + 공장 전달 준비`, not a full process-tracking system.
- Show output/share as document type plus included information first, with compact mock actions after.
- Keep user-facing wording as `사이즈·색상`.
- Keep alpha.5 visual fidelity improvements intact.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, file picker, share, order, delivery, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.6`.

### 2.0.0-alpha.7

Status: done.

- Strengthen the `apps/mobile` mock as a WAFL signature production-card UI.
- Add a compact production-flow progress rail for `발주 요청`, `자재 준비`, `재단`, `봉제/추가공정`, `검수/포장`, and `출고 준비`.
- Keep the progress rail as a handoff/readiness view, not a real-time production tracking system.
- Add an output/share document preview/workbench mock with document list, selected sheet preview, included information, delivery-request summary, and compact icon actions.
- Clean up icon-style action grammar without adding a new dependency.
- Fix the nested button risk by separating image tile containers from delete action controls.
- Preserve alpha.5 visual fidelity and alpha.6 `/ui` production-card flow alignment.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, file picker, share, order, delivery, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.7`.

## Next planned checkpoints

### 2.0.0-alpha.8

Status: done.

- Correct the `apps/mobile` mock toward real apparel-production usage rather than feature integration.
- Hide internal production-card IDs from customer-facing list, header, image/attachment, size/color, material/accessory, production-flow, output/share, and document preview surfaces.
- Remove per-image title/description burden from the default image tile face.
- Show representative-image crown/selection, first-image auto-representative direction, detail-view affordance, and delete affordance as mock UI only.
- Keep attachments separate from images and use existing WAFL allowed-extension shape for mock files: image/PDF examples only.
- Represent factory delivery memo as an editable-looking field, not a `.txt` attachment.
- Make cm/inch unit selection change the displayed measurement values so one cell never mixes both units.
- Show size-add and color-add mock actions plus product-type size-template suggestions.
- Remove `E`/`L` letter badges from fabric/accessory rows and use compact icon-like action clusters with one current primary action.
- Mark individual material/accessory photos as optional only.
- Normalize production flow to the six baseline steps: order, material, cutting, process, inspection, shipping.
- Simplify production-flow statuses to `준비`, `작업중`, and `완료`; show cutting as removable and separate process addition from flow-step addition.
- Polish output/share while keeping the alpha.7 document workbench and avoiding repeated action clusters.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, order, delivery, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.8`.

### 2.0.0-alpha.9

Status: done.

- Polish the `apps/mobile` mock button/action grammar after the alpha.8 real-use review.
- Remove repeated fabric/accessory bottom text primary buttons.
- Move fabric/accessory current-state primary actions into the row-top action cluster beside the status badge.
- Keep only one current-state primary action per fabric/accessory row; completed/locked rows show badge/read-only direction.
- Move fabric/accessory add actions to section-header `+` icon buttons.
- Restore and clarify the image/attachment top action row: image upload, camera, sketch, and attachment mock entry points.
- Keep image tiles thumbnail-first without per-image title/description input burden.
- Show inline-edit affordance instead of a repeated edit button; actual save/edit persistence remains out of scope.
- Widen and regularize the production-flow rail and group detailed process rows inside the process step.
- Keep process addition as the default visible `+` action and treat flow-step addition as an advanced/exception mock direction.
- Polish output/share icon action rows without adding real PDF/share/print/save behavior.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, order, delivery, inline-edit persistence, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.9`.

### 2.0.0-alpha.10

Status: done.

- Apply alpha.9 user feedback and polish action/icon interpretability in the `apps/mobile` mock.
- Make image/attachment top entry points readable as photo, camera, sketch, and attachment without connecting real picker/camera/upload behavior.
- Move image detail affordance onto the thumbnail itself and keep tile actions limited to representative selection and delete.
- Normalize fabric/accessory action clusters with compact labels for current action, lock/edit state, view, delete, and optional photo selection.
- Keep only one status-based primary action per fabric/accessory row: order request, order completion, or information check.
- Move size-add and color-add actions into their relevant size-template and color-list areas as compact `+` chips.
- Expand the six-step production-flow rail across available width while keeping detailed process rows grouped below.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, file picker, share, push notification, order, delivery, inline-edit persistence, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.10`.

### 2.0.0-alpha.11

Status: done.

- Apply alpha.10 field feedback and correct practical UX friction in the `apps/mobile` mock.
- Replace the uneven image grid with a one-image carousel/card, current index, representative state, sibling representative/delete actions, and an optional thumbnail strip.
- Show attachment upload time in `YYYY.MM.DD HH:mm:ss` format with file type and output include/exclude state.
- Clean up overview ambiguity by replacing trading/production and short memo rows with participating company rows and a stronger next-check work card.
- Redesign size/color around gender, product category, selected unit, saved template load/save, business-readable measurement columns, and color swatches.
- Simplify fabric/accessory order status flow to `입력중`, `발주요청`, and `완료`, with only the actions allowed for the current status.
- Improve the six-step production-flow rail spacing and current-step readability without changing the process model.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, file picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.11`.

### 2.0.0-alpha.12

Status: done.

- Apply alpha.11 field feedback before starting output/share flow deepening.
- Center and stabilize the image carousel, left/right navigation, current index, and centered index pills.
- Treat image and sketch titles as optional by showing safe fallback labels when no title is present.
- Keep photo, camera, sketch, and attachment entry actions readable with text labels and dependency-free symbols.
- Replace the always-visible gender/category/unit chip pile with compact current-value selectors.
- Hide saved size-template lists from the default screen; show only the current configuration plus load/save entry points.
- Separate size-template management actions from direct table-edit actions in the size section top action row.
- Keep material/accessory status text in a fixed position and use row border/background as secondary status support only.
- Keep allowed material/accessory actions per status: input can request/delete, requested can complete/cancel/delete, completed has no buttons.
- Replace send-like order symbols with explicit `발주요청` text and a neutral request/check helper symbol.
- Align production-flow rail dot, step label, and status on one centered axis while preserving the six baseline steps.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.12`.

### 2.0.0-alpha.13

Status: done.

- Correct alpha.12 UX items that still read as under-applied in the `apps/mobile` mock.
- Replace image/attachment action symbols with dependency-free visual helper icons for photo, camera, sketch, attachment, and representative-image selection.
- Keep image memo hidden by default and show fallback image labels only as small non-mandatory labels when a real title is absent.
- Change size/color controls so the default screen shows only current-value selector buttons for gender, product category, and unit.
- Keep saved size templates behind load/save mock entry points instead of showing the full list by default.
- Move fabric/accessory row actions onto the unit/price/amount line so repeated item rows stay compact.
- Keep material action rules: input can request/delete, requested can complete/cancel/delete, completed has no action buttons.
- Change the production-flow rail from segmented connectors to one continuous line with evenly placed dots, labels, and statuses.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.13`.

### 2.0.0-alpha.14

Status: done.

- Apply alpha.13 field feedback as a UI polish and local work-order CTA mock pass.
- Make image/attachment icons read as photo, camera, sketch, attachment, and representative crown without adding dependencies or assets.
- Remove meaningless decorative hanger marks from the main garment preview.
- Keep size/color selector widths stable across gender, category, and `cm`/`inch` changes.
- Add dependency-free helper icons to size/color load, save, size add, body-part add, and color add actions.
- Shorten material/accessory actions to `발주`, `완료`, `취소`, and `삭제`.
- Separate status badge styling from action button styling so repeated rows are scannable.
- Keep material order icons as production-document request shapes, not send/mail/airplane metaphors.
- Tighten the production rail so it ends at `출고` and emphasizes the current step.
- Add a top summary `작지 발주` CTA with a local confirmation panel and readiness checklist.
- After mock completion, show `발주` as complete and derive `자재` from existing fabric/accessory statuses.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, schema, migration, or production mutation.
- Align app display version to `2.0.0-alpha.14`.

### 2.0.0-alpha.15

Status: done.

- Adopt an actual icon library for the `apps/mobile` mock instead of continuing temporary hand-drawn icon primitives.
- Add `lucide-react-native` and Expo-compatible `react-native-svg` under `apps/mobile` only.
- Record package metadata and license basis: `lucide-react-native` ISC, `react-native-svg` MIT.
- Keep root `package.json` and root lockfile unchanged.
- Replace image, camera, sketch, attachment, crown, size/color, material/accessory, document, work-order CTA, top-bar, and output action icons with a central WAFL icon mapping.
- Preserve icon plus short label grammar where it helps production users read actions quickly.
- Keep per-item `발주` distinct from global `작지 발주`.
- Keep `작지 발주` as a local mock confirmation flow only.
- Tighten the production-flow rail so the line ends at `출고`.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, inline-edit persistence, schema, migration, or production mutation.
- Align app display version to `2.0.0-alpha.15`.

### 2.0.0-alpha.16

Status: done.

- Correct mobile and tablet section-tab alignment after the alpha.15 icon-library pass.
- Keep mobile section tabs visible and horizontally scrollable instead of replacing them with a dropdown.
- Center active tab text and underline on one stable axis and improve tab spacing.
- Add a compact mock search field under the 제작 카드 목록 header for product/style, factory/vendor, due date, and status lookup.
- Add subtle editable affordance only for values editable in the current mock state.
- Remove editable affordance from requested, completed, or locked material/accessory rows.
- Apply the same subtle editable/read-only distinction to production-flow process fields.
- Replace bottom-nav `C/I/D/S` shortcut letters with Lucide icons plus Korean labels.
- Keep the six-step production rail line ending at `출고`.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, search API, inline-edit persistence, schema, migration, or production mutation.
- Align app display version to `2.0.0-alpha.16`.

### 2.0.0-alpha.17

Status: done.

- Redesign inline-edit visual language after alpha.16 so dense rows do not look like repeated small input boxes.
- Keep fabric/accessory rows as compact summary cards with item identity, status, summary tokens, amount line, and note.
- Show subtle editable affordance only in `입력중` rows through dotted underline/value emphasis.
- Keep `발주요청` and `완료` rows read-only/locked by removing editable affordance.
- Preserve existing status-based material actions: input can request/delete, requested can complete/cancel/delete, completed shows no action buttons.
- Preserve section tab alignment, production-card search mock, bottom navigation Korean icon labels, and local mock `작지 발주` CTA.
- Keep the six-step production rail as the base flow summary and keep the rail line ending at `출고`.
- Remove or reduce the long base-step detail list below the rail so the mock does not imply every step is manually managed.
- Concentrate practical management in process-detail rows and show process meta as compact summary data rather than boxed fields.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, search API, inline-edit persistence, drag, long-press, schema, migration, or production mutation.
- Align app display version to `2.0.0-alpha.17`.

### 2.0.0-alpha.18

Status: done.

- Apply 에이투지체 / A2Z as the bundled app UI font for the `apps/mobile` mock.
- Add all nine A2Z TTF weights under `apps/mobile/assets/fonts/a2z/` with English repo filenames.
- Add `apps/mobile/assets/fonts/a2z/FONT-SOURCE.md` for internal source/license tracking.
- Load the A2Z font assets through the existing Expo font runtime before rendering the app.
- Map existing text weights in `ProductionCardMock` to A2Z Regular, Medium, SemiBold, and Bold for Korean labels, amount/quantity values, tabs, buttons, badges, and bottom navigation.
- Keep A2Z Black and ExtraBold available as assets but avoid overusing them in the dense production-card UI.
- Do not show font attribution in the app UI.
- Do not apply A2Z to PDF/Worker font embedding in this version.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, image picker, sketch, share, print, order, delivery, search API, inline-edit persistence, drag, long-press, schema, migration, or production mutation.
- Align app display version to `2.0.0-alpha.18`.

### 2.0.0-alpha.19

Status: done.

- Audit v1 migration/schema/API/query/payload paths from repository source without connecting to or mutating a database.
- Record the unbounded workorder list/summary contracts, row-level lateral aggregates, full material JSON summary, client-side full-array search, bulk-save N+1, and delete/reinsert collection writers as performance and integrity risks.
- Add `12-v1-db-api-performance-audit.md` with table/API/JSON/index inventory and KEEP/CHANGE/REPLACE/UNKNOWN judgments.
- Add `13-core-domain-schema-v2.md` with a revision-centered relational model, document-number/QR policy, state machines, list/detail/search contracts, index candidates, and immutable document snapshots.
- Add `14-v2-schema-migration-and-performance-plan.md` with additive shadow migration phases, backfill/rollback, and future dev/test 500/5,000-row performance gates.
- Keep existing company, partner, material master, material order/allocation, attachment lifecycle, and size-spec capabilities as migration inputs rather than deleting them.
- Do not add or execute migration SQL, DB/schema mutation, API/repository implementation, seed/fixture, benchmark, R2/Worker/PDF change, or production mutation.
- Keep root package files and dependencies unchanged; align app/mobile version metadata only.
- Align app display version to `2.0.0-alpha.19`.

### 2.0.0-alpha.20

Status: done.

- Confirm that `app/` and `apps/mobile/` are runtime boundaries rather than public-version folders; prohibit `app/v1`, `app/v2`, and equivalent mobile version roots.
- Keep existing DB paths as the legacy/current baseline and add `db/v2` as a README-only future architecture workspace.
- Confirm public app `1.0.0` can differ from internal architecture line `2.0.0-alpha.x` without source-folder renaming.
- Resolve alpha.19 decisions for company/season/item code ownership, all issued revision retention, inventory lot/ledger authority, correction revisions, and phased RLS/system-admin policy.
- Add `15-v2-source-db-boundary-and-release-policy.md`.
- Add `16-workorder-api-command-read-model-contracts.md`.
- Add `17-v2-api-contract-test-plan.md`.
- Add neutral type-only contracts under `lib/domain/work-orders/contracts/` for primitives, enums, transitions, cursor pagination, read models, commands, readiness, errors, and authorization scope.
- Add compile/static contract tests that forbid command-body company scope, unbounded list DTOs, storage keys/raw tokens, runtime API imports, and SQL under `db/v2`.
- Keep list default/max at 30/50 and use opaque stable cursor pagination.
- Require explicit entity versions and idempotency for issue/completion commands.
- Define alpha.21 SQL/RLS draft and alpha.22 dev/test apply/500/5,000-row benchmark gates without creating or executing SQL now.
- Do not change existing migrations/schema/API repositories/mobile runtime/R2/Worker/PDF behavior or production data.
- Keep root package files and dependencies unchanged; align app/mobile version metadata only.
- Align app display version to `2.0.0-alpha.20`.
- Result: the README-only `db/v2` boundary, neutral WorkOrder type contracts, compile/static contract tests, and canonical documents 15 through 17 were added without runtime integration or SQL.
- Verification: root/mobile TypeScript, Expo public config, document link/Mermaid checks, WorkOrder contract checks, Unicode, route guards, Next production build, and `automation-infrastructure` approved workflow PASS; mutation audit high-risk count is 0.
- Git delivery: finalized by the approved version workflow; the matching commit/push identity is recorded in the generated repo-state artifact.
- User confirmation: no visual or runtime behavior changed, so no manual product QA is required for this architecture-contract checkpoint.

### 2.0.0-alpha.21

Status: done.

- Add six ordered additive migration SQL drafts under `db/v2/migrations/` without applying them.
- Guard every draft against unapproved or production execution.
- Define company scope, tenant RLS, separate audited privileged-system scope, immutable revisions/documents, atomic document sequence allocation, and hash-only QR access metadata.
- Add revision-scoped material, color/size, size-spec, process, asset linkage, document, and domain-event relational tables.
- Add tenant-consistent `NOT VALID` constraints and cursor/tab/document/history indexes for later validation.
- Add `tests/workorder-v2-migration-schema-contract.mjs` and keep the alpha.20 WorkOrder API/type contract passing.
- Add `18-v2-additive-migration-draft-and-schema-contract.md` linking API contracts to schema drafts and alpha.22 gates.
- Keep legacy DB/schema/migration files, `app/api`, runtime repositories, R2/Worker/PDF, root package files, and dependencies unchanged.
- Do not connect to Neon or execute migration, constraint validation, seed, Full Reset, benchmark, EXPLAIN, or any mutation.
- Align app/mobile version metadata to `2.0.0-alpha.21`.
- Result: six execution-guarded additive drafts, the schema contract test, and document 18 map alpha.20 API contracts to a relational/RLS migration boundary without DB access.
- Verification: WorkOrder API/type contract, migration schema contract, root/mobile TypeScript, Expo public config, Unicode, route guards, document link/Mermaid, Next build, PowerShell encoding, and approved workflow PASS; mutation audit reports 189 findings and 0 high-risk.
- User confirmation: no SQL was applied and no runtime/UI behavior changed, so manual product QA is not required for this static architecture checkpoint.

### 2.0.0-alpha.22

Status: done.

- Add canonical dev/test-only preflight, migration apply, read-only validation, deterministic seed, runtime verification, and failure handoff commands.
- Require development/test runtime, approved connection fingerprint, canonical `wafl-fn` prefix, exact operation confirmation, and production blocking before connection mutation.
- Apply only `db/v2/migrations/001` through `006` and record filename/SHA-256/baseline identity in a six-row migration ledger.
- Preserve the v1 baseline and verify tenant table, RLS policy, FK/index, orphan, tenant mismatch, revision-child, and document-number contracts.
- Use a dedicated `NOLOGIN`, `NOBYPASSRLS` runtime role so tenant tests do not rely on the migration owner's RLS-bypass role.
- Seed deterministic profiles of 500, 5,000, and multi-tenant 5,400 WorkOrders, totaling 10,900 synthetic rows at the WorkOrder level.
- Verify tenant/privileged audit, cursor, expectedVersion conflict, idempotency, immutable revision, stale readiness, and atomic document sequence behavior.
- Record list/detail/search p50/p95/max, query counts, and 30/50 payload sizes. All alpha.22 budgets pass.
- Keep 44 tenant FKs `NOT VALID` after proving zero validation-precondition issues; actual `VALIDATE CONSTRAINT` remains a later explicit schema gate.
- Preserve failed-run source/repo-state/log sets under `Logs/Repo_Status/Failure_Handoff`; never publish them to `4. Newest`.
- Keep legacy DB source, `app/api`, mobile runtime integration, R2/Worker/PDF, production data, root package files, and dependencies unchanged.
- Align app/mobile version metadata to `2.0.0-alpha.22`.
- Result: approved dev/test additive apply, 10,900 deterministic fixtures, RLS/cursor/concurrency verification, and performance evidence are complete. Production migration and API cutover remain blocked.
- Verification: runtime evidence plus WorkOrder static contracts, root/mobile TypeScript, Expo config, Unicode, route guards, document links/Mermaid, PowerShell encoding, build, mutation audit, and approved workflow must pass before Finish.
- User confirmation: no visual UI changed; no manual product QA is required for this DB architecture/runtime checkpoint.

### 2.0.0-alpha.23

Status: implementation and dev/test read-only runtime verification complete; final Verify/Finish pending.

- Implement the first v2 runtime read path at `GET /api/v2/work-orders` without adding any command endpoint.
- Reuse the canonical alpha.20 `WorkOrderListPage`, branded primitives, error codes, and cursor limits rather than creating a duplicate public DTO.
- Require the existing workspace session guard and `workorder.read`; derive company scope only from the authenticated session and reject `companyId`, `workOrderId`, and other unsupported query parameters.
- Keep the route disabled unless the dev/test runtime, approved DB fingerprint, `wafl-fn` prefix, read approval, and feature gate all match before any DB-backed auth guard runs.
- Use an expiring HMAC-signed cursor bound to tenant and visibility scope with `(updated_at DESC, id DESC)` ordering.
- Start the list-only tenant transaction with fixed `BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime` SQL in one protocol call, then use two bounded repository callback statements for local claims and the list SQL. The response query-count header describes these callback statements, not all endpoint protocol round trips.
- Limit page IDs to at most 51 before batch material/process/document/image summaries; prohibit `SELECT *`, lateral row aggregation, child JSON aggregation, and storage/token/snapshot fields.
- Add a static list API contract and a canonical read-only HTTP runtime runner for active company A/H/B reads, approval-pending company C denial, cross-company cursor isolation, cursor traversal, typed errors, query/payload/latency evidence, and before/after DB snapshot equality.
- Keep the Expo mobile mock disconnected from the API. Do not add migration, seed, cleanup, reset, rollback migration, detail/tab API, R2/Worker/PDF, production access, root package, lockfile, or dependency changes.
- Align app/mobile version metadata to `2.0.0-alpha.23`.
- Result: approved dev/test index 007 keeps the page material aggregate bounded, and the final read-only runtime evidence records Company A DB/API p95 `86.17ms`/`463.29ms` and Company H API p95 `481.46ms`; 500/5,000 cursor traversal, tenant isolation, typed errors, payload, and query budgets pass.
- Mutation accounting: index 007 was the only approved alpha.23 dev/test schema mutation. The final runtime verification itself changed no schema, seed, business data, R2/Worker/PDF, or production state.

### 2.0.0-alpha.24

Status: done. Final Git delivery identity is recorded in the matching repo-state artifact.

- Add `GET /api/v2/work-orders/:workOrderId` for compact core identity, current revision, status, quantities, due date, amounts, representative metadata, readiness, document summary, and tab counts.
- Add tab-specific lazy GET routes for materials, size-color, size-spec, processes, assets, documents, and history without connecting the Expo app.
- Keep materials/assets/documents/history bounded by signed 30/50 cursors bound to company, visibility, WorkOrder, and tab kind.
- Reuse the alpha.23 runtime guard, workspace permission, fixed tenant read-only transaction helper, RLS claims, typed error envelope, and PostgreSQL UUID textual validation.
- Return generic `NOT_FOUND` for invalid/missing/cross-company IDs and retain company C `FORBIDDEN` policy.
- Keep repository callback statements at two: claims plus one core/tab SQL. Document this separately from all endpoint protocol calls.
- Omit storage keys, signed/raw URLs, document snapshots, token hashes/raw tokens, event metadata, privileged context, and unnecessary actor identity.
- Reuse migration ledger 7, index 007, and the alpha.22 synthetic seed without migration, schema validation, seed, cleanup/reset/rollback, business-data, R2/Worker/PDF, or production mutation.
- Require core/tab DB p95 <= 250ms, API p50/p95/max/outlier evidence before assertions, cursor duplicate/missing zero, forbidden-field scanning, and pre/post DB snapshot equality.
- Align app/mobile version metadata to `2.0.0-alpha.24`.
- Runtime result: Company A core DB/API p95 `79.96ms`/`464.02ms`; tab DB p95 `74.66~83.31ms`; tab API p95 `446.89~476.41ms`; Company H core DB/API p95 `81.75ms`/`455.84ms`. API over-500ms outliers are 0.
- Runtime correctness: A/H/B reads, C `FORBIDDEN`, generic cross-company `NOT_FOUND`, typed errors, accessory/assets cursor duplicate/missing 0, forbidden-field scanner, payload budgets, and pre/post DB snapshot equality PASS.
- Runtime mutation accounting: schema, seed, business data, R2/Worker/PDF, and production mutation are all false. Two failed read-only cycles remain preserved as failure handoffs and do not enter `4. Newest`.

### 2.0.0-alpha.25

Status: implemented and approved dev/test Command runtime verified.

- Add only `POST /api/v2/work-orders` and `PATCH /api/v2/work-orders/:workOrderId` for draft create and current-draft scalar basic-info update.
- Reuse authenticated company/member scope, `workorder.create`/`workorder.update`, the fixed `NOBYPASSRLS` tenant role, migration ledger 7, and the existing command receipt/domain event schema.
- Require a create Idempotency-Key, actor-scoped hashed receipt key, one-effect replay, and typed conflict for same-key/different-payload reuse.
- Require `expectedVersion` and a single-winner compare-and-set update of the current draft revision only.
- Keep create/revision/event/receipt and WorkOrder/revision/event updates inside one transaction; partial mutation is forbidden.
- Do not issue a display document number or connect materials, processes, revision issue, PDF/QR/R2/Worker, mobile, business data, or production.
- Before explicit owner approval, run only static checks and invalid/auth/read-regression preflight requests with identical before/after DB snapshots. Keep APP_VERSION at alpha.24 and do not commit/push/Finish.
- Preflight result: approved fingerprint `01e5dcc7fea3`, ledger 7/7, Company C pre-mutation denial, alpha.23/24 GET regression, and identical before/after schema/row snapshots PASS. No valid POST/PATCH or mutation was executed.
- Approved runtime result: Company A synthetic WorkOrder/R0/hashed receipt `+1/+1/+1`, audit event `+3`, and two successful version transitions; idempotency, optimistic concurrency, tenant isolation, Company C `FORBIDDEN`, finalized revision `LOCKED`, and alpha.23/24 Read regression PASS.
- Runtime performance evidence: create/replay/update DB `715.57ms`/`453.82ms`/`529.44ms`; API `1381.97ms`/`606.16ms`/`687.03ms`. These are one-shot Command evidence values, not a production performance baseline.
- Runtime mutation accounting: approved dev/test synthetic test data only. Migration/schema/index, seed, cleanup/reset/rollback, business data, R2/Worker/PDF, and production mutation are false.

## Later integration phases

API, DB, R2, PDF, Worker, native auth, and production deployment integration must be separate phases after mock app structure is stable.

## Current blocked work

Until explicitly approved, do not do:

- DB migration,
- production API changes,
- R2/Worker mutation,
- real PDF generation,
- root package dependency changes,
- root lockfile changes,
- production behavior changes.
