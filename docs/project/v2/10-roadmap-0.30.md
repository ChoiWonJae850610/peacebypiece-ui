# WAFL v2 Roadmap 0.30 - 0.30.0-alpha.27

## Purpose

This document defines the active WAFL v2 `0.30.x` redesign roadmap.

The `0.30.x` line is not a continuation of the `0.24.x` workorder-form productization line. It keeps operational safeguards from the existing product, but the product model is reset around:

```text
Product / Style
→ WAFL Sheet
→ Sheet Card
→ Assistant
→ PDF/share
→ reorder / inspection / inventory / history
```

## Current infrastructure assumptions

- App: Next.js App Router, TypeScript, Tailwind CSS.
- DB: Neon.
- File storage: Cloudflare R2.
- File/PDF access: Worker/API controlled flow, not raw browser-managed R2 access.
- Deployment: GitHub `master` + Vercel.
- QA: dev/test environment first, production protected.
- Branch policy before 1.0: `master` remains the single development/QA branch because Vercel deployment is needed for real-device QA.

## Version flow

### 0.30.0-alpha.1 - Product foundation

Status: done.

- v2 product definition.
- Product/Style, WAFL Sheet, Sheet Card center model.
- PC / tablet / mobile screen skeleton.
- First user decisions recorded.

### 0.30.0-alpha.2 - Role and workflow foundation

Status: done.

- Korean role baseline.
- User flow from creation to reorder.
- External partner as share-link recipient in alpha.

### 0.30.0-alpha.3 - DB / permission / status foundation

Status: done.

- Neon data model draft.
- Permission action-code model.
- Sheet/Card status split.

### 0.30.0-alpha.4 - Korean role/status and Neon/R2 correction

Status: done.

- 시스템관리자, 고객사 관리자, 디자이너, 재고관리.
- Korean labels first, English internal codes second.
- Neon and R2 clarified.

### 0.30.0-alpha.5 - Design system foundation

Status: done.

- v2 design system document.
- `/ui` as Figma-style showroom.
- Concept image as moodboard only.

### 0.30.0-alpha.6 - PDF/share foundation

Status: done.

- PDF as Sheet snapshot.
- Controlled share link.
- Kakao API deferred.

### 0.30.0-alpha.7 - PDF/R2/Worker lifecycle correction

Status: done.

- Worker/API controlled file lifecycle.
- temporary/review/shared/final PDF distinction.
- Raw R2 access prohibited.

### 0.30.0-alpha.8 - Mobile web interaction and QA baseline

Status: done.

- iPhone input zoom prevention.
- Korean IME focus stability.
- modal/drawer/bottom-sheet behavior.
- orientation and safe-area QA.

### 0.30.0-alpha.9 - Seed/test scenario baseline

Status: done.

- dev/test-only seed matrix.
- Neon metadata and R2/Worker file scenarios.
- mobile QA, PDF lifecycle, inventory scenarios.

### 0.30.0-alpha.10 - Document governance and Codex-entry baseline

Status: done.

- v1 keep/rewrite/archive classification.
- active v2 Codex read order.
- 0.30 roadmap.
- Codex working rules.

### 0.30.0-alpha.11 - v1-docs gap review baseline

Status: done.

- Compare v2 first-pass documents with existing v1/pre-v2 project docs.
- Confirm v2 product direction while preserving confirmed SaaS, DB, R2, PDF, billing, signup, deletion, QA, and production safety policies.
- Add `docs/project/v2/13-v1-gap-review.md`.
- Record v1 workorder-domain to v2 Product/Sheet/Card mapping.
- Identify blockers before broad Codex implementation.

### 0.30.0-alpha.12 - Operational policy absorption and first Codex gate

Status: done.

- Add `docs/project/v2/14-operational-policy-absorption.md`.
- Absorb gap-review P0/P1 findings into the active v2 baseline.
- Preserve signup/Trial/provisioning, billing/storage, Neon source-of-truth, tenant isolation, R2/Worker lifecycle, production guard, catalog/size/unit, account lifecycle, export/deletion/restore/purge, QA evidence, and PowerShell automation policy.
- Add `docs/codex-prompts/0.30.0-alpha.13-v2-ui-showroom-prototype.md` as the recommended first narrow Codex work order.
- Keep broad workspace implementation, DB migration, API changes, R2/Worker mutation, and production behavior changes blocked.

### 0.30.0-alpha.13 - `/ui` v2 showroom prototype

Status: done.

