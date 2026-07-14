# WAFL PDF Specification

Version: 0.24.21.15  
Status: Canonical PDF product policy and implementation contract

## WAFL v2 alpha.39 preparation note

The controlled viewer serves the retained immutable alpha.38 PDF through a signed short viewer session and server-side R2 GET. It never redirects a client to a signed R2 URL and never exposes document UUIDs or storage keys. Alpha.39 does not rewrite or overwrite the PDF; QR insertion into a new PDF generation remains alpha.40.

## WAFL v2 alpha.38 implementation note

The approved dev/test lifecycle now persists one immutable issued-Preview PDF using a PostgreSQL-generated document UUID, exact tenant/work-order R2 key, signed PUT/GET integrity verification, generated finalize, and one event. The successful PDF is retained. This evidence does not authorize production generation, QR, viewer tokens, revoke, delete, or regeneration policy changes.

## WAFL v2 alpha.37 implementation note

For the App-first v2 issued work instruction, the current immutable Preview Read Model and `IssuedWorkOrderDocument` override legacy v1 layout assumptions. Alpha.37 proves only local Chromium binary generation and inspection; persisted metadata, R2 upload, Worker execution, QR/access tokens, and production generation remain unexecuted.

## 1. Scope

WAFL delivers workorder and supplier-order documents as PDF files. It does not provide screen sharing, anonymous share links, or customer-content access to system administrators.

## 2. Document families

### Workorder PDF

- Incomplete PDF may be generated while the workorder is not final.
- Incomplete PDF must show all of: prominent `미완성` watermark, status badge, and missing-item list.
- Final PDF is generated from an eligible workflow state.
- If no related fabric/accessory orders exist, final PDF may be generated immediately.
- If related orders exist, final PDF may be generated only after all related purchase orders reach ordering completion.
- Page 1 contains company/product basics, design, and memo/data summary.
- Later pages contain size specifications, detailed tables, and POM/measurement-position guidance.

### Supplier/order PDF

- Generated at purchase request.
- Scoped to the intended supplier/process partner only.
- Must not expose another supplier's prices, contact data, memo, or items.

### Excluded family

- No separate actual-result/completion PDF.

## 3. Retention and regeneration

- Keep only the newest final PDF file for each canonical document identity.
- Delete the previous file after the new file is successfully generated, verified, and promoted.
- Do not retain superseded PDF files.
- Do not retain prior PDF generation timestamp, actor, revision, replacement, or superseded metadata as a version history.
- Ordinary operational logs may retain only non-content failure/result evidence under the general logging policy.
- PDFs are deleted with customer data after termination plus the 30-day recovery period.

## 4. Failure behavior

- If a new generation attempt fails and a previous valid PDF exists, continue serving the previous valid PDF.
- Show the customer that the latest generation failed.
- Provide a retry action.
- Notify the operator immediately on the first generation failure.
- A failed render must not be registered as a successful file.
- A failed replacement must not delete the previous valid file.

## 5. Storage-full behavior

At 100% storage usage:

- block PDF regeneration;
- block new uploads, file replacement, and drawing edits that create a new file;
- allow viewing and deletion operations that reduce usage.

## 6. Generation pipeline

`domain snapshot → typed document model → validation → renderer → checksum/size validation → private R2 upload → active-file promotion → old-file deletion → usage reconciliation`

- The renderer must not query mutable domain data after snapshot creation.
- Use idempotency to prevent duplicate files from repeated clicks.
- Select one canonical production renderer.
- Legacy/internal fallbacks must be blocked in production or removed after verification.

## 7. Permissions

- Generate, view, download, retry, and delete are separate capabilities.
- Server authorization is mandatory.
- Workorder/customer PDFs require tenant membership and resource permission.
- System administrators may see non-content operational status but cannot open customer workorder PDFs.

## 8. File naming and layout

- Use filesystem-safe deterministic filenames.
- Do not include raw email, token, secret, or uncontrolled free text.
- Default paper is A4 portrait unless a template explicitly requires landscape.
- Preserve Korean typography, units, dates, wrapping, repeated table headers, page numbering, and print margins.

## 9. QA

Automatic checks:

- document model validation;
- permission and tenant guards;
- idempotency;
- replacement rollback;
- active-latest uniqueness;
- failure alert dispatch;
- R2/DB usage reconciliation.

Manual checks:

- incomplete watermark/status/missing list;
- final-state eligibility;
- Korean multi-page tables and POM illustrations;
- PC, iPad/tablet, mobile download;
- previous-valid-file behavior after failed regeneration.

## 10. Safety boundary

Stop and separate the work if schema migration, production R2 mutation, renderer-provider contract, legal/accounting content, or customer-content access expansion is required.
