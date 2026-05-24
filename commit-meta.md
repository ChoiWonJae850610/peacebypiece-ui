Version : 0.16.40
Summary : 개발 전용 테스트 사용자 전환 콘솔 1차 구현
Description : 실제 Google 로그인 세션은 유지하고 개발 환경에서만 서명된 overlay 쿠키로 테스트 fixture 업무 컨텍스트를 전환하는 /dev/test-console과 API, session 적용 모듈을 추가했습니다. production 차단, env flag 차단, system_admin 제외, 테스트 fixture 대상 제한, 로그아웃 시 overlay 제거를 반영했습니다.
수정 파일 목록 :
- .env.example
- app/api/auth/logout/route.ts
- lib/auth/currentSession.ts
- lib/constants/app.ts
추가 파일 목록 :
- app/api/dev/test-context/options/route.ts
- app/api/dev/test-context/switch/route.ts
- app/api/dev/test-context/clear/route.ts
- app/dev/test-console/DevTestConsoleClient.tsx
- app/dev/test-console/page.tsx
- lib/dev/testContext/config.ts
- lib/dev/testContext/repository.ts
- lib/dev/testContext/service.ts
- lib/dev/testContext/session.ts
삭제 파일 목록 :
- 없음
