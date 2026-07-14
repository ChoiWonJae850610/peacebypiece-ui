# PeaceByPiece R2 Storage Policy

## WAFL v2 alpha.39 preparation note

The external viewer revalidates its signed session and active access-token row, then retrieves the retained alpha.38 PDF server-side and verifies MIME, size, SHA, and PDF header. Client redirects, public bucket access, object-key responses, PUT, DELETE, overwrite, and production access are forbidden in alpha.39.

## WAFL v2 alpha.38 implementation note

Approved dev/test stores one retained PDF at `companies/{companyId}/workorders/{workOrderId}/pdf/{generatedDocumentId}.pdf`, where `generatedDocumentId` is the PostgreSQL-returned native UUID. PUT is single-attempt and signed GET verifies MIME, size, header, and SHA before DB finalize. Unknown upload outcomes are read-only audited; automatic overwrite or DELETE is forbidden. Production remains untouched.

## WAFL v2 alpha.37 implementation note

The active existing work-order PDF helper uses `companies/{companyId}/workorders/{workOrderId}/pdf/{generatedDocumentId}.pdf`. Alpha.37 follows that explicitly approved tenant/work-order-scoped grammar for a deterministic plan and local object-store test only. It performs no R2 request. The older generic `v1/{environment}/...` shape below remains a broader policy reference and is not silently substituted into this established v2 work-order key contract.

## Purpose

This document defines the canonical tenant-safe R2 namespace, lifecycle, quota accounting, reconciliation, retention, and operational controls before production activation.

## Storage Classes

- `company-files`: business registration and company-managed files.
- `workorder-attachments`: images and files attached to workorders.
- `generated-pdf`: draft/final generated documents.
- `temporary`: bounded upload/render intermediates with automatic expiry.
- `trash`: logical lifecycle state; it is not a public bucket or user-browsable namespace.

A class must have an owner resource, permission policy, retention policy, allowed MIME/size policy, and quota treatment.

## Object-Key Contract

Canonical shape:

`v1/{environment}/{tenant-id}/{storage-class}/{resource-type}/{resource-id}/{object-id}/{safe-file-name}`

Rules:

- Use immutable internal ids, not company names or email addresses.
- Never include secrets, signed URLs, tokens, raw session ids, or uncontrolled path segments.
- Normalize and validate every segment; reject traversal and ambiguous encoding.
- Environment and service/bucket bindings must be allowlisted.
- Object keys are implementation identifiers, not authorization credentials.

## Tenant Isolation

Every upload, read, download-signing, move-to-trash, restore, and purge operation validates tenant ownership server-side. A caller-provided object key is never trusted without metadata ownership lookup or a signed internal contract.

## Upload Contract

1. Validate actor, tenant, resource ownership, class, MIME, extension, and maximum bytes.
2. Reserve or verify quota before accepting the final object.
3. Upload using a bounded key and idempotency token.
4. Verify size/checksum where supported.
5. Register metadata only after successful object creation.
6. Compensate safely when metadata registration fails.

Direct public writes are forbidden. Signed operations must be short-lived, scope-limited, and auditable.

## Quota Accounting

Three values remain distinct:

- logical active usage: active customer-visible objects counted for billing/quota;
- logical trash usage: recoverable objects, counted according to plan policy;
- physical usage: actual R2 bytes including orphaned, superseded, and temporary objects.

The customer quota decision uses a documented logical policy. Physical reconciliation detects drift and must not silently rewrite billing data without an auditable operation.

The current commercial storage baseline is:

| Plan | Included storage | Member limit | Export baseline |
| --- | ---: | ---: | --- |
| Trial | 100 MB | 3 | restricted |
| Lite | 500 MB | 3 | monthly 1 |
| Flow | 1.5 GB | 10 | monthly 3 |
| Studio | 5 GB | 30 | monthly 10 |

Additional storage is sold in 1 GB units at the currently documented baseline of KRW 7,000/month. A later pricing decision may revise price without changing the technical quota contract.

- At 80% logical usage, show a warning without blocking normal work.
- At 100%, block new file uploads and new persisted generated-file creation.
- While blocked, allow reads, file deletion, trash emptying, export where entitled, and plan/storage upgrade.
- Text-only workorder editing remains available unless a separate product policy explicitly blocks it.
- Trash bytes count toward quota while recoverable.
- Plan downgrade is rejected or deferred when current counted usage exceeds the target limit.
- Seed/test companies use varied registered usage values to verify charts and warning states.

## Lifecycle

`pending → active → superseded | trashed → purged`

- Delete defaults to logical trash where recovery is supported.
- Restore revalidates quota and ownership.
- Purge is destructive, environment-restricted, separately confirmed, and audited.
- Superseded generated PDFs remain traceable according to retention policy.
- Temporary objects have a short explicit TTL and do not become permanent by omission.

## Retention Defaults

The current documented baseline is:

- Customer trash retention: 30 days.
- Before day 30, restore remains available when ownership and quota checks pass.
- After day 30, an item becomes purge-eligible; production purge is not implied by elapsed time alone and remains guarded/audited.
- Long-term nonpayment is handled through 30/60/90-day stages rather than immediate destructive deletion.
- Service termination notice baseline: 30 days.
- Suspension, closure request, grace/retention, and physical purge remain separate states.
- Legal hold blocks purge.
- Exact account-closure export/grace duration and final-PDF retention duration remain unresolved policy values.
- No production purge automation is enabled until those remaining periods and approval controls are finalized.

## Download and Access

- Buckets remain private.
- Downloads use authenticated proxying or short-lived signed URLs.
- Content disposition uses a safe human-facing filename.
- Cache policy must not expose cross-tenant content.
- Audit logs record actor, tenant, object metadata id, action, result, and reason without recording signed URLs or secrets.

## Reconciliation

A dry-run reconciliation compares DB metadata and R2 inventory and classifies:

- metadata without object;
- object without metadata;
- size/checksum mismatch;
- invalid namespace;
- expired temporary object;
- lifecycle mismatch.

Repair and purge are separate commands. Dry-run is safe; mutation requires environment guards, confirmation, fingerprint/prefix/service-code checks where applicable, and a result report.

## Failure and Recovery

- Upload timeout must not be reported as success without verification.
- Retry must be idempotent.
- Orphan cleanup must never infer tenant ownership from filename alone.
- Quota reservation failures must release reservations safely.
- Operational dashboards show degraded/reconciliation-needed states without exposing customer file content.

## Required Evidence Before Production

- object-key contract tests;
- tenant-boundary and permission tests;
- MIME/size/path validation tests;
- quota and concurrent-upload tests;
- trash/restore/purge lifecycle tests;
- dry-run reconciliation fixtures;
- backup/export/incident procedure;
- approved plan capacities and retention policy;
- real-device upload/download QA.
