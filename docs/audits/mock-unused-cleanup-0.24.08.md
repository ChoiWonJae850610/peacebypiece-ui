# Mock, Sample, Fixture, And Unused Cleanup 0.24.08

## Executive Summary

0.24.08 revalidated mock, sample, fixture, deprecated, legacy, fallback, and unused-code candidates before deleting anything. The cleanup deleted only source files with no live import, dynamic import string, route/API reference, test reference, script/PowerShell reference, deploy reference, fallback path, or active replacement requirement.

No production DB/R2 access was performed. No Seed, Reset, Cleanup, Migration, dependency change, lockfile change, PowerShell change, stage, commit, or push was performed.

## Start State

| Check | Result |
|---|---|
| Branch | `master` |
| Baseline HEAD | `454dba23a704fe880b78f7e5eb5dcef37f93043d` |
| Original APP_VERSION | `0.24.07` |
| Result APP_VERSION | `0.24.08` |
| `package.json` version | `0.5.637`, unchanged |
| Initial working tree | Clean |

## Search Scope

- Direct imports and type-only imports under `app`, `features`, `lib`, `scripts`, `tests`, `tools`, `docs`, `cloudflare`, and `package.json`.
- Dynamic import strings and string-based path references.
- Route/API references, test references, script references, PowerShell and pipeline references, deploy docs, fallback paths, and historical docs.
- Repository-wide keyword scan for `mock`, `sample`, `fixture`, `fake`, `demo`, `placeholder`, `fallback`, `deprecated`, `legacy`, `unused`, `TODO`, and `FIXME`, excluding generated dependency folders.

## Candidate Classification

| Candidate | Current role | Actual references | Dynamic reference risk | Test/deploy/docs refs | Replacement path | Delete impact | Recommendation | 0.24.08 handling |
|---|---|---|---|---|---|---|---|---|
| `features/materials/__fixtures__/materialsMock.ts` | Stale material UI fixture | Self exports plus historical docs only | Low; no import/string route refs found | Historical audits mention review state | Materials page uses `/api/materials` and DB-backed `listWorkspaceMaterials` path | Removes stale mock fixture; no runtime impact | DELETE-SAFE | Deleted |
| `lib/data/workorderMockData.ts` | Old workorder mock utility and sample attachment re-export | Historical docs only; no live imports of exported helpers | Low; no dynamic import/path refs found | Roadmap/current-state mentions prior risk | Workorder runtime uses DB repositories and hooks | Removes dead re-export chain | DELETE-SAFE | Deleted |
| `lib/data/sample/attachments.ts` | Sample attachment factory | Only `lib/data/workorderMockData.ts` before deletion | Low after parent utility deletion | Historical docs only | Real attachments use DB/R2 attachment repositories and upload APIs | Removes unused sample SVG data generator | DELETE-SAFE | Deleted |
| `lib/data/sample/partners.ts` | Sample partner constants | Self export plus historical docs only | Low | Historical docs only | Partner pages/API use DB partner repositories | Removes stale malformed sample constants | DELETE-SAFE | Deleted |
| `lib/data/sample/system.ts` | Sample system console constants | Self export plus historical docs only | Low | Historical docs only | System console routes use DB/API/page data modules | Removes stale malformed sample constants | DELETE-SAFE | Deleted |
| `lib/data/mock/fixtureI18n.ts` | I18n helper for sample attachments | Only `lib/data/sample/attachments.ts` | Low after sample deletion | Historical docs only through sample path | No replacement required; active i18n is separate | Removes now-orphaned helper | DELETE-SAFE | Deleted |
| `lib/data/domain/system.ts` | Types only for sample system constants | Only `lib/data/sample/system.ts` | Low after sample deletion | None beyond sample path | System modules define their own production types | Removes now-orphaned sample-only types | DELETE-SAFE | Deleted |
| `pnpm-lock.yaml` | Alternate lockfile | No active npm script uses pnpm; historical docs mention it | Low runtime risk, but package-manager policy risk exists | Historical QA plan references pnpm commands | `package-lock.json` is active npm lockfile | Deletion changes package-manager metadata policy | DELETE-REVIEW | Kept |
| `cloudflare/pdf-generator-worker.js` | Deprecated single-file PDF Worker | Docs mark deprecated; no active package script references it | Medium deploy-history risk | README and historical deploy docs reference it | `cloudflare/pdf-generator-worker/src/index.js` plus worker `wrangler.toml` | Could remove a manual deploy fallback before deploy verification | DELETE-REVIEW | Kept |
| `cloudflare/pdf-generator-worker.wrangler.example.toml` | Deprecated example config | Docs mark deprecated; no active package script references it | Medium docs/deploy-history risk | README and historical audit docs reference it | `cloudflare/pdf-generator-worker/wrangler.toml` | Could remove migration/deploy reference too early | DELETE-REVIEW | Kept |
| `cloudflare/r2-upload-worker.js` | Active R2 upload/download/delete Worker | README and R2 docs reference it | Active deploy source | Deployment docs reference it | None | Runtime/deploy break risk | KEEP | Kept |
| `tests/fixtures/functions/*` | Functions/simulator fixtures | Used by scripts and contract tests | Low; explicit paths | Package scripts and tests use them | Required dev/test data source | Test/simulator break | DEV-TEST-ONLY | Kept |
| `tools/simulator/fixtures/r2/*` | Local R2 simulator fixture | Used by simulator R2 plan/generate command | Low | Simulator README references it | Required local fixture | Simulator plan/generate break | DEV-TEST-ONLY | Kept |
| Generated folders `.next`, `artifacts`, `.tmp`, `test-results`, `playwright-report`, `node_modules`, worker `.wrangler` | Local generated output | Ignored/generated | Not product source | Build/test tools create them | Regenerable | Not source cleanup scope | GENERATED-LOCAL / GIT-IGNORE | Kept |
| `lib/repositories/*` and `lib/workorder/repository/*` overlap | Active repository layers | Both paths have live imports | Medium boundary risk | Historical docs mention overlap | Requires focused architecture task | Large behavior risk | UPDATE-MERGE | Kept |
| `lib/data/mock/types.ts` | Persisted workorder state types | Used by `lib/repositories/workorderRepository.ts` and `lib/repositories/workorderPersistence.ts` | None | None | Still required by active repository persistence | Type break if removed | KEEP | Kept |
| `lib/admin/mockDataAudit.ts` | Admin mock audit metadata | Existing audit classification says imported by admin completion audit | None found for this cleanup scope | Historical audit refs | Admin completion audit replacement not done | UI/audit evidence risk | KEEP | Kept |

