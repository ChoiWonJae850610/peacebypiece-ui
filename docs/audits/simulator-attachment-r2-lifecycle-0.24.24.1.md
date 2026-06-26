# 0.24.24.1 Simulator Attachment/R2 Lifecycle Integration Audit

Version: 0.24.24.1
Status: non-destructive implementation foundation

## Result Summary

0.24.24.1 creates the simulator attachment/R2 lifecycle foundation needed before any actual dev/test Neon or R2 mutation.

- Canonical manifest added: `tools/simulator/fixtures/attachments/canonical-lifecycle-manifest.json`
- Lifecycle command added: `tools/simulator/commands/attachment-lifecycle.mjs`
- PowerShell menu 34~41 added for attachment plan, local generate, upload/seed, verify, lifecycle, cleanup, and fault boundaries
- R2 access path aligned to the existing Cloudflare Worker signed `PUT`/`GET`/`DELETE` contract; direct S3 endpoint access is not used by the attachment lifecycle simulator
- Contracts added:
  - `tests/r2-worker-signature-contract.mjs`
  - `tests/simulator-attachment-manifest-contract.mjs`
  - `tests/simulator-attachment-lifecycle-contract.mjs`
- Cloudflare Worker source change: none
- Cloudflare dashboard manual deploy required for this change: no
- Actual Neon DB mutation: not executed
- Actual R2 upload/delete: not executed
- DB schema migration: none
- Package/lockfile change: none

## Source Of Truth Trace

Workorder attachments:

- DB table: `attachments`
- Trash/lifecycle evidence: `attachment_trash_items`
- Storage usage snapshot: `storage_usage_snapshots`
- Workorder attachment repository: `lib/workorder/persistence/dbAttachmentRepository.ts`
- Attachment preview route: `app/api/workorders/attachments/file/route.ts`
- R2 key policy: `lib/storage/r2/r2Keys.ts`
- R2 runtime helpers: `lib/storage/r2/r2WorkerUpload.ts`, `lib/storage/r2/r2WorkerSignature.mjs`
- Existing direct R2 SDK helper retained for app paths that already use it: `lib/storage/r2/r2Client.ts`

Storage display paths:

- Customer admin main storage summary: `lib/admin/dashboard/adminPlanStorageSummary.ts`
- `/workspace/files` snapshot path: `app/api/admin/files/snapshot/route.ts`
- Shared row source: `lib/admin/adminFiles.serverActions.ts`
- Storage snapshot repository: `lib/billing/storageUsageRepository.ts`

Current product policy observed from code:

- Normal attachment list uses active `attachments` rows where `deleted_at IS NULL` and active is true.
- Trash list uses unresolved `attachment_trash_items`.
- Soft delete updates DB state and keeps R2 object.
- Restore reactivates DB metadata and does not reupload R2.
- Purge worker validates exact workorder/company storage key scope, deletes R2 first, then marks DB trash as purged.
- If R2 delete fails, DB purge completion is not marked and failure metadata is recorded.

## Fixture Boundary

Normal lifecycle fixtures A~G are realistic attachment/R2 fixtures. Their `exact_size_bytes` must match:

1. generated local file byte length,
2. future R2 object byte length,
3. DB `attachments.size_bytes` or `attachment_trash_items.size_bytes`,
4. storage usage reconciliation totals.

Capacity boundary fixtures H~J are separate. They are not normal R2 objects and must not be used to hide arbitrary snapshot-only storage values in normal fixture validation.

## Guard Boundary

Future mutating modes require all of the following before any actual execution:

- non-production runtime in the dev/test allowlist,
- approved Neon DB fingerprint,
- approved dev/test Worker URL or Worker host fingerprint,
- `WAFL_FUNCTIONS_TEST_PREFIX=wafl-fn`,
- `WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION=1`,
- exact `WAFL_SIMULATOR_ATTACHMENT_CONFIRM`,
- exact manifest attachment IDs and R2 keys only.

Production DB/R2 mutation remains blocked.

The simulator does not use `@aws-sdk/client-s3`, direct R2 S3 endpoints, `HEAD`, or prefix `LIST` for attachment lifecycle verification. It signs exact-key Worker URLs with the same shared HMAC helper used by `lib/storage/r2/r2WorkerUpload.ts`.

## PowerShell Menu Registry

