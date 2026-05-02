Version : 0.9.94
Base Version : 0.9.93
Target Version : 0.9.94
Summary : 시스템관리자 화면 route 회귀 안정화
Description : GitHub raw 기준 깨진 JSX로 조회되는 /system 하위 route와 관련 shell/skeleton 컴포넌트를 안전한 회귀 점검 화면으로 대체해 build/runtime 차단 위험을 낮췄습니다. 기존 API, DB repository, 초대/요금제/통계 흐름은 수정하지 않았고, 기능성 하위 컴포넌트 본 복원은 후속 버전으로 분리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/system/page.tsx
- app/system/invites/page.tsx
- app/system/billing/page.tsx
- app/system/category-rules/page.tsx
- components/system/SystemConsoleShell.tsx
- components/system/invitations/SystemCustomerInviteSkeleton.tsx
- components/system/billing/SystemCompanyPlanSkeleton.tsx
- lib/system/systemConsoleShell.ts
추가 파일 목록 :
- components/system/regression/SystemRegressionRoutePage.tsx
- lib/system/systemRegressionRoutes.ts
- docs/system/system_regression_check.md
삭제 파일 목록 :
- 없음
