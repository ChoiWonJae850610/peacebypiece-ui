# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.48 result

## 2.0.0-alpha.48 result

Status: `ALPHA48_MOBILE_MATERIALS_REAL_READ_COMPLETE` after actual material Read, external-cellular iPhone UI acceptance, mutation-zero audit, canonical Verify/stop, Git, and handoff gates.

- Activate only the ProductionCard `원단` tab using the existing exact fabric Read route. Preserve tenant permission, Tailscale Serve API origin, Cloudflare Preview origin, and read-only Command block.
- Lazy-load on first tab entry; retain per-WorkOrder bounded cache, request/session/response identity guards, explicit retry, and explicit cursor `더 보기`. Automatic retry, polling, and cross-card response application remain absent.
- Present actual material fields with accepted compact-card status, quantity/won, expanded-detail, two-line footer, and disabled action grammar. Mock values and command handlers remain absent.
- External cellular iPhone QA passed recent/past material reads, cache re-entry, background/re-entry, corrected UI conformity, and overall UI without code entry, overflow, data mixing, crash, red screen, or infinite loading.
- Runtime and post-stop audits found business, material, revision, event, receipt, document, token, R2, PDF, production, native, and EAS deltas zero. Evidence: `47-mobile-materials-real-read-evidence.md`.
- Next candidate is alpha.49 draft material basic editing; material order Commands remain separately scoped.

# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.47 checkpoint

## 2.0.0-alpha.47 checkpoint

Status: `ALPHA47_TAILSCALE_SERVE_DEVELOPER_AUTO_CONNECT_COMPLETE` after exact mapping, Serve HTTPS, bounded runtime, external cellular iPhone, canonical Verify/stop, Git, and handoff gates.

- Add a Serve-only developer auto-connect endpoint using one exact process-local Tailscale-login/WAFL-admin hash pair and one exact canonical simulator Company A target.
- Split mobile API and Preview origins between tailnet-only Tailscale Serve HTTPS and the existing process-owned Cloudflare Quick Tunnel. Keep Metro on private Tailscale LAN.
- Preserve the one-time code fallback, boot-attempt bound, disconnect suppression, exact host/path allowlists, read-only default, and all alpha.43-46 security/data boundaries.
- External cellular iPhone QA passed code-free launch, disconnect, explicit reconnect, close/reopen, and cold-restart auto-connect. Manual fallback was not repeated on-device in the final run; its source/contract regression and alpha.44 runtime evidence remain preserved.
- Manifest/bundle audits ended at exact cumulative counts `4/1`, both HTTP 200 with the expected media types, no redirect, no bundle execution, and no raw URL/body persistence.
- Canonical stop preserves strict Serve ownership through one bounded exact-PID metadata fallback, protects stale PID reuse without termination, distinguishes Serve objects from explicit Funnel enablement, and finished `stopped` with empty Serve config, Funnel true count zero, Tailscale Running, and listener/ownership skip/unrelated termination zero.
- Evidence: `46-mobile-tailscale-serve-developer-auto-connect-evidence.md`.

# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.46 result

## 2.0.0-alpha.46 result

Status: `ALPHA46_MOBILE_BASIC_INFO_UPDATE_COMPLETE` after the recorded final Verify, canonical stop, push, and handoff gates.

- Delivered draft-only editing for actual product name, calendar due date, and total quantity inside the accepted ProductionCard sheet.
- Reused the existing PATCH transaction, `expectedVersion`, tenant/RLS scope, `workorder.update`, draft/current-revision lock, version increments, and append-only domain event. One approved save moved the retained target from version `1` to `2`; one old-version request returned `409 CONFLICT` with no mutation.
- Explicit save, one post-save detail GET, local list synchronization, dirty warning, continue editing, discard, and non-draft read-only behavior passed physical iPhone QA. Autosave, automatic retry, polling, and full-list refetch remained absent.
- Corrected PostgreSQL `DATE` handling to preserve calendar `YYYY-MM-DD` values without JavaScript Date/UTC conversion. DB, list, detail, and iPhone now agree on `2026-09-30`.
- The default external runner remains read-only. The bounded alpha.46 switch injected the exact approval into Next only and admitted PATCH only on one canonical UUID detail path; create, material, process, revision, migration, R2, PDF/token, native, EAS, and production paths stayed blocked.
- Evidence: `45-mobile-basic-info-update-evidence.md`.

# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.45 result

## 2.0.0-alpha.45 result

Status: `ALPHA45_MOBILE_PRODUCTION_CARD_CORE_OVERVIEW_COMPLETE`.

- Preserve the real dev/test connection and WorkOrder list from alpha.44.
- Present the selected actual core detail in a ProductionCard-style read-only shell with actual header, priority metrics, readiness, and amounts. Keep actual component/document counts in their future-tab badges rather than duplicating them in the overview body.
- Keep future tabs visible but disabled; do not call lazy APIs, fetch representative files, or expose mutation/output actions.
- Preserve phone list return, tablet split-view code, alpha.44 detail-error recovery, and exact external UUID boundary.
- The initial iPhone functional/data pass did not satisfy visual conformity. Replace its dashboard/card-stack treatment with one integrated ProductionCard paper sheet, compact mock-derived header/stat/tab/divider grammar, resolved Korean labels, and no developer-only copy before requesting the final visual judgment.
- The first paper-sheet correction remained too long because it repeated basic metadata, document metadata, and all component counts below the tab rail. The final information architecture removes `기본 정보`, `문서 요약`, and `구성 요약`, widens the natural product-title column, and documents Revision/history and document metadata as future-tab concerns without adding any lazy endpoint.
- The owner explicitly accepted the final physical-iPhone design as the pre-feature-expansion ProductionCard overview shell and found no issue that blocks feature use or information understanding. Fine typography, spacing, representative-media, tab-density, and color polish is deferred until actual tabs and inputs are connected.
- The final clean run preserves connection, actual list, recent/legacy detail, disabled tabs, list return, background/re-entry, and disconnect. Exact API request counts are unavailable because the retained runner has no request-level access ledger; source/contracts and runtime error audit show no lazy/file/PDF/token/mutation path.
- Canonical stop releases ports 3100/8081 with ownership skip zero, preserves localhost:3000, and leaves Tailscale running. Final Verify, Git delivery, and matching alpha.45 artifacts are recorded by the canonical workflow and repo-state.

## 2.0.0-alpha.44 checkpoint

Status: `ALPHA44_MOBILE_REAL_DATA_READ_ONLY_SLICE_COMPLETE`.

- Reuse the installed alpha.43 Development Build with no native dependency, ATS, EAS profile, credential, build-number, EAS Build, or EAS Update change.
- Add a localhost-only, actual-system-admin-gated, effective-dev/test-company-gated one-time development connection. Keep codes five minutes or less, one-use, process-memory-only, SHA-256 keyed, bounded, and runner-bound.
- Reuse the existing signed `wafl_auth_session` cookie with HttpOnly/Secure/SameSite=Lax/Path and a two-hour maximum. Do not add bearer auth, raw-cookie response, SecureStore, or native cookie dependencies.
- Extend the exact external QA allowlist only for exchange/disconnect, auth/me, WorkOrder list GET, and UUID core-detail GET. Keep WorkOrder commands, lazy tabs, internal/dev routes, arbitrary APIs, and OPTIONS blocked.
- Replace the current mobile mock entry with a real dev/test read-only WorkOrder list and core-detail overview while preserving the mock component as historical design evidence.
- Implement explicit phone list/detail/back and tablet split layouts plus loading, empty, permission, not-found, network, malformed, timeout, server, session-expired, manual retry, refresh, and disconnect states.
- Never fetch representative objects, call lazy tabs, retry automatically, poll, or invoke WorkOrder/R2/PDF/token mutations.
- Correct the reproduced legacy-detail `C4` mismatch: the database/list/detail joins admitted all Company A rows, while the external matcher incorrectly required RFC UUID version/variant bits. Keep an exact GET-only single canonical `8-4-4-4-12` hexadecimal UUID pathname with no wildcard or prefix expansion.
- Give every detail error an upper-left back action, primary `목록으로`, and secondary bounded manual retry. Returning preserves the loaded list and performs no automatic list refetch; tablet keeps its list pane.
- Real iPhone QA passes connection, effective user/Company A context, actual list, recent detail, corrected legacy detail, back, background/re-entry, and disconnect. Crash, red screen, infinite loading, automatic retry/polling, data/object/document/token writes, and production access are zero. Error-action runtime is not applicable because the corrected legacy card opens; source/contracts cover it.
- Canonical runner stop releases ports 3100/8081 with ownership skip zero while preserving localhost:3000 and Tailscale.
- Evidence: `43-mobile-real-data-read-only-evidence.md`.

# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.43 result

## 2.0.0-alpha.43 result

Status: `ALPHA43_EXTERNAL_MOBILE_QA_AND_IOS_DEVELOPMENT_BUILD_COMPLETE`.

- Add strict server/mobile origin validation and reject HTTP, external-QA localhost, production localhost/Quick Tunnel, credentials, path, query, and fragment inputs.
- Add a Next 16 host/path proxy that trusts the request `Host` only, keeps localhost behavior, admits the exact process-only tunnel host, permits the bounded Viewer/issued-Preview read chain, and blocks internal/admin/dev/test/mutation paths externally.
- Retire the failed Expo/ngrok tunnel as a non-executable legacy marker; add Expo LAN/TailscaleLan/config-audit scripts without adding a transport-specific dependency.
- Add Windows start/status/stop orchestration with incremental `.tmp` state, exact PID ownership markers, failure preservation, no automatic retry/rollback/cleanup, and no broad process termination.
- Add permanent-PDF versus temporary-QA origin policy; Quick Tunnel is never a permanent generated-PDF QR origin.
- Separate Expo Metro over private Tailscale IPv4 from Next/Viewer over public temporary Cloudflare HTTPS; require Tailscale CLI/online state/`100.64.0.0/10` IPv4 and both local/Tailscale Metro readiness.
- Record the approved Tailscale installation/login, split-transport runtime, Metro readiness, external `/v` header smoke, internal-path blocking, PID 6284 preservation, and mutation-zero result without persisting temporary hostnames.
- Establish canonical identity: Project `PeaceByPiece`, planned Company `Sanjin Works`, Brand `WAFL`, Website `https://www.wafl.co.kr`, and long-lived Bundle Identifier `com.wafl.app`, independent of Project/Company naming.
- Record active Apple Developer Individual membership; the future account direction is Organization plus App Transfer.
- Configure Expo owner `lostab`, project `@lostab/wafl-mobile`, linked project ID, iOS/Android identifier `com.wafl.app`, `expo-dev-client` `55.0.37`, and one internal `development` profile without starting a build or credential workflow.
- Regenerate the stale mobile lock through an isolated package.json-only candidate, then align the active lock and physical tree at Expo `55.0.28`, Expo Router `55.0.17`, React Native `0.83.6`, `expo-dev-client` `55.0.37`, and transitive `@expo/log-box` `55.0.13`. Physical/lock-only dependency audits, `expo install --check`, and the Node `24.14.0` canonical Verify pass without deleting `node_modules`, running lifecycle scripts, or adding `@expo/log-box` directly.
- Exclude Expo Go from official WAFL QA and make EAS Development Build the official device-QA path. Keep Tailscale for Metro and Cloudflare for Next/PDF/Viewer.
- Separate the internal `2.0.0-alpha.43` trace version from the public Expo/iOS/Android version `2.0.0`, retaining the internal value in `expo.extra.appVersion`.
- Record the first iOS Development Build Install Pods/Codegen failure, align React Native to `0.83.6` and Screens to `4.23.0`, and retain the subsequently finished and installed Development Build evidence.
- Record the installed build's exact ATS failure after Safari/Local Network/Tailscale/manifest/bundle evidence excluded the transport and JavaScript paths. Add only the Development variant's `100.64.0.0/10` insecure-HTTP exception; default/production remain exception-free and `NSAllowsArbitraryLoads` remains absent.
- Complete one frozen-credential ATS-corrected iOS Development Build, prove Pods/Codegen/Xcode and embedded Info.plist, install it on the registered iPhone, and pass deep-link manifest/bundle load, real WAFL display, basic navigation, background/re-entry, and exactly one Reload without ATS recurrence, red screen, crash, or infinite loading.
- Accept the duplicate internal build number `1` for this installed QA artifact only; record monotonic iOS auto-increment as a candidate required before the next Development Build rather than creating another alpha.43 build.
- Stop only marker-owned runner processes, release ports 3100/8081, retain Tailscale, and keep migration ledger `12/12` plus every DB/R2/token/PDF/Worker/production mutation at zero.
- Evidence: `40-external-mobile-qa-foundation-evidence.md`; runbook: `41-external-mobile-qa-runbook.md`; iOS build evidence: `42-ios-development-build-evidence.md`.

