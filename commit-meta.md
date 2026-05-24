Version : 0.16.6
Summary : 보호 라우트 정리 및 0.16.5 빌드 오류 보정
Description : /workspace, /system, /me 보호 라우트 기준을 정리하고 /me/settings 직접 접근 화면을 추가했습니다. 0.16.5 빌드 실패 원인이던 workspace 이름의 잘못된 import 경로를 실제 존재하는 admin 공통 모듈 경로로 되돌렸습니다. 화면, DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- app/(workspace)/workspace/history/page.tsx
- app/(workspace)/workspace/layout.tsx
- app/(workspace)/workspace/page.tsx
- app/(workspace)/workspace/partners/page.tsx
- app/(workspace)/workspace/subscription/page.tsx
- components/admin/dashboard/AdminOperationsDashboard.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
- lib/admin/adminOperations.repository.ts
- lib/admin/stats/selectors.ts
- lib/auth/routeGuard.ts
- lib/constants/app.ts
추가 파일 목록 :
- app/me/layout.tsx
- app/me/settings/page.tsx
삭제 파일 목록 :
없음
