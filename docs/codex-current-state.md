# Codex Current State

## Version

- Current result version: `0.24.11`
- APP_VERSION source: `lib/constants/version.ts`
- `package.json` version remains npm package metadata and is not the app display version.
- This checkpoint does not start 0.24.12 feature implementation.

## Repository

- Repository: `peacebypiece-2.0`
- Main branch: `master`
- Canonical PowerShell entry point: `tools/pipeline/peacebypiece-auto-pipeline.ps1`
- Approved workflow wrapper: `tools/pipeline/approved-workflow.ps1`
- Safe verification wrapper: `tools/pipeline/verify-safe.ps1`
- Git finish wrapper: `tools/pipeline/finish-version.ps1`
- Pipeline config: `tools/pipeline/pipeline.config.psd1`
- Root operating rules: `AGENTS.md`

## Canonical Sources

- Current state: `docs/codex-current-state.md`
- Productization roadmap: `docs/productization-roadmap.md`
- Structured roadmap data: `lib/internal/roadmap/index.ts`
- 0.24.12 roadmap detail: `lib/internal/roadmap/roadmap-0.24.12.ts`
- Compatibility facade: `lib/internal/productizationRoadmap.ts`
- PowerShell guide: `tools/pipeline/README.md`
- Current baseline docs: `docs/현재기준/`

Use current local Git state, the canonical roadmap detail, and this current-state file before relying on previous chat memory or archived docs.

## Internal Routes

- `/id-control` is the guarded replacement route for `/dev/test-console`.
- `/dev/test-console` remains production-blocked and redirects to `/id-control` only after the same dev/test runtime and active system-admin guard passes.
- `/roadmap` is a system-administrator-only read-only screen.
- `/roadmap` must not add edit, add, delete, save, DB write, R2 write, localStorage canonical source, or URL/query mutation paths without a separate explicit policy decision.

## Roadmap Infrastructure

0.24.11 roadmap infrastructure expands `/roadmap` into a shared development board for the user, ChatGPT, and Codex.

The screen now separates:

- user-facing version summary
- detailed development contract used before starting a version

The canonical data structure lives under `lib/internal/roadmap/`. The old import path `lib/internal/productizationRoadmap.ts` remains as a facade so existing code can continue importing `PRODUCTIZATION_ROADMAP`.

## 0.24.12 Planned Scope

0.24.12 is registered as a draft only. Do not start implementation unless the user explicitly asks to proceed with that version.

Planned title: 일반 사용자 workspace 및 worker 공통화

Required baseline:

- PC 3패널
- iPad mini 가로 2패널 검토
- 큰 태블릿 가로 3패널
- 모바일 및 태블릿 세로 1패널
- 패널 독립 스크롤
- `/worker` density 축소
- workorder/material-order shell 공통화
- entity별 single save queue
- stale response 방지
- toast 통일
- 저장 후 refresh persistence
- 기존 권한 의미 유지
- DB Migration 없음이 기본 전제
- modal/focus는 저장/반응형 작업에 직접 필요한 범위만 포함
- PDF/R2는 0.24.13 경계로 넘김

## Pipeline Completion Flow

For version work covered by a profile, prefer:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile roadmap-development-contract
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Plan -Profile roadmap-development-contract -CommitMessage "feat: expand roadmap into development contract" -ExpectedAppVersion "0.24.11"
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Finish -Profile roadmap-development-contract -CommitMessage "feat: expand roadmap into development contract" -ExpectedAppVersion "0.24.11"
```

`Finish` commits and pushes through `finish-version.ps1`. After push succeeds and origin/master is synchronized, it creates the latest ChatGPT handoff artifacts in the configured `4. Newest` directory unless `-SkipHandoff` is passed.

Expected newest files:

- `peacebypiece-ui-{APP_VERSION}.zip`
- `repo-state-{APP_VERSION}-{yyyyMMdd-HHmmss}.txt`
- `build-result-{APP_VERSION}-{yyyyMMdd-HHmmss}.txt`

The handoff step is read/export-only and reuses the existing ZIP candidate, exclusion, secret scan, repo-state, and newest publication policies.

## Current Safety Constraints

- Keep APP_VERSION at `0.24.11` for this roadmap infrastructure checkpoint.
- Do not change `package.json` or lockfiles.
- Do not create or execute DB migrations.
- Do not access production DB/R2.
- Do not run Seed, Reset, Cleanup, Migration, destructive SQL, or R2 mutation.
- Do not implement 0.24.12 general-user functionality in this checkpoint.

## Validation Expectations

Recommended profile: `roadmap-development-contract`

The profile should cover:

- roadmap schema contract
- Korean display contract
- summary rendering
- detail rendering
- read-only guard
- system-admin guard
- direct hash link
- 0.24.12 draft existence
- success/failure/caution/test field existence
- completion state policy
- Handoff ZIP/build-result/repo-state contract
- package/lockfile and migration unchanged
- Build
- Mutation Audit

Manual UI verification is not required for this checkpoint because the task changes a system-admin read-only roadmap and pipeline automation contracts, not production user workflow UI. Future 0.24.12 UI/responsive work must require manual confirmation before completion.

## Known Risks

- Real Google login and browser session checks still require manual evidence when a task depends on them.
- DB smoke tests are not run without explicit approval because they require DB access and rollback fixtures.
- UI, responsive, and PDF work must remain `사용자 확인 필요` until human review is complete.

## Near Plan

Finish this roadmap infrastructure checkpoint first. After it is committed, pushed, and the latest `4. Newest` artifacts exist, the next feature task can be 0.24.12, but only after reading `lib/internal/roadmap/roadmap-0.24.12.ts`.
