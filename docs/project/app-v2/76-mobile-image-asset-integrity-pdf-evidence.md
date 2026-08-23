# Alpha.67 Mobile Image Asset Integrity and PDF Evidence

Document type: **Immutable Evidence**

Status: `ALPHA67_MOBILE_IMAGE_ASSET_INTEGRITY_PDF_IPHONE_REQA_REQUIRED`

## Scope

This evidence records the bounded mobile-image metadata and issued-PDF remediation. It does not
change Reorder copy/reset semantics, owner data, schema, migration ledger, or production bindings.

## Read-only owner failure trace

The recent owner attempts were inspected without mutation. Each representative image's DB MIME
and byte length matched the corresponding R2 object; stored hashes were null historical metadata.
The package's size-mismatch hypothesis was therefore not accepted as the physical failure cause.
Preserved current-generation render inputs were then replayed locally. Asset fetch and data-URL
assembly had already succeeded. The first failure was `PDF_PAGE_ORIENTATION_INVALID`: the cover
DOM exceeded one A4 landscape page, so Chromium emitted additional landscape pages before the
portrait sections. The print owner now fixes the cover at one landscape page and constrains the
representative image within that box.

## Permanent integrity boundary

- Mobile upload size is the fetched Blob size actually sent by the transport.
- Complete reads the R2 source object, validates actual MIME and bounded bytes, computes SHA-256,
  checks quota using actual bytes, and persists actual size/hash before publishing the row.
- Hash-present assets remain strict for MIME, bytes, and hash.
- Hash-null legacy inline images receive bounded compatibility using actual object bytes/hash only
  for the generation in memory. No legacy DB backfill or owner mutation occurs.
- Stable asset, render/orientation, R2, and finalize failure categories replace the undifferentiated
  failure owner for new attempts.

## Safety

- Migration ledger: `20/20`; migration `021`: absent.
- Production mutation: `0`.
- Owner WorkOrder/fixture mutation: `0`.
- APP_VERSION remains `2.0.0-alpha.66`.
- Commit/push/release: `0/0/0`.

`PHYSICAL_RESULT_NOT_INFERRED`
