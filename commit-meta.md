Version : 0.13.18
Summary : 루트 경로를 WAFL 로그인 진입점으로 변경
Description : 앱 루트 경로(/)를 WAFL 공통 로그인 화면으로 전환하고, /login과 동일한 오류 파라미터 처리 유틸을 공유하도록 정리했습니다. 기존 Google 로그인/초대 가입 신청 흐름과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- app/page.tsx
- app/login/page.tsx
- lib/constants/app.ts
추가 파일 목록 :
- lib/auth/loginPageParams.ts
삭제 파일 목록 :
- 없음
