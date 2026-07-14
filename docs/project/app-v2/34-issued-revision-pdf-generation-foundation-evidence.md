# WAFL v2 Issued Revision PDF Generation Foundation Evidence

## Result

- Version: `2.0.0-alpha.37`
- Baseline HEAD: `c5adccb44bd1e04a1723f5066fd475c764296aeb`
- Result HEAD: recorded by the matching final repo-state after Finish
- Verification level: `LEVEL_4_FOUNDATION_VERIFIED`
- Canonical PDF source: `WorkOrderIssuedPreviewReadModel` rendered by `IssuedWorkOrderDocument`
- Document type: `factory_instruction`; the visible title remains `작업지시서`
- DB migration: none
- DB data mutation: false
- R2 mutation: false
- PDF Worker execution: false
- Production access or mutation: false

This checkpoint proves the immutable input, local Chromium PDF binary, content inspection, deterministic object-key plan, and future DB/R2 lifecycle boundary. It is not `PDF_R2_LIFECYCLE_VERIFIED`; persisted metadata and a real R2 object require separately approved alpha.38 work.

## Existing Foundation Audit

Migrations `004_v2_assets_revision_linkage.sql` and `005_v2_documents_access_events.sql` already provide revision asset snapshots, `generated_documents`, document status, generation number, immutable snapshot, renderer/DTO versions, object key, size, content hash, failure code, access tokens, domain events, tenant RLS, and the generated-document immutable guard. Alpha.37 does not modify an applied migration and does not need migration 010.

The legacy `lib/workorder/serverWorkorderPdf.ts` size-spec-oriented HTML and the order-request PDF renderer are not the canonical v2 work-instruction renderer. They remain separate legacy/helper boundaries.

## Immutable Snapshot

`WorkOrderIssuedPdfSnapshot` wraps the complete Preview Read Model with document/company/work-order/revision identity, immutable revision asset manifest, renderer version, DTO schema version, snapshot timestamp, and business timezone.

Creation is rejected unless:

- the WorkOrder is `issued`, `revised`, or `completed`;
- the requested revision is `finalized` or `superseded`;
- requested work-order/revision/company identities match the Preview;
- a display document number exists;
- every revision asset belongs to the same tenant.

The stable serializer sorts object keys, preserves domain array order, converts dates to ISO strings, removes `undefined`, and rejects binary values and non-finite numbers. It never stores signed URLs, DB URLs, session tokens, Worker secrets, or temporary paths.

Runtime snapshot result:

| Field | Result |
|---|---|
| DTO schema version | `1` |
| Renderer version | `wafl-work-instruction-pdf/1` |
| Snapshot SHA-256 | `f1c5a20776a9199160b8b920209e9ec88336de99d04322e1cd7eb665cc419b07` |
| Repeat snapshot SHA-256 | identical |

## Asset Manifest

The server-only manifest uses revision linkage identity and snapshot fields: asset type/id, filename, MIME type, `storage_object_key_snapshot`, display order, representative flag, output inclusion, source size, and source hash. Signed URLs are never persisted in the snapshot.

Representative selection is deterministic: representative revision image, then first included image, then no image. The actual path never substitutes sample artwork. The local foundation scenario resolves only the repository-owned `linen-round-dress-sketch.svg`, validates MIME/size/SHA, and converts its 3,420 bytes to a renderer-only data URL.

## Renderer And PDF Result

`IssuedWorkOrderPdfRenderer` is the provider-neutral port. `LocalChromiumIssuedWorkOrderPdfRenderer` uses repository Playwright/Chromium, loads the existing localhost-only React document, waits for fonts/images, verifies the page snapshot SHA, and calls Chromium PDF with `printBackground: true` and CSS page sizes.

The local runner rendered the same immutable snapshot twice:

| Metric | First | Repeat |
|---|---:|---:|
| File size | 197,751 bytes | 197,751 bytes |
| PDF SHA-256 | `49a8c67b6d1c2606dfead264b6ff6e9d59db1c88b095641594dcf41e8791083f` | `f93a8c16157f7070bb13e64bd278a23f41691bfa4b1fc69af3d01e5ae14fbbd3` |
| Page count | 3 | 3 |
| Orientations | landscape, portrait, portrait | identical |
| Render duration | 1,460.74 ms | 1,297.63 ms |

