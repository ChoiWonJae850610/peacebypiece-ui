Version : 0.9.110
Base Version : 0.9.109
Target Version : 0.9.110
Summary : 시스템 고객사 관리 read-only 화면 추가
Description : /system/companies route와 SystemCompaniesReadOnlyPage를 추가해 기존 GET /api/system/companies?includeInactive=true API 기반 고객사 목록, 활성/비활성 상태, 멤버 수, 저장공간 사용량을 read-only로 표시했습니다. 검색과 상태 필터는 client state로만 처리하며 고객사 생성/수정/삭제 action, company repository/API, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- lib/system/systemRegressionRoutes.ts
추가 파일 목록 :
- app/system/companies/page.tsx
- components/system/companies/SystemCompaniesReadOnlyPage.tsx
- docs/system/system_companies_readonly.md
삭제 파일 목록 :
- 없음
