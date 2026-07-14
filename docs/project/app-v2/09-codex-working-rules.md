# WAFL v2 App-first Codex Working Rules - 2.0.0-alpha.40

## Alpha.40 output and action-density boundary

- Compact mobile material action visuals must retain accessible labels/state and at least a 42px effective hit target. Do not remove summary values, add horizontal scrolling, or split actions into a separate row.
- Web Preview uses one popup only. Never fall back to `window.location.assign` or otherwise navigate the source production-card tab.
- The work-instruction document uses an HTML image element and explicit image readiness; CSS background-image is not accepted for representative PDF media.
- Official Preview actions use controlled generated-document view/download/share. `window.print()` is not an official output path.
- Internal generated-PDF delivery is authenticated, tenant-scoped, read-only, and server-side. It validates generated status, revoke/delete state, MIME, size, SHA, and PDF header before returning bytes.
- The realistic sample PDF route remains localhost-only and may create only excluded local Chromium artifacts. DB writes, token changes, generated-document changes, R2 PUT/DELETE, Worker execution, migration, and production access are forbidden.

## Alpha.39 approval boundaries

- Alpha.39 migration/runtime approvals are consumed. Migration 011 and the retained token runtime evidence do not authorize replay, additional token creation, cleanup, R2 mutation, or production access.

- Source/static/build and read-only migration preflight may proceed while APP_VERSION remains alpha.38.
- Migration 011 apply requires its own exact approval and may add only ledger row 011 plus two SECURITY DEFINER functions/grants; table/column/index/data/R2/production deltas remain zero.
- Token runtime requires a second approval after post-apply audit. It may create at most two token rows, perform three bounded token updates, append five events, and GET the retained PDF; R2 PUT/DELETE and generated-document mutation remain zero.
- Raw tokens and viewer URLs containing tokens must never enter logs, repo-state, screenshots, handoff ZIPs, cookies, events, or DB rows. DB stores only SHA-256 token hashes.
- Migration/runtime may not be automatically retried. Partial state requires bounded read-only audit and Failure Handoff; cleanup or rollback needs separate approval.
- `4. Newest`, APP_VERSION, stage, commit, push, and Finish remain unchanged until migration, runtime, browser evidence, and completion audit all pass.

## Alpha.38 generated-document persistence boundary

- Generated-document identity comes only from PostgreSQL native `uuid DEFAULT gen_random_uuid()` and `INSERT ... RETURNING id`; application-generated or deterministic entity UUIDs are forbidden.
- Idempotency uses the tenant/command/key receipt, request SHA, and tenant-safe UUID FK. Replays return the linked document and must not render, PUT, finalize, or emit another event.
- Prepare, render/upload, and finalize are separate lifecycle boundaries. A committed pending row is retained and audited; uncertain R2 outcomes are checked read-only and are never auto-deleted or blindly re-uploaded.
- The R2 key is immutable and exact: `companies/{companyId}/workorders/{workOrderId}/pdf/{generatedDocumentId}.pdf`. A generated identity gets at most one object and no overwrite fallback.
- Local Chromium readiness uses explicit root, font, image, and page markers. `networkidle`, arbitrary sleep, and ignored console/network failures are not accepted PDF readiness criteria.
- Migration/runtime continuations require exact target fingerprint, ledger, pending identity, object absence, and bounded mutation budgets. No automatic retry, cleanup, rollback, or production access is allowed.
- Alpha.38 retains its one dev/test receipt/document/event/object for alpha.39 viewer security work. Retention does not authorize QR, token, revoke, delete, or public viewer behavior.

## Alpha.37 immutable PDF foundation boundary

- The only canonical v2 work-instruction PDF source is an issued/finalized `WorkOrderIssuedPreviewReadModel` rendered by `IssuedWorkOrderDocument`; do not substitute the legacy work-order or order-request PDF pipelines.
- Snapshot JSON uses deterministic object-key sorting, domain array order, ISO dates, and SHA-256. Never persist signed URLs, secrets, credentials, temporary paths, or binary buffers in the snapshot.
- Local Chromium and excluded local object-store evidence are allowed. A generated-document DB write, R2 read/write, Worker execution, QR/access-token creation, or production access is forbidden until separately approved alpha.38 work.
- Generation keys are immutable and tenant/work-order scoped. Reusing a key for a different generation is forbidden.
- Generation-number allocation must hold a revision/document-type concurrency lock; `MAX + 1` without that lock is forbidden.
- Render/upload/finalize partial states require bounded reconciliation. Never auto-delete an uncertain R2 object.
- Report this checkpoint as `LEVEL_4_FOUNDATION_VERIFIED`, not persisted PDF/R2 lifecycle completion.

## Alpha.36 material summary and card-separation boundary

