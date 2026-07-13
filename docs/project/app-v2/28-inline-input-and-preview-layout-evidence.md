# WAFL v2 Alpha.31 Inline Input and Preview Layout Evidence

## Result

Status: `LEVEL_4_PRODUCT_VERIFIED` after the localhost evidence set below passes.

Alpha.31 unifies the mobile mock's factory-facing edit grammar and restructures the issued 작업지시서 Preview source layout. It does not add a persistence path or document lifecycle.

## Mobile inline input

- `apps/mobile/components/InlineEditableFields.tsx`
  - `InlineEditableValue`: short values switch to a 16px input in the same row.
  - `ExpandableInlineNote`: long notes show at most two lines and expand in place.
  - `ReadOnlyInlineValue`: issued/completed/locked values render as plain text without a dotted underline.
- `apps/mobile/components/ProductionCardMock.tsx`
  - 원단·부자재 사용 부위 and memo use the shared fields.
  - 공정 적용 부위, 적용 색상·대상, 작업 메모 use the shared fields.
  - 공장 전달 메모 uses the long-note pattern.
  - `compactInstructionInput`, duplicate summary/input rendering, and boxed factory memo input are removed.
- Values are local React state only. There is no mobile v2 API mutation or persistence.

## Preview renderer

- `IssuedWorkOrderPreview.tsx` owns authenticated API loading, error/loading state, navigation, and print action.
- `IssuedWorkOrderDocument.tsx` is the pure document renderer used by actual issued Preview and the deterministic sample.
- Page 1 is A4 landscape with a 58/42 product-sketch/document-information split.
- Factory delivery memo and the pre-existing memo are preserved under one `공장 전달 메모` heading; no separate instruction box is emitted.
- Revision display uses `0차`, `1차`, and so on. The immutable document number continues to display its `R0` suffix.
- Actual Preview shows quantity without inventing a unit when the DTO has no order-level unit. The sample explicitly owns `장` and displays `144장`.
- Continuation pages are A4 portrait. Fabric, accessory, color-size, size specification, and process blocks are packed by bounded row groups rather than one forced page per section.
- Table headers repeat in print, section headings stay with their table, and rows do not split.
- The renderer does not show inventory usage, order quantity, unit price, amount, internal status, raw IDs, tokens, or storage keys.

## Deterministic sample

- Route: `/dev/workorder-preview-sample`.
- Guard: `assertLocalOnlyRouteHost()`; production and preview hosts receive the canonical not-found boundary.
- Source: `lib/internal/samples/issuedWorkOrderPreviewSample.ts`.
- Asset: `public/dev-samples/linen-round-dress-sketch.svg`, authored for this repository with no external download.
- Product: `리넨 라운드 원피스`, 144장, 0차, document number ending in `R0`.
- Matrix totals are IVORY 32, NAVY 48, BLACK 64; size totals are 36, 72, 36; grand total is 144.
- Fabrics 2, accessories 4, processes 4. The sample does not call tenant APIs or use business data.

## Product evidence

The final verification record must include:

- Desktop screenshot of landscape cover and portrait continuation pages.
- Tablet landscape and portrait screenshots.
- Mobile screenshot proving readable one-column fallback and horizontal table handling.
- Print-media screenshot or PDF preview evidence proving named landscape/portrait pages.
- Inline-edit interaction evidence for short value and long note, plus read-only locked state.
- Locator checks for product name, `0차`, `144장`, document number `R0`, memo, material/process fields, and matrix total 144.
- Browser console error count 0 and unexpected failed request count 0.

### Localhost QA result

Status: `LEVEL_4_PRODUCT_VERIFIED`.

- Sample route: localhost `200`; `Host: www.wafl.co.kr` `404`.
- Desktop `1440x1000`: cover `1123x794`, continuation pages `794x1123`, document overflow `0`.
- Tablet landscape `1024x768`: page widths `961/794/794`, viewport overflow `0`.
- Tablet portrait `768x1024`: page widths `705/705/705`, viewport overflow `0`.
- Mobile `390x844`: one-column cover and page widths `375/375/375`, viewport overflow `0`; wide size tables retain their internal horizontal scroll boundary.
- Locator/text checks PASS: product name, `0차`, `144장`, `R0`, both memo paragraphs, fabric/accessory/process fields, and matrix `144`.
- Short inline input: one `INPUT`, font size `16px`, height `28px`, bottom border `2px` in the original value row.
- Long inline note: one `TEXTAREA`, font size `16px`, height `74px`, bottom border `2px` in the original note row.
- Completed-row edit affordance: usage-area buttons `0`, memo buttons `0`.
- Sample/Expo console warning and error count: `0/0`.
- Named print rules observed in the browser CSSOM: `@page cover { size: A4 landscape; }`, `@page content { size: A4 portrait; }`, and print-only toolbar suppression/repeated table-header rules.
- Unexpected failed local requests: `0`; Next and Expo local pages loaded successfully and the repository-owned SVG rendered.

Excluded QA artifacts:

- `artifacts/alpha31/preview-desktop-cover.png`
- `artifacts/alpha31/preview-tablet-landscape-1024x768.png`
- `artifacts/alpha31/preview-tablet-portrait-768x1024.png`
- `artifacts/alpha31/preview-mobile-390x844.png`
- `artifacts/alpha31/preview-content-page-2.png`
- `artifacts/alpha31/preview-content-page-3.png`
- `artifacts/alpha31/mobile-inline-short-edit.png`
- `artifacts/alpha31/mobile-inline-long-note-edit.png`

## Mutation and dependency status

- DB migration/write: false
- API implementation/mutation: false
- Dev/test or business data mutation: false
- R2/Worker/PDF binary/QR/production access: false
- Root package/lockfile/dependency change: false

## Next action

Alpha.32 may begin generated-document/PDF/QR/R2 lifecycle only under a separate explicit work order and mutation approval.
