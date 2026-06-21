# Docs Archive Manifest 0.24.11

This manifest tracks the applied documentation cleanup batches for `APP_VERSION 0.24.11`.

## Current Counts After Batch 2

| Metric | Before batch 1 | After batch 1 | After batch 2 |
| --- | ---: | ---: | ---: |
| tracked docs files | 669 | 664 | 662 |
| docs root files | 307 | 266 | 206 |
| docs/현재기준 files | 28 | 31 | 34 |
| docs/보관문서 files | 292 | 325 | 380 |
| moved files in batch | 0 | 33 | 55 |
| deleted files in batch | 0 | 8 | 5 |

## Canonical Documents Updated Or Added

| Canonical document | Batch | Purpose |
| --- | --- | --- |
| `docs/현재기준/testing-and-automation.md` | 1 | Current Playwright, Functions E2E, PowerShell pipeline, build, and cleanup verification policy |
| `docs/현재기준/simulator.md` | 1 | Current simulator fixture, DB/R2 guard, command, and deferred work |
| `docs/현재기준/wafl-ui-system.md` | 1 | Current WAFL UI catalog, common component, runtime access, and device policy |
| `docs/현재기준/workorder.md` | 2 | Current workorder screen, save, permission, responsive, attachment, and PDF linkage baseline |
| `docs/현재기준/material-order.md` | 2 | Current material-order status, save, allocation, permission, responsive, and PDF preparation baseline |
| `docs/현재기준/modal-and-focus.md` | 2 | Current modal/focus/input policy, resolved approach, remaining reproduction conditions, and deprecated approaches |
| `docs/codex-current-state.md` | 1, 2 | Current handoff source after old handoff and root history consolidation |
| `docs/현재기준/README.md` | 1, 2 | Current baseline docs index |
| `docs/README.md` | 1, 2 | Repository docs index and counts |

## Batch 1 Summary

| Group | Classification | Result |
| --- | --- | --- |
| build-fix root docs | `MERGE-THEN-DELETE` | Current build/test policy merged; 7 one-off fix notes deleted |
| Playwright setup/fix docs | `ARCHIVE` | 8 files moved to `docs/보관문서/qa-history/` |
| simulator version docs | `ARCHIVE` | 11 files moved to `docs/보관문서/qa-history/` |
| WAFL UI catalog version docs | `ARCHIVE` | 10 files moved to `docs/보관문서/completed-features/` |
| pipeline version docs | `ARCHIVE` | 4 files moved to `docs/보관문서/qa-history/` |
| past Codex handoff | `MERGE-THEN-DELETE` | Current guidance merged into `docs/codex-current-state.md`; old handoff deleted |
| DB/auth/permission/policy/PDF docs | `PROTECTED` | Not touched |

## Batch 2 Classification

| Group | Classification | Result |
| --- | --- | --- |
| workorder current policy | `MERGE-THEN-DELETE` / `ARCHIVE` | Current screen/save/permission/responsive/PDF linkage merged into `docs/현재기준/workorder.md`; 25 history files archived |
| material-order current policy | `MERGE-THEN-DELETE` / `ARCHIVE` | Current status/save/allocation/permission/responsive/PDF preparation merged into `docs/현재기준/material-order.md`; 19 history files archived |
| modal/focus current policy | `MERGE-THEN-DELETE` / `ARCHIVE` | Current focus/input/mobile-tablet policy merged into `docs/현재기준/modal-and-focus.md`; 11 QA/history files archived |
| early mobile structure notes | `DELETE-SAFE` | 4 early mobile structure notes deleted after current responsive policy was merged |
| one-off full smoke QA note | `DELETE-SAFE` | 1 one-off QA result deleted; current verification policy is in `testing-and-automation.md` |
| workorder/material-order/PDF policy core docs | `PROTECTED` | PDF policy and DB/schema/auth/permission/legal docs were not changed |

## Batch 2 Moved Files

### Workorder To `docs/보관문서/completed-features/workorder/`

- 25 files moved, including save serialization, immediate field patch, write lock hardening, inventory transaction/result policy, attachment view model refactor, factory instruction, workflow presentation, and workorder/material-order integration history.

Representative files:

- `workorder-save-serialization-0.23.37.md`
- `workorder-write-lock-hardening-0.23.17.md`
- `workorder-inventory-group-transaction-0.23.44.md`
- `workorder-material-order-final-presentation-audit-0.23.29.md`
- `workorder-material-order-async-mutation-cleanup-0.23.50.md`

### Material Order To `docs/보관문서/completed-features/material-order/`

- 19 files moved, including status response fix, collection mutation contract, line immediate persistence, field patch performance, layer refactor, responsive separation, and list/card/allocation UI history.

Representative files:

- `material-order-line-immediate-persistence-0.23.47.md`
- `material-order-collection-mutation-contract-0.23.46.md`
- `material-order-wafl-patch-contract-0.23.45.md`
- `material-order-mutation-serialization-0.23.38.md`
- `material-order-responsive-view-separation-0.23.19.md`

### Modal To `docs/보관문서/qa-history/modal/`

- 11 files moved, including iPad mini modal cleanup, modal focus/input policy, modal touch layer policy, material-order add modal stability, and tablet modal state history.

Representative files:

- `modal-focus-input-policy-0.22.08.md`
- `modal-layer-touch-policy-0.22.06.md`
- `ipad-mini-modal-and-mobile-status-cleanup-0.22.01.md`
- `mobile-material-order-add-modal-press-stability-0.22.03.md`
- `tablet-sidepanel-modal-focus-0.20.53.md`

## Batch 2 Deleted Files

These were one-off early mobile structure or QA notes whose current policy is now represented in canonical docs and Git history.

- `docs/workorder-mobile-structure-0.20.28.md`
- `docs/workorder-mobile-structure-0.20.29.md`
- `docs/material-order-mobile-structure-0.20.30.md`
- `docs/material-order-mobile-structure-0.20.31.md`
- `docs/full-smoke-qa-0.20.09.md`

## Protected Scope

The cleanup did not modify or delete:

- `db/schema/*`
- `db/migrations/*`
- `db/seed/*`
- auth, permission, policy, and legal documents
- PDF policy core documents
- Cloudflare deploy files
- package or lock files
- application feature code
- roadmap and id-control feature code

## Remaining Cleanup Candidates

| Group | Recommended next action |
| --- | --- |
| billing/storage root histories | Merge into current billing/storage docs, then archive or delete one-off notes |
| remaining responsive/UI small patch notes | Merge into `wafl-ui-system.md` and `modal-and-focus.md`, then delete or archive |
| legacy DB smoke/read-only records | Separate protected DB policy from one-off execution logs before touching |
| old version reports | Move valuable summaries to `docs/보관문서/versions/`, delete simple release notes after reference scan |

## Reference Policy For Next Batch

1. Run a reference scan before moving or deleting.
2. Update `docs/README.md`, `docs/현재기준/README.md`, and this manifest in the same change.
3. Keep each applied batch under the approved move/delete limit.
4. Run `approved-workflow.ps1 -Action Verify -Profile repository-cleanup`.
5. Stop if the wrapper reports fingerprint, profile, branch, package/lockfile, migration, secret, or link failures.
