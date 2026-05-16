Version : 0.13.22
Summary : 개인 환경설정 페이지 제거와 작업지시서 상단 버튼 정렬
Description : /me/settings와 /admin/dashboard 구 route를 삭제 대상으로 정리하고, 개인 환경설정은 전역 모달로만 사용하도록 참조를 제거했습니다. 작업지시서 화면의 홈, 개인 설정, 새로고침, 로그아웃 버튼을 같은 상단 버튼 묶음으로 정리하고 작업지시서 PC/tablet/mobile에서 개인 설정 모달과 로그아웃 진입을 사용할 수 있게 했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/layout/SidebarContent.tsx
- components/layout/MobileTopBar.tsx
- components/workorder/layout/WorkOrderDetailDesktopView.tsx
- components/workorder/layout/WorkOrderDetailTabletView.tsx
- components/invitations/PendingApprovalDashboard.tsx
- components/admin/settings/AdminSettingsHub.tsx
- components/admin/settings/AdminOrganizationSettingsSummary.tsx
- lib/admin/settings/adminAccountSettingsPlaceholder.ts
- lib/admin/settings/organizationSettingsPresentation.ts
- lib/navigation/memberWorkspaceCards.ts
- lib/i18n/ko/common.ts
- lib/i18n/en/common.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/theme/semanticThemeTokens.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- app/me/settings/page.tsx
- app/admin/dashboard/page.tsx
