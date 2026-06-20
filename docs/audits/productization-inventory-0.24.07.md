# Productization Inventory 0.24.07

## Executive Summary

0.24.07 surveyed the repository before feature productization work. The result is a versioned inventory and roadmap only. Product code, UI code, DB schema, R2 behavior, PDF Worker code, PowerShell scripts, dependency files, and lockfiles were not changed.

The app is estimated at `72%` productization readiness. This does not replace the older about-`93%` feature implementation/screen skeleton estimate. The two numbers use different standards: the older estimate covered visible feature and screen implementation progress, while `72%` includes mock removal, real data connection evidence, permissions, responsive QA, PDF policy, E2E evidence, and operational safety. The main remaining risk is not basic feature absence, but final evidence: residual mock/sample paths, system storage skeleton code, `/worker` route policy, PDF policy decisions, responsive coverage, and environment-dependent E2E/manual checks.

## Start State

| Check | Result |
|---|---|
| Branch | `master` |
| Baseline HEAD | `1dcccb80b8c2ac94b96c5daa3ea235b5bba4d325` |
| Original APP_VERSION | `0.24.06` |
| Result APP_VERSION | `0.24.07` |
| `package.json` version | `0.5.637`, unchanged |
| Existing uncommitted change before 0.24.07 | `AGENTS.md` from the prior operating-rules update |

## Repository Evidence Read

- `AGENTS.md`
- `docs/codex-current-state.md`
- `docs/audits/repository-documentation-cleanup-0.24.05.md`
- `docs/audits/repository-cleanup-performance-checkpoint-0.24.06.md`
- `tools/pipeline/README.md`
- Recent Git log through `1dcccb80`
- Route tree under `app/`
- Feature directories under `features/`
- Core data, permission, storage, PDF, function, simulator, and test modules under `lib/`, `tests/`, `tools/`, and `cloudflare/`

## Route Inventory

| User type | Routes observed | Classification | Evidence |
|---|---|---|---|
| Public/auth | `/`, `/login`, `/invite/company/[token]`, `/invite/member/[token]`, `/invite/error`, `/pending`, `/service-paused` | Implemented, session or token aware | `app/(public)/*` pages and invitation/auth components |
| System admin | `/system`, `/system/companies`, `/system/account-requests`, `/system/audit-logs`, `/system/billing`, `/system/storage-usage`, `/system/standards/*` | Partial to DB-backed | `app/(system)/system/layout.tsx` calls `requireWaflSessionForArea("system")`; APIs use `requireSystemAdminScope` |
| Customer admin | `/workspace`, `/workspace/settings`, `/workspace/members`, `/workspace/files`, `/workspace/stats`, `/workspace/subscription`, `/workspace/standards` | Mostly DB-backed | Workspace pages call `requireWaflSessionForArea` or `requireWorkspacePagePermission` |
| General workspace user | `/workspace/workorders`, `/workspace/material-orders`, `/workspace/materials`, `/workspace/partners`, `/workspace/legal`, `/me/settings` | DB-backed with permission gates | Workorder/material/partner pages use permission guards and DB/API service modules |
| Legacy/internal worker | `/worker` | Functional but policy incomplete | `app/(workspace)/worker/page.tsx` reads current session and renders `WorkOrderWorkspace` without the `/workspace/workorders` page guard |
| Dev/test | `/functions`, `/dev/test-console`, `/ui` | Runtime and system-admin guarded | `isWaflFunctionsRuntimeAllowed`, `isDevTestContextEnabled`, `isWaflUiCatalogRuntimeAllowed`, active system admin checks |

## Data And Storage Findings

| Area | Finding | Classification |
|---|---|---|
| Plan definitions | `lib/billing/defaultPlans.ts` defines Trial/Starter/Team/Business plan storage/member policies. | KEEP |
| Customer admin storage | `app/api/admin/files/snapshot/route.ts` aggregates DB attachment/trash rows and file policy. | DB-connected |
| System storage | `app/api/system/storage-usage/route.ts` exists, but `lib/billing/storageUsageRepository.ts` uses an in-memory snapshot array and notes skeleton default summary. | Partial, productization required |
| Upload quota | `lib/billing/storageQuotaPolicy.ts` enforces warning/block decisions for upload projection. | KEEP |
| R2 runtime | `lib/storage/r2/*` supports R2 SDK/worker URL/upload/delete helpers. | KEEP, requires environment approval for real use |
| Simulator storage | `tests/fixtures/functions/company-scenarios.json` covers A-J usage percentages including 110% clamp. | KEEP dev/test fixture |

