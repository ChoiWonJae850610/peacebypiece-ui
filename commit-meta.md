Version : 0.16.27
Summary : 개발용 시스템관리자 우회와 일반 멤버 환경설정 노출 정리
Description : WAFL_ENABLE_SYSTEM_DEV_ENTRY 기반 시스템관리자 API 우회와 개발용 시스템관리자 상수를 제거하고, 실제 로그인 세션의 system_admin role만 시스템 API를 사용할 수 있도록 정리했습니다. 일반 멤버의 workspace 홈/홈 버튼 경로를 /workspace로 통일하고, 일반 멤버에게 환경설정 메뉴와 환경설정 홈 카드를 숨기며 /workspace/settings 직접 접근은 고객사 관리자만 허용하도록 보정했습니다. 원단·부자재 등 workspace 메뉴는 현재 로그인 role 기준 navigation을 전달하도록 정리했습니다.
수정 파일 목록 :
- app/(workspace)/workspace/files/page.tsx
- app/(workspace)/workspace/history/page.tsx
- app/(workspace)/workspace/materials/page.tsx
- app/(workspace)/workspace/members/page.tsx
- app/(workspace)/workspace/page.tsx
- app/(workspace)/workspace/partners/page.tsx
- app/(workspace)/workspace/settings/page.tsx
- app/(workspace)/workspace/stats/page.tsx
- app/(workspace)/workspace/subscription/page.tsx
- components/admin/dashboard/AdminConsoleSections.tsx
- components/admin/files/AdminFilesWorkspaceClient.tsx
- components/system/SystemConsoleShell.tsx
- lib/admin/adminWorkspaceCards.ts
- lib/auth/loginRepository.ts
- lib/constants/app.ts
- lib/invitations/invitationRepository.ts
- lib/navigation/workspaceHomeRoutes.ts
- lib/navigation/workspaceNavigation.ts
- lib/system/sessionScope.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- lib/system/devSystemAdmin.ts
