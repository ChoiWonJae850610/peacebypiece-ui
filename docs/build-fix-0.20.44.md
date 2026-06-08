# 0.20.44 build fix

## Scope

- Fix the 0.20.43 TypeScript build failure caused by `ProductionCompositionSection` missing the `onRemoveZeroQuantityMaterials` prop in its component props type.
- Keep the 0-quantity material cleanup action wired through PC, tablet, and mobile production composition views.

## Non-goals

- No API, DB, R2, workflow, permission, attachment, memo, trash, or purge flow changes.
