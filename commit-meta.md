Version : 0.9.101
Base Version : 0.9.100
Target Version : 0.9.101
Summary : 환경설정 read-only 복원
Description : 0.9.93에서 회귀 점검 화면으로 대체된 /admin/settings를 read-only 환경설정 화면으로 복원했습니다. getCurrentAdminCompany(), getCompanySettings(), listCompanyUserAccessProfiles()를 사용해 화면 설정, 파일 정책, 알림 정책, 사용자 접근 권한을 표시하며 저장 action, 권한 변경 modal, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/settings/page.tsx
- lib/admin/adminRegressionRoutes.ts
추가 파일 목록 :
- components/admin/settings/AdminSettingsReadOnlyPage.tsx
- docs/admin/admin_settings_readonly_restore.md
삭제 파일 목록 :
- 없음
