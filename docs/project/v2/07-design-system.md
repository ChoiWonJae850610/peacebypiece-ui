# WAFL v2 Design System - Figma-style Reference - 0.30.0-alpha.8

## Purpose

This document defines the first WAFL v2 design-system baseline before implementation.

WAFL v2 design should not copy the attached concept image directly. The image is a moodboard. This document is the implementation standard. `/ui` will become the live showroom where Codex implements visible samples after the design rules are stable.

## Design-system principle

```text
문서 = 디자인 시스템 규칙
/ui = Figma 대체 쇼룸
Codex = 문서 기준 구현자
컨셉 이미지 = 무드보드 / 방향 참고
```

## 0.30.0-alpha.26 showroom component guidance

Image and attachment controls should read as production assets, not decorative upload blocks.

Design guidance:

- Use compact icon buttons for repeated row actions such as representative selection, preview, delete, order request, and order completion.
- Use a crown icon for representative image selection and a palette/brush visual for sketch-related actions.
- Image asset rows should fit file-like business reading: small thumbnail area, filename, source/type badge, note, and action cluster.
- Attachment rows should remain visually separate from image rows and expose the production-document include state as a quiet checkbox/toggle.
- Mobile image/photo/sketch/attachment add controls may hide labels visually while retaining accessible labels.
- Production summary cards should separate identity from money: the Sheet header shows identity and representative image; overview 제작 요약 shows cost structure.
- 로스/여유 설명 should be short and attached to quantity/order context, not styled as an extra accounting line.

## 0.30.0-alpha.27 compact image/output component guidance

The default production-card view should not over-label obvious visual objects.

Design guidance:

- Prefer a thumbnail-first image grid for image/photo/sketch/reference lists.
- Use a crown icon as the persistent representative-image selector.
- Use row or thumbnail click for preview; avoid a repeated eye icon where the preview target is obvious.
- Keep image filename/type detail inside tooltip, title, or preview mock unless the user is editing metadata.
- Attachment rows should be compact file rows with filename, short type/detail, and delete action.
- Production-document attachment selection belongs to a document attachment picker pattern in output/share.
- Selected document attachments can appear as removable chips.
- Delivery-request rows should have consistent height and truncate long item/memo text.
- Delivery-request detail belongs to a row-click panel, drawer, or bottom sheet.
- Mobile document/delivery share, print, and save actions should be icon-only with `title` and `aria-label`.

Design work must proceed in this order:

1. Product and workflow definition.
2. Design-system document.
3. `/ui` showroom component samples.
4. Workspace prototype.
5. Production implementation.

Do not implement a large workspace redesign before `/ui` confirms the component language.

## Moodboard use rule

The attached concept image may be used only as direction reference.

Use the image for:

- ERP feeling removal.
- Soft card-based layout.
- Light background.
- Subtle accent color use.
- Central Sheet-first composition.
- Product Explorer / WAFL Sheet / Assistant possibility.
- Material/accessory/factory work as card actions.
- Tablet/mobile extension direction.

Do not use the image as:

- Exact color specification.
- Exact typography specification.
- Exact spacing/radius/shadow specification.
- Component-size contract.
- Layout pixel contract.
- Final UI to copy.

## Brand direction

WAFL should feel like:

```text
의류 제작 워크스페이스
살아있는 작업지시서
디자이너와 생산 담당자가 같이 보는 제작 카드
사진과 스케치가 먼저 보이는 업무 공간
```

WAFL should not feel like:

```text
ERP
회계 프로그램
데이터베이스 관리자 화면
재고 숫자만 보는 관리 화면
긴 입력폼
```

Design keywords:

- Clean.
- Light.
- Card-based.
- Image-first.
- Calm.
- Production-ready.
- Mobile-friendly.
- Korean business-readable.

## Color tokens - first draft

Final color values can change after `/ui` showroom review. The first rule is semantic consistency, not exact color obsession.

Recommended token names:

