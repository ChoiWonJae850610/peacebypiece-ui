# WAFL Mobile App Mock

Version: `2.0.0-alpha.6`

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

## Mock screen

The first screen contains a production-card list and a selected production card detail mock with these local tabs:

- 개요
- 이미지·첨부
- 사이즈·색상
- 원단
- 부자재
- 제작 플로우
- 출력·공유

The mock demonstrates a representative image placeholder, compact production summary, image/attachment rows, size/color rows, fabric/accessory quantity math, production factory/additional-process rows, output document rows, and delivery-request rows. Status-based material actions show only one current primary action. All buttons are placeholders for product direction only.

Image/attachment deepening, representative-image local-state rules, and camera/photo/attachment placeholder details are deferred to `2.0.0-alpha.7`.

## Commands

Run from this folder:

```bash
npm install
npm run typecheck
npm run expo:config
npm run start -- --web
```

Stop the Expo server after preview. Do not commit generated `.expo`, `node_modules`, or local Expo runtime output.
