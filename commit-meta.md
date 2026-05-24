Version : 0.16.5
Summary : /admin 라우트를 /workspace로 전환
Description : 고객사 업무 영역의 화면 라우트를 /admin에서 /workspace로 이동하고, 작업지시서 진입 경로를 /workspace/workorders로 연결했습니다. 기존 /admin 화면 파일은 삭제 대상으로 정리했으며, API 경로와 lib/admin 도메인 모듈명은 이번 단계에서 유지했습니다.
수정 파일 목록 :
- app/(workspace)/workspace/layout.tsx
- app/(workspace)/workspace/page.tsx
- app/(workspace)/workspace/partners/page.tsx
- components/admin/AdminWorkOrderHistoryButton.tsx
- components/admin/billing/AdminCompanyAccessGate.tsx
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- components/admin/dashboard/AdminOperationsDashboard.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
- components/admin/invitations/CompanyMemberInviteSkeleton.tsx
- components/admin/layout/AdminTopbar.tsx
- lib/admin/adminDashboard.presentation.ts
- lib/admin/adminOperations.repository.ts
- lib/admin/adminWorkspaceCards.ts
- lib/admin/settings/adminSettingsHub.ts
- lib/admin/stats/dashboardPresentation.ts
- lib/admin/stats/performancePolicy.ts
- lib/admin/stats/selectors.ts
- lib/auth/companyInvitationLoginRepository.ts
- lib/auth/loginRepository.ts
- lib/auth/routeGuard.ts
- lib/billing/companyAccessPresentation.ts
- lib/constants/app.ts
- lib/invitations/pendingApprovalDashboardPresentation.ts
- lib/me/personalSettings.ts
- lib/navigation/memberWorkspaceCards.ts
- lib/navigation/workspaceHomeRoutes.ts
- lib/system/systemAccessStabilityCheckpoint.ts
- lib/theme/semanticThemeTokens.ts
추가 파일 목록 :
- app/(workspace)/workspace/files/page.tsx
- app/(workspace)/workspace/history/page.tsx
- app/(workspace)/workspace/invites/page.tsx
- app/(workspace)/workspace/members/page.tsx
- app/(workspace)/workspace/settings/page.tsx
- app/(workspace)/workspace/stats/page.tsx
- app/(workspace)/workspace/subscription/page.tsx
- app/(workspace)/workspace/units/page.tsx
- app/(workspace)/workspace/workorders/page.tsx
삭제 파일 목록 :
- app/(admin)/admin/files/page.tsx
- app/(admin)/admin/history/page.tsx
- app/(admin)/admin/invites/page.tsx
- app/(admin)/admin/layout.tsx
- app/(admin)/admin/members/page.tsx
- app/(admin)/admin/page.tsx
- app/(admin)/admin/partners/page.tsx
- app/(admin)/admin/settings/page.tsx
- app/(admin)/admin/stats/page.tsx
- app/(admin)/admin/subscription/page.tsx
- app/(admin)/admin/units/page.tsx
