# Maker WorkOrder Tab IA v2

## Alpha.68 authoring boundary

- Each Draft tab owns one dirty batch. Tab navigation, detail exit, app background, bounded idle and
  `작업지시서 확정` flush through the same coordinator before navigation or confirmation continues.
- Draft permits PDF Preview only. Confirmed permits Preview, Download/Print and fixed 72-hour Share.
- Confirmation locks production-defining identity, allocation, specification, material/process
  composition and prices. Only 납기 and 제작 > 기본 공정 메모 remain editable; the latter is the
  canonical 공장 전달 메모. These edits preserve history and refresh the same active shared document.
- Copy creates an independent original Draft. Reorder stays in its lineage and exposes only due date,
  production quantities, allowed price fields and Basic Process memo; locked fields are rejected by
  both UI routing and server mutation owners.
- Copy navigation trusts the command result ID, opens after core-detail hydration, and hydrates child
  projections independently; filtered-list or child-projection absence never replays Copy. Size/Color
  batches contain only latest dirty destination color/size IDs and acknowledge only unchanged generations.
- Normal list entry, Work History sibling entry, Copy, and Reorder share that same core-first boundary.
  Assets, partner options, and history reconcile independently with one bounded retry; a child error keeps
  the core WorkOrder usable and names the unavailable area instead of presenting a whole-detail failure.
  Materials expose quantity/price allowlist fields without add/delete/vendor/config affordances;
  Finished Spec hides load/save/apply mutation while keeping read-only scrolling and local cm/inch.
- Reorder-local material/process operational order actions remain tappable while identity, vendor and
  composition controls stay locked. Draft list Delete requires explicit confirmation, removes only the
  exact Draft graph/assets, and rejects issued rows. Reorder creation treats the action tap as intent,
  reuses the shared creation blocker, invokes the command once, and opens by returned ID after core read.
- Deleting a Reorder Draft still hard-deletes its WorkOrder payload and exact-owned assets, but one
  minimal durable lineage tombstone retains root identity, used round, deleted state, and deletion time.
  Work History renders that round as non-navigable `삭제됨`, and next-round allocation includes live
  and deleted rounds so a used sequence is never recycled.
- Material partner PICK filters by canonical active capability identity: Fabric, Accessory, factory,
  and process-specific outsourcing selectors never use partner-name heuristics, while multi-type
  partners appear in every applicable selector. Reorder identity fields remain locked.
- The four WAFL starter-spec recommendations are selected only by exact T/B/O/D major category.
  Changing category on a populated Draft requires the shared safety confirmation and one authoritative
  atomic operation that clears detail item, Size/Color definitions and allocations, canonical total,
  starter-template binding, and Finished Spec. Materials, Accessories, and Processes remain. An empty
  Draft changes directly; failure cannot publish mixed old/new category state.

## Alpha.67 identity PICK, WAFL starter spec, and public canvas viewer

Only an editable draft exposes the compact `본생산 / 샘플` control. After ISSUE the existing identity is fixed and the server rejects identity mutation; Reorder remains 본생산. Overview season uses a two-reel year/term WAFL PICK and category detail uses the exact category-scoped WAFL item list, with a nested local-only direct-input route for both.

The four `WAFL 기본 … 스펙` entries are editable starter references, not universal sizing standards. Their source seed owns canonical cm values and category core/addon POMs. Normal Maker `스펙 불러오기 > WAFL 추천` exposes only the one current category-matched WAFL basic template; persisted QA/legacy system templates remain compatible internal data but are not product recommendations. `사용자 저장 스펙` remains an independent company list. Applying one projects values only onto sizes already selected in the WorkOrder; it does not add sizes, invent values for custom sizes, or mutate the product seed. Existing visual POM mappings remain canonical; new stable POM keys without an authored anchor are intentionally grid-only.

Missing Fabric, missing Accessory, and incomplete optional material details are canonical readiness warnings. They appear in `발행 전 확인` but do not prevent issue when all hard blockers—including Basic Process readiness—are satisfied. Public `/v` draws every PDF page through the self-hosted PDF.js canvas owner so Kakao iOS does not depend on a browser PDF plug-in.

Document role: current normative information-architecture owner for the six visible Maker WorkOrder mobile tabs. Shared visual tokens and components are owned by `11a-mobile-design-system-v2.md`; business behavior remains with domain/API contracts.

## Common frame

Overview, Image/Attachment, Size/Color, combined Materials, Production, and Document share one page shell, tab rail, one `WaflWorkOrderTabBody` start inset, section rhythm, major-card grammar, action-tile family, and sheet-based deep-edit language. Their internal data structures need not be identical. The actual rendered outer chain applies that inset once between the sticky rail frame and the selected feature root. Size/Color does not mount an empty editor wrapper, conditional spacer, or second top padding before its first `색상·사이즈` card; editor feedback chrome exists only while feedback or an editor is actually present. The visible rail is `개요 / 이미지·첨부 / 사이즈·색상 / 원부자재 / 제작 / 문서`.

