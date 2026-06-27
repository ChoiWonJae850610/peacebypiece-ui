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

## UI Trash Fixture Placement Correction Plan

Manual UI QA after the Worker-based upload/seed showed that the trash fixture was not reachable from the customer UI because it was placed on `wafl-fn-company-e`.

Read-only verification confirmed:

- `wafl-fn-company-e` is intentionally inactive/suspended:
  - `companies.is_active = false`
  - subscription status `suspended`
  - billing status `past-due`
  - member status `suspended`
  - linked user inactive
- `wafl-fn-company-g` is active/approved and switchable for UI verification:
  - `companies.is_active = true`
  - subscription status `active`
  - billing status `active`
  - member status `approved`
  - linked user active
- Existing E fixture rows:
  - attachment `wafl-fn-company-e-attachment-image-001`, active, 131,072 bytes
  - attachment `wafl-fn-company-e-attachment-trash-001`, trashed, 262,144 bytes
  - trash row `wafl-fn-company-e-attachment-trash-001-trash`
  - snapshot used bytes 393,216
- Existing E Worker objects:
  - `companies/wafl-fn-company-e/workorders/wafl-fn-company-e-workorder-00001/attachments/e-active-image.png`
  - `companies/wafl-fn-company-e/workorders/wafl-fn-company-e-workorder-00001/attachments/e-trash-reference.pdf`
- Existing G fixture rows:
  - `wafl-fn-company-g-attachment-001` on `wafl-fn-company-g-workorder-00001`
  - `wafl-fn-company-g-attachment-002` on `wafl-fn-company-g-workorder-00002`
  - snapshot used bytes 655,360

Canonical manifest correction:

- Company E is now an empty suspended-company scenario with no normal attachment/trash fixture.
- The UI trash fixture moves to company G:
  - workorder `wafl-fn-company-g-workorder-00003`
  - attachment `wafl-fn-company-g-attachment-trash-001`
  - trash row `wafl-fn-company-g-attachment-trash-001-trash`
  - filename `g-trash-reference.pdf`
  - key `companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00003/attachments/g-trash-reference.pdf`
  - bytes 262,144

Expected bytes after the separately approved repair:

- E active/trash/total: 0 / 0 / 0
- G active/trash/total: 655,360 / 262,144 / 917,504

Repair command boundary:

- Command: `node tools/simulator/commands/attachment-lifecycle.mjs --mode=repair-e-to-g --execute`
- Confirmation: `REPAIR WAF-FN ATTACHMENTS E TO G`
- The repair command is dev/test guarded by runtime, Neon fingerprint, Worker URL fingerprint, Worker host fingerprint, simulator prefix, exact-key scope, and confirmation string.
- It must PUT and verify only the new G trash key, seed canonical manifest metadata/snapshots, DELETE only the two legacy E exact keys, verify GET 404, remove only legacy E attachment/trash rows, reset E snapshot to 0, then run manifest-scoped reconciliation.
- Actual repair mutation was not executed in the code/contract phase.

## Dev/Test E To G Repair Execution

The separately approved E to G repair was executed against the approved dev/test Neon and Worker/R2 targets only.

Preflight evidence:

- Runtime: `development`
- Neon fingerprint: `01e5dcc7fea3`
- Worker URL fingerprint: `b49fb0bd3ff1`
- Worker host fingerprint: `446bdb61c239`
- Worker URL and host fingerprints: exact match
- Production-like Worker URL pattern: blocked / not detected
- Confirmation: `REPAIR WAF-FN ATTACHMENTS E TO G`

Execution result:

- New G local fixture generated: 1 file / 262,144 bytes
- New G signed Worker PUT: 1 success / 0 failed
- New G signed Worker GET: 1 success / 0 failed
- New G byte mismatch: 0
- New G Content-Type mismatch: 0
- New G attachment row: `wafl-fn-company-g-attachment-trash-001`
- New G trash row: `wafl-fn-company-g-attachment-trash-001-trash`
- New G exact key: `companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00003/attachments/g-trash-reference.pdf`
- Legacy E exact Worker DELETE: 2 success / 0 failed
- Legacy E deleted keys:
  - `companies/wafl-fn-company-e/workorders/wafl-fn-company-e-workorder-00001/attachments/e-active-image.png`
  - `companies/wafl-fn-company-e/workorders/wafl-fn-company-e-workorder-00001/attachments/e-trash-reference.pdf`
- Legacy E deleted attachment rows:
  - `wafl-fn-company-e-attachment-image-001`
  - `wafl-fn-company-e-attachment-trash-001`
- Legacy E deleted trash row: `wafl-fn-company-e-attachment-trash-001-trash`
- E final active/trash/total bytes: 0 / 0 / 0
- G final active/trash/total bytes: 655,360 / 262,144 / 917,504
- E snapshot used bytes: 0
- G snapshot used bytes: 917,504
- G trash row status: `pending`, `restored_at NULL`, `purged_at NULL`
- Missing object/row: 0
- Byte mismatch: 0
- Content-Type mismatch: 0
- Manifest-scoped reconciliation issues: 0
- Partial failure: none
- Compensation cleanup required: no

