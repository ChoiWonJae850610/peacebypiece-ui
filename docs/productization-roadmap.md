# PeaceByPiece / WAFL Productization Roadmap

## Status

- Roadmap checkpoint version: `0.24.08`
- Source of truth: local Git repository and committed documentation, not prior chat memory.
- Baseline HEAD: `454dba23a704fe880b78f7e5eb5dcef37f93043d`
- App display version after this checkpoint: `0.24.08`
- Feature implementation progress: about `93%` as a prior screen/function skeleton estimate; not remeasured in this checkpoint.
- Productization readiness: `74%`; this updates the 0.24.07 `72%` estimate after proven-unreferenced source mock/sample files were removed. Remaining readiness work still includes real data evidence, permissions, responsive QA, PDF policy, E2E evidence, and operational safety.

This roadmap separates product work from Codex operating rules. `AGENTS.md` stays limited to operating, safety, Git, question, and reporting rules. Product scope and remaining release work live here. Future status blocks should keep feature implementation progress and productization readiness separate when both are reported.

## Productization Summary

The app has a broad working skeleton with many DB-backed workspace, system, storage, permission, and simulator contracts already in place. That is why the older feature implementation progress can remain high. The `74%` figure in this roadmap is narrower and stricter: it measures productization readiness, including removal or quarantine of residual mock/sample paths, real data evidence, permissions, responsive/manual verification, PDF policy decisions, and dev/test operational safety without touching production DB/R2.

## User Types And Screens

| User type | Main routes | Current classification | Productization notes |
|---|---|---|---|
| System administrator | `/system`, `/system/companies`, `/system/account-requests`, `/system/audit-logs`, `/system/billing`, `/system/storage-usage`, `/system/standards/*` | Partial to DB-backed | System layout requires system session. Companies, audit logs, standards, and account requests have DB/API paths. Billing/storage still include design or skeleton pieces. |
| Customer administrator | `/workspace`, `/workspace/settings`, `/workspace/members`, `/workspace/files`, `/workspace/stats`, `/workspace/subscription`, `/workspace/standards`, `/workspace/workorders`, `/workspace/material-orders`, `/workspace/materials`, `/workspace/partners` | Mostly DB-backed, partial product polish | Permission guards exist on most pages. Admin main uses operational dashboard snapshots. Storage/files use DB snapshot API. Remaining work is density, plan/quota accuracy, and final responsive verification. |
| General user | `/workspace`, `/workspace/workorders`, `/workspace/material-orders`, `/workspace/materials`, `/workspace/partners`, `/workspace/legal`, `/me/settings` | DB-backed with permission gating | Member permissions are checked through page/API guards. Need broader direct-route denial tests and real session/E2E coverage. |
| External or partner user | Invitation routes and partner data paths | Partial | Invitation join routes exist. Dedicated external supplier portal is not confirmed; partner/factory data is currently managed inside workspace/admin flows. |
| Dev/test user | `/dev/test-console`, `/functions`, `/ui`, simulator commands | Guarded dev/test-only | Runtime and active system-admin checks exist. Execute DB/R2 paths remain approval-gated or disabled; many checks are dry-run/contract only. |

## Screen Inventory

| Area | Routes | Data state | Permission state | Remaining work |
|---|---|---|---|---|
| Public auth/invite | `/`, `/login`, `/invite/company/[token]`, `/invite/member/[token]`, `/pending`, `/service-paused` | Implemented with auth/invitation/company access repositories | Public plus session-aware redirects | Real Google login and pending/service-paused browser checks remain manual. |
| Customer admin main | `/workspace` | DB operational snapshots for company admins; member permission lookup for member home | `requireWaflSessionForArea("workspace")` plus member permissions | Recalculate dashboard completion, dense layout QA, plan/storage warning surfacing. |
| Workorders | `/workspace/workorders`, legacy `/worker` | DB repository mode only; API routes under `/api/workorders/*` | `/workspace/workorders` requires `workorder.read`; `/worker` uses current session but lacks the same page guard | Consolidate `/worker` with guarded workspace route or document it as dev/internal legacy alias. |
| Material orders | `/workspace/material-orders` | DB/API-backed feature module | `material.order.request` plus place/request capability checks | Complete refresh-loss regression coverage, PDF handoff, responsive verification. |
| Materials | `/workspace/materials` | Calls `listWorkspaceMaterials`; stale source fixture removed in 0.24.08 after static, build, mutation-audit, and contract-test verification | `standards.read` plus capability state | Continue DB-backed material workflow QA and permission denial coverage. |
| Partners | `/workspace/partners` | DB-backed partner master components/API | `partner.read`, create/update capability checks | Final supplier/factory flow QA and permission denial tests. |
| Files/storage | `/workspace/files`, `/workspace/storage` redirect | DB snapshot from attachments/trash plus company file policy | `storage.read` and storage API guards | Align plan quota display with system storage and R2 reconciliation evidence. |
| Members/invites | `/workspace/members`, `/workspace/invites` redirect | DB member repository and invitation APIs | `member.read`, `member.invite`, permission update checks | Last-admin policy and lifecycle edge cases need release tests. |
| Settings/subscription/legal | `/workspace/settings`, `/workspace/subscription`, `/workspace/legal`, `/me/settings` | DB-backed settings/profile/policy flows | Admin-only settings, workspace/session guards | Real browser session, policy re-agreement, blocked-company checks. |
| System console | `/system` and subroutes | Mixed DB-backed and design/checkpoint pages | System session required at layout/API levels | Finish billing/storage production data paths and system dashboard QA. |
| Functions/test console/UI catalog | `/functions`, `/dev/test-console`, `/ui` | Catalog/contract/dev-test DB reads, no product data mutation by default | Runtime allowed modes plus active system admin | Keep production blocking, account switch restore, and audit log coverage. |

