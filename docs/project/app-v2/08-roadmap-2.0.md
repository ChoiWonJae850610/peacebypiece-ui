# WAFL v2 App-first Roadmap 2.0 - 2.0.0-alpha.4

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

Status: current.

- Add `docs/project/app-v2/11-app-design-theme-v1.md`.
- Apply App Design Theme v1: `동대문 제작 워크룸 / Dongdaemun Atelier Ops`.
- Redesign `apps/mobile` mock visual foundation toward a dense Korean apparel production workroom.
- Use warm paper/off-white base, deep navy primary, brick orange/thread amber production accents, and deep olive completion status.
- Keep normal mobile production-card screens portrait-first.
- Keep tablet portrait/landscape support without turning the app into a desktop admin three-panel layout.
- Keep actions icon-first, and expose only one current primary action for fabric/accessory status rows.
- Do not add new dependencies, font files, external image assets, real camera/file/upload/share/PDF/API/DB/R2/Worker behavior, or root package metadata changes.
- Align app display version to `2.0.0-alpha.4`.

## Next planned checkpoints

### 2.0.0-alpha.5

- Start only after alpha.4 is committed and reviewed.
- Improve image and attachment mock details.
- Refine representative-image local-state rules and camera/photo/attachment placeholders.

### 2.0.0-alpha.6

- Mock size/color flow.
- Preserve inch fraction entry direction.

### 2.0.0-alpha.7

- Mock fabric and accessory card flows.

### 2.0.0-alpha.8

- Mock production flow.

### 2.0.0-alpha.9

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
