Version : 0.9.111
Base Version : 0.9.110
Target Version : 0.9.111
Summary : 시스템 권한 관리 read-only 화면 추가
Description : /system/permissions route와 SystemPermissionsReadOnlyPage를 추가해 기존 GET /api/system/permissions API 기반 permission catalog와 role permission map을 read-only로 표시했습니다. 검색과 카테고리 필터는 client state로만 처리하며 권한 부여, role 변경, permission 저장 action, permission repository/API, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- lib/system/systemRegressionRoutes.ts
추가 파일 목록 :
- app/system/permissions/page.tsx
- components/system/permissions/SystemPermissionsReadOnlyPage.tsx
- docs/system/system_permissions_readonly.md
삭제 파일 목록 :
- 없음
