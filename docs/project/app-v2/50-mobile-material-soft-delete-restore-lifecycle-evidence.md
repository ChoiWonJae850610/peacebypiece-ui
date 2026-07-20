# WAFL v2 Mobile Material Soft-delete and Restore Lifecycle Evidence

## Result and boundary

- Baseline: `2.0.0-alpha.50` at `20590dd8ff38df0d90981a3278b0e5edc87a7fc8` on synchronized, clean `master`.
- Result: `2.0.0-alpha.51`.
- Status: `ALPHA51_MOBILE_MATERIAL_SOFT_DELETE_RESTORE_LIFECYCLE_COMPLETE` after every delivery gate passes.
- Scope: draft fabric-line archive/restore lifecycle, active/archived Read visibility, concurrency, receipt/event evidence, mobile confirmation and recovery, and exact dev/test migration/runtime proof.
- HTTP DELETE, physical row removal, purge, material order Commands, production migration, native dependency, and EAS Build/Update remain excluded.

## Schema and migration

- Migration `013_v2_material_line_archive_lifecycle.sql` adds only `archived_at`, `archived_by_member_id`, their tenant/member integrity constraint, and bounded active/archived partial indexes.
- Existing material rows remain active. Material identity, entity version, values, and sort order are not rewritten by the migration.
- Exact approved dev/test apply ran once: ledger `12/12 -> 13/13`, schema `+2` columns, `+2` constraints, and `+2` indexes; business-row mutation was `0`.
- The post-apply read-only audit passed at ledger `13/13`, with existing archived rows `0`. Production apply, rollback, cleanup, and automatic reapply were `0`.
- Apply and post-audit logs are exact-hash/marker bound by the approved-applied migration guard. The full database fingerprint and credentials are not tracked.

## Command, visibility, and history boundary

- Archive and restore use explicit POST command routes. `expectedVersion`, draft WorkOrder/revision, `workorder.update`, exact tenant/company/material identity, editing material status, dev/test approval, and production blocking are mandatory.
- Archive keeps the physical row and identity, increments material/WorkOrder/revision versions, records actor/time metadata, emits one event and one receipt, and excludes the row from active material Read and current draft totals/counts.
- Restore clears lifecycle metadata on the same row, preserves all values and sort order, increments the same versions, emits one event and one receipt, and returns the row to active Read and totals/counts.
- Requested, completed, and cancelled material-order states cannot be archived. Non-draft WorkOrders cannot archive or restore. Repeated or stale lifecycle commands return HTTP `409` with mutation delta `0`.
- Active Read excludes archived rows; explicit archived Read excludes active rows. Omitted lifecycle defaults to active; only `active` and `archived` are accepted. Unknown and duplicate query parameters remain HTTP `400`.
- Current draft list counts, issue readiness, preview input, and total recalculation exclude archived rows. Existing issued/finalized snapshots, generated documents, and historical receipts are not rewritten.
- HTTP DELETE remains absent and blocked. Order request/cancel/complete routes remain blocked in the alpha.51 runner.

## Mobile behavior

- The alpha.48 compact material card and alpha.50 editor remain the presentation and editing baseline.
- Draft active cards expose a recoverable delete action. Confirmation states that the material moves to deleted materials and can be restored; it does not claim physical removal.
- Successful archive/restore is followed by canonical detail, active-material, and archived-material GETs. The UI does not treat optimistic state alone as success.
- A bounded, collapsed `삭제된 원단 N개` section shows archived name, color, quantity, and recovery state. Archived cards expose restore only; edit and order handlers are absent.
- Restored rows return to the active list with the same identity, field values, and sort order. Non-draft cards expose no archive/restore handler.
- Existing dirty-guard continue/discard behavior runs before lifecycle navigation. Automatic save, automatic retry, polling, and duplicate-submit loops remain `0`.

## Runtime findings and correction

- The first Runtime Read exposed a real query-contract defect: the service parsed `lifecycle` but the materials allowlist rejected it. No lifecycle mutation had run. The allowlist was corrected to exact `type`, `lifecycle`, `limit`, and `cursor`, with duplicate and unknown keys still rejected.
- A pre-Verify invocation selected Node `v20.20.2` and failed only the `.mts` renderer smoke. The same fingerprint passed when the canonical Node `v24.14.0` path was injected process-locally; no system PATH or tracked Node configuration changed.
- Mutation-free Runtime preflight then passed auth/me, Company A context, detail, omitted-lifecycle active default, explicit active/archived Read, unknown-lifecycle HTTP `400`, and ledger `13/13`, with all business deltas `0`.

## Bounded Runtime effects

Two complete archive/restore pairs were intentionally performed on the retained QA draft: one Codex bounded preflight pair and one owner iPhone QA pair.

| Effect from alpha.50 baseline | Actual |
| --- | ---: |
| archive success | 2 |
| restore success | 2 |
| WorkOrder version delta | +4 |
| revision version delta | +4 |
| material row delta | 0 |
| material version-sum delta | +4 |
| command receipt delta | +4 |
| domain event delta | +4 |
| stale lifecycle request | 1, HTTP 409, mutation 0 |
| non-draft archive | 1, HTTP 409, mutation 0 |
| hard DELETE request | 1, blocked HTTP 404, mutation 0 |
| order request/cancel/complete | 0 |

The final QA material is restored and active, archived-row count returns to `0`, and the same row, values, and sort order remain. Generated-document and token deltas are `0`; R2/PDF, production, native, and EAS operations are `0`.

## Physical iPhone QA

The owner verified on external cellular with Tailscale and one Reload:

- automatic developer connection passed with connection-code input `0`;
- the retained draft opened and dirty-guard continue editing, discard changes, retained stored values, and unsaved-new-editor cancellation passed without saving;
- archive confirmation, exactly one archive, active-list removal, deleted-material count/section, preserved archived information, and absence of archived edit/order controls passed;
- exactly one restore returned the same material once, with all values and original position preserved after list re-entry;
- non-draft add/edit/archive/restore remained blocked;
- background/re-entry passed, save-button use and extra archive/restore were `0`, and crash, red screen, infinite loading, and other anomalies were absent.

## Runtime teardown and validation

- Final canonical stop ended the four exact runner-owned processes. State is stopped, Serve ownership is released, Serve config is empty, `AllowFunnel: true` count is `0`, ports 3000/3100/8081 have listeners `0/0/0`, and Tailscale remains Running.
- Ownership skip, PID-reuse termination, unrelated process termination, broad process kill, and reset are `0`.
- Alpha.51 lifecycle migration/API/mobile contracts, alpha.26 and alpha.44-alpha.50 regressions, targeted ESLint, root/mobile TypeScript, Next production build, Expo config/install/Doctor, Unicode, mutation audit, and canonical `automation-infrastructure` Verify are final gates.
- The final fingerprint, contract total, commit, push, Source ZIP, and matching repo-state identities are owned by the final workflow output and repo-state.

## Deferred boundary

- Alpha.52 candidate: material order request/cancel/complete Commands with their own permission, state, receipt/event, conflict, and device QA Delta.
- Purge and hard DELETE remain unimplemented until a separate retention policy explicitly authorizes them.
- Interaction-ledger observability remains a separate future infrastructure Delta only if attribution ambiguity recurs.
