# Alpha.80 Stage 2 Share Expiry, Revoke, and Replacement Evidence

Checkpoint: `ALPHA80_STAGE2_SHARE_EXPIRY_REVOKE_REPLACEMENT_IPHONE_IPAD_QA_REQUIRED`

This immutable record covers implementation and automated DEV evidence. Stage 1 Owner physical QA is PASS on iPhone
and iPad mini; Stage 2 physical PASS is not inferred.

## Canonical lifecycle

- The Maker-current lineage starts at the Stage 1 deterministic company+generated-document HMAC credential. A
  replacement is deterministically derived from the same identity plus the exact predecessor token UUID and records
  `rotated_from_token_id`. Existing non-lineage manual links remain readable legacy rows and are never selected current.
- One database advisory lock serializes Share, revoke, and replacement for one exact company+document. Database `now()`
  owns creation expiry and active-state classification. Active means the exact healthy current-Revision newest generated
  artifact, canonical lineage head, `revoked_at IS NULL`, and `expires_at > now()`.
- Manual revoke targets only the exact active canonical head, is row-lock/idempotency safe, emits one `pdf.share_revoked`
  event, and never changes the PDF row, WorkOrder, Revision, generation, or R2 object. A terminal token is never reset.
- After revoke or expiry, the next explicit Share creates one child credential. Same-key replay, response-loss retry,
  rapid tap, concurrent different keys, and repeated Share converge on that one active head. Historical terminal URLs
  remain denied through the same generic public not-found response.

## Exact DEV evidence

`QA A80 canonical share binding` retained one healthy current document at generation 1. The run proved Link A exact PDF
bytes before revoke, revoke event delta `1`, replay idempotency, immediate Link A denial, and automatic replacement `0`.
Four concurrent explicit Share requests converged on one Link B, whose predecessor was A and whose exact PDF size/hash
matched the same immutable artifact. A bounded exact-owner transaction then set B expiry to database `now()`; B became
non-current and publicly denied. Explicit Share created one Link F child, F remained reusable, and A/B remained denied.
Final state has one active canonical link; two known legacy active links remain non-canonical and untouched. Document
status, Revision, generation, object key, bytes, and SHA-256 remained unchanged; R2 mutation was zero.

## Boundary

- APP_VERSION: `2.0.0-alpha.79`
- migration: `22/22`; new/Production migration `0/0`
- dependency/native/config/EAS: `0/0/0/0`
- Production/Owner/ambiguous business mutation: `0/0/0`
- exact approved DEV fixture mutation: canonical token lifecycle only; R2 mutation `0`
- Stage 3: `0`; commit/push/tag/release/finalization: `0/0/0/0/0`
- physical result: `PHYSICAL_RESULT_NOT_INFERRED`
