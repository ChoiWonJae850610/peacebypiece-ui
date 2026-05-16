Version : 0.13.24
Summary : 전역 현재 사용자 상태와 보호 route 기준 추가
Description : /api/auth/me 응답 구조를 현재 사용자 정보 기준으로 정리하고, CurrentUserProvider를 루트에 연결했습니다. admin, system, worker, workspace route에 세션 기반 1차 보호 layout을 추가해 로그인 상태와 권한별 진입 기준을 통일했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/layout.tsx
- app/api/auth/me/route.ts
- lib/auth/session.ts
- lib/auth/loginRepository.ts
추가 파일 목록 :
- app/admin/layout.tsx
- app/system/layout.tsx
- app/worker/layout.tsx
- app/workspace/layout.tsx
- components/auth/CurrentUserProvider.tsx
- lib/auth/currentUser.ts
- lib/auth/routeGuard.ts
삭제 파일 목록 :
- 없음
