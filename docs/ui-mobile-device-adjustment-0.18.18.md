# UI mobile device adjustment 0.18.18

## Scope

- Workorder mobile attachment/memo sheet safe-area spacing.
- Material order mobile material-selection sheet and bottom action spacing.
- Shared AppSheet bottom-sheet viewport behavior.

## Changes

- `AppSheet` bottom sheets now use `dvh`-based height limits and overscroll containment.
- Sheet footers and mobile sheet content preserve bottom safe-area spacing.
- Workorder mobile attachment/memo sheet content receives safe-area bottom padding.
- Material order mobile detail view keeps the material-selection action reachable near the bottom and opens the allocation panel in the existing bottom sheet.

## Non-goals

- No desktop three-column layout change.
- No DB/API/R2/attachment/memo/trash/purge flow change.
- No broad table or form-library migration.
