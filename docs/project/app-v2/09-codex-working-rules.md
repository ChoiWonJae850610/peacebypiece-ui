# WAFL v2 App-first Codex Working Rules - 2.0.0-alpha.1

## Purpose

This document defines Codex rules for the App-first `2.0.x` line.

## Prompt header rule

Every future Codex instruction for App-first work should start by stating:

```text
Codex 추론 수준:
Codex 속도:
```

Recommended defaults:

- document/UI repeat correction: `높음 + 고속`
- app structure/environment/build setup: `높음 + 표준`
- DB/API/PDF/R2 real integration: `높음` or `매우 높음 + 표준`

## Required read order

Before any App-first file modification, read:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/app-v2/00-start-here.md`
4. `docs/project/app-v2/01-app-first-product-definition.md`
5. `docs/project/app-v2/02-mobile-tablet-ux-principles.md`
6. `docs/project/app-v2/03-app-architecture.md`
7. `docs/project/app-v2/04-auth-google-apple.md`
8. `docs/project/app-v2/05-device-test-plan.md`
9. `docs/project/app-v2/06-expo-environment-setup.md`
10. `docs/project/app-v2/07-feature-map-from-ui-alpha27.md`
11. `docs/project/app-v2/08-roadmap-2.0.md`
12. `docs/project/app-v2/09-codex-working-rules.md`
13. `docs/project/v2/00-start-here.md` through `docs/project/v2/14-operational-policy-absorption.md`
14. `docs/project/25-korean-unicode-encoding-standard.md`
15. `docs/project/32-product-completion-and-ui-evidence-standard.md`
16. `docs/project/26-final-policy-decisions-and-master-todo.md`
17. `docs/project/31-pre-codex-integrated-master-plan.md`

## 4. Newest rule

`4. Newest` should contain final deliverables only.

Keep only:

- source ZIP,
- repo-state,
- build log,
- verification log.

Patch ZIPs, when requested, must use a flat structure and include a top-level `commit-meta.md`.

`commit-meta.md` must include:

```text
Version :
Summary :
Description :
수정 파일 목록 :
추가 파일 목록 :
삭제 파일 목록 :
```

Do not stage or commit `commit-meta.md`.

## Forbidden by default

Unless a future work order explicitly allows it, do not change:

```text
app/api
db
cloudflare
package.json
package-lock.json
pnpm-lock.yaml
pnpm-workspace.yaml
.env*
```

Do not create `mobile/`, `apps/mobile/`, or an Expo project before the `2.0.0-alpha.2` skeleton work order.

## Verification baseline

Prefer the project pipeline wrapper when it covers the scope:

```text
tools/pipeline/approved-workflow.ps1 -Action Verify
```

For documentation/version-only patches, safe supporting checks may include:

```text
npm run build
npx tsc --noEmit
git diff --check
git diff --cached --check
node tests/unicode-encoding-contract.mjs
```

Do not run destructive DB/R2/Worker commands for App-first documentation work.
