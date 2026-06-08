# 0.20.48 workspace header and responsive layout cleanup

## Scope
- Align workorder desktop header width with its three-panel workspace container.
- Use the common WAFL topbar for workorder mobile drawer entry instead of the separate mobile-only top bar.
- Move material-order workspace header ownership into the editor so the menu action can live in the same common topbar and duplicate mobile/tablet headers are removed.
- Keep mobile progress vertical only; tablet and PC progress use the horizontal line/dot workflow.

## Non-goals
- No API, DB, permission, R2, attachment, memo, trash, or purge flow changes.
