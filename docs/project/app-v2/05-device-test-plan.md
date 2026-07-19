# WAFL v2 App Device Test Plan - 2.0.0-alpha.47

## 2.0.0-alpha.47 external developer auto-connect gate

- Reuse iOS Development Build number 1. With iPhone Tailscale connected over an external cellular path, launch WAFL without viewing the home PC, localhost:3000, or a connection code.
- Verify one boot session check, at most one Serve auto-connect after 401, Company A list/detail read, `QA_DRAFT_A` read-only display, background/re-entry, disconnect, no same-process immediate reconnect, and code-free cold-restart auto-connect.
- Verify the manual eight-character connection screen remains reachable only as fallback. Business PATCH/POST, lazy/file, R2/PDF/token, production, polling, and automatic retry remain zero.
- Owner-reported external cellular iPhone result: PASS for Tailscale connection, WAFL launch, code-free automatic connection, disconnect, explicit reconnect, close/reopen, and code-free cold restart, with no reported crash, red screen, or infinite loading. The owner did not separately exercise the manual fallback screen in this final run; its alpha.47 status remains source/contract regression PASS plus preserved alpha.44 physical-runtime evidence.
- Final teardown acceptance: three partial handoffs were preserved without broad termination; the exact marker-owned Serve was ultimately stopped, stale Expo PID reuse received no termination signal, and the final canonical stop reached `stopped` with Serve config empty, Funnel true count zero, Tailscale Running, and ports 3000/3100/8081 listener zero.

## 2.0.0-alpha.46 basic-info update result

- The installed iOS Development Build was reused. Owner-approved device QA targeted only retained synthetic `QA_DRAFT_A`: one explicit save changed product name, calendar due date, and total quantity; list/detail persistence and the saved state survived re-entry.
- DB, list API, detail API, and iPhone all show the same `2026-09-30` due date after the PostgreSQL `DATE` serialization correction. No additional save was used to prove the fix.
- Dirty background/re-entry retained the temporary input. Back navigation showed the unsaved warning, `계속 편집` preserved the input, and `변경사항 버리기` restored the retained saved value without PATCH.
- One existing issued/finalized card remained read-only. The separate old-version request returned `409 CONFLICT` with zero DB/event/receipt/version delta.
- Owner report: entire instructed iPhone QA PASS; automatic save/retry/polling, crash, red screen, and infinite loading were zero. Connection disconnect also passed.

## 2.0.0-alpha.45 ProductionCard core overview checkpoint

- Reuse the installed ATS-corrected iOS Development Build; no native rebuild is part of this gate.
- On iPhone, verify development connection, actual list, one recent and one legacy detail, actual product/quantity/due/status/amount/readiness content, actual count badges on visible disabled future tabs, list return, background/re-entry, and disconnect.
- Confirm mock product values, lazy-tab requests, representative image/file GET, automatic retry/polling, and mutation requests remain absent.
- Tablet acceptance is static split-view/responsive validation only. iPad mini, iPad Pro, and Galaxy Tab physical QA are explicitly not run in alpha.45.
- Treat functional/data correctness and visual conformity as separate gates. The final iPhone gate must verify the integrated one-sheet ProductionCard grammar and requires an explicit owner `디자인 최종 판정: PASS` before delivery.
- Verify that `기본 정보`, `문서 요약`, and `구성 요약` are absent from the overview, the product name wraps naturally beside the compact media frame, the lower body has no repeated system metadata, and bottom content is not clipped.
- Final physical-iPhone judgment: `PASS`. The owner approved the current ProductionCard overview as the pre-feature-expansion shell and found no issue that blocks feature use or information understanding. Detailed typography, spacing, representative-media, tab-density, and color polish remains a later gate after actual tabs and inputs are connected.
- The final run retained actual list/recent/legacy detail, disabled future tabs, list return, background/re-entry, and disconnect without crash, red screen, or infinite loading. iPad mini, iPad Pro, and Galaxy Tab actual QA remain not run; only the static tablet boundary passes in alpha.45.

## 2.0.0-alpha.44 real-data read-only iPhone checkpoint

