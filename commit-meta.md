Version : 0.9.99
Base Version : 0.9.98
Target Version : 0.9.99
Summary : 관리자 히스토리 read-only 복원
Description : 0.9.93에서 회귀 점검 화면으로 대체된 /admin/history를 read-only 히스토리 화면으로 복원했습니다. 서버에서 listAdminHistoryEvents()로 이력을 조회하고 기존 AdminWorkOrderHistoryPage/List/Item 컴포넌트를 재사용해 검색, 날짜, 사용자, 카테고리 필터를 제공합니다. write action, audit log 신규 저장, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/history/page.tsx
- lib/admin/adminRegressionRoutes.ts
추가 파일 목록 :
- components/admin/history/AdminHistoryReadOnlyPage.tsx
- docs/admin/admin_history_readonly_restore.md
삭제 파일 목록 :
- 없음