The live `새 작업지시서` text-entry form uses the shared compact `adaptiveExpandable` sheet policy rather than fixed `contentFit`. It completes one current-generation entrance before requesting product-name focus, remains freely draggable, and keeps X as cancel and V as the single create command. Closing before presentation readiness cancels the pending generation; reopening never reuses a stale keyboard/focus intent.

## Overview

The product identity/hero remains concise. Basic information is one coherent major card/row group and cost composition is another. Due date, total quantity, useful counts, and existing authoring behavior remain unchanged. Readiness and warning content is contextual rather than a competing visual system. No cost or readiness calculation changes belong here.

IA simplification review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. Basic information uses the shared responsive metric grid: two columns on a normal phone and four only at a comfortably readable width, with 64-point minimum-height cells and no extra inner gutter. Every metric uses the same surface and geometry; each editable child control supplies exactly one thin underline and the metric wrapper supplies none. Total quantity remains derived/read-only on the same surface without an underline. Cost rows through `1벌 원가` share one divider-inset owner; the separately emphasized final total remains a distinct semantic surface.

Target, major category, season, and comparable staged Overview choices route through the single `WaflReelPickerSheet`. Its `reelAdaptive` initial geometry follows the actual single-choice reel rather than the general form-sheet medium floor; the reel still owns value scrolling and only the header owns sheet free drag. The mounted header establishes its continuous-drag base synchronously at responder grant so physical iPhone touch-down followed by the first MOVE cannot be lost. Date/calendar and live inline edits keep their separate canonical interaction owners.

## Image and Attachment

The owner-approved four action tiles (`사진`, `카메라`, `스케치`, `첨부`), representative-image review, and attachment list remain the visual baseline. Image/Attachment owns no visible or editable factory memo. The historical revision-scoped factory-delivery memo remains stored and may continue to feed existing document/PDF consumers, but new Production authoring uses process-row memo ownership.

## Size, Color, and Finished Spec

Size and Color share one default-expanded `색상·사이즈` matrix card. Compact ruler and palette header actions labeled `사이즈` and `색상` open the unchanged staged X/V selection flows and carry no counts. The real Color × Size quantity projection is visible immediately through `WaflFrozenAxisTable`: the Color label column stays fixed and every Size column remains available by horizontal scroll. Five or fewer Color rows have no `전체보기`; six or more show the first five plus `전체보기`. Size count does not trigger full view.

IA simplification review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. Finished Spec is also default-expanded and reuses the same frozen-axis table with a fixed POM label column and horizontally scrollable Size columns. The corner entry `스펙 항목 〉` opens the same-company reusable catalog with staged X/V selection; retained rows keep values, removed rows remove only the current editable snapshot rows/values, and newly selected items use the canonical empty-value semantics. Five or fewer POM rows have no `전체보기`; six or more show the first five plus `전체보기`. Full view freezes the corner, Size header, and left labels while synchronizing body axes. WorkOrder Size source-of-truth, template, cm/inch, cell mutation, and projection behavior remain unchanged.

Direct Size, Color, and Spec Item catalog creation uses a shared nested handoff. All three parent choosers expose the same `+ 직접 만들기` entry owner. The child has a back route to the parent catalog and uses the registered direct-input confirm through native Done or the minimal keypad action without a duplicate body `추가` or footer action; successful creation auto-stages the new reusable option, while the parent V remains the only WorkOrder batch apply. Saved Spec load and save/update prepare their async list projection before presentation, then use the shared current-generation `adaptiveExpandable` measurement so entrance is one continuous slide-up rather than a visible fallback followed by height correction; an already user-expanded sheet is never collapsed.

The three reusable-create children also share the draggable, free-settle, TextInput focus/reveal policy. Size and Spec begin compactly; Color may begin taller for its palette. Their handle, keyboard, mounted nested transition, explicit `추가`, parent return, and newly created option auto-selection remain one family rather than fixed Size/Spec exceptions.

Category-aware Spec Item review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. The current canonical major category filters the recommendation contents of the two staged sources, `WAFL 제공` and `우리 회사`, and both feed the same X-zero/V-one-batch WorkOrder snapshot flow. An editable draft exposes the same `스펙 항목 〉` chooser even when Finished Spec has zero rows or major category is absent. Without a major category the chooser shows no fabricated WAFL category, explains that category selection enables recommendations, retains only already-supported category-neutral company items, and keeps `직접 만들기` available through the existing nullable category scope. The first explicit V bootstraps the hidden measurement snapshot and Size-aligned rows through the canonical batch command; zero rows are a valid empty collection, not an error. Changing or unsetting category never rewrites rows; only a later explicit V changes the current draft selection. Category-mismatched current rows remain represented in a bounded `현재 사용 중` area. Saved Spec snapshot semantics stay unchanged, issued/locked WorkOrders expose no authoring entry, and the table has no direct row-rename affordance.