## Deleted Files

- `features/materials/__fixtures__/materialsMock.ts`
- `lib/data/workorderMockData.ts`
- `lib/data/sample/attachments.ts`
- `lib/data/sample/partners.ts`
- `lib/data/sample/system.ts`
- `lib/data/mock/fixtureI18n.ts`
- `lib/data/domain/system.ts`

## Deferred

- `pnpm-lock.yaml` remains until package-manager policy is explicitly approved. This checkpoint did not change dependency metadata.
- Deprecated Cloudflare PDF Worker files remain until deploy verification confirms the current worker package is the only required handoff.
- Repository overlap remains `UPDATE-MERGE`; both repository layers have active imports and need a focused boundary task.
- Dev/test fixtures remain separate from production mock cleanup.

## Validation Performed

| Check | Result |
|---|---|
| Deleted-path/source reference search | Passed for live source, tests, scripts, tools, and package scripts. Remaining matches are historical/audit docs and this audit. |
| Static reference/export graph validation | Passed. Deleted paths, exported symbols, alias imports, type-only imports, dynamic import strings, barrel exports, package exports, and build-time config references were not found in live source/test/script/tool paths. |
| `git diff --check` | Passed with line-ending warnings only; no whitespace errors. |
| Build | Passed in user local Windows PowerShell with `.\node_modules\.bin\next.cmd build`; Next.js `16.2.1 (Turbopack)`, `Compiled Successfully`, static page generation and page optimization completed. |
| Mutation Audit | Passed in user local Windows PowerShell with `node scripts/audit-wafl-mutations.mjs`; `162 finding(s), 0 high-risk`. |
| Node contract tests | Passed in user local Windows PowerShell: `tests/functions-environment-audit-contract.mjs`, `tests/simulator-adapter-plan-contract.mjs`, and `tests/functions-pdf-contract.mjs`. |
| Codex sandbox Node execution | Blocked. The Codex sandbox found `C:\Program Files\WindowsApps\OpenAI.Codex_26.616.4196.0_x64__2p2nqsd0c76g0\app\resources\cua_node\bin\node.exe`, but both normal and escalated execution returned `Access is denied`. |

No dependency install, dependency update, lockfile change, DB/R2 access, Seed, Reset, Cleanup, or Migration was performed for this validation. The deletion safety verification is complete for 0.24.08.

## No-Mutation Confirmation

- No production DB/R2 access.
- No Seed/Reset/Cleanup/Migration.
- No dependency install/update/remove.
- No lockfile change.
- No PowerShell change.
- No stage, commit, or push.
