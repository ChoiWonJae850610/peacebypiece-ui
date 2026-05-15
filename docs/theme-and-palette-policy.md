# PeaceByPiece Theme and Palette Policy

## Purpose

PeaceByPiece screens use theme tokens for surfaces, borders, text, charts, and workflow states. New themes must not only change page/card colors. They must also define chart and workflow palettes so dashboards, storage summaries, and work order status views stay visually consistent.

## Required tokens for every new theme

When adding a new theme file under `lib/theme/themes`, verify that the theme provides or intentionally inherits the following token groups.

### Chart palette

Required chart tokens:

- `--pbp-chart-1`
- `--pbp-chart-2`
- `--pbp-chart-3`
- `--pbp-chart-4`
- `--pbp-chart-5`
- `--pbp-chart-6`

Usage rules:

- `/admin/stats` donut segments use this palette.
- `/admin/stats` legend dots use the same palette index as the donut segment.
- `/admin/stats` tooltip markers use the same palette index as the donut segment.
- `/admin/files` file type donut uses this same palette.
- `/admin/files` file type legend dots and bars use the same palette index as the donut segment.
- If a chart has more than six items, the palette can repeat by index.

### Work order workflow palette

Required workflow status tokens:

- `--pbp-workorder-status-draft-bg`
- `--pbp-workorder-status-draft-text`
- `--pbp-workorder-status-draft-dot`
- `--pbp-workorder-status-review-requested-bg`
- `--pbp-workorder-status-review-requested-text`
- `--pbp-workorder-status-review-requested-dot`
- `--pbp-workorder-status-review-completed-bg`
- `--pbp-workorder-status-review-completed-text`
- `--pbp-workorder-status-review-completed-dot`
- `--pbp-workorder-status-request-order-bg`
- `--pbp-workorder-status-request-order-text`
- `--pbp-workorder-status-request-order-dot`
- `--pbp-workorder-status-inspection-bg`
- `--pbp-workorder-status-inspection-text`
- `--pbp-workorder-status-inspection-dot`
- `--pbp-workorder-status-completed-bg`
- `--pbp-workorder-status-completed-text`
- `--pbp-workorder-status-completed-dot`
- `--pbp-workorder-status-rejected-bg`
- `--pbp-workorder-status-rejected-text`
- `--pbp-workorder-status-rejected-dot`

Usage rules:

- Work order progress dots use the workflow dot tokens.
- Work order list status badges use the workflow background/text/dot tokens.
- The workflow palette is semantic, not decorative. Do not reuse chart palette tokens directly for workflow state unless the result remains readable and meaningful.

## Implementation rule

Presentation components should not hardcode chart or workflow colors with Tailwind color classes such as `bg-emerald-500`, `text-violet-700`, or `bg-stone-900` when representing chart segments or workflow states. Use CSS variables through presentation utilities instead.

## Review checklist before merging a new theme

- Chart segments, legend dots, and tooltip markers match by item index.
- Storage file type donut and its legend use the same chart palette.
- Work order progress dots change with the selected theme.
- Work order list status badges change with the selected theme.
- Light/dark contrast is readable for all workflow status badges.
- No customer-facing screen falls back to unrelated default colors because a palette token is missing.
