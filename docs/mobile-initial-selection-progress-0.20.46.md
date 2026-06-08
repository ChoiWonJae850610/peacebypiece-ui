# 0.20.46 mobile initial selection and progress display

## Scope

- Keep workorder and material-order workspace entry unselected unless a direct URL id is provided.
- Prevent list loading from automatically hydrating the first detail on initial entry.
- Display material-order progress as a vertical numbered card list on mobile and tablet portrait.
- Keep tablet landscape and desktop progress behavior unchanged.

## Selection policy

- Search, filter, sort, and initial list loading only change the list candidates.
- Detail panes remain empty until the user explicitly selects an item.
- Direct URL ids and creation/status actions may still select the relevant item.
- Deleted or inaccessible selections may still fall back to an available item through existing invalid-selection recovery.

## Non-goals

- No DB schema changes.
- No API, R2, attachment, memo, trash, purge, permission, or workflow-state changes.