## 2.0.0-alpha.42 result

Status: `ALPHA42_RUNTIME_EFFECTS_COMPLETE_STATIC_VALIDATION_PASS`.

- Migration 012 applied once; ledger `12/12`.
- Realistic WorkOrder/revision, representative image, canonical issue, generated document, embedded QR token, immutable PDF, and controlled viewer effects completed in approved dev/test only.
- PDF is `252994` bytes, SHA-256 `0334727646ebc43ab19a88ccb64cf1b5d3b1e91d3ca5438d3ec61a9a9665af37`, and landscape/portrait/portrait across three pages.
- Worker-mediated PDF PUT/GET/DELETE is `1/3/0`; finalize `1`; event delta `+3`; receipt/incomplete `3/0`; token access count `1`; production mutation false.
- Company B stored workspace response and Company H/C source-only isolation contracts pass. Live H/C was not executed under the approved zero-call finalization policy.

- Add the guarded additive migration 012 contract for `manual_share` versus `embedded_qr`, preserving every existing alpha.39 token as `manual_share`.
- Use one hash-only, 365-day, non-rotatable embedded token per generated document; pass its viewer URL to Chromium only through an ephemeral render context.
- Prepare one new DB-native-UUID realistic Company A WorkOrder with matrix 144, six materials, five-by-three size specification, four processes, and one immutable representative image.
- Preserve A30FACT and all retained DB/R2/token evidence. Migration 012 and the bounded fixture/image/PDF runtime each require their own approval checkpoint.
- Final result version is `2.0.0-alpha.42`; runtime effects and zero-call completion audit passed at `ALPHA42_RUNTIME_EFFECTS_COMPLETE_STATIC_VALIDATION_PASS`.

# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.41 result

## 2.0.0-alpha.41 result

- Use the canonical 760px phone/tablet boundary for material order summaries and actions.
- Render every phone summary as two complete one-line Text nodes and every phone material action as icon-only while retaining accessible labels and touch targets.
- Preserve tablet one-line summary and caption-capable actions without changing calculations, material state, or persistence behavior.
- Remove document-number page suffixes and render one dynamic centered `current / total` footer on every cover and continuation page.
- Verify 320 through 759px phone layouts, 760/1024px tablet layouts, desktop/mobile HTML Preview, and a three-page mixed-orientation local Chromium PDF at `LEVEL_4_PRODUCT_VERIFIED`.
- Regress the retained alpha.38 PDF with DB `BEGIN READ ONLY` and R2 GET 2 only. Do not claim the immutable retained PDF contains the new footer and do not perform DB/R2/token/generated-document/Worker/production mutation.
- Evidence: `38-mobile-order-summary-and-pdf-page-number-evidence.md`.

## 2.0.0-alpha.40 result

