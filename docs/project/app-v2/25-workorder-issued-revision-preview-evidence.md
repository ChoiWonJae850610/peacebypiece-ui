# WAFL v2 alpha.28 issued revision Preview evidence

## Result

Alpha.28 adds a read-only 작업지시서 Preview vertical slice for an explicitly identified issued revision. The API is `GET /api/v2/work-orders/:workOrderId/revisions/:revisionId/preview`; the workspace page is `/workspace/workorders/:workOrderId/revisions/:revisionId/preview`.

## Source of truth

Preview reads scalar values from `work_order_revisions.*_snapshot`, the issued document number base from the WorkOrder, and material, color, size, size-spec, process, image-link, and attachment-link rows scoped by the requested revision ID. It never infers the current pointer or fills gaps from a mutable draft.

Supplier names are omitted because material lines do not preserve a supplier-name snapshot. Asset output is limited to revision-link filename, MIME type, order, representative flag, and include flag. Storage keys, signed URLs, mutable asset title/size, raw snapshots, actor UUIDs, tokens, and secrets are excluded.

## DTO and sections

`WorkOrderIssuedPreviewReadModel` contains document/header/amounts, fabrics/accessories, size-color matrix, size specifications, processes, safe asset metadata, issue state, and deterministic layout metadata. Section order is `basic`, `assets`, `fabrics`, `accessories`, `sizeColor`, `sizeSpec`, `processes`, `memo`, `issue`.

The title is `작업지시서`. The issued number `WAFN-26FWA-A25CMD-260711-001-R0` is not recalculated. Issue time uses stored `finalized_at` and deterministic `Asia/Seoul` display. Actor identity is not shown because the revision stores only an internal member reference, not an immutable safe display-name snapshot.

## Tenant and immutability

The route reuses `workorder.read`, workspace membership, the dev/test read fingerprint guard, `BEGIN READ ONLY`, fixed tenant runtime role, RLS claims, and assigned-member visibility. WorkOrder/revision mismatches and B/H cross-tenant access return generic `NOT_FOUND`; Company C returns `FORBIDDEN`. Draft revisions map to `DOCUMENT_NOT_READY`.

Repeated Company A GET responses were deterministic. The target remained `issued/finalized` at versions `15/15`; pre/post WorkOrder, revision, receipt, event, and generated-document counts were identical.

## Runtime evidence

- Fingerprint: `01e5dcc7fea3`; ledger `8/8`
- Preview GET count: `5`; Company A `200`
- Fabric/accessory: `2/1`
- B/H `NOT_FOUND`; C `FORBIDDEN`
- Statement count: `9` including tenant claims
- Payload: `2,983 bytes`
- First DB/API duration: `715.83ms` / `1,614.74ms`
- Deterministic repeat GET: PASS
- DB/schema/test-data/business/R2/Worker/PDF/production mutation: false

The timing includes a cold local Next server, remote connection, sequential bounded child queries, serialization, and localhost fetch. Alpha.28 introduces no new performance gate; safe batching should be considered before alpha.29 renderer adoption.

## UI and print

The workspace page provides an A4-ratio surface, responsive table scrolling, mobile layout, long-number wrapping, empty-section omission, and `@media print`/`@page A4`. Build route registration and static UI/print contracts pass. Direct browser visual judgment remains manual QA; no screenshot artifact was requested.

## Failure history and handoff

Two initial read-only attempts returned 500. Diagnosis confirmed non-contiguous child placeholders `$1/$3`. The correction changed all seven child queries to `$1 = companyId`, `$2 = revisionId`, removed the unused WorkOrder parameter, and removed size-spec `SELECT *`. The approved post-fix read-only runtime passed; no cleanup or mutation occurred.

PDF generation, QR, R2 storage, generated-document lifecycle, regeneration, trash/restore, reconciliation, and Worker lifecycle remain alpha.29.