```text
background.page
background.surface
background.subtle
background.elevated

border.default
border.strong
border.focus

text.primary
text.secondary
text.muted
text.inverse

accent.primary
accent.primarySoft
accent.secondary
accent.warning
accent.danger
accent.success
accent.info

status.draft
status.ready
status.ordered
status.making
status.inspection
status.completed
status.hold
status.cancelled
```

Usage principle:

- Page background should be light and calm.
- Surface cards should be white or near-white.
- Accent colors should guide actions, not dominate the page.
- Status colors must be readable with text labels. Do not rely on color alone.
- Danger color is only for destructive or irreversible actions.

## Typography

The app is Korean-first. Typography must prioritize Korean readability.

Recommended hierarchy:

```text
Display / page title
- screen title or product name

Section title
- WAFL Sheet section title

Card title
- fabric card, accessory card, factory card

Body
- normal text and form labels

Caption
- metadata, helper text, timestamps

Numeric
- quantity, unit price, totals, R2 usage, storage capacity
```

Rules:

- Do not use overly decorative fonts.
- Do not make important Korean labels too small.
- Numeric data must align clearly.
- Use font weight to create hierarchy before adding more colors.

## Spacing

Spacing should reduce the ERP feeling.

Recommended scale names:

```text
space.1
space.2
space.3
space.4
space.5
space.6
space.8
space.10
space.12
```

Rules:

- Cards need enough inner padding to feel like editable work blocks.
- Dense tables are allowed only in secondary management screens.
- Main WAFL Sheet should prefer breathing room over maximum data density.
- Mobile card spacing must be comfortable for thumb interaction.

## Radius and shadow

Recommended token names:

```text
radius.sm
radius.md
radius.lg
radius.xl
radius.pill

shadow.none
shadow.card
shadow.popover
shadow.modal
```

Rules:

- Main cards should have moderate radius.
- Do not overuse heavy shadow.
- Use border + subtle shadow instead of strong floating panels.
- Modal and drawer elevation may be stronger than card elevation.

## Icon rule

Icons are supportive, not primary meaning.

Rules:

- Always pair important icons with text labels.
- Do not use icon-only buttons for destructive or business-critical actions unless the action is already obvious and has a tooltip.
- Use icons for scan speed: image, fabric, accessory, factory, PDF, share, reorder, issue.
- Do not mix multiple icon styles in one screen.

## Component inventory for `/ui`

The `/ui` route should become the WAFL v2 design-system showroom.

Minimum samples:

```text
WAFLButton
WAFLCard
WAFLSheet
MaterialCard
AccessoryCard
FactoryCard
StatusBadge
NextActionCard
AssistantPanel
Upload/Image area
Form field variants
Modal
Drawer
Toast
Mobile card stack
PDF-like Sheet preview
```

The showroom must demonstrate desktop, tablet, and mobile-relevant fragments where possible.

## WAFLButton

Button types:

```text
primary
secondary
ghost
danger
link
iconText
```

Button sizes:

```text
sm
md
lg
```

Rules:

- Primary button should be reserved for one main action per section.
- Secondary buttons are for normal actions.
- Danger buttons require confirmation when destructive.
- Card actions should sit near the related card.
- Do not hide important production actions inside a generic menu by default.

Examples:

```text
PDF 만들기
카톡 공유
원단 발주 요청
공장 전달
리오더
입고 처리
```

## WAFLCard

Card types:

```text
sheetCard
infoCard
actionCard
warningCard
summaryCard
imageCard
historyCard
```

Rules:

- A card should have a clear title, status, primary action, and body.
- A card can be incomplete. Incomplete does not automatically mean blocked.
- Card status should be shown by Korean label with internal code only in development/reference docs.
- A card should not become a dense table unless the data is genuinely tabular.

## WAFLSheet

WAFLSheet is the central workspace object.

Required visual areas:

```text
1. Product image/sketch area
2. Product/Style title
3. Sheet status
4. Primary action row
5. Base info card
6. Material cards
7. Accessory cards
8. Factory/process cards
9. PDF/share preview
10. History summary
```

Rules:

- The Sheet should visually connect to the PDF output.
- The Sheet should not look like a generic form.
- The user should understand that the current Sheet can become a PDF/share link.

## MaterialCard

MaterialCard is used for fabric or main material work.

Recommended fields:

```text
원단명
거래처
컬러
단위
소요량
단가
총액
발주 상태
입고 상태
메모
```

Actions:

```text
원단 정보 수정
발주 요청
발주 PDF 보기
입고 확인
이슈 표시
```

Rules:

- Missing unit price should usually be warning/confirmation, not always blocked.
- Missing supplier may block external order sending.
- MaterialCard should support multiple materials per Sheet.

## AccessoryCard

AccessoryCard is used for 부자재.

Recommended fields:

```text
부자재명
거래처
옵션/색상
단위
수량
단가
총액
발주 상태
입고 상태
메모
```

Rules:

- Products may have no accessories. Use `건너뜀(skipped)` rather than forcing an empty error state.
- Accessory cards should be quick to add and duplicate.

## FactoryCard

FactoryCard is used for factory/process instruction.

Recommended fields:

```text
공장명
공정
수량
납기
전달 메모
전달 PDF/link 상태
검수 상태
```

Actions:

```text
공장 지정
공장 전달
공장용 PDF 보기
제작중 표시
검수로 이동
이슈 표시
```

Rules:

- Due date can be optional at initial creation but should warn before factory delivery.
- Factory instruction should be connected to PDF/share, not separate from it.

## StatusBadge

StatusBadge must show Korean label first.

Sheet status labels:

```text
초안(draft)
준비됨(ready)
발주됨(ordered)
제작중(making)
검수중(inspection)
완료(completed)
보류(hold)
취소(cancelled)
```

Card status labels:

```text
비어있음(empty)
작성중(draft)
준비됨(ready)
요청됨(requested)
발주됨(ordered)
입고됨(received)
이슈(issue)
완료(done)
건너뜀(skipped)
```

Rules:

- Korean label must be visible in user-facing UI.
- English code may be visible only in dev/debug/catalog views.
- Status must include accessible text, not only color.

## NextActionCard

NextActionCard is part of Assistant.

It should show:

```text
다음 할 일
왜 필요한지
위험도
관련 카드
실행 버튼
```

Risk levels:

```text
안내(info)
주의(warning)
확인 필요(confirm_required)
차단(blocked)
```

Rules:

- Assistant should explain what is missing.
- Assistant should not block all incomplete states.
- If blocked, it must explain why.

## AssistantPanel

AssistantPanel replaces the old right-side management-panel feeling.

Sections:

```text
다음 할 일
부족한 정보
발주/공유 가능 여부
최근 변경
빠른 액션
```

Rules:

- Assistant is not an admin panel.
- Assistant is not a hidden settings dump.
- Assistant should guide the user to the next production action.
- Mobile Assistant can become a summary card or bottom sheet.

## Upload/Image area

Image/sketch is first-class data.

Types:

```text
대표 이미지
스케치
참고 이미지
첨부파일
```

Rules:

- Representative image is not just an attachment.
- Upload and camera capture should be easy on mobile.
- R2 storage rules and tenant isolation still apply.
- Missing image should usually be warning, not creation-blocking.

## Form field variants

Minimum field types:

```text
text
textarea
number
currency
quantity
date
select
combobox
file/image upload
search-select
```

Rules:

- Number fields should support Korean production usage: 수량, 단가, 총액, 소요량.
- Mobile number inputs should use numeric keyboard where appropriate.
- Required fields must be visually distinguishable but not overbearing.
- Helper text should explain what happens if the field is missing.

## Modal

Modal rules remain strict:

- Background scroll lock.
- Escape key close where safe.
- Focus trap.
- Fixed close affordance on mobile.
- Do not use modal for every edit. Prefer card inline editing or bottom sheet when appropriate.

## Drawer / bottom sheet

Drawer should be used for:

```text
Product Explorer on mobile
search/filter
secondary details
Assistant on tablet/mobile
```

Bottom sheet should be considered for:

```text
card edit
quick action confirmation
share options
mobile Assistant summary
```

Rules:

- Avoid nested drawers.
- Preserve scroll position after close.
- Production-critical actions need clear confirmation.

## Toast

Toast should confirm lightweight events:

```text
저장됨
PDF 생성됨
공유 링크 복사됨
발주 요청됨
이미지 업로드 완료
```

Do not use toast as the only error explanation for critical failures.

## Mobile card stack

Mobile order:

```text
1. 대표 이미지 / 스케치
2. 제품명 / 상태 / 주요 액션
3. Assistant 요약
4. 기본정보
5. 원단
6. 부자재
7. 공장/공정
8. 수량 / 납기 / 비용 요약
9. PDF/share
10. 최근 변경
```

Rules:

- Mobile is not compressed PC.
- Use one-column card flow.
- Place actions inside or near the relevant card.
- PDF/share must be easy to find.

## PDF-like Sheet preview

The preview should show that WAFL Sheet can become a shareable document.

Preview should include:

```text
제품 이미지
제품명
수량
납기
원단 요약
부자재 요약
공장/공정 요약
메모
QR/share/link metadata if applicable
```

Rules:

- Preview is not the final PDF generator implementation.
- It is a design sample for screen-to-PDF continuity.
- PDF/share details are defined in `docs/project/v2/11-pdf-share-spec.md` later.


## Mobile Web Interaction Standard

WAFL v2 components must be designed for real mobile-web behavior before the main workspace is rebuilt. This section is mandatory for `/ui` showroom work and later workspace implementation.

### iOS input focus zoom prevention

Rules:

```text
- The actual rendered font-size for input, textarea, and select controls must be at least 16px on mobile.
- Do not use 12px or 14px input text just to make dense forms fit.
- If a field should visually feel compact, adjust label, spacing, grouping, or layout instead of shrinking the input font below the mobile-safe baseline.
- Do not rely on viewport maximum-scale/user-scalable blocking as the primary fix.
- Do not remove the user's accessibility zoom capability to hide a layout problem.
```

Reason:

```text
iPhone Safari/Chrome can zoom the page when a focused input has too-small text. WAFL users should not need to pinch/zoom back after every field.
```

### Korean IME and focus stability

Rules:

```text
- Input fields must not remount on every character.
- React key values must be stable ids, not current field values.
- Validation errors must not replace the input node while the user is typing.
- Autosave/debounce must not steal focus.
- List row editing must not reorder/remount the active row while Korean composition is active.
- Modal/drawer state must not be recreated on each keystroke.
```

Implementation notes:

```text
- Be careful with compositionstart/compositionend behavior for Korean input.
- Avoid forcing normalization, formatting, or validation during active IME composition unless the field is designed for it.
- Numeric fields may format on blur rather than on every keystroke when formatting would disturb typing.
```

### Modal, drawer, and bottom-sheet behavior

Unified modal/drawer rules:

```text
- Backdrop/overlay style must be consistent across WAFL v2.
- Background blur/dimming must use shared tokens, not screen-specific random values.
- Body scroll must be locked while blocking modal/drawer is open.
- Internal modal content can scroll, but the background page must not scroll.
- PC modal must support ESC close when the modal type allows it.
- Focus trap must keep keyboard navigation inside the open modal.
- Closing the modal should restore focus and preserve page scroll position.
- The close button must remain reachable, especially on mobile.
```

Mobile-specific rules:

```text
- Keyboard opening must not hide the active input or required action button.
- iOS safe-area insets must be considered for bottom actions and bottom sheets.
- Full-screen modal and bottom sheet are separate patterns; do not mix them casually.
- Destructive confirmation must remain readable and tappable on small screens.
```

### Device orientation and viewport changes

WAFL v2 must be tested across:

```text
- mobile portrait
- mobile landscape
- tablet portrait
- tablet landscape
- narrow desktop
- standard desktop
```

Orientation-change rules:

```text
- Open drawer/modal/bottom sheet must remain usable after rotation.
- Scroll lock must not get stuck after rotation.
- Sheet cards must not overflow horizontally except in explicitly scrollable table-like areas.
- PDF preview must preserve readable aspect and not push actions off-screen.
- Bottom action bars must avoid safe-area overlap.
- If focus cannot be safely preserved through rotation, it should fail gracefully rather than breaking layout.
```

### Touch targets

Rules:

```text
- Important mobile tap targets should be large enough for thumb interaction.
- Destructive actions need clear spacing from normal actions.
- Icon-only actions are discouraged on mobile for production-critical work.
- Upload/camera/PDF/share actions must have visible text labels.
```

### `/ui` showroom requirements

The `/ui` route should include mobile-web behavior examples before workspace replacement:

```text
- Form field variants with 16px mobile input text
- Korean text input example
- Numeric input example with mobile keypad expectation
- Modal with backdrop, focus trap, fixed close action, and internal scroll
- Drawer / bottom sheet with body scroll lock
- Mobile card stack with safe-area-aware bottom actions
- PDF-like preview in mobile portrait and landscape widths
```

## Do / Don't

### Do

- Use Korean labels first.
- Keep image/sketch visible and important.
- Use cards to reduce input pressure.
- Put actions near the relevant card.
- Let users create a Sheet before every detail is complete.
- Use Assistant to explain missing information.
- Keep status labels readable.
- Design `/ui` as the implementation showroom.

### Don't

- Do not copy the concept image pixel-for-pixel.
- Do not make the screen feel like ERP.
- Do not make every field mandatory at creation.
- Do not hide production actions in a generic overflow menu.
- Do not treat representative image as a generic attachment.
- Do not use role-name UI branching.
- Do not use English-only status labels in user-facing UI.
- Do not implement workspace redesign before `/ui` samples are reviewed.

## Implementation boundary

This document is design-only for `0.30.0-alpha.8`.

It does not authorize:

- UI route implementation.
- DB migration.
- API changes.
- R2 mutation.
- Production behavior change.
- Package changes.

The next implementation-oriented step after design completion should be a restricted `/ui` showroom patch, not a full workspace rewrite.

## 0.30.0-alpha.17 showroom copy and overflow correction

The `/ui` showroom working prototype should look like a usable WAFL screen first and a design explanation second.

Rules:

- Keep help/info copy out of the main working Sheet unless it directly supports the current user action.
- Move implementation notes, internal action-code examples, and mock-only boundaries to a collapsed design memo area.
- Visible Sheet/Card status pills should show Korean labels only in the working prototype.
- Internal English codes may remain in TypeScript, tests, docs, or collapsed developer/reference memo areas.
- Badge/status pills in mobile frames must use constrained width, truncation, wrapping, or secondary-line text so they do not push content outside cards.
- Quantities and dates in the working prototype should use Korean business notation such as `360개`, `180 yd`, and `24/07/30`.

## 0.30.0-alpha.18 Sheet input and action-flow correction

WAFL input should feel like working on a garment production card, not filling out an ERP table.

Rules:

- Prefer card-based, step-based, or light inline-edit patterns for Sheet input.
- Dense tables are acceptable only as secondary full-list/detail views, especially on desktop or tablet landscape.
- Mobile and tablet portrait should use compact item cards for fabric and accessory work.
- Fabric/accessory item cards should show item name, supplier/option, required quantity, stock use, order quantity, unit price, amount, status, and one or two next actions.
- Use data and actions to explain workflow. Avoid long helper boxes when the same meaning can be communicated by amount summaries, status badges, and action buttons.
- "Add", "input", "amount check", and "order request" should be visually connected in the Sheet section.
- Current PDF, PDF view, share, and download actions should use clear Korean labels with icons where useful.
- User-facing prototype copy should not depend on "snapshot", "STEP", or developer preview labels.
- Product selector cards in compact frames should reserve enough width for text and use one-line ellipsis or a stable two-line treatment rather than allowing vertical clipping.

## 0.30.0-alpha.19 small-frame material cards and status language

Small frames should explain material work through compact rows, not many nested summary boxes.

