# WAFL v2 Screen Spec - Mobile Web Connected Draft - 0.30.0-alpha.8

## Purpose

This document defines the first screen-structure baseline for WAFL v2.

It is intentionally high-level. Detailed component specs, design tokens, database binding, and permission behavior will be defined in later v2 documents.

## Screen philosophy

WAFL v2 screens should not feel like ERP input pages.

The main screen should feel like a garment production workspace:

- Image/sketch first.
- Sheet centered.
- Card-based information blocks.
- Assistant guidance.
- Order/PDF/share actions in context.
- Mobile card flow as a first-class experience.

## 0.30.0-alpha.26 screen correction - image assets and compact production card actions

The `/ui` showroom correction clarifies that image/photo/sketch/reference files are not fixed slots.

Screen rules:

- The image section should show a growing image asset list with thumbnail placeholder, file-like name, source type, preview, representative selector, and delete action.
- The Sheet header reflects the current representative image immediately and must also support a no-representative-image state.
- Attachments stay separate from image assets and can be marked for inclusion in production documents.
- Mobile add actions for image/photo/sketch/attachment should be icon-first to avoid crowding a narrow toolbar.
- Fabric/accessory row actions should stay close to the row status and lock/delete controls; order request and completion should not dominate the bottom of every row.
- The header should identify the product and representative image. Cost values belong in overview 제작 요약.
- Overview 제작 요약 should show 한벌 단가, 총 예상, 원단 총액, 부자재 총액, and 공정 총액 without repeating status.
- Inch entry can use a small helper surface for integer plus fractional values such as 1/8 through 7/8.

## 0.30.0-alpha.27 screen correction - compressed images, output attachments, and delivery rows

The user-facing image tab should be lighter than an asset-management console.

Screen rules:

- Use "이미지 목록" on the user-facing `/ui` surface, while internal documents may still call them image assets.
- The image list is a multi-image list, not fixed slots.
- Default image items should center on thumbnail, representative crown, and delete action.
- File name, long description, and source badges should move to tooltip or preview rather than the default card face.
- Image click opens preview mock; a separate eye preview icon is unnecessary.
- Attachments remain separate from images. The image/attachment tab shows compact attachment rows with delete only.
- Production-document attachment inclusion belongs in the output/share tab through an attachment picker.
- Output/share can show selected attachments as removable chips.
- 작업지시서 and 공장 전달 작업지시서 rows can preview by row click/selection without visible eye icons.
- Delivery-request rows should be compressed: title, origin to destination, one-line item summary, and one-line memo hint.
- Full delivery-request items and memo should appear after row click in a drawer, panel, or bottom sheet mock.
- Mobile document and delivery actions should be icon-only with accessible labels.

## Main workspace structure

The existing 0.24.x three-column mental structure can be reused only after its meaning changes.

```text
Old meaning:
left navigation / center form / right management panel

New meaning:
product exploration / WAFL Sheet / Assistant
```

## PC layout

```text
┌──────────────────────────────────────────────────────────────┐
│ WAFL                                                         │
├──────────────┬───────────────────────────────┬───────────────┤
│ Product       │ WAFL Sheet                    │ Assistant     │
│ Explorer      │                               │               │
│              │ Main image / sketch            │ Next action   │
│ Search        │ Base info card                 │ Missing info  │
│ Filters       │ Fabric cards                   │ Readiness     │
│ Status groups │ Accessory cards                │ Recent events │
│ Recent sheets │ Factory/process cards          │ PDF/share     │
│              │ Size/memo/cost cards            │ Reorder       │
│              │ PDF-like preview                │ Quick actions │
└──────────────┴───────────────────────────────┴───────────────┘
```

### Left: Product Explorer

Purpose:

- Help the user find the garment/style they are working on.
- Not a generic navigation menu.

Contents:

- Search.
- Status filters.
- Due-date filters.
- Product/Style cards.
- Recent Sheets.
- Reorder candidates.
- Draft/incomplete items.

The left area should answer:

```text
어떤 옷을 지금 만들고 있나?
```

### Center: WAFL Sheet

Purpose:

- Main production workspace.
- Screen version of the Sheet/PDF source.

Recommended order:

