# Docs Archive Manifest 0.24.11

This manifest tracks the first docs archive cleanup. The first applied batch stayed under the 50 move/delete limit.

## Current Counts After Batch 1

| Metric | Before | After |
| --- | ---: | ---: |
| tracked docs files | 669 | 664 |
| docs root files | 307 | 266 |
| docs/현재기준 files | 28 | 31 |
| docs/보관문서 files | 292 | 325 |
| moved files | 0 | 33 |
| deleted files | 0 | 8 |

## Canonical Documents Updated Or Added

| Canonical document | Purpose |
| --- | --- |
| `docs/현재기준/testing-and-automation.md` | Current Playwright, Functions E2E, PowerShell pipeline, verify-safe, finish-version, and build-fix policy |
| `docs/현재기준/simulator.md` | Current simulator fixture, DB/R2 guard, command, and known deferred work |
| `docs/현재기준/wafl-ui-system.md` | Current WAFL UI catalog, common component, runtime access, and device shape/density policy |
| `docs/codex-current-state.md` | Current handoff source after deleting old Codex handoff |
| `docs/현재기준/README.md` | Index now points to the new current docs |

## Batch 1 Classification

| Group | Classification | Result |
| --- | --- | --- |
| build-fix root docs | `MERGE-THEN-DELETE` | Current build/test policy merged into `testing-and-automation.md`; 7 one-off fix notes deleted |
| Playwright setup/fix docs | `ARCHIVE` | 8 files moved to `docs/보관문서/qa-history/` |
| simulator version docs | `ARCHIVE` | 11 files moved to `docs/보관문서/qa-history/` |
| WAFL UI catalog version docs | `ARCHIVE` | 10 files moved to `docs/보관문서/completed-features/` |
| pipeline version docs | `ARCHIVE` | 4 files moved to `docs/보관문서/qa-history/` |
| past Codex handoff | `MERGE-THEN-DELETE` | Still-current rules merged into `docs/codex-current-state.md`; old handoff deleted |
| already archived WAFL UI/workorder/material-order docs | `KEEP-CURRENT` / `ARCHIVE` | Left in place; workorder/material-order/modal groups are out of scope for this batch |
| DB/auth/permission/policy/PDF docs | `PROTECTED` | Not touched |

## Moved Files

### Playwright To `docs/보관문서/qa-history/`

- `docs/playwright-environment-setup-0.19.90.md`
- `docs/playwright-environment-fix-0.19.90.1.md`
- `docs/playwright-policy-settings-e2e-0.19.91.md`
- `docs/playwright-cookie-and-create-workorder-enter-fix-0.19.92.1.md`
- `docs/playwright-workspace-selector-stabilization-0.19.92.2.md`
- `docs/playwright-workspace-smoke-softening-0.19.92.3.md`
- `docs/functions-core-playwright-foundation-0.23.66.md`
- `docs/functions-responsive-playwright-foundation-0.23.67.md`

### Simulator To `docs/보관문서/qa-history/`

- `docs/project-test-simulator-structure-0.23.72.md`
- `docs/simulator-r2-local-plan-fix-0.23.73.md`
- `docs/simulator-r2-local-cleanup-0.23.74.md`
- `docs/simulator-adapter-plan-foundation-0.23.75.md`
- `docs/simulator-db-seed-adapter-0.23.76.md`
- `docs/simulator-seed-suspension-consistency-fix-0.23.83.md`
- `docs/simulator-onboarding-scenario-fix-0.23.95.md`
- `docs/simulator-user-phone-source-fix-0.23.96.md`
- `docs/simulator-operational-fixture-filter-stats-0.23.98.md`
- `docs/simulator-company-users-idempotent-upsert-0.24.00.md`
- `docs/simulator-category-tree-normalization-0.24.01.md`

### WAFL UI To `docs/보관문서/completed-features/`

- `docs/wafl-ui-catalog-0.20.99.md`
- `docs/wafl-ui-catalog-0.21.00.md`
- `docs/wafl-ui-catalog-0.21.01.md`
- `docs/wafl-ui-catalog-access-debug-0.21.02.md`
- `docs/wafl-ui-catalog-guide-0.21.03.md`
- `docs/wafl-ui-catalog-practice-patterns-0.21.04.md`
- `docs/wafl-ui-catalog-usage-rules-0.21.05.md`
- `docs/wafl-ui-catalog-screen-checklist-0.21.06.md`
- `docs/wafl-ui-catalog-errorfix-0.21.08.md`
- `docs/wafl-ui-device-baseline-0.21.43.md`

### Pipeline To `docs/보관문서/qa-history/`

- `docs/pipeline-repository-config-0.23.77.md`
- `docs/pipeline-download-watcher-split-0.23.84.md`
- `docs/pipeline-background-watcher-0.23.85.md`
- `docs/pipeline-repo-state-publication-fix-0.23.86.md`

## Deleted Files

These were one-off build-fix or handoff notes whose current guidance is now represented in canonical docs and Git history.

- `docs/build-fix-0.20.38.md`
- `docs/build-fix-0.20.44.md`
- `docs/build-fix-0.20.58.md`
- `docs/build-fix-0.20.59.md`
- `docs/build-fix-modal-focus-0.20.62.md`
- `docs/dev-test-console-audit-target-build-fix-0.23.79.md`
- `docs/wafl-list-card-menu-build-fix-0.21.64.md`
- `docs/codex-handoff-0.23.99.md`

## Kept Out Of Scope

- workorder docs
- material-order docs
- modal docs except the build-fix note above
- DB migration, schema, seed, auth, permission, policy, legal, PDF policy docs
- deprecated Cloudflare deploy files
- lockfiles

## Remaining Cleanup Candidates

| Group | Approximate count | Recommended next action |
| --- | ---: | --- |
| workorder | 60 | Merge current policy into `docs/현재기준/작업지시서-상태-구조.md`, then archive version history |
| material-order | 44 | Merge current policy into 원단/부자재 current docs, then archive |
| modal | 27 remaining | Merge modal/focus current policy into UI system or source rules, then archive |
| billing/storage | 25 | Merge into roadmap/current DB/storage docs, then archive |
| root version reports | about 266 docs root files remain | Move in batches under 50 move/delete operations |

## Reference Policy For Next Batch

1. Run a reference scan before moving or deleting.
2. Update `docs/README.md` and this manifest in the same change.
3. Keep each applied batch under the approved move/delete limit.
4. Run `verify-safe.ps1 -Profile repository-cleanup`.
5. Stop if workorder/material-order/modal cleanup would exceed the approved scope.
