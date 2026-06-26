# 0.24.24.1 Simulator Attachment/R2 Lifecycle Integration Audit

Version: 0.24.24.1
Status: non-destructive implementation foundation

## Result Summary

0.24.24.1 creates the simulator attachment/R2 lifecycle foundation needed before any actual dev/test Neon or R2 mutation.

- Canonical manifest added: `tools/simulator/fixtures/attachments/canonical-lifecycle-manifest.json`
- Lifecycle command added: `tools/simulator/commands/attachment-lifecycle.mjs`
- PowerShell menu 34~41 added for attachment plan, local generate, upload/seed, verify, lifecycle, cleanup, and fault boundaries
- Contracts added:
  - `tests/simulator-attachment-manifest-contract.mjs`
  - `tests/simulator-attachment-lifecycle-contract.mjs`
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
- R2 SDK/Worker helpers: `lib/storage/r2/r2Client.ts`, `lib/storage/r2/r2WorkerUpload.ts`

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
- approved R2 account/bucket fingerprint,
- `WAFL_FUNCTIONS_TEST_PREFIX=wafl-fn`,
- `WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION=1`,
- exact `WAFL_SIMULATOR_ATTACHMENT_CONFIRM`,
- exact manifest attachment IDs and R2 keys only.

Production DB/R2 mutation remains blocked.

## PowerShell Menu Registry

- 34: Simulator Attachment Plan, read-only, no DB mutation, no R2 mutation, production blocked by command guard if promoted.
- 35: Simulator Attachment Local Generate, local `.tmp` file creation only, no DB/R2 mutation.
- 36: Simulator Attachment Upload+Seed, DEV/TEST DB/R2 mutation boundary, confirmation `UPLOAD SEED WAF-FN ATTACHMENTS`, production blocked.
- 37: Simulator Attachment Verify+Reconcile, read-only, no DB/R2 mutation.
- 38: Simulator Attachment Lifecycle Test, DEV/TEST recoverable mutation boundary, confirmation `RUN WAF-FN ATTACHMENT LIFECYCLE`, production blocked.
- 39: Simulator Attachment Cleanup, destructive DEV/TEST boundary, confirmation `CLEAN WAF-FN ATTACHMENTS`, production blocked.
- 40: Simulator Attachment Fault Plan, read-only, no DB/R2 mutation.
- 41: Simulator Attachment Fault Execute, separate fault fixture boundary, confirmation `CREATE WAF-FN ATTACHMENT FAULTS`, production blocked.

## Required Preflight Before Actual Dev/Test Execution

Before any actual dev/test Neon/R2 execution, report and wait for separate approval:

- target runtime,
- Neon fingerprint,
- R2 account/bucket fingerprint,
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

## Remaining Risk

Representative design uniqueness is currently enforced by repository behavior and contract checks, not by a DB unique constraint. Adding a DB constraint or transaction-level repository change would be a separate DB authority/migration boundary and was not executed in this version.
