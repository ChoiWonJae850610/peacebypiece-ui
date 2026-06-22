# PeaceByPiece R2 Storage Policy

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

Company plans may define capacity, warning thresholds, upload blocking threshold, trash treatment, and retention. Seed/test companies should use varied registered usage values to verify usage graphs at multiple fill levels.

## Lifecycle

`pending → active → superseded | trashed → purged`

- Delete defaults to logical trash where recovery is supported.
- Restore revalidates quota and ownership.
- Purge is destructive, environment-restricted, separately confirmed, and audited.
- Superseded generated PDFs remain traceable according to retention policy.
- Temporary objects have a short explicit TTL and do not become permanent by omission.

## Retention Defaults

Exact commercial/legal periods require user approval. Until approved:

- no production purge automation is enabled;
- retention values remain configuration/policy data, not hard-coded UI assumptions;
- legal hold blocks purge;
- account suspension and account deletion are separate states;
- export/grace-period requirements are documented before destructive removal.

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
