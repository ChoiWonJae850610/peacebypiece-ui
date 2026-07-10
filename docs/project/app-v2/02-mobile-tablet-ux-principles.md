# WAFL v2 Mobile and Tablet UX Principles - 2.0.0-alpha.1

## 2.0.0-alpha.4 app design theme direction

`2.0.0-alpha.4` applies App Design Theme v1:

```text
동대문 제작 워크룸 / Dongdaemun Atelier Ops
```

The app should feel like a professional Korean apparel production workroom: dense, fast, deadline-aware, and material-aware. It should not feel like a portfolio, landing page, generic sample app, or oversized-card design exercise.

Normal mobile production-card screens are portrait-first. Mobile landscape is not the default target for ordinary production-card work. The future drawing/sketch module may allow mobile landscape because visual drawing and review are a different interaction mode.

Tablet screens must support portrait and landscape. Tablet layouts should expand the production-card workspace with centered width or useful side-by-side review, but they must not become a squeezed PC admin three-panel interface.

## Core structure

The production card is organized around seven app-first sections:

1. 개요
2. 이미지·첨부
3. 사이즈·색상
4. 원단
5. 부자재
6. 제작 플로우
7. 출력·공유

These sections come from the latest `/ui` design baseline, but the customer-facing implementation target is now mobile/tablet app UX.

## iPhone

iPhone should prioritize:

- one current production card,
- camera and photo selection,
- bottom sheets,
- compact section navigation,
- share actions,
- thumb-friendly controls.

The default screen should not look like a compressed PC table.

## iPad mini

iPad mini should prioritize:

- tablet portrait review,
- drawer-style product selection,
- overflow controls that do not crowd the header,
- readable size/color verification.

## iPad Pro

iPad Pro should prioritize:

- tablet landscape production-card authoring,
- side-by-side review where useful,
- multi-touch image/document checking,
- comfortable production flow and output/share review.

## Galaxy Tab

Galaxy Tab should prioritize:

- Android tablet behavior,
- file picker behavior,
- camera permission behavior,
- Korean input behavior,
- orientation changes.

## Action grammar

Mobile and tablet controls should prefer:

- icon-first controls for obvious repeated actions,
- tooltips or accessibility labels for icon-only controls,
- bottom-sheet confirmation for risky actions,
- inline edit where the row context is clear,
- delete icons and compact action clusters instead of large duplicate buttons.

Do not expose large bottom button stacks or repeated copy-heavy buttons on default production-card screens.

## 2.0.0-alpha.8 real-use correction

The alpha.8 mobile mock correction applies these real-use UX principles:

- Customer-facing default surfaces should not expose internal production-card IDs.
- Image tiles should stay thumbnail-first and avoid per-image title/description input burden.
- Representative-image controls, detail-view affordance, and delete affordance should be compact and separate.
- Attachments should stay separate from images and use only allowed image/PDF mock examples.
- Factory delivery memo should be a production-card field, not an uploaded memo file.
- Size/color unit selection should display only the selected unit at a time.
- Size-add and color-add actions should be visible without making mobile controls too tall.
- Product-type size templates are suggestions, not fixed catalog policy.
- Fabric/accessory row actions should use compact icon-like clusters instead of letter badges.
- Fabric/accessory photos are optional and must not block default entry.
- Production flow should start from six baseline steps and simple states: `준비`, `작업중`, `완료`.
- Output/share should reduce repeated actions and keep row/workbench clarity.

This correction remains mock-only and does not connect camera, file picker, upload, share, PDF generation, API, DB, R2, Worker, push notification, order, delivery, drag, or long-press behavior.

## 2.0.0-alpha.9 button and action cluster polish

The alpha.9 mobile mock correction tightens button/action grammar:

- Fabric and accessory cards should not repeat large text primary buttons at the bottom of every row.
- The status badge, current-state primary action icon, lock/read state, view, delete, and optional photo affordance belong in one compact row-top action cluster.
- The current-state primary action remains one item only: order request, order completion, or information check.
- Completed or locked rows should not show editable primary actions. They show badge/read-only/locked direction.
- Add actions for fabric and accessory sections should live near the section header as compact `+` icon buttons.
- Image/attachment should show compact entry points for image upload, camera, sketch, and attachment without connecting real picker/camera/upload behavior.
- Inline-edit direction is represented by editable-looking field affordance, not repeated edit buttons on every row.
- Production-flow rail spacing should be regular, with the six baseline steps kept as the top rail and detailed process rows grouped inside the process step.
- Flow-step addition is advanced/exception direction; the default visible `+` action should emphasize process addition.
- Output/share icon rows should share the same compact visual grammar as other mock actions.