Alpha.65 visual selector review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. For `상의 / 하의 / 아우터 / 원피스`, the chooser places one feedback-only technical garment diagram above one shared four-column wrapping grid. Stable WAFL system spec keys map each supported item to labeled guide geometry and staged selections highlight the matching guide without turning the drawing into a hit target. Company/custom and legacy current rows remain selectable through the same grid; `기타` and legacy `셋업` use a truthful grid-only fallback. New Overview selection omits `셋업`, but already persisted setup WorkOrders remain readable and may explicitly select another category without automatic row/value deletion or remapping.

The physical-fidelity correction keeps that IA and replaces only annotation geometry/presentation. One renderer consumes four category-specific hand-authored technical flat definitions; every mapped measurement owns its explicit path, extension lines, local connector, and label rail placement. Automatic midpoint connectors and crisscross mesh are forbidden, selected state never changes geometry, and the grid remains the only selection interaction. The compact diagram must leave the first useful grid rows naturally reachable and retains the existing parent X/V footer ownership.

The subsequent asset-first correction separates clothing recognition from measurement explanation. Upper, lower, outer, and dress each render one fixed supplied SVG technical-flat layer first; the current 55 stable-code hand-authored measurement guides render as a dynamic overlay above it. Selection never changes the garment paths and the garment asset never owns a hit target. Other/legacy setup remains grid-only. This variant remains `OWNER_PHYSICAL_REVIEW_REQUIRED` until the fixed garments, multi-selection overlays, four-column grid, and X/V footer are accepted on the physical iPhone.

The declutter continuation first removed inactive geometry. The current focused-preview rule goes further: no-preview keeps the static garment only, with no neutral label index, while one ephemeral preview may render one full measurement span, extension set, optional connector, endpoint pair, and label. The asset remains the sole complete garment geometry and selection remains owned exclusively by the existing four-column grid. This correction remains `OWNER_PHYSICAL_REVIEW_REQUIRED`.

The focused-preview continuation separates batch staging from visual explanation. The four-column grid may retain any number of checks, while one ephemeral non-persisted preview key renders at most one warm measurement span and one local label; a fresh open, a previewed-item toggle-off, or an unmapped custom/company/current toggle shows the static garment alone. V still applies every staged check and X applies none. The four fixed flats use uniform placement transforms, with upper/lower recognition corrected without changing the 55/55 catalog or any Finished Spec value semantics. This remains `OWNER_PHYSICAL_REVIEW_REQUIRED`; automation does not infer physical visual acceptance.

The current visual owner replaces each single garment with a side-by-side front/back technical-flat pair: front at left and back at right for upper, lower, outer, and dress. The eight authored SVG views remain exact runtime mirrors and use only uniform placement. Garment-only shows the pair without measurement geometry or labels. Each of the 55 mapped system specs has one stable side owner (`front` or `back`), and the singular ephemeral preview renders one explanation on that side while the opposite view stays quiet. Grid staging, X/V, direct-create, and Finished Spec persistence remain unchanged. This front/back variant remains `OWNER_PHYSICAL_REVIEW_REQUIRED`; `PHYSICAL_VISUAL_RESULT_NOT_INFERRED` is mandatory.

The shoulder/armhole fidelity continuation changes only upper, outer, and dress asset geometry. Their front/back views join neck, shoulder, shoulder point, sleeve head, armhole seam and sleeve coherently without detached closed sleeve loops; lower remains the accepted reference. The two-view layout, focused preview routing, four-column staging grid, X/V semantics and persistence are unchanged. This variant remains `OWNER_PHYSICAL_REVIEW_REQUIRED` and physical acceptance is never inferred from automated evidence.

The neckline/outer-pocket fidelity continuation is narrower still. Upper and dress retain the accepted continuous shoulder/sleeve silhouette while their front/back openings become clean round necklines. Outer keeps the same two-view placement and armhole construction, replaces the forced angular collar with a restrained rounded neck/collar line, and uses two quiet straight non-tilted pockets. Lower, the 55/55 side routes, garment-only state, focused preview `0..1`, grid staging, X/V, and direct-create remain unchanged. This variant remains `OWNER_PHYSICAL_REVIEW_REQUIRED`; `PHYSICAL_VISUAL_RESULT_NOT_INFERRED` is mandatory.

## Combined Materials presentation

Fabric and Accessory remain under one visible `원부자재` tab. A compact same-page category switch presents `원단` and `부자재` with real semantic count badges and one trailing plus; it is not a nested global tab bar. Only the selected category's normal list renders. The plus follows the selection, exposes `원단 추가` or `부자재 추가`, and opens the existing add flow. Switching categories is mutation-free, and successful add/edit returns to the same relevant category.

IA simplification review status: `OWNER_PHYSICAL_REVIEW_REQUIRED`. This switch is presentation-only. Fabric and Accessory retain separate DB/API/service/entity ownership, independent authoritative refresh, and unchanged add/edit/lock/order/delete behavior. Historical `fabric` and `accessory` navigation intents normalize to `원부자재` and select the matching category.

