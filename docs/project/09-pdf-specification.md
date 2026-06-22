# PeaceByPiece PDF Specification

## Purpose

This document is the canonical pre-1.0 specification for generating, presenting, storing, regenerating, and auditing PeaceByPiece PDFs. It defines product behavior without activating production DB/R2 mutations.

## Document Families

### Workorder PDF

- Purpose: communicate the approved production instruction state.
- Source: a versioned workorder PDF document model, never arbitrary screen DOM.
- Draft: may be regenerated while the workorder is editable and must be visibly marked as draft.
- Final: generated only from an eligible workflow state and bound to a source revision/hash.
- Required sections: company identity, product summary, quantities, materials, processes, memo, attachments/reference images when allowed, cost visibility according to permission/policy, generated timestamp, document version, and page numbering.

### Material/Supplier Order PDF

- Purpose: communicate an order to a specific supplier or process partner.
- Source: a supplier-scoped order document model.
- One document must not leak another supplier's pricing, contact, memo, or items.
- Required sections: ordering company, recipient/supplier, linked workorder reference, order items, quantities/units, requested date, delivery/handling notes, generated timestamp, and document version.

## Canonical Generation Pipeline

`domain snapshot → typed PDF document model → validation → renderer → binary checksum → optional storage registration → audit evidence`

The renderer must not query mutable domain data after the snapshot is created. The snapshot, template version, locale, actor, tenant, and source revision must be traceable.

## Draft and Final Rules

| Property | Draft | Final |
| --- | --- | --- |
| Watermark/status | Required | Must not say draft |
| Regeneration | Allowed | Creates a new version; never silently overwrites audit history |
| Source binding | Current revision | Exact approved revision/hash |
| Business use | Preview/internal review | Download/print/share according to permission |
| Retention | Short-lived or on-demand | Policy-controlled |

A final PDF becomes stale when the source revision changes. The UI must show stale/current state rather than presenting an old final as current.

## File Naming

Human-facing download names should be deterministic and filesystem-safe:

`{document-type}_{company-code}_{reference}_{YYYYMMDD}_{version}.pdf`

R2 object keys are separate from download names and follow the storage policy. Do not include secrets, raw email addresses, access tokens, or uncontrolled free text.

## Template and Layout Rules

- Default paper: A4 portrait; landscape is allowed only for a documented template.
- Preserve Korean text, units, currency, dates, and line wrapping.
- Repeating table headers are required across page breaks.
- Content must not be clipped by browser print margins.
- Images use bounded dimensions and safe fallback states.
- Empty optional sections are omitted or rendered with an explicit policy-approved empty label.
- Template version is recorded in metadata and audit evidence.
- Customer-facing strings use the selected locale; internal identifiers remain stable.

## Permissions

- Generate, view, download, print, share, regenerate, and delete are separate capabilities.
- Server enforcement is mandatory; hidden UI is not authorization.
- Supplier-order PDFs expose only the intended supplier scope.
- Cost fields follow the same visibility policy as the underlying business feature.
- System administrators may inspect metadata and operational status but do not automatically receive customer-document content access.

## Idempotency and Concurrency

- A generation request uses an idempotency key derived from tenant, document type, source id, source revision, template version, and locale.
- Duplicate clicks must not create uncontrolled duplicate objects or attachment rows.
- A failed render must not leave a successful DB registration.
- Retry behavior must distinguish render retry, upload retry, and metadata-registration retry.

## Metadata Contract

Minimum metadata:

- tenant/company id
- document type and source id
- source revision/hash
- template version and locale
- draft/final status
- generation actor and timestamp
- byte size, content type, checksum
- storage object key when persisted
- lifecycle status: active, superseded, trashed, purged, failed
- failure code without secrets

## QA Evidence

Automatic checks should cover model validation, permission guards, deterministic naming, idempotency, template registration, object-key construction, and failure rollback. Manual QA must compare screen data and rendered PDF on PC, iPad/tablet, and mobile download flows, including Korean typography, multi-page tables, images, print margins, and stale-final behavior.

## Stop Conditions

Stop implementation and request a separate decision when:

- a legal or accounting requirement changes mandatory document content;
- attachment schema or migration is required;
- production R2 binding or destructive cleanup is required;
- the final-generation workflow state is not agreed;
- customer content access for system administrators would be expanded.