This correction remains mock-only and does not connect real inline edit save, camera, file picker, upload, share, PDF generation, API, DB, R2, Worker, push notification, order, delivery, drag, or long-press behavior.

## 2.0.0-alpha.10 icon action interpretability polish

The alpha.10 mobile mock correction keeps the alpha.9 action-density direction and improves whether repeated icons are understandable at production speed:

- Image/attachment top actions should read as photo, camera, sketch, and attachment entry points. Short captions are allowed when pure symbols are ambiguous.
- Thumbnail detail/view should be attached to the thumbnail surface itself, while representative and delete actions remain separate sibling controls.
- Fabric and accessory action clusters should use consistent compact labels for current-state action, lock/edit state, view, delete, and optional photo selection.
- Delete must remain visually red/danger-toned and should not be confused with close, cancel, or dismiss.
- Size-add and color-add controls should sit beside the size-template and color-list areas they affect, not as detached large buttons.
- The six-step production-flow rail should use available tablet/phone width evenly before falling back to horizontal scrolling.
- Button-like controls must not be nested inside another button-like control.

This correction remains mock-only and does not connect real inline edit save, camera, file picker, upload, share, PDF generation, API, DB, R2, Worker, push notification, order, delivery, drag, or long-press behavior.

## Reordering and movement

Production process ordering should use drag or long-press style UX where it is natural for the device.

The app may use explicit fallback controls for accessibility, but the default visual direction should not make process movement look like a PC-only table operation.

## 2.0.0-alpha.11 practical UX correction

The alpha.11 mobile mock correction keeps the alpha.10 compact grammar and removes practical friction from field feedback:

- Image/attachment should not default to an uneven grid when there are many images. Use a one-image carousel/card, current index, clear representative state, and sibling representative/delete actions.
- Attachment rows should show upload time in `YYYY.MM.DD HH:mm:ss` format with file type and output include/exclude state.
- Overview should avoid ambiguous labels such as trading/production and should not put a generic short memo into the main summary. Participating companies and next-check work should be clearer.
- Size/color starts with gender, product category, unit, and saved template controls. The size table should show one selected unit and business-readable columns: size, chest, length, shoulder, sleeve.
- Color rows should include small visual swatches without adding a color-picker dependency.
- Fabric and accessory status flow is limited to `입력중`, `발주요청`, and `완료`. Do not show request and complete actions at the same time.
- Completed material rows are read-only, request rows are locked until cancelled in the mock, and input rows remain editable-looking.
- The six-step production rail should be centered and readable on phone/tablet widths before horizontal scrolling is needed.

This correction remains mock-only and does not connect real inline edit save, camera, file picker, upload, share, PDF generation, API, DB, R2, Worker, push notification, order, delivery, sketch, drag, or long-press behavior.

## 2.0.0-alpha.12 alpha.11 UX follow-up correction

The alpha.12 mobile mock correction tightens the alpha.11 direction before output/share deepening:

- Image carousel contents, navigation, `n / total`, and index pills should read as one centered carousel system.
- Image and sketch titles are optional. When no title exists, use safe fallback labels instead of forcing title input.
- Photo, camera, sketch, and attachment actions need text labels and dependency-free helper symbols; avoid emoji-like or send-like symbols that confuse the work meaning.
- Size/color should show current values first through compact selectors. Do not expose all gender/category/unit choices as one large settings chip pile.
- Saved size-template lists should not be shown on the default production-card screen. Show the current configuration and expose load/save as mock entry points.
- Size table management and direct table editing actions should be visually separated.
- Fabric/accessory status text stays in a consistent position; color or border is only secondary support.
- Order actions should say `발주요청` clearly and should not rely on send/mail/airplane-like icons.
- Production-flow rail dot, step label, and status should share one center axis.

This correction remains mock-only and does not connect real inline edit save, camera, file picker, upload, share, PDF generation, API, DB, R2, Worker, push notification, order, delivery, sketch, drag, or long-press behavior.

## 2.0.0-alpha.13 alpha.12 UX follow-up correction

The alpha.13 mobile mock correction makes the alpha.12 rules visible in the actual screen:

- Image/attachment actions should use dependency-free visual helper icons plus labels, not ambiguous text symbols.
- The carousel should keep image, title area, counter, and index controls visually centered.
- Image memo is not shown by default; title fallback labels stay small and non-mandatory.
- Size/color defaults show only current-value selector buttons such as `공용`, `상의`, and `cm`.
- Material/accessory actions sit with unit, price, and amount information so repeated rows stay compact.
- The six-step production rail is one continuous line with dots placed on top, not separate connector fragments.

This correction remains mock-only and does not connect real inline edit save, camera, file picker, upload, share, PDF generation, API, DB, R2, Worker, push notification, order, delivery, sketch, drag, or long-press behavior.