Draft removal follows one history-aware presentation contract for both Fabric and Accessory. A
never-requested editing row uses the normal hard-delete command. An editing row that returned from
request cancellation remains visually removable but routes through the existing archive owner so
order/cancel evidence is preserved. Requested or completed rows expose no delete action.

Material unit, required quantity, allowance, and partner selection reuse the same reel owner and semantic adaptive geometry. Labeled Material fields may reuse the canonical sheet field presentation only when their normalization and lifecycle remain equivalent; numeric domain validation, readiness, and order semantics remain in the Material owners.

## Production

Alpha.65 extends the current v2 process owner into bounded draft authoring without importing the preserved `ProductionCardMock`. The visible tab contains one Material-sibling outer section with the same-page `기본 공정 / 추가 공정` switch; it does not expose the historical six-step `제작 흐름`, explanatory intro copy, nested global tab bar, or a second page-level inset. The shared `WaflWorkOrderTabBody` owns both horizontal edges and the already accepted body-start Y.

`기본 공정` presents at most one factory process row. The factory is selected through `WaflReelPickerSheet`; integer-won `공임` and process-row `메모` edit in place through `ControlledInlineEditValue`. Production reuses the extracted live Materials compact-card surface, field/value typography, selection affordance, one-line summary/action row, divider, expand/collapse, and delete-action family without coupling to material data logic. Its collapsed summary is `수량 … · 금액 …` only; `공임` is not duplicated there. The factory card has one fixed role accent, while an additional card derives its accent deterministically from `process_type_code`. The accent never represents order or completion status. Additional cards do not repeat the process name as a standalone title; the `공정` field value plus accent owns identity.

`추가 공정` is a zero-to-many card list driven by the active company-enabled system process catalog. Its contextual plus action starts with the same labeled `reelAdaptive` WAFL PICK used by Unit and other canonical option reels. Factory, Process, and Partner are configurations of one active canonical reel consumer rather than parallel modal owners, and all three inherit the same mounted header drag/free-settle path used by Target, Major Category, and Unit. New creation starts from UI-only `미지정`, keeps V disabled, performs no partner lookup, and creates no row until a real process is chosen; editing an existing row starts at its current process and removal remains explicit delete. A valid process then uses the eligible-partner PICK only when needed. Every required partner route, including an existing row whose partner is empty or no longer eligible, stages the first eligible real partner before the sheet opens, so a one-partner reel exposes V immediately without a wheel gesture; a zero eligible partner result is a safe empty reel with disabled V and usable X, never an invalid index. Existing cards use the same process/partner PICK plus integer-won unit-cost and a shared memo whose staged value is hard-bounded to 100 characters in addition to server validation. The normal path has no multi-field factory/process form sheet. Unchanged inline finalization performs zero mutation, a changed field performs one versioned/idempotent logical command through the serialized queue, and each command first reads the current process projection inside that queue so current entity version and persisted identity are used. A targeted process projection refresh preserves tab/scroll position. Cached Production cards remain mounted during background refresh; an uncached unresolved first load uses the shared `제작 정보를 불러오는 중입니다.` tab loader, and only a genuine read failure exposes safe retry UI.

Derived `예상 공임` is intentionally absent from Production authoring UI. Server-owned `amount`, revision `process_total`/`estimated_total`, Overview/Document consumers, and total-quantity synchronization remain unchanged. Clearing the factory remains an explicit draft-only row delete and additional rows retain explicit delete; issued/locked projections expose no editing affordance.

The Basic trailing action mirrors the current Material order action family while using existing process status values: `ready` is 발주 전, `in_progress` is 발주요청, and `completed` is 발주완료. Request requires a selected real factory, positive WorkOrder total, and positive integer-won labor cost; it locks Basic editing. An `in_progress` Basic row exposes status plus the canonical cancel action only; it never exposes a separate manual complete action. Successful WorkOrder issue is the sole normal Maker completion trigger and atomically advances that requested Basic row. Additional Process receives no order lifecycle action. Every transition retains expectedVersion, idempotency receipt, domain event, tenant/assignment guard, and draft/revision lock.

The requested-state cancel action uses the shared compact action button as icon plus `발주취소`, with the same height and padding family as request and a warning outline. Its pending, disabled, confirmation, and command semantics are unchanged. After issue succeeds, the authoritative refreshed detail projection patches the existing list item through the same workflow-status owner before list navigation. The affected filtered-list query is invalidated once and reconciled in the background on return, so `진행 중`, status-filter membership, and server ordering do not require manual refresh or a second status resolver.

The earlier icon-only cancel presentation is superseded for the normal requested Basic path: it uses
icon plus `발주취소`. No manual Basic completion action is exposed, and this visual change does not
alter the command or introduce an Additional Process lifecycle.

