# WAFL v2 App Feature Map from /ui alpha.27 - 2.0.0-alpha.1

## Purpose

This document maps the existing `/ui` alpha.27 design baseline into the App-first production-card section model.

`/ui` remains the implementation-baseline design showroom. The customer-facing direction is Expo React Native.

## Section map

### 1. 개요

Carries the production-card summary:

- product identity,
- representative image,
- quantity,
- due date,
- unit estimate,
- total estimate,
- production state,
- current blocker and next action.

### 2. 이미지·첨부

Maps from alpha.27 image compression:

- user-facing label is `이미지 목록`,
- thumbnail-first image list,
- crown representative selector,
- delete icon,
- preview by thumbnail/item click,
- attachment rows are compact and separate from image selection.

Attachments are not representative images.

### 3. 사이즈·색상

Carries:

- size system,
- size chips,
- measurement table,
- cm/inch toggle,
- inch fraction helper,
- color quantity rows.

Inch fractions preserve the existing planning direction:

```text
1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8
```

### 4. 원단

Carries:

- material rows,
- required quantity,
- loss/allowance,
- stock use,
- order quantity,
- unit price and amount,
- compact status and order actions.

### 5. 부자재

Carries:

- accessory rows,
- category/option,
- required quantity,
- loss/allowance,
- stock use,
- order quantity,
- unit price and amount,
- compact status and order actions.

### 6. 제작 플로우

Carries:

- 제작 공장,
- additional process rows,
- process, partner, quantity, unit, unit price, amount, due date, memo,
- reorder/drag or long-press direction.

### 7. 출력·공유

Carries:

- 작업지시서,
- 공장 전달 작업지시서,
- 배송요청 만들기,
- 배송요청 추가하기,
- representative-image thumbnail,
- selected attachment chips,
- attachment picker mock,
- compact delivery-request rows.

Document rows should not repeat `PDF` in every title. The business document names come first.

## Preserved alpha.27 wording

Keep these user-facing concepts:

- 제작 카드
- 제작 문서
- 작업지시서
- 공장 전달 작업지시서
- 배송요청서 만들기
- 배송요청 추가하기

Do not repeat `PDF` in document names unless the user is clearly choosing a file format or viewing a generated file.

## Boundary

This map does not implement any Expo screen, API, DB, R2, Worker, file preview, image editing, delivery request, or PDF generation behavior.

## 2.0.0-alpha.6 mobile alignment correction

`2.0.0-alpha.6` applies this map back into `apps/mobile` as a mock-only alignment pass.

Core correction:

- The app mock should read as a WAFL production-card flow, not a generic production-management or project-management screen.
- The visible work order is `대표 이미지/기본 정보 확인 -> 이미지·첨부 정리 -> 사이즈·색상 수량 확인 -> 원단 입력·발주 -> 부자재 입력·발주 -> 제작 공장 + 추가 공정 정리 -> 제작 문서/공장 전달 작업지시서/배송요청 출력·공유`.
- Each section may show a compact `다음 확인` or `작업 사인` panel instead of a developer-like assistant panel.
- The production-flow section represents `제작 공장`, `추가 공정`, and `공장 전달 준비`. It should not look like a full production progress tracker.
- Avoid generic process statuses such as `진행 예정`, `일정 확인`, or `대기` in the default production-card mock. Prefer `공장 전달 준비`, `작업지시서 전달 준비`, `공정 메모 필요`, `단가 확인 필요`, `납기 확인 필요`, `전달 전 확인`, or `전달 완료`.
- Output/share should show document types and included information before actions. Document names should remain business names first, not repeated PDF titles.
- Delivery-request rows should imply one origin, one destination, multiple items, contact confirmation, and delivery memo.
- User-facing text should use `사이즈·색상`, while internal code names may remain `size` and `color`.
- Image/attachment detail deepening is deferred to `2.0.0-alpha.8`.

Implementation boundary:

```text
No real upload, camera, file picker, share, PDF generation, delivery request, order mutation, API, DB, R2, Worker, drag, or long-press behavior is authorized by this alignment correction.
```

## 2.0.0-alpha.7 signature UI correction

`2.0.0-alpha.7` strengthens the `apps/mobile` mock signature UI while keeping the same mock-only boundary.

Core correction:

- The production-flow tab should show a compact progress rail for `발주 요청 -> 자재 준비 -> 재단 -> 봉제/추가공정 -> 검수/포장 -> 출고 준비`.
- The rail uses WAFL-specific handoff states such as `완료`, `전달 준비`, `공정 메모 필요`, `납기 확인 필요`, `공장 확인 필요`, and `전달 전 확인`.
- The rail is a production-card handoff/readiness view, not a real-time production tracking system.
- The output/share tab should read like a document workbench: document list, selected document preview sheet, included-information summary, delivery-request summary, and compact icon actions.
- Document names remain business names first and do not repeat `PDF` in every row.
- Icon actions remain dependency-free unless an icon package is already a direct mobile dependency.
- The image tile must not nest a button-like action inside another button-like tile; selection/preview regions and action controls must be separated.
- Image/attachment mock deepening is deferred to `2.0.0-alpha.8`.

Implementation boundary:

```text
No real upload, camera, file picker, share, PDF generation, delivery request, order mutation, API, DB, R2, Worker, drag, long-press, auth, or storage behavior is authorized by this signature UI correction.
```

## 2.0.0-alpha.8 real-use UX correction