1. Main image/sketch area.
2. Product name/status/top actions.
3. Base information card.
4. Fabric cards.
5. Accessory cards.
6. Factory/process cards.
7. Size/spec card.
8. Memo/cost card.
9. PDF/share preview card.
10. History summary.

The center area should answer:

```text
이 옷을 만들기 위해 지금 무엇이 정리되어 있나?
```

### Right: Assistant

Purpose:

- Action guide.
- Missing-information detector.
- Readiness and risk panel.
- Quick action surface.

Assistant sections:

- Next action.
- Missing information.
- Order/share readiness.
- Warnings.
- Recent changes.
- Quick actions.

Quick actions may include:

- Generate PDF.
- Share by KakaoTalk/link.
- Request fabric order.
- Request accessory order.
- Send factory instruction.
- Reorder.
- Mark as issue/hold.

The right area should answer:

```text
다음에 무엇을 해야 하나?
```

## Tablet layout

Tablet should not be a squeezed PC layout.

Recommended structure:

```text
Top bar:
- Product/Sheet title
- status
- primary actions

Body:
- WAFL Sheet card flow
- expandable sections

Assistant:
- collapsible side panel or bottom sheet
```

Tablet priority:

1. Read Sheet comfortably.
2. Edit one card at a time.
3. Show PDF/share action clearly.
4. Allow Assistant to appear without permanently taking too much space.

## Mobile layout

Mobile is a one-column card flow.

Recommended order:

```text
1. Main image / sketch
2. Product name / status / primary action
3. Assistant summary
4. Base information card
5. Fabric cards
6. Accessory cards
7. Factory/process cards
8. Quantity / due date / cost summary
9. PDF/share card
10. Recent changes / history
```

Mobile principle:

- Do not force desktop side panels into drawers unless necessary.
- Use cards and bottom sheets.
- Make upload/camera/share actions easy.
- Keep primary actions visible near the relevant card.

## New Sheet creation flow

New Sheet creation should be lightweight.

Recommended wizard:

```text
Step 1. What are you making?
- Product/Style name
- Quantity
- Main image/sketch upload or capture, strongly recommended

Step 2. Basic production info
- Category
- Season
- Color
- Size range
- Due date, optional if unknown

Step 3. Materials
- Fabric card quick add
- Accessory card quick add
- Skip allowed

Step 4. Factory/process
- Factory selection
- Process note
- Skip allowed

Complete
- Create WAFL Sheet
- Assistant lists missing information
```

Minimum creation baseline:

- Product/Style name.
- Quantity.

Strongly recommended but not always required:

- Main image/sketch.

## Card action model

Fabric, accessory, and factory work should happen from cards.

Examples:

```text
Fabric card
- Add fabric
- Set supplier
- Set unit price
- Set usage/quantity
- Request/order fabric
- Mark ordered/received/issue

Accessory card
- Add accessory
- Set supplier
- Set unit price
- Set quantity
- Request/order accessory
- Mark ordered/received/issue

Factory/process card
- Select factory
- Add process note
- Send instruction
- Mark making/issue/done
```

Independent material/order screens can remain, but their role is secondary:

- Inquiry.
- Batch review.
- Supplier grouping.
- Usage history.
- Inventory reference.

## Assistant behavior

Assistant should use risk-based handling.

Risk levels:

```text
info
- Non-blocking guide.
- Example: image is missing, but Sheet can be created.

warning
- Confirm before continuing.
- Example: fabric unit price is missing, but order note can still be sent.

blocking
- Stop the action.
- Example: share link cannot be created for a Sheet the user cannot access.
```

Do not block every incomplete state. Production work often starts before every field is final.

## PDF/share position

PDF/share should be available from:

- Sheet top action area.
- PDF/share card.
- Assistant quick action.

PDF should feel like the output form of the current Sheet, not a separate unrelated export screen.

## Reorder flow

Reorder should be fast.

Expected flow:

```text
Product/Style → latest Sheet → Reorder → confirm quantity/date changes → create new Sheet version
```

Target:

```text
리오더 10초
```

## Screen routes - direction only

Existing routes can remain during transition, but their v2 roles should be adjusted:

```text
/workspace
- Main customer workspace.
- Should eventually center on Product/Style and WAFL Sheet.

/workspace/workorders
- Current workorder route.
- Candidate for v2 transition into WAFL Sheet workspace or compatibility route.

/workspace/material-orders
- Should become secondary inquiry/management, not main flow.

/ui
- WAFL v2 design system showroom.

/functions
- Action code / permission catalog.

/roadmap
- 0.30 v2 roadmap.

/dev/test-console
- Dev/test-only seed, reset, QA, role/account switcher.
- Must remain blocked in production.
```

## First implementation guidance

Do not implement this entire screen spec in one Codex run.

Recommended later order:

1. `/ui` v2 showroom mock components.
2. Static WAFL Sheet mock.
3. Static Assistant mock.
4. Static mobile card flow mock.
5. Data model/type draft.
6. Permission/action code catalog.
7. Prototype workspace route behind dev/test guard or feature flag.
8. Real DB/API binding only after the design and data model are stable.


## Korean role set

v2 alpha planning uses four Korean-first roles:

```text
시스템관리자(system_admin)
고객사 관리자(customer_admin)
디자이너(designer)
재고관리(inventory_manager)
```

Screen labels should use Korean first. English codes are internal implementation values.

## Role-based screen scenarios

These are planning scenarios. Actual visibility must later be controlled by action codes, not hardcoded role names.

### 고객사 관리자(customer_admin) scenario

고객사 관리자는 고객사 workspace를 열어 전체 제품/Sheet 진행, 위험, 비용, 멤버/권한을 확인한다.

Primary screen needs:

- Product/Style search and status grouping.
- Incomplete Sheet list.
- Due-date risk.
- Cost visibility where allowed.
- Member/permission access through settings.
- Assistant exception summary.

### Designer scenario

The designer opens the workspace to create or update a Sheet.

Primary screen needs:

- Fast new Sheet action.
- Image/sketch upload or capture.
- Base information editing.
- Fabric/accessory/factory intent cards.
- Draft PDF preview.
- Reorder action.
- Missing-info guidance without excessive blocking.

### 재고관리(inventory_manager) scenario

재고관리는 입고, 검수, 불량, 재고 반영을 처리하기 위해 workspace를 연다.

Primary screen needs:

- Inspection/inbound queue or filter.
- Fabric/accessory receive state.
- Received quantity input.
- Defect/issue quantity input.
- Issue photo/note.
- Inventory reflection action if allowed.
- Completion action if allowed.
- Recent changes and issue flags.

Production/factory readiness can still appear as Sheet/card information, but v2 alpha does not require a separate production-manager role by default.

### 시스템관리자(system_admin) scenario

The system admin does not use the customer workspace as a normal customer member.

Primary screen needs remain under `/system`:

- Customer companies.
- Signup/onboarding.
- Plan, billing, and storage state.
- System standards.
- Audit logs.
- Dev/test-only support tools where allowed.

## Workflow-to-screen mapping

| Workflow | Main screen area | Assistant role | Secondary screen |
| --- | --- | --- | --- |
| New Sheet | Product Explorer + WAFL Sheet wizard | Missing information after creation | None required |
| Fabric order | Fabric card | Readiness/warning/confirm | Material inquiry/batch view |
| Accessory order | Accessory card | Readiness/warning/confirm | Material inquiry/batch view |
| Factory instruction | Factory/process card + PDF/share card | Production readiness | Partner/factory management |
| Inspection/inbound | Inspection filter or Sheet card | Issue/completion readiness | Inventory/history view |
| Reorder | Product/Style detail or Sheet top action | Reused/missing data summary | Product history |
| PDF/share | Sheet top action + PDF/share card | Share readiness and risk | Files/history view |

## Mobile role scenarios

Mobile should be optimized for the action happening now:

- Designer: capture image, edit base info, send draft/share.
- 고객사 관리자: approve exception, check progress, review cost/risk.
- 재고관리: enter received/defect quantity, attach photo, mark done.
- 디자이너: capture image, edit base info, send draft/share.

Mobile should not expose every admin function as a cramped list. Deep settings can remain PC/tablet-first unless required for field work.

## 0.30.0-alpha.4 screen implications from Neon/R2/Korean roles/status

The screen model must reflect the new data, permission, and status baselines.

### Data binding implication

The central Sheet should not render as one large form.

Recommended screen/data mapping:

```text
Product / Style header
  -> products

WAFL Sheet frame
  -> sheets

Card shell
  -> sheet_cards

Fabric card details
  -> sheet_fabric_cards

Accessory card details
  -> sheet_accessory_cards

Factory/process cards
  -> sheet_factory_cards / sheet_process_cards

Images/sketches/files
  -> files

PDF/share card
  -> pdf_snapshots / share_links

Assistant and history
  -> card statuses / sheet status / events
```

### Permission implication

Buttons and panels should not be shown/hidden by hardcoded role names.

Screen actions should map to action codes:

```text
Create Sheet -> sheet.create
Edit Sheet -> sheet.update
Order fabric -> fabric.order
Share PDF -> pdf.share
Invite member -> member.invite
Run dev reset -> dev.reset.run
```

The future `/functions` route should present this action-code catalog, not a generic feature list.

### Status implication

The UI must show both Sheet status and card status.

```text
Sheet status / Sheet 상태:
초안(draft) / 준비됨(ready) / 발주됨(ordered) / 제작중(making) / 검수중(inspection) / 완료(completed) / 보류(hold) / 취소(cancelled)

Card status / Card 상태:
비어있음(empty) / 작성중(draft) / 준비됨(ready) / 요청됨(requested) / 발주됨(ordered) / 입고됨(received) / 이슈(issue) / 완료(done) / 건너뜀(skipped)
```

Assistant should translate these into user-facing next actions:

```text
- 부족한 정보
- 발주 가능 여부
- 확인 필요 경고
- 차단된 액션
- 최근 변경
```

### Blocking implication

UI should not block every incomplete case.

Recommended UI behavior:

```text
info -> show hint
warning -> show yellow/soft warning
confirm_required -> ask user to confirm
blocked -> disable action with clear reason
```

This screen behavior must be consistent across PC, tablet, and mobile.



## 0.30.0-alpha.4 clarification

This patch clarifies that:

- Neon remains the current DB platform.
- Cloudflare R2 remains the current file/PDF/image storage platform.
- User-facing roles are Korean-first: 시스템관리자, 고객사 관리자, 디자이너, 재고관리.
- Internal role codes are secondary implementation values.
- User-facing statuses are Korean-first, with English DB/API codes in parentheses.
- Production and inspection are not separate default roles in v2 alpha unless the owner later decides to split them.


## `/ui` showroom requirement - 0.30.0-alpha.5

Before rewriting the real workspace, `/ui` should show the v2 visual language with non-production sample data.

Required showroom sections:

```text
1. Brand / token overview
2. Buttons
3. Cards
4. Sheet layout sample
5. MaterialCard / AccessoryCard / FactoryCard
6. StatusBadge with Korean labels
7. AssistantPanel / NextActionCard
8. Upload/Image area
9. Modal / Drawer / Toast
10. Mobile card stack
11. PDF-like Sheet preview
```

Implementation rules for the later `/ui` patch:

- Keep the route dev/internal guarded as it already is.
- Use mock/sample data only.
- Do not connect to Neon or R2.
- Do not mutate production or dev data.
- Do not rewrite `/workspace/workorders` in the same patch.
- Use `docs/project/v2/07-design-system.md` as the design source of truth.


## PDF/share screen baseline - 0.30.0-alpha.6

PDF/share is treated as part of the WAFL Sheet screen model.

### PC Sheet placement

The central WAFL Sheet should expose PDF/share in two places:

```text
1. Sheet-level PDF/share card
   - 작업지시서 PDF
   - 발주요청 PDF
   - 공장전달 PDF
   - 최근 생성/공유 이력

2. Assistant action area
   - PDF 생성 가능 여부
   - 부족한 정보
   - 공유 전 확인
   - 카톡용 문구 복사 / 링크 공유
```

### Card-level placement

PDF/share actions may also appear inside relevant cards:

```text
원단 카드:
- 발주요청 PDF 생성
- 거래처 공유

부자재 카드:
- 발주요청 PDF 생성
- 거래처 공유

공장 카드:
- 공장전달 PDF 생성
- 공장 공유
```

### Mobile placement

Mobile should make sharing a short flow:

```text
Sheet 열기
-> Assistant 공유 상태 확인
-> 공유 버튼
-> PDF 종류 선택
-> 부족 정보 확인
-> 링크/문구 생성
-> 카톡 또는 기기 공유
```

### Required screen rules

- Do not expose raw R2 URLs.
- Do not expose R2 object keys.
- Do not show internal token values.
- Show Korean-first labels.
- Show whether a PDF is current or stale after Sheet changes.
- Show share link expiry/revocation state.
- Keep external recipient handling link-based in alpha.

## 0.30.0-alpha.7 PDF/Worker lifecycle screen implications

The screen must not imply that users directly upload to or delete from R2. User-facing labels should describe business actions, while implementation uses controlled app/API/Worker gateways.

Recommended labels:

```text
이미지 올리기
스케치 올리기
PDF 미리보기
검토용 PDF 만들기
최종 PDF로 보관
공유 링크 만들기
공유 중지
삭제 요청
```

Avoid user-facing labels such as:

```text
R2 업로드
Worker PUT
object key 삭제
signed URL 복사
```

PDF/share card should show lifecycle state:

```text
임시 PDF
- 미리보기/검토 중
- 외부 공유 전

검토용 PDF
- 내부 확인용

공유용 PDF
- 외부 링크 연결됨
- 만료일/열람 상태 표시

최종 PDF
- 공식 보관본
- 재생성 시 새 버전 생성

만료/폐기 PDF
- 외부 접근 불가
```

Assistant examples:

```text
임시 PDF가 있습니다. 최종 PDF로 보관하거나 다시 생성할 수 있습니다.
Sheet가 최종 PDF 생성 후 변경되었습니다. 새 PDF를 생성하세요.
공유 링크가 만료되었습니다. 새 공유 링크를 만들 수 있습니다.
삭제는 보관 정책에 따라 처리됩니다.
```

This is a screen/spec clarification only. It does not implement upload, delete, PDF generation, or Worker changes.


## Mobile web and device behavior standard

The screen model must account for real mobile browser behavior.

### Input focus and keyboard behavior

```text
Requirement:
- When a mobile user taps an input, the screen must not unexpectedly zoom.
- The active field must remain visible when the keyboard opens.
- Korean text input must not lose focus after each character.
- Numeric fields should request a numeric keypad where appropriate, but must remain editable.
```

Screen-design implications:

```text
- Avoid tiny mobile input typography.
- Avoid dense grids that require 12px/14px input text.
- Prefer card-level editing and bottom sheets for mobile rather than squeezing PC tables.
- Preserve focus during autosave, validation, and Assistant updates.
```

### Modal/drawer behavior

```text
PC:
- ESC close when allowed.
- focus trap.
- consistent backdrop blur/dimming.
- scroll position restoration.

Mobile:
- full-screen modal or bottom sheet, selected intentionally.
- close action reachable after scroll and keyboard open.
- body scroll locked while modal/drawer is active.
- internal content scroll only.
- safe-area aware bottom actions.
```

### Orientation behavior

WAFL v2 must treat portrait/landscape changes as a supported scenario.

Checklist:

```text
- Product Explorer/drawer state remains recoverable.
- WAFL Sheet cards do not break horizontal layout.
- Assistant summary remains accessible.
- PDF preview stays readable.
- open modal/bottom sheet remains closable.
- scroll lock does not remain stuck after close or rotation.
```

If a layout cannot preserve an editing state across rotation, it may safely close or blur the active input, but it must not leave the screen broken.

## 0.30.0-alpha.17 `/ui` device-size showroom correction

The `/ui` prototype should show device-specific screen structure with real CSS frame widths, not by shrinking the whole screen with transform scale.

Showroom frame baseline:

```text
Desktop:
- Product Explorer / WAFL Sheet / Assistant 3-area work hub.

Tablet 세로:
- near 768px frame.
- Product selector, Sheet summary, section tabs, current section preview, Assistant as lower or collapsed panel.

Tablet 가로:
- near 1024px frame.
- compact product list, central Sheet, Assistant as side or lower panel.

Mobile:
- near 390px phone frame.
- product search/selection entry, sticky section nav, one current section, and bottom sheet inside the phone frame.
```

User-facing prototype copy should be Korean-first. Do not show internal English status/action codes in the working Sheet area. History/audit can be modeled later, but the main Sheet navigation should prioritize overview, fabric, accessory, factory/process, and PDF/share.

