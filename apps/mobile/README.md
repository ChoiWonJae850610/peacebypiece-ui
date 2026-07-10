# WAFL Mobile App Mock

Version: `2.0.0-alpha.14`

This Expo React Native app is the App-first WAFL v2 mobile/tablet mock surface.

Current visual foundation:

```text
동대문 제작 워크룸 / Dongdaemun Atelier Ops
```

## Scope

- Expo project lives only under `apps/mobile`.
- SDK line: Expo SDK 55.
- Node decision: SDK 55 requires Node `20.19.x`; the owner environment `20.20.2` satisfies it.
- This app is mock-only and does not connect to WAFL DB, API, R2, PDF Worker, file upload, camera, share sheet, Google login, or Apple login.
- Root package files and root lockfiles are intentionally not part of this app scaffold.
- No font files, external images, or new dependencies are added in this visual foundation correction.
- Normal mobile production-card screens are portrait-first. Tablet portrait and landscape are supported by responsive layout. The future sketch module may be the mobile-landscape exception.
- `2.0.0-alpha.5` removes the runtime theme explanation strip, reduces boxed sample-app feeling, and uses built-in `View`/`Text` garment and swatch placeholders instead of external assets.
- `2.0.0-alpha.6` aligns the mock back to the `/ui` production-card flow: next-check panel, `제작 공장 + 추가 공정 + 공장 전달 준비`, document rows with included information first, delivery-request rows, and user-facing `사이즈·색상` wording.
- `2.0.0-alpha.7` adds WAFL signature UI corrections: a production-flow progress rail, output/share document workbench mock, dependency-free icon action cleanup, and nested button structure cleanup.
- `2.0.0-alpha.8` corrects real-use UX fit: customer-facing IDs are hidden, image cards remove per-image title/description burden, attachments use existing image/PDF allowed-extension mock examples, factory memo is a field, size units show one selected unit, material/accessory action clusters remove E/L letters, and production flow uses six baseline steps with simple states.
- `2.0.0-alpha.9` polishes button/action grammar: fabric/accessory bottom text buttons move into compact row action clusters, add actions move to section-header `+` icons, image/attachment action row is clarified, production-flow rail/process grouping is tightened, and output/share actions stay compact.
- `2.0.0-alpha.10` polishes icon interpretability: image actions show photo/camera/sketch/attachment captions, thumbnail detail is attached to the image itself, material/accessory actions use consistent compact labels, size/color add chips sit beside their target areas, and the six-step production rail uses the available width more evenly.
- `2.0.0-alpha.11` corrects practical UX friction: image review uses a carousel/card with index and representative state, attachments show upload time, overview labels focus on participating companies, size/color adds gender/category/template workbench controls, material/accessory status flow is simplified, and the production rail spacing is centered.
- `2.0.0-alpha.12` follows up on alpha.11 UX feedback: carousel/index pills are centered, image titles are optional with fallback labels, size/color uses current-value selectors, saved templates are hidden from the default screen, material status/action alignment is fixed, order action wording is clearer, and the production rail axis is tightened.
- `2.0.0-alpha.13` corrects alpha.12 items that still felt under-applied: image actions use dependency-free visual helper icons, memo stays hidden by default, size/color shows only current-value selector buttons, fabric/accessory actions sit on the amount line, and the production rail becomes one continuous line with centered dots.
- `2.0.0-alpha.14` polishes the alpha.13 mock: image/action icons read more directly, size/color selectors keep stable widths, material action buttons are visually separated from status badges, the production rail highlights the current step, and a local mock `작지 발주` confirmation CTA is added without real output/order integration.

## Mock screen

The first screen contains a production-card list and a selected production card detail mock with these local tabs:

- 개요
- 이미지·첨부
- 사이즈·색상
- 원단
- 부자재
- 제작 플로우
- 출력·공유

The mock demonstrates a representative image placeholder, compact production summary, carousel-based image review, optional image titles with small fallback labels, allowed-extension attachment rows with upload time, compact fixed-width current-value size/color selectors, cm/inch switching, fabric/accessory quantity math, fixed-position status labels, amount-line status-based row actions, a local mock `작지 발주` confirmation CTA, continuous production-flow progress rail, process-step detail rows, output document workbench, and delivery-request rows. Status-based material actions show only the actions allowed for the current status. All buttons are placeholders for product direction only.

Further field feedback on the alpha.14 UX correction can continue in `2.0.0-alpha.15`; real camera/photo/file picker/upload/share/PDF/order behavior remains deferred.

## Commands

Run from this folder:

```bash
npm install
npm run typecheck
npm run expo:config
npm run start -- --web
```

Stop the Expo server after preview. Do not commit generated `.expo`, `node_modules`, or local Expo runtime output.
