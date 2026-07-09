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

## Reordering and movement

Production process ordering should use drag or long-press style UX where it is natural for the device.

The app may use explicit fallback controls for accessibility, but the default visual direction should not make process movement look like a PC-only table operation.