This repair did not run general lifecycle scenarios, restore, permanent delete, fault fixtures, whole cleanup, production access, DB migration, or Cloudflare Worker code changes.

## Valid File Fixture Correction Plan

Manual UI QA after restore confirmed that `g-trash-reference.pdf` is present in DB/R2 and Worker signed GET returns `200`, `262,144` bytes, and `application/pdf`, but browser PDF viewer and local PDF readers cannot open the downloaded file. The same generator pattern also affected image fixture validity because it optimized for exact byte count rather than complete file format structure.

Root cause:

- The previous simulator attachment generator repeated a short `%PDF...%%EOF` byte fragment until `exact_size_bytes` was reached.
- That produced the expected byte count but not a single valid PDF document with a coherent xref table and `startxref`.
- PNG/JPEG image fixtures must also be generated as complete files, not by repeating sample bytes to fill the target size.

Canonical materialized file scope:

- Total files: 11
- Total bytes: 2,449,408
- MIME counts:
  - `image/png`: 7
  - `image/jpeg`: 1
  - `application/pdf`: 3

Code-only correction:

- PDF fixtures are now generated as exact-size valid PDF documents:
  - `%PDF-1.4` header
  - catalog/pages/page/font objects
  - content stream with deterministic padding
  - xref table
  - trailer
  - valid `startxref`
  - final `%%EOF`
- PNG fixtures are now generated as exact-size valid PNG files:
  - PNG signature
  - IHDR
  - IDAT
  - deterministic `tEXt` padding chunk
  - IEND
  - valid CRC for each chunk
- JPEG fixtures are now generated as exact-size valid JPEG files:
  - SOI/EOI markers
  - baseline JPEG structure from a minimal decodable image
  - deterministic COM padding segments
  - SOF/SOS structure validation
- `mime_type` and `exact_size_bytes` remain unchanged.
- DB schema, Worker API, preview UI, and canonical keys are unchanged.

Dev/test correction required before UI retest:

- Replace all current canonical normal lifecycle materialized exact Worker/R2 objects with regenerated valid file bytes.
- Target exact keys:
  - `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00001/design/b-main-design.png`
  - `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00001/attachments/b-detail-image.jpg`
  - `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/b-candidate-design-a.png`
  - `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/b-candidate-design-b.png`
  - `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/b-candidate-design-c.png`
  - `companies/wafl-fn-company-d/workorders/wafl-fn-company-d-workorder-00001/design/d-artwork.png`
  - `companies/wafl-fn-company-d/workorders/wafl-fn-company-d-workorder-00001/attachments/d-spec-reference.pdf`
  - `companies/wafl-fn-company-f/workorders/wafl-fn-company-f-workorder-00001/design/f-restored-design.png`
  - `companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00001/attachments/g-first-workorder.pdf`
  - `companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00002/attachments/g-second-workorder.png`
  - `companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00003/attachments/g-trash-reference.pdf`
- Excludes fault fixtures, E legacy keys, capacity-only fixtures, and manifest-external keys.
- Each replacement must keep the same exact byte length and Content-Type as the manifest.
- No DB row update is required because `size_bytes`, `storage_key`, lifecycle state, trash state, representative state, and storage snapshots remain valid when the remote object bytes keep the same length.
- No schema migration, restore rerun, seed rerun, cleanup, permanent delete, fault fixture, or Cloudflare Worker deployment is required.

Repair mode:

- Command: `node tools/simulator/commands/attachment-lifecycle.mjs --mode=replace-valid-file-fixtures --execute`
- Confirmation: `REPLACE WAF-FN VALID FILE FIXTURES`
- Behavior:
  - generate all canonical materialized local fixtures
  - validate local byte length and file format
  - signed Worker PUT to each exact manifest key
  - signed Worker GET from each exact manifest key
  - validate HTTP 200, byte length, Content-Type, and remote file format
  - do not update DB rows, trash rows, snapshots, representative status, restore status, or cleanup state
- Partial failure:
  - report per-key PUT/GET/format status
  - do not hide partially replaced keys
  - idempotent rerun of the same mode can normalize all exact manifest keys again
  - no broad prefix delete or DB cleanup is involved

Actual Worker PUT mutation is not approved in this code/contract phase. Before execution, a separate approval must confirm:

- runtime
- Neon fingerprint if a read-only DB existence check is included
- Worker URL fingerprint
- Worker host fingerprint
- exact key
- local regenerated byte count
- Content-Type
- confirmation string
- compensation method if PUT or GET verification fails

Confirmation string:

- `REPLACE WAF-FN VALID FILE FIXTURES`

## Scenario Status Matrix Before Valid-File Replacement

Status legend:

- Complete: code, contract, and the latest approved dev/test evidence are aligned.
- Partial complete: foundation exists, but a later lifecycle mutation or UI confirmation is still pending.
- Not executed: explicit dev/test mutation has not been approved or run.
- User UI confirmation needed: automated evidence is not enough because the scenario is visual or browser-behavior dependent.

File generation and lookup:

| Item | Status | Evidence / remaining boundary |
|---|---|---|
| Valid PNG generation | Complete | Local generator now creates exact-size PNG files with PNG signature, IHDR, IDAT, padding chunk, IEND, and valid CRC. |
| Valid JPEG generation | Complete | Local generator now creates exact-size JPEG files with SOI/EOI, SOF/SOS, and deterministic COM padding. |
| Valid PDF generation | Complete | Local generator now creates exact-size PDF files with catalog/page objects, xref, trailer, startxref, and EOF. |
| Worker PUT | Partial complete | Initial upload/seed and E-to-G repair PUT succeeded previously. Valid-file replacement PUT for the current 11 canonical keys is not executed. |
| Worker GET | Partial complete | Prior GET byte/type checks passed, but current remote objects still need valid-file replacement and GET format verification. |
| Byte length match | Partial complete | Existing DB/R2 byte counts matched. Replacement mode keeps the same `exact_size_bytes` and must verify all 11 remote bytes again. |
| Content-Type match | Partial complete | Existing Content-Type checks passed. Replacement mode must reverify all 11 remote Content-Type values after overwrite. |
| Image preview | User UI confirmation needed | Valid PNG/JPEG local contracts pass; remote replacement and browser UI retest are still pending. |
| PDF preview | User UI confirmation needed | Existing G PDF was byte-valid but not PDF-valid. Valid PDF generator is ready; remote replacement and browser PDF retest are pending. |
| File download | User UI confirmation needed | Download path worked for byte transport, but downloaded PDF validity depends on valid-file replacement. |
| Workorder attachment display | Partial complete | Restore/listing code was fixed and committed in `c2751ef6`; G UI confirmation showed storage/list behavior, but file preview retest remains. |
| General attachment vs design classification | Partial complete | Manifest and DB rows distinguish `file` and `design`; representative lifecycle mutations are not fully executed. |

Representative design:

| Item | Status | Evidence / remaining boundary |
|---|---|---|
| First representative design assignment | Partial complete | Seeded manifest includes representative designs for B/D/F; explicit lifecycle scenario is still pending. |
| Design A to B representative change | Not executed | Requires separately approved lifecycle mutation. |
| Previous representative auto-clear | Not executed | Requires separately approved lifecycle mutation. |
| Max one active representative per workorder | Partial complete | Manifest-scoped reconciliation reports no duplicates; DB constraint migration was not added. |
| Representative design list/detail display | User UI confirmation needed | Data exists for B/D/F after upload/repair, but UI verification is separate. |
| Representative design trash move | Not executed | Requires lifecycle mutation. |
| Representative deletion fallback/no-representative policy | Not executed | Requires lifecycle mutation and policy confirmation if behavior is ambiguous. |
| Restore representative conflict prevention | Not executed | Requires lifecycle mutation. |
| User reselects restored design as representative | Not executed | Requires lifecycle mutation and UI confirmation. |

Trash and restore:

| Item | Status | Evidence / remaining boundary |
|---|---|---|
| General file soft delete | Not executed | Normal lifecycle soft-delete scenario is still pending. |
| Immediate exclusion from normal list | Partial complete | Repository/listing conditions were fixed; broad soft-delete scenario has not been run. |
| Trash list display | Complete | User confirmed G trash file is visible. |
| Trash file included in usage | Complete | User confirmed `896KB`, matching `917,504` bytes. |
| Trash file open/download | Partial complete | Worker GET/download transport works; PDF validity needs replacement and UI retest. |
| Restore | Partial complete | User clicked restore; code was fixed afterward. A clean retest after valid-file replacement is still needed. |
| Exclude from trash after restore | Partial complete | Restore repository and state refresh were fixed; retest pending. |
| Show restored file on original workorder | Partial complete | Attachment refresh/listing fix was committed; retest pending. |
| Same-tab immediate refresh | Partial complete | `attachmentRefreshEvents` and state refresh were fixed; retest pending. |
| Other-tab storage event refresh | Partial complete | Cross-tab refresh helper was added; retest pending. |
| No R2 reupload on restore | Complete | Restore path updates DB metadata only; R2 object remains in place. |
| Storage total remains unchanged on restore | Complete | Policy keeps R2 object and byte total; no file-size change occurs. |
| Active/trash breakdown refresh | Partial complete | Code path fixed; UI retest pending. |

Permanent delete:

| Item | Status | Evidence / remaining boundary |
|---|---|---|
| Permanent delete request | Not executed | Requires separate approval. |
| Worker exact key DELETE | Not executed | E legacy repair DELETE succeeded, but normal permanent-delete scenario has not run. |
| GET 404 after delete | Not executed | E legacy repair verified deletion; normal scenario is pending. |
| DB purge only after R2 delete success | Partial complete | Code contract enforces R2-first purge; normal scenario is pending. |
| No DB metadata pre-delete on R2 failure | Partial complete | Code contract enforces failure recording; fault scenario pending. |
| Attachment/trash metadata cleanup | Not executed | Requires permanent-delete scenario. |
| Storage usage decrease | Not executed | Requires permanent-delete scenario. |
| Snapshot recalculation | Not executed | Requires permanent-delete scenario. |
| Final reconciliation issue 0 | Not executed | Requires permanent-delete scenario. |

