Version :
0.13.49

Summary :
시스템관리자 개발용 진입 복구

Description :
개발 환경에서 시스템관리자 세션 없이 /system에 직접 진입할 수 있도록 개발용 system-admin context를 추가했다. 시스템관리자 전용 API도 동일한 개발용 scope를 사용하도록 보강하고, 시스템 콘솔에는 개발용 진입 상태 배지를 표시하도록 정리했다. 운영 환경에서는 기존 시스템관리자 세션 보호를 유지한다.

수정 파일 목록 :
- components/system/SystemConsoleShell.tsx
- lib/auth/routeGuard.ts
- lib/system/sessionScope.ts
- lib/i18n/ko/system.ts
- lib/i18n/en/system.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/system/devSystemAdmin.ts

삭제 파일 목록 :
없음
