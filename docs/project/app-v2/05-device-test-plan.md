# WAFL v2 App Device Test Plan - 2.0.0-alpha.1

## Purpose

This document defines the first App-first device QA matrix. It is a planning document only and does not implement tests.

## iPhone

Verify:

- mobile one-card production flow,
- camera access,
- image selection,
- bottom sheet behavior,
- login,
- share flow.

## iPad mini

Verify:

- tablet portrait layout,
- product selector drawer,
- overflow controls,
- size/color table readability.

## iPad Pro

Verify:

- tablet landscape layout,
- production-card authoring,
- multi-touch image review,
- document/output review.

## Galaxy Tab

Verify:

- Android tablet layout,
- file picker,
- camera permission,
- Korean input,
- screen rotation.

## Shared QA requirements

For every app feature that edits or shares production data, later implementation must verify:

- Korean input stability,
- numeric input behavior,
- modal/bottom-sheet close behavior,
- orientation recovery,
- image/file permission prompts,
- share-sheet behavior where available,
- no raw R2/Worker/internal token exposure.

This version is documentation only, so no device QA evidence is required yet.

## 2.0.0-alpha.2 skeleton QA

The first `apps/mobile` skeleton requires static verification first:

- Expo config can be read.
- TypeScript check passes when dependencies are installed.
- The mock 제작 카드 shows a mobile one-column flow.
- Tablet widths keep a stable centered card width instead of stretching into a desktop web layout.
- Tabs move between 개요, 이미지·첨부, 사이즈·색상, 원단, 부자재, 제작 플로우, 출력·공유.
- No real camera, photo picker, file picker, login, upload, share, PDF, API, R2, Worker, or DB behavior is invoked.

Manual device QA remains required before product verification:

- iPhone portrait one-column review.
- iPad mini portrait review.
- iPad Pro landscape review.
- Galaxy Tab rotation review.
- Korean text and numeric input checks when editable fields are introduced.

## 2.0.0-alpha.3 production-card mock QA

The alpha.3 Expo app mock requires these static and preview checks:

- Expo config can be read after the app version changes to `2.0.0-alpha.3`.
- TypeScript check passes without adding dependencies.
- The first screen shows WAFL version, representative-image placeholder, product title, quantity, due date, production state, and next recommendation.
- iPhone-width layout remains a one-column production-card flow.
- Tablet widths use a stable centered maximum width and do not become a desktop three-column screen.
- Tabs expose overview, image/attachment, size/color, fabric, accessory, production flow, and output/share sections.
- Fabric and accessory rows show required quantity, allowance/loss, stock use, order quantity, unit price, amount, state, and mock next action.
- Output/share shows document rows, included attachments, representative image thumbnail, and delivery-request rows without invoking PDF/share/file APIs.
- No real camera, photo picker, file picker, login, upload, share, PDF, API, R2, Worker, DB, or production behavior is invoked.

Manual device QA remains required before product verification:

- iPhone portrait one-column review.
- iPad mini portrait review.
- iPad Pro landscape centered-width review.
- Galaxy Tab portrait/landscape rotation review.
- Expo Web preview inspection with the local server stopped after review.
