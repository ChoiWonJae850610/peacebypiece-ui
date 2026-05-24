Version : 0.16.7
Summary : Workspace Shell 구조 정리
Description : 고객사 업무 영역의 공통 Shell, Topbar, Sidebar, navigation 정의를 workspace 계층으로 분리하고 workspace 라우트에서 WorkspaceShell과 중앙화된 workspace navigation을 사용하도록 정리했습니다. 기존 admin 공통 UI 구현은 호환 계층으로 유지했으며 화면, DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- app/(workspace)/workspace/files/page.tsx
- app/(workspace)/workspace/history/page.tsx
- app/(workspace)/workspace/members/page.tsx
- app/(workspace)/workspace/page.tsx
- app/(workspace)/workspace/partners/page.tsx
- app/(workspace)/workspace/settings/page.tsx
- app/(workspace)/workspace/standards/page.tsx
- app/(workspace)/workspace/stats/page.tsx
- app/(workspace)/workspace/subscription/page.tsx
- lib/admin/adminDashboard.presentation.ts
- lib/constants/app.ts
추가 파일 목록 :
- components/workspace/layout/WorkspaceShell.tsx
- components/workspace/layout/WorkspaceSidebar.tsx
- components/workspace/layout/WorkspaceTopbar.tsx
- lib/navigation/workspaceNavigation.ts
삭제 파일 목록 :
- 없음