## Permission And Account Findings

| Item | Finding | Remaining risk |
|---|---|---|
| Workspace page guard | `lib/auth/routeGuard.ts` supports area and member permission checks. | Need direct-route denial matrix. |
| Workspace API guard | `lib/auth/apiRouteGuards.ts` validates session, company scope, member status, company access, and optional permission. | Need route coverage audit for every API. |
| System admin | `lib/auth/systemAdminAccess.ts` validates active `system_users` DB row. | Real Google/session proof remains manual. |
| Dev/test account switch | `lib/dev/testContext/*` allowlisted DB targets, original session match, cookie overlay, and audit logging. | Restore/manual browser checks remain. |
| `/worker` | Reads current session but does not call the same page permission guard as `/workspace/workorders`. | Decide redirect, guard, or legacy internal policy. |

## PDF Findings

| PDF scope | Finding | Classification |
|---|---|---|
| Workorder PDF | `app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts` generates, uploads to R2/worker or R2 SDK, and registers attachment. | Partial product-ready, policy pending |
| Workorder HTML/PDF presentation | `lib/workorder/serverOrderRequestPdf.ts`, `lib/generated-documents/order-request/*`, and presentation helpers exist. | KEEP |
| Supplier/material-order PDF | `lib/functions/pdfPolicyCatalog.ts` states final supplier PDF route/data contract is not confirmed. | Feature incomplete |
| PDF policy tests | `tests/functions-pdf-contract.mjs` and `tests/fixtures/functions/pdf-policy-scenarios.json` cover current policy contract. | KEEP, expand after decisions |

## Mock, Sample, Fixture, Fallback Search

| Path or pattern | Reference evidence | Classification | Recommendation |
|---|---|---|---|
| `features/materials/__fixtures__/materialsMock.ts` | Only docs and self-reference found for `materialsMock`, `MATERIAL_SUMMARY_ITEMS`, `MATERIAL_MOCK_ITEMS`. | DELETE-REVIEW | Recheck TypeScript/import graph, dynamic references, tests, scripts, and docs in 0.24.08 before any deletion. Do not promote to DELETE-SAFE from this evidence alone. |
| `lib/data/sample/attachments.ts` | Re-exported by `lib/data/workorderMockData.ts`; uses `lib/data/mock/fixtureI18n.ts`. | DELETE-REVIEW | Do not delete until `workorderMockData` consumers are mapped/replaced. |
| `lib/data/sample/partners.ts`, `lib/data/sample/system.ts` | Tracked sample files; no direct route import found in this pass. | DELETE-REVIEW | Verify dynamic/history usage before deletion. |
| `lib/data/mock/types.ts` | Used by `lib/repositories/workorderRepository.ts` and persistence types. | KEEP/UPDATE-MERGE | Not a safe deletion; repository boundary cleanup needed. |
| `tests/fixtures/functions/*` | Used by functions/storage/pdf/environment contracts and simulator manifest. | KEEP | Dev/test fixture, not product mock. |
| `tools/simulator/fixtures/r2/*` | Used by simulator R2 plan/generate commands. | KEEP | Local-only fixture. |
| `scripts/functions-pdf-mock.mjs` | Package script `test:functions:pdf-mock` references it. | KEEP test tool |
| Placeholder text in UI components | Many occurrences are form placeholders/help text, not mock data. | KEEP | Review only when specific UX copy is targeted. |

## Cleanup Classification

