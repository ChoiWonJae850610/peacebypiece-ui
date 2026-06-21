# Project Decisions — PeaceByPiece / WAFL

This file records durable project decisions. Add new entries instead of relying on chat memory.

## Decision-001 — Master-only development/QA branch before 1.0

Use `master` as the single development and QA branch before 1.0.

Reason: Vercel deployment is required for iPad, mobile, tablet, and real-device QA. Keeping one branch avoids drift between local patches, ChatGPT handoff ZIPs, Codex commits, and Vercel preview/production-like deployments.

## Decision-002 — Commit and push after successful local/build/contract checks

Do not leave UI, permission, or runtime changes unpushed merely because manual device QA remains.

Reason: real-device QA depends on deployed Vercel output. Manual QA findings are handled as same-version fixes or follow-up patches.

## Decision-003 — ZIP/repo-state workflow remains valid for ChatGPT patch work

When source work is requested in ChatGPT without Git connection, the user provides a full source ZIP and matching repo-state. The result is a flat patch ZIP with `commit-meta.md`.

Reason: this keeps ChatGPT work reproducible and prevents accidental reliance on unstated repository state.

## Decision-004 — Codex uses committed project context, not chat memory

Codex must read `AGENTS.md`, `docs/codex-current-state.md`, `docs/project/*`, `docs/productization-backlog.md`, and the target roadmap detail before version work.

Reason: product rules and long-running decisions must be visible in the repository.

## Decision-005 — Runtime guards protect dangerous actions, not system-admin read-only views

Routes such as `/id-control`, `/roadmap`, `/ui`, and `/functions` are system-admin-only internal read/view screens. Dangerous commands remain separately runtime/action guarded.

Reason: system administrators need to inspect the project in Vercel QA while destructive or mutating actions remain unavailable outside approved dev/test contexts.

## Decision-006 — `/dev/test-console` remains production-blocked

`/dev/test-console` is not the same as the read-only internal system-admin screens. It remains explicitly enabled, dev/test oriented, and production-blocked.

Reason: the page may contain account switching, impersonation, seed/reset, simulator, or fixture workflows that must never become normal production actions.

## Decision-007 — WAFL component system is the preferred UI direction

Repeated UI structures should be implemented through shared WAFL components/utilities instead of screen-local styling.

Reason: the app is in productization phase; consistent spacing, density, responsive behavior, and empty/loading/error states matter more than adding isolated new UI.

## Decision-008 — Productization Audit and PB backlog are canonical before 1.0

The 0.24.15 Productization Audit created PB items to drive 1.0 readiness. PB IDs are used as tracking units for sprints.

Reason: the remaining work is cross-cutting and must be prioritized by release risk, not by scattered screen requests.

## Decision-009 — Audit versions and implementation versions are separated

Audit/reporting versions may create findings and backlog without broad code changes. Implementation versions address selected PB items.

Reason: separating discovery from implementation reduces blast radius and makes review easier.

## Decision-010 — UI/responsive/PDF work requires human confirmation

Even when build and contract tests pass, visual layout, device behavior, focus/scroll behavior, and PDF output remain `사용자 확인 필요` until reviewed by the user.

Reason: these areas require judgment on actual devices or generated output.

## Decision-011 — DB/R2/seed/reset/cleanup remains dev/test-only and explicitly approved

Test data is allowed in dedicated dev/test environments, but destructive commands, cleanup, seed, reset, schema execution, and R2 object creation/deletion require explicit confirmation and guards.

Reason: tenant isolation, customer data safety, and production separation are release blockers.

## Decision-012 — PowerShell automation is tracked in the repository

The canonical PowerShell entry point is `tools/pipeline/peacebypiece-auto-pipeline.ps1`. Separate PowerShell uploads are unnecessary unless a newer external copy exists or a script-only task is requested.

Reason: repository-tracked automation lets Codex and local work use the same verification entry point.

## Decision-013 — Productization documentation must be concise

Project-wide operating documents live under `docs/project/` and are intentionally limited to a small set of canonical files.

Reason: Codex and future maintainers should read fewer stronger documents, not many overlapping documents.

## Decision-014 — Productization Sprint 0.24.16 establishes shared operating context

0.24.16 creates the Codex/GPT project operating context instead of starting broad UI code changes immediately.

Reason: after 0.24.15 audit, the project needs a stable written operating model before Codex spends larger implementation cycles on PB items.

## Adding New Decisions

Use the next number and include:

- decision title
- decision text
- reason
- affected files/routes/tools
- whether user confirmation is required