Factory and additional-process editors share the exact `메모` multiline field grammar, 100-character hard limit, and `N / 100` counter and persist it only to their own `work_order_processes.memo`. Partner-only and unit-price-only edits preserve the current row memo; nullable clear writes the canonical null state; deleting the factory row removes its memo with the row. Quantity/cost synchronization never resets process memo. The removed Image/Attachment factory-delivery memo UI does not trigger migration, bulk deletion, or automatic transfer of historical `work_order_revisions.factory_delivery_memo` values.

Production quantity is never a user field. `work_order_processes.quantity` is an internal projection of the canonical WorkOrder total and `amount = total × unitPrice`. All current total-quantity mutations synchronize process quantity/amount and revision `process_total`/`estimated_total` atomically. Existing due/status/application snapshots remain preserved but hidden. Issued, completed, or non-draft revisions remain read-only. This alpha.65 candidate adds no schema or migration and keeps historical mocks reference-only.

## Document

The Document tab is one workbench: production overview, quantity disclosure, factory memo, weak divider, selected attachments, document attachment action, and Quick Delivery action. The irreversible issue/generate action retains its primary hierarchy. Its confirmation describes the immutable issue result without exposing the internal R0 label. If issue succeeds and PDF generation fails, the issued WorkOrder stays successful, the user sees the partial-success state, and `PDF 다시 생성` retries generation only; it never reissues the WorkOrder. The current Basic Process memo is the editable factory-delivery memo source; the legacy revision memo is read fallback only when that process memo is absent. Additional Process memos remain row-local.

Quick Delivery opens as a `WaflInputSheet` deep editor rather than inline expansion inside the workbench. Its staged local draft, WAFL partner picker, direct-input child sheet, native Juso child sheet, and read-only preview remain local-only; persistence, delivery PDF, and Event/Receipt remain outside this contract.

Quick Delivery nested routing preserves one parent local draft while presenting one native child sheet at a time. Partner picker → direct address, direct address → Juso, and direct address → picker transitions wait for the outgoing sheet's slide-down/unmount before opening the next sheet. X discards only the child draft, V updates only the selected origin or destination staging, and closing a child restores a touchable parent without an overlay or business mutation.

Quick nested presentation uses the same canonical handoff coordinator for open, cancel, and selection returns. Every outgoing close completes before a two-frame presentation gap and the next generation opens; Juso selection and cancellation differ only in staged data, not in modal sequencing. Origin/destination identity stays bound to the incoming generation, and post-search detail focus runs only after the matching endpoint, generation, and target are mounted. Repeated origin/destination search-select/cancel cycles must leave the returned parent touch, input, and drag paths active with no invisible overlay.

Quick endpoint entry is state-aware through one pure policy shared by origin and destination. A current direct endpoint opens its direct editor immediately with the exact local postal/basic/detail/contact staging; registered and unspecified endpoints open the WAFL picker, and `WAFL PICK으로 변경` is the explicit direct-to-picker route. X preserves the prior endpoint staging and V updates only the active endpoint. The request-preview child uses the same canonical nested handoff and current-generation adaptive measurement: each open starts with a safe usable target, reconciles only matching body measurement, and returns to the same immediately interactive parent. Whole-Quick persistence remains deferred.

Direct Size, Color, and Spec Item catalog creation follows the same close/reset/present/focus lifecycle. Each child uses the registered direct-input confirm through native Done or the minimal keypad action, renders no duplicate `추가` CTA, returns to its parent, and locally selects the new reusable company option; only the parent V may mutate the WorkOrder selection. Saved Spec load/save keeps its compact adaptive initial height, but once open it uses the same free-settle release physics as Size, Color, Quick, and Attachment.

The alpha.65 reusable-create form family also shares one visible field/action shell: `< 기본 사이즈/색상/스펙`, the `WaflSheetValueField` name surface, and the full-width `추가` action. Color keeps its palette as domain-specific content inside that shell. The live sheet inventory classifies Address Search with the draggable family and delays search focus until presentation readiness, while search results keep body-scroll ownership. Opening Overview, Material, or Production selection sheets must leave the source field's width, height, padding, radius footprint, and surrounding layout unchanged; active state is paint-only.

Quick direct address is address-first: the child exposes native Juso search, actual address, optional detail address, and contact without a second ambiguous `장소` field. Compatibility state may retain the nullable legacy place member, but direct staging and preview present the actual staged address. Persistence remains deferred/local-only.

Quick direct-address postal code and basic address are read-only Juso-result value surfaces. They have no cursor, keyboard, or direct change handler and are replaced only by another address search. Detail address and contact remain visibly editable through the canonical thin-underline sheet field. Finished Spec cm and inch cells likewise share one geometry-preserving editable table-cell surface with Size/Color quantity cells. The earlier owner-approved Finished Spec inch underline is the canonical frozen-table numeric baseline: all three use the same short, bounded, centered value-surface length with clear separation from the side borders and the same nonzero vertical gap above the bottom grid border, hairline thickness, bottom geometry, and alignment. Unit switching changes formatting only, focus never alters row/grid geometry, underline length, or vertical position, text length never changes the line, and locked cells remain underline-free in both units.

