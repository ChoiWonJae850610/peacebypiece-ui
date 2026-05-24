Version : 0.16.26
Summary : workspace 라우팅 권한과 메뉴 노출 보정
Description : 비로그인 /system 개발 자동 진입을 명시 설정 없이는 차단하고, workspace 홈을 고객사 관리자와 일반 멤버로 분기했습니다. 일반 멤버는 보유 권한 기준의 업무 홈 카드만 표시되도록 조정하고, workspace 상단 메뉴에 원단·부자재를 포함한 실제 navigationItems를 렌더링했습니다. /workspace/storage 구 경로는 /workspace/files로 리다이렉트하며, 주요 workspace 페이지에 페이지 단위 권한 가드를 추가했습니다. APP_VERSION을 0.16.26으로 갱신했습니다.
수정 파일 목록 :
- app/(workspace)/workspace/page.tsx
- app/(workspace)/workspace/files/page.tsx
- app/(workspace)/workspace/history/page.tsx
- app/(workspace)/workspace/invites/page.tsx
- app/(workspace)/workspace/materials/page.tsx
- app/(workspace)/workspace/members/page.tsx
- app/(workspace)/workspace/partners/page.tsx
- app/(workspace)/workspace/settings/page.tsx
- app/(workspace)/workspace/stats/page.tsx
- app/(workspace)/workspace/subscription/page.tsx
- components/admin/dashboard/AdminConsoleSections.tsx
- components/workspace/layout/WorkspaceTopbar.tsx
- features/workorders/page/WorkordersWorkspacePage.tsx
- lib/admin/adminWorkspaceCards.ts
- lib/auth/routeGuard.ts
- lib/constants/app.ts
- lib/system/devSystemAdmin.ts
추가 파일 목록 :
- app/(workspace)/workspace/storage/page.tsx
- components/admin/dashboard/AdminInvitationOnboardingEntry.tsx
- components/admin/files/AdminFilesWorkspaceClient.tsx
삭제 파일 목록 :
- 없음