Rules:

- Fabric/accessory mobile cards should use this structure: item name + short state, supplier + explicit color/option, required/stock/order quantity row, unit price/amount row, and one main action.
- Avoid excessive label/value boxes inside each material card on mobile.
- Money, numbers, and units should use nowrap values so `684,000원`, `180yd`, and `단가 3,800원` do not split awkwardly.
- Keep mobile summary cards to one or two columns. Use list rows when values are long.
- Color/option is a primary field and must be visible in cards and editors.
- Status badges should use short Korean labels and avoid vague labels such as issue/received/requested in the main input screen.
- Concrete warnings such as missing unit price, missing supplier, missing color/option, or quantity confirmation are better than an abstract issue badge.
- Input-source wording should be user-facing: 새로 입력, 거래처에서 불러오기, 재고에서 가져오기, 이전 기록 복사.
- Unit selection should visually distinguish base units, company units, and unit-add request without connecting real settings APIs.
- Process lists should look reorderable/editable rather than fixed timelines when the order can vary by product.

## 0.30.0-alpha.20 card-reduction and PDF-friendly Sheet grammar

The WAFL Sheet surface should feel printable and reviewable while still being editable.

Rules:

- Use cards for major surfaces: Product Explorer, WAFL Sheet section, Assistant, drawer/bottom-sheet, upload/image area, and repeated external examples.
- Do not turn every metric, category, input source, unit, process, PDF purpose, or included field into its own card.
- Inside a major section, prefer definition lists, row lists, compact summary lines, chips, and divider-based table-like previews.
- A selected Sheet section can have one clear header and one row/list body. Avoid nested card-in-card visual rhythm.
- PDF-friendly layout means labels and values align predictably and can map to a generated document later.
- Mobile should reduce boxed summaries first. Use sticky metadata, section navigation, current section rows, and bottom-sheet detail entry.
- Keep buttons close to the rows they affect, but do not wrap every action group in another card.
- Continue to keep money, quantity, unit, and status text nowrap or truncated where necessary on small frames.

This rule applies to the `/ui` showroom prototype only until real workspace migration work is explicitly approved.

## 0.30.0-alpha.21 icon-first actions, balanced rows, and long text handling

Visible `/ui` prototype controls should feel like production tools, not long button labels.

Rules:

- Section tabs and common action rows may be icon-forward, but must keep accessible labels, `title`, or visible short labels where needed.
- Desktop can use icon plus short text. Mobile can use icon-centered controls with screen-reader labels when the surrounding context is clear.
- Document actions should use short labels such as `보기`, `공유`, `인쇄`, and `저장`.
- Multiple buttons or tabs on one line should not sit awkwardly at the far left. Use centered, evenly distributed, or equal-width layouts where the row has three to five actions.
- If wrapping is needed, wrap into a balanced grid rather than a ragged list of unrelated button widths.
- Long factory names, supplier names, addresses, contacts, and delivery memos should use definition-list or row layouts with natural two-line wrapping.
- Do not force long address/contact text into fixed-height small boxes.
- Fabric/accessory quantity rows should make production math readable: required, allowance/loss, stock used, order quantity, leftover, and handling.
- Unit and process choices should appear as one compact list. Company-standard values may use a small suffix such as `회사 기준`, not a large separate box.

This applies to the `/ui` showroom correction only until the real workspace implementation is separately approved.

## 0.30.0-alpha.25 image/size confirmation component behavior

The `/ui` working prototype should keep visual-management and confirmation surfaces consistent with the same WAFL control grammar.

Rules:

- Image/attachment tiles use the same card radius and border treatment as other rows; representative selection uses selected border/background rather than a separate visual language.
- Image, photo, sketch, and attachment actions should use icon-forward buttons with accessible labels.
- Size chips, color quantity rows, measurement cells, and unit toggles should stay compact and readable on mobile; mobile inputs/selects/textareas remain 16px or larger.
- Confirmation panels use the existing surface/card/button grammar and must not imply a real mutation. Use clear cancel/primary actions.
- Mobile confirmation uses bottom-sheet styling with safe-area padding; desktop/tablet confirmation can be inline inside the work panel.
- Process rows should use thin row/inline-edit styling, not nested heavy cards.
- Output/share inclusion summaries should use definition rows or compact lines, not a new document-preview visual system.