| Path | Class | Evidence | Recommended version |
|---|---|---|---|
| `.next` | GENERATED-LOCAL / GIT-IGNORE | `.gitignore` contains `/.next/`; local Next build output, not product source. | Local cleanup only on explicit request |
| `artifacts` | GENERATED-LOCAL / GIT-IGNORE | `.gitignore` contains `/artifacts/`; local reports/evidence, not product source. | Local cleanup only on explicit request |
| `.tmp` | GENERATED-LOCAL / GIT-IGNORE | `.gitignore` contains `.tmp/`; simulator/temp output, not product source. | Local cleanup only on explicit request |
| `test-results` | GENERATED-LOCAL / GIT-IGNORE | `.gitignore` contains `/test-results/`; Playwright output, not product source. | Local cleanup only on explicit request |
| `playwright-report` | GENERATED-LOCAL / GIT-IGNORE | `.gitignore` contains `/playwright-report/`; Playwright report output, not product source. | Local cleanup only on explicit request |
| root `node_modules` | GENERATED-LOCAL / GIT-IGNORE | `.gitignore` contains `/node_modules/`; dependency install output, not product source. | Never commit; reinstall from lockfile |
| `cloudflare/pdf-generator-worker/node_modules` | GENERATED-LOCAL / GIT-IGNORE | Removed from tracking in 0.24.05; worker dependency install output, not product source. | Never recommit; reinstall with worker lockfile |
| `cloudflare/pdf-generator-worker/.wrangler` | GENERATED-LOCAL / GIT-IGNORE | Ignored explicitly; Wrangler local/deploy output, not product source. | Never commit |
| `pnpm-lock.yaml` | DELETE-REVIEW | No active package script uses pnpm; historical docs mention it. | 0.24.08 only with package-manager approval and no lockfile change surprise |
| `features/materials/__fixtures__/materialsMock.ts` | DELETE-REVIEW | No direct import found, but dynamic/test/script/doc references must still be rechecked. | 0.24.08 |
| `lib/data/sample/*` | DELETE-REVIEW | Some sample path still exported through `workorderMockData`. | 0.24.08 after dependency map |
| Historical docs under `docs/` and `docs/보관문서/` | ARCHIVE/KEEP | Preserved audit value; link churn risk. | Separate docs-index refresh |
| `lib/repositories/*` and `lib/workorder/repository/*` overlap | DELETE-REVIEW / UPDATE-MERGE | Both are actively referenced; overlap may be consolidation work, not direct deletion. | Later focused repository boundary task |
| `cloudflare/pdf-generator-worker.js` and example wrangler file | DELETE-REVIEW | `cloudflare/README.md` marks deprecated, not new deployment baseline; scripts/docs/deploy history still need recheck. | Later after Worker deploy verification |

## Test And Automation Inventory

| Category | Evidence | Current status |
|---|---|---|
| Build | `npm run build` exists. | Not run in 0.24.07; docs/version-only product code change. |
| Lint | `npm run lint` exists. | Not run. |
| Mutation audit | `npm run audit:wafl-mutations` exists and PowerShell menu maps it. | Not run. |
| Functions contracts | `tests/functions-*.mjs` and `/functions` catalog. | Available. |
| Permissions | `npm run test:permissions`, API/page guards. | Available; real DB/session dependent. |
| E2E | Playwright specs under `tests/e2e`. | Available; browser/session environment dependent. |
| Simulator | `simulator:*` dry-run/plan scripts. | Available; execute modes require explicit approval. |
| Seed/cleanup/reset | Dry-run and execute scripts exist. | Execute modes prohibited for this checkpoint. |
| R2 | Plan/generate/local cleanup and reconcile dry-run exist. | Real upload/delete disabled or approval-gated. |
| PowerShell | `tools/pipeline/peacebypiece-auto-pipeline.ps1` maps test/dev commands. | Not changed in 0.24.07. |

## Productization Roadmap Decision

The user's draft roadmap is retained with one clarification: `0.24.08` should not be a broad deletion pass. It should first produce import/dependency proof for each DELETE-REVIEW source path, including dynamic references, tests, scripts, and docs, then delete only explicitly approved and proven-unreferenced files. Generated-local folders remain outside source deletion decisions.

Final roadmap:

- `0.24.07`: roadmap/inventory/current-state/version metadata.
- `0.24.08`: mock/sample/fixture and unused-code cleanup with proof.
- `0.24.09`: customer admin main, plan quota, DB/R2 usage.
- `0.24.10`: system admin, billing/storage, account switcher, audit.
- `0.24.11`: general workspace, workorders, material orders, materials, partners, `/worker`, responsive/save/permission consistency.
- `0.24.12`: workorder and supplier PDFs, Worker/R2 storage policy.
- `0.24.13`: `/functions`, Simulator, test console, PowerShell/test automation mapping.
- `0.24.14`: full integration checkpoint and release residual freeze.

## Validation Performed

- Route list collected from `app/` page and API route files.
- Mock/sample/fixture keywords searched across source/test/tool paths.
- Tracked status checked for `pnpm-lock.yaml`, material fixture, sample/mock files.
- Ignore status checked for generated/local folders.
- Permission, dev/test, storage, PDF, and simulator representative modules read.

## Not Run

- Build, lint, E2E, simulator execute, Seed, Reset, Cleanup, Migration, DB/R2 mutation, and PowerShell menu execution were not run.
- Build was not required because product runtime code was not changed; only docs and app version metadata are part of 0.24.07.

## No-Mutation Confirmation

- No production DB/R2 access.
- No Seed/Reset/Cleanup/Migration.
- No file deletion.
- No dependency or lockfile change.
- No PowerShell change.
- No stage, commit, or push.