- Preserve exactly two core input rows with three fields each, the 22px inline grammar, unit under the material name, and one final summary/action row.
- The final summary names order quantity, unit price, and amount. Missing calculation prerequisites use neutral dashes and never fabricate zero values.
- Core fields and unit use no default placeholder copy. Missing required values remain a label/underline state; only usage area and memo keep production placeholders.
- Strengthen card separation with restrained spacing and faint surface/border/accent grammar. Do not add heavy shadows, thick borders, nested boxes, or card-height growth.
- Preview/PDF structure is regression-only. Do not connect API persistence, DB, generated documents, QR, R2, Worker, or production behavior.
- Alpha.37 owns immutable PDF binary and R2 storage foundation under a separate approved work order.

## Alpha.35 material compact-input boundary

- Keep material core information in exactly two rows: supplier/color-option/unit-price, then required/allowance/stock. Labels and values share each 22px row and do not become boxed controls.
- Unit is a separate same-position field below the material name. It changes quantity suffixes only; numeric conversion is forbidden in this mock.
- Calculate order quantity as `max(required + allowance - stock, 0)` and amount from unit price in local component state only. Do not connect a mobile Command or persistence path.
- Missing required values use only muted field-level emphasis. Do not add warning sentences, extra badges, or a warning/reference footer.
- The final MaterialRow block combines order summary and state-based `nowrap` actions. Nothing follows it.
- Preview renderer/sample/API/DB/R2/Worker/PDF lifecycle is frozen for this version. Actual immutable document lifecycle remains alpha.36 scope.

## Alpha.34 mobile sample entry and material footer boundary

- Treat Preview destinations as explicit targets: `issued-document` for immutable tenant data and `dev-realistic-sample` for the localhost-only deterministic sample. Never infer one from the other or fall back from actual data to sample data.
- Every Preview affordance in the disconnected Expo production-card mock uses the sample target. Native still requires the configured approved web base; development sample URLs must resolve to localhost loopback and must be rejected in production.
- Fabric/accessory status/reference messages and available actions share one final footer band. Messages stay left, actions stay right and `nowrap`, and the band is omitted when neither side exists.
- Preserve alpha.32's 22px single-line field grammar, cancel/commit guards, card stability, locked affordance rules, and display-only process memo merge.
- Browser print-to-PDF remains disposable QA evidence. Actual generated-document metadata, immutable PDF binary, QR, R2, Worker, revoke/regenerate/trash, and production lifecycle remain alpha.36 scope.

## Alpha.33 actual/sample and material-card boundary

- Actual issued Preview displays only its tenant-scoped immutable revision data. Never add realistic-sample fallback for a missing image, matrix, memo, material, or process.
- The realistic sample route and entry are localhost-only, visibly labeled as a sample, and absent on production hosts.
- Stable internal category codes may use a display-only Korean label mapping. Do not rewrite product names, memos, persisted data, or unknown values.
- Fabric/accessory cards read in this order: header, basic information, usage area/memo, order summary, warning/reference, footer actions. No input, warning, or information follows the action footer.
- Keep alpha.32's 22px single-line inline edit and double-completion guards unchanged.
- Browser print-to-PDF remains excluded QA evidence. Actual PDF binary, QR, R2, Worker, generated-document lifecycle, and production storage remain alpha.36 scope.

## Alpha.32 inline density and sample boundary

- Factory-facing mock fields use one compact single-line edit grammar with shared summary typography and a stable 22px row; editing must not expand the card.
- Escape cancels without a following blur commit. Enter or blur commits a changed value once; unchanged normalized values do not commit.
- Mobile and Preview omit separate process application-area and application-color UI. Existing DB/API fields remain compatible and are merged into work memo for display only, never written back.
- The localhost sample uses deterministic source data and repository-owned assets only. It must not call tenant APIs, read business data, or use external image URLs.
- Browser print-to-PDF is a disposable QA artifact, not generated-document/PDF lifecycle execution. PDF/QR/R2/Worker lifecycle remains alpha.36 scope.

## Alpha.31 inline and Preview boundary

- Short factory-facing fields edit in the same visual position; do not render a summary value and a second boxed input for the same field.
- Long notes collapse to one or two lines and expand in place. Issued/finalized, completed, locked, or unauthorized values use the same read-only component without dotted edit affordance.
- Issued Preview loading stays separate from the pure document renderer. Actual Preview remains revision-scoped and immutable; deterministic localhost samples use the same renderer without tenant API or business data.
- The cover is A4 landscape and continuation pages are A4 portrait. Pack sections according to content, repeat table headers, and keep rows intact instead of forcing one section onto every page.
- PDF binary generation, QR, R2, Worker, regeneration/revoke/trash, and generated-document lifecycle remain alpha.36 scope.

## Alpha.30 preparation gate

- Migration 009 apply and bounded draft Command runtime require two separate approvals.
- Factory-facing values remain revision-scoped and immutable after issue; Preview must not supplement missing issued values from mutable data.
- Factory Preview excludes inventory, order quantity, unit price, amount, and internal state while operational APIs retain them.

## Alpha.29 mobile Preview entry boundary

