# Alpha.79 Stage 3B Revoked Artifact Purge / Deleted Lifecycle Evidence

Checkpoint: `ALPHA79_STAGE3B_REVOKED_ARTIFACT_PURGE_DELETED_IPHONE_IPAD_QA_REQUIRED`

This immutable record covers only Stage 3B physical purge and deleted lifecycle. Stage 3B Owner physical PASS is not
inferred. Stage 3A iPhone logical-revoke PASS is retained as prior evidence; iPad mini remains `NOT_RUN`.

## Canonical lifecycle

- The existing ledger already permits `revoked -> deleted`; no schema or migration was added.
- One receipt-backed command validates company, WorkOrder, current Revision, document, generation, newest attempt,
  issued/finalized lifecycle, and revoked state. The caller cannot provide an object key.
- The service derives the exact key from retained DB metadata, HEAD-checks it, deletes only that key when present,
  verifies exact absence, and only then finalizes deleted. The generated-document row, storage identity, issued snapshot,
  WorkOrder, and Revision remain retained and unchanged.
- Revoked+absent replays can finalize deleted. Ambiguous delete followed by confirmed absence can finalize; present or
  unknown remains revoked. Already deleted replays cannot delete again or resurrect state.

## Terminal access boundary

The newest deleted attempt remains authoritative. It cannot fall back to an older generated attempt or start automatic
generation. Workbench View, Save, Share, native Viewer, token controls, and Retry are absent. Direct file, Preview target,
branded/public Viewer, token resolution, and new token creation are denied.

## Exact DEV evidence

Only automated fixture `QA A79 generated revoke access automated` was purged. Exact ownership was verified before the
mutation. It began revoked with one healthy exact object and ended deleted with that exact object absent. Physical delete
count was `1`; same-key replay and a different second request each produced delete count `0`. Deleted event delta was
`1`, active token count was `0`, and the audit row plus storage metadata remained present. File, Viewer, Preview, existing
token, and new-token paths all denied access. Unrelated, Production, Owner-fixture, prefix, and wildcard R2 mutation were
zero.

The physical fixture `QA A79 generated revoke access` remains revoked with its exact object healthy and access denied.
It was not purged automatically. It is reserved for one Owner iPhone `PDF 삭제 QA` action.

## Boundary

- APP_VERSION: `2.0.0-alpha.78`
- migration: `22/22`; new/Production migration `0/0`
- Production/Owner/ambiguous business mutation: `0/0/0`
- DEV exact-owned R2 delete/overwrite/unrelated mutation: `1/0/0`
- Production/Owner-fixture R2 destructive mutation: `0/0`
- dependency/native/config/EAS: `0/0/0/0`
- commit/push/tag/release/finalization: `0/0/0/0/0`
- physical result: `PHYSICAL_RESULT_NOT_INFERRED`