- Reduce 320-390px material action visuals to 36x30px while preserving a 42px touch target, one-line 390px summary, and two-line maximum at 320-359px.
- Keep the Expo Web source tab in place and open one Preview popup with a bounded duplicate-click guard; retain native system-browser behavior.
- Replace CSS background representative media with a native HTML image, use inline SVG color chips, and remove the duplicate color legend from the repository sample sketch.
- Replace browser print actions with authenticated generated-PDF view/download/share and a localhost-only Chromium sample PDF download.
- Add generation number/file size/status/timestamps and controlled inline/download URLs to the documents Read Model without exposing storage identity.
- Preserve ledger `11/11`, the retained alpha.38 PDF, and alpha.39 tokens/events. DB/schema/token/generated-document/R2 write/delete/Worker/production mutation remains zero.
- Evidence: `37-preview-output-and-action-density-evidence.md`.

## 2.0.0-alpha.39 result

- Implement hash-only opaque token derivation, `/v#t=` exchange, signed short viewer sessions, server-side R2 PDF inline/download, token history/revoke/rotation, and deterministic source-owned QR SVG without package changes.
- Apply migration 011 once to approved dev/test: ledger `11/11`, two fixed-search-path SECURITY DEFINER functions, PUBLIC EXECUTE zero, and existing-row delta zero.
- Complete the separately approved token runtime with one share receipt, two token rows, three token updates, five events, three retained-object GETs, and zero R2 PUT/DELETE or generated-document mutation.
- Correct future repo-state common fields so alpha.38 migration 010 and retained PUT 1 are historical facts while alpha.39 R2 mutation remains false.
- Replay/conflict, revoked/invalid generic NOT_FOUND, Company B/H/C isolation, inline/download integrity, hash-only persistence, and partial-mutation audit pass. Token A remains revoked, Token B remains active, and production remains untouched. Evidence: `36-document-viewer-security-evidence.md`.

## 2.0.0-alpha.38 result

- Apply migration 010 once to approved dev/test: receipt result linkage is native `uuid`, company-scoped, and references the DB-generated document identity. Ledger is 10/10 and existing rows are unchanged.
- Persist one actual issued A30FACT generation through receipt reservation, pending document, actual Preview PDF render, exact-key R2 PUT/GET integrity, generated finalize, and one domain event.
- Recover the initial render timeout by retaining and reusing the exact pending UUID. No new receipt, document, UUID, generation number, migration, or object key is created during continuation.
- Final PDF is 130,332 bytes with SHA-256 `9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2`, two pages, and landscape/portrait orientation.
- Duplicate replay is a complete no-op. Final receipt/document/event is 1/1/1, incomplete/pending/failed is 0/0/0, tenant isolation passes, and retained R2 object count is one.
- Production/business mutation, R2 DELETE, cleanup, rollback, QR, viewer, and access-token work remain excluded. Evidence: `35-generated-document-db-r2-runtime-evidence.md`.

## 2.0.0-alpha.37 result

- Use the issued/finalized `WorkOrderIssuedPreviewReadModel` and existing `IssuedWorkOrderDocument` as the single canonical PDF source.
- Add stable snapshot serialization/SHA, revision asset manifest/resolver, local Chromium renderer, PDF inspection, local object store, deterministic R2 key plan, and a write-disabled generated-document repository/lifecycle SQL contract.
- Local runtime PASS: 197,751 bytes, three pages, landscape + portrait + portrait, Korean text/image/matrix 144, blank/clipping/console/network error 0, stable snapshot SHA and repeat structure.
- Keep actual issued DB rendering explicit as `SKIPPED_WITH_REASON`; accepted issued Preview evidence is retained without loading credentials or inventing sample fallback.
- Reuse migrations 004/005 with no migration 010. DB data/R2/Worker/production mutation remains false; alpha.38 actual metadata/upload requires separate approval.
- Verification level: `LEVEL_4_FOUNDATION_VERIFIED`.
- Evidence: `34-issued-revision-pdf-generation-foundation-evidence.md`.

