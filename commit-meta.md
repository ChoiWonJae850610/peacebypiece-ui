Version : 0.13.17
Summary : WAFL 공통 로그인 페이지와 Google 로그인 분기 추가
Description : /login 공통 로그인 페이지를 추가하고 Google OAuth 시작/콜백 흐름을 초대 가입 신청과 일반 로그인으로 분기했습니다. Google 로그인 성공 시 DB의 기존 사용자와 매칭해 고객사 관리자 또는 멤버 화면으로 이동할 수 있는 1차 세션 쿠키를 발급합니다.
수정 파일 목록 :
- .env.example
- app/api/auth/google/start/route.ts
- app/api/auth/google/callback/route.ts
- lib/auth/googleOAuth.ts
- lib/constants/app.ts
추가 파일 목록 :
- app/login/page.tsx
- components/auth/WaflLoginPage.tsx
- lib/auth/loginRepository.ts
- lib/auth/session.ts
삭제 파일 목록 :
- 없음
