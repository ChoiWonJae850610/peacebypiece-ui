# Release Checklist — PeaceByPiece / WAFL

Use this checklist before marking a productization version complete or before 1.0 release readiness review.

## Version And Git

- [ ] `lib/constants/version.ts` `APP_VERSION` matches the result version.
- [ ] `README.md` current version is updated.
- [ ] `docs/README.md` current version is updated.
- [ ] `docs/codex-current-state.md` current/result/next versions are updated.
- [ ] `docs/productization-roadmap.md` is updated.
- [ ] `lib/internal/roadmap/` result fields are updated.
- [ ] `commit-meta.md` uses the required `Version :` style.
- [ ] Branch is `master`.
- [ ] `origin/master...HEAD` starts at ahead `0`, behind `0` before automatic version work.
- [ ] Final working tree is clean after commit/push.
- [ ] Push to `origin/master` completed when automatic conditions are satisfied.

## Build And Static Validation

- [ ] Build passed, or failure is clearly classified as environment versus code.
- [ ] Lint/typecheck/contract tests passed when available.
- [ ] `git diff --check` passed.
- [ ] No package metadata or lockfile changed without approval.
- [ ] No generated artifact noise was committed.

## Runtime And Permission

- [ ] System-admin internal read-only routes are blocked for unauthorized users.
- [ ] Dangerous actions remain runtime/action guarded.
- [ ] `/dev/test-console` remains production-blocked.
- [ ] Permission checks exist at UI affordance and API/server layers where applicable.
- [ ] Tenant isolation is preserved.
- [ ] Impersonation, if touched, keeps allowlist, restore flow, and audit logging.

## Data, DB, R2, And PDF

- [ ] DB migration status is explicitly stated.
- [ ] No seed/reset/cleanup/destructive SQL ran without approval.
- [ ] R2 create/delete/fixture work is dev/test-only and guarded.
- [ ] PDF generation/storage policy is documented when touched.
- [ ] Deprecated Cloudflare Worker files are not deleted without approval.

## WAFL UI And Responsive

- [ ] Shared WAFL components/utilities are used before new one-off UI.
- [ ] Empty/loading/error states remain consistent.
- [ ] Save/lock/toast behavior preserves existing values during async saves.
- [ ] PC, iPad mini, iPad Pro, Galaxy Tab, and mobile manual QA items are listed when UI changes.
- [ ] Visual/responsive changes are not marked complete before human review.

## i18n And Customer-Facing Text

- [ ] User-facing Korean text remains correct.
- [ ] Customer-facing/public strings are i18n-ready when touched.
- [ ] Legal/policy copy is not changed as a side effect of UI cleanup.

## Productization Backlog

- [ ] PB items affected by the work are referenced in the result report.
- [ ] PB status is updated or deferred with a reason.
- [ ] Critical/High items are not silently skipped when they are in scope.
- [ ] Remaining risks and manual verification are listed.

## Final Report

- [ ] Original version
- [ ] Result version
- [ ] App development progress
- [ ] Productization progress
- [ ] Git status
- [ ] Files changed
- [ ] Tests run
- [ ] Failures/skips
- [ ] DB migration status
- [ ] PowerShell change status
- [ ] Manual user verification items
- [ ] Next version and next work
- [ ] Whether next ZIP, repo-state, and PowerShell upload are required
