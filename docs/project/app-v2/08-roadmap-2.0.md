# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.7

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

## Next planned checkpoints

### 2.0.0-alpha.7

Status: current.

- Strengthen the `apps/mobile` mock as a WAFL signature production-card UI.
- Add a compact production-flow progress rail for `발주 요청`, `자재 준비`, `재단`, `봉제/추가공정`, `검수/포장`, and `출고 준비`.
- Keep the progress rail as a handoff/readiness view, not a real-time production tracking system.
- Add an output/share document preview/workbench mock with document list, selected sheet preview, included information, delivery-request summary, and compact icon actions.
- Clean up icon-style action grammar without adding a new dependency.
- Fix the nested button risk by separating image tile containers from delete action controls.
- Preserve alpha.5 visual fidelity and alpha.6 `/ui` production-card flow alignment.
- Do not connect real DB, API, R2, PDF Worker, upload, camera, file picker, share, order, delivery, drag, or long-press behavior.
- Align app display version to `2.0.0-alpha.7`.

### 2.0.0-alpha.8

- Improve image and attachment mock details.
- Refine representative-image local-state rules and camera/photo/attachment placeholders.
- Keep all camera, picker, upload, share, and storage behavior mock-only.

### 2.0.0-alpha.9

- Mock size/color flow.
- Preserve inch fraction entry direction.

### 2.0.0-alpha.10

- Mock fabric and accessory card flows.

### 2.0.0-alpha.11

- Mock production flow.

### 2.0.0-alpha.12

- Mock output and share flow.

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