## Data, Storage, And Plans

- Plan definitions exist in `lib/billing/defaultPlans.ts` and policy helpers in `lib/billing/storageQuotaPolicy.ts`.
- Customer file usage has a DB-backed snapshot route at `app/api/admin/files/snapshot/route.ts`.
- System storage usage API exists at `app/api/system/storage-usage/route.ts`, but `lib/billing/storageUsageRepository.ts` is currently an in-memory skeleton with a production-use note.
- Simulator company A-J fixture covers 0%, 5%, 15%, 30%, 50%, 70%, 90%, 99%, 100%, and 110% clamped storage scenarios in `tests/fixtures/functions/company-scenarios.json`.
- R2 usage reconciliation exists as dry-run/test tooling, but production and dev/test R2 mutation remain blocked without explicit approval.

## Permissions And Accounts

- Workspace page/API guards are centralized in `lib/auth/routeGuard.ts` and `lib/auth/apiRouteGuards.ts`.
- System admin access is validated against active DB rows in `lib/auth/systemAdminAccess.ts`.
- Dev/test account switching is guarded by `WAFL_ENABLE_DEV_TEST_CONSOLE`, non-production runtime, active system-admin session, target allowlist, original session matching, and audit logs.
- Remaining work: direct URL denial coverage for every protected route, `/worker` route policy, last-admin edge cases, and account-switch restore/manual browser checks.

## PDF Roadmap

- Workorder PDF generation exists at `app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts`.
- Workorder PDF currently renders through an external generator when configured, falls back to server PDF, uploads to R2/worker, and registers an attachment.
- PDF policy decisions are tracked in `lib/functions/pdfPolicyCatalog.ts`.
- Supplier/material-order PDF is still policy-contract level; final generation route and R2 storage policy are not confirmed.
- Remaining decisions: generation stage, amount visibility, due date source, branding, signature/stamp, page orientation, image layout, missing value handling, regeneration, download/print rules, and failure recovery.

## Mock, Sample, Fixture, And Generated Data Policy

| Class | Current handling |
|---|---|
| Production code mock/sample paths | 0.24.08 removed the proven-unreferenced material fixture and `lib/data/sample` chain. Keep remaining candidates until import graph and replacement path are proven. |
| Dev/test fixture data | Keep. Simulator and functions contracts depend on `tests/fixtures/functions/*` and `tools/simulator/fixtures/*`. |
| Unreferenced source fixture | 0.24.08 deleted the stale material fixture after direct import, dynamic string, route/API, test, script, docs, fallback, and replacement-path review. |
| Generated local folders | Classify as `GENERATED-LOCAL` / `GIT-IGNORE`, not source `DELETE-SAFE`: `.next`, `artifacts`, `.tmp`, `test-results`, `playwright-report`, root `node_modules`, worker `node_modules`, worker `.wrangler`. They may be regenerated locally and are cleaned only on explicit request. |
| Historical docs | Keep or archive only with index refresh; do not delete by age. |

## Version Roadmap

| Version | Scope | Completion criteria |
|---|---|---|
| `0.24.07` | Productization roadmap and inventory | Roadmap, audit inventory, current-state, app version, and local commit metadata updated; no product code deletion or mutation. |
| `0.24.08` | Mock/sample/fixture and unused-code cleanup | Completed. Removed only proven-unreferenced source mock/sample files; static reference/export graph, build, Mutation Audit, and selected Node contract tests passed. Kept simulator/test fixtures, lockfile, Cloudflare review files, and repository overlap items. |
| `0.24.09` | Customer admin main and plan/storage | Admin dashboard, plan quota, DB/R2 usage display, warnings, and company file policy aligned. |
| `0.24.10` | System admin and account switching | System dashboard/billing/storage data paths, dev/test account switcher, restore, and audit logs verified. |
| `0.24.11` | User workspace screens | Workorders, material orders, materials, partners, `/workspace`, `/worker` policy, responsive layout, save/lock/toast consistency. |
| `0.24.12` | PDF | Workorder and supplier PDF policies resolved; generation, regeneration, R2 storage, download, print, and failure handling verified. |
| `0.24.13` | Functions, Simulator, PowerShell, automation | `/functions`, Simulator dry-run/execute policy, test console, PowerShell menu mapping, and dev/test scenarios aligned. |
| `0.24.14` | Productization checkpoint | Full build/contracts/E2E/manual matrix run or explicitly deferred; launch residuals frozen. |

## Completion Criteria

- No production DB/R2 access or mutation during productization prep without explicit approval.
- All protected screens have page-level and API-level permission evidence.
- All mock/sample/fixture paths are classified as production, dev/test, test-only, unreferenced, or dynamic-risk.
- Customer and system storage usage show plan quota, DB metadata usage, R2 reconciliation status, and warning thresholds consistently.
- Workorder and supplier PDFs have resolved output policy, permission checks, R2 storage policy, and failure behavior.
- Responsive QA covers desktop, tablet landscape/portrait, and mobile portrait for workorders, material orders, admin, system, and worker surfaces.
- Build, mutation audit, contract tests, simulator dry-runs, and selected E2E/manual tests are either passed or explicitly listed as blocked/not run with reasons.
