Version : 0.13.25
Summary : admin 하위 화면 세션 동기화와 뒤로가기 안정화
Description : /admin 하위 화면 이동과 뒤로가기 시 current user와 개인 설정 상태가 끊기지 않도록 현재 사용자 provider의 재동기화 기준을 보강하고, AdminShell의 중첩 i18n provider를 제거했습니다. /api/auth/me와 보호 route layout은 동적 처리 기준을 명시하고, AdminTopbar는 세션의 고객사명을 우선 사용하도록 정리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/auth/CurrentUserProvider.tsx
- components/admin/layout/AdminShell.tsx
- components/admin/layout/AdminTopbar.tsx
- app/api/auth/me/route.ts
- app/admin/layout.tsx
- app/system/layout.tsx
- app/worker/layout.tsx
- app/workspace/layout.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