- Implement the first mock-only WAFL v2 showroom prototype inside `/ui`.
- Keep the existing `/ui` system-admin/internal guard and existing component catalog.
- Add Product Explorer / WAFL Sheet / Assistant layout sample.
- Add Sheet Card samples for image/sketch, base info, fabric, accessory, factory/process, PDF/share, and mobile card flow.
- Add Korean-first Sheet/Card status labels with English internal code hints.
- Add mock action-code examples without hard-coded role branching.
- Add mobile-safe form field samples and PDF-like Sheet preview.
- Do not connect DB, API, Neon schema, R2 Worker, PDF Worker, real upload/delete, real share link, or workspace production behavior.
- UI/product verification remains user-review-required because the patch changes visible design direction and responsive layout.

### 0.30.0-alpha.14 - `/ui` v2 showroom section/responsive correction

Status: done.

- Continue from the alpha.13 mock-only `/ui` showroom without reverting that work.
- Correct fabric and accessory from single-sample-card presentation to section/list cards that can represent real operational volume.
- Add 6 mock fabric items with supplier, color, quantity, unit price, amount, status, and issue hints.
- Add fabric section metrics for item count, total amount, unordered count, and issue count.
- Add 12 mock accessory items grouped by category such as button, zipper, label, cord, package, sewing parts, and other.
- Add accessory category summary plus key item preview.
- Correct factory/process from a single factory card to multi-process timeline/list flow.
- Clarify PDF/share as a whole-WAFL-Sheet snapshot lifecycle from current preview to review PDF, final snapshot, and share link.
- Add Desktop / Tablet / Mobile structure preview so `/ui` immediately communicates the three responsive directions.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, production guard, workspace/system feature, package metadata, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible design direction and responsive layout.

### 0.30.0-alpha.15 - `/ui` Sheet navigation and device showroom correction

Status: done.

- Continue from the alpha.13/alpha.14 mock-only `/ui` showroom without reverting that work.
- Correct the central WAFL Sheet from a long vertical card document into a Summary Header + Section Tabs + selected-section preview hub.
- Add Sheet summary metrics for product/status/thumbnail context, fabric count, accessory count, process count, PDF/share state, and history count.
- Add section navigation for overview, fabric, accessory, factory/process, PDF/share, and history.
- Keep fabric/accessory mock data volume from alpha.14, but show only 3-5 preview rows in the selected tab.
- Add static desktop detail drawer mock showing where full fabric/accessory list editing happens.
- Make Assistant next-action copy respond to the selected tab in mock-only local UI state.
- Promote tablet showroom into its own frame with compact product selector, Sheet summary, section tabs, selected-section preview, and collapsed Assistant panel.
- Promote mobile showroom into its own phone-frame with sticky section nav, accordion sections, and bottom sheet mock for full list viewing.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, production guard, workspace/system feature, package metadata, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible design direction and responsive layout.

### 0.30.0-alpha.16 - `/ui` PC/Tablet/Mobile interactive mock prototype correction

Status: done.

- Continue from the uncommitted alpha.13/alpha.14/alpha.15 mock-only `/ui` showroom without reverting that work.
- Convert the showroom from a mostly static sample screen into a local-state interactive prototype.
- Add a Device mode switcher for Desktop, Tablet, and Mobile frames so the responsive direction can be inspected directly in `/ui`.
- Add four mock Product/Style records with separate representative image placeholder, Sheet status, 6-8 fabric items, 12-16 accessory items, 5-6 process items, PDF/share state, 3-5 history items, and Assistant next-action copy.
- Make Product Explorer selection update the active Sheet summary, section preview, drawer/bottom-sheet content, and Assistant context.
- Make Section Tabs switch between overview, fabric, accessory, factory/process, PDF/share, and history previews.
- Keep Desktop as Product Explorer / WAFL Sheet / Assistant 3-column prototype with a mock detail drawer.
- Promote Tablet as its own compact product selector + Sheet hub + collapsed/expanded Assistant + detail panel prototype.
- Promote Mobile as a phone-frame prototype with product selector, sticky section nav, current accordion section, and bottom sheet mock.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, production guard, workspace/system feature, package metadata, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible local interactions and responsive presentation.

### 0.30.0-alpha.17 - `/ui` device-size PC/Tablet/Mobile prototype correction

Status: done.

