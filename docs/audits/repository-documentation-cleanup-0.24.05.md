# Repository Documentation Cleanup 0.24.05

## Executive Summary

0.24.05 focused on repository hygiene and documentation alignment. The main applied change is removing `cloudflare/pdf-generator-worker/node_modules` from Git tracking after confirming the Worker has its own `package.json`, `package-lock.json`, `wrangler.toml`, source entry, and lockfile-based install/deploy instructions.

No production DB/R2 access was performed. No Reset, Seed, Cleanup, Migration, DB schema/index change, R2 object create/delete, dependency install, dependency update, package metadata change, commit, or push was performed.

## Start State

| Check | Result |
|---|---|
| Branch | `master` |
| Start HEAD | `da33450a74c573caccc2cae7f51d8b480a3ec3c2` |
| Working tree | clean |
| `origin/master...HEAD` | `0 0` |
| Original APP_VERSION | `0.24.04` |
| Result APP_VERSION | `0.24.05` |
| `package.json` version | `0.5.637`, unchanged |

## Worker Node Modules Decision

| Item | Finding |
|---|---|
| Tracked files | `git ls-files cloudflare/pdf-generator-worker/node_modules` reported 3,992 files before removal. |
| Worker package manifest | `cloudflare/pdf-generator-worker/package.json` exists and defines `dev`, `deploy`, and `dry-run` Wrangler scripts. |
| Worker lockfile | `cloudflare/pdf-generator-worker/package-lock.json` exists and locks Wrangler and transitive dependencies. |
| Wrangler config | `cloudflare/pdf-generator-worker/wrangler.toml` exists with `main = "src/index.js"` and Browser Rendering binding config. |
| Direct node_modules references | Repo search found no source, CI, PowerShell, or package script direct dependency on committed worker `node_modules`; matches were limited to the lockfile, old audit docs, and files inside `node_modules` itself. |
| Custom patched/vendor source | No custom project source under worker `node_modules` was identified; it is a package-manager install tree. |
| Reproducibility | Worker README now uses `npm ci` from the worker lockfile before `npx wrangler deploy`. |

Decision: remove `cloudflare/pdf-generator-worker/node_modules` from Git tracking and ignore future local installs. The local directory was not forcibly deleted.

## Applied Changes

| Path | Handling |
|---|---|
| `cloudflare/pdf-generator-worker/node_modules/**` | Removed from Git tracking with `git rm --cached -r`; local files were left in place. |
| `.gitignore` | Added `cloudflare/pdf-generator-worker/node_modules/` and `cloudflare/pdf-generator-worker/.wrangler/`. |
| `cloudflare/pdf-generator-worker/README.md` | Rewrote deploy guidance around `npm ci`, lockfile reproducibility, Wrangler deploy, and untracked `node_modules`. |
| `cloudflare/pdf-generator-worker/src/index.js` | Updated the deployment comment from `npm install` to `npm ci`. |
| `cloudflare/pdf-generator-worker.wrangler.example.toml` | Updated the deprecated example deployment note from `npm install` to `npm ci`. |
| `tools/simulator/README.md` | Replaced stale text that said adapters were disabled with current guarded DB adapter and disabled R2 upload/delete policy. |
| `docs/codex-current-state.md` | Updated canonical state, version, worker cleanup result, and next 0.24.06 plan. |
| `lib/constants/version.ts` | Updated `APP_VERSION` to `0.24.05`. |
| `commit-meta.md` | Updated local ignored handoff metadata to `0.24.05`. |

## Documentation Structure

Canonical current documents:

- `AGENTS.md`
- `docs/codex-current-state.md`
- `docs/audits/repository-source-db-cleanup-audit-0.24.03.md`
- `docs/audits/reset-guard-hardening-0.24.04.md`
- `docs/audits/repository-documentation-cleanup-0.24.05.md`
- `tools/pipeline/README.md`
- `tools/simulator/README.md`
- `cloudflare/pdf-generator-worker/README.md`

Historical documents under `docs/` and `docs/보관문서/` were preserved. They retain audit/history value and were not moved or deleted by age alone.

## DELETE-SAFE / ARCHIVE / UPDATE-MERGE Recheck

| Item | 0.24.05 status | Reason |
|---|---|---|
| `.next` | DELETE-SAFE, not deleted | Ignored generated build output; local cleanup requires explicit request. |
| `artifacts` | DELETE-SAFE, not deleted | Ignored reports; useful as local evidence. |
| `.tmp` | DELETE-SAFE, not deleted | Ignored simulator output; local cleanup requires explicit request. |
| `test-results` | DELETE-SAFE, not deleted | Ignored Playwright output. |
| `playwright-report` | DELETE-SAFE, not deleted | Ignored Playwright output. |
| root `node_modules` | DELETE-SAFE, not deleted | Ignored local dependency install. |
| `cloudflare/pdf-generator-worker/node_modules` | Applied Git tracking removal | Proven reinstallable from worker lockfile and not directly referenced by repo scripts. |
| old root docs | ARCHIVE/REVIEW, not moved | Historical value remains; moving many docs needs a separate index refresh to avoid link churn. |
| `tools/simulator/README-r2-demo-files.md` | MERGE/REVIEW, not moved | Still contains specialized R2 local guidance; main README now carries current safety summary. |
| `pnpm-lock.yaml` | DELETE-REVIEW, unchanged | Package manager policy was not changed. |
| `features/materials/__fixtures__/materialsMock.ts` | UNKNOWN, unchanged | Import/runtime use was not part of this worker/docs cleanup. |

## PowerShell And Simulator Alignment

- `tools/pipeline/README.md` still identifies `tools/pipeline/peacebypiece-auto-pipeline.ps1` as the canonical tracked entry point.
- PowerShell menu 9 still requires `RESET WAF-FN SCHEMA` before the SQL runner.
- Simulator README now matches package scripts and current contracts: dry-runs are safe, DB execute paths are guarded, R2 upload/delete remains disabled, and local R2 cleanup is `.tmp` only.
- No PowerShell source changes were made in 0.24.05.

## Deferred Items

- Do not delete or move broad historical docs until a docs index refresh can update links in one pass.
- Keep `pnpm-lock.yaml` as DELETE-REVIEW until npm-only policy is explicitly approved.
- Keep source fixture/mock cleanup for 0.24.06.
- Keep seed performance work for 0.24.06.

## Validation Plan

Required validation for this work:

- `git diff --check`
- `git status --short`
- `git diff --name-status`
- `git diff --stat`
- document link/file reference scan
- package/PowerShell script reference scan
- PowerShell parse check
- reset schema guard contract
- functions environment audit contract
- simulator adapter contract
- simulator DB adapter contract
- simulator category tree contract
- `npm run audit:wafl-mutations`
- `npm run build`

Full E2E is not required for this cleanup scope and should be reported as NOT RUN unless separately requested.
