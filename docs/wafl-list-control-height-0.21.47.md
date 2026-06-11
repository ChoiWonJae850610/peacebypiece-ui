# WAFL List Control Set height correction 0.21.47

## Scope
- Work order list panel
- Material order list panel

## Decision
The search input, clear button, and filter select triggers in list panels must share the same control height and vertical rhythm.

## Common control set
- Search input: `h-10 min-h-10 text-xs`
- Clear button: `h-10 min-h-10 text-xs`
- Select trigger: `h-10 min-h-10 text-xs`
- Search row gap: `gap-2`
- Select row gap: `gap-2`
- Create button top gap: `mt-2`

## Notes
- The create button remains a primary full-width action and may keep the `md` button density.
- The create button spacing is standardized against the search/select stack so the list panel does not look like separate ad-hoc controls.
- This patch does not change DB schema or material order workflow logic.
