Version : 0.9.113
Base Version : 0.9.112
Target Version : 0.9.113
Summary : 저장공간 사용량 화면 추가와 관리자 거래처 빌드 에러 수정
Description : /admin/partners prerender 중 AdminPartnersReadOnlyPage에서 useI18n을 호출해 I18nProvider 밖에서 렌더링되며 발생한 build error를 수정했습니다. 해당 화면에서 useI18n 의존성을 제거하고 buildPartnerListViewModel은 기본 type label fallback을 사용하도록 했습니다. 또한 /system/storage-usage route와 SystemStorageUsageReadOnlyPage를 추가해 기존 GET /api/system/storage-usage?companyId=... API 기반 저장공간 사용량을 read-only로 표시합니다. R2 실시간 inventory 조회, snapshot 생성 action, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/partnerMaster/AdminPartnersReadOnlyPage.tsx
- lib/system/systemConsoleShell.ts
- lib/system/systemRegressionRoutes.ts
추가 파일 목록 :
- app/system/storage-usage/page.tsx
- components/system/storageUsage/SystemStorageUsageReadOnlyPage.tsx
- docs/system/system_storage_usage_readonly_and_admin_partners_i18n_fix.md
삭제 파일 목록 :
- 없음
