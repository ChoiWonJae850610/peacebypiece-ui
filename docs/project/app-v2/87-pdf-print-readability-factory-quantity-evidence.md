# Alpha.67 PDF Print Readability / Factory Quantity Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA67_PDF_PRINT_READABILITY_FACTORY_QUANTITY_IPHONE_REQA_REQUIRED`

## Proven facts

- The A4 portrait cover retains exactly ten canonical facts and shows the document number both as quiet title metadata and as its factual card.
- Shared PDF tokens own the enlarged WAFL wordmark, WorkOrder title, card label/value, summary, detail heading, table, and footer scales.
- PDF semantic icon routing maps Fabric to the textile-roll/spool symbol and Accessory to the circular sewing-button symbol on both cover and detail pages.
- Detail section headings use an open brick number, semantic icon, navy title, and warm divider; a full-width navy fill is absent.
- Factory Material tables expose one `수량` column. Its value is computed with canonical scaled decimal-string parsing as `required + allowance`, then formatted without meaningless trailing zeroes. No DB or mobile-input value is changed.
- The print-readable page capacity is 38 layout-weight units. Sixteen normal Finished Spec rows fit one fresh page; seventeen become deterministic continuation pages.
- Evidence includes normal, rich, and sparse PDFs. All 17 resulting pages were rendered at 190 dpi and inspected for clipping, overflow, continuation truth, portrait orientation, and quantity presentation.
- Visual evidence includes `cover-mock-vs-final.png` and `detail-mock-vs-final.png`, produced after an initial render and two bounded tuning iterations.

## Boundaries

- APP_VERSION remains `2.0.0-alpha.66`.
- Migration ledger remains `20/20`; no migration was added.
- Production and owner WorkOrder mutation remain zero.
- Commit, push, and release remain zero.
- Owner accepted all non-PDF alpha.67 physical checks before this package. Only this PDF delta remains device review.
- `PHYSICAL_RESULT_NOT_INFERRED`.
