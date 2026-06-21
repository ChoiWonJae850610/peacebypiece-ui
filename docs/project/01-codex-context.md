# Codex Context — PeaceByPiece / WAFL

## Purpose

PeaceByPiece / WAFL is a productization-stage web app for apparel production operations. It manages workorders, materials, supplier orders, customer companies, workers, internal administration, PDF/R2 storage flows, and development verification tools.

This document is the short context that Codex must read before productization sprint work. It records the intent behind the current structure so that implementation decisions stay consistent across ChatGPT, Codex, local Git, and Vercel QA.

## Current Baseline

- Context document version: `0.24.16`
- Source baseline before this document set: `0.24.15`
- Current development stage: productization, cleanup, verification, and release readiness
- Estimated app feature progress: about `94%`
- DB migration for this document set: none
- Productization source of truth:
  - `AGENTS.md`
  - `docs/codex-current-state.md`
  - `docs/project/01-codex-context.md`
  - `docs/project/02-project-decisions.md`
  - `docs/project/03-productization.md`
  - `docs/project/04-release-checklist.md`
  - `docs/productization-backlog.md`
  - `docs/productization-roadmap.md`
  - `lib/internal/roadmap/`

## Operating Model

ChatGPT is used for planning, audit, backlog shaping, prompt drafting, review, and patch generation when ZIP-based work is requested.

Codex is used for repository-connected implementation, safe refactoring, build/test execution, commit, push, and handoff artifact generation when the repository and approvals are available.

The project itself must remember decisions through committed documents. Do not depend on chat history when the repository contains a newer canonical document.

## Work Start Order

Before implementation, read in this order:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/01-codex-context.md`
4. `docs/project/02-project-decisions.md`
5. `docs/project/03-productization.md`
6. `docs/productization-backlog.md`
7. the target file under `lib/internal/roadmap/`

If these sources conflict, prefer local Git state, then `lib/internal/roadmap/`, then `docs/codex-current-state.md`, then this project context set, then archived documents.

## Non-Negotiable Rules

- Keep `master` as the development/QA branch before 1.0.
- Push to `origin/master` after local/build/contract checks pass so Vercel can deploy for iPad/mobile/real-device QA.
- Do not expose secrets, `.env.local`, actual DB/R2 URLs, tokens, account IDs, or production bindings.
- Do not change dependencies or lockfiles without explicit approval.
- Do not run DB/R2/seed/reset/cleanup/destructive commands without explicit approval and environment guards.
- Do not alter runtime, permission, tenant isolation, legal/policy, DB schema, migration, R2, or PDF storage policy as a side effect of UI cleanup.
- Do not mark UI/responsive/PDF work complete until required human review is done.
- Keep user-facing Korean text by default unless an i18n/product decision says otherwise.

## WAFL Component Principle

Repeated UI structures must move toward WAFL shared components and utilities instead of screen-specific one-off styles.

Primary commonization targets:

- page shell
- section panel
- section header
- summary card
- filter bar
- table and responsive list
- button/action button
- notice/alert
- empty/loading/error state
- modal/drawer input behavior
- toast and save feedback

Small scoped migration is preferred over broad rewrites. Preserve behavior first; improve visual consistency second.

## Runtime And Permission Principle

Internal system-admin read-only screens may be visible in Vercel QA and production deployment environments only to authenticated active system-admin users. Dangerous actions remain dev/test-only and action-guarded.

Do not confuse route visibility with action execution. A system-admin page may be viewable while reset/seed/R2 mutation actions remain disabled.

## Verification Principle

Automatic validation proves that code contracts have not regressed. It does not replace manual judgment for visual design, responsive layout, PDF output, or real-device focus/scroll behavior.

When validation cannot run in the current environment, report that separately from code failure and provide user-run commands.
