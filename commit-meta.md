Version : 0.9.93
Base Version : 0.9.92
Target Version : 0.9.93
Summary : 관리자 화면 route 회귀 안정화
Description : GitHub raw 기준 깨진 JSX로 조회되는 /admin 하위 route를 안전한 회귀 점검 화면으로 대체해 build/runtime 차단 위험을 낮췄습니다. 기존 API, DB repository, 첨부/저장/삭제 흐름은 수정하지 않았고, 기능성 하위 컴포넌트 본 복원은 후속 버전으로 분리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/page.tsx
- app/admin/partners/page.tsx
- app/admin/files/page.tsx
- app/admin/history/page.tsx
- app/admin/settings/page.tsx
- app/admin/invites/page.tsx
추가 파일 목록 :
- components/admin/regression/AdminRegressionRoutePage.tsx
- lib/admin/adminRegressionRoutes.ts
- docs/admin/admin_regression_check.md
삭제 파일 목록 :
- 없음
