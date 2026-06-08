# 0.20.45 mobile workorder/material order UI fix

## Scope

- Prevent mobile focus zoom in the work order creation modal by applying the WAFL mobile no-zoom scope to the modal root.
- Restore visible title-edit affordance on mobile/tablet work order headers.
- Make category, manager, and inventory summary cards visibly actionable when they can be edited.
- Improve the mobile work order workflow section so stage order is easier to read.
- Reuse the common workflow action layout so material-order mobile action buttons appear as mobile-friendly square buttons below the progress area.

## Non-goals

- No workflow state transition logic changes.
- No permission logic changes.
- No API, DB, R2, attachment, memo, trash, or purge flow changes.