## 2.0.0-alpha.36 result

- Preserve alpha.35's two core rows, unit position, local calculation, and one final summary/action row.
- Name order quantity, unit price, and amount in the final summary; use neutral dashes when required calculation inputs are missing instead of synthetic zero values.
- Remove default placeholder copy from the six core fields and unit while retaining usage-area and memo placeholders plus field-only missing treatment.
- Add 8px inter-card spacing and a faint work-surface background while retaining the existing subtle top line/status accent and compact body height.
- Keep the Preview renderer, actual/sample boundary, mixed-orientation print layout, and all API/DB/R2/Worker/PDF lifecycle boundaries unchanged.
- `LEVEL_4_PRODUCT_VERIFIED`: summary and missing-input interactions PASS; representative mobile card `214px`; tablet `212px`; 390/768/1024 overflow 0; localhost sample/144/production 404/console 0 PASS; unchanged accepted three-page print contract re-inspected.
- Evidence: `33-mobile-material-card-separation-and-summary-evidence.md`.

## 2.0.0-alpha.35 result

- Compress fabric/accessory cards into two horizontal core-input rows with three fields each and keep unit directly below the material name.
- Use local same-position editing for supplier, color/option, unit price, required, allowance, stock, and unit. Recalculate order quantity and amount without connecting mobile persistence.
- Replace warning/reference prose and split footer blocks with field-only missing states and one final order-summary/action row.
- Preserve the alpha.34 sample entry and frozen Preview renderer/print contract. Defer immutable PDF binary, generated-document metadata, QR, R2, and Worker lifecycle beyond this UI correction line.
- `LEVEL_4_PRODUCT_VERIFIED`: 390/768/1024 overflow 0, card height `275px -> 214px`, edit height stable, local unit/quantity/amount recalculation PASS, locked affordance 0, and three-page Preview print regression PASS.
- Evidence: `32-mobile-material-compact-input-evidence.md`.

## 2.0.0-alpha.34 result

Status: `LEVEL_4_PRODUCT_VERIFIED`; implementation and evidence are tracked in document 31.

- Route every Expo mock Preview entry to the localhost-only realistic sample while preserving the separate actual issued-document target and its no-fallback contract.
- Keep the sample unavailable in production and restrict development sample hosts to localhost loopback values.
- Merge material reference/warning messages and available actions into one final footer band with one separator, left/right alignment, no action wrapping, and no empty placeholder.
- Verify the two mobile user paths, 390x844 phone, 768x1024 tablet portrait, 1024x768 tablet landscape, and a three-page Chromium print artifact with console warning/error 0 and horizontal overflow 0.
- Defer actual immutable PDF binary, generated-document metadata, QR, R2, Worker, and production lifecycle to alpha.36.

## 2.0.0-alpha.33 result

Status: implementation and product evidence are tracked in document 30.

- Keep actual issued Preview bound to immutable tenant data with no sample fallback, while mapping only known stable category codes to Korean display labels.
- Expose the deterministic realistic sample from the localhost-only `/ui` catalog with a clear `실무 샘플 보기` label; production hosts keep the route at 404.
- Keep the visible front/back product board, three color chips, exact 144 matrix, and practical Korean material/process/factory content.
- Reorder fabric/accessory cards to basic information, factory-facing inputs, order summary, warning, then footer actions; preserve the 22px single-line editing contract.
- Defer actual PDF binary, generated-document metadata, QR, R2, Worker, and production lifecycle to alpha.35.

## 2.0.0-alpha.32 result

Status: `LEVEL_4_PRODUCT_VERIFIED` with localhost mobile/tablet/desktop interaction evidence and a three-page mixed-orientation Chromium PDF.