Fault fixture:

| Item | Status | Evidence / remaining boundary |
|---|---|---|
| DB-only missing Worker object | Not executed | Fault execute is separately gated and not approved. |
| Worker-only object without DB metadata | Not executed | Fault execute is separately gated and not approved. |
| DB size vs actual object mismatch | Not executed | Fault execute is separately gated and not approved. |
| MIME mismatch | Not executed | Fault execute is separately gated and not approved. |
| Duplicate representative design | Not executed | Fault execute is separately gated and not approved. |
| Trash state mismatch | Not executed | Fault execute is separately gated and not approved. |
| Worker delete failure | Not executed | Fault execute is separately gated and not approved. |
| Fault fixture cleanup | Not executed | Fault cleanup is separately gated and not approved. |

Operations tools:

| Item | Status | Evidence / remaining boundary |
|---|---|---|
| Exact-key cleanup | Partial complete | Cleanup mode is exact-key scoped, but not executed. |
| Fixture count 0 after cleanup | Not executed | Requires cleanup approval. |
| Idempotent regenerate | Complete | Local generate mode is repeatable and exact-size contract-covered. |
| Rerun same mode after partial failure | Partial complete | Replacement and repair modes are designed for idempotent exact-key rerun; remote execution pending. |
| Manifest-scoped reconciliation | Complete | The tool and documentation define manifest-scoped reconciliation. |
| Whole bucket orphan scan not performed | Complete | Scope explicitly excludes bucket-wide orphan claims because Worker LIST is not part of 0.24.24.1. |

## Company A-J Fixture Matrix

Normal lifecycle fixture rows are small, real files with Worker/R2 objects. Capacity fixtures are quota boundary evidence and must not be presented as downloadable multi-GB files.

| Company | State / UI switch | Workorders | DB attachments | Worker objects | Active bytes | Trash bytes | Total bytes | Representative | Trash | Lifecycle purpose | Capacity purpose |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|
| A `wafl-fn-company-a` | active / switchable | 10 | 0 | 0 | 0 | 0 | 0 | No | No | Empty normal company | 0% baseline |
| B `wafl-fn-company-b` | active / switchable | 100 | 5 | 5 | 770,048 | 0 | 770,048 | Yes | No | Representative and candidate designs; JPEG attachment | 5% company-scenario baseline only |
| C `wafl-fn-company-c` | pending / not normal UI switch | 0 | 0 | 0 | 0 | 0 | 0 | No | No | Approval-pending empty company | 15% company-scenario baseline only |
| D `wafl-fn-company-d` | file-rejected / limited | 12 | 2 | 2 | 557,056 | 0 | 557,056 | Yes | No | Mixed image/PDF fixture | 30% company-scenario baseline only |
| E `wafl-fn-company-e` | suspended / blocked | 80 | 0 | 0 | 0 | 0 | 0 | No | No | Suspended company without UI lifecycle file | 50% company-scenario baseline only |
| F `wafl-fn-company-f` | withdrawal-requested / limited | 20 | 1 | 1 | 204,800 | 0 | 204,800 | Yes | No | Restored representative design reference | 70% company-scenario baseline only |
| G `wafl-fn-company-g` | active / switchable | 70 | 3 | 3 | 655,360 | 262,144 | 917,504 | No | Yes | Multi-workorder trash/restore fixture | 90% company-scenario baseline only |
| H `wafl-fn-company-h` | active / switchable | 1,000 | 0 | 0 | 80,530,636,800 | 0 | 80,530,636,800 | No | No | None | Capacity boundary only, no real large R2 object |
| I `wafl-fn-company-i` | active / switchable | 120 | 0 | 0 | 107,374,182,400 | 0 | 107,374,182,400 | No | No | None | 100% capacity boundary only, no real large R2 object |
| J `wafl-fn-company-j` | active / switchable | 160 | 0 | 0 | 11,811,160,064 | 0 | 11,811,160,064 | No | No | None | 110% over-limit boundary only, no real large R2 object |

## Storage Meter Cylinder UI Correction

Problem:

- The previous `WaflStorageUsageMeter` cylinder was narrow and vertically framed, so it could read as a battery, cup, or water tank rather than database storage.
- Very small real usage such as `1022KB / 5.0GB` could round to `0%`, which made the number and visual state feel contradictory.

Correction:

- Keep the shared `WaflStorageUsageMeter` component.
- Render `showCylinder` as a wider database cylinder stack with top and bottom ellipses, layered horizontal disk separators, and a bottom-up fill clipped to the cylinder body.
- Use WAFL theme tokens for surface, border, status fill, and text colors.
- Do not use external images, paid icons, or screen-specific SVG copies.
- Keep administrator main and `/workspace/files` on the same shared component.

Percent policy:

- Visual fill uses `clampPercent(percent)` and clamps to `0..100`.
- Display text uses `formatPercentLabel(percent)`:
  - `0` or invalid -> `0%`
  - `0 < percent < 1` -> `<1%`
  - `1..100` -> rounded integer percent
  - `110` -> `110%` text while the fill remains 100%; the existing status badge carries the over-limit state.
