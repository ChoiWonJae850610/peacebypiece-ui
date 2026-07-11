# v2 Integrated Schema Workspace

## Responsibility

This folder will eventually contain the integrated canonical v2 schema after ordered additive migrations are stable and verified.

## Allowed files

- Future canonical schema documentation.
- A future `full_reset.sql` only after migration stabilization, owner review, and explicit work order approval.
- Schema-only validation manifests that do not connect to a database.

## Forbidden now

- `full_reset.sql` in alpha.20.
- Executable SQL, DB connection scripts, migrations, seeds, or destructive reset commands.
- Any production execution path.

## Lifecycle

- Current stage: README boundary only.
- alpha.21: migration drafts belong in `../migrations`, not here.
- alpha.22: dev/test migrations are applied and audited before any integrated schema is assembled.
- Future full reset: dev/test only and production-blocked.
- Next version: alpha.21 keeps this folder documentation-only while additive SQL drafts begin under `../migrations`.

The legacy `db/schema/full_reset.sql` remains in place and is not renamed, moved, or treated as the v2 schema.
