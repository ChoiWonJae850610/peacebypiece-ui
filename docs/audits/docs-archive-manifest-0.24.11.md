# Docs Archive Manifest 0.24.11

This manifest plans the next docs cleanup. It does not move files by itself.

## Archive Targets

| Target | Purpose |
| --- | --- |
| `docs/보관문서/versions/` | Version-specific implementation and completion reports |
| `docs/보관문서/build-fixes/` | Build fix history |
| `docs/보관문서/completed-features/` | Completed feature implementation notes |
| `docs/보관문서/qa-history/` | Playwright, smoke, QA, and contract-test history |
| `docs/보관문서/deprecated/` | Deprecated plans, old handoffs, superseded guidance |

## Manifest Summary

| Group | Count | Canonical current document | Merge target | Archive target | Delete candidates |
| --- | ---: | --- | --- | --- | --- |
| build-fix | 8 | `docs/codex-current-state.md` | `docs/현재기준/리팩토링-규칙.md` | `docs/보관문서/build-fixes/` | none |
| modal | 28 | current component source and `docs/현재기준/소스-구조.md` | `docs/현재기준/리팩토링-규칙.md` | `docs/보관문서/completed-features/` | none |
| workorder | 60 | `docs/현재기준/작업지시서-상태-구조.md` | `docs/현재기준/소스-구조.md` | `docs/보관문서/completed-features/` | none |
| material-order | 44 | `docs/현재기준/원단-부자재-발주-설계.md` | `docs/현재기준/원단-부자재-데이터베이스-설계.md` | `docs/보관문서/completed-features/` | none |
| Playwright | 9 | `playwright.config.mjs` and current tests | `docs/현재기준/리팩토링-규칙.md` | `docs/보관문서/qa-history/` | none |
| simulator | 11 | `tools/simulator/README.md` | `docs/codex-current-state.md` | `docs/보관문서/qa-history/` | none |
| WAFL UI | 13 after duplicate removal | `app/ui/WaflUiCatalogPage.tsx` | `docs/현재기준/소스-구조.md` | `docs/보관문서/completed-features/` | duplicate already removed |
| billing/storage | 25 | `docs/productization-roadmap.md` | `docs/현재기준/데이터베이스-구조.md` | `docs/보관문서/completed-features/` | none |
| past Codex handoff | 1 | `docs/codex-current-state.md` | current state doc | `docs/보관문서/deprecated/` | review after merge |
| root version reports | 304 before this cleanup | `docs/README.md` plus current-state/roadmap | group-specific current docs | `docs/보관문서/versions/` | only exact duplicates after hash/ref check |

## Group Details

### build-fix

Files:

- `docs/build-fix-0.20.38.md`
- `docs/build-fix-0.20.44.md`
- `docs/build-fix-0.20.58.md`
- `docs/build-fix-0.20.59.md`
- `docs/build-fix-modal-focus-0.20.62.md`
- `docs/dev-test-console-audit-target-build-fix-0.23.79.md`
- `docs/wafl-list-card-menu-build-fix-0.21.64.md`
- `docs/보관문서/점검기록/partner-source-cleanup-build-fix-0.18.55.md`

Recommended action: move root files to `docs/보관문서/build-fixes/`. Keep the already archived file where it is unless a later archive normalization pass approves cross-folder moves.

### modal

Files:

- `docs/build-fix-modal-focus-0.20.62.md`
- `docs/drawing-touch-modal-fix-0.20.40.md`
- `docs/ipad-mini-modal-and-mobile-status-cleanup-0.22.01.md`
- `docs/material-order-line-edit-modal-0.21.57.md`
- `docs/mobile-material-order-add-modal-layer-stability-0.22.05.md`
- `docs/mobile-material-order-add-modal-local-input-0.22.04.md`
- `docs/mobile-material-order-add-modal-press-stability-0.22.03.md`
- `docs/mobile-tablet-modal-focus-disable-0.20.54.md`
- `docs/modal-focus-input-policy-0.22.07.md`
- `docs/modal-focus-input-policy-0.22.08.md`
- `docs/modal-layer-touch-policy-0.22.06.md`
- `docs/modal-position-and-mobile-add-stability-0.22.02.md`
- `docs/modal-quantity-and-advanced-drawing-removal-0.21.92.md`
- `docs/modal-validation-and-topbar-cleanup-0.21.90.md`
- `docs/settings-legal-modal-0.20.14.md`
- `docs/tablet-sidepanel-modal-focus-0.20.53.md`
- `docs/tablet-two-panel-modal-state-0.20.52.md`
- `docs/vercel-date-fns-and-ipad-mini-modal-0.21.99.md`
- `docs/wafl-modal-footer-policy-0.21.67.md`
- `docs/wafl-modal-foundation-control-0.21.24.md`
- `docs/wafl-modal-responsive-foundation-0.21.39.md`
- `docs/wafl-modal-row-visual-token-0.21.17.md`
- `docs/wafl-modal-validation-list-width-0.21.66.md`
- `docs/workorder-edit-modal-input-fix-0.20.63.md`
- `docs/workspace-layout-modal-fix-0.20.51.md`
- `docs/workspace-modal-layout-0.20.50.md`
- `docs/보관문서/wafl-a-type/wafl-modal-0.19.41.md`
- `docs/보관문서/점검기록/ui-workorder-modal-select-0.17.99.md`

