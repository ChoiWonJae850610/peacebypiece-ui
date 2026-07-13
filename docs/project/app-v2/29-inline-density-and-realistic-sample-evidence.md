# WAFL v2 Alpha.32 Inline Density and Realistic Sample Evidence

## Result

Status: `LEVEL_4_PRODUCT_VERIFIED`.

- Baseline HEAD: `7957595383cd5378f25fe2cfdcfb964ca31a4f12`.
- Result HEAD: the final alpha.32 commit recorded in the matching repo-state artifact.
- APP_VERSION: `2.0.0-alpha.32`.

Alpha.32 keeps the alpha.31 mock-only boundary while making compact factory inputs behave like existing summary rows and making the deterministic Preview sample useful for visual review. It does not add document lifecycle, DB/API persistence, R2, Worker, QR, or production access.

## Compact inline editing

- `InlineEditableValue` is the only editable field grammar for material usage area, material memo, process memo, and factory memo.
- Label and value typography are shared with compact summary rows through `compactFieldTypography.ts`.
- Edit mode stays in the same 22px row and reuses the same compact 12px/17px value typography. It never expands the parent card.
- Enter and blur can complete one edit only once. Escape restores the previous value and the following blur cannot recommit it.
- Normalized unchanged values do not invoke the optional commit callback.
- Issued, completed, locked, and unauthorized values remain plain read-only text without an edit affordance.
- Mobile values remain local mock state. No v2 Command or persistence path is connected.

## Process display policy

- Mobile no longer renders separate `적용 부위` or `적용 색상·대상` rows.
- The issued Preview no longer renders separate columns for those fields.
- Existing `application_area` and `application_color_target` DB/API fields remain unchanged for compatibility.
- `formatProcessInstruction()` merges existing values into `작업 메모` for display only, in the order `적용 부위 / 적용 대상 / 메모`.
- The merge is not written back to the API or DB.

## Deterministic realistic sample

- Route: `/dev/workorder-preview-sample`.
- Guard: `assertLocalOnlyRouteHost()`; production and preview hosts keep the canonical not-found boundary.
- The root current-user provider skips its automatic auth lookup on this exact localhost-only route, so unattended sample QA produces no tenant/auth API request or 401 console noise. Other routes retain the existing auth refresh behavior.
- Product: `리넨 라운드 셔츠 원피스`, 144장, 26FW, due 2026-08-15.
- Repository-owned asset: `public/dev-samples/linen-round-dress-sketch.svg` with front/back garment lines and IVORY/NAVY/BLACK chips. It has no external asset reference.
- Fabrics: linen-rayon shell and poly lining with Korean suppliers, colors, required quantity, allowance, unit, usage area, and memo.
- Accessories: shell buttons, care label, hang-tag cord, and poly bag with Korean suppliers and factory-facing descriptions.
- Color-size matrix: IVORY 32, NAVY 48, BLACK 64; size totals 36, 72, 36; exact total 144.
- Size specification: five practical measurements with deterministic centimeter values.
- Processes: cutting, sewing, washing, and inspection/packing with vendor, quantity, due date, and merged work memo.
- Sample data is source-owned and deterministic. It does not call tenant APIs or use business data.

## Preview and print contract

- Page 1 stays A4 landscape; continuation pages stay A4 portrait.
- The factory process table uses exactly six columns: order, process, vendor, quantity, due date, work memo.
- The renderer keeps operational inventory, order quantity, price, amount, internal state, UUID, token, and storage key out of the factory document.
- Actual Chromium print-to-PDF is a local QA artifact only. It is not a generated-document row, R2 object, Worker job, or production PDF lifecycle operation.

## Product evidence

Status: `LEVEL_4_PRODUCT_VERIFIED`.

### Mobile inline result

- Viewport: 390x844; root horizontal overflow 0.
- Fabric usage area and memo: view/edit typography `12px / 17px / 800`, row `22px`, containing card `265px` before and during edit.
- Accessory usage area and memo: view/edit typography `12px / 17px / 800`, row `22px`, containing card `265px` before and during edit.
- Process work memo: view/edit typography `12px / 17px / 800`, row `22px`, containing card `128px` before and during edit.
- Every edit control is an `INPUT`; multiline and expandable textarea counts are 0.
- Escape restored the original value and the following blur could not commit it. Enter completed one change, unmounted the input, and the value could be restored through one later edit. Static refs cover Enter/blur and Escape/blur double-completion; unchanged normalized values do not call `onCommit`.
- Completed fabric/accessory edit affordances: 0/0.
- Separate process `적용 부위` and `적용 색상·대상` row labels: 0/0. Existing values appear only inside the display-only work memo.
- Tablet portrait 768x1024 and landscape 1024x768: horizontal and vertical document overflow 0.
- Expo console warning/error: 0/0.

### Preview browser result

- Sample route: localhost 200; `Host: www.wafl.co.kr` 404.
- Sample auth/tenant API calls: 0. Console warning/error, failed requests, and HTTP error responses: 0/0/0.
- Desktop 1440x1000: page rectangles 1123x794, 794x1123, 794x1123; document horizontal overflow 0.
- Tablet landscape 1024x768 and portrait 768x1024: horizontal overflow 0.
- Mobile 390x844: one-column page width 375 and root overflow 0; wide quantity/spec tables keep their internal horizontal-scroll boundary.
- Product-board background: repository SVG at 572x661 on the desktop cover. Locator checks passed for the product, document number, colors, exact 144 total, materials, size spec, and four processes.
- Process table headers are exactly `순서 / 공정명 / 업체 / 수량 / 납기 / 작업 메모`.

### Chromium print-to-PDF result

- Final QA file: `wafl-alpha32-issued-preview-sample.pdf`, 138,298 bytes, excluded under `reports/alpha32`.
- Pages: 3. Page 1 is 841.92x594.96pt landscape; pages 2 and 3 are 594.96x841.92pt portrait.
- Extracted nonblank text lengths: 519, 754, 715. Blank pages: 0. Edge-boundary violations: 0.
- The rendered PNG review confirms readable Korean, front/back garment board, IVORY/NAVY/BLACK chips, exact 144 matrix, five size rows, and four process rows without clipping or mid-row split.
- The first print diagnostic exposed a trailing blank default page caused by root notification/portal nodes. Print-only exclusion of those empty support nodes removed it; no document content, screen layout, auth policy, or production lifecycle changed.
- Header repetition and row integrity remain enforced by `table-header-group` and `break-inside: avoid` print rules.

## Mutation and dependency status

- DB migration/schema/index/write: false
- API implementation/mutation: false
- Dev/test/business data mutation: false
- R2/Worker/QR/generated-document lifecycle/production access: false
- Root package/lockfile/dependency change: false
- PowerShell menu: no new menu. The existing `automation-infrastructure` Verify profile owns the alpha.32 static/build contracts, avoiding a duplicate entry point.

## Next action

Alpha.33 may begin PDF/QR/R2 generated-document lifecycle only under a separate explicit work order and mutation approval.
