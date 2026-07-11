# v2 Additive Migration Workspace

## Responsibility

This folder is reserved for ordered, additive, reviewed v2 migration SQL beginning in alpha.21.

## Allowed files

- Reviewed additive migration drafts and their non-mutating validation manifests from alpha.21 onward.
- Migration-local documentation that records preflight, rollback, and compatibility assumptions.

## Forbidden work

- SQL files or DB execution in alpha.20.
- Production apply, destructive cleanup, seed data, direct Neon connection scripts, or full-reset SQL.

## Required migration contract

- One bounded domain change per migration.
- Explicit preflight and compatibility assumptions.
- Read-only post-apply audit.
- Rollback or feature-flag fallback stance.
- Tenant/RLS and system-admin privileged-path review.
- No destructive cleanup mixed into additive foundation migrations.

## Current stage

- alpha.20: no SQL files.
- alpha.21: SQL draft and static contract validation only, pending owner review.
- alpha.22: approved dev/test apply, post-apply audit, and 500/5,000-row validation.
- production use: forbidden until the production migration gate is explicitly approved.
- next version: alpha.21 may add reviewed SQL drafts but does not apply them.

The existing `db/migrations/` path remains the legacy/current executable baseline. Its files are not moved or rewritten for v2.