- Continue from the uncommitted alpha.13/alpha.14/alpha.15/alpha.16 mock-only `/ui` showroom without reverting that work.
- Correct the prototype from browser-zoom-like previews to actual CSS width frames: Desktop, Tablet 세로 near 768px, Tablet 가로 near 1024px, and Mobile near 390px.
- Split Tablet into portrait and landscape device modes in the switcher.
- Keep frames unscaled; allow horizontal scrolling around frames where the outer `/ui` viewport is narrower than the mock device.
- Reduce help/info copy inside the working prototype so it reads like an actual WAFL Sheet screen.
- Remove English status-code parentheses from the main user-facing prototype while keeping internal TypeScript code values stable.
- Correct visible quantity/unit and due-date display to Korean business notation and YY/MM/DD date format.
- Remove History from the main Section Tabs, Summary Header, and Assistant copy. History data may remain as mock data for future audit/history screens but is not shown in the main showroom.
- Add clearer mobile product search/selection entry and keep mobile bottom sheet inside the phone frame.
- Add badge/status overflow prevention so small mobile frames do not clip labels or push content outside cards.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, production guard, workspace/system feature, package metadata, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible local interactions and responsive presentation.

### 0.30.0-alpha.18 - `/ui` Sheet input/order/PDF delivery flow correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.17 mock-only `/ui` showroom without reverting that work.
- Reframe the prototype as one WAFL Sheet that connects input, amount confirmation, order readiness, and current PDF delivery.
- Change the overview tab into a manager summary dashboard with Sheet status, estimated unit cost, fabric amount, accessory amount, process amount, total estimate, missing unit prices, unordered items, factory delivery readiness, and current PDF status.
- Replace fabric table-like preview with compact item cards showing input source, required quantity, stock use, order quantity, unit, unit price, amount, status, and next action.
- Apply the same card-based input, amount, status, and order action flow to accessories while keeping category group summary.
- Show direct input, supplier selection, stock use, and previous Sheet copy as mock input source options.
- Reorganize PDF/share around current PDF, PDF view, share, download, included information, factory/delivery/supplier data cards, and Sheet-status-based PDF meaning.
- Add factory delivery PDF and quick delivery PDF concepts without adding real generation, share-link creation, API calls, R2 writes, or Worker changes.
- Keep mobile/tablet displays card-centered and ensure amount summary plus current PDF status are visible in device frames.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, production guard, workspace/system feature, package metadata, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible workflow structure and responsive content behavior.

### 0.30.0-alpha.19 - `/ui` material input/status/unit/process correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.18 mock-only `/ui` showroom without reverting that work.
- Simplify fabric/accessory user-facing status to input, orderable, order requested, and order completed meanings.
- Hide inbound, receiving, inventory reflection, and abstract issue language from the main Sheet input surface.
- Replace vague issue/status badges with concrete warnings such as missing unit price, missing supplier, missing color/option, missing unit, insufficient quantity, or order quantity confirmation.
- Add mobile fabric/accessory add buttons and local editor panel mock inside the 390px phone frame.
- Make color/option, supplier import, required quantity, unit, unit price, stock use, order quantity, and memo visible in the mobile editor.
- Change input-source wording to new input, supplier import, stock import, and previous record copy.
- Show unit reference use: base units, company units, and unit-add request.
- Show process reference use: base process, company process, process-add request, and temporary process input.
- Correct process UI from a fixed timeline to an add/delete/move/copy capable list with factory/supplier, quantity, unit, unit price, amount, due date, and memo.
- Correct small-frame money/quantity/unit typography with compact rows and nowrap values.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, production guard, workspace/system feature, package metadata, process/unit API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible input/status/mobile workflow and responsive typography.

### 0.30.0-alpha.20 - `/ui` card-reduction and PDF-friendly Sheet layout correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.19 mock-only `/ui` showroom without reverting that work.
- Reduce excessive nested cards/boxes in the central WAFL Sheet.
- Keep major section surfaces, but use compact summary lines, definition lists, chip rows, and table-like row lists inside sections.
- Change the Sheet summary header from metric boxes to a product-thumbnail plus document summary line.
- Change input-source, unit-reference, and process-reference examples from small cards into toolbar/chip rows.
- Keep fabric/accessory mock data and alpha19 simplified statuses, but show preview items as rows inside one section card.
- Change accessory category summary to compact chips.
- Change process delivery/process steps to definition rows and reorderable row lists.
- Change PDF/share to current-PDF document block, included-information summary, PDF-purpose rows, and delivery definition rows.
- Reduce Assistant context rows and mobile header summary boxes.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, production guard, workspace/system feature, package metadata, process/unit API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible layout density and PDF-friendly Sheet presentation.

