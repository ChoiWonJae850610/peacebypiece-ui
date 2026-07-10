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

## 2.0.0-alpha.4 design theme and orientation QA

The alpha.4 mobile mock applies `동대문 제작 워크룸 / Dongdaemun Atelier Ops` as the first app visual foundation.

Static and preview checks:

- Expo config can be read after the app version changes to `2.0.0-alpha.4`.
- TypeScript check passes without adding dependencies.
- The first screen reads as a professional production workroom, not a portfolio, landing page, or generic sample app.
- Mobile portrait shows compact WAFL header actions, production-card list, selected card summary, horizontal tabs, and one-column tab content.
- Mobile normal production-card flow is portrait-first; mobile landscape remains not-supported for this general mock.
- Tablet portrait keeps a centered readable production-card surface without over-wide cards.
- Tablet landscape may show production-card list and selected detail side by side, but must not become a desktop admin three-panel interface.
- Status-driven fabric/accessory actions show only one primary action for the current state.
- No real camera, photo picker, file picker, login, upload, share, PDF, API, R2, Worker, DB, or production behavior is invoked.

Manual device QA remains required before product verification:

- iPhone portrait one-column review.
- iPad mini portrait review.
- iPad Pro landscape workbench review.
- Galaxy Tab portrait/landscape rotation review.
- Expo Web preview inspection with the local server stopped after review.

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

## 2.0.0-alpha.10 icon/action QA

The alpha.10 mobile mock requires review of action interpretability after the compact action polish:

- iPhone portrait: image top actions should clearly read as photo, camera, sketch, and attachment without oversized buttons.
- iPhone portrait: image thumbnail detail, representative selection, and delete should be understandable without nested-button behavior.
- iPad mini portrait: fabric/accessory row clusters should not wrap into confusing order, and delete should remain visually dangerous.
- iPad Pro landscape: the six-step production-flow rail should use the available width more evenly and should not look cramped.
- Galaxy Tab portrait/landscape: size-add and color-add chips should stay near their target sections after rotation.
- Expo Web preview should not show React nested button warnings for the thumbnail/action layout.

Manual device QA remains required before product verification. This checkpoint still does not invoke real camera, file picker, upload, share, PDF, API, DB, R2, Worker, order, delivery, or push behavior.

## 2.0.0-alpha.11 UX correction QA

The alpha.11 mobile mock requires review of the corrected production-card UX:

- iPhone portrait: image/attachment should show one carousel image at a time, clear `n / total` index, clear representative state, and separate representative/delete controls.
- iPhone portrait: attachment rows should show file type, output include/exclude, and upload timestamp without unsupported file examples.
- iPhone portrait: overview should show participating companies and a work-like next-check card, not generic help text or a short memo.
- iPad mini portrait: size/color should keep gender, category, unit, template load/save, table actions, and color swatches readable without horizontal overflow beyond the intended measurement table.
- iPad Pro landscape: fabric/accessory rows should keep the simplified status/action flow and should not show request and complete at the same time.
- Galaxy Tab portrait/landscape: the six-step production rail should remain centered, readable, and stable after rotation.
- Expo Web preview should not show React nested button warnings for carousel/image/action controls.

Manual device QA remains required before product verification. This checkpoint still does not invoke real camera, file picker, upload, share, PDF, API, DB, R2, Worker, order, delivery, sketch, or push behavior.

## 2.0.0-alpha.14 UI polish and work-order CTA QA

Automatic checks:

- `apps/mobile npm run typecheck`
- `apps/mobile npm run expo:config`
- root `npx tsc --noEmit`
- root `npm run build`
- targeted eslint for `apps/mobile/components/ProductionCardMock.tsx`
- `git diff --check`
- `node tests/unicode-encoding-contract.mjs`
- approved workflow verify

Manual device QA remains owner confirmation:

- iPhone portrait: image/attachment icons, representative crown, no decorative hanger in image preview, and `작지 발주` CTA readability.
- iPad mini portrait: size/color selector widths stay stable while toggling `cm`/`inch`.
- iPad Pro landscape: fabric/accessory action buttons are distinct from status badges and remain on the amount line.
- Galaxy Tab portrait/landscape: production rail ends at `출고`, current step is emphasized, and post-CTA `발주 완료 / 자재 작업중` mock state is understandable.

No real camera, picker, upload, share, print, PDF, DB, API, R2, Worker, order, delivery, schema, migration, or production mutation evidence is expected for this mock-only version.

## 2.0.0-alpha.15 icon library QA

Automatic checks:

- `apps/mobile npm run typecheck`
- `apps/mobile npm run expo:config`
- root `npx tsc --noEmit`
- root `npm run build`
- targeted eslint for `apps/mobile/components/ProductionCardMock.tsx`
- `git diff --check`
- `node tests/unicode-encoding-contract.mjs`
- approved workflow verify

Manual device QA remains owner confirmation:

- iPhone portrait: Lucide icons read as photo, camera, sketch, attachment, crown, material order, cancel, complete, delete, and `작지 발주`.
- iPad mini portrait: icon + label buttons wrap without making cards too tall.
- iPad Pro landscape: material/accessory action buttons remain distinct from status badges.
- Galaxy Tab portrait/landscape: production rail line ends at `출고` after rotation.

No real camera, picker, upload, share, print, PDF, DB, API, R2, Worker, order, delivery, schema, migration, or production mutation evidence is expected for this mock-only version.

## 2.0.0-alpha.12 alpha.11 UX follow-up QA

The alpha.12 mobile mock requires review of the follow-up corrections:

- iPhone portrait: image carousel should keep the image, navigation, current index, and index pills centered and visually stable.
- iPhone portrait: image titles should read as optional, with fallback labels when title data is empty.
- iPhone portrait: photo/camera/sketch/attachment actions should be understandable without emoji-like glyphs.
- iPad mini portrait: gender/category/unit should read as current-value selectors, not a large settings chip pile.
- iPad mini portrait: saved size-template examples should not be listed by default.
- iPad Pro landscape: material/accessory status labels should stay aligned across rows, with actions consistently placed.
- Galaxy Tab portrait/landscape: production-flow dot, label, and status should stay centered on one axis after rotation.
- Expo Web preview should not show React nested button warnings for carousel, selector, or material-row controls.

Manual device QA remains required before product verification. This checkpoint still does not invoke real camera, file picker, upload, share, PDF, API, DB, R2, Worker, order, delivery, sketch, or push behavior.

## 2.0.0-alpha.13 alpha.12 UX follow-up QA

The alpha.13 mobile mock requires review of the under-applied alpha.12 corrections:

- iPhone portrait: photo/camera/sketch/attachment action icons should read as their real meaning without emoji-like glyphs.
- iPhone portrait: image memo should not be visible by default, and fallback image labels should not feel like required titles.
- iPad mini portrait: gender/category/unit should appear as three compact current-value selectors, not as always-visible option piles.
- iPad mini portrait: size load/save and add actions should stay on one top action level without making the card tall.
- iPad Pro landscape: fabric/accessory actions should align with unit, price, and amount on the same visual line.
- Galaxy Tab portrait/landscape: production-flow rail should appear as one continuous line with centered dots, labels, and statuses.
- Expo Web preview should not show React nested button warnings for carousel, selector, material-row, or production-rail controls.

Manual device QA remains required before product verification. This checkpoint still does not invoke real camera, file picker, upload, share, PDF, API, DB, R2, Worker, order, delivery, sketch, or push behavior.