- Mobile Preview entry uses issued document metadata and a tenant-safe Next resolver; raw WorkOrder/revision UUIDs are not embedded in mobile UI source.
- `EXPO_PUBLIC_WAFL_WEB_BASE_URL` is the production configuration boundary. Localhost fallback is Expo Web development-only and must never activate in production.
- Web opens Preview with `noopener,noreferrer`; native uses the system browser through `Linking`. Tokens, company scope, session claims, and storage keys are never URL parameters.
- The resolver and runtime verification are GET/read-only. Mobile-to-web SSO, anonymous sharing, WebView, PDF, QR, R2, and document lifecycle remain excluded.

## Alpha.28 Preview boundary

- Issued Preview uses an explicit WorkOrder/revision pair and revision-scoped immutable rows.
- Missing snapshot fields are not supplemented from mutable WorkOrder, partner, member, or asset masters.
- Preview omits storage keys, signed URLs, raw snapshots, tokens, secrets, and internal actor identifiers.
- Child SQL placeholders and parameter arrays require query-by-query continuity contracts.

## Purpose

This document defines Codex rules for the App-first `2.0.x` line.

## Prompt header rule

Every future Codex instruction for App-first work should start by stating:

```text
Codex 추론 수준:
Codex 속도:
```

Recommended defaults:

- document/UI repeat correction: `높음 + 고속`
- app structure/environment/build setup: `높음 + 표준`
- DB/API/PDF/R2 real integration: `높음` or `매우 높음 + 표준`

## Required read order

