# 0.21.93 Workspace responsive refactor

## Summary
- Added `useWorkspaceLayoutMode` as the shared responsive layout decision hook.
- Added `WaflTwoPanelWorkspace` for compact tablet landscape layouts.
- Updated workorder and material order workspaces to share the same drawer, two-panel, and three-panel branching policy.

## Layout policy
- Mobile and tablet portrait: drawer navigation with single main content.
- Compact tablet landscape: list drawer plus detail and side two-panel workspace.
- Large tablet landscape and desktop: three-panel workspace.

## QA points
- Workorder desktop: list, detail, side three-panel.
- Workorder iPad mini landscape: list drawer plus detail and side two-panel.
- Workorder tablet portrait/mobile: list drawer plus single detail view.
- Material order desktop: list, detail, allocation three-panel.
- Material order iPad mini landscape: list drawer plus detail and allocation two-panel.
- Material order tablet portrait/mobile: list drawer plus single detail view.
