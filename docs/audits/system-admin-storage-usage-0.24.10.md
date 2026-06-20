# System admin storage usage audit 0.24.10

## Scope

0.24.10 narrows the system-admin productization work to the storage usage data path. The previous `lib/billing/storageUsageRepository.ts` implementation kept process-local snapshots and returned a skeleton default summary when no snapshot existed. This patch connects the system storage API to DB metadata and the existing `storage_usage_snapshots` table without schema changes.

## Changed

- `GET /api/system/storage-usage` now reads `attachments` and `attachment_trash_items` metadata for the requested company and returns a DB attachment metadata summary.
- `POST /api/system/storage-usage` now inserts into `storage_usage_snapshots`, which is already used by the system dashboard through latest-snapshot queries.
- Added `tests/system-storage-usage-real-data-contract.mjs` to prevent the system storage repository from regressing to an in-memory array or skeleton summary.
- `APP_VERSION` was bumped from `0.24.09` to `0.24.10`.

## Safety

- No DB/R2/Seed/Reset/Cleanup/Migration command was executed.
- No schema, dependency, package metadata, lockfile, production URL, token, or secret was changed.
- The API remains guarded by `requireSystemAdminScope`.
- R2 inventory reconciliation remains a later productization item; this patch uses DB metadata only.

## Validation

- Static contract added: `tests/system-storage-usage-real-data-contract.mjs`.
- Node-based tests and Next build were not executable in this Codex shell because `node` and `npm` were not available on PATH.
- `git diff --check` should be run after this audit and docs update.

## Follow-up

- Run the full local Windows validation batch where Node is available:
  - `node tests/system-storage-usage-real-data-contract.mjs`
  - `node tests/system-dashboard-real-data-contract.mjs`
  - `node tests/system-billing-real-data-contract.mjs`
  - `node tests/dev-test-context-system-admin-contract.mjs`
  - `npm run build`
  - `npm run audit:wafl-mutations`
- Continue 0.24.10 residual work with real dev/test browser evidence for account switch restore and audit-log visibility.