- Remaining capacity labels stay outside the cylinder in the existing details area, so real small usage remains visible even when the percent is `<1%`.

Contract values:

- Storage meter contract covers `0`, `0.02`, `5`, `15`, `30`, `50`, `70`, `90`, `99`, `100`, and `110`.
- It verifies fill clamp, `<1%` display, over-limit display, shared component usage in the admin main and `/workspace/files`, reduced-motion support, and removal of the legacy small water-tank sizing tokens.

Manual UI confirmation still required:

- `/workspace` or customer administrator main: confirm the storage card reads visually as database storage.
- `/workspace/files`: confirm the plan usage card keeps the cylinder shape on desktop and mobile and long capacity labels do not overflow.
- After valid-file replacement PUT is separately approved and executed, confirm image/PDF preview and download again.

## Dev/Test Valid File Fixture Replacement Execution

The separately approved valid-file replacement was executed against the approved dev/test Worker/R2 target only. No DB rows were inserted, updated, or deleted.

Preflight evidence:

- Runtime: `development`
- Neon fingerprint: `01e5dcc7fea3`
- Worker URL fingerprint: `b49fb0bd3ff1`
- Worker host fingerprint: `446bdb61c239`
- Worker URL and host fingerprints: exact match
- Production-like Worker URL pattern: blocked / not detected
- Confirmation: `REPLACE WAF-FN VALID FILE FIXTURES`
- Scope: canonical normal lifecycle materialized exact keys only
- Target files: 11
- Target bytes: 2,449,408
- MIME counts:
  - `image/png`: 7
  - `image/jpeg`: 1
  - `application/pdf`: 3
- Excluded: fault fixtures, E legacy keys, capacity-only fixtures, and manifest-external keys

Execution result:

- Local fixtures generated: 11 files / 2,449,408 bytes
- Local byte/format validation: 11 success / 0 failed
- Signed Worker PUT: 11 success / 0 failed
- Signed Worker GET: 11 success / 0 failed
- Remote byte mismatch: 0
- Remote Content-Type mismatch: 0
- Remote invalid file format:
  - PNG: 0
  - JPEG: 0
  - PDF: 0
- DB mutation executed by replacement mode: no
- DB attachment rows after read-only reconciliation: 11
- DB trash rows after read-only reconciliation: 2
- R2 object count after manifest-scoped reconciliation: 11
- R2 bytes after manifest-scoped reconciliation: 2,449,408
- Missing DB rows: 0
- Missing Worker objects: 0
- Worker transport issues: 0
- Duplicate representative count: 0
- Manifest-scoped reconciliation issues: 0
- Partial failure: none
- Re-run required: no

Replaced exact keys:

- `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00001/design/b-main-design.png`
- `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00001/attachments/b-detail-image.jpg`
- `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/b-candidate-design-a.png`
- `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/b-candidate-design-b.png`
- `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/b-candidate-design-c.png`
- `companies/wafl-fn-company-d/workorders/wafl-fn-company-d-workorder-00001/design/d-artwork.png`
- `companies/wafl-fn-company-d/workorders/wafl-fn-company-d-workorder-00001/attachments/d-spec-reference.pdf`
- `companies/wafl-fn-company-f/workorders/wafl-fn-company-f-workorder-00001/design/f-restored-design.png`
- `companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00001/attachments/g-first-workorder.pdf`
- `companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00002/attachments/g-second-workorder.png`
- `companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00003/attachments/g-trash-reference.pdf`

This execution did not run representative design lifecycle, restore, permanent delete, fault fixtures, whole cleanup, production access, DB migration, or Cloudflare Worker code changes.

## B Company Prefix Audit Follow-Up

User UI/R2 observation:

- Cloudflare R2 UI showed PDF objects under B company workorder attachment folders:
  - `wafl-fn-company-b-workorder-00001/attachments`
  - `wafl-fn-company-b-workorder-00002/attachments`
  - `wafl-fn-company-b-workorder-00099/attachments`
- Those PDF objects were not visible in the app.

Direct S3/R2 LIST status:

- A read-only `ListObjectsV2Command` audit was prepared for exact prefix `companies/wafl-fn-company-b/workorders/`.
- Execution stopped because the direct S3/R2 endpoint path failed during TLS negotiation.
- Error family: `EPROTO / sslv3 alert handshake failure / alert 40`.
- No R2 object was read with GET, created, updated, deleted, copied, listed successfully, or cleaned up.
- No DB row was inserted, updated, deleted, or cleaned up.
- Prefix-wide LIST evidence was not obtained.
- The previous `manifest-scoped reconciliation issues: 0` result remains valid only for canonical manifest exact keys. It was not a bucket-wide or prefix-wide orphan scan and did not prove that manifest-external B prefix objects were absent.

DB-only read-only audit:

- Runtime: `development`
- Neon fingerprint: `01e5dcc7fea3`
- Transaction mode: `BEGIN READ ONLY`
- Query scope: B company `spec_sheets`, `attachments`, and `attachment_trash_items` rows only.
- R2/Worker access: none
- DB mutation: none