Chromium metadata makes byte-for-byte PDF SHA equality non-contractual. Snapshot SHA, file size, page count, orientation, text structure, image presence, and page text lengths were stable. `%PDF-`, `%%EOF`, a 10 MB bound, lowercase SHA-256, Korean text, representative image, color/size matrix total 144, blank page 0, clipping 0, console error 0, and failed request 0 all passed.

The local output is excluded runtime evidence at `.tmp/wafl-v2-alpha37/20260714011007/`; it is not included in the source ZIP or `4. Newest`.

## Actual Issued Scenario

Result: `SKIPPED_WITH_REASON`.

Alpha.37 does not load a DB credential and does not add an actual-R2 reader merely to force this scenario. Accepted alpha.28 and alpha.30 evidence continues to prove tenant-scoped issued/finalized Preview reads. No sample fallback was reported as an actual issued PDF result.

## Object Key And Storage Boundary

The existing key grammar is retained:

```text
companies/{companyId}/workorders/{workOrderId}/pdf/{generatedDocumentId}.pdf
```

The alpha.37 deterministic key is:

```text
companies/wafl-fn-company-a/workorders/30000000-0000-0000-0000-000000000001/pdf/00000000-0000-4000-8000-000000000037.pdf
```

The key is tenant/work-order scoped, traversal-checked, token-free, ends in `.pdf`, is stable for one immutable generation identity, and changes for another identity. `LocalFilesystemGeneratedDocumentObjectStore` writes only below the excluded `.tmp` root with create-new semantics and verifies size/hash. The R2 adapter accepts an injected transport, but alpha.37 never instantiates a network transport and performs no R2 call.

## Lifecycle And Transaction Boundary

Future prepare transaction:

1. authenticate tenant/member and reserve the idempotency receipt;
2. lock and validate the issued revision;
3. take a revision/document-type advisory lock;
4. allocate generation number within that lock;
5. insert one `pending` generated document with immutable snapshot/version metadata;
6. commit.

Render/upload occurs outside the DB transaction: render, calculate size/hash, build the immutable key, put, then head/verify. Future finalize transaction locks the pending row, changes it to `generated`, records key/size/hash/time, appends one safe domain event, completes the receipt, and commits.

`MAX(generation_no) + 1` is never used without the advisory scope lock. The existing unique constraint remains the final concurrency guard. A deterministic generated-document identity derived from the scoped idempotency command allows receipt replay to recover the same generation without adding a schema field.

Failure policy:

- before upload: mark pending generation `failed` with a safe code;
- unknown upload response: keep status reconcilable and do not guess object existence;
- upload success plus DB finalize failure: record an orphan candidate and never auto-delete;
- no destructive retry, reset, cleanup, or rollback is implicit.

The SQL in alpha.37 is a parameterized static plan and repository interface. `Alpha37WriteDisabledGeneratedDocumentRepository` blocks every write at runtime.

## PowerShell Decision

No new numbered menu is added. The static contract belongs to the existing `automation-infrastructure` verification profile, while the local Chromium runner remains an explicit, non-destructive foundation command that creates only excluded `.tmp` evidence. This avoids another menu whose only purpose duplicates the approved workflow.

## Approval Handoff And Alpha.38 Scope

The final Approval Handoff is stored under `Logs/Repo_Status/Approval_Handoff/` and is not published to `4. Newest`. It records the final HEAD, renderer metrics, object key, and exact mutation budget.

The next separately approved dev/test scope is:

- `generated_documents` pending row: +1;
- R2 PDF object: +1;
- pending-to-generated metadata update: +1;
- safe domain event: +1;
- idempotency receipt: +1 if the existing command-receipt contract is used;
- GET/HEAD object verification and duplicate-request no-op proof;
- bounded partial-mutation audit;
- production mutation: 0.

QR, access-token issuance, external viewer, revoke, trash/restore/purge, reconciliation mutation, and production generation remain outside alpha.38 unless separately approved.
