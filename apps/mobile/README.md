# WAFL Mobile App Mock

Version: `2.0.0-alpha.3`

This Expo React Native app is the App-first WAFL v2 mobile/tablet mock surface.

## Scope

- Expo project lives only under `apps/mobile`.
- SDK line: Expo SDK 55.
- Node decision: SDK 55 requires Node `20.19.x`; the owner environment `20.20.2` satisfies it.
- This app is mock-only and does not connect to WAFL DB, API, R2, PDF Worker, file upload, camera, share sheet, Google login, or Apple login.
- Root package files and root lockfiles are intentionally not part of this app scaffold.

## Mock screen

The first screen contains a production card with these local tabs:

- 개요
- 이미지
- 사이즈
- 원단
- 부자재
- 제작 흐름
- 출력

The mock demonstrates a representative image placeholder, top production summary, image/attachment rows, size/color rows, fabric/accessory quantity math, production process rows, output document rows, and delivery-request rows. All buttons are placeholders for product direction only.

## Commands

Run from this folder:

```bash
npm install
npm run typecheck
npm run expo:config
npm run start -- --web
```

Stop the Expo server after preview. Do not commit generated `.expo`, `node_modules`, or local Expo runtime output.