### 0.30.0-alpha.21 - `/ui` user wording, allowance ordering, output/share, and quick delivery correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.20 mock-only `/ui` showroom without reverting that work.
- Remove awkward user-facing Sheet/시트 wording from the working prototype and use 제작 카드, 제작 요약, 출력·공유, 작업지시서, 공장 전달 작업지시서, and 퀵 전달 메모.
- Remove current-PDF style metric from the top product summary and focus that header on product type, quantity, due date, unit cost, total amount, and production state.
- Add loss/allowance quantity, total required quantity, stock use, order quantity, leftover quantity, and leftover handling to fabric/accessory preview rows.
- Show over-order handling as factory allowance, loss included, stock conversion, all used in current production, or no leftover.
- Simplify unit and process selectors into one chip list with small company-standard labels instead of large system/company splits.
- Rename PDF/share tab and related actions toward output/share and business document names.
- Add document rows for 작업지시서, 공장 전달 작업지시서, and 퀵 전달 메모 with short view/share/print actions.
- Add quick delivery request mock grouping selected items by origin, destination, and delivery memo.
- Improve long factory/supplier/address/contact wrapping through definition-list rows.
- Make section tabs, device mode switcher, document actions, and mobile tabs more icon-forward and evenly aligned.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, delivery-request mutation, production guard, workspace/system feature, package metadata, process/unit API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible terminology, production quantity math, output/share wording, and quick delivery flow.

### 0.30.0-alpha.22 - `/ui` assistive feature exposure and representative factory/process correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.21 mock-only `/ui` showroom without reverting that work.
- Reduce default fabric/accessory screen exposure of input source, supplier import, stock import, previous-record copy, and other assistive controls.
- Move previous record, stock use, supplier history, input-source, and unit-reference examples into drawer/editor mock surfaces.
- Remove the large accessory category chip/summary area from the default screen while keeping category as row-level supporting information.
- Remove output/share top-level common view/share/print buttons and keep actions on document or delivery-request rows.
- Remove the standalone quick delivery memo document row and show quick delivery through delivery-request creation plus request rows.
- Correct factory/process to representative production factory plus additional process list.
- Show sewing as the normal representative production-factory work, while allowing special sewing as an additional process exception.
- Reduce Assistant repeated context so it focuses on blockers, next action, missing/unordered warnings, and output/share availability.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, delivery-request mutation, production guard, workspace/system feature, package metadata, process/unit API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible density, action placement, output/share behavior, and factory/process structure.

### 0.30.0-alpha.23 - `/ui` fixed panel scroll and action reduction correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.22 mock-only `/ui` showroom without reverting that work.
- Correct Desktop from a long central page into fixed-height Product Explorer / production card / Assistant panels with internal scrolling.
- Correct Tablet landscape into fixed-height work regions and Tablet portrait into a work-first frame with product selector shown as a drawer-style mock.
- Remove global mobile fabric/accessory add buttons and expose add only inside the active fabric or accessory section.
- Remove unnecessary bottom/global actions such as full-list/detail/continue-input/process-detail/output-detail buttons from the main working prototype.
- Limit material item actions to order request, order completion, and delete where appropriate; requested/ordered items show a locked/read-only treatment.
- Reduce duplicate top production summary details and awkward metric badge rows.
- Rename the process tab content to 제작 플로우, with representative factory details plus additional process rows and icon actions.
- Simplify output/share to 작업지시서, 공장 전달 작업지시서, and delivery-request creation/rows with row-level share/print/save actions.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, delivery-request mutation, production guard, workspace/system feature, package metadata, process/unit API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible responsive layout, panel scrolling, action placement, and output/process wording.