- 34: Simulator Attachment Plan, read-only, no DB mutation, no R2 mutation, production blocked by command guard if promoted.
- 35: Simulator Attachment Local Generate, local `.tmp` file creation only, no DB/R2 mutation.
- 36: Simulator Attachment Upload+Seed, DEV/TEST DB/R2 mutation boundary through signed Worker `PUT`/`GET`, confirmation `UPLOAD SEED WAF-FN ATTACHMENTS`, production blocked.
- 37: Simulator Attachment Verify+Reconcile, read-only DB plus signed Worker `GET`, no DB/R2 mutation.
- 38: Simulator Attachment Lifecycle Test, DEV/TEST recoverable mutation boundary, confirmation `RUN WAF-FN ATTACHMENT LIFECYCLE`, production blocked.
- 39: Simulator Attachment Cleanup, destructive DEV/TEST boundary, confirmation `CLEAN WAF-FN ATTACHMENTS`, production blocked.
- 40: Simulator Attachment Fault Plan, read-only, no DB/R2 mutation.
- 41: Simulator Attachment Fault Execute, separate fault fixture boundary, confirmation `CREATE WAF-FN ATTACHMENT FAULTS`, production blocked.

## Required Preflight Before Actual Dev/Test Execution

Before any actual dev/test Neon/R2 execution, report and wait for separate approval:

- target runtime,
- Neon fingerprint,
- Worker URL fingerprint or approved Worker host fingerprint,
- target company count,
- target workorder count,
- generated file count,
- expected total byte count,
- simulator prefix,
- DB mutation range,
- R2 mutation range,
- cleanup range,
- confirmation string,
- partial failure resume, rollback, and compensation method.

## Reconciliation Scope

0.24.24.1 reconciliation is manifest-scoped, not bucket-scoped. It compares only:

- canonical normal manifest exact R2 keys,
- canonical fault manifest exact R2 keys when the separately approved fault flow is used,
- manifest attachment IDs,
- manifest trash IDs,
- manifest storage snapshot company IDs.

The command must not claim that the whole bucket has zero unregistered objects. Without a Worker prefix `LIST` endpoint in this version, orphan detection is limited to explicitly declared normal and fault manifest keys.

## Remaining Risk

Representative design uniqueness is currently enforced by repository behavior and contract checks, not by a DB unique constraint. Adding a DB constraint or transaction-level repository change would be a separate DB authority/migration boundary and was not executed in this version.

## Pre-execution Target Correction

The first approved dev/test upload-seed attempt stopped before R2 upload or DB mutation because the canonical attachment manifest referenced `wafl-fn-company-c-workorder-00001`.

Menu 21 `Simulator DB Seed Execute` uses `tests/fixtures/functions/company-scenarios.json` as its fixture source. In that source, `wafl-fn-company-c` is the approval-pending empty company and intentionally has `workorders: 0`. The missing workorder was therefore a manifest/seed-source mismatch, not a Neon seed execution failure.

Correction:

- Keep company C as an empty/pending normal scenario.
- Move the multi-design candidate attachment fixture to `wafl-fn-company-b-workorder-00002`, which is generated by Menu 21.
- Keep the R2 upload-before-DB-target validation guard.
- Add a manifest contract that validates every attachment workorder reference against the Menu 21 company scenario fixture and its generated workorder ID range.

Actual R2 upload, Neon attachment seed, lifecycle mutation, cleanup, and fault fixture creation remain unexecuted until separately approved.

## Dev/Test Upload Seed Execution

The separately approved Worker-based upload/seed step was executed against the approved dev/test targets only.

Preflight evidence:

- Runtime: `development`
- Neon fingerprint: `01e5dcc7fea3`
- Worker URL fingerprint: `b49fb0bd3ff1`
- Worker host fingerprint: `446bdb61c239`
- Worker URL and host fingerprints: exact match
- Production-like Worker URL pattern: blocked / not detected
- Manifest file count: 12
- Manifest byte total: 2,580,480

Execution result:

- Local fixtures generated: 12 files / 2,580,480 bytes
- Signed Worker PUT: 12 success / 0 failed
- Signed Worker GET: 12 success / 0 failed
- Byte mismatch: 0
- Content-Type mismatch: 0
- DB `attachments` rows: 12
- DB `attachment_trash_items` rows: 1
- Storage snapshot rows: 7
- Missing DB rows: 0
- Missing Worker objects: 0
- Representative duplicate count: 0
- Manifest-scoped reconciliation issues: 0
- Partial failure: none
- Compensation cleanup required: no

This execution did not run representative lifecycle changes, additional soft delete, restore, permanent delete, cleanup, fault fixture creation, DB schema migration, production access, or Cloudflare Worker code changes.
