# WAFL responsive summary header 0.23.03

## Purpose
- Keep work-order and material-order summary cards on one WAFL layout rule.
- Use one column on narrow mobile screens and two columns on tablet portrait widths.
- Prevent direct number formatting and direct save-feedback copy from returning to workspace headers.

## Shared components
- `WaflResponsiveSummaryGrid`
- `WaflSummaryHeaderCard` with `responsiveColumns`
- `WorkOrderSummaryInfoCell`

## Responsive rule
- Narrow mobile detail area: one column.
- Detail area 600px or wider: two columns.
- Desktop and landscape workspace cards keep their existing fixed column rules.
