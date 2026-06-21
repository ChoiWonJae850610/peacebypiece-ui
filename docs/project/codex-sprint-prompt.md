# Codex Sprint Prompt Template

Use this template for future PeaceByPiece / WAFL productization sprints.

## Sprint Start

```text
# PeaceByPiece / WAFL

Version
<target-version>

Branch
master

Git baseline
master = origin/master
working tree clean

Complete this sprint as <target-version>.
```

Before implementation, Codex must check:

- `git status --branch --short`
- `git rev-parse HEAD`
- `git rev-list --left-right --count origin/master...HEAD`
- `lib/constants/version.ts`

Continue automatically only when the automatic Git conditions in `AGENTS.md` are satisfied.

## Read First

```text
Read these before implementation:
- AGENTS.md
- docs/codex-current-state.md
- docs/project/01-codex-context.md
- docs/project/02-project-decisions.md
- docs/project/03-productization.md
- docs/project/04-release-checklist.md
- docs/productization-backlog.md
- docs/productization-roadmap.md
- lib/internal/roadmap/roadmap-<target-version>.ts
```

If sources conflict, prefer local Git state, then `lib/internal/roadmap/*`, then `docs/codex-current-state.md`, then `docs/project/*`.

## Sprint Contract

```text
Sprint PB items:
<PB IDs and priorities>

Scope:
<small implementation scope>

Out of scope:
- New features
- DB migration
- API contract changes
- Runtime policy changes
- Permission policy changes
- Production data access or mutation
- Dependency or lockfile changes
- Broad rename/move/refactor
```

## Implementation Order

1. Analyze impact scope and list likely files.
2. Prefer WAFL shared components before screen-local UI.
3. Prefer existing utilities, hooks, services, and repositories before adding new modules.
4. Apply the smallest safe code change first.
5. Update `APP_VERSION` for versioned patch work.
6. Update roadmap/current-state/productization docs and `pending-tests.md`.
7. Keep `commit-meta.md` in the existing format with required tokens such as `Version :`, `Summary :`, and `Description :`.
8. Record manual verification items when UI, responsive, PDF, or visual behavior changes.

## Build And Test

Use the approved wrapper profile when it covers the scope:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile <profile>
```

Common profiles:

- `repository-cleanup`
- `workspace-commonization`
- `roadmap-development-contract`
- `system-admin-internal-access`
- `functions-automation`
- `automation-infrastructure`

When needed, run focused checks first, then the wrapper:

```powershell
npm run build
```

Report every failure or skipped check with the reason.

## Commit And Push

When automatic Git conditions are satisfied, use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Plan -Profile <profile> -CommitMessage "<message>" -ExpectedAppVersion "<target-version>"
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Finish -Profile <profile> -CommitMessage "<message>" -ExpectedAppVersion "<target-version>"
```

Finish must stage only explicit in-scope paths, commit, push to `origin master`, and generate the `4. Newest` handoff artifacts when enabled.

Stop before commit/push if validation fails, unexpected files change, dependency/lockfile/schema changes appear, secrets are detected, or manual user judgment is required before Git history changes.

## Result Report

Include:

1. Original version and result version
2. Work summary
3. Productization progress change
4. Modified files
5. Build result
6. Test result
7. Failures and skips
8. DB migration status
9. Runtime/permission/API/package/lockfile status
10. Git status, commit hash, and push result
11. Handoff artifact names when generated
12. Manual user verification items
13. Remaining risks
14. Next sprint recommendation
15. Approximate Codex usage
