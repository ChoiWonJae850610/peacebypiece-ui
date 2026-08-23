# Alpha.67 Final PDF Monochrome and Branded Viewer Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA67_FINAL_PDF_MONOCHROME_BRANDED_VIEWER_IPHONE_REQA_REQUIRED`

## Verified implementation

- Issued-PDF page chrome is pure white and neutral grayscale. Representative and selected user
  images retain their source color and have no renderer filter.
- The cover contains ten facts in the approved order. `장당 공임비` reads the persisted Basic
  Process `unitPrice`; `총 공임비` reads that row's persisted `amount`. The renderer performs no
  cost multiplication and does not use WorkOrder `estimatedTotal`.
- Fabric uses the shared spool icon. Accessory uses one reusable four-hole button icon.
- Finished Spec starts cm on a fresh page and inch on the next fresh page. Inch values derive from
  canonical cm through the existing exact 1/8-inch formatter; each unit owns deterministic true
  continuation independently.
- The owner-applied branded public Viewer V4 is byte-preserved. New viewer links use the configured
  branded HTTPS origin; branded root/private routes are denied, while `/v`, required same-host
  framework assets, and exact public Viewer APIs remain available. Internal file APIs retain
  workspace authentication and R2 remains private.
- Runtime tunnel readiness remains fail-closed. The signed foreign shared named-tunnel service may
  expose only the exact configured branded Viewer hostname to loopback Next 3100; every other WAFL,
  unknown, Quick Tunnel, Funnel, host, port, or route mismatch remains blocking.

## Render evidence

All pages were rendered at 190 dpi and visually inspected after the initial render and two bounded
tuning passes.

| Artifact | Bytes | SHA-256 | Pages |
| --- | ---: | --- | ---: |
| `a67-final-monochrome-normal.pdf` | 214322 | `7c6bd9ec302a9e2f8dcaeb248d140664822c2dd2a8425099744f2f74e6038b2b` | 4 |
| `a67-final-monochrome-rich.pdf` | 297235 | `5bc6b893ffe09292211f4d19a8700ef9b74eafd6b7dc908ee93a295212b602a0` | 13 |
| `a67-final-monochrome-sparse.pdf` | 183781 | `756a7bf2bcb3418a9ad7906a898a91506bd4e6fd655cfa46b1f3c6a4873c45b4` | 4 |

Each PDF starts with `%PDF-`, ends with `%%EOF`, is unencrypted, full-readable by the PDF parser,
and contains only A4 portrait pages. The four named PNG evidence views cover the final monochrome
cover, open detail page, fresh cm page, and fresh inch page.

## Verification and safety boundary

- Canonical permanent inventory: `179/179 PASS`, FAIL `0`, SKIP `0`.
- Migration ledger: `20/20`; new migration: `0`.
- APP_VERSION: `2.0.0-alpha.66`.
- Production mutation: `0`; owner-fixture mutation: `0`.
- Commit/push/release: `0/0/0`.
- Owner physical PASS for branded external Viewer access is preserved from the manual V4 evidence.
- Earlier non-PDF physical acceptance is preserved. Only this new PDF visual delta remains
  `PHYSICAL_RESULT_NOT_INFERRED`.