DB result summary:

| Workorder | DB workorder exists | DB attachment rows | DB PDF attachment rows | DB trash rows | App attachment visibility from DB |
|---|---:|---:|---:|---:|---|
| `wafl-fn-company-b-workorder-00001` | Yes | 2 | 0 | 0 | Existing JPEG/design PNG rows pass `is_active = true AND deleted_at IS NULL`; no DB PDF row exists. |
| `wafl-fn-company-b-workorder-00002` | Yes | 3 | 0 | 0 | Existing design PNG rows pass `is_active = true AND deleted_at IS NULL`; no DB PDF row exists. |
| `wafl-fn-company-b-workorder-00099` | Yes | 0 | 0 | 0 | No DB attachment row exists, so any R2 object under this workorder is not app-visible. |

Canonical B image metadata:

- `00001/design/b-main-design.png`: DB row exists, active, not deleted.
- `00001/attachments/b-detail-image.jpg`: DB row exists, active, not deleted.
- `00002/design/b-candidate-design-a.png`: DB row exists, active, not deleted.
- `00002/design/b-candidate-design-b.png`: DB row exists, active, not deleted.
- `00002/design/b-candidate-design-c.png`: DB row exists, active, not deleted.

Display-path conclusion:

- `dbAttachmentRepository.listSnapshotsByWorkOrderIds` displays rows matching `order_id = ANY($1::text[]) AND is_active = true AND deleted_at IS NULL`.
- No PDF MIME exclusion was found in the B company attachment hydration path.
- The observed B PDFs are not hidden because of PDF type filtering in the DB hydration query. They are absent from `attachments` and `attachment_trash_items` for the audited B workorders.
- `00099` is a normal seeded DB workorder, but it currently has no DB attachment row. An R2 object under `00099/attachments` would be R2-only/manifest-external from the app's current DB-backed perspective.

## B Company Exact-Key Worker GET Audit

The user provided the three exact PDF keys observed in the Cloudflare R2 UI. A read-only Worker signed `GET` audit was executed against those exact keys only.

Safety:

- Runtime: `development`
- Worker URL fingerprint: `b49fb0bd3ff1`
- Worker host fingerprint: `446bdb61c239`
- Access method: existing signed Worker `GET`
- Direct S3/R2 LIST: not retried
- Worker `PUT`/`DELETE`: not executed
- DB mutation: not executed
- R2 cleanup: not executed

Exact-key results:

| Workorder | Exact key | GET status | Bytes | Content-Type | Last-Modified | SHA-256 | PDF validation | Classification |
|---|---|---:|---:|---|---|---|---|---|
| `00001` | `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00001/attachments/b0ac58b6-19b6-4df3-b74a-9102b997e78f.pdf` | 200 | 2,557,888 | `application/pdf` | not returned by Worker response | `8030b36d458248011d3006b47915a580a629846bf5d6f84a1ecf5f6e67d5c5cf` | valid | R2-only orphan candidate |
| `00002` | `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/attachments/c28be1a3-4d21-4bca-9260-3b334e649004.pdf` | 200 | 2,557,888 | `application/pdf` | not returned by Worker response | `8030b36d458248011d3006b47915a580a629846bf5d6f84a1ecf5f6e67d5c5cf` | valid | R2-only orphan candidate |
| `00099` | `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00099/attachments/0867d8f6-f610-4b17-92c9-0fce20db29ad.pdf` | 200 | 2,557,888 | `application/pdf` | not returned by Worker response | `8030b36d458248011d3006b47915a580a629846bf5d6f84a1ecf5f6e67d5c5cf` | valid | R2-only orphan candidate |

PDF validation details:

- All three files start with `%PDF-`.
- All three files include `%%EOF`.
- All three files include `xref`, `trailer`, `startxref`, `/Type /Catalog`, `/Type /Pages`, and `/Type /Page` signals.
- `pypdf` opened all three files successfully with strict parsing.
- Each file has 3 pages and is not encrypted.
- Page media box: `595 x 841`.
- The first 4KB did not match the repeated-byte/fake-fixture signature used by the previous invalid simulator fixture pattern.
- The three files are byte-for-byte identical.

Observed PDF metadata:

- `/Title`: `4560835309-20201118155735`
- `/Creator`: `4560835309`
- `/Producer`: `SINDOH D411`
- `/CreationDate`: `D:20201118155735Z`
- `/ModDate`: `D:20201118155735Z`

Source investigation:

- The three UUID filenames do not appear in the current repository or Git history.
- They are not canonical normal lifecycle fixture keys.
- They are not fault fixture keys.
- They are not legacy E fixture keys.
- Current app code can create `attachments/{uuid}.pdf` keys through normal workorder attachment upload and generated order-request PDF flows.
- The file metadata looks like a scanned PDF rather than the current simulator valid-file generator output.
- Because the DB has no matching `attachments` or `attachment_trash_items` rows, the most precise current classification is `R2-only orphan candidate / manifest-external object`. Exact creation source remains unproven from repository evidence alone.