- Reuse the installed ATS-corrected Development Build; do not reinstall or create another build.
- On the connected iPhone, enter one localhost-issued development code without sharing it in chat or logs.
- Confirm the displayed effective user/company matches the selected approved dev/test Company A context and is clearly labeled as a development read-only connection rather than production login.
- Confirm at least one actual WorkOrder list item, one UUID core-detail response, phone detail/back navigation, background/re-entry, and final disconnect.
- Confirm no mock card, remote representative-image request, lazy-tab request, automatic retry/polling, red screen, crash, blank screen, or infinite spinner.
- Confirm request/effect audit: exchange 1, post-exchange auth/me 1, list 1, detail per explicit selection, disconnect 1; WorkOrder writes, DB writes, R2 operations, PDF/token calls, and production access zero.
- Physical iPhone PASS is recorded: connection, effective Company A context, actual list, recent detail, the formerly failing legacy detail, back, background/re-entry, and disconnect succeeded with no crash, red screen, blank screen, or infinite spinner.
- The corrected legacy card no longer enters the detail-error state. `뒤로가기`, `목록으로`, and one-request-per-user-action `다시 시도` therefore pass source/contracts; their final device run is correctly recorded as runtime not applicable.
- Alpha.44 reaches `ALPHA44_MOBILE_REAL_DATA_READ_ONLY_SLICE_COMPLETE` only with the matching final Verify/Finish and canonical runner stop recorded in its evidence.

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

## 2.0.0-alpha.43 external-device QA

Static and transport-foundation completion do not equal official device QA. Expo Go is excluded from the official WAFL QA path and cannot satisfy a product/device gate. Official device QA begins only with an approved EAS Development Build after Apple Developer activation and the separately approved EAS/native setup.

The alpha.43 Tailscale/Cloudflare foundation has already proven Metro reachability, external `/v` headers, and internal-path blocking with mutation zero. The Development Build device run must preserve that split transport and verify:

- the Windows PC and iPhone/iPad/Galaxy Tab are online in the same tailnet, and the Development Build connects to Metro through the PC's Tailscale address rather than localhost or an ordinary LAN address;
- iPhone and iPad keep the Development Build bundle connected through Tailscale after a reload;
- Galaxy Tab uses the same private Metro transport, rotates portrait/landscape, and retains Korean rendering;
- the public `/v` shell loads over HTTPS without exposing a token in path/query/logs;
- an authenticated issued Preview is tested only with an already valid same-origin session and never through an anonymous bypass;
- internal routes return the external block response;
- the explicit stop script ends only the three runner-owned processes, after which both external transports are unavailable.

Token exchange, PDF/R2 GET, issued Preview DB reads, and actual embedded-token viewing remain separately approved runtime actions. Until the Development Build passes on physical devices, the canonical state remains `USER_DEVICE_QA_PENDING`. Earlier Expo Go or generic `exp://` connectivity may be retained as noncanonical transport evidence only.

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

## 2.0.0-alpha.16 tab/search/editability QA

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

- iPhone portrait: section tabs remain visible, centered, horizontally scrollable, and the active underline is centered under the selected label.
- iPhone portrait: bottom nav shows icon plus Korean labels only; no `C/I/D/S` shortcut letters remain.
- iPad mini portrait: 제작 카드 목록 search field is clearly placed under the list header.
- iPad Pro landscape: tablet tabs read as balanced within the content width, not left-pushed.
- Galaxy Tab portrait/landscape: editable affordance appears only on input/active rows and disappears on requested/completed rows.
- Galaxy Tab portrait/landscape: production rail line still ends at `출고`.

No real camera, picker, upload, share, print, PDF, DB, API, R2, Worker, order, delivery, search API, inline edit save, schema, migration, or production mutation evidence is expected for this mock-only version.

## 2.0.0-alpha.17 inline edit visual language QA

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

- iPhone portrait: 원단/부자재 rows should scan as summary rows, not repeated input boxes.
- iPhone portrait: only `입력중` rows should show subtle editable value emphasis.
- iPad mini portrait: material/accessory row height should remain compact enough to scan several rows.
- iPad Pro landscape: the production-flow rail should remain six steps, with no long base-step detail list below it.
- Galaxy Tab portrait/landscape: process-detail rows should read as meta summaries plus memo and amount, not small field boxes.

No real camera, picker, upload, share, print, PDF, DB, API, R2, Worker, order, delivery, search API, inline edit save, schema, migration, drag, long-press, or production mutation evidence is expected for this mock-only version.

## 2.0.0-alpha.18 A2Z app font QA

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

- iPhone portrait: small Korean labels should remain readable with A2Z.
- iPad mini portrait: tabs, bottom navigation, and button labels should not feel too heavy.
- iPad Pro landscape: amount, quantity, fabric, and accessory rows should preserve scan speed.
- Galaxy Tab portrait/landscape: Korean and numeric weight balance should feel stable after rotation.
- Expo Web on Windows: the mock should use A2Z rather than system font fallback.

No real camera, picker, upload, share, print, PDF, PDF font embedding, DB, API, R2, Worker, order, delivery, search API, inline edit save, schema, migration, drag, long-press, or production mutation evidence is expected for this mock-only version.

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
