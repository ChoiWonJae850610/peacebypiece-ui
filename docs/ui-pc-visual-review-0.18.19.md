# UI PC visual review 0.18.19

## Purpose

This checkpoint records the first desktop visual review pass after AppCard, AppButton, AppBadge, AppSection, AppListRow, AppSheet, AppTooltip, and Sonner wrapper work.

## Scope

- Work order desktop workspace
- Material order desktop workspace
- Workspace home
- Admin/statistics/storage/member/system major screens

## Applied change

- The work order desktop three-pane layout now uses WAFL semantic surface variables instead of direct `stone`/`white` color tokens.
- The change is intentionally limited to layout surface/background classes.
- Detail, side panel, attachment, memo, DB, API, R2, trash, restore, purge, and workflow logic were not changed.

## Review notes

### Work order desktop

- Keep the three-pane desktop structure.
- Sidebar, detail, and right side panel should read as one semantic product surface.
- Avoid adding another nested card layer unless the content needs a separate interaction boundary.

### Material order desktop

- Keep the three-pane production structure.
- List, detail, and material allocation panels should remain visible on desktop.
- Do not convert the desktop material allocation panel into a sheet.

### Admin screens

- AdminCard/AdminButton/AdminStatusBadge should remain shims over App* UI wrappers.
- Table-heavy screens are still candidates for TanStack Table after the current visual cleanup pass.

## Next candidate

0.18.20 should start TanStack Table candidate analysis or table wrapper design, unless a build failure or desktop screenshot issue is reported first.
