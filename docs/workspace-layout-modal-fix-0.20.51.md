# 0.20.51 workspace layout and modal touch fix

## Scope

- Align the material-order workspace header-to-content spacing with other PC workspace screens.
- Align the settings hub content width with the common workspace container by removing the remaining inner right padding.
- Treat narrow tablet landscape layouts, such as iPad mini landscape, as a drawer-list layout by raising the tablet three-panel width threshold.
- Strengthen the common modal top-layer behavior and no-zoom scope for mobile workorder modals.
- Raise the common select popover layer so category/manager/inventory modal interactions are not hidden behind modal surfaces.

## Non-goals

- No workflow state, permission, API, DB schema, R2, attachment, memo, trash, or purge flow changes.
- No material-order permission/button policy changes yet.
