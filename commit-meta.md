Version : 0.16.41
Summary : Google 로그인 테스트 seed 단일 Gmail 허용 및 개발 테스트 콘솔 타입 오류 보정
Description : scenario_google_login_seed.sql을 실제 Gmail 1개만 필수로 요구하도록 수정하고, 선택 fixture 사용자는 dev test console 전환 대상으로 유지되도록 verify SQL을 보정했습니다. Dev test context overlay role 타입을 system_admin 제외 타입으로 분리해 build type error를 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/dev/testContext/session.ts
- lib/dev/testContext/repository.ts
- db/test/scenario_google_login_seed.sql
- db/test/verify_google_login_seed.sql
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
