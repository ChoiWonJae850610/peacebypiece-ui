# Customer Admin Plan And Storage Audit 0.24.09

## Scope

- Version: `0.24.09`
- Area: customer administrator `/workspace`
- Goal: surface plan, quota, DB metadata usage, and warning state on the customer admin main page without touching production DB/R2 or changing dependency/package metadata.

## Implemented

- Added `lib/admin/dashboard/adminPlanStorageSummary.ts` as a server-only summary builder.
- Added `lib/admin/dashboard/adminPlanStorageSummary.types.ts` for client-safe serialized view-model types.
- Updated `app/(workspace)/workspace/page.tsx` to fetch the plan/storage summary alongside the existing operational dashboard snapshots.
- Updated `components/admin/dashboard/AdminOperationsDashboard.tsx` to render a compact plan/storage panel above the operational queue cards.
- Bumped `APP_VERSION` to `0.24.09`.

## Data Paths

- Subscription state: `lib/billing/companySubscriptionRepository.ts`
- Company file policy: `lib/admin/settings/companyRepository.ts`
- Attachment/trash metadata: `lib/admin/files/serverActions.ts`
- Quota and usage status: `lib/billing/storageQuotaPolicy.ts`

## Safety Notes

- No production DB/R2 access was performed.
- No DB/R2 mutation, Seed, Reset, Cleanup, or Migration was performed.
- No dependency install, dependency update, package metadata change, or lockfile change was performed.
- R2 reconciliation is not newly exposed on the customer admin main page in this version; it remains a later productization item.

## Verification

- Codex sandbox could not run Node because `node` was not on PATH and the bundled WindowsApps Node returned `Access is denied`.
- User local Windows PowerShell validation on the same repository passed:
  - Build: `.\node_modules\.bin\next.cmd build`, Next.js `16.2.1` Turbopack, compiled successfully with static page generation and page optimization complete.
  - Mutation Audit: `node scripts/audit-wafl-mutations.mjs`, `162 finding(s)`, `0 high-risk`. REVIEW items remain, but no high-risk mutation was reported.
  - Contract: `node tests/customer-workspace-compact-dashboard-contract.mjs` passed.
  - Contract: `node tests/functions-storage-contract.mjs` passed.
  - Contract: `node tests/simulator-adapter-plan-contract.mjs` passed.
- E2E tests were not run because this checkpoint used Node build/contracts only and real browser/session coverage remains environment-dependent.
- DB smoke tests were not run because they create rollback fixtures and require DB access; DB/R2/Seed/Reset/Cleanup/Migration work remains explicitly out of scope.

## Status

- Classification: `UPDATE-MERGE`
- Productization readiness impact: customer admin main now has direct DB-backed plan/storage warning evidence, raising readiness from `74%` to `76%`.
- Remaining work: responsive browser QA, system storage productization, and R2 reconciliation display.
