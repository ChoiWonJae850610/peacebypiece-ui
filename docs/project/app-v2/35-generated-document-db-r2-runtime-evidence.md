# WAFL v2 Generated Document DB/R2 Runtime Evidence

Version: `2.0.0-alpha.38`
Baseline HEAD: `c55adeefa0d04010cbb41b86a321487f7b5d9e76`
Target: approved dev/test fingerprint `01e5dcc7fea3`
Result: `ALPHA38_PDF_DB_R2_CONTINUATION_AND_COMPLETION_PASS`

## Scope and safety

Alpha.38 connects the alpha.37 immutable issued-Preview PDF foundation to one bounded dev/test generated-document lifecycle. Production, customer business data, R2 DELETE, cleanup, rollback, QR, external viewer, access token, and mobile API integration remain outside this version.

The canonical source remains `WorkOrderIssuedPreviewReadModel` plus `IssuedWorkOrderDocument`. Neither the legacy work-order PDF nor order-request PDF renderer is used.

## Migration 010

- File: `db/v2/migrations/010_v2_generated_document_receipt_link.sql`
- SHA-256: `d75dac55a0536210513a1fb00db2513bc9249a7363d66dcd5d4c0cab24c6e350`
- Apply: approved dev/test once
- Ledger: `9/9 -> 10/10`
- Added column: `work_order_command_receipts.result_generated_document_id uuid NULL`
- Added constraint: company-scoped FK to `generated_documents(company_id, id)`, `ON DELETE RESTRICT`, `NOT VALID`
- Existing receipt backfill: none
- Existing business-row mutation: 0
- Production apply: false

## Native UUID and receipt contract

`generated_documents.id` retains PostgreSQL `uuid DEFAULT gen_random_uuid()`. The pending INSERT omits `id` and uses `RETURNING id`; application code does not call `randomUUID` or derive a deterministic entity UUID.

The retained document UUID is `f9c2141d-19e2-4a37-ba4b-33588cd3cd74`. The receipt key remains tenant, command code, and idempotency key with request SHA verification. Its native UUID result link points to that document.

## Actual issued source

- Company: approved synthetic Company A
- WorkOrder: `358099b0-538f-49b0-aa6c-2c8f223cc2cf`
- Revision: `7b2a21b2-8af8-4d01-b1f7-330a57fd0c79`
- Display document number: `WAFN-26FW-A30FACT-260712-001-R0`
- State: issued/finalized
- Document type: `factory_instruction`
- Renderer: `wafl-work-instruction-pdf/1`
- DTO schema: `1`
- Snapshot SHA-256: `25d92b5a0dea77da01553173786eec7a05dc10b5ce741a18266ccbc5ca332325`

No sample fallback was used. The issued snapshot stored in the pending row matched the regenerated canonical snapshot before continuation.

## Failure and continuation history

1. Migration 010 completed and the first runtime prepared exactly one receipt and one pending generated document.
2. Local Chromium then timed out waiting for `networkidle`; no PDF, R2 object, finalize update, or event existed.
3. Bounded audit returned `PARTIAL_MUTATION_CONFIRMED`: receipt/document/event `1/1/0`, pending 1, R2 object 0.
4. Diagnosis proved the document DOM and two page roots were ready while a shared auth request and development runtime made `networkidle` unsuitable.
5. The renderer moved to `domcontentloaded` plus explicit PDF root, font, image, and page-root readiness. Console errors and failed requests remain fatal.
6. A first continuation wrapper invocation stopped before the runner body because PowerShell promoted a normal Node stderr warning to `NativeCommandError`. Audit confirmed no added mutation and the Failure Handoff is preserved.
7. The wrapper was changed to capture stdout/stderr independently and use only the child exit code. The approved continuation then reused the exact pending UUID and succeeded once.

No prepare transaction, migration, receipt insert, generated-document insert, UUID allocation, generation-number allocation, cleanup, rollback, or DELETE was repeated during continuation.

## PDF and R2 result

- PDF size: `130332` bytes
- PDF SHA-256: `9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2`
- Pages: `2`
- Orientation: `landscape`, `portrait`
- Header/EOF/MIME/size/hash: PASS
- Korean text and actual issued content: PASS
- Blank pages/clipping/console errors/failed requests: `0/0/0/0`
- R2 PUT count: `1`
- R2 signed GET integrity: PASS
- R2 DELETE count: `0`

Exact retained key:

```text
companies/wafl-fn-company-a/workorders/358099b0-538f-49b0-aa6c-2c8f223cc2cf/pdf/f9c2141d-19e2-4a37-ba4b-33588cd3cd74.pdf
```

## Finalize, event, and replay

The existing pending row changed to `generated` exactly once. Storage key, file size, content SHA, `generated_at`, and `updated_at` were recorded, and one `work_order.document.generate` domain event was appended without token, signed URL, credential, or PDF bytes.

Duplicate replay returned the linked generated document before render/upload. Replay deltas were receipt insert 0, document insert 0, PDF render 0, R2 PUT 0, finalize update 0, event 0, UUID 0, and object key 0.

Final scoped counts:

| Item | Count |
|---|---:|
| Receipt | 1 |
| Generated document | 1 |
| Domain event | 1 |
| Incomplete receipt | 0 |
| Pending document | 0 |
| Failed document | 0 |
| Retained R2 object | 1 |

Company B, C, and H could not read the generated document or linked receipt under tenant RLS. Production mutation is false.

## Transaction and partial-state result

- Prepare transaction: receipt reserve/link and pending document create, committed once in the initial runtime
- Render/upload: actual immutable snapshot, local Chromium, one signed R2 PUT and GET verification
- Finalize transaction: one pending-to-generated update and one event
- Completion result: `NO_PARTIAL_MUTATION`
- Retained dev/test state: receipt, generated document, event, and R2 object

## Verification and next scope

Static contracts verify native UUID use, composite FK, no ID input on INSERT, explicit render readiness, exact-key upload, no DELETE, replay no-op, and production guards. Full repository verification and delivery gates are recorded in the matching alpha.38 repo-state.

Alpha.39 is limited to opaque QR/viewer tokens, token-hash storage, expiry, revoke, generic NOT_FOUND, access accounting, and generated-PDF retrieval without exposing internal UUIDs or R2 keys. This document does not authorize that work.