- Use one compact single-line field grammar for material usage area, material memo, process memo, and factory memo without changing parent card height.
- Prevent Escape-then-blur and Enter-then-blur double commits; unchanged normalized values do not commit.
- Remove separate process application-area and application-color rows/Preview columns while preserving their DB/API fields and merging them into work memo for display only.
- Replace the minimal localhost sample with a repository-owned garment board and deterministic Korean production data totaling exactly 144 units.
- Keep one A4 landscape cover and packed A4 portrait continuations, and verify the actual browser print output without creating a generated document or R2 object.
- Defer PDF/QR/R2/Worker/generated-document lifecycle to alpha.35.

## 2.0.0-alpha.31 result

Status: `LEVEL_4_PRODUCT_VERIFIED` after localhost desktop/tablet/mobile/print evidence is recorded in the alpha.31 evidence document.

- Replace duplicated factory-field summary plus textbox layouts with shared inline editable, expandable-note, and read-only value components in the mobile mock.
- Keep edits local/mock-only while making issued/completed values visually read-only.
- Split issued Preview data loading from a pure renderer shared by the actual immutable Preview and a deterministic localhost-only sample.
- Use an A4 landscape cover and packed A4 portrait continuation pages with repeated headers and non-splitting rows.
- Defer PDF binary, QR, R2, Worker, and generated-document lifecycle to alpha.35.

## 2.0.0-alpha.30 result

Status: `ALPHA30_COMMAND_RUNTIME_AND_COMPLETION_PASS`.

- Prepare migration 009 for material usage area, process application area/color target, and revision factory-delivery memo.
- Extend material create/PATCH and add only existing-row process scalar PATCH while preserving tenant, concurrency, audit, and issued lock boundaries.
- Align mobile free-text inputs and rebuild Preview as a factory-facing multi-page A4 document without internal inventory/order/cost/status fields.
- Approved dev/test migration 009 apply and post-apply audit PASS: ledger 9/9, four nullable fields and four `NOT VALID` checks present, existing row values/counts and RLS/ACL unchanged, business/R2/Worker/PDF/production mutation false.
- Approved synthetic completion retained WorkOrder/revision `+1/+1`, fabric/accessory `1/1`, process fixture `+1`, receipts/events `+4/+7`, document number `+1`, and final versions 7/7/2/1/2. Incomplete receipt, next draft, and generated document are all 0.
- Issued Preview new fields, deterministic repeat GET, tenant isolation, and immutable LOCKED checks passed. Actual PDF/QR/R2/Worker lifecycle remains excluded and moves to alpha.36.

## 2.0.0-alpha.29 result

- Expo mobile 제작 카드의 상단 `작지 보기`, 발주 전 확인 sheet, 제작 문서 행, 눈 아이콘을 하나의 Preview opener에 연결했다.
- 발행 문서번호를 tenant-safe resolver로 WorkOrder/revision identity에 해석한 뒤 기존 alpha.28 Preview를 재사용한다. UUID, token, companyId는 모바일 URL에 넣지 않는다.
- dev/test read-only runtime PASS: Company A resolver/Preview 200, B/H NOT_FOUND, C FORBIDDEN, ledger 8/8, 모든 mutation false.
- Expo Web에서 상단·문서 행·눈 아이콘이 동일 Preview 경로를 열고, draft sheet Preview가 비활성 이유를 표시함을 확인했다. 웹 인증 세션이 없으면 기존 로그인 경계로 이동한다.
- iPhone/iPad/Android 시스템 브라우저 이동은 static contract PASS이며 실제 기기 QA가 남아 있다. PDF, QR, R2 lifecycle은 alpha.30 범위다.

## 2.0.0-alpha.28 result

- Issued revision scoped 작업지시서 Preview API and workspace A4/print page implemented.
- Read-only runtime PASS: Company A 200, B/H NOT_FOUND, C FORBIDDEN, fabric/accessory 2/1, deterministic repeat GET, payload 2,983 bytes, mutation false.
- PDF, QR, R2, and generated-document lifecycle remain alpha.30 work.

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

### 2.0.0-alpha.26

Status: implementation, approved bounded dev/test mutation, read-only audit, and GET-only completion evidence complete; final delivery verification in progress.

