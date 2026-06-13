# 0.21.99 Vercel dependency and iPad mini modal policy

## Summary
- Added `date-fns` as a direct dependency because date picker components import `date-fns/locale` directly.
- Updated compact tablet detection so iPad mini portrait is treated as tablet, not mobile.
- Added centered modal presentation to `AppSheet` and `WaflMobileTabbedActionSheet`.
- Applied centered modal presentation to material-order target sheet and work-order related section sheet on tablet devices.
- Hiding of the material-order mobile status summary follows the corrected tablet detection because the detail panel only shows it for `deviceType === mobile`.

## Manual QA
- Vercel deployment should no longer fail with `Module not found: Can't resolve date-fns/locale`.
- iPad mini portrait should use tablet modal behavior for material-order target selection.
- iPad mini portrait should not show the extra material-order mobile status summary card.
- Phones should still use bottom sheets.
- iPad mini landscape should keep two-panel workspace.
