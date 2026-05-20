Version :
0.15.233

Summary :
시스템관리자 화면 로그아웃 버튼 추가

Description :
시스템관리자 공통 shell 상단에 로그아웃 버튼을 추가해 시스템관리자 테스트 중 세션을 바로 종료할 수 있도록 했다. 로그아웃 문구는 system i18n 리소스로 분리했고 기존 /api/auth/logout 흐름을 그대로 사용한다.

수정 파일 목록 :
- components/system/layout/SystemShell.tsx
- lib/i18n/ko/system.ts
- lib/i18n/en/system.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
