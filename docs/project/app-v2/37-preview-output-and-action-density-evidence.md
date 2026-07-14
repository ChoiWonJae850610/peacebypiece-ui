# WAFL v2 Alpha.40 Preview Output and Action Density Evidence

Status: `LEVEL_4_PRODUCT_VERIFIED`

## Baseline and scope

- Baseline version: `2.0.0-alpha.39`
- Baseline HEAD: `a6402a30873b51d12069e0b913b7a3090ebf7c0c`
- Result version: `2.0.0-alpha.40`
- Migration ledger: retained `11/11`; migration and schema changes: none
- Retained actual PDF: alpha.38 immutable generated document and exact R2 object, read-only only
- Alpha.39 token rows, receipt, and events are retained without create, rotate, revoke, exchange, or update

## Mobile material actions

- At 320-390px, action visuals are icon-only `36x30px`, use 3px spacing, and retain a `42x42px` effective hit target through bounded hitSlop.
- The 390px order/price/amount summary remains one line. At 320-359px it may use at most two lines without hiding data, horizontal scrolling, or a separate action row.
- Card spacing is 10px with a restrained one-pixel boundary and no heavy shadow.

## Preview entry and document rendering

- Expo Web opens one `noopener,noreferrer` popup and keeps the source tab URL unchanged. A 750ms guard suppresses accidental duplicate clicks. Native `Linking.canOpenURL/openURL` behavior is unchanged.
- The representative product visual is a native HTML `<img>` with `object-fit: contain`. Chromium readiness checks complete, natural width/height, and rendered bounds.
- Color chips are inline SVG rectangles with print-color adjustment. The sample sketch retains front/back drawings and labels but no longer duplicates IVORY/NAVY/BLACK or `색상 기준`.
- Official actual/sample toolbars contain no `window.print()` path.

## Generated-document Read and file delivery

- The existing documents lazy Read Model adds generation number, file size, generated timestamp, status, display number, revision identity, access-token availability, and controlled inline/download URLs.
- `GET /api/v2/work-orders/documents/[documentRef]/file?disposition=inline|attachment` requires authenticated `workorder.read`, derives company scope from the session, validates PostgreSQL UUID text, and returns generic NOT_FOUND for missing/cross-tenant/non-generated/revoked/deleted rows.
- The server retrieves the exact R2 object and validates PDF MIME, metadata byte length, SHA-256, and `%PDF-` header. The response uses a display-number filename, `private, no-store`, and `nosniff`; it exposes no object key, signed URL, or UUID filename.
- Actual Preview shows generated status/generation and PDF view/download/share. When no generated row exists it shows `생성된 PDF 없음` and creates no fake URL.

## Local sample PDF

- `/dev/workorder-preview-sample/pdf` is localhost-only and reuses the alpha.37 immutable sample foundation, current `IssuedWorkOrderDocument`, and local Chromium renderer.
- Local Chromium result: `195,114` bytes, SHA-256 `8f0a02f07365d2d7737353713b658aebf6c08da521cf2fa8ad4dc73cf13445e9`, three pages with landscape/portrait/portrait orientation.
- Rendered-page inspection verified Korean text, the front/back product image, inline SVG color chips, matrix total 144, size/process sections, blank page zero, and visible clipping/overlap zero.
- It returns a direct PDF attachment named from the sample display document number. DB/R2/Worker mutation is zero.

## Actual generated PDF read-only verification

- Approved dev/test fingerprint `01e5dcc7fea3`, migration ledger `11/11`, and retained generated document `WAFN-26FW-A30FACT-260712-001-R0` were verified in `BEGIN READ ONLY` transactions.
- Company A inline and attachment responses were both HTTP 200, `application/pdf`, `130,332` bytes, and SHA-256 `9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2`.
- Company B/H received generic `NOT_FOUND`; Company C retained canonical `COMPANY_APPROVAL_PENDING`; unauthenticated access returned `API_SESSION_REQUIRED`; invalid UUID returned `NOT_FOUND`.
- The runner performed exactly two server-side R2 GETs. Before/after generated-document and target count snapshots were identical; R2 PUT/DELETE and all DB writes were zero.
- The first read-only attempt stopped before R2 access because one runner parameter was shared between UUID and JSON text comparisons. The second stopped after two successful GETs because it expected a nested unauthenticated envelope instead of the canonical top-level guard code. Both had mutation zero, have separate canonical Failure Handoffs, and were resolved by runner-only contract corrections.

## Browser product verification

- At 320px, document `scrollWidth` equals viewport width, action visuals are `36x30px`, and the summary is exactly two 16px lines. At 390px the same summary is one line with no horizontal overflow.
- At 768x1024, document `scrollWidth` equals 768 and the material screen has no horizontal overflow; the responsive tablet action sizing and one-line summary remain stable. Wider desktop inspection also retained the tablet/desktop layout without overlap.
- Header and output-tab Preview entries each opened exactly one popup while the Expo source URL remained unchanged. A rapid duplicate click created only one popup.
- Browser warning/error logs were zero for the inspected Expo and Preview tabs.

## Verification status

- Alpha.40 static contract: PASS
- Root TypeScript: PASS
- Mobile TypeScript: PASS
- Next build: PASS
- Local Chromium PDF generation and visual inspection: PASS
- Authenticated actual PDF inline/download integrity: PASS
- Browser responsive/popup/console verification: PASS
- Approved workflow Verify (`automation-infrastructure`): PASS; final source-metadata result is recorded by the matching repo-state artifact.
- Plan/Finish and Git delivery: pending

## Safety and next boundary

- DB mutation: false
- Schema migration: false
- Token/generated-document mutation: false
- R2 PUT/DELETE: `0/0`
- Worker execution: false
- Production access/mutation: false
- Alpha.41 owns a separately approved new realistic issued generation with embedded QR. The retained alpha.38 object is never overwritten.