## Tab rail and responsive behavior

The current labels/counts and horizontal rail remain. Counts are quiet and compact. The six-tab rail is at least 48 points high, uses the page shell inset, and may scroll horizontally on phone rather than shrinking touch targets. It is the only sticky element inside the WorkOrder detail scroller: back/list and product identity scroll away, while the global WAFL/company header remains outside this owner. On wide phones/tablets, cards may use available content width while action controls cap at their shared maximum. Every selected tab body begins at the same canonical top inset.
## Alpha.66 WorkOrder identity and lineage IA

Sample, derivation lineage, workflow status, and document revision are independent. Fresh normal creation presents Sample ON by default and permits opt-out. Detail exposes a compact WorkOrder-level character control on round-zero original/Rework rows; reorder context is forced 본생산 and hides the invalid Sample switch. This action changes identity only and never rewrites the current revision, generated document, or lifecycle state. Sample Rework is valid at round zero, while direct Reorder and Rework inherited from Reorder can never be Sample. Source/lineage values remain tenant-safe read-model data, but alpha.66 does not render the passive source-title/`N차 계보` subtitle or introduce source navigation.

Create retains the labeled form-sized segmented `작업 구분` control and fresh Sample default. Detail reflects persisted state through the same semantic owner rendered as a compact, unlabeled, equal-segment grouped control fixed at hero top-right; it never wraps beneath the title. The workflow status pill moves below the representative image. The duplicate detail Sample informational pill is absent, while applicable `N차 리오더` and `재작업` lineage pills remain in the text-side row. Reorder context continues to hide the invalid character control. The WorkOrder list stays flat and its existing workflow status rail and identity badges remain unchanged. A separate `필터` action opens the canonical shared sheet with one single-choice `작업 구분` group (`전체 / 본생산 / 샘플`) and one independent multi-select `작업 계보` group (`리오더 / 재작업`). The lineage group ORs internally and combines with status, search, and work character by AND. Zero to three active chips are independently removable near search without forming a second rail. This alpha.66 IA does not expose Reorder/Rework creation or source navigation; those flows remain deferred.

Overview retains 기본 정보 followed by 비용 구성, then one compact pre-issue readiness row. `발행 전 확인 N건` opens a read-only WAFL Sheet whose rows are exactly the complete canonical readiness issue collection. Successful relevant mutations reconcile canonical detail whenever its readiness version trails the WorkOrder entity version, so the row count and Sheet membership always consume the same refreshed `readiness.issues`; no local issue counter exists. Stable issue codes may route only to existing tabs (`개요 / 이미지·첨부 / 사이즈·색상 / 원부자재 / 제작 / 문서`); message parsing and new deep-field routing are forbidden. Unknown issues remain visible and non-actionable. Zero issues render `발행 준비 완료`. The former partial `다음 확인` preview is not active IA.

## Alpha.67 Nth Reorder IA

An eligible issued 본생산 original/direct-Reorder Overview exposes one compact `리오더 만들기`
action. The compact WAFL confirmation displays the current read-model estimate of the next round and
offers `아니오 / 예` only. `아니오` is mutation zero; `예` is one idempotent logical command that
starts the new draft with total quantity zero and due date null. Sample, draft, Rework, cancelled/invalid,
and non-final source contexts expose no create action and are independently rejected by the
server. The server remains authoritative for the globally allocated round if concurrency changes the
previewed number. Success opens the returned WorkOrder ID's Overview directly rather than returning
to the list; quantity and due date are authored there and issue readiness remains authoritative.

`작업 이력` is one read-only WAFL Sheet containing the stable original followed by its direct
Reorders in round order. It does not flatten Rework children into the Nth-Reorder sequence.
Selecting a row opens that WorkOrder detail. Existing list identity badges and two-axis filters
remain the series discovery grammar; alpha.67 adds no tree list and no Rework create flow.

Core WorkOrder detail entry does not depend on optional series context. Core detail, images, and
material-partner options hydrate the screen; a Sample does not request inapplicable Reorder
history, and a history-only error leaves detail interactive with bounded feedback. Reorder create
success is committed at the command response boundary using its returned WorkOrder ID. The
created Overview opens by direct read even when the active list filter excludes it. A post-create
read failure offers read/hydration retry for that exact committed ID only; the create command and
round allocator are never invoked again by that recovery action.

## PDF generation retry and mobile view routing

The Document tab treats issue, PDF generation, and viewing as distinct states. Issue success is
durable even if render/upload is still pending or fails. `PDF 다시 생성` performs generation and
document-status reconciliation only; it never reissues or creates another revision. The mobile
generation request uses the document render budget rather than the generic short API deadline.

`보기` is an authenticated WAFL in-app action and must not launch Safari, create a public manual-share
token, expose raw R2, or put a workspace secret in a query string. It downloads the existing
  workspace-protected internal file route into bounded native cache, renders the actual bytes through
  the single native PDF owner, and removes that cache when the viewer closes. The full-screen viewer
  keeps vertical pages, a passive page count, zoom, bounded retry, and a sticky bottom WAFL `닫기`
  footer action before returning
