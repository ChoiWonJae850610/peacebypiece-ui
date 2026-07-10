# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.14

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

Status: current.

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
