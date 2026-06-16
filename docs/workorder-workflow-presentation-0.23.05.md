# Work order workflow presentation consolidation — 0.23.05

## Purpose

- Remove visible helper text below workflow action buttons.
- Keep processing feedback inside the active button through its spinner and processing label.
- Use the same workflow action builder and WAFL progress panel for desktop, tablet, and mobile.

## Structure

- `WorkOrderActionSection` owns workflow step and action presentation logic.
- Desktop and tablet use `layout="horizontal"`.
- Mobile uses the same component with `layout="vertical"`.
- Workspace write locks still disable actions and prevent duplicate requests.
- Lock and processing messages are no longer rendered as separate helper text under buttons.

## Result

Workflow state labels, primary action selection, processing labels, badges, action locking, and direct-order paths are calculated in one implementation instead of separate desktop and mobile implementations.
