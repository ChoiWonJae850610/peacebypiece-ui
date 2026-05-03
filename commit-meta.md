Version : 0.9.117
Base Version : 0.9.116
Target Version : 0.9.117
Summary : 관리자 히스토리 i18n hook 의존성 제거
Description : /admin/history 하위 컴포넌트인 AdminWorkOrderHistoryPage와 AdminWorkOrderHistoryItem에서 useI18n hook 의존성을 제거했습니다. AdminWorkOrderHistoryPage는 getI18n().admin 기본 리소스를 사용하고, AdminWorkOrderHistoryItem은 buildAdminHistoryItemViewModel()의 기본 i18n fallback을 사용하도록 변경했습니다. history repository/API, audit log write, DB schema, package.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/history/AdminWorkOrderHistoryPage.tsx
- components/admin/history/AdminWorkOrderHistoryItem.tsx
추가 파일 목록 :
- docs/admin/admin_history_i18n_hook_fix.md
삭제 파일 목록 :
- 없음