### 0.30.0-alpha.24 - `/ui` overview summary and card action grammar correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.23 mock-only `/ui` showroom without reverting that work.
- Simplify overview to quantity, due date, estimated unit cost, estimated total, and one plain status line.
- Remove overview shortcut buttons for fabric input/order, accessory input/order, and output/share so the tabs remain the primary navigation.
- Move fabric/accessory missing-price or unordered work-needed signals to small tab badges that hide when the count is zero.
- Change fabric/accessory section metrics into one centered text summary line instead of multiple status badges.
- Unify material item action placement: top-right status + lock/unlock + delete icon, and lower/right primary order action.
- Remove visible locked-row text and use lock icons, lower contrast, and read-only row treatment for requested/ordered/received/done rows.
- Remove `상세 보기` and `계속 입력` from the default material row vocabulary.
- Rework process cards so 제작 공장 and additional process cards use the same inline-edit card grammar with drag-handle mock and delete icon.
- Remove default process address/contact/change/copy/up-down/detail actions from the production flow screen.
- Keep output/share compact with 작업지시서, 공장 전달 작업지시서, 배송요청서 만들기, 배송요청 추가하기, and delivery-request row actions.
- Reduce Assistant to current blocker, next recommendation, and output/share availability without repeating material counts.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, delivery-request mutation, production guard, workspace/system feature, package metadata, process/unit API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible summary density, tab alert placement, material actions, and process card grammar.

### 0.30.0-alpha.25 - `/ui` image/attachment, size/color, output/share, and confirmation flow correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.24 mock-only `/ui` showroom without reverting that work.
- Promote image/attachment to a first-class section tab with representative image, photo, sketch, reference image, and attachment examples.
- Let representative-image selection affect the production summary and output/share mock.
- Add a size/color section with size-system options, size chips, measurement table, cm/inch toggle, and color quantity rows.
- Make output/share describe that documents include representative image, size/color, material, process, and memo data.
- Replace immediate-looking material delete/order/order-complete actions with confirmation panel or bottom-sheet mock flows.
- Keep process rows compact and inline-edit-like rather than heavy nested cards.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, delivery-request mutation, image editing/drawing, real PDF generation, production guard, workspace/system feature, package metadata, process/unit/size API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible section structure, confirmation behavior, image selection, size/color entry, and output/share wording.

### 0.30.0-alpha.26 - `/ui` image asset structure, representative image behavior, compact material actions, and production summary correction

Status: done.

- Continue from the uncommitted alpha.13 through alpha.25 mock-only `/ui` showroom without reverting that work.
- Replace fixed image/photo/sketch slots with a multi-image asset list that shows file-like name, source type, thumbnail placeholder, preview, representative selector, and delete action.
- Keep attachment files as a separate list with preview mock and a "제작 문서에 포함" toggle that affects output/share copy.
- Define representative-image behavior in local mock state: first added image auto-selects when empty, deleting non-representative images keeps the selected image, deleting the selected image picks the first remaining image, and deleting the last image leaves no representative image.
- Reflect representative-image selection immediately in the Sheet header and output/share mock, including the no-image state.
- Make mobile image/photo/sketch/attachment add actions icon-first and use the palette/brush visual language for sketch.
- Move material row order-request and order-complete actions into the top-right row action cluster beside status/lock/delete.
- Keep the Sheet header focused on product identity and representative image; move cost information to overview 제작 요약.
- In overview 제작 요약, show 한벌 단가, 총 예상, 원단 총액, 부자재 총액, and 공정 총액; do not repeat status there.
- Treat 로스/여유 금액 as included in 발주수량 x 단가, not as a separate cost line in the main summary.
- Add a mock inch fraction helper for size/color entry with integer input and none, 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, and 7/8 fraction choices.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, delivery-request mutation, real upload/delete, real image editing/drawing/camera capture, real PDF generation, production guard, workspace/system feature, package metadata, process/unit/size API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible asset management, representative-image behavior, compact action placement, production-summary wording, and size helper behavior.

### 0.30.0-alpha.27 - `/ui` image/attachment compression, output/share attachment picker, and compact delivery-request correction

Status: current.

- Continue from the uncommitted alpha.13 through alpha.26 mock-only `/ui` showroom without reverting that work.
- Change the user-facing image section label from "이미지 자산 목록" to "이미지 목록".
- Compress image items to thumbnail placeholder, crown representative selector, and delete icon; hide file name, long note, source badge, and preview eye icon from the default list.
- Open image preview mock from thumbnail/item click while keeping file name/type in the preview surface.
- Preserve alpha.26 representative-image local state: crown selection, header reflection, representative deletion fallback, and no-image state.
- Compress attachment rows to file name, type/detail, and delete icon; remove preview eye icon, production-document checkbox, and included/not-included badge from the image/attachment tab.
- Move production-document attachment inclusion to the output/share tab with included-attachment chips and an attachment picker mock.
- Show representative image in output/share as a small thumbnail, not a filename string.
- Remove preview eye icons from 작업지시서 and 공장 전달 작업지시서 rows; use row selection/click for preview mock.
- Compress delivery-request rows with consistent height, 출발지→도착지, "외 n개" item summary, and one-line memo indication.
- Move full delivery-request items and memo to a row-click detail mock; make share/print/save actions icon-only.
- Remove or minimize repeated 배송요청 badges because the row title already identifies the request.
- Keep the patch mock-only: no DB migration, API route, Neon schema, R2/Worker, PDF Worker, upload/share/order mutation, file upload/delete/preview API, image editing/drawing/camera API, delivery-request mutation, real PDF generation, production guard, workspace/system feature, package metadata, process/unit/size API connection, or role-name branching change.
- UI/product verification remains user-review-required because the patch changes visible image density, attachment-selection flow, document row behavior, and delivery-request presentation.