Before any App-first file modification, read:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/app-v2/00-start-here.md`
4. `docs/project/app-v2/01-app-first-product-definition.md`
5. `docs/project/app-v2/02-mobile-tablet-ux-principles.md`
6. `docs/project/app-v2/03-app-architecture.md`
7. `docs/project/app-v2/04-auth-google-apple.md`
8. `docs/project/app-v2/05-device-test-plan.md`
9. `docs/project/app-v2/06-expo-environment-setup.md`
10. `docs/project/app-v2/07-feature-map-from-ui-alpha27.md`
11. `docs/project/app-v2/08-roadmap-2.0.md`
12. `docs/project/app-v2/09-codex-working-rules.md`
13. `docs/project/app-v2/10-public-landing-site.md`
14. `docs/project/app-v2/11-app-design-theme-v1.md`
15. `docs/project/app-v2/12-v1-db-api-performance-audit.md`
16. `docs/project/app-v2/13-core-domain-schema-v2.md`
17. `docs/project/app-v2/14-v2-schema-migration-and-performance-plan.md`
18. `docs/project/app-v2/15-v2-source-db-boundary-and-release-policy.md`
19. `docs/project/app-v2/16-workorder-api-command-read-model-contracts.md`
20. `docs/project/app-v2/17-v2-api-contract-test-plan.md`
21. `docs/project/app-v2/18-v2-additive-migration-draft-and-schema-contract.md`
22. `docs/project/app-v2/19-v2-dev-test-migration-and-performance-evidence.md`
23. `docs/project/app-v2/20-workorder-list-read-api-evidence.md`
24. `docs/project/app-v2/21-workorder-detail-lazy-read-api-evidence.md`
25. `docs/project/app-v2/22-workorder-create-basic-update-command-evidence.md`
26. `docs/project/app-v2/23-workorder-material-order-command-evidence.md`
27. `docs/project/app-v2/24-workorder-revision-issue-command-evidence.md`
28. `docs/project/app-v2/25-workorder-issued-revision-preview-evidence.md`
29. `docs/project/app-v2/26-mobile-issued-preview-entry-evidence.md`
30. `docs/project/app-v2/27-factory-workorder-input-and-preview-evidence.md`
31. `docs/project/app-v2/28-inline-input-and-preview-layout-evidence.md`
32. `docs/project/app-v2/29-inline-density-and-realistic-sample-evidence.md`
33. `docs/project/app-v2/30-realistic-preview-entry-and-material-card-flow-evidence.md`
34. `docs/project/app-v2/31-mobile-preview-sample-and-material-footer-evidence.md`
35. `docs/project/app-v2/32-mobile-material-compact-input-evidence.md`
36. `docs/project/app-v2/33-mobile-material-card-separation-and-summary-evidence.md`
37. `docs/project/app-v2/34-issued-revision-pdf-generation-foundation-evidence.md`
38. `docs/project/v2/00-start-here.md` through `docs/project/v2/14-operational-policy-absorption.md`
39. `docs/project/25-korean-unicode-encoding-standard.md`
40. `docs/project/32-product-completion-and-ui-evidence-standard.md`
41. `docs/project/26-final-policy-decisions-and-master-todo.md`
42. `docs/project/31-pre-codex-integrated-master-plan.md`

## 4. Newest rule

`4. Newest` should contain final deliverables only.

For `2.0.x` App-first pipeline handoff, keep only:

- source ZIP,
- repo-state.

Build logs and verification logs should be stored under `Logs/Repo_Status` and referenced from repo-state unless a future pipeline contract explicitly changes this.

`approved-workflow.ps1 -Action Finish` success alone is not the completion signal. Before reporting a version complete, verify all of the following:

- `4. Newest` contains exactly one final source ZIP and one matching repo-state for the current `HEAD` and `APP_VERSION`.
- Neither artifact is missing, stale, or from a previous version.
- Matching build-result and verification logs exist under `Logs/Repo_Status` and are referenced by repo-state.
- Prior-version, duplicate, empty, or intermediate handoff artifacts are absent from `4. Newest`.
- The source ZIP applies the full exclude contract, including `.env*` and `.env.example`.
- `commit-meta.md` remains ignored local patch metadata and is never staged or committed.

If any check fails, the version remains incomplete and the handoff must be repaired and revalidated before reporting completion.

The source ZIP must exclude:

```text
node_modules
apps/mobile/node_modules
.next
.tmp
artifacts
reports
.env*
test-results
playwright-report
coverage
*.tsbuildinfo
cloudflare/pdf-generator-worker/node_modules
generated zip files
repo-state txt
build logs
verification logs
```

Patch ZIPs, when requested, must use a flat structure and include a top-level `commit-meta.md`.

`commit-meta.md` must include:

```text
Version :
Summary :
Description :
수정 파일 목록 :
추가 파일 목록 :
삭제 파일 목록 :
```

Do not stage or commit `commit-meta.md`.

## Forbidden by default

Unless a future work order explicitly allows it, do not change:

```text
app/api
db
cloudflare
package.json
package-lock.json
pnpm-lock.yaml
pnpm-workspace.yaml
.env*
```

Do not create `mobile/`, `apps/mobile/`, or an Expo project before the `2.0.0-alpha.2` skeleton work order.

For `2.0.0-alpha.2`, `apps/mobile` is explicitly allowed as a standalone Expo skeleton. Allowed files are limited to:

```text
apps/mobile/package.json
apps/mobile/package-lock.json
apps/mobile/app.json or app.config.*
apps/mobile/tsconfig.json
apps/mobile/expo-env.d.ts
apps/mobile/app/**
apps/mobile/assets/**
apps/mobile/components/**
apps/mobile/constants/**
apps/mobile/README.md
```

Do not create a root workspace, root lockfile change, or root package metadata change for the mobile skeleton.

## Route boundary for App-first

- `www.wafl.co.kr` is the public app landing site.
- `/ui`, `/roadmap`, and `/functions` are localhost-only development check routes.
- These routes must be blocked on production domains, Vercel preview hosts, and `www.wafl.co.kr`.
- `/system` and `/workspace` are long-term removal targets, but must not be deleted without a separate explicit replacement/removal work order.

## Verification baseline

Prefer the project pipeline wrapper when it covers the scope:

```text
tools/pipeline/approved-workflow.ps1 -Action Verify
```

For documentation/version-only patches, safe supporting checks may include:

```text
npm run build
npx tsc --noEmit
git diff --check
git diff --cached --check
node tests/unicode-encoding-contract.mjs
```

Do not run destructive DB/R2/Worker commands for App-first documentation work.

For the mobile skeleton, run mobile checks from `apps/mobile` when dependencies are installed:

```text
npm run typecheck
npm run expo:config
```

## App design theme rule

`docs/project/app-v2/11-app-design-theme-v1.md` is the active visual foundation for `2.0.0-alpha.4` and later until replaced.

Rules:

- The app theme is `동대문 제작 워크룸 / Dongdaemun Atelier Ops`.
- Normal mobile production-card screens are portrait-first.
- Tablet must support portrait and landscape.
- The future sketch/drawing module may allow mobile landscape as an exception.
- Do not add font files, external images, or new dependencies for visual polish unless a work order explicitly approves them.
- Real camera, file upload, share, PDF, API, DB, R2, and Worker behavior must remain disconnected during mock-only visual foundation work.

## 2.0.0-alpha.10 icon/action polish rule

For the alpha.10 mobile mock:

- Compact icon actions may include short Korean captions when symbols alone are ambiguous.
- Image thumbnail detail/view and destructive tile actions must stay as sibling controls, not nested buttons.
- Fabric/accessory rows must keep one current status action at most.
- Delete, lock, view, optional photo, order request, and order complete controls should use a consistent compact row grammar.
- Size/color add controls should be placed near the list/table they affect.
- Do not add dependencies, icon libraries, external assets, real camera/file picker/upload/share/PDF/order/delivery behavior, API, DB, R2, Worker, or push notification behavior for this polish pass.

## 2.0.0-alpha.11 UX correction rule

For the alpha.11 mobile mock:

- Image/attachment should use a carousel/card when image counts grow; do not fall back to an uneven mobile grid for the main review flow.
- Attachment rows must include upload time in `YYYY.MM.DD HH:mm:ss` mock format.
- Overview labels should be concrete production terms such as participating company, fabric supplier, accessory supplier, sewing factory, or inspection partner.
- Size/color defaults should be gender/category/unit/template based. Avoid product-type chip piles that look like fixed taxonomy policy.
- Fabric/accessory status actions must follow `입력중` -> `발주요청` -> `완료`; request and complete controls must not be visible together.
- Production-flow rail readability is a layout concern only. Do not redefine the process model or add persistence.
- Do not add dependencies, icon libraries, external assets, real camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, or push notification behavior for this polish pass.

## 2.0.0-alpha.12 alpha.11 UX follow-up rule

For the alpha.12 mobile mock:

- Do not start output/share flow deepening until alpha.11 carousel, selector, material status, and production rail feedback is corrected.
- Image carousel index pills should be centered and stable.
- Image/sketch titles are optional and must have fallback labels.
- Size/color should use current-value selectors rather than one large always-visible option pile.
- Saved template lists should be hidden from the default screen.
- Material/accessory status labels should remain fixed in position across rows.
- Completed material/accessory rows should show no action buttons.
- `발주요청` action should be text-first and must not use send/mail/airplane-like symbols.
- Do not add dependencies, icon libraries, external assets, real camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, or push notification behavior for this polish pass.

## 2.0.0-alpha.13 alpha.12 UX follow-up rule

For the alpha.13 mobile mock:

- Treat this as another alpha.12 UX correction, not output/share flow deepening.
- Image action icons must be dependency-free visual helper components or existing local primitives, not emoji or new icon dependencies.
- Image memo should stay hidden on the default carousel surface.
- Size/color selectors should show current values only on the default screen.
- Material/accessory row actions should sit on the same visual line as unit, unit price, and amount when possible.
- Completed material/accessory rows should show no action buttons.
- Production rail should use one continuous line with dots on top, not visually separate connector fragments.
- Do not add dependencies, icon libraries, external assets, real camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, or push notification behavior for this polish pass.

## 2.0.0-alpha.14 UI polish + work-order CTA rule

For the alpha.14 mobile mock:

- Treat this as UI polish plus local `작지 발주` CTA mock only.
- Do not start real output/share, PDF, print, order, delivery, upload, camera, image picker, sketch, API, DB, R2, Worker, schema, migration, or production mutation work.
- Image/attachment icons must remain dependency-free local primitives.
- Size/color selectors must keep stable widths when mock values change.
- Status badges and action buttons must use distinct visual grammar.
- Per-item `발주` and global `작지 발주` must remain verbally and visually distinct.
- The `작지 발주` confirmation panel may change only local screen state.
- After mock completion, the rail may show `발주` complete and `자재` derived from existing fabric/accessory statuses.
- Completed material/accessory rows still show no action buttons.
- Do not add dependencies, icon libraries, external assets, fonts, root package changes, root lockfile changes, or real production integration.

## 2.0.0-alpha.15 icon library rule

For the alpha.15 mobile mock:

- `apps/mobile` may use `lucide-react-native` with `react-native-svg` for the icon system.
- Prefer the WAFL local icon wrapper/mapping over ad hoc inline drawings, emoji, or temporary text symbols.
- Keep icon plus short label where pure icon-only slows production judgment.
- Per-item `발주` and global `작지 발주` must stay distinct.
- Do not introduce another icon library for the same purpose.
- Do not add font files, external image assets, root package changes, root lockfile changes, real camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, schema, migration, or production mutation.

## 2.0.0-alpha.16 tab/search/editability rule

For the alpha.16 mobile/tablet mock:

- Keep section tabs visible on mobile and tablet; do not replace them with a dropdown.
- Tablet tabs should align as a balanced row inside the production-card content width.
- Mobile tabs may horizontally scroll, but active text and underline should remain visually centered.
- Add only a mock search entry point for the production-card list. Do not connect real search/filtering.
- Use subtle editable affordance only for fields whose current row/process state is editable in the mock.
- Remove editable affordance from requested, completed, or locked rows.
- Bottom navigation must use Lucide icons plus Korean labels, not internal shortcut letters.
- Reuse the existing icon library from alpha.15; do not add another dependency.
- Do not add font files, external image assets, root package changes, root lockfile changes, real search/edit-save/camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, schema, migration, or production mutation.

## 2.0.0-alpha.17 inline edit and production-flow simplification rule

For the alpha.17 mobile/tablet mock:

- Treat the work as visual-language correction, not output/share or real edit integration.
- Fabric/accessory rows must read as compact material summary rows, not a grid of repeated input boxes.
- `입력중` rows may show subtle editable value affordance with dotted underline or quiet value emphasis.
- `발주요청` and `완료` rows must remove editable affordance and keep locked/read-only meaning.
- Do not show long helper copy for every editable value.
- Keep the six-step production rail, but remove or greatly reduce the base-step detail list under it.
- Concentrate practical process management in `공정 단계 안의 세부 공정`.
- Process detail rows should show compact meta summaries and memo, not small boxed fields.
- Preserve alpha.16 tab alignment, production-card search mock, bottom nav Korean labels, and the local mock `작지 발주` CTA.
- Reuse the existing icon library from alpha.15; do not add another dependency.
- Do not add font files, external image assets, root package changes, root lockfile changes, real search/edit-save/camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, schema, migration, drag, long-press, or production mutation.

## 2.0.0-alpha.18 A2Z app font rule

For the alpha.18 mobile/tablet mock:

- Treat the work as app UI font application only.
- Use only the owner-provided local A2Z TTF files. Do not download fonts or fetch web fonts.
- Store app font assets under `apps/mobile/assets/fonts/a2z/` with stable English filenames.
- Add a source/license tracking file at `apps/mobile/assets/fonts/a2z/FONT-SOURCE.md`.
- Do not show font attribution inside the app UI.
- Load the font through the existing Expo font runtime if available without adding a new dependency.
- Prefer A2Z Regular, Medium, SemiBold, and Bold for runtime UI. Do not overuse Black or ExtraBold.
- Preserve alpha.17 production-card structure and mock-only behavior.
- Do not apply this font to PDF/Worker generation in this version.
- Do not add root package changes, root lockfile changes, real search/edit-save/camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, schema, migration, drag, long-press, or production mutation.

## 2.0.0-alpha.19 DB/API performance audit and schema design rule

- Treat alpha.19 as read-only source audit and design documentation, not DB implementation.
- Base all v1 findings on repository migrations, schema, routes, services, repositories, and query code. Mark deployed-schema or runtime claims as unverified unless measured.
- Use `12-v1-db-api-performance-audit.md` for v1 evidence, `13-core-domain-schema-v2.md` for the target domain contract, and `14-v2-schema-migration-and-performance-plan.md` for future gates.
- Keep list and detail contracts separate, require company scope, use bounded cursor pagination, and keep core search/filter fields relational.
- Keep mutable draft data separate from finalized revision and generated-document snapshots.
- Do not add or modify migration/schema SQL, API implementation, DB repository, seed/fixture, R2/Worker/PDF implementation, business data, or production data in alpha.19.
- Do not run DB benchmarks in alpha.19. Define the 500/5,000-row measurement contract for a later dev/test-only phase.

## 2.0.0-alpha.20 source/DB boundary and WorkOrder contract rule

- Keep `app/` and `apps/mobile/` separated by runtime responsibility, not public version number. Do not create `app/v1`, `app/v2`, `apps/mobile/v1`, or `apps/mobile/v2`.
- Keep the existing `db/schema`, `db/migrations`, `db/audits`, `db/seed`, and `db/test` paths in place as the legacy/current baseline.
- `db/v2` is a README-only architecture workspace in alpha.20. Do not add migration SQL, full reset SQL, seed SQL, connection scripts, or destructive commands.
- Use `lib/domain/work-orders/contracts/` for neutral type-only WorkOrder primitives, enums, read models, commands, errors, readiness, pagination, tenant scope, and transitions.
- Do not import alpha.20 contracts from `app/api` or `apps/mobile` runtime code.
- Command bodies must not trust client `companyId`; tenant scope comes from authenticated membership.
- List DTOs must remain bounded and must not contain child collections, storage keys, document snapshots, or raw access tokens.
- Completed/finalized revisions are immutable. Corrections create the next draft revision with a reason.
- RLS is a required alpha.21 SQL draft and alpha.22 dev/test verification gate. Privileged system access stays separate and audited.
- Do not add dependencies, DB/API/R2/Worker/PDF implementation, migration execution, seed mutation, or production mutation in alpha.20.

## 2.0.0-alpha.21 additive migration draft rule

- SQL is allowed only under `db/v2/migrations/` and must remain additive, ordered, guarded, and unapplied.
- Keep `db/schema`, `db/migrations`, legacy v1 migrations, `app/api`, repositories, Workers, root package files, and dependencies unchanged.
- Every draft must reject execution unless a future separately approved dev/test runner supplies the exact environment and approval session gates.
- Every tenant-owned v2 table must carry direct `company_id`, enable/force RLS, and separate tenant-member policy from audited privileged-system policy.
- Use atomic sequence-row allocation; never use `max()+1` for document numbers.
- Store only document access token hashes with expiry/revoke metadata; raw access tokens are forbidden in DB columns.
- Keep finalized revisions and generated document identity/snapshots immutable.
- Add tenant-consistent FKs as `NOT VALID`; do not validate constraints, backfill, seed, benchmark, or connect to Neon in alpha.21.
- Existing alpha.20 type/static contracts and the alpha.21 migration schema contract must both pass.

## 2.0.0-alpha.22 dev/test migration and evidence rule

- DB mutation is allowed only for an explicitly approved development/test target whose runtime, connection fingerprint, and `wafl-fn` prefix all match canonical pipeline configuration.
- Apply only ordered `db/v2/migrations/001` through `006`; never use Neon SQL Editor, raw `psql`, a bypass runner, Full Reset, cleanup, automatic rollback SQL, or automatic retry.
- Record every migration filename and SHA-256 in the migration ledger. Hash/order mismatch or untracked v2 objects stop execution.
- Run customer-path seed and verification through the dedicated `NOLOGIN`, `NOBYPASSRLS` runtime role. The migration owner role is not tenant-isolation evidence.
- Seed profiles require exact confirmation and are idempotent only as complete profiles. Partial profile detection stops execution without cleanup.
- A failed or stopped run creates a failure source ZIP, failure repo-state, and failure log under `Logs/Repo_Status/Failure_Handoff`. Failure artifacts never enter `4. Newest` or count as completion.
- Only successful Finish may replace `4. Newest` with the current alpha.22 source ZIP and matching repo-state.
- The source ZIP excludes every `.env*` file, including `.env.example`.
- Production DB/R2/Worker/API bindings, business data, legacy v1 destructive changes, and dependency changes remain forbidden.

## 2.0.0-alpha.23 WorkOrder list Read API rule

- The only new runtime endpoint is `GET /api/v2/work-orders`. Do not add POST, PATCH, PUT, DELETE, detail, tab, PDF, QR, or mobile integration.
- Run the dev/test runtime/fingerprint/prefix/read-approval guard before the DB-backed workspace guard so a disabled or production runtime cannot touch the database through this route.
- Reuse `requireWorkspaceApiGuard({ permissionCode: "workorder.read" })`; never accept client `companyId` as tenant scope.
- Bind signed cursors to the authenticated tenant and visibility scope, include expiry and version, and return `CURSOR_INVALID` for tampering, expiry, version mismatch, or cross-tenant reuse.
- Respect canonical simulator company access policy during runtime evidence: active A/H/B may read their own lists, while approval-pending C must receive typed `FORBIDDEN` without an RLS or workspace-guard bypass.
- Run customer queries through `wafl_v2_tenant_runtime` in a read-only transaction with local RLS claims. The migration owner must not be the customer read path.
- Bound page IDs before child summaries and keep repository query count at three or fewer including role/claim setup.
- Runtime verification is read-only. Reuse alpha.22 migrations and synthetic seed; do not run migration, seed, cleanup, reset, constraint validation, or rollback migration SQL.
- For the owner-approved alpha.23 scope, Codex may run at most three diagnosis, minimal in-scope correction, static verification, and dev/test read-only runtime verification cycles without requesting approval for each retry.
- The automatic loop requires the same approved dev/test fingerprint, read-only DB/API access, alpha.23-only file changes, no root package/lockfile/dependency change, and no DB/R2/Worker/PDF/production mutation. Static, build, and type errors may be corrected under the same boundary.
- Preserve a canonical failure source ZIP, failure repo-state, and failure log under `Logs/Repo_Status/Failure_Handoff` for every failed cycle. Do not touch `4. Newest` before successful Finish.
- Stop immediately when the same error repeats, three cycles do not resolve the failure, the target fingerprint changes or becomes unclear, or any unexpected write, tenant leak, RLS bypass, data-integrity mismatch, partial mutation, unclear ledger state, out-of-scope change, dependency change, migration, seed, cleanup, reset, rollback, schema validation, destructive SQL, or business/R2/Worker/PDF/production mutation is detected.

## 2.0.0-alpha.24 WorkOrder detail and lazy Read API rule

- Add only `GET /api/v2/work-orders/:workOrderId` and the materials, size-color, size-spec, processes, assets, documents, and history lazy Read endpoints.
- Reuse the alpha.23 runtime guard, workspace permission, fixed tenant read-only transaction helper, RLS claims, typed errors, and PostgreSQL UUID textual validation.
- Core detail must return only header/revision/amount/count summaries. Collection data belongs only to its tab endpoint.
- Materials, assets, documents, and history use signed, expiring cursors bound to company, visibility, WorkOrder, and tab kind with default/max limits 30/50.
- Cross-company or missing WorkOrder IDs return the same generic `NOT_FOUND`; approval-pending company C remains `FORBIDDEN` at the workspace guard.
- The repository callback uses two bounded statements: claims and one core/tab SQL. This count is distinct from all endpoint protocol calls.
- Asset/document/history responses must omit storage keys, snapshots, token hashes, raw/signed URLs, secrets, privileged metadata, and unnecessary actor identity.
- Reuse ledger 7, index 007, and the alpha.22 synthetic seed. Do not run migration, index, schema validation, seed, cleanup, reset, rollback, or any write command.
- Under the owner-approved alpha.24 scope, at most three same-target read-only diagnosis/minimal-fix/static/runtime cycles are allowed. Every failed cycle creates a failure handoff, and `4. Newest` remains unchanged until successful Finish.

## 2.0.0-alpha.25 WorkOrder create/basic update Command rule

- Add only draft WorkOrder create and current-draft scalar basic-info PATCH. Material/process/order/revision issue/document/PDF/QR/R2/Worker/mobile commands remain out of scope.

## Alpha.27 revision issue completion rule

- Reuse applied migrations `001` through `008`, canonical `workorder.update`, the tenant write transaction, hashed receipt, and append-only event patterns.
- Do not send a valid issue before read-only preflight, approval checkpoint, and explicit owner approval.
- Atomically allocate the document base, finalize the current revision, update the WorkOrder and both versions, complete one receipt, and append one event.
- Do not auto-create a next draft; post-issue correction remains a separate Command.
- Do not add PDF, QR, R2, Preview, migration/schema/index, seed, cleanup/reset/rollback, production, or business-data work.
- A failed runtime never authorizes mutation replay. Continue only with bounded read-only audit or GET-only completion unless separately approved.
- Alpha.27a migration 008 preparation does not authorize apply. The only permitted boundary is a zero-argument tenant/member-validated SECURITY DEFINER function, fixed search_path, PUBLIC revoke, runtime EXECUTE grant, and no direct `company_settings` SELECT grant. Apply and rollback each require separate approval.
- Approved dev/test migration 008 and the Company A/B/H synthetic settings fixture are complete at ledger 8/8. Do not reapply migration/fixture or infer production authorization.
- The accepted one-shot issue effect is immutable and must never be replayed: document `WAFN-26FWA-A25CMD-260711-001-R0`, WorkOrder/revision 15/15 issued/finalized, receipt/event +1/+1, new revision/next draft/generated document 0/0/0, and `NO_PARTIAL_MUTATION`.
- Immutable completion combines WorkOrder scalar runtime `LOCKED`, material scalar runtime `LOCKED`, and `MATERIAL_ORDER_LOCKED_PASS_BY_SHARED_RUNTIME_GUARD_AND_STATIC_CONTRACT`. No terminal-line order request is required or authorized for this acceptance.
- Derive company and actor only from authenticated membership; reject client company/member/revision scope and use generic `NOT_FOUND` for cross-company opaque IDs.
- Create requires an Idempotency-Key. Persist only an actor-scoped hash and request hash in the existing receipt table; never store or log the raw key.
- PATCH requires `expectedVersion`, locks the current WorkOrder/revision, and permits one successful version transition. Finalized/non-current revisions remain immutable.
- WorkOrder/revision/receipt/domain event writes must share one fixed tenant-role transaction. Audit failure rolls back the main mutation.
- Source implementation, static verification, invalid-request/auth preflight, and existing GET regression may proceed without DB write. Valid create/PATCH mutation requires a separate explicit owner approval and exact command-mutation runtime gate.
- Before that approval, keep APP_VERSION at alpha.24, do not commit/push/Finish, do not touch `4. Newest`, and do not run migration, seed, cleanup, reset, rollback, schema validation, or production access.

## 2.0.0-alpha.26 material and order Command rule

- Fabric and accessory share `work_order_material_lines`; use one typed material route family rather than duplicate resources.
- Create and scalar PATCH are current-draft only. Status changes are allowed only through dedicated request, cancel, and complete commands.
- Allowed transitions are `editing -> requested` and `requested -> cancelled|completed`. Completed lines remain locked, and cancelled-line reopen is deferred.
- Create/request/cancel/complete require actor-scoped hashed idempotency receipts. PATCH uses the WorkOrder `expectedVersion` and advances WorkOrder, revision, and line versions atomically.
- Server code derives amount from order quantity and unit price. Tenant-inconsistent material/supplier references return generic `NOT_FOUND`.
- The existing schema has no material-line soft-delete lifecycle. Do not expose hard DELETE or invent deactivation fields; record deletion as deferred schema/policy work.
- Source, static verification, invalid/auth requests, and read-only preflight may proceed without valid mutation. Material mutation requires a separate exact owner approval and runtime gate.
- Before runtime approval, keep APP_VERSION at alpha.25, do not commit/push/Finish, and do not change `4. Newest`. Migration, schema/index, seed, cleanup/reset/rollback, business data, R2/Worker/PDF, and production access remain forbidden.
- The approved alpha.26 mutation is fully committed and the bounded audit verdict is `NO_PARTIAL_MUTATION`: fabric `2`, accessory `1`, completed receipts `9`, events `11`, and WorkOrder/revision version `3 -> 14`.
- The finalized issued fixture's canonical typed error is `LOCKED`; do not change repository/service lock-check order to fit a runner expectation.
- Do not rerun the full alpha.26 mutation runner. The accepted completion chain is the committed bounded runtime, `NO_PARTIAL_MUTATION` audit, preserved temporary runner failures, and final GET-only `READ_ONLY_COMPLETION_PASS` evidence.