to the same Document tab. `공유` alone creates and passes one public `/v` URL to the native share
sheet; `저장` owns actual PDF download. A matching Expo 55 iOS Development Build and restored
physical-QA runtime are required before the candidate can be handed to iPhone QA. Safari fallback
is forbidden.

The visible viewer exit is a minimum 44-point bottom WAFL `닫기` Pressable in a footer sibling
outside the native PDF surface. It closes the viewer to the same WorkOrder Document tab; explicit
previous/next page controls and the unreliable top return affordance are absent. Finished Spec `전체보기` expands every POM row under the sheet body's one
vertical scroll owner, shows the total item count, and removes the remaining-scroll hint at the
actual near-bottom boundary. One selected Size uses the available width without an empty half-table.

The first WorkOrder issue requires one Basic Process and requires that process to have completed its
order request. `BASIC_PROCESS_REQUIRED` and `BASIC_PROCESS_ORDER_REQUIRED` route to 제작 through the
same canonical readiness array used by the issue command. Issue success atomically completes only the
requested Basic Process and derives the user-facing `진행 중`/read-only phase from the existing issued
lifecycle. PDF success is not part of this transition.

The authenticated native viewer retains one downloaded PDF instance while vertical scroll owns page
movement and the passive indicator follows renderer page state. Document Save reuses the same
workspace-authenticated byte transport, validates MIME, signature, nonzero bounded size and copied
SHA-256, then hands a temporary local PDF to the native file/save surface and cleans it after handoff;
it never opens Safari. Public `/v` redeems the controlled token/session and mounts the actual PDF
inline immediately, with Download as a secondary action. Managed share/QR information renders
`생성 / 만료 / 마지막 열람 / 열람 횟수` as separate rows. Native share copy contains the controlled
viewer URL exactly once and no R0, revision, or internal identifier. The current runtime viewer
origin remains environment-controlled; a branded production viewer origin is
`BRANDED_PUBLIC_VIEWER_DOMAIN_DEFERRED` until a separately verified deployment owner exists.

Issued PDF process presentation separates immutable process roles. The cover summary always shows
the human `기본 공정 업체` from the issued snapshot, using `미지정` only for compatible legacy
missing data. The later process table is titled `추가 공정`, contains Additional rows only, and is
omitted when there are none. Basic Process is never duplicated in that table. The user-visible
`개정차수` metadata row is absent while internal revision identity and the existing document-number
format remain unchanged.

## Alpha.67 public viewer and share presentation

The public viewer is a hydrated Next application, so the tailnet host exposes the exact `/_next`
GET/HEAD assets referenced by `/v` while retaining the existing route allowlist for every other
path. The viewer settles into success, a bounded unavailable-link state, or a bounded network
state with retry; it must not remain indefinitely on its hydration sentence. Native share sends
one structured message containing product, quantity, due date, and the controlled viewer URL
exactly once. Managed-link rows show creation, expiry, access count, last access, and status without
exposing tokens.

## Alpha.67 final issued-document presentation

The current issued WorkOrder PDF has no QR, workflow-status badge, or visible revision row. Its
fixed A4 portrait cover uses a strong WAFL brand anchor, representative image, human product identity,
canonical identity/lineage badges, a large product title, classification, document-number title metadata,
seven compact key fact cards, Basic Process factory-delivery memo, and one
five-part count summary (`원단 / 부자재 / 색상 / 사이즈 / 추가 공정`). A Reorder shows only
`N차 리오더`, not a redundant `본생산` badge. Portrait detail pages omit zero-row Fabric,
Accessory, and Additional Process sections; Basic Process appears only on the cover. Long tables
use usable page capacity and wrapped-row weight, repeat headers on true continuations, and never
split a logical row. Detail tables center headers, numeric values, and short categorical values,
while long memo/instruction text stays left aligned. Included document images use bounded two-image
portrait pages. PDF generation itself
creates no embedded public-access token; explicit `공유` alone creates a new manual-share identity,
while legacy embedded-token read/revoke compatibility remains non-destructive.

The document number is part of the cover title/meta block and must not appear as a fact card. Cover
facts are limited to `납기 / 총수량 / 대상 / 시즌 / 대분류 / 세부 품목 / 기본 공정 업체`.
The owner-approved portrait mock is the visual SOT for cover density, 43/57 image-to-fact balance,
warm ivory/brick/navy proportions, readable value hierarchy, bounded memo, and the five-cell summary.

## Alpha.68 basic-spec and feedback reconciliation

The Size/Color tab requests WAFL recommendations with the current WorkOrder identity; server read ownership resolves the current revision category and item code before listing or applying the system template. An empty legacy spec category cannot suppress a valid T/B/O/D recommendation, and a stale client category cannot cross-route recommendations. Company templates retain their existing visibility rules.

