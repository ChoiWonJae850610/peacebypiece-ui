# Alpha.67 PDF Spec Pagination, Viewer Touch, and Format Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA67_PDF_SPEC_PAGINATION_VIEWER_TOUCH_FORMAT_IPHONE_REQA_REQUIRED`

## Bounded implementation

- Native viewer return uses one 44-point `Pressable` whose protected native stacking plane sits
  above `react-native-pdf`; activation calls the existing viewer-close boundary and restores the
  current WorkOrder Document context.
- Finished Spec pages use content-capacity packing and a full-page size-spec resolver. A fitting
  section is kept intact or moved intact; only a truly oversized section creates continuation
  blocks and repeated headers.
- Finished Spec full view gives vertical ownership to `WaflInputSheet`, expands all rows, publishes
  actual body scroll metrics, and expands a single selected Size into remaining table width.
- Issued-document quantity strings remove fractional trailing zeroes without numeric coercion.

## Verification boundary

The focused contract covers viewer activation, 5/16/30-row pagination, preceding-section capacity,
full-view ownership/affordance/width, and quantity examples. Rendered owner-like and oversized PDF
pages are inspected as visual evidence. Full Canonical Verify, TypeScript, ESLint, Next production
build, Expo/iOS gates, mutation audit, runtime strict READY, and artifact verification remain required
for the checkpoint result.

Owner physical iPhone result is not inferred: `PHYSICAL_RESULT_NOT_INFERRED`.

## Rendered visual evidence

- `tmp/pdfs/a67-pagination-evidence/owner-like-16-pom.pdf` — 223,867 bytes, SHA-256
  `eab5a491251215586dd06a248c5eef3f4838aba5a090aabdf4adebf5824c648c`. Its 16-row Finished Spec
  appears as one continuous table on page 3 with no false `(계속)` block; material quantities on
  page 2 render `1.5`, `1`, `0.125`, and `0` without fixed zero padding.
- `tmp/pdfs/a67-pagination-evidence/oversized-30-pom.pdf` — 248,658 bytes, SHA-256
  `0742d75f61715848e048ef984ca1129b5baf9ec27a3bb1ee77ba2668b50aada6`. The genuinely oversized
  Finished Spec alone splits into balanced 15/15-row pages; only the second page displays `(계속)`
  and its table header is repeated.
- Both PDFs were rendered through Poppler at 110 DPI and every content-page PNG was inspected.
  The owner-like table is no longer divided by a seven-row constant, and the oversized continuation
  has no nearly empty trailing page.