Cleanup eligibility:

- These three objects are deletion candidates only after a separate exact-key cleanup approval.
- Any cleanup must target these exact keys only.
- No DB cleanup is needed for these three objects unless a later DB audit finds matching rows.

## A/B Company Attachment Consistency Follow-Up

The A company R2/UI mismatch was audited together with the previous B company orphan investigation. Direct S3/R2 LIST remained blocked and was not retried.

Safety:

- Runtime: `development`
- Neon fingerprint: `01e5dcc7fea3`
- Worker URL fingerprint: `b49fb0bd3ff1`
- Worker host fingerprint: `446bdb61c239`
- DB transaction mode: `BEGIN READ ONLY`
- DB access: `SELECT` only
- Worker access: signed `GET` only for the known A exact key
- Worker `PUT`/`DELETE`: not executed
- R2 cleanup: not executed
- DB mutation: not executed
- Cloudflare Worker code change: not executed

DB read-only result:

| Company | Workorder | DB workorder exists | Attachment rows | Design rows | General file rows | Trash rows | Display conclusion |
|---|---|---:|---:|---:|---:|---:|---|
| A | `wafl-fn-company-a-workorder-00002` | Yes | 0 | 0 | 0 | 0 | No DB row exists for the R2 PNG, so it is not app-visible. |
| A | `wafl-fn-company-a-workorder-00008` | Yes | 1 | 1 | 0 | 0 | The visible item is a design row only; the general attachment count of 0 is expected from DB state. |
| B | `wafl-fn-company-b-workorder-00001` | Yes | 2 | 1 | 1 | 0 | Canonical design and JPEG file rows are visible; the extra PDF exact key has no DB row. |
| B | `wafl-fn-company-b-workorder-00002` | Yes | 3 | 3 | 0 | 0 | Canonical design rows are visible; the extra PDF exact key has no DB row. |
| B | `wafl-fn-company-b-workorder-00099` | Yes | 0 | 0 | 0 | 0 | Workorder exists, but no DB attachment/trash row exists. |

A exact PNG audit:

| Exact key | GET status | Bytes | Content-Type | Last-Modified | SHA-256 | PNG validation | Classification |
|---|---:|---:|---|---|---|---|---|
| `companies/wafl-fn-company-a/workorders/wafl-fn-company-a-workorder-00002/attachments/b9abf894-48b6-4ba6-ba1d-775849e8e2a1.png` | 200 | 129,422 | `image/png` | not returned by Worker response | `705cdd7104cdc1d0cdf58518f70a067c7c46a31bd7793b442db4a79b0e4302ef` | valid | R2-only orphan candidate / manifest-external object |

PNG validation details:

- PNG signature exists.
- `IHDR` and `IEND` chunks exist.
- Chunk CRC validation passed.
- `IDAT` data inflated successfully.
- Decoded scanline length matched the IHDR values.
- IHDR: width `1920`, height `1032`, bit depth `8`, color type `2`, compression `0`, filter `0`, interlace `0`.

A `00008` DB row:

- id: `d3ab91f6-5f06-4b6d-9a65-42ba09add4d2`
- type: `design`
- original_name: `workorder-drawing-2026-06-26T12-41-22-601Z.png`
- storage_key: `companies/wafl-fn-company-a/workorders/wafl-fn-company-a-workorder-00008/design/4fa82c53-977f-4648-82b2-5fb76e3643da.png`
- mime_type: `image/png`
- size_bytes: `40918`
- is_active: `true`
- deleted_at: `NULL`
- is_primary: `true`

UI and code-path conclusion:

- `dbAttachmentRepository.listSnapshotsByWorkOrderIds` reads only active, non-deleted DB rows: `order_id = ANY($1::text[]) AND is_active = true AND deleted_at IS NULL`.
- The repository uses `text[]`, so non-UUID simulator workorder IDs are supported.
- Attachment mapping preserves `storageKey`, proxy `previewUrl`, `thumbnailUrl`, `type`, `scope`, and `isPrimary`.
- `buildAttachmentPanelSections` separates design and general attachment panels by the `scope` values supplied by hydration.
- `WorkOrderAttachmentPanel` renders any row it receives; images render thumbnails/previews and PDFs render file labels.
- No MIME-based exclusion for general PDF/image attachments was found.
- No code defect was found for a normal active DB row. The missing A/B objects are absent because they have no `attachments` or `attachment_trash_items` rows.

Classification:

- A `00002` PNG: R2-only orphan candidate / manifest-external object. It is not a canonical normal fixture, not a fault fixture, and not represented in DB/trash metadata.
- A `00008` visible design: active DB design attachment. The general attachment count of 0 is consistent with DB state.
- B three PDFs: unchanged from the previous audit, R2-only orphan candidates / manifest-external objects.

Cleanup guidance:

- A PNG should not be treated as an immediate deletion target yet because its exact creation source remains unproven.
- B PDFs remain exact-key orphan cleanup candidates, but only under a separate user-approved cleanup action.
- No DB rows should be invented to make R2-only objects visible. The creation source must be established before any data correction.