## Next recommended sequence

### 0.30.0-alpha.28 - action-code/type draft or owner-reviewed prototype follow-up

Recommended mode: Codex medium-high.

Preferred Option A - action-code/type draft:

- Draft shared internal action-code/status/type catalogs without DB migration.
- Keep role labels as presets only; runtime branching must remain action-code based.
- No DB migration.
- No API implementation.
- No R2/Worker mutation.
- No production behavior change.

Option B - owner-reviewed prototype follow-up:

- Extend mock-only UI after owner reviews `/ui` alpha.27.
- Do not replace real workspace routes until a separate approved work order.

### 0.30.0-alpha.17+ - Implementation planning

Implementation must be phased:

1. shared types and action-code catalog,
2. mock-only v2 Sheet prototype,
3. `/ui` showroom validation,
4. dev/test seed implementation,
5. Neon migration design,
6. API and Worker integration,
7. workspace route migration.

## Implementation gates

Codex must not perform broad implementation until all of these are true:

```text
- v2 docs are read and conflict-reviewed.
- user confirms the next phase.
- allowed files are listed.
- forbidden files are listed.
- DB migration 여부 is explicit.
- R2/Worker mutation 여부 is explicit.
- production guard is explicit.
- test commands are explicit.
- rollback/patch rule is explicit.
```

## Roadmap status summary

```text
Design baseline: first pass complete at 0.30.0-alpha.10; operational policy absorbed at 0.30.0-alpha.12; first `/ui` showroom prototype implemented at 0.30.0-alpha.13; Sheet navigation showroom corrected at 0.30.0-alpha.15; interactive device/product prototype corrected at 0.30.0-alpha.16; device-size prototype corrected at 0.30.0-alpha.17; Sheet input/order/PDF delivery flow corrected at 0.30.0-alpha.18; material input/status/unit/process flow corrected at 0.30.0-alpha.19; card-reduction/PDF-friendly Sheet layout corrected at 0.30.0-alpha.20; user wording/allowance ordering/output/quick delivery corrected at 0.30.0-alpha.21; assistive feature exposure and representative factory/process structure corrected at 0.30.0-alpha.22; fixed-panel scroll and unnecessary-action reduction corrected at 0.30.0-alpha.23; overview summary, tab alert badges, material action placement, and process card grammar corrected at 0.30.0-alpha.24; image/attachment, size/color, output/share inclusion, representative-image selection, and confirmation-first material actions corrected at 0.30.0-alpha.25; image asset list, representative-image delete behavior, attachment inclusion, compact material actions, production summary cost structure, and inch fraction helper corrected at 0.30.0-alpha.26; image/attachment compression, output/share attachment picker, document row preview selection, and compact delivery-request rows corrected at 0.30.0-alpha.27
Implementation readiness: narrow mock/type work only
Recommended next: owner browser review of `/ui` alpha.27 compressed image/output-share/delivery prototype, then action-code/type draft or prototype follow-up
Codex broad implementation: blocked
Codex narrow document sync: allowed after work order
Codex /ui showroom prototype: 제작 카드-centered input/order/output delivery plus fixed desktop/tablet panel scroll, simplified overview, fabric/accessory tab alert badges, compressed thumbnail-first image list, representative image selection/delete behavior, compact attachment list, output/share attachment picker, image/attachment and size/color sections, inch fraction helper, compact material actions, confirmation-first material actions, simplified 제작 플로우 rows, output/share inclusion summary, compact delivery-request rows/detail mock, and PDF-friendly row layout mock-only prototype implemented, user visual confirmation still required
DB migration: blocked until explicit migration plan
R2/Worker mutation: blocked until explicit work order
Production behavior change: blocked
```
