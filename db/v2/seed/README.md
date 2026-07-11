# v2 Dev/Test Seed Workspace

## Responsibility

This folder is reserved for deterministic, repeatable v2 dev/test fixtures and the future 500/5,000-workorder performance datasets.

## Allowed files

- Future dev/test-only seed manifests, deterministic fixture definitions, and guarded runners after explicit approval.

## Forbidden work

- Seed SQL or executable fixture scripts in alpha.20.
- Production execution, real business data, unguarded mutation, or mixed reset/migration behavior.

## Rules

- Dev/test only; production execution is blocked.
- Use canonical `wafl-fn` fixture IDs and company prefixes.
- Keep normal QA fixtures separate from large performance fixtures.
- Every execute mode needs environment guards, explicit confirmation, a manifest, and cleanup accounting.
- Never include real customer, partner, factory, attachment, or PDF data.

## Current stage

- alpha.20: no seed SQL or scripts.
- alpha.21: seed contract/manifest planning may begin.
- alpha.22: approved dev/test seed execution after migration post-apply PASS.
- production use: forbidden.
- next version: alpha.21 may define manifests only; execution remains deferred to alpha.22.

Legacy seed files remain under `db/seed/` and are not moved.
