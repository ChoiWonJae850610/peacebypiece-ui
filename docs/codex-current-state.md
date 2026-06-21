# Codex Current State

## Start Manifest

- Current result version: `0.24.12`
- Baseline before this version: `0.24.11`
- APP_VERSION source: `lib/constants/version.ts`
- Current work version: `0.24.12`
- Current work title: `일반 사용자 workspace 및 worker 공통화`
- Current branch policy: `master`, `origin/master` synchronized before automatic Finish
- DB migration: none for 0.24.12
- R2/DB execute: not allowed without separate explicit approval

Use this file as the first routing manifest only. For detailed rules, read the target files below instead of re-reading the whole repository.

## Read First By Work Type

| Work type | 먼저 읽을 파일 | 기본으로 읽지 않아도 되는 파일 |
| --- | --- | --- |
| 0.24.12 workspace/worker | `lib/internal/roadmap/roadmap-0.24.12.ts`, `lib/responsive/useWorkspaceLayoutMode.ts`, `components/common/ui/Wafl*WorkspaceFrame.tsx`, related route/page file | `docs/보관문서/**`, old version result docs, PDF/R2 docs unless touched |
| PDF / R2 next work | `lib/internal/roadmap/roadmap-0.24.13.ts` when added, `lib/functions/pdfPolicyCatalog.ts`, `cloudflare/README.md`, `lib/storage/r2/*` | legacy R2 demo upload notes unless investigating history |
| Simulator / Functions / QA | `lib/internal/roadmap/index.ts`, `tools/simulator/README.md`, `tools/pipeline/README.md`, `lib/functions/catalog.ts` | completed feature history and archived QA logs |
| Pipeline / Git finish | `tools/pipeline/README.md`, `tools/pipeline/approved-workflow.ps1`, `tools/pipeline/verify-safe.ps1`, `tools/pipeline/finish-version.ps1` | UI component docs unless profile touches UI |
| Docs cleanup / Codex optimization | `docs/README.md`, this file, `docs/productization-roadmap.md`, `tools/pipeline/README.md` | product feature source files unless referenced by changed docs |

## Default Search Exclusions

When searching for current implementation, exclude these unless the task is explicitly historical/audit cleanup:

- `docs/보관문서/**`
- `docs/**/legacy/**`
- `docs/**/deprecated/**`
- `node_modules/**`
- `.next/**`
- `artifacts/**`
- `.tmp/**`
- `test-results/**`
- `playwright-report/**`

Prefer current canonical sources over archived notes:

1. local Git state
2. `lib/internal/roadmap/*`
3. this `docs/codex-current-state.md`
4. `docs/현재기준/*`
5. archived/historical docs

## 0.24.12 Applied Scope

- `/worker` now uses the same fixed workspace shell boundary as `/workspace/workorders`.
- `/workspace/workorders` and `/workspace/material-orders` continue to use `WorkspacePageShell` with `contentMode="fixed-md"` and `hideTopbar`.
- Workorder and material-order responsive behavior is fixed by the shared `resolveWorkspaceLayout` policy:
  - desktop and wide landscape tablet: `threePanel`
  - compact landscape tablet: `tabletTwoPanel`
  - mobile and portrait tablet: `drawer`
- Workorder save protection remains in `workspaceWriteLockRef`.
- Material-order save protection remains in `useMaterialOrderFeedback` and `materialOrderMutationLocked`.
- Codex Optimization Phase 1 is included only as document routing and profile guidance. No large file refactor, dev/test-console feature, DB/R2 execute, or PowerShell large refactor is included.

## Pipeline Verify Profile

| Changed file type | Preferred profile | Notes |
| --- | --- | --- |
| Workspace/worker shell, layout policy, save feedback contract | `workspace-commonization` | 0.24.12 profile. Includes build, mutation audit, roadmap contract, approved workflow contract, workspace commonization contract. |
| Roadmap data/page only | `roadmap-development-contract` | Read-only roadmap contract and handoff contract. |
| System-admin internal routes | `system-admin-internal-access` | `/id-control`, `/roadmap`, `/ui`, `/functions` access guard. |
| Pipeline wrapper only | `automation-infrastructure` | Approved workflow and repo-state publication contracts. |
| Docs cleanup only | `repository-cleanup` | Use only when no product behavior changes. |
| System storage usage | `system-admin-storage` | Storage usage DB metadata and system dashboard contracts. |

Use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile workspace-commonization
```

## Safety Boundaries

- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`, not by `NODE_ENV`, `VERCEL_ENV`, `NEXT_PUBLIC_APP_RUNTIME_MODE`, or `WAFL_ENABLE_DEV_TEST_CONSOLE`.
- `/id-control` test account switching is allowed for active `system_admin` with allowlisted targets, signed cookie, original-user match, and audit logs.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- Production DB/R2 access remains forbidden.
- Seed, Reset, Cleanup, Migration, destructive SQL, and R2 mutation require separate explicit approval.
- DB Migration is not part of 0.24.12.
- PDF/R2 policy work moves to 0.24.13.
- UI/responsive completion still requires user manual confirmation before the roadmap item can be marked completed.

## Current Verification Target

Recommended profile for this version:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile workspace-commonization
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Handoff
```

Because 0.24.12 includes UI/responsive behavior, stop before automatic commit/push unless the user manually confirms the responsive result.