## 0.30.0-alpha.18 `/ui` Sheet input/order/PDF flow correction

The WAFL Sheet screen is a work hub, not a static workorder page or a long all-fields document.

Updated screen rules:

- The overview tab is a manager summary dashboard.
- Overview must show current Sheet status, estimated unit cost, fabric amount, accessory amount, process amount, total estimate, missing unit price count, unordered item count, factory delivery readiness, and current PDF status.
- Fabric and accessory work starts inside the Sheet, not in a detached order screen.
- Fabric and accessory tabs should center on input, unit price, amount, status, and next action.
- Material/accessory input should feel like add -> input -> amount check -> order request.
- Input source choices may include direct input, supplier selection, stock use, and previous Sheet copy.
- When stock is used, the UI should show required quantity, stock use quantity, and order-required quantity together.
- Fabric and accessory sections may use compact cards or card-like rows. Dense ERP-like tables should not be the primary mobile or tablet portrait representation.
- History/audit remains outside the main Sheet tab set for this prototype. The main tabs are overview, fabric, accessory, factory/process, and PDF/share.
- Every device frame should keep amount summary and current PDF status reachable without making the Sheet a long vertical dump.

PDF/share screen copy for user-facing prototype:

- Use "현재 PDF", "PDF 보기", "공유", and "다운로드".
- Do not rely on "snapshot", "STEP", or developer preview wording in user-facing Sheet content.
- The current PDF meaning follows Sheet status: draft/incomplete -> 미완성 PDF, ready/orderable -> 발주용 PDF, factory delivery/production -> 제작중 PDF, completed -> 완성 PDF.
- Factory delivery PDF and quick delivery PDF are PDF purposes selected by Sheet status and delivery target, not three unrelated complex buttons.

This is still a mock-only screen correction. It does not authorize DB migration, API route changes, upload/share/order mutation, R2/Worker changes, PDF Worker changes, production guard changes, or package changes.

## 0.30.0-alpha.19 material/accessory input and process-reference correction

Fabric and accessory entry must be understandable before the real workspace is rebuilt.

Material/accessory status rules:

- User-facing fabric/accessory status should center on `입력중`, `발주 가능`, `발주 요청`, and `발주 완료`.
- Do not show receiving, inbound, inventory reflection, or received status as the main designer Sheet input flow.
- Hide or avoid vague labels such as `이슈`, `요청됨`, `입고됨`, and `작성중` in the main Sheet input surface.
- When something is missing, show concrete warnings: `단가 없음`, `거래처 없음`, `색상 없음`, `수량 부족`, `단위 없음`, or `발주 수량 확인 필요`.
- Status and action should match: 입력중 -> 계속 입력, 발주 가능 -> 발주 요청, 발주 요청 -> 발주 완료 처리, 발주 완료 -> 상세 보기 or no primary action.

Mobile input rules:

- Mobile must show clear `+ 원단 추가` and `+ 부자재 추가` entry points.
- The mobile editor should be a bottom-sheet or full-screen style panel inside the phone frame.
- Fabric editor fields must include fabric name, color, supplier, required quantity, unit, unit price, stock use, order quantity, and memo.
- Accessory editor fields must include accessory name, category, color/option, supplier, required quantity, unit, unit price, stock use, order quantity, and memo.
- Color/option and unit fields must be visible, not buried in helper text.
- Supplier selection should feel like importing from supplier records, while remaining mock-only in `/ui`.

Unit and process reference rules:

- Unit selection should show base/system units, company units, and unit-add request.
- Process selection should show base process, company process, process-add request, and temporary process input.
- Processes are not fixed-order. The UI should show add, delete, move up, move down, and copy affordances.
- Process items should show process name, factory/supplier, quantity, unit, unit price, amount, due date, and memo/warning.
- Actual system-admin or customer-admin process/unit settings screens are not changed by this showroom patch.

## 0.30.0-alpha.20 PDF-friendly Sheet layout correction

The `/ui` Sheet showroom should not look like many small cards stacked inside a card.

Screen rules:

- Treat the central WAFL Sheet as a production document/work hub, not a card gallery.
- Keep one large section card per selected Sheet section, then use rows, definition lists, chip rows, and table-like previews inside that section.
- Use metric boxes sparingly. Prefer one compact summary line for product, fabric count, accessory count, process count, total amount, and current PDF status.
- Fabric and accessory preview items should be rows inside the section. The full edit/list flow can still be represented by drawer or bottom-sheet mock.
- Unit, process, and input-source references should read like toolbars or chip rows, not separate info cards.
- PDF/share should read like the current Sheet output: current PDF state, included information, PDF purpose rows, and delivery data rows.
- Mobile must not become a stack of small boxed summaries. Use one-line metadata, sticky section navigation, the current section, and a bottom-sheet/full-list entry.
- Keep alpha19 concepts: simplified material states, concrete warnings, unit/process reference mock, mobile editor mock, and current PDF wording.

This is still a mock-only screen correction. It does not authorize DB migration, API route changes, upload/share/order mutation, R2/Worker changes, PDF Worker changes, production guard changes, package changes, or workspace/system behavior changes.

## 0.30.0-alpha.21 user wording, allowance ordering, and quick delivery correction

The working `/ui` showroom should use natural user-facing Korean even if internal code and documents still use Sheet as the development object name.

Screen rules:

- Avoid exposing `Sheet`, `시트`, `WAFL Sheet`, `Sheet summary`, or `Sheet 상태` in the working user-facing prototype.
- Prefer `제작 카드`, `제작 요약`, `제품 카드`, `작업 카드`, and `와플 카드` depending on context.
- Product top summary should focus on product name/type, quantity, due date, unit cost, total estimate, and production state. Current output/document state belongs in overview or output/share sections.
- Fabric/accessory rows must show required quantity, loss/allowance quantity, stock use quantity, order quantity, and leftover/over-order handling.
- Leftover/over-order handling can be represented as factory allowance, loss included, stock conversion, all used in current production, or no leftover.
- Unit selection and process selection may remain system/company-standard internally, but the working UI should present them as one unified list with only small secondary labels such as `회사 기준`.
- Output/share should use document names such as `작업지시서`, `공장 전달 작업지시서`, and `퀵 전달 메모`; do not repeat `PDF` in every document title.
- Quick delivery is a delivery-request flow: selected items, origin, destination, contact, and delivery memo. One request should mean one origin and one destination; multiple origins imply multiple requests.
- Long factory/supplier/address/contact values should use wrapping definition rows, not fixed-height boxes.
- Tabs and action rows should be icon-forward, centered or evenly distributed, and keep accessible labels/titles.

This section is a showroom-only correction. It does not authorize API routes, DB persistence, delivery-request mutation, real document generation, share-link creation, R2/Worker changes, production guard changes, or workspace/system behavior changes.

## 0.30.0-alpha.22 default-screen assistive-feature reduction

The working `/ui` showroom should keep the default production-card view focused on the information the user must confirm and the next production action.

Screen rules:

- Fabric and accessory default sections should not prominently expose input-source choices, supplier import, stock import, previous-record copy, or long helper copy.
- Previous record, stock use, and supplier history are assistive functions and should live in editor, drawer, or bottom-sheet mock surfaces.
- Fabric and accessory default sections should show summary, item rows, add, order request, view all, item status, and next action.
- Accessory category is supporting row information. A large category chip/summary region is optional and should not take priority over the item list.
- Output/share should not place generic view/share/print buttons at the top when row-level document and delivery-request actions are available.
- Quick delivery memo should be represented through delivery-request creation and request rows, not as a standalone input/document row.
- Factory/process should default to a representative production factory plus additional process list structure.
- Sewing normally belongs to the representative production factory, but special sewing may still be added as an additional process exception.
- Additional process rows should not repeat representative factory address/contact information unless that process uses a different partner.

This section is a showroom-only correction. It does not authorize API routes, DB persistence, delivery-request mutation, real document generation, share-link creation, R2/Worker changes, production guard changes, process/unit management API work, or workspace/system behavior changes.

## 0.30.0-alpha.25 image, size/color, and confirmation flow correction

The working `/ui` showroom should show that a production card can manage visual references, size/color data, and output/share preparation without connecting real upload, drawing, or document services.

Screen rules:

- Image/attachment is a first-class section, not a hidden helper. It may show representative image, photo, sketch, detail/reference image, and attachment rows.
- Representative-image selection should be visible in the production summary and output/share mock.
- Size/color should be a separate section with size-system choice, size chips, measurement table, unit toggle, and color quantity rows.
- Output/share should explain that future documents include representative image, size/color, material, process, and memo data.
- Delete, order request, missing-order-info, and order-complete actions should open a confirmation panel or bottom-sheet mock before any state-changing-looking result.
- Mobile should keep section tabs horizontally scrollable and show confirmation as a safe-area-aware bottom sheet.
- Process rows can remain compact inline-edit rows; do not make the center panel long by expanding process detail cards.

This section is a showroom-only correction. It does not authorize API routes, DB persistence, upload/delete mutation, drawing/image editing, order mutation, real document generation, share-link creation, R2/Worker changes, production guard changes, process/unit/size management API work, or workspace/system behavior changes.

## 0.30.0-alpha.24 overview summary and section navigation correction

The working `/ui` showroom should make the production-card entry point short enough that the user immediately understands where to go next.

Screen rules:

- Overview should not be a second dashboard of every section. Keep only 수량, 납기, 한 벌 예상, 총 예상, and one plain 상태 line.
- Remove overview shortcut buttons such as `원단 입력·발주`, `부자재 입력·발주`, and `출력·공유`. Section tabs are the primary navigation.
- Do not repeat the same `발주 준비` or work-needed state as multiple badges in the header, overview, and section body.
- Fabric/accessory missing-price or unordered counts belong as small warning badges on the relevant tab. Hide the badge when the count is zero.
- Fabric/accessory section summaries should read as centered text such as `원단 6개 · 원단 금액 1,474,200원 · 작업 필요 3건`.
- Material rows should remove visible `수정 잠김` text. Use lock/unlock icons with accessible labels and a quiet read-only treatment.
- Material row action placement is top-right status + lock/unlock + delete icon, and lower/right primary order action.
- `상세 보기` and `계속 입력` should not appear as default material row actions in this showroom pass.
- Process content remains titled `제작 플로우`.
- `대표 제작공장` should be presented as `제작 공장` using the same process card grammar as additional process rows.
- Default process cards should show process name, factory/partner, quantity, unit, unit price, amount, due date, drag-handle mock, and delete icon.
- Remove default process address/contact/change/copy/up-down/detail buttons from the production flow surface.
- Assistant should show only current blocker, next recommendation, and output/share availability unless a later implementation needs a real task list.

This section is a showroom-only correction. It does not authorize API routes, DB persistence, delivery-request mutation, real document generation, share-link creation, R2/Worker changes, production guard changes, process/unit management API work, or workspace/system behavior changes.

## 0.30.0-alpha.23 fixed panel scroll and action reduction correction

The working `/ui` showroom should make the production-card structure understandable without turning the center area into a long document.

Screen rules:

- Desktop should present Product Explorer, production card, and Assistant as fixed-height work regions with internal scroll inside each panel.
- Tablet landscape should use the same work-region idea at tablet width instead of a squeezed long page.
- Tablet portrait should prioritize the production card; product selection should appear as a drawer/bottom-sheet style mock, not as a permanent long panel above the work.
- Mobile should not show global fabric/accessory add actions in the sticky header. Add actions belong inside the active fabric or accessory section.
- Fabric/accessory main sections should not end with duplicate full-list/add/order button groups. Row-level actions and the section-local add action are enough for this prototype.
- Requested/ordered material rows should read as read-only/locked after order action, with fewer visible actions.
- Top product summary should not repeat product type, quantity, due date, and status in multiple places.
- Process content should be titled `제작 플로우`, split representative factory from additional process rows, and avoid status-badge clutter on each process row.
- Output/share should focus on `작업지시서`, `공장 전달 작업지시서`, and `배송요청서 만들기`; duplicate factory/supplier/contact summaries should not be repeated in this tab.
- Assistant should stay focused on blockers, recommendation, missing/unordered items, and output/share availability.

This section is a showroom-only correction. It does not authorize API routes, DB persistence, delivery-request mutation, real document generation, share-link creation, R2/Worker changes, production guard changes, process/unit management API work, or workspace/system behavior changes.
