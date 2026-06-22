# PeaceByPiece Productization Bible

## Purpose

This document is the canonical productization rulebook before 1.0. It converts feature-complete behavior into a releaseable product through consistent UI, explicit contracts, guarded operations, reproducible QA, and auditable release evidence.

## Product Principles

1. Preserve tenant isolation, permission boundaries, and data integrity before visual convenience.
2. Repeated structures belong in WAFL shared components or utilities, not screen-local copies.
3. Product behavior must be backed by a named contract, test, or explicit manual QA item.
4. Destructive DB/R2/Seed/Reset/Cleanup/Migration operations require separate approval and environment guards.
5. `master` is the single pre-1.0 development and QA branch; local/build/contract PASS is followed by commit and push for Vercel real-device QA.
6. Mock, demo, fallback, and simulator data must be visibly isolated from customer production paths.
7. A PB item is complete only when scope, validation, remaining risk, and release impact are recorded.

## Canonical Sources

Priority order:

1. Git state and `lib/constants/version.ts`
2. `docs/codex-current-state.md`
3. `lib/internal/roadmap/`
4. `docs/project/`
5. `docs/현재기준/`
6. audit and archived history only when needed

## Definition of Productized

A feature or screen is productized when:

- its runtime and permission gates are explicit;
- loading, empty, error, success, disabled, and locked states are defined;
- desktop, tablet, and mobile behavior is documented and tested;
- mutation sequencing prevents duplicate save, stale overwrite, and value loss;
- customer-facing copy follows i18n and terminology policy;
- WAFL components and tokens replace one-off structures where practical;
- automatic checks and manual QA evidence are listed;
- DB, R2, PDF, policy, and release impacts are recorded.

## PB Lifecycle

`identified → scoped → ready → implementing → verification → user QA → completed`

An item cannot move to `ready` without explicit scope, exclusions, success conditions, test plan, and stop conditions. It cannot move to `completed` with unresolved release blockers.

## Release Gates

- Build and type checks pass.
- Required contract tests pass.
- Mutation audit has no unexplained high-risk result.
- Runtime and permission audits have no release-blocking gap.
- Browser/device matrix has required evidence.
- PDF/R2/storage policies are approved before related production activation.
- No untracked secrets, production bindings, or accidental package/lockfile changes.
- Git is synchronized and working tree is clean after push.

## Ownership

- ChatGPT: product design, architecture, documentation, PB decomposition, QA design, release preparation, safe manual patch.
- Codex: implementation, build, test, commit, push, and large refactoring.
- User: product-policy decisions, visual acceptance, production approval, and destructive-operation authorization.