## A/B Exact Orphan Cleanup Preparation

Additional A PNG source investigation:

- UUID searched: `b9abf894-48b6-4ba6-ba1d-775849e8e2a1`.
- SHA-256 searched: `705cdd7104cdc1d0cdf58518f70a067c7c46a31bd7793b442db4a79b0e4302ef`.
- Size searched: `129422`.
- Current repository search result: no source reference outside this audit document.
- Git history search result: no source reference found for the UUID or SHA-256.
- Local generated/output file search result: no matching 129,422 byte file and no local filename match found.
- Canonical manifest result: not included.
- Fault fixture result: not included.
- DB result: no `attachments` or `attachment_trash_items` row.
- Current app reference result: none found.

Interpretation:

- The A PNG is a valid file and exists in dev/test R2, but validity alone does not prove deletion safety.
- Current evidence does not prove whether the object is a real user upload residue, a simulator/test residue, or a manual R2 upload.
- From the current app's DB-backed attachment contract, it is not referenced and cannot be displayed.
- It should remain a separately approved exact-key cleanup candidate rather than being silently deleted.

Prepared cleanup mode:

- Mode: `--mode=delete-exact-orphan-objects`
- Confirmation: `DELETE WAF-FN A B EXACT ORPHAN OBJECTS`
- Scope: exactly four hard-coded A/B keys only.
- Prohibited by implementation intent: prefix delete, search-result auto-delete, bucket cleanup, DB cleanup, fixture regenerate.
- Expected total delete bytes: `7,803,086`.

Exact cleanup targets:

| Company | Exact key | Expected bytes | Expected MIME | Expected SHA-256 |
|---|---|---:|---|---|
| A | `companies/wafl-fn-company-a/workorders/wafl-fn-company-a-workorder-00002/attachments/b9abf894-48b6-4ba6-ba1d-775849e8e2a1.png` | 129,422 | `image/png` | `705cdd7104cdc1d0cdf58518f70a067c7c46a31bd7793b442db4a79b0e4302ef` |
| B | `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00001/attachments/b0ac58b6-19b6-4df3-b74a-9102b997e78f.pdf` | 2,557,888 | `application/pdf` | `8030b36d458248011d3006b47915a580a629846bf5d6f84a1ecf5f6e67d5c5cf` |
| B | `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/attachments/c28be1a3-4d21-4bca-9260-3b334e649004.pdf` | 2,557,888 | `application/pdf` | `8030b36d458248011d3006b47915a580a629846bf5d6f84a1ecf5f6e67d5c5cf` |
| B | `companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00099/attachments/0867d8f6-f610-4b17-92c9-0fce20db29ad.pdf` | 2,557,888 | `application/pdf` | `8030b36d458248011d3006b47915a580a629846bf5d6f84a1ecf5f6e67d5c5cf` |

Pre-delete guards:

- Runtime must be development/dev/local/test/demo.
- Neon fingerprint must match the approved dev/test fingerprint.
- Worker URL and host fingerprints must match the approved dev/test fingerprints.
- Each exact key must be in the hard-coded allowlist.
- Each exact key must pass signed Worker `GET 200`.
- Worker GET bytes must equal the expected byte length.
- Worker GET Content-Type must equal the expected MIME.
- Worker GET SHA-256 must equal the expected SHA-256.
- DB `attachments` row count must be 0 for all four storage keys.
- DB `attachment_trash_items` row count must be 0 for all four storage keys.
- The keys must not be included in the canonical normal lifecycle manifest.
- Any mismatch stops the entire delete before a Worker `DELETE`.

Post-delete verification plan after separate approval:

1. Delete exactly the four keys with signed Worker `DELETE`.
2. For each key, signed Worker `GET` must return 404/not-found.
3. DB matching row counts must remain 0.
4. Canonical manifest reconciliation must remain issue 0.
5. Report actual deleted object count and deleted bytes.
6. Report DB-backed usage separately from physical R2 bucket bytes because orphan objects were not counted in DB storage snapshots.

Partial failure handling:

- If any pre-delete guard fails, no object is deleted.
- If a DELETE succeeds for some keys and fails for others, report exact success/failure keys.
- Do not perform DB cleanup, prefix cleanup, or bucket cleanup as compensation.
- Re-run the same exact-key mode after fixing the failed condition; already-deleted keys must verify as missing.

Orphan prevention follow-up policy:

- Upload success followed by DB insert failure should roll back the newly uploaded R2 object through exact-key deletion.
- DB insert success followed by response failure should use an idempotency key or deterministic retry contract to avoid duplicate physical objects.
- Add a recurring dev/test orphan audit path that distinguishes DB-backed usage from physical R2 object inventory.
- Keep `manifest-scoped reconciliation` separate from `prefix-wide orphan audit`; never claim bucket-wide orphan zero from manifest-scoped checks.
- Design a safe production inventory/listing path before any production orphan action. This may require a read-only inventory job or audited Worker endpoint, but not broad ad hoc S3 listing.
- User files must not be auto-deleted solely because they are manifest-external. Unknown objects should be quarantined or reported first, with exact-key approval before deletion.
