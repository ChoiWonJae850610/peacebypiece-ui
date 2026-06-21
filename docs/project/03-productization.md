# Productization Guide — PeaceByPiece / WAFL

## Purpose

Productization is the phase between feature completion and release readiness. The goal is to make WAFL stable, consistent, testable, secure, and maintainable enough for 1.0.

0.24.15 created the Productization Audit and PB backlog. 0.24.16 establishes the shared operating documents that Codex and ChatGPT must use before applying larger PB implementation work.

## Productization Sources

- Audit report: `docs/audits/productization-audit-report-0.24.15.md`
- Backlog: `docs/productization-backlog.md`
- Roadmap: `docs/productization-roadmap.md`
- Current state: `docs/codex-current-state.md`
- Version contracts: `lib/internal/roadmap/`
- Project context: `docs/project/01-codex-context.md`
- Decision log: `docs/project/02-project-decisions.md`
- Release checklist: `docs/project/04-release-checklist.md`

## PB Operating Rules

PB items are release-readiness tracking units.

- `Critical`: release blocker or direct security/data/permission/runtime risk
- `High`: important quality/maintainability risk that should be handled soon
- `Medium`: quality improvement after blockers
- `Low`: cleanup, documentation, or developer-experience improvement

Do not close a PB item only because a partial implementation exists. Close it only when the target scope, validation, documentation, and remaining-risk notes are complete.

## Sprint Planning Rule

A sprint should group related PB items, not unrelated one-off fixes.

Recommended sprint shapes:

- runtime/permission sprint
- WAFL component/UI consistency sprint
- product cleanup/dead-code sprint
- i18n/customer-facing copy sprint
- Functions/R2/PDF sprint
- performance/responsive QA sprint
- release readiness sprint

Avoid both extremes:

- too small: one PB per Codex session, causing repeated project re-analysis
- too large: many unrelated PBs, causing unreviewable diffs and high regression risk

## Implementation Rule

For each sprint:

1. Read the current roadmap detail.
2. Read PB entries included in the sprint.
3. Identify out-of-scope areas before editing.
4. Prefer shared components/utilities and existing contracts.
5. Keep behavior-preserving changes separate from policy changes.
6. Run the approved verification profile when available.
7. Update roadmap/result documents with actual outcomes.
8. Commit/push only when automatic workflow conditions are satisfied.

## Done Definition

A productization item is done only when:

- code/docs are updated within scope
- APP_VERSION and roadmap/current-state are aligned when versioned
- build/contract verification passed or the blocker is clearly reported
- no secrets or production bindings are included
- no package/lockfile, migration, or destructive data change slipped in
- manual verification items are explicitly listed when needed
- commit/push state is recorded

## Deferred Areas

The following areas often need explicit user judgment and must not be silently finalized:

- PDF layout and storage lifecycle
- R2 quota/usage fixture policy
- visual density and responsive layout on iPad/Galaxy/mobile
- system-admin versus customer-admin product policy
- deleting deprecated Cloudflare Worker files
- DB schema/migration/seed/reset/cleanup
- customer-facing legal/policy copy

## Codex Sprint Prompt Template

Use `docs/project/codex-sprint-prompt.md` as the reusable Sprint instruction template after 0.24.17. The compact inline version below remains as a quick reference:

```text
Read:
- AGENTS.md
- docs/codex-current-state.md
- docs/project/01-codex-context.md
- docs/project/02-project-decisions.md
- docs/project/03-productization.md
- docs/project/04-release-checklist.md
- docs/productization-backlog.md
- lib/internal/roadmap/roadmap-<target-version>.ts

Target version:
<version>

Sprint PB items:
<PB IDs>

Scope:
<short scope>

Out of scope:
<explicit exclusions>

Run validation:
<approved workflow profile or exact commands>

Finish:
Update APP_VERSION/docs/roadmap/current-state as needed, commit, push, and report build/test/git/manual QA status.
```
