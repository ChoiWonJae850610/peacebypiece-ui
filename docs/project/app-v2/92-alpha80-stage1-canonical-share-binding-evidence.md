# Alpha.80 Stage 1 Canonical Share Binding Evidence

Checkpoint: `ALPHA80_STAGE1_CANONICAL_SHARE_BINDING_IPHONE_IPAD_QA_REQUIRED`

This immutable record covers implementation and automated DEV evidence only. Owner physical PASS is not inferred.

## Canonical binding

- Existing intentional multi-token `manual_share` rows remain supported. No legacy token is deleted, revoked, rotated,
  or relabelled. The Maker current flow is a deterministic HMAC-derived subset with at most one active credential for
  one exact generated-document identity.
- Eligibility is server-derived and requires authenticated company, exact current WorkOrder Revision, newest generation
  attempt, `generated` lifecycle, non-revoked/non-deleted row, matching immutable storage metadata, and actual healthy
  `%PDF-`/`%%EOF` bytes with exact size and SHA-256.
- A company+document advisory lock serializes every request key. Same-key receipt replay, response-loss retry, rapid
  double tap, concurrent calls, and different keys reuse the same token row and URL; only first creation appends the
  existing `pdf.shared` event.
- The mobile response verifies WorkOrder, Revision, document and generation before native Share. Document transitions
  clear the in-memory request identity and stale responses cannot present a historical URL.

## Public and lifecycle boundary

The raw token remains browser-fragment/process memory only and persistence remains hash-only. Public exchange and
session read bind the exact token to the exact immutable generated document and exact R2 bytes; no current Recipe read
or Maker control appears. Pending, failed, missing, corrupt, transient-unverified, revoked, deleted, historical and older
attempts cannot create a Maker current link. A79 terminal access denial remains unchanged.

## Boundary

- APP_VERSION: `2.0.0-alpha.79`
- migration: `22/22`; new/Production migration `0/0`
- dependency/native/config/EAS: `0/0/0/0`
- Stage 2 expiry/revoke/replacement: `0`; Stage 3 security expansion: `0`
- Production/Owner/ambiguous business mutation: `0/0/0`
- physical result: `PHYSICAL_RESULT_NOT_INFERRED`
