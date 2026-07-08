# WAFL Mobile App Skeleton

Version: `2.0.0-alpha.2`

This is the first Expo React Native skeleton for the App-first WAFL v2 line.

## Scope

- Expo project lives only under `apps/mobile`.
- SDK line: Expo SDK 55.
- Node decision: SDK 55 requires Node `20.19.x`; the owner environment `20.20.2` satisfies it.
- This app is mock-only and does not connect to WAFL DB, API, R2, PDF Worker, file upload, camera, share sheet, Google login, or Apple login.

## Mock screen

The first screen contains a 제작 카드 with these local tabs:

- 개요
- 이미지·첨부
- 사이즈·색상
- 원단
- 부자재
- 제작 플로우
- 출력·공유

All buttons are placeholders for product direction only.

## Commands

Run from this folder:

```bash
npm install
npm run typecheck
npm run expo:config
npm run start
```

Do not create a root workspace or change the repository root package files for this skeleton.