`2.0.0-alpha.8` tightens the `apps/mobile` mock around real apparel-production usage.

Core correction:

- Internal production-card IDs may remain in mock data keys, but customer-facing app surfaces should prioritize product name, quantity, due date, status, partner, and amount instead of IDs such as `WAFL-2408-119`.
- The image/attachment tab should not ask the user to title and describe every image by default. Image tiles are thumbnail-first, with representative selection, detail view, and delete affordances.
- The first image can be represented as the automatic representative image in mock UI. Real camera, gallery, file picker, upload, delete, and preview APIs are still not connected.
- Attachments are not representative images. Attachment examples should follow the existing WAFL/R2 allowed file shape and avoid unsupported mock examples such as `.txt` and `.xlsx`.
- Factory delivery memo is a field in the production card, not a memo file in the attachment list.
- Size/color should show only the selected unit at a time. The same table cell should not show `cm` and `inch` together.
- Size-add and color-add actions should be visible as mock entry points. Product-type size templates may be shown as editable suggestions, not final catalog policy.
- Fabric/accessory rows should remove `E`/`L` letter markers and use compact icon-like action clusters. Individual item photos are optional, not required for entry.
- Production flow defaults to six steps: order, material, cutting, process, inspection, and shipping. Flow statuses are simplified to `준비`, `작업중`, and `완료`.
- Cutting may be shown as a removable default step. Adding a process inside the process step is separate from adding a new flow step.
- Output/share keeps document-workbench direction while reducing repeated action controls.

Implementation boundary:

```text
No real upload, camera, file picker, share, PDF generation, delivery request, order mutation, API, DB, R2, Worker, push notification, drag, long-press, auth, or storage behavior is authorized by this real-use UX correction.
```

## 2.0.0-alpha.9 button/action cluster polish

`2.0.0-alpha.9` keeps the alpha.8 real-use structure and reduces action clutter in the `apps/mobile` mock.

Core correction:

- Fabric and accessory row actions move into a compact row-top cluster next to the status badge.
- Bottom repeated text buttons such as order request/order complete/information check are removed from fabric/accessory rows.
- One current-state primary action remains available per row as an icon-like action; completed/locked rows have no primary mutation affordance.
- Fabric and accessory add actions move to section-header `+` buttons.
- Inline edit is shown as field/row affordance, not a repeated edit button. Actual edit persistence is not implemented.
- Image/attachment shows a compact top action row for image upload, camera, sketch, and attachment mock entry points.
- Production flow keeps the six-step rail while detailed process rows are understood as items inside the process step.
- Process addition is the default visible add action; flow-step addition is described as advanced/exception mock direction.
- Output/share keeps the document workbench and aligns view/share/print/save placeholders with the compact icon action grammar.

Implementation boundary:

```text
No real upload, camera, file picker, share, PDF generation, delivery request, order mutation, inline edit save, API, DB, R2, Worker, push notification, drag, long-press, auth, or storage behavior is authorized by this button/action polish.
```

## 2.0.0-alpha.10 icon action interpretability polish

`2.0.0-alpha.10` keeps the alpha.9 compact action structure and makes repeated icons easier to understand.

Core correction:

- Image/attachment top actions show photo, camera, sketch, and attachment as compact captioned icon controls.
- Image tile detail/view is represented by pressing the thumbnail, so the tile action cluster does not carry an extra ambiguous view icon.
- Representative-image and delete controls remain separate from the thumbnail detail surface to avoid nested button patterns.
- Fabric and accessory row clusters use consistent compact labels for current action, lock/edit state, view, delete, and optional photo.
- Status-driven row behavior still exposes only one primary current action: order request, order completion, or information check.
- Size-add and color-add move beside the size-template and color-list areas they affect.
- The production-flow rail expands across available width more evenly while keeping the six baseline steps.

Implementation boundary:

```text
No real upload, camera, file picker, share, PDF generation, delivery request, order mutation, inline edit save, API, DB, R2, Worker, push notification, drag, long-press, auth, or storage behavior is authorized by this icon/action polish.
```

## 2.0.0-alpha.11 practical UX correction

`2.0.0-alpha.11` keeps the alpha.10 mock-only app and corrects production-card UX details that were still too sample-like.

Core correction:

- Image/attachment moves from multi-tile display to a one-image carousel/card with current index, left/right controls, representative state, and sibling representative/delete actions.
- The visible copy no longer explains thumbnail detail with "tap for detail"; the mock affordance remains available through the image surface and thumbnail strip.
- Attachment rows include file type, output include/exclude, and upload timestamp in `YYYY.MM.DD HH:mm:ss` format.
- Overview replaces ambiguous trading/production and short memo fields with participating company rows and a clearer next-check work card.
- Size/color adds gender, product category, unit selection, saved template load/save, `+ size`, and `+ body part` mock entry points.
- The size table removes the generic division column and shows size, chest, length, shoulder, and sleeve in the selected unit only.
- Color rows include small swatches derived from the color name without adding a color-picker library.
- Fabric and accessory rows use only `입력중`, `발주요청`, and `완료`, with request/delete, complete/cancel/delete, or read-only behavior respectively.
- The production-flow rail keeps the six baseline steps while improving centered spacing and current-step readability.

Implementation boundary:

```text
No real upload, camera, file picker, sketch, share, print, PDF generation, delivery request, order mutation, inline edit save, API, DB, R2, Worker, push notification, drag, long-press, auth, or storage behavior is authorized by this UX correction.
```
