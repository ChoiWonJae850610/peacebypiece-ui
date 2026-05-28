# 0.17.93 PC UI common wrapper expansion

## Purpose

This patch expands the WAFL App UI wrapper usage in PC-facing workorder/material-order surfaces without changing business flows.

## Scope

- Workorder production/process section visual surface cleanup
- Workorder material section visual surface cleanup
- Material-order empty/error message action button cleanup
- App UI wrapper adoption only

## Applied components

- `AppCard`
- `AppButton`
- `AppBadge`

## Boundary

The following flows are intentionally unchanged.

- Workorder save/edit flow
- Workflow state transitions
- Material-order save/status flow
- Attachment/memo/R2 upload flow
- Trash/restore/purge flow
- API/DB logic

## Notes

Some workorder detail section components are reused by desktop/tablet/mobile detail views. This patch changes visual tokens only and does not alter layout branching or data logic.