Maker binary safety decisions—including final issue, Draft deletion, category reset, material/process removal, factory clear, saved-spec deactivation, and document-access revoke—share the Decision owner defined in `11a`. One-way validation and result notices share its buttonless Alert owner. Failed-draft-exit recovery, persistent error panels, and native attachment viewing remain intentionally separate surfaces.

## Alpha.68 Draft boundary persistence

Overview, Size/Color, Finished Spec, Materials, and Production authoring stage local dirty truth and
flush it when leaving a tab or WorkOrder, leaving detail, entering inactive/background best-effort, or
before a lifecycle/finalization command. There is no idle network-autosave boundary. Commands first
flush the relevant section and execute exactly once only after success. New Material and Production
rows use temporary client identities; a boundary flush creates/reconciles their canonical IDs before an
order command. Deleting a never-persisted local row performs no server mutation. Images and attachments
remain immediate because they cross the authenticated object-store pipeline.

Field-to-field movement inside Overview is not a persistence boundary. Production Basic/Additional
switching is a section boundary: the current local process editor stages its final value, Production
flushes, and only a successful flush changes the subsection. Draft Size/Color structure selection is
also local-first. Temporary Size and Color identities render the matrix immediately; the next true
boundary creates canonical structure rows, remaps quantity deltas to returned IDs, and persists the
matrix as one user-visible logical flush. Deleting an unsaved temporary structure row performs no
server mutation.

An applied WAFL or company measurement template remains attached when the WorkOrder has no sizes.
Adding a later supported size fills only missing template cells. Automatic Size reconciliation and
template backfill never set `수정됨`; direct measurement/POM content edits do, and once true the flag
cannot be cleared by later Size reconciliation.

Category confirmation is not an Overview persistence boundary. Confirmation stores the new category
and dependent-reset intent locally; another Overview field preserves that draft and performs no write.
The next real boundary sends the reset overview command with `resetCategoryDependents=true`. When the
user has already selected a new category-owned detail, one serialized item-only command follows with the
authoritative reset result version; failure preserves that local detail as retryable dirty truth. Multi-Size and
multi-Color selection is one local reducer pass, so the matrix and Finished Spec cannot observe
different staged structures. Applied-template content may be cached through the compatible-template
read owner solely to project missing values for a newly staged supported Size; custom Sizes receive no
invented values and the authoritative boundary reread must agree.

Saving a new company Finished Spec template or updating an existing one is also a baseline operation for
the current WorkOrder. The same transaction stores the reusable template content and points the current
spec snapshot at the new template ID/version. Its command event becomes source-baseline truth, so the
current source name is authoritative and `수정됨` is false until a later direct measurement/POM edit.

## Alpha.68 Recipe create and Production subsection feedback

- New Recipe creation owns `새 레시피를 생성 중입니다.` plus `잠시만 기다려 주세요.` inside its
  native input sheet until the exactly-once create completes or fails. Copy/Reorder retain the global
  creation blocker and are not duplicated behind the create Modal.
- Dirty Basic/Additional Production switching flushes before switching and shows the shared save title
  plus helper. Clean switching remains immediate and silent; failure keeps the current subsection and
  local dirty values.

## Alpha.68 Maker terminology boundary

Editable Maker objects are `레시피`: create, list/detail, copy/reorder, delete confirmation/result,
permissions, loading, images, materials, Size/Color, Finished Spec, and pre-issue confirmation use that
term. The artifact produced by confirmation remains a `작업지시서`; issued PDF, print, native/public
Viewer, share copy, and issued-document history retain document terminology. API/domain/schema symbol
names remain WorkOrder and are not a user-facing wording owner.

## Alpha.68 shared text-entry reveal inventory

New Recipe product name, direct Size, direct Color, direct POM/measurement, Overview direct season/item,
saved-spec naming, and Quick Delivery direct text use one text-entry focused-field clearance owner.
Their intrinsic content heights may differ; visual parity is the field-to-keyboard breathing room, not
an absolute sheet top. Numeric keypad, reel, Decision, and non-text presentation remain separate.

The shared owner resolves that breathing room in visual-window coordinates. Recipe, Size, Color,
POM/measurement, Overview direct text, saved-spec naming, and Quick Delivery do not own offsets or
transform corrections. Their native field block and viewport are normalized against the current
animated sheet top, then use the same intrinsic-scroll-first and bounded-rise policy.

Mounted field-block, viewport, and sheet refs are the current primary measurement transport for all
seven routes. Invalid or stale frames receive one bounded ref retry and one compatibility fallback;
feature screens do not add their own measurement owner, clearance, or coordinate correction.

These routes now share the `directInput` keyboard system: Recipe, direct Size/Color, POM create/rename,
Overview season/item, company-template name/rename, and Quick Delivery text/phone fields. The sheet's
expanded detent is the primary keyboard-ON visibility guarantee, while mounted-ref measurement only
fine-scrolls long forms. The accessory Done action ends keyboard input and never performs the footer V,
create, save, apply, or business command.
