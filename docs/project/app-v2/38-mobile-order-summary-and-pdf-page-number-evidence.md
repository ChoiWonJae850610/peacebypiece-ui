# WAFL v2 Alpha.41 Mobile Order Summary and PDF Page Number Evidence

Status: `LEVEL_4_PRODUCT_VERIFIED`

## Baseline and scope

- Baseline version: `2.0.0-alpha.40`
- Baseline HEAD: `faae58b915f1c3276469b55adaa301e05ef3c5e9`
- Result version: `2.0.0-alpha.41`
- Migration ledger: retained `11/11`; migration/schema/index changes: none
- Runtime boundary: local sample HTML/PDF plus one approved retained-PDF read-only regression
- Root package and lockfile: unchanged

## Prior defect and final breakpoint

- The alpha.40 summary used one Text node and `width < 360 ? 2 : 1`, so 320px wrapped while 375/425px forced one line and could truncate the amount.
- Material actions used a compact threshold at 390px, allowing captions to return at wider phone sizes.
- Alpha.41 uses the existing canonical `isTablet = width >= 760` decision. Phone is `<760`; tablet is `>=760`.

## Phone summary and actions

- Phone renders two separate one-line Text nodes. The first contains order quantity, unit, and unit price; the second contains amount.
- Calculations and formatters remain shared with the tablet summary. Missing unit price/amount uses the existing neutral dash contract.
- Phone material actions are icon-only at every checked width and retain accessibility labels plus the existing bounded hitSlop.
- Runtime widths `320, 360, 375, 390, 412, 425, 480, 759` all had complete primary/amount text, ellipsis 0, overlap 0, card overflow 0, and root horizontal overflow 0.
- The fabric requested state retained three actions without collision; editable states retained two; completed states retained zero where the existing contract supplies no action.
- Accessory fixture values including `2,076`, `498,240`, `370`, `155,400`, `396`, and `52,000` remained fully visible at 320/375/425/759px.

## Tablet regression

- At 760x1024 and 1024x768, the existing single-line combined summary remained present and fit its container.
- Phone summary nodes were absent. Caption-capable action text remained available in the tablet button content.
- All inspected cards fit and document horizontal overflow was zero.

## Page-number contract

- `RepeatedHeading` displays only the immutable display document number; its old page-number prop and `· 2`/`· 3` suffix are removed.
- `totalPages` is calculated as `contentPages.length + 1` after deterministic content packing.
- Cover uses page 1; continuation pages use `pageIndex + 2`. Every page root contains one `workorder-page-number` footer.
- Footer positioning is page-relative and bottom-centered for both A4 landscape and portrait. Mobile Preview reserves bottom padding so the footer cannot cover content.

## HTML Preview product QA

- Fresh Next production server: `next start -H 127.0.0.1 -p 2372`; readiness HTTP 200.
- Desktop 1440x900 and mobile 390x844 both rendered three pages and footer texts `1 / 3`, `2 / 3`, `3 / 3`.
- Orientation: landscape, portrait, portrait.
- Old suffix matches: 0. Footer/body overlap: 0. Page/root horizontal overflow: 0.
- Browser console errors: 0. Unexpected failed requests: 0.
- Evidence artifacts are excluded under `artifacts/alpha41/`.

## Local sample PDF

- Route: localhost-only `/dev/workorder-preview-sample/pdf`.
- PDF size: `206,949` bytes.
- PDF SHA-256: `ebb68afd21f5a470cbb460e13999a4357be7b680db74ac1a826eb453b5b1c8fc`.
- Page count/orientation: `3`; landscape, portrait, portrait.
- Extracted footer text: `1 / 3`, `2 / 3`, `3 / 3`.
- Footer center delta from page center: `0.02pt`, `0.14pt`, `0.14pt`.
- Header suffix matches: 0. Every page had non-empty extracted text.
- Rendered page inspection confirmed readable Korean, representative front/back sketch, matrix total 144, intact tables, blank page 0, and visible clipping/overlap 0.

## Actual retained PDF read-only regression

- Approved dev/test fingerprint: `01e5dcc7fea3`; migration ledger `11/11`.
- Retained display document number: `WAFN-26FW-A30FACT-260712-001-R0`.
- Company A inline and attachment were HTTP 200, 130,332 bytes, and SHA-256 `9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2`.
- Company B/H received generic `NOT_FOUND`; Company C remained approval-pending; unauthenticated and invalid UUID guards remained intact.
- DB query mode: `BEGIN READ ONLY`. R2 GET: 2. R2 PUT/DELETE: 0/0.
- The retained alpha.38 PDF was not regenerated, overwritten, or claimed to contain alpha.41 page footers.

## Verification and safety

- Alpha.41 contract, alpha.35/36/37/40 regressions, root/mobile TypeScript, targeted ESLint, Next build, PowerShell encoding, and `git diff --check`: PASS before the final canonical wrapper.
- DB migration/schema/data mutation: false.
- Token/generated-document mutation: false.
- R2 PUT/DELETE: 0/0. Worker execution: false. Production access/mutation: false.
- No new PowerShell menu is added. The static contract belongs in the existing automation-infrastructure profile; browser/local-PDF evidence remains explicit and excluded.

## Manual QA and next boundary

- Remaining user QA: physical iPhone/iPad/Galaxy touch comfort, native PDF viewer opening, and subjective visual review of the compact phone footer and PDF page-number position.
- Alpha.42 scope: realistic issued dev/test data, a new immutable PDF generation with embedded QR, a new non-overwriting R2 key, and preservation of the existing A30FACT PDF. It requires a separate exact mutation approval.
