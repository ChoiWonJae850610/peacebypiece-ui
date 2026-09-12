# Alpha.79 Stage 3A Logical Revoke / Access Invalidation Evidence

Checkpoint: `ALPHA79_STAGE3A_REVOKE_ACCESS_INVALIDATION_IPHONE_IPAD_QA_REQUIRED`

This immutable record covers only Stage 3A logical revoke. Owner physical PASS is not inferred.

## Verified lifecycle

- The existing migration ledger already permits `generated -> revoked`; no schema or migration was added.
- The command binds company, WorkOrder, current Revision, generated document id, generation number, newest attempt,
  issued/finalized lifecycle, idempotency receipt, and tenant member.
- The transaction updates document lifecycle once, revokes active tokens for that exact document, appends one event,
  and leaves WorkOrder, Revision, issued snapshot, storage identity, and R2 bytes unchanged.
- Replay, a different second request, and concurrent requests cannot resurrect document or token state.

## Verified access boundary

Newest revoked state suppresses View, Save, Share, native Viewer, token controls, and Retry without falling back to an
older generated attempt. The direct file route, legacy Preview target, embedded/branded Viewer, public token session,
token listing, and token creation all require a currently generated, non-revoked document.

## DEV runtime evidence

The bounded automated fixture was healthy before revoke. After revoke its exact object remained healthy and present,
while internal file, Viewer target, token list/create, and public token resolution all denied access. Active token count
became zero and the revoke event delta was exactly one. R2 delete/overwrite and unrelated mutation were zero.

The separate physical fixture `QA A79 generated revoke access` remains generated and healthy so the Owner can perform
the one actual revoke from the DEV/external-QA control `PDF 폐기 QA`.

## Boundary

- APP_VERSION: `2.0.0-alpha.78`
- migration: `22/22`; new/Production migration `0/0`
- Stage 3A R2 delete/overwrite: `0/0`
- Stage 3B: `0`
- commit/push/tag/release/finalization: `0/0/0/0/0`
- physical result: `PHYSICAL_RESULT_NOT_INFERRED`
