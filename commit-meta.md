Version : 0.17.52
Summary : 현재 사용자 조회 실패의 개발 오버레이 오류 보정
Description : /api/auth/me에서 세션 overlay/profile/permission 조회 실패가 전체 화면 오류로 번지지 않도록 방어하고, 클라이언트 CurrentUserProvider의 refresh 실패가 Next 개발 오버레이 console error로 표시되지 않도록 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/auth/me/route.ts
- components/auth/CurrentUserProvider.tsx
- lib/auth/currentSession.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
