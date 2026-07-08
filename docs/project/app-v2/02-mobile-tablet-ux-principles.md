# WAFL v2 Mobile and Tablet UX Principles - 2.0.0-alpha.1

## Core structure

The production card is organized around seven app-first sections:

1. 개요
2. 이미지·첨부
3. 사이즈·컬러
4. 원단
5. 부자재
6. 제작 플로우
7. 출력·공유

These sections come from the latest `/ui` design baseline, but the customer-facing implementation target is now mobile/tablet app UX.

## iPhone

iPhone should prioritize:

- one current production card,
- camera and photo selection,
- bottom sheets,
- compact section navigation,
- share actions,
- thumb-friendly controls.

The default screen should not look like a compressed PC table.

## iPad mini

iPad mini should prioritize:

- tablet portrait review,
- drawer-style product selection,
- overflow controls that do not crowd the header,
- readable size/color verification.

## iPad Pro

iPad Pro should prioritize:

- tablet landscape production-card authoring,
- side-by-side review where useful,
- multi-touch image/document checking,
- comfortable production flow and output/share review.

## Galaxy Tab

Galaxy Tab should prioritize:

- Android tablet behavior,
- file picker behavior,
- camera permission behavior,
- Korean input behavior,
- orientation changes.

## Action grammar

Mobile and tablet controls should prefer:

- icon-first controls for obvious repeated actions,
- tooltips or accessibility labels for icon-only controls,
- bottom-sheet confirmation for risky actions,
- inline edit where the row context is clear,
- delete icons and compact action clusters instead of large duplicate buttons.

Do not expose large bottom button stacks or repeated copy-heavy buttons on default production-card screens.

## Reordering and movement

Production process ordering should use drag or long-press style UX where it is natural for the device.

The app may use explicit fallback controls for accessibility, but the default visual direction should not make process movement look like a PC-only table operation.