This applies to the `/ui` showroom correction only until the real workspace implementation is separately approved.

## 0.30.0-alpha.24 summary restraint and row action placement

The `/ui` working prototype should avoid making every status or count into a badge.

Rules:

- Overview may use plain definition rows. It should not show a grid of status badges.
- A selected section may use one centered text summary line before the row list.
- Warning count badges on tabs should be small, yellow/orange-like, and hidden at zero.
- Tab count badges must fit icon-only mobile tabs without increasing tab height or causing horizontal overflow.
- Material row top-right controls should follow this order: status badge, lock/unlock icon, delete icon.
- The lock/unlock state should use iconography and accessible `title`/`aria-label`; do not show a visible `수정 잠김` text label.
- Locked/read-only rows should be quieter through lower contrast or faint border treatment, not a strong filled background.
- Rows that need input should be more visually noticeable than rows already requested, ordered, received, or done.
- Material row primary actions should sit at the lower/right edge. Use send/paper-plane style iconography for `발주 요청` and check iconography for `발주 완료 처리`.
- Delete should be an icon control near the status cluster and should not be duplicated as a bottom text button.
- Process cards should use the same action grammar for `제작 공장` and additional process rows: drag handle near the top action area and delete icon near it.
- Process up/down/copy text buttons are too heavy for the default screen. Use drag-handle/long-press mock instead.

This applies to the `/ui` showroom correction only until the real workspace implementation is separately approved.

## 0.30.0-alpha.22 default-view action density and support-tool placement

Default production-card sections should not feel like every helper and shortcut is competing for attention.

Rules:

- Default fabric/accessory sections should prioritize item rows, quantity math, status, and one or two clear production actions.
- Assistive controls such as previous record, stock reference, supplier history, input-source explanation, and unit reference should move into drawer/editor/bottom-sheet surfaces.
- Category chips and filters must not visually outrank the item list. If needed, keep them compact or move them into a filter/edit surface.
- Document rows and delivery-request rows should own their view/share/print/save actions. Avoid an additional top common action row when it duplicates row actions.
- Factory/process layouts should visually separate representative production factory information from additional process rows.
- Process row action buttons may remain icon-centered with accessible labels, but repeated factory address/contact fields should be avoided.
- Assistant should show blockers, next action, warnings, and output/share availability rather than repeating the full section data already visible nearby.

This applies to the `/ui` showroom correction only until the real workspace implementation is separately approved.

## 0.30.0-alpha.23 fixed-region scroll and row action grammar

The `/ui` working prototype should feel like a stable work surface, not a page that keeps growing as data grows.

Rules:

- Desktop and tablet landscape may use three or two fixed-height work regions. Each region should scroll internally when its content is longer than the frame.
- Tablet portrait should not reserve permanent vertical space for a full product list. Use a drawer or bottom-sheet style selector mock.
- Mobile sticky headers should stay lean. Section-specific actions should live in the selected section, not in a global top action row.
- Fabric/accessory row actions should stay close to the row and use a small fixed vocabulary: `발주 요청`, `발주 완료 처리`, and `삭제` where allowed.
- Requested, ordered, received, and done material rows should be visually quieter and show a lock/read-only state such as `수정 잠김`.
- Avoid repeated full-list/detail buttons in the default section body when the prototype is trying to show the normal working view.
- Metrics should use at most a few badges per section, then fall back to compact text. Do not create a row of many same-weight badges.
- The accessory tab/icon should feel like a clothing accessory control, not a book/document control.
- Process rows can use icon-centered up/down/copy/delete actions with accessible labels.
- Output/share document and delivery-request rows own their row actions; global duplicate action clusters should not be added.

This applies to the `/ui` showroom correction only until the real workspace implementation is separately approved.
