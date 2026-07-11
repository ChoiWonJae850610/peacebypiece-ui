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
- alpha.22: approved profiles complete: 500, 5,000, and multi-tenant 5,400 WorkOrders; 10,900 total synthetic rows at WorkOrder level.
- production use: forbidden.
- next version: alpha.23 reuses existing alpha.22 fixtures for bounded Read API evidence and does not reseed by default.

Legacy seed files remain under `db/seed/` and are not moved.