Recommended action: move root modal history to `docs/보관문서/completed-features/` or `docs/보관문서/qa-history/` depending on whether the document is implementation or verification history.

### workorder

Count: 60. Canonical current references are `docs/현재기준/작업지시서-상태-구조.md`, `docs/현재기준/소스-구조.md`, and active workorder source under `components/workorder/`, `features/workorders/`, and `lib/workorder/`.

Recommended action: archive root workorder version reports to `docs/보관문서/completed-features/`. Keep `docs/현재기준/*workorder*` files in place.

### material-order

Count: 44. Canonical current references are `docs/현재기준/원단-부자재-발주-설계.md`, `docs/현재기준/원단-부자재-데이터베이스-설계.md`, and active source under `features/material-orders/` and `lib/material-orders/`.

Recommended action: archive root material-order version reports to `docs/보관문서/completed-features/`. Keep `docs/현재기준/0.17.16-material-order-readiness.md` and `docs/현재기준/0.17.17-material-order-pending-flow.md` until current-state consolidation is approved.

### Playwright

Files:

- `docs/functions-core-playwright-foundation-0.23.66.md`
- `docs/functions-responsive-playwright-foundation-0.23.67.md`
- `docs/playwright-cookie-and-create-workorder-enter-fix-0.19.92.1.md`
- `docs/playwright-e2e-test-plan-0.19.89.md`
- `docs/playwright-environment-fix-0.19.90.1.md`
- `docs/playwright-environment-setup-0.19.90.md`
- `docs/playwright-policy-settings-e2e-0.19.91.md`
- `docs/playwright-workspace-selector-stabilization-0.19.92.2.md`
- `docs/playwright-workspace-smoke-softening-0.19.92.3.md`

Recommended action: move to `docs/보관문서/qa-history/`. Keep active Playwright behavior in `playwright.config.mjs` and `tests/e2e/`.

### simulator

Files:

- `docs/project-test-simulator-structure-0.23.72.md`
- `docs/simulator-adapter-plan-foundation-0.23.75.md`
- `docs/simulator-category-tree-normalization-0.24.01.md`
- `docs/simulator-company-users-idempotent-upsert-0.24.00.md`
- `docs/simulator-db-seed-adapter-0.23.76.md`
- `docs/simulator-onboarding-scenario-fix-0.23.95.md`
- `docs/simulator-operational-fixture-filter-stats-0.23.98.md`
- `docs/simulator-r2-local-cleanup-0.23.74.md`
- `docs/simulator-r2-local-plan-fix-0.23.73.md`
- `docs/simulator-seed-suspension-consistency-fix-0.23.83.md`
- `docs/simulator-user-phone-source-fix-0.23.96.md`

Recommended action: move root simulator version reports to `docs/보관문서/qa-history/`. Keep `tools/simulator/README.md` as canonical.

### WAFL UI

Files after duplicate removal:

- `docs/wafl-ui-catalog-0.20.99.md`
- `docs/wafl-ui-catalog-0.21.00.md`
- `docs/wafl-ui-catalog-0.21.01.md`
- `docs/wafl-ui-catalog-access-debug-0.21.02.md`
- `docs/wafl-ui-catalog-errorfix-0.21.08.md`
- `docs/wafl-ui-catalog-guide-0.21.03.md`
- `docs/wafl-ui-catalog-practice-patterns-0.21.04.md`
- `docs/wafl-ui-catalog-screen-checklist-0.21.06.md`
- `docs/wafl-ui-catalog-usage-rules-0.21.05.md`
- `docs/wafl-ui-device-baseline-0.21.43.md`
- `docs/보관문서/wafl-a-type/material-order-wafl-ui-0.19.48.md`
- `docs/보관문서/wafl-a-type/wafl-ui-system.md`
- `docs/보관문서/wafl-a-type/workorder-wafl-ui-0.19.46.md`

Recommended action: move root WAFL UI catalog history to `docs/보관문서/completed-features/`. Keep the UI catalog source as canonical.

### billing/storage

Count: 25. Canonical references are `docs/productization-roadmap.md`, billing/storage source under `lib/billing/`, `lib/storage/`, and current system/admin storage screens.

Recommended action: archive root version reports to `docs/보관문서/completed-features/`, while preserving policy/current-state summaries.

### past Codex handoff

File:

- `docs/codex-handoff-0.23.99.md`

Recommended action: merge any still-current lines into `docs/codex-current-state.md`, then move the handoff to `docs/보관문서/deprecated/`.

### root version reports

Root version-specific files before this cleanup: 304. Most should move to `docs/보관문서/versions/` or a more specific archive folder above. Do not delete them in bulk. Exact duplicates may be deleted only after hash and reference checks.

## Reference Policy

Before moving files in the next cleanup:

1. Run a link/reference scan.
2. Update `docs/README.md` to remove direct root links that will move.
3. Move files by explicit manifest paths only.
4. Run `verify-safe.ps1 -Profile repository-cleanup`.
5. Stop if moved/deleted files exceed the approved manifest.