- Add one shared material Command boundary for fabric/accessory create and current-draft scalar PATCH.
- Add line-level order request, request-cancel, and complete routes with `editing -> requested -> cancelled|completed` enforcement.
- Reuse authenticated scope, canonical permissions, fixed tenant write transaction, hashed receipts, optimistic concurrency, and append-only WorkOrder events.
- Derive amount server-side, hide cross-tenant material/supplier identity behind generic `NOT_FOUND`, and keep finalized/non-current revisions locked.
- Do not implement material DELETE because the applied schema has no soft-delete/deactivation lifecycle.
- Preflight result: fingerprint `01e5dcc7fea3`, ledger 7/7 unchanged, no valid material mutation, Company C/finalized/read regressions PASS, and all DB/business/storage/production mutation categories false.
- The approved runtime committed fabric/accessory `2/1`, receipts `9`, events `11`, and version transitions `3 -> 14`; its finalized-fixture assertion failed because the expected code was wrong, not because the Command transaction failed.
- The bounded audit proved `NO_PARTIAL_MUTATION`, material version sum `11`, incomplete receipt `0`, supplier mismatch `0`, and cleanup unnecessary.
- Ledger-column and source-regex mistakes in two temporary completion runners remain preserved as failures. The final GET-only completion passed with GET `14/0`, direct DB query `0`, mutation route `0`, B/H `NOT_FOUND`, C `FORBIDDEN`, and alpha.23~25 Read regressions PASS.
- Finalized `LOCKED` uses existing accepted runtime plus repository/service source evidence; no mutation PATCH was replayed.
- APP_VERSION/mobile metadata are `2.0.0-alpha.26`. Migration/schema/index, seed, cleanup/reset/rollback, business data, R2/Worker/PDF, production, mobile API connection, root package, lockfile, and dependency changes remain out of scope.

### 2.0.0-alpha.27

Status: implementation, approved dev/test migration/fixture, one-shot issue effect, immutable verification, and bounded completion evidence complete; final delivery verification in progress.

- Add the dev/test-only current revision issue Command at `POST /api/v2/work-orders/:workOrderId/revisions/issue`.
- Reuse `workorder.update`, fixed tenant RLS, hashed receipts, append-only events, and migrations `001` through `007`; add no permission, migration, schema, index, package, or dependency change.
- Allocate the tenant/day document base only during issue, finalize the current revision, and keep its scalar and revision-child data immutable.
- Do not auto-create a next draft. Correction/new revision remains a separate future Command.
- Before owner approval, complete static verification and read-only preflight only. Keep APP_VERSION at alpha.26 until the one-shot synthetic runtime and completion pass.
- PDF, QR, R2, Preview, mobile API connection, production, and actual business data remain excluded.
- Read-only preflight finding: the fixed tenant runtime cannot read legacy `company_settings`, and that table has no v2 tenant RLS boundary. Runtime is blocked pending a separately approved additive tenant-safe numbering-settings migration; no issue mutation was sent.
- Alpha.27a prepares additive migration 008 and its guarded preflight/apply runner without changing APP_VERSION. Apply, ledger 8/8, post-apply audit, and alpha.27 preflight rerun require separate approval; issue runtime remains separately gated after that.
- Approved dev/test result: migration ledger 8/8; Company A/B/H synthetic settings isolation PASS; issue number `WAFN-26FWA-A25CMD-260711-001-R0`; WorkOrder/revision `issued/finalized` at 15/15; receipt/event `+1/+1`; new revision/next draft/generated document `0/0/0`; no partial mutation.
- Immutable result: WorkOrder and material scalar runtime `LOCKED` PASS. Material order is `MATERIAL_ORDER_LOCKED_PASS_BY_SHARED_RUNTIME_GUARD_AND_STATIC_CONTRACT`; no terminal-line order request was called, and the contract proves lock-before-status/UPDATE/event with transaction rollback.
- APP_VERSION/mobile metadata are `2.0.0-alpha.27`. Production/business/R2/Worker/PDF and mobile API connection remain unchanged.

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
